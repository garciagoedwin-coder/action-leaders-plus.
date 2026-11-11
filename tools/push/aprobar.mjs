// Aprobación de cuentas y miembros del sistema (10 nov 2026).
// Corre en GitHub Actions (aprobar.yml) con FIREBASE_SA. Marca en la CUENTA de Firebase (custom claims):
//   ap  = cuenta aprobada (socio o cliente de inCruises reconocido por la huella de su correo o WhatsApp, o aprobada a mano)
//   sis = miembro del Sistema de liderazgo (fila de liderazgo en data/team.json unida a su cuenta)
// Las reglas de Firestore usan request.auth.token.ap / .sis → 0 lecturas extra.
// Logs públicos: SOLO conteos, nunca nombres, correos ni teléfonos.
//   GRAND=1 → aprueba a todos los que ya están registrados (primera vez).  DRY=1 → no escribe nada.
import fs from "node:fs";import crypto from "node:crypto";
import { nrm, mismoNombre } from "./enviar.mjs";

export const ahF = x => { let h = 0x811c9dc5; for (const b of Buffer.from("alp|" + x, "utf8")) { h = (h ^ b) >>> 0; h = Math.imul(h, 0x01000193) >>> 0; } return h.toString(16).padStart(8, "0").slice(0, 6); };
export const ahKe = e => { e = String(e || "").trim().toLowerCase(); return e.includes("@") ? ahF("e:" + e) : null; };
export const ahKw = w => { const d = String(w || "").replace(/\D/g, ""); return d.length >= 8 ? ahF("w:" + d.slice(-8)) : null; };

function leerEnc(key, f) { try { const raw = Buffer.from(fs.readFileSync(f, "utf8").trim(), "base64");
  const dc = crypto.createDecipheriv("aes-256-gcm", key, raw.subarray(0, 12)); dc.setAuthTag(raw.subarray(raw.length - 16));
  return JSON.parse(Buffer.concat([dc.update(raw.subarray(12, raw.length - 16)), dc.final()]).toString("utf8")); } catch (e) { return null; } }

// Huellas conocidas de inCruises (socios y clientes): activaciones, ahorro, red y nuevos.
export function huellas(team, red, nuevos, ahorro) {
  const S = new Set(), add = k => { if (k) S.add(k); };
  for (const a of team.activaciones || []) { add(a.ek); add(a.wk); }
  for (const k of Object.keys(((team.config || {}).ahorro || {}).k || {})) add(k);
  for (const r of (red && red.rows) || []) { add(r.ek); add(r.wk); }
  for (const r of (ahorro && ahorro.rows) || []) for (const k of r.k || []) add(k);
  for (const c of Object.values((nuevos && nuevos.c) || {})) { add(ahKe(c.e)); add(ahKw(c.w)); }
  return S;
}
export function claveDe(u) { return [ahKe(u.email), ahKe((u.registro || {}).correo), ahKw((u.registro || {}).whatsapp)].filter(Boolean); }

// Miembros del Sistema de liderazgo: cada fila de liderazgo → a lo más UNA cuenta.
export function miembros(team, users) {
  const alias = (team.config || {}).alias || {}, acts = team.activaciones || [];
  const nombres = u => { const r = u.registro || {}, N = [r.nombre, r.nombreRanking, u.nombre].filter(Boolean);
    const ks = new Set(claveDe(u)); for (const a of acts) if ((a.ek && ks.has(a.ek)) || (a.wk && ks.has(a.wk))) N.push(a.socio);
    for (const n of [...N]) { if (alias[n]) N.push(alias[n]); for (const k in alias) if (nrm(alias[k]) === nrm(n)) N.push(k); }
    return [...new Set(N.map(nrm).filter(Boolean))]; };
  const R = users.filter(u => u.registro && u.registro.nombre).map(u => ({ u, N: nombres(u) }));
  const out = new Map(), sin = [];
  for (const l of team.liderazgo || []) {
    const L = [l.nombre, l.nombreRanking].filter(Boolean).map(nrm);
    let c = R.filter(x => x.N.some(n => L.includes(n)));
    if (c.length !== 1) { const c2 = R.filter(x => x.N.some(n => L.some(m => mismoNombre(n, m)))); if (!c.length && c2.length === 1) c = c2; }
    if (c.length === 1) out.set(c[0].u.uid, l.nombre); else sin.push(l.nombre);
  }
  return { uids: out, sin };
}

