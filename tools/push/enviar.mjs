// Avisos (notificaciones push) de Action Leaders+.
// Corre en GitHub Actions con el secreto FIREBASE_SA (clave de la cuenta de servicio; NUNCA en el repo).
//   node enviar.mjs racha            → 7:00 p.m. HN: a quien no ha completado su rutina hoy
//   node enviar.mjs racha2           → 9:30 p.m. HN: solo racha de 3+ días que está por perderse
//   node enviar.mjs inact            → 8:30 a.m. HN: miembros con ahorro pendiente que se inactivan en ≤7 días (patrocinador + líderes TL+ arriba)
//   node enviar.mjs inc1|inc2         → incentivo (config.incentivo): 9:00 a.m. y 7:05 p.m. HN
//   node enviar.mjs act VIEJO NUEVO  → socios nuevos (compara dos versiones de data/team.json)
// DRY=1 → no manda nada, solo imprime. Nunca incluye teléfonos, notas ni dinero.
import fs from "node:fs";

const APP = "https://actionleadersplus.com/";
const ICON = APP + "icon-192.png";

// ---------- utilidades puras (se prueban sin Firebase) ----------
export const hoyHN = (ms = Date.now()) => new Date(ms - 6 * 3600e3).toISOString().slice(0, 10);
export const ayerHN = (ms = Date.now()) => hoyHN(ms - 864e5);
export const nrm = t => String(t || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/\s+/g, " ").trim();
const lev = (a, b) => { const d = Array.from({ length: a.length + 1 }, (_, i) => [i]); for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); return d[a.length][b.length]; };
const wsim = (x, y) => x === y || (Math.min(x.length, y.length) >= 4 && lev(x, y) <= 1);
const words = t => nrm(t).split(" ").filter(w => w.length > 1 && !["de", "del", "la", "los", "y"].includes(w));
// Mismo nombre: todas las palabras del nombre corto (mín. 2) están en el largo.
export const mismoNombre = (a, b) => { const A = words(a), B = words(b); if (A.length < 2 || B.length < 2) return false;
  const [S, L] = A.length <= B.length ? [A, B] : [B, A]; return S.every(w => L.some(v => wsim(w, v))); };
const pick = (arr, seed) => { let h = 2166136261; for (const ch of String(seed)) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return arr[(h >>> 0) % arr.length]; };
const primer = n => { const w = String(n || "").trim().split(/\s+/)[0] || ""; return w ? w[0].toUpperCase() + w.slice(1).toLowerCase() : ""; };

// Estado de la rutina de hoy a partir de constancia/{uid}.
export function estadoRutina(c, hoy, ayer) {
  c = c || {}; const pts = c.fecha === hoy ? Math.round((+c.hoy || 0) / 20) : 0;
  const valida = c.fecha === hoy || (c.fecha === ayer && (+c.hoy || 0) >= 100);
  return { pts: Math.min(5, pts), racha: valida ? (+c.racha || 0) : 0 };
}

// "manana": 8:00 a.m. HN, solo a quien aún no empieza su rutina de hoy.
export function msgManana(uid, c, hoy, ayer) {
  const { pts, racha } = estadoRutina(c, hoy, ayer); if (pts > 0) return null;
  const n = primer(c && c.nombre), seed = uid + hoy + "m";
  const m = racha >= 1 ? pick([
    { title: `☀️ Buenos días${n ? ", " + n : ""}`, body: `Hoy va por el día ${racha + 1} de su racha 🔥 Empiece con la historia del día: toma 1 minuto.` },
    { title: `🔥 Día ${racha + 1} de su racha`, body: `${n ? n + ", a" : "A"}rranque temprano: un punto de su rutina ahora y el resto sale solo.` }], seed)
    : pick([
    { title: `☀️ Buenos días${n ? ", " + n : ""}`, body: "Hoy es buen día para empezar su racha 🔥 Comparta la historia del día y lleva 1 de 5." },
    { title: "🛡️ Su rutina de hoy ya está lista", body: `${n ? n + ", e" : "E"}mpiece temprano: 5 puntos sencillos y su día queda completo.` },
    { title: "💪 Un día nuevo, una racha nueva", body: "Abra su rutina y haga el primer punto antes del mediodía." }], seed);
  return m;
}
// "fin": unos minutos antes de medianoche, a todos los que tienen avisos de racha.
export function msgFin(uid, c, hoy, ayer, ms = Date.now()) {
  const { pts, racha } = estadoRutina(c, hoy, ayer), n = primer(c && c.nombre);
  const d = new Date(ms - 6 * 3600e3), min = Math.max(1, 60 * 24 - (d.getUTCHours() * 60 + d.getUTCMinutes()));
  if (pts >= 5) return { title: `🎉 ¡Día completo${n ? ", " + n : ""}!`, body: `Su rutina de hoy quedó hecha. Mañana va por ${racha + 1} ${racha + 1 === 1 ? "día" : "días"} seguidos 🔥` };
  return { title: `⏰ Quedan ${min} minutos del día`, body: `${n ? n + ", l" : "L"}${pts ? `e ${5 - pts === 1 ? "falta 1 punto" : `faltan ${5 - pts} puntos`}` : "a rutina de hoy todavía está a tiempo"}${racha >= 1 ? ` para mantener su racha de ${racha} ${racha === 1 ? "día" : "días"}` : ""}. ¡Todavía alcanza! 🔥` };
}
export function msgRacha(...a) { const m = msgRacha0(...a); if (m) { m.title = m.title[0].toUpperCase() + m.title.slice(1); m.body = m.body[0].toUpperCase() + m.body.slice(1); } return m; }
function msgRacha0(modo, uid, c, hoy, ayer) {
  const { pts, racha } = estadoRutina(c, hoy, ayer); if (pts >= 5) return null;
  const n = primer(c && c.nombre), hola = n ? n + ", " : "", falta = 5 - pts, seed = uid + hoy + modo;
  if (modo === "racha2") {
    if (racha < 3) return null;
    return pick([
      { title: `🔥 ${n ? n + ", su" : "Su"} racha de ${racha} días está en juego`, body: `Le ${falta === 1 ? "falta 1 punto" : `faltan ${falta} puntos`} antes de medianoche. ¡Usted puede!` },
      { title: `⏰ Última llamada: ${racha} días seguidos`, body: `${hola}complete ${falta === 1 ? "su último punto" : `sus ${falta} puntos`} de hoy y no pierda su racha.` },
      { title: `🔥 No deje que se apague su racha`, body: `${racha} días de constancia. ${falta === 1 ? "Solo 1 punto más" : `${falta} puntos más`} y la mantiene viva.` }], seed);
  }
  if (pts === 0) {
    if (racha >= 1) return pick([
      { title: `🔥 ${n ? n + ", mantenga" : "Mantenga"} su racha de ${racha} ${racha === 1 ? "día" : "días"}`, body: "Su rutina de hoy le espera. Empiece por la historia del día: toma 1 minuto." },
      { title: `🔥 Vamos por el día ${racha + 1}`, body: `${hola}todavía está a tiempo de completar su rutina de hoy.` }], seed);
    return pick([
      { title: `🔥 ${n ? n + ", su" : "Su"} rutina de hoy le espera`, body: "Empiece por la historia del día: toma 1 minuto y arranca su racha." },
      { title: "💪 Hoy puede empezar su racha", body: `${hola}complete los 5 puntos de su rutina antes de medianoche.` },
      { title: "🛡️ Un paso a la vez", body: `${hola}abra su rutina y haga el primer punto. El resto sale solo.` }], seed);
  }
  return pick([
    { title: `💪 Va ${pts} de 5`, body: `${hola}le ${falta === 1 ? "falta 1" : `faltan ${falta}`} para completar su día${racha ? ` y llegar a ${racha + 1} días seguidos` : ""}.` },
    { title: `🔥 ¡Ya casi! ${pts}/5`, body: `${hola}${falta === 1 ? "un punto más" : `${falta} puntos más`} y su rutina de hoy queda completa.` }], seed);
}

