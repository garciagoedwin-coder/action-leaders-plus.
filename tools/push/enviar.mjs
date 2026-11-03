// Avisos (notificaciones push) de Action Leaders PLUS.
// Corre en GitHub Actions con el secreto FIREBASE_SA (clave de la cuenta de servicio; NUNCA en el repo).
//   node enviar.mjs racha            → 7:00 p.m. HN: a quien no ha completado su rutina hoy
//   node enviar.mjs racha2           → 9:30 p.m. HN: solo racha de 3+ días que está por perderse
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

// ---------- envío ----------
async function main() {
  const [modo, viejoP, nuevoP] = process.argv.slice(2);
  const DRY = !!process.env.DRY;
  const { initializeApp, cert } = await import("firebase-admin/app");
  const { getFirestore, FieldValue } = await import("firebase-admin/firestore");
  const { getMessaging } = await import("firebase-admin/messaging");
  initializeApp({ credential: cert(JSON.parse(process.env.FIREBASE_SA)) });
  const db = getFirestore(), fcm = getMessaging();
  const salida = []; // [uid, tk, {title, body}]

  if (modo === "racha" || modo === "racha2") {
    const hoy = hoyHN(), ayer = ayerHN();
    const P = (await db.collection("push").get()).docs.map(d => ({ uid: d.id, ...d.data() })).filter(p => p.tk && (p.pr || {}).racha !== false);
    if (!P.length) { console.log("Nadie con avisos activos."); return; }
    const C = {}; (await db.collection("constancia").get()).docs.forEach(d => C[d.id] = d.data());
    for (const p of P) { const m = msgRacha(modo, p.uid, C[p.uid], hoy, ayer); if (m) salida.push([p.uid, p.tk, m]); }
  } else if (modo === "act") {
    const leer = f => { try { return JSON.parse(fs.readFileSync(f, "utf8")); } catch { return {}; } };
    const N = actNuevas(leer(viejoP), leer(nuevoP));
    if (!N.length) { console.log("Sin activaciones nuevas."); return; }
    const users = (await db.collection("users").get()).docs.map(d => ({ uid: d.id, ...d.data() }));
    const tkDe = {}; const pushDe = async uid => { if (!(uid in tkDe)) { const d = await db.doc("push/" + uid).get(); const x = d.exists ? d.data() : {}; tkDe[uid] = x.tk && (x.pr || {}).act !== false ? x.tk : null; } return tkDe[uid]; };
    for (const a of N) {
      const { sp, arriba } = destinosAct(a, users);
      console.log(`Activación: ${a.socio} · patrocinador ${a.patrocinador} → ${sp ? "encontrado" : "NO encontrado en la app"} · ${arriba.length} arriba`);
      if (!sp) continue;
      const t1 = await pushDe(sp); if (t1) salida.push([sp, t1, msgAct(a, true)]);
      for (const u of arriba) { const t = await pushDe(u); if (t) salida.push([u, t, msgAct(a, false)]); }
    }
  } else { console.log("Modo desconocido:", modo); process.exit(1); }

  console.log(`${salida.length} avisos para enviar${DRY ? " (prueba, no se envían)" : ""}.`);
  if (DRY || !salida.length) { salida.slice(0, 15).forEach(([u, , m]) => console.log("·", u.slice(0, 5) + "…", m.title, "|", m.body)); return; }
  for (let i = 0; i < salida.length; i += 400) {
    const lote = salida.slice(i, i + 400);
    const r = await fcm.sendEach(lote.map(([, tk, m]) => ({ token: tk,
      webpush: { notification: { title: m.title, body: m.body, icon: ICON, badge: ICON }, fcmOptions: { link: APP } } })));
    r.responses.forEach((x, j) => { if (!x.success) { const code = (x.error && x.error.code) || "";
      console.log("Falló", lote[j][0].slice(0, 5) + "…", code);
      if (/registration-token-not-registered|invalid-registration-token|invalid-argument/.test(code)) db.doc("push/" + lote[j][0]).set({ tk: FieldValue.delete() }, { merge: true }).catch(() => {}); } });
    console.log(`Enviados: ${r.successCount} · fallidos: ${r.failureCount}`);
  }
}
if (import.meta.url === `file://${process.argv[1]}`) main().catch(e => { console.error(e); process.exit(1); });