async function main() {
  const DRY = !!process.env.DRY, GRAND = !!process.env.GRAND, FULL = !!process.env.FULL;
  const { initializeApp, cert } = await import("firebase-admin/app");
  const { getFirestore, FieldValue } = await import("firebase-admin/firestore");
  const { getAuth } = await import("firebase-admin/auth");
  const { getMessaging } = await import("firebase-admin/messaging");
  initializeApp({ credential: cert(JSON.parse(process.env.FIREBASE_SA)) });
  const db = getFirestore(), auth = getAuth(), fcm = getMessaging();
  const team = JSON.parse(fs.readFileSync("../../data/team.json", "utf8"));
  const k = ((await db.doc("evento/sps26/priv/llave").get()).data() || {}).k; if (!k) throw new Error("sin llave");
  const key = Buffer.from(k.replace(/-/g, "+").replace(/_/g, "/"), "base64");
  const H = huellas(team, leerEnc(key, "../../data/red.enc"), leerEnc(key, "../../data/nuevos.enc"), leerEnc(key, "../../data/ahorro.enc"));
  // Cuentas de Firebase Auth (gratis, sin lecturas de Firestore)
  const A = []; let pt; do { const r = await auth.listUsers(1000, pt); A.push(...r.users); pt = r.pageToken; } while (pt);
  // Documentos de users: TODOS solo cuando hace falta (primera vez o cada hora para los miembros); si no, solo los que aún no están aprobados.
  const _n = new Date(), hora = FULL || (_n.getUTCHours() % 6 === 0 && _n.getUTCMinutes() < 10); // cada 6 h: todas las cuentas
  // Aprobaciones manuales (patrocinador o admin): aprob/{uid} {ok, por, t}
  const M = (await db.collection("aprob").get()).docs;
  // 11 nov: el admin corrigió el correo/WhatsApp de inCruises («Solo guardar») → users.apRe; se revisa en esta corrida.
  const RE = new Set((await db.collection("users").where("apRe", ">", 0).get()).docs.map(d => d.id));
  const man = new Map(M.map(d => [d.id, d.data()]));
  // Cada 10 min solo se leen las cuentas sin veredicto o con aprobación manual nueva; cada 6 horas, todas (miembros y re-chequeo).
  // nr = cuenta sin registro (ap=false). Si volvió a entrar en la última hora, se revisa: puede que se esté registrando ahora.
  const reciente = a => Date.now() - Date.parse(a.metadata.lastRefreshTime || a.metadata.lastSignInTime || 0) < 3600e3;
  const leer = A.filter(a => { const c = a.customClaims || {}; return c.ap === undefined || c.pv || man.has(a.uid) || RE.has(a.uid) || (c.ap === false && c.nr && reciente(a)); });
  let docs;
  if (GRAND || hora) docs = (await db.collection("users").get()).docs;
  else docs = leer.length ? await db.getAll(...leer.map(a => db.doc("users/" + a.uid))) : [];
  const U = new Map(); for (const d of docs) if (d.exists) U.set(d.id, { uid: d.id, ...d.data() });
  const meta = db.doc("push_meta/aprob"), mt = (await meta.get()).data() || {}, avisados = mt.n || {};
  const mem = (GRAND || hora) ? miembros(team, [...U.values()]) : null;
  const ADM_MAIL = ["garciagoedwin@gmail.com", "actionleadersoficial@gmail.com", "edwing.go@gmail.com"];
  const ADM = A.filter(a => ADM_MAIL.includes(String(a.email || "").toLowerCase())).map(a => a.uid);
  let nAp = 0, nAuto = 0, nMan = 0, nNo = 0, nPend = 0, nSis = 0, nCl = 0, nPlan = 0, nInv = 0, nConf = 0, nVen = 0, nSinH = 0; const avisos = [], aprobados = [], vencidos = [], nuevosSH = []; let nRev = 0, nDup = 0; const dupU = new Set();
  const okU = new Set(A.filter(x => (x.customClaims || {}).ap === true).map(x => x.uid));
  const dupDe = async (a, u) => { const r = u.registro || {}, e = String(r.correo || u.email || "").trim().toLowerCase(), w = String(r.whatsapp || "").replace(/\D/g, ""), Q = [];
    if (e.includes("@")) { Q.push(db.collection("users").where("registro.correo", "==", e).limit(5).get(), db.collection("users").where("email", "==", e).limit(5).get()); }
    if (w.length >= 8) Q.push(db.collection("users").where("registro.whatsapp", "==", w).limit(5).get());
    const R = await Promise.all(Q).catch(() => []); return R.some(q => q.docs.some(d => d.id !== a.uid && okU.has(d.id))); };
  const PV_MS = 72 * 3600e3; // 11 nov (Edwin): entrada por invitación con paquete = provisional 72 h hasta aparecer en inCruises
  // 10 nov (Edwin): el paquete real sale del correo de activación de inCruises (team.json activaciones[].paquete), reconocido por la huella del correo o WhatsApp.
  // Manda sobre lo que puso el patrocinador; no toca lo que cambió un admin (planPor "admin") ni lo del reporte mensual (planPor "reporte").
  const actK = new Map(); for (const a of [...(team.activaciones || [])].sort((x, y) => Date.parse(x.fecha || 0) - Date.parse(y.fecha || 0))) { const pq = /premium/i.test(a.paquete || "") ? "Premium" : /starter/i.test(a.paquete || "") ? "Starter" : /classic/i.test(a.paquete || "") ? "Classic" : ""; if (!pq) continue; if (a.ek) actK.set(a.ek, pq); if (a.wk) actK.set(a.wk, pq); }
  for (const a of A) {
    // ap: true = aprobada · false = en revisión / rechazada / sin registro (más de 2 h) · sin marcar = cuenta recién creada (aún sin veredicto)
    if (!(GRAND || hora) && !leer.includes(a)) continue;
    const c = a.customClaims || {}, u = U.get(a.uid); let ap = c.ap, sis = !!c.sis, apE = null, pv = c.pv || 0, rv = !!c.rv, apX;
    const reg = !!(u && u.registro && u.registro.nombre), vieja = Date.now() - Date.parse(a.metadata.creationTime) > 2 * 3600e3;
    const enH = !!(u && [a.emailVerified ? ahKe(a.email) : null, ...claveDe(u)].filter(Boolean).some(x => H.has(x)));
    // Solo por datos que escribió la persona (no por su correo de Google verificado): si otra cuenta aprobada ya usa ese correo/WhatsApp → revisión.
    const porCuenta = !!(a.emailVerified && H.has(ahKe(a.email)));
    // Provisional por invitación: se confirma al aparecer en inCruises; a las 72 h sin aparecer → revisión (solo un admin la reabre).
    // 11 nov: admin revisa una cuenta YA aprobada que no aparece en inCruises (tarjeta «Aprobadas sin inCruises»): ok → se queda; no → revisión.
    const m0 = man.get(a.uid), adm0 = !!(m0 && ADM.includes(m0.por)); let shOk = false;
    if (ap === true && adm0 && u) { if (m0.ok === true) shOk = true; else if (m0.ok === false) { ap = false; pv = 0; rv = true; apE = "p"; apX = "adm"; nRev++; } }
    if (ap === true && pv && u) { if (enH) { pv = 0; nConf++; } else if (Date.now() > pv) { ap = false; pv = 0; rv = true; apE = "p"; apX = "inv"; nVen++; vencidos.push(u); } }
    let apSH, apOkA; // undefined = sin cambio
    if (u && reg && !ADM_MAIL.includes(String(a.email || "").toLowerCase())) {
      if (ap === true && !pv && !enH && !shOk && !c.okA) { nSinH++; if ((GRAND || hora) && !u.apSH) { apSH = { t: Date.now() }; nuevosSH.push(u); } }
      else if (u.apSH) apSH = null;
      if (shOk) apOkA = Date.now(); }
    if (ap !== true && !apX) {
      const m = man.get(a.uid), mAdm = m && ADM.includes(m.por);
      if (m && m.ok === true && (!rv || mAdm)) { ap = true; nMan++; apE = "ok"; rv = false; apX = null; }
      else if (m && m.ok === false) { ap = false; apE = "no"; nNo++; }
      else if (u && u.apE === "no") { ap = false; nNo++; }
      else if (reg && GRAND) { ap = true; apE = "ok"; }
      else if (reg && enH && !porCuenta && await dupDe(a, u)) { ap = false; apE = "p"; apX = "dup"; nDup++; dupU.add(a.uid); if (!avisados[a.uid]) avisos.push(u); }
      else if (reg && enH) { ap = true; nAuto++; apE = "ok"; rv = false; apX = null; } /* con contraseña solo cuenta el correo ya confirmado */
      else if (reg && !rv) { const r = u.registro, sp = A.find(x => x.uid === r.patrocinadorUid);
        // Invitación con paquete del patrocinador (invitaciones/{invId}): acceso al instante, provisional.
        const spOk = sp && ((sp.customClaims || {}).ap === true || ADM_MAIL.includes(String(sp.email || "").toLowerCase()));
        if (r.invId && spOk) { const iv = await db.doc("invitaciones/" + r.invId).get().then(d => d.exists ? d.data() : null).catch(() => null);
          if (iv && iv.plan && iv.by === r.patrocinadorUid && (!iv.usadoPor || iv.usadoPor === a.uid)) { ap = true; apE = "ok"; pv = Date.now() + PV_MS; nInv++; } } }
      if (ap !== true && reg && !apE && !(u && u.apE === "no")) { ap = false; apE = "p"; nPend++; if (!avisados[a.uid]) avisos.push(u); }
      if (ap !== true && !reg && vieja) ap = false;
      if (ap === true && !pv) aprobados.push(a.uid);
    }
    if (mem) sis = mem.uids.has(a.uid);
    if (ap === true) nAp++; if (sis) nSis++;
    const nr = ap === false && !reg;
    const okA = !!c.okA || shOk;
    if (ap !== c.ap || sis !== !!c.sis || nr !== !!c.nr || pv !== (c.pv || 0) || rv !== !!c.rv || okA !== !!c.okA) { nCl++; if (!DRY) { const nc = { ...c, sis }; if (ap === undefined) delete nc.ap; else nc.ap = ap; if (nr) nc.nr = true; else delete nc.nr; if (pv) nc.pv = pv; else delete nc.pv; if (rv) nc.rv = true; else delete nc.rv; if (okA) nc.okA = true; else delete nc.okA; await auth.setCustomUserClaims(a.uid, nc); } }
    if (u && !DRY && ((apE && u.apE !== apE) || (apX !== undefined && (u.apX || null) !== apX) || apSH !== undefined || apOkA || u.apRe)) await db.doc("users/" + a.uid).set({ ...(u.apRe ? { apRe: FieldValue.delete() } : {}), ...(apE ? { apE, apT: Date.now() } : {}), ...(apX !== undefined ? { apX: apX || FieldValue.delete() } : {}), ...(apSH !== undefined ? { apSH: apSH || FieldValue.delete() } : {}), ...(apOkA ? { apOkA } : {}) }, { merge: true });
    if (u && reg && !["admin", "reporte"].includes(u.registro.planPor)) { const ks = [a.emailVerified ? ahKe(a.email) : null, ...claveDe(u)].filter(Boolean); const pq = ks.map(k => actK.get(k)).find(Boolean);
      if (pq && pq !== u.registro.plan) { nPlan++; if (!DRY) await db.doc("users/" + a.uid).set({ registro: { plan: pq, planPor: "inCruises", planCambio: new Date().toISOString() } }, { merge: true }); } }
  }
  console.log("invitación", nInv, "confirmadas", nConf, "a revisión (72 h sin inCruises)", nVen, (GRAND || hora) ? "aprobadas sin huella de inCruises " + nSinH + " (nuevas " + nuevosSH.length + ")" : "", "pasadas a revisión por admin", nRev, "correo/WhatsApp de otra cuenta", nDup);
  console.log("cuentas", A.length, "docs", U.size, "aprobadas", nAp, "auto", nAuto, "manual", nMan, "rechazadas", nNo, "pendientes", nPend, "miembros", nSis, "claims cambiados", nCl, "planes corregidos", nPlan, DRY ? "(prueba)" : "");
  if (mem) { console.log("filas de liderazgo sin cuenta:", mem.sin.length); if (!DRY) await db.doc("team/sisU").set({ sin: mem.sin, n: mem.uids.size, t: Date.now() }); }
  if (DRY) return;
  for (const d of M) await d.ref.delete();
  // Avisos push: pendientes → admins + patrocinador (una vez); aprobados → al socio
  const P = {}; const need = new Set([...ADM, ...aprobados, ...[...avisos, ...vencidos].map(u => (u.registro || {}).patrocinadorUid).filter(Boolean)]);
  if (need.size) { const pd = await db.getAll(...[...need].map(id => db.doc("push/" + id))); pd.forEach(d => { if (d.exists) P[d.id] = d.data(); }); }
  const env = async (uid, title, body, v) => { const p = P[uid]; if (!p || !p.tk) return; try {
    await fcm.send({ token: p.tk, notification: { title, body }, webpush: { fcmOptions: { link: "https://actionleadersplus.com/?av=" + v }, notification: { icon: "https://actionleadersplus.com/icon-192.png" } } });
    await db.doc("push/" + uid).set({ h: [...(p.h || []), { t: Date.now(), ti: title, b: body, v }].slice(-30) }, { merge: true }); } catch (e) { console.log("push falló", e.code || "error"); } };
  for (const u of avisos) { const n = String((u.registro || {}).nombre || "Alguien").split(" ").slice(0, 2).join(" "), sp = (u.registro || {}).patrocinadorUid;
    const t = "📝 " + n + " pide entrar a la app", b = dupU.has(u.uid) ? "Usa el correo o WhatsApp de inCruises de OTRA cuenta de la app. Revise antes de aprobarlo." : "No reconocimos su correo ni su WhatsApp de inCruises. Toque para aprobarlo o rechazarlo.";
    for (const id of new Set([...ADM, sp].filter(Boolean))) await env(id, t, b, "apr"); avisados[u.uid] = Date.now(); }
  for (const u of vencidos) { const n = String((u.registro || {}).nombre || "Alguien").split(" ").slice(0, 2).join(" "), sp = (u.registro || {}).patrocinadorUid;
    const t = "⚠️ " + n + " no aparece en inCruises", b = "Entró con invitación hace 3 días y no encontramos su correo ni su WhatsApp. Su cuenta pasó a revisión; solo un administrador puede reabrirla.";
    for (const id of new Set([...ADM, sp].filter(Boolean))) await env(id, t, b, "apr"); avisados[u.uid] = Date.now(); }
  if (nuevosSH.length) { const n1 = String((nuevosSH[0].registro || {}).nombre || "Alguien").split(" ").slice(0, 2).join(" ");
    const t = nuevosSH.length === 1 ? "🔎 " + n1 + " no aparece en inCruises" : "🔎 " + nuevosSH.length + " cuentas aprobadas no aparecen en inCruises", b = "Tienen acceso a la app, pero no encontramos su correo ni su WhatsApp en inCruises. Toque para revisarlas.";
    for (const id of ADM) await env(id, t, b, "sinh"); }
  for (const uid of aprobados) if (!GRAND) await env(uid, "✅ ¡Su cuenta fue aprobada!", "Ya puede usar toda la app. Ciérrela y vuelva a abrirla.", "inicio");
  if (avisos.length || vencidos.length) await meta.set({ n: avisados }, { merge: true });
}
if (process.argv[1] && process.argv[1].endsWith("aprobar.mjs")) main().catch(e => { console.error("ERROR", e.code || e.message); process.exit(1); });