// Socios nuevos: activaciones que están en NUEVO y no en VIEJO (máx. 48 h de antigüedad).
export function actNuevas(viejo, nuevo, ahora = Date.now()) {
  const ya = new Set((viejo.activaciones || []).map(a => a.id || nrm(a.socio)));
  return (nuevo.activaciones || []).filter(a => !ya.has(a.id || nrm(a.socio)) && ahora - Date.parse(a.fecha || 0) < 48 * 3600e3);
}
export function destinosAct(a, users) {
  const sp = users.filter(u => u.registro && mismoNombre(u.registro.nombre, a.patrocinador));
  if (sp.length !== 1) return { sp: null, arriba: [] };
  const s = sp[0], linea = Array.isArray(s.registro.linea) ? s.registro.linea : [];
  return { sp: s.uid, arriba: linea.filter(u => u && u !== s.uid) };
}
export function msgAct(a, paraSponsor) {
  const n = String(a.socio || "").trim().split(/\s+/).slice(0, 2).map(w => w[0].toUpperCase() + w.slice(1).toLowerCase()).join(" ");
  const p = primer(a.patrocinador);
  return paraSponsor
    ? { title: "🎉 ¡Felicidades! Tiene un socio nuevo", body: `${n} se unió a su equipo${a.paquete ? " (" + a.paquete + ")" : ""}. Dele la bienvenida.` }
    : { title: "🎉 ¡Nuevo socio en su equipo!", body: `${n} se unió con ${p}. Felicite a ${p} por su activación.` };
}

// Sistema de liderazgo: quien cruza 200 o 500 pts en este ciclo (mismo mes).
// Nuevo en liderazgo (auto = mes) → bienvenida; ya era miembro → felicitación "sigue el próximo mes".
const lzNivel = v => (v >= 500 ? 2 : v >= 200 ? 1 : 0);
export function lzCambios(viejo, nuevo) {
  const cv = (viejo.config || {}).lcMesClave, cn = (nuevo.config || {}).lcMesClave;
  if (!cn || cv !== cn) return [];
  const V = {}; (viejo.ranking || []).forEach(r => { V[nrm(r.nombre)] = +r.volumen || 0; });
  const ns = l => [l.nombre].concat(String(l.nombreRanking || "").split("|")).filter(Boolean);
  const enL = (L, n) => (L || []).find(l => ns(l).some(x => mismoNombre(x, n) || nrm(x) === nrm(n)));
  const out = [];
  for (const r of nuevo.ranking || []) {
    const a = lzNivel(V[nrm(r.nombre)] || 0), b = lzNivel(+r.volumen || 0);
    if (b <= a) continue;
    const ln = enL(nuevo.liderazgo, r.nombre); if (!ln) continue;
    const nuevoSis = ln.auto === cn && !enL(viejo.liderazgo, r.nombre);
    out.push({ nombre: r.nombre, nivel: b, nuevo: nuevoSis, v: +r.volumen || 0 });
  }
  return out;
}
export function msgLz(c) {
  const n = primer(c.nombre), esp = c.nivel === 2;
  if (c.nuevo) return { title: `🎉 ¡Bienvenido/a al Sistema de liderazgo, ${n}!`, body: `Calificó como ${esp ? "Líder Espartano" : "Líder"}. Abra la app para ver sus beneficios: reunión de los domingos, turnos y flyer del día.` };
  return esp
    ? { title: `⚔️ ¡Felicidades, ${n}!`, body: "Ya es Líder Espartano este mes y sigue en el Sistema de liderazgo el próximo mes. ¡Siga así! 💪" }
    : { title: `🏅 ¡Felicidades, ${n}!`, body: "Ya calificó para seguir en el Sistema de liderazgo el próximo mes. Su constancia sostiene al equipo. ¡Siga así! 💪" };
}

