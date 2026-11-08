/**
 * BUZÓN DEL RANKING · Action Leaders+
 * Va pegado en la hoja de Google "Buzón del ranking" (Extensiones › Apps Script) de la cuenta que recibe
 * los correos de inCruises. Cada 10 minutos:
 *  1) Lee los correos nuevos de inCruises (socios/miembros nuevos, pagos y pagos fallidos) y los anota en "Correos".
 *  2) Copia el reporte de registros gratis más reciente de Drive (DD-MM-AA.csv) a "Registros".
 *  3) Hace lo que GitHub dejó en "Salida": agrega calificados a la hoja Calificados y le avisa por correo.
 * GitHub (tools/buzon/buzon.py) lee "Correos" y "Registros", actualiza la app y marca cada fila.
 * Este archivo NO tiene contraseñas. Los datos de la hoja son privados: compártala solo con la cuenta de servicio.
 */
var CARPETA_REG = '1QubWm4w4K8tNsPUxfRgjo3NueoFKvtrP';           // Drive: reportes de registros gratis
var HOJA_CALIF = '1-0ct30l0fcn8rtzgfOcrkLTGmgRHOa2xEmm2X0izvG4';  // Agenda Action Leaders Plus › Calificados
var HOJA_TESTI = '1nR6KPRZOUab2FSp9WcZ4FTbCgjE7aNmK8ST8UfQ73T4';  // Respuestas de testimonios
var DIAS = 3;                                                      // revisa correos de los últimos N días

function instalar() {                     // 1 sola vez: crea pestañas y el reloj de cada 10 minutos
  var ss = SpreadsheetApp.getActive();
  pest_(ss, 'Correos', ['id', 'recibido', 'tipo', 'asunto', 'datos', 'estado', 'nota']);
  pest_(ss, 'Registros', ['sponsor_id', 'sponsor_name', 'account_created']);
  pest_(ss, 'Salida', ['t', 'tipo', 'texto', 'hecho']);
  pest_(ss, 'Estado', ['clave', 'valor']);
  ScriptApp.getProjectTriggers().forEach(function (t) { ScriptApp.deleteTrigger(t); });
  ScriptApp.newTrigger('revisar').timeBased().everyMinutes(10).create();
  revisar();
  SpreadsheetApp.getUi && Logger.log('Listo: el buzón revisa cada 10 minutos.');
}

function pest_(ss, n, enc) {
  var h = ss.getSheetByName(n) || ss.insertSheet(n);
  if (h.getLastRow() === 0) h.appendRow(enc);
  h.setFrozenRows(1);
  return h;
}

function revisar() {
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(5000)) return;
  try {
    var ss = SpreadsheetApp.getActive();
    correos_(ss);
    try { registros_(ss); } catch (e) { estado_(ss, 'error_registros', String(e)); }
    try { salida_(ss); } catch (e) { estado_(ss, 'error_salida', String(e)); }
    try { testimonios_(ss); } catch (e) { estado_(ss, 'error_testi', String(e)); }
    estado_(ss, 'ultima_revision', new Date().toISOString());
  } finally { lock.releaseLock(); }
}

// ---------- 1) correos ----------
function correos_(ss) {
  var h = ss.getSheetByName('Correos'), n = h.getLastRow();
  var ya = {};
  if (n > 1) h.getRange(2, 1, n - 1, 1).getValues().forEach(function (r) { ya[String(r[0])] = 1; });
  var q = 'from:no-reply@incruises.com newer_than:' + DIAS + 'd in:anywhere ' +
          'subject:("nuevo Socio" OR "nuevo Miembro" OR "Equipo Pagado" OR "referiste" OR "no se realizó" OR "unsuccessful")';
  var hilos = GmailApp.search(q, 0, 100), filas = [], lim = Date.now() - DIAS * 864e5;
  hilos.forEach(function (th) {
    th.getMessages().forEach(function (m) {
      var id = m.getId();
      if (ya[id] || m.getDate().getTime() < lim) return;
      var r = leer_(m);
      if (!r) return;
      ya[id] = 1;
      filas.push([id, m.getDate().toISOString().replace(/\.\d+Z$/, 'Z'), r.tipo, m.getSubject(), JSON.stringify(r.d), '', '']);
    });
  });
  filas.sort(function (a, b) { return a[1] < b[1] ? -1 : 1; });
  if (filas.length) h.getRange(h.getLastRow() + 1, 1, filas.length, 7).setValues(filas);
}

function texto_(html) {
  return String(html || '').replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&#39;|&#039;|&apos;/g, "'").replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#(\d+);/g, function (_, c) { return String.fromCharCode(+c); })
    .replace(/\s+/g, ' ').trim();
}
function correoDe_(s) { var m = String(s || '').match(/[^\s<>,;"]+@[^\s<>,;"]+/); return m ? m[0].toLowerCase() : ''; }

function leer_(m) {
  var s = m.getSubject() || '', html = m.getBody() || '', t = texto_(html);
  if (/nuevo (Socio|Miembro)/i.test(s)) {                       // ---- activación
    var cajas = [], re = /<div class="info"[^>]*>([\s\S]*?)<\/div>/g, x;
    while ((x = re.exec(html))) {
      var v = [], r2 = /<strong[^>]*>([\s\S]*?)<\/strong>/g, y;
      while ((y = r2.exec(x[1]))) v.push(texto_(y[1]));
      cajas.push(v);
    }
    var c1 = cajas[0] || [], c2 = cajas[1] || [], como = (t.match(/se acaba de inscribir como (\w+)/) || [])[1] || '';
    var tl = c1[2] || '', pk = tl.match(/(?:Partner\/)?(\w+)\s+Member/i);
    return { tipo: 'act', d: { socio: c1[0] || '', pais: c1[1] || '', linea: tl, paquete: pk ? cap_(pk[1]) : '', soloPartner: !pk && /partner/i.test(tl),
      email: (c1[3] || '').toLowerCase(), tel: c1[4] || '', patrocinador: c2[0] || '', como: como, cajas: cajas.length } };
  }
  if (/Equipo Pagado/i.test(s)) {                                 // ---- pago (solo nombre)
    return { tipo: 'pago', d: { nombre: ((t.match(/miembro de tu equipo, (.+?), acaba de pagar/i) || [])[1] || '').trim() } };
  }
  if (/referiste/i.test(s)) {                                     // ---- pago (con correo)
    return { tipo: 'pago', d: { nombre: ((t.match(/pago exitoso de por (.+?)\.\s*Member/i) || [])[1] || '').trim(),
      email: correoDe_((t.match(/Member'?s Email:\s*(\S+)/i) || [])[1]) } };
  }
  if (/no se realiz|unsuccessful/i.test(s)) {                     // ---- pago fallido
    var cc = String(m.getCc() || '').split(',').map(correoDe_).filter(function (e) { return e && e !== Session.getEffectiveUser().getEmail().toLowerCase(); });
    var plan = (t.match(/Membres[ií]a\s+(\w+)\s+no se/i) || t.match(/inCruises®?\s+(\w+)\s+Membership/i) || [])[1] || '';
    return { tipo: 'falla', d: { email: correoDe_(m.getTo()), nombre: ((t.match(/(?:Hola|Dear)\s+([^,]+),/) || [])[1] || '').trim(),
      plan: cap_(plan), cc: cc } };
  }
  return null;
}
function cap_(w) { w = String(w || ''); return w ? w.charAt(0).toUpperCase() + w.slice(1).toLowerCase() : ''; }

// ---------- 2) registros gratis (Drive) ----------
function registros_(ss) {
  var it = DriveApp.getFolderById(CARPETA_REG).getFiles(), mejor = null, mk = '';
  while (it.hasNext()) {
    var f = it.next(), m = f.getName().match(/^(\d\d)-(\d\d)-(\d\d)\.csv$/i);
    if (!m) continue;
    var k = m[3] + m[2] + m[1];
    if (k > mk) { mk = k; mejor = f; }
  }
  if (!mejor) return;
  var firma = mejor.getId() + '|' + mejor.getLastUpdated().getTime();
  if (leerEstado_(ss, 'registros_archivo') === firma) return;
  var rows = Utilities.parseCsv(mejor.getBlob().getDataAsString('UTF-8'));
  var enc = rows.shift().map(function (x) { return String(x).trim().toLowerCase(); });
  var iS = enc.indexOf('sponsor_id'), iN = enc.indexOf('sponsor_name'), iF = enc.indexOf('account_created');
  if (iS < 0 || iN < 0 || iF < 0) throw new Error('El CSV no trae sponsor_id / sponsor_name / account_created');
  var out = rows.filter(function (r) { return r[iS]; }).map(function (r) {
    return [String(r[iS]), String(r[iN]), String(r[iF]).replace(/\.\d+/, '').replace(' ', 'T').replace(/Z?$/, 'Z')];
  });
  var h = ss.getSheetByName('Registros');
  if (h.getLastRow() > 1) h.getRange(2, 1, h.getLastRow() - 1, 3).clearContent();
  if (out.length) h.getRange(2, 1, out.length, 3).setNumberFormat('@').setValues(out);
  estado_(ss, 'registros_archivo', firma);
  estado_(ss, 'registros_nombre', mejor.getName() + ' · ' + out.length + ' filas');
}

// ---------- 3) lo que pide GitHub ----------
function salida_(ss) {
  var h = ss.getSheetByName('Salida'), n = h.getLastRow();
  if (n < 2) return;
  var v = h.getRange(2, 1, n - 1, 4).getValues(), avisos = [];
  for (var i = 0; i < v.length; i++) {
    if (v[i][3]) continue;
    var tipo = v[i][1], tx = String(v[i][2]);
    if (tipo === 'calificado') {                                  // texto = "Nombre|Nombre en el ranking"
      var p = tx.split('|');
      agregarCalificado_(p[0], p[1] || p[0]);
      avisos.push('⭐ Nuevo en el Sistema de liderazgo (agregado a Calificados): ' + p[0]);
    } else avisos.push(tx);
    h.getRange(i + 2, 4).setValue(new Date().toISOString());
  }
  if (avisos.length) MailApp.sendEmail(Session.getEffectiveUser().getEmail(), '📊 App Action Leaders+: revisar', avisos.join('\n\n') +
    '\n\n— Buzón del ranking (automático)');
}

function agregarCalificado_(nombre, rk) {
  var h = SpreadsheetApp.openById(HOJA_CALIF).getSheetByName('Calificados');
  var v = h.getRange(5, 1, Math.max(1, h.getLastRow() - 4), 2).getValues(), fila = 5, num = 0;
  for (var i = 0; i < v.length; i++) {
    if (String(v[i][1]).trim().toLowerCase() === String(nombre).trim().toLowerCase()) return;  // ya está
    if (v[i][1] !== '' || v[i][0] !== '') { fila = 5 + i + 1; if (+v[i][0]) num = Math.max(num, +v[i][0]); }
  }
  h.getRange(fila, 1, 1, 10).setValues([[num + 1, nombre, '', '', '', '', '', '500', '', rk]]);
}

// ---------- testimonios: solo avisa que hay nuevos ----------
function testimonios_(ss) {
  var h = SpreadsheetApp.openById(HOJA_TESTI).getSheets()[0], n = h.getLastRow(), ant = +leerEstado_(ss, 'testimonios_filas') || 0;
  if (!ant) { estado_(ss, 'testimonios_filas', n); return; }
  if (n > ant) {
    MailApp.sendEmail(Session.getEffectiveUser().getEmail(), '🗣️ Testimonios nuevos para la app',
      'Hay ' + (n - ant) + ' testimonio(s) nuevo(s) en el formulario. Dígale a Claude: "hay testimonios nuevos" para revisarlos y subirlos a la app.');
    estado_(ss, 'testimonios_filas', n);
  }
}

// ---------- utilidades ----------
function leerEstado_(ss, k) {
  var h = ss.getSheetByName('Estado'), n = h.getLastRow();
  if (n < 2) return '';
  var v = h.getRange(2, 1, n - 1, 2).getValues();
  for (var i = 0; i < v.length; i++) if (v[i][0] === k) return String(v[i][1]);
  return '';
}
function estado_(ss, k, val) {
  var h = ss.getSheetByName('Estado'), n = h.getLastRow();
  if (n > 1) {
    var v = h.getRange(2, 1, n - 1, 1).getValues();
    for (var i = 0; i < v.length; i++) if (v[i][0] === k) { h.getRange(i + 2, 2).setValue(val); return; }
  }
  h.appendRow([k, val]);
}

// Prueba: lee los correos de los últimos 3 días SIN escribir en la hoja (Ver › Registros de ejecución)
function probar() {
  var hilos = GmailApp.search('from:no-reply@incruises.com newer_than:3d in:anywhere', 0, 30);
  hilos.forEach(function (th) { th.getMessages().forEach(function (m) { var r = leer_(m); if (r) Logger.log(r.tipo + ' · ' + m.getDate().toISOString() + ' · ' + JSON.stringify(r.d).slice(0, 160)); }); });
}