// ---------- agenda del equipo ----------
// Entrenamientos y llamadas: 30 min antes. Presentaciones: 1 h antes (solo la primera del día). Liderazgo: solo miembros del sistema.
export function agendaPendientes(cal, ms = Date.now()) {
  const hn = new Date(ms - 6 * 3600e3), hoy = hn.toISOString().slice(0, 10), ahora = hn.getUTCHours() * 60 + hn.getUTCMinutes();
  const H = (cal || []).filter(e => e.fecha === hoy && /^\d\d:\d\d$/.test(e.hora || "")).map(e => ({ ...e, min: +e.hora.slice(0, 2) * 60 + +e.hora.slice(3) }));
  const tipoDe = e => /liderazgo/i.test(e.titulo || "") || /líderes/i.test(e.tipo || "") ? "lid" : /presentaci/i.test(e.tipo || "") ? "pres" : /capacitaci|llamada/i.test(e.tipo || "") ? "ent" : null;
  const primPres = H.filter(e => tipoDe(e) === "pres").sort((a, b) => a.min - b.min)[0];
  const out = [];
  for (const e of H) { const t = tipoDe(e); if (!t) continue; if (t === "pres" && e !== primPres) continue; const falta = e.min - ahora;
    // 10 nov (Edwin): el Action Leaders Training se avisa 3 veces: en la mañana, 1 hora antes y 10 minutos antes (edificando a los ponentes)
    if (t === "ent" && /action leaders? training/i.test(e.titulo || "")) {
      const st = ahora >= 540 && ahora < 600 && falta > 90 ? "m" : falta >= 45 && falta <= 75 ? "1h" : falta >= 5 && falta <= 25 ? "10" : null;
      if (st) out.push({ ...e, eid: e.id, id: e.id + ":" + st, st, k: t, falta });
      continue; }
    const ant = t === "pres" ? 60 : 30; if (falta >= 5 && falta <= ant + 10) out.push({ ...e, k: t, falta }); }
  return out;
}
const h12 = h => { let [a, b] = h.split(":").map(Number); const p = a >= 12 ? "p.m." : "a.m."; a = a % 12 || 12; return `${a}:${String(b).padStart(2, "0")} ${p}`; };
const n2 = n => String(n || "").trim().split(/\s+/).slice(0, 2).join(" ");
export function msgAgenda(e, tur) {
  if (e.st) { const s = ((tur || {}).s || {})[e.eid] || {}, P = ["p", "e", "p3", "p4"].map(k => s[k] && s[k].n).filter(Boolean).map(n2);
    const con = P.length ? (P.length === 1 ? P[0] : P.slice(0, -1).join(", ") + " y " + P[P.length - 1]) : "";
    const tema = s.tema || (new Date(e.fecha + "T12:00:00Z").getUTCDay() === 0 ? "Llamada de poder" : "");
    if (e.st === "m") return { title: `📣 Hoy ${h12(e.hora)}: ${e.titulo}`, body: (con ? `Nos edifica${P.length > 1 ? "n" : ""} ${con}. ` : "") + (tema ? `Tema: ${tema}. ` : "") + "¡Invite a su equipo y no se lo pierda!" };
    if (e.st === "1h") return { title: `⏰ En 1 hora: ${e.titulo}`, body: (con ? `Con ${con}. ` : "") + "Prepárese y avísele a su equipo." };
    return { title: `🔴 En ${Math.max(5, Math.round(e.falta / 5) * 5)} min: ${e.titulo}`, body: (con ? `Con ${con}. ` : "") + "Toque para ver cómo entrar." }; }
  if (e.k === "pres") return { title: `🎤 Hoy a las ${h12(e.hora)}: ${e.titulo}`, body: "¿Ya invitó a alguien? Todavía está a tiempo: un mensaje hoy puede ser un socio mañana." };
  const mi = e.falta ? Math.max(5, Math.round(e.falta / 5) * 5) : 30;
  if (e.k === "lid") return { title: `🛡️ En ${mi} min: ${e.titulo}`, body: `Empieza a las ${h12(e.hora)} · toque para ver el Zoom en la Agenda.` };
  return { title: `📚 En ${mi} min: ${e.titulo}`, body: `Empieza a las ${h12(e.hora)} · toque para ver cómo entrar.` };
}

// ---------- envío ----------

// Incentivo (config.incentivo en team.json): "inc1" 9:00 a.m. y "inc2" 7:05 p.m. HN mientras esté vigente.
export function msgInc(modo, cfg, ms = Date.now()) {
  if (!cfg || !cfg.hasta) return null; const fin = Date.parse(cfg.hasta), ini = cfg.desde ? Date.parse(cfg.desde) : 0;
  if (ms >= fin || ms < ini) return null;
  const finHN = hoyHN(fin - 1), hoy = hoyHN(ms), dias = Math.round((Date.parse(finHN) - Date.parse(hoy)) / 864e5);
  if (dias <= 0) return modo === "inc1" ? { title: "🔥 ¡Último día del incentivo!", body: "Hoy cierra a las 6:00 p.m. Cierre un Classic o un Premium y gánese el incentivo. ¡Usted puede!" } : null;
  const q = dias === 1 ? "mañana domingo" : `en ${dias} días`;
  return modo === "inc1"
    ? { title: "🔥 Hoy es buen día para cerrar", body: `Cierre un Classic o un Premium antes del domingo a las 6:00 p.m. y gánese el incentivo.` }
    : { title: `⏳ El incentivo cierra ${q}`, body: "¿A quién le presenta hoy? Un Classic o un Premium y el incentivo es suyo." };
}


// ---------- Miembros por inactivarse (ahorro pendiente con fecha de inactivación) ----------
// data/ahorro.enc (cifrado) → filas {n, s (patrocinador), x (inactivación ISO), k:[ek,wk,..]}. La clave se lee de Firestore.
const DIAS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
export const cuandoHN = (x, ms = Date.now()) => { const h = hoyHN(ms), d = hoyHN(Date.parse(x)), n = Math.round((Date.parse(d) - Date.parse(h)) / 864e5);
  return n <= 0 ? "HOY" : n === 1 ? "mañana" : "el " + DIAS[new Date(Date.parse(x) - 6 * 3600e3).getUTCDay()]; };
const RG_TL = /team\s*leader|marketing|director|regional|national|international|executive|board/i;
export function rangoUsr(u, team) {
  const r = (u.registro || {}), n = r.nombre || ""; if (r.rango) return r.rango;
  const cr = (team.config || {}).rangos || {}; for (const k in cr) if (mismoNombre(k, n)) return cr[k];
  const L = (team.liderazgo || []).find(l => mismoNombre(l.nombre, n) || (r.nombreRanking && mismoNombre(l.nombre, r.nombreRanking))); return L ? String(L.rango || "") : "";
}
const corto = n => { const w = String(n || "").trim().split(/\s+/).filter(Boolean); return (w.length >= 4 ? [w[0], w[2]] : w.slice(0, 2)).map(x => x[0].toUpperCase() + x.slice(1).toLowerCase()).join(" "); };
// destinos: {uid: [{n,x,s,k,w,d}]}
const ADMINS = ["garciagoedwin@gmail.com", "actionleadersoficial@gmail.com", "edwing.go@gmail.com"];
export function destinosInact(rows, users, team, ms = Date.now(), todos = false) {
  const D = {}, lim = todos ? Infinity : ms + 7 * 864e5, alias = (team.config || {}).alias || {};
  const adm = users.filter(u => ADMINS.includes(String(u.email || "").toLowerCase())).map(u => u.uid);
  const add = (uid, e) => { const L = (D[uid] = D[uid] || []); const i = L.findIndex(m => (m.k || m.n) === (e.k || e.n)); if (i < 0) L.push(e); else if (e.d) L[i] = e; };
  for (const r of rows) {
    if (!r.x && !todos) continue; const t = r.x ? Date.parse(r.x) : Infinity; if (!(t > ms && t <= lim)) continue;
    const spN = alias[r.s] || r.s;
    const sp = users.filter(u => u.registro && (mismoNombre(u.registro.nombre, spN) || (u.registro.nombreRanking && mismoNombre(u.registro.nombreRanking, spN))));
    const base = { n: corto(r.n), x: r.x, s: corto(r.s), k: (r.k || [])[0] || "", w: (r.k || [])[1] || (r.k || [])[2] || "" };
    let cand = sp.filter(u => String(u.email || "").toLowerCase() !== "garciagoedwin@gmail.com");
    if (cand.length > 1) { const cnt = u => users.filter(v => (v.registro && v.registro.linea || []).includes(u.uid)).length; cand.sort((a, b) => cnt(b) - cnt(a)); cand = [cand[0]]; }
    for (const uid of adm) add(uid, { ...base, d: 0 });
    if (cand.length !== 1) { console.log("Patrocinador no encontrado en la app:", r.s, sp.length); continue; }
    const s = cand[0]; add(s.uid, { ...base, d: 1 });
    for (const uid of (s.registro.linea || [])) { const u = users.find(v => v.uid === uid); if (!u || uid === s.uid) continue;
      if (RG_TL.test(rangoUsr(u, team))) add(uid, { ...base, d: 0 }); }
  }
  for (const k in D) D[k].sort((a, b) => (Date.parse(a.x) || 9e15) - (Date.parse(b.x) || 9e15));
  return D;
}
// 6 nov: aviso de la mañana con TODOS los ahorros pendientes del equipo (s7 = cuántos se inactivan en 7 días)
export function msgAh(L, nombre, ms = Date.now()) {
  if (!L || !L.length) return null; const s7 = L.filter(m => m.x && Date.parse(m.x) - ms <= 7 * 864e5).length, f = primer(nombre || "");
  const urg = L.some(m => m.x && Date.parse(m.x) - ms < 2 * 864e5);
  return { title: `${urg ? "🚨" : "💰"} ${f ? f + ", t" : "T"}iene ${L.length} ${L.length === 1 ? "ahorro pendiente" : "ahorros pendientes"} en su equipo`,
    body: (s7 ? `${s7} se inactiva${s7 > 1 ? "n" : ""} esta semana. ` : "") + "Llámelos hoy: cada llamada protege su cuenta y sus puntos dobles 📞" };
}
export function msgInact(L, ms = Date.now()) {
  if (!L || !L.length) return null; const urg = L.some(m => Date.parse(m.x) - ms < 2 * 864e5);
  if (L.length === 1) { const m = L[0], c = cuandoHN(m.x, ms);
    return { title: `${urg ? "🚨" : "⚠️"} ${m.n} se inactiva ${c}`,
      body: m.d ? `Llámele hoy para que no pierda su cuenta ni sus puntos dobles. Es de su equipo directo.`
                : `Es del equipo de ${m.s}. Llámele o apoye a ${m.s.split(" ")[0]} para que no pierda su cuenta ni sus puntos dobles.` }; }
  return { title: `${urg ? "🚨" : "⚠️"} ${L.length} de su equipo se inactivan pronto`,
    body: L.slice(0, 4).map(m => `${m.n.split(" ")[0]} (${cuandoHN(m.x, ms).replace("el ", "")})`).join(", ") + ". Llámeles hoy; la lista está en su app." };
}
export function msgPago(L) {
  if (!L || !L.length) return null;
  if (L.length === 1) return { title: `✅ ¡${L[0].n} ya pagó! 🎉`, body: "Buena gestión: su cuenta y sus puntos dobles siguen activos." };
  return { title: `✅ ${L.length} de su equipo ya pagaron 🎉`, body: L.slice(0, 5).map(m => m.n).join(", ") + ". ¡Buena gestión!" };
}
// Une la lista nueva con la anterior: los que estaban y ya no están pendientes (y no se vencieron) = pagaron (p = fecha), se quedan 3 días.
export function unirUrg(prev, nuevo, pendKeys, ms = Date.now()) {
  const key = m => m.k || m.n, out = [...(nuevo || [])], ya = new Set(out.map(key)), pagos = [];
  for (const m of (prev || [])) { const k = key(m); if (ya.has(k)) continue;
    if (m.p) { if (ms - m.p < 3 * 864e5) { out.push(m); ya.add(k); } continue; }
    if (!pendKeys.has(k) && Date.parse(m.x) > ms) { const q = { ...m, p: ms }; out.push(q); ya.add(k); pagos.push(q); } }
  return { l: out, pagos };
}
async function leerAhorro(db) {
  const crypto = await import("node:crypto");
  const k = ((await db.doc("evento/sps26/priv/llave").get()).data() || {}).k; if (!k) throw new Error("sin llave");
  const key = Buffer.from(k.replace(/-/g, "+").replace(/_/g, "/"), "base64"), raw = Buffer.from(fs.readFileSync("../../data/ahorro.enc", "utf8").trim(), "base64");
  const dc = crypto.createDecipheriv("aes-256-gcm", key, raw.subarray(0, 12)); dc.setAuthTag(raw.subarray(raw.length - 16));
  return JSON.parse(Buffer.concat([dc.update(raw.subarray(12, raw.length - 16)), dc.final()]).toString("utf8")).rows || [];
}

// ---------- reuniones de equipo de los líderes (9 nov) ----------
// agendaEv tipo "equipo": {cre, creN, tit, dias:[0-6], hora, zoom, extra:[{f,h}], skip:[f], act}. Aviso 30 min antes a toda la línea del líder (registro.linea).
export function eqzPendientes(Q, ms = Date.now()) {
  const hn = new Date(ms - 6 * 3600e3), hoy = hn.toISOString().slice(0, 10), ahora = hn.getUTCHours() * 60 + hn.getUTCMinutes(), wd = hn.getUTCDay(), R = [];
  for (const e of Q || []) {
    if (e.act === false || e.cancel) continue;
    const V = [];
    if ((e.dias || []).includes(wd) && !(e.skip || []).includes(hoy) && /^\d\d:\d\d$/.test(e.hora || "")) V.push(e.hora);
    for (const x of e.extra || []) if (x && x.f === hoy && /^\d\d:\d\d$/.test(x.h || "")) V.push(x.h);
    for (const h of [...new Set(V)]) { const falta = +h.slice(0, 2) * 60 + +h.slice(3) - ahora; if (falta >= 5 && falta <= 40) R.push({ ...e, hora: h, falta, key: e.id + "|" + hoy + "|" + h }); }
  }
  return R;
}
export function msgEqz(e) {
  const n = String(e.creN || "su líder").split(" ")[0], mi = Math.max(5, Math.round((e.falta || 30) / 5) * 5);
  return { title: `📞 En ${mi} min: reunión de equipo con ${n}`, body: `${e.tit || "Reunión de equipo"} · ${h12(e.hora)} hora de Honduras. Toque para ver el Zoom.` };
}

// 6 nov: a dónde lleva cada aviso al tocarlo (campanita y notificación del teléfono)
export function avDestino(modo, m) {
  const t = (m && m.title) || "";
  if (/^(racha|racha2|fin|manana)$/.test(modo)) return "rut";
  if (/^inc/.test(modo)) return "inc";
  if (modo === "agenda" || modo === "equipo") return "agenda";
  if (modo === "act") return /Sistema de liderazgo|Felicidades/i.test(t) ? "lz" : "snv";
  if (modo === "sol") return /pide un cambio/i.test(t) ? "sol" : "dt";
  if (/^inact/.test(modo)) return /ahorros? pendientes?/i.test(t) ? "ahp" : "urg";
  if (/^lzg/.test(modo)) return /compromiso/i.test(t) ? "comp" : "lzg";
  if (modo === "viaje") return "via";
  if (modo === "rhito") return "rach";
  return "inicio";
}
async function main() {
  const [modo, viejoP, nuevoP] = process.argv.slice(2);
  const DRY = !!process.env.DRY;
  const { initializeApp, cert } = await import("firebase-admin/app");
  const { getFirestore, FieldValue } = await import("firebase-admin/firestore");
  const { getMessaging } = await import("firebase-admin/messaging");
  initializeApp({ credential: cert(JSON.parse(process.env.FIREBASE_SA)) });
  const db = getFirestore(), fcm = getMessaging();
  const salida = []; // [uid, tk, {title, body}]
  const hist = {}; // uid → historial actual (h) para guardar los últimos 15 avisos
  let vista = modo === "act" ? "equipo" : modo === "agenda" || modo === "equipo" ? "agenda" : "inicio";

  if (modo === "racha" || modo === "racha2" || modo === "fin" || modo === "manana") {
    const hoy = hoyHN(), ayer = ayerHN();
    const P = (await db.collection("push").get()).docs.map(d => ({ uid: d.id, ...d.data() })).filter(p => p.tk && (p.pr || {}).racha !== false);
    P.forEach(p => hist[p.uid] = p.h || []);
    if (!P.length) { console.log("Nadie con avisos activos."); return; }
    const C = {}; (await db.collection("constancia").get()).docs.forEach(d => C[d.id] = d.data());
    for (const p of P) { const m = modo === "fin" ? msgFin(p.uid, C[p.uid], hoy, ayer) : modo === "manana" ? msgManana(p.uid, C[p.uid], hoy, ayer) : msgRacha(modo, p.uid, C[p.uid], hoy, ayer); if (m) salida.push([p.uid, p.tk, m]); }
  } else if (modo === "inc1" || modo === "inc2") {
    let cfg = null; try { cfg = (JSON.parse(fs.readFileSync(viejoP || "../../data/team.json", "utf8")).config || {}).incentivo; } catch {}
    const m = msgInc(modo, cfg);
    if (!m) { console.log("Sin incentivo vigente para este aviso."); return; }
    const P = (await db.collection("push").get()).docs.map(d => ({ uid: d.id, ...d.data() })).filter(p => p.tk);
    P.forEach(p => { hist[p.uid] = p.h || []; salida.push([p.uid, p.tk, m]); });
  } else if (modo === "inact" || modo === "inact-sync") {
    vista = "inicio";
    const team = JSON.parse(fs.readFileSync("../../data/team.json", "utf8"));
    const rows = await leerAhorro(db);
    const pendKeys = new Set(); for (const r of rows) { if ((r.k || [])[0]) pendKeys.add(r.k[0]); pendKeys.add(corto(r.n)); }
    const users = (await db.collection("users").get()).docs.map(d => ({ uid: d.id, ...d.data() }));
    const D = destinosInact(rows, users, team), DA = modo === "inact" ? destinosInact(rows, users, team, Date.now(), true) : {};
    const P = {}; (await db.collection("push").get()).docs.forEach(d => P[d.id] = d.data());
    const t = Date.now(), W = [], uids = new Set([...Object.keys(D), ...Object.keys(DA), ...Object.keys(P).filter(u => (P[u].urg && (P[u].urg.l || []).length) || (P[u].ahp && (P[u].ahp.l || []).length))]);
    for (const uid of uids) {
      const p = P[uid] || {}, { l, pagos } = unirUrg((p.urg || {}).l, D[uid], pendKeys, t);
      const w = { urg: { t, l } };
      if (modo === "inact") { const A = DA[uid] || []; w.ahp = { t, n: A.length, s7: A.filter(m => m.x && Date.parse(m.x) - t <= 7 * 864e5).length, l: A.slice(0, 40) }; }
      W.push([uid, w]); hist[uid] = p.h || [];
      const ok = p.tk && (p.pr || {}).inact !== false;
      if (ok && pagos.length) salida.push([uid, p.tk, msgPago(pagos)]);
      if (ok && modo === "inact" && (DA[uid] || []).length) { const u = users.find(v => v.uid === uid), m = msgAh(DA[uid], ((u || {}).registro || {}).nombre); if (m) salida.push([uid, p.tk, m]); }
      else if (ok && modo === "inact" && D[uid]) { const m = msgInact(D[uid]); if (m) salida.push([uid, p.tk, m]); }
      if (DRY) console.log("·", uid.slice(0, 5) + "…", l.map(x => x.n + (x.p ? " ✅pagó" : " " + cuandoHN(x.x)) + (x.d ? " (directo)" : "")).join(" | "));
    }
    console.log(`Miembros por inactivarse → ${Object.keys(D).length} líderes con aviso.`);
    if (!DRY) for (const [uid, data] of W) await db.doc("push/" + uid).set(data, { merge: true });
  } else if (modo === "agenda") {
    let cal = []; try { cal = JSON.parse(fs.readFileSync(viejoP || "../../data/team.json", "utf8")).calendario || []; } catch {}
    const E = agendaPendientes(cal);
    if (!E.length) { console.log("Sin actividades próximas."); return; }
    const metaRef = db.doc("push_meta/agenda"), meta = (await metaRef.get()).data() || {}, ya = new Set(meta.sent || []);
    const nuevos = E.filter(e => !ya.has(e.id));
    if (!nuevos.length) { console.log("Ya se avisó."); return; }
    const P = (await db.collection("push").get()).docs.map(d => ({ uid: d.id, ...d.data() })).filter(p => p.tk && (p.pr || {}).agenda !== false);
    P.forEach(p => hist[p.uid] = p.h || []);
    let tur = null; if (nuevos.some(e => e.st)) { try { tur = (await db.doc("turnos/" + nuevos[0].fecha.slice(0, 7)).get()).data() || {}; } catch {} }
    for (const e of nuevos) { const m = msgAgenda(e, tur); for (const p of P) { if (e.k === "lid" && !p.sis) continue; salida.push([p.uid, p.tk, m]); } console.log("Aviso:", e.titulo, e.hora); }
    if (!DRY) await metaRef.set({ sent: [...ya, ...nuevos.map(e => e.id)].slice(-80), t: Date.now() });
  } else if (modo === "equipo") {
    const Q = (await db.collection("agendaEv").where("tipo", "==", "equipo").get()).docs.map(d => ({ id: d.id, ...d.data() }));
    const E = eqzPendientes(Q);
    if (!E.length) { console.log("Sin reuniones de equipo próximas (" + Q.length + " programadas)."); return; }
    const metaRef = db.doc("push_meta/equipo"), meta = (await metaRef.get()).data() || {}, ya = new Set(meta.sent || []);
    const nuevos = E.filter(e => !ya.has(e.key));
    if (!nuevos.length) { console.log("Ya se avisó."); return; }
    for (const e of nuevos) {
      const U = (await db.collection("users").where("registro.linea", "array-contains", e.cre).get()).docs.map(d => d.id).filter(u => u !== e.cre);
      let n = 0;
      for (const u of U) { const d = await db.doc("push/" + u).get(); const x = d.exists ? d.data() : {}; hist[u] = x.h || []; if (x.tk && (x.pr || {}).agenda !== false) { salida.push([u, x.tk, msgEqz(e)]); n++; } }
      console.log("Reunión de equipo:", U.length, "en la línea,", n, "con avisos");
    }
    if (!DRY) await metaRef.set({ sent: [...ya, ...nuevos.map(e => e.key)].slice(-200), t: Date.now() });
  } else if (modo === "act") {
    const leer = f => { try { return JSON.parse(fs.readFileSync(f, "utf8")); } catch { return {}; } };
    const VJ = leer(viejoP), NJ = leer(nuevoP);
    const N = actNuevas(VJ, NJ), LZ = lzCambios(VJ, NJ);
    if (!N.length && !LZ.length) { console.log("Sin activaciones nuevas ni calificados nuevos."); return; }
    const users = (await db.collection("users").get()).docs.map(d => ({ uid: d.id, ...d.data() }));
    const tkDe = {}; const pushDe = async uid => { if (!(uid in tkDe)) { const d = await db.doc("push/" + uid).get(); const x = d.exists ? d.data() : {}; hist[uid] = x.h || []; tkDe[uid] = x.tk && (x.pr || {}).act !== false ? x.tk : null; } return tkDe[uid]; };
    for (const a of N) {
      const { sp, arriba } = destinosAct(a, users);
      console.log(`Activación: ${a.socio} · patrocinador ${a.patrocinador} → ${sp ? "encontrado" : "NO encontrado en la app"} · ${arriba.length} arriba`);
      if (!sp) continue;
      const t1 = await pushDe(sp); if (t1) salida.push([sp, t1, msgAct(a, true)]);
      for (const u of arriba) { const t = await pushDe(u); if (t) salida.push([u, t, msgAct(a, false)]); }
    }
    for (const c of LZ) {
      const U = users.filter(u => u.registro && mismoNombre(u.registro.nombre, c.nombre));
      console.log(`Liderazgo: ${c.nombre} · ${c.nivel === 2 ? "500" : "200"} · ${c.nuevo ? "NUEVO" : "miembro"} → ${U.length === 1 ? "encontrado" : "NO encontrado"}`);
      if (U.length !== 1) continue;
      const d = await db.doc("push/" + U[0].uid).get(); const x = d.exists ? d.data() : {}; hist[U[0].uid] = hist[U[0].uid] || x.h || [];
      if (x.tk) salida.push([U[0].uid, x.tk, msgLz(c)]);
    }
  } else if (modo === "sol") {
    // Solicitudes de cambio del Dream Team: users.solN (nueva, avisar a admins) / users.solR (respondida, avisar al socio)
    vista = "equipo";
    const K = { q: "Quitar de su Dream Team", p: "Patrocinador correcto", o: "Otro cambio" };
    const nuevas = (await db.collection("users").where("solN", "==", true).get()).docs;
    const resp = (await db.collection("users").where("solR", "==", true).get()).docs;
    if (!nuevas.length && !resp.length) { console.log("Sin solicitudes."); return; }
    const W = [], pushDe = async uid => { const d = await db.doc("push/" + uid).get(); const x = d.exists ? d.data() : {}; hist[uid] = x.h || []; return x.tk || null; };
    if (nuevas.length) {
      const adm = (await db.collection("users").where("email", "in", ADMINS).get()).docs.map(d => d.id), TK = {};
      for (const u of adm) { const t = await pushDe(u); if (t) TK[u] = t; }
      for (const d of nuevas) {
        const x = d.data(), nm = corto((x.registro || {}).nombre || "Un socio"), L = Object.values(x.sol || {}).filter(s => s.st === "p" && !s.nt);
        if (L.length) { const m = { title: "📝 " + nm + " pide un cambio", body: L.map(s => (K[s.k] || "Cambio") + ": " + corto(s.n)).join(" · ").slice(0, 160) + ". Revíselo en Admin del equipo." };
          for (const u in TK) salida.push([u, TK[u], m]); console.log("Solicitud:", nm, L.length); }
        const upd = { solN: false }; L.forEach(s => upd["sol." + s.id + ".nt"] = Date.now()); W.push([d.id, upd]);
      }
    }
    for (const d of resp) {
      const x = d.data(), L = Object.values(x.sol || {}).filter(s => (s.st === "ok" || s.st === "no") && !s.rt), tk = L.length ? await pushDe(d.id) : null;
      for (const s of L) if (tk) salida.push([d.id, tk, { title: s.st === "ok" ? "✅ Su solicitud fue aprobada" : "📝 Revisamos su solicitud",
        body: (s.st === "ok" ? "Aplicamos el cambio sobre " : "No aplicamos el cambio sobre ") + corto(s.n) + (s.r ? ": " + s.r : ".") }]);
      const upd = { solR: false }; L.forEach(s => upd["sol." + s.id + ".rt"] = Date.now()); W.push([d.id, upd]);
    }
    if (!DRY) for (const [uid, u] of W) await db.doc("users/" + uid).update(u);
  } else if (modo === "lzg" || modo === "lzg-sync") {
    // Grupo de WhatsApp del Sistema de liderazgo: quién ya se presentó (users.lzG.m == mes) → team/liderazgo.grp;
    // modo lzg además avisa a los miembros (push.sis == 1) que aún no se presentan.
    const mes = new Date().toISOString().slice(0, 7);
    const T = await db.doc("team/liderazgo").get(), G = (T.exists && T.data().grupo) || {};
    if (!(G.link || G.si) || G.m !== mes) { console.log("Sin link del grupo para", mes); return; }
    const ya = (await db.collection("users").where("lzG.m", "==", mes).get()).docs;
    const n = ya.map(d => ((d.data().registro || {}).nombre || "").trim()).filter(Boolean), yaU = new Set(ya.map(d => d.id));
    console.log("Ya se presentaron:", n.length);
    if (!DRY) await db.doc("team/liderazgo").set({ grp: { m: mes, n, t: Date.now() } }, { merge: true });
    if (modo === "lzg") {
      let J = {}; try { J = JSON.parse(fs.readFileSync(new URL("../../data/team.json", import.meta.url))); } catch (e) {}
      const no = ((J.config || {}).lzNoAuto || []);
      const P = (await db.collection("push").where("sis", "==", 1).get()).docs.filter(d => !yaU.has(d.id) && d.data().tk);
      for (const d of P) {
        const u = await db.doc("users/" + d.id).get(), ud = u.exists ? u.data() : {}, nm = (ud.registro || {}).nombre || "";
        if (!nm || no.some(x => mismoNombre(x, nm))) continue;
        const x = d.data(); hist[d.id] = x.h || [];
        const cp = ud.comp && ud.comp.mes === mes && !ud.comp.no;
        if (!cp) { salida.push([d.id, x.tk, { title: "⚔️ " + primer(nm) + ", haga su compromiso del mes", body: "Es el primer paso para entrar al grupo de WhatsApp del Sistema de liderazgo. Hágalo en Inicio de la app 🎯" }]); continue; }
        salida.push([d.id, x.tk, pick([
          { title: "⚔️ " + primer(nm) + ", su grupo lo espera", body: "Entre al grupo del Sistema de liderazgo y preséntese con su flyer. Está en Inicio de la app 👋" },
          { title: "👋 Preséntese en el grupo del sistema", body: "El equipo quiere darle la bienvenida, " + primer(nm) + ". Abra la app y toque «Entrar al grupo»." },
          { title: "⚔️ Falta un paso, " + primer(nm), body: "Entre al grupo de WhatsApp del Sistema de liderazgo y preséntese. Lo encuentra en Inicio de la app." }], d.id + new Date().toISOString().slice(0, 10))]);
      }
    }
  } else if (modo === "rhito") {
    // 8 nov (Edwin): metas de racha 7/14/21/30. La app escribe constancia/{uid}.rh {m, ini, t} al celebrar; aquí se avisa a su línea de arriba (una vez).
    const lim = Date.now() - 30 * 3600e3, M = (await db.doc("push_meta/rhito").get()).data() || {}, sent = new Set(M.s || []), nuevos = [];
    const H = (await db.collection("constancia").where("rh.t", ">", lim).get()).docs;
    for (const d of H) {
      const rh = d.data().rh || {}, key = d.id + ":" + rh.ini + ":" + rh.m; if (!rh.m || sent.has(key)) continue;
      const u = await db.doc("users/" + d.id).get(), ud = u.exists ? u.data() : {}, nm = (ud.registro || {}).nombre || "";
      const up = [...new Set(((ud.registro || {}).linea || []).filter(Boolean))].slice(0, 6); if (!nm || !up.length) { nuevos.push(key); continue; }
      for (const uid of up) {
        const p = await db.doc("push/" + uid).get(), x = p.exists ? p.data() : {}; if (!x.tk) continue; hist[uid] = x.h || [];
        salida.push([uid, x.tk, pick([
          { title: "🔥 " + primer(nm) + " lleva " + rh.m + " días seguidos", body: "Su rutina diaria no se detiene. Felicítelo hoy desde Mi Racha 👏" },
          { title: "🔥 ¡" + rh.m + " días de racha para " + primer(nm) + "!", body: "La constancia se celebra. Mándele un mensaje desde Mi Racha 💪" }], key + uid)]);
      }
      nuevos.push(key);
    }
    if (!DRY && nuevos.length) await db.doc("push_meta/rhito").set({ s: [...sent, ...nuevos].slice(-400), t: Date.now() }, { merge: true });
  } else if (modo === "viaje") {
    // 8 nov (Edwin): invitar a llenar el formulario de testimonios de viaje (cada semana) a quien NO ha respondido
    // (users.viaj = "Ya lo hice"/"No me interesa") y NO tiene testimonio publicado (data/hist.json tx[].n).
    let tx = []; try { tx = Object.values(JSON.parse(fs.readFileSync(new URL("../../data/hist.json", import.meta.url))).tx || {}).map(x => x && x.n).filter(Boolean); } catch (e) {}
    const resp = new Set((await db.collection("users").where("viaj.t", ">", 0).get()).docs.map(d => d.id));
    const P = (await db.collection("push").get()).docs.filter(d => d.data().tk && !resp.has(d.id));
    for (const d of P) {
      const u = await db.doc("users/" + d.id).get(), ud = u.exists ? u.data() : {}, nm = (ud.registro || {}).nombre || "";
      if (!nm || /garciagoedwin@gmail\.com/i.test(ud.email || "") || tx.some(x => mismoNombre(x, nm))) continue;
      const x = d.data(); hist[d.id] = x.h || [];
      salida.push([d.id, x.tk, pick([
        { title: "✈️ " + primer(nm) + ", ¿ya viajó con inCruises?", body: "Comparta sus fotos y su experiencia: puede salir en la historia del día de todo el equipo. Toque aquí 📸" },
        { title: "📸 Su viaje puede inspirar al equipo", body: primer(nm) + ", si ya viajó con inCruises, suba sus fotos y cuéntenos cómo le fue. Es rápido." },
        { title: "🌴 ¡Queremos ver sus fotos de viaje!", body: "Si ya disfrutó su membresía, " + primer(nm) + ", compártala con el equipo desde la app." }], d.id + new Date().toISOString().slice(0, 10))]);
    }
  } else { console.log("Modo desconocido:", modo); process.exit(1); }

  console.log(`${salida.length} avisos para enviar${DRY ? " (prueba, no se envían)" : ""}.`);
  if (DRY || !salida.length) { salida.slice(0, 15).forEach(([u, , m]) => console.log("·", u.slice(0, 5) + "…", m.title, "|", m.body)); return; }
  for (let i = 0; i < salida.length; i += 400) {
    const lote = salida.slice(i, i + 400);
    const r = await fcm.sendEach(lote.map(([, tk, m]) => ({ token: tk,
      webpush: { notification: { title: m.title, body: m.body, icon: ICON, badge: ICON }, fcmOptions: { link: APP + (APP.includes("?") ? "&" : "?") + "av=" + avDestino(modo, m) } } })));
    r.responses.forEach((x, j) => { if (!x.success) { const code = (x.error && x.error.code) || "";
      console.log("Falló", lote[j][0].slice(0, 5) + "…", code);
      if (/registration-token-not-registered|invalid-registration-token|invalid-argument/.test(code)) db.doc("push/" + lote[j][0]).set({ tk: FieldValue.delete() }, { merge: true }).catch(() => {}); } });
    console.log(`Enviados: ${r.successCount} · fallidos: ${r.failureCount}`);
    // Historial para el Centro de avisos de la app (últimos 15 por persona)
    const t = Date.now();
    await Promise.all(lote.map(([uid, , m], j) => r.responses[j].success ? db.doc("push/" + uid).set({ h: (hist[uid] || []).concat([{ t, ti: m.title, b: m.body, v: avDestino(modo, m) }]).slice(-30) }, { merge: true }).catch(() => {}) : null));
  }
}
if (import.meta.url === `file://${process.argv[1]}`) main().catch(e => { console.error(e); process.exit(1); });
