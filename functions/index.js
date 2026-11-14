// Aprobación INSTANTÁNEA de cuentas (10–12 nov 2026, Edwin). Firebase Cloud Functions (1.ª gen).
// MISMA LÓGICA que tools/push/aprobar.mjs (si cambia una, cambiar la otra):
//  - invitación con paquete (registro.invId) del patrocinador aprobado → entra al instante PROVISIONAL (claim pv = +72 h);
//  - huella solo por datos escritos por la persona y otra cuenta aprobada ya usa ese correo/WhatsApp → revisión (apX "dup");
//  - apRe (la persona o el admin corrigió el correo de inCruises) → se revisa al instante;
//  - aprob/{uid}: con claim rv solo un admin reabre; admin ok = okA (sale de «sin inCruises»); admin no sobre cuenta aprobada = revisión.
//  - users/{uid} escrito con registro.nombre y sin apE → busca la huella de su correo/WhatsApp en los datos de inCruises
//    (team.json, red.enc, ahorro.enc, nuevos.enc publicados en actionleadersplus.com; la llave sale de Firestore).
//    Reconocido → claims ap:true + apE "ok" en segundos. No reconocido → apE "p" + aviso a admins y patrocinador.
//  - aprob/{uid} creado por el patrocinador o un admin → se aplica al instante.
// tools/push/aprobar.mjs (GitHub, cada ~10–40 min) sigue de respaldo: miembros del sistema, planes y re-chequeos.
// Logs: solo conteos/estados, nunca nombres, correos ni teléfonos.
const functions = require("firebase-functions/v1");
const admin = require("firebase-admin");
const crypto = require("node:crypto");
admin.initializeApp();
const db = admin.firestore(), auth = admin.auth();
const SITE = "https://actionleadersplus.com/";
const ADM_MAIL = ["garciagoedwin@gmail.com", "actionleadersoficial@gmail.com", "edwing.go@gmail.com"];

const ahF = x => { let h = 0x811c9dc5; for (const b of Buffer.from("alp|" + x, "utf8")) { h = (h ^ b) >>> 0; h = Math.imul(h, 0x01000193) >>> 0; } return h.toString(16).padStart(8, "0").slice(0, 6); };
const ahKe = e => { e = String(e || "").trim().toLowerCase(); return e.includes("@") ? ahF("e:" + e) : null; };
const ahKw = w => { const d = String(w || "").replace(/\D/g, ""); return d.length >= 8 ? ahF("w:" + d.slice(-8)) : null; };

function dec(key, txt) { try { const raw = Buffer.from(String(txt).trim(), "base64");
  const dc = crypto.createDecipheriv("aes-256-gcm", key, raw.subarray(0, 12)); dc.setAuthTag(raw.subarray(raw.length - 16));
  return JSON.parse(Buffer.concat([dc.update(raw.subarray(12, raw.length - 16)), dc.final()]).toString("utf8")); } catch (e) { return null; } }
const bajar = async f => { const r = await fetch(SITE + f + "?t=" + Date.now(), { cache: "no-store" }); if (!r.ok) throw new Error("http " + r.status + " " + f); return r.text(); };

// Huellas conocidas (caché 5 min por instancia)
let HC = null, HT = 0;
async function huellas() {
  if (HC && Date.now() - HT < 5 * 60e3) return HC;
  const k = ((await db.doc("evento/sps26/priv/llave").get()).data() || {}).k; if (!k) throw new Error("sin llave");
  const key = Buffer.from(k.replace(/-/g, "+").replace(/_/g, "/"), "base64");
  const [tj, re, nu, ah] = await Promise.all([bajar("data/team.json"), bajar("data/red.enc").catch(() => ""), bajar("data/nuevos.enc").catch(() => ""), bajar("data/ahorro.enc").catch(() => "")]);
  const team = JSON.parse(tj), red = re && dec(key, re), nuevos = nu && dec(key, nu), ahorro = ah && dec(key, ah);
  const S = new Set(), add = x => { if (x) S.add(x); };
  for (const a of team.activaciones || []) { add(a.ek); add(a.wk); }
  for (const x of Object.keys(((team.config || {}).ahorro || {}).k || {})) add(x);
  for (const r of (red && red.rows) || []) { add(r.ek); add(r.wk); }
  for (const r of (ahorro && ahorro.rows) || []) for (const x of r.k || []) add(x);
  for (const c of Object.values((nuevos && nuevos.c) || {})) { add(ahKe(c.e)); add(ahKw(c.w)); }
  HC = S; HT = Date.now(); return S;
}

async function push(uids, title, body, v) {
  const ids = [...new Set(uids.filter(Boolean))]; if (!ids.length) return;
  const docs = await db.getAll(...ids.map(id => db.doc("push/" + id)));
  for (const d of docs) { const p = d.exists ? d.data() : null; if (!p || !p.tk) continue;
    try { await admin.messaging().send({ token: p.tk, notification: { title, body }, webpush: { fcmOptions: { link: SITE + "?av=" + v }, notification: { icon: SITE + "icon-192.png" } } });
      await d.ref.set({ h: [...(p.h || []), { t: Date.now(), ti: title, b: body, v }].slice(-30) }, { merge: true }); } catch (e) { console.log("push falló", e.code || "error"); } }
}
let ADMC = null;
async function admins() { if (ADMC) return ADMC; const r = await auth.getUsers(ADM_MAIL.map(email => ({ email }))); ADMC = r.users.map(u => u.uid); return ADMC; }
// Cambia claims: ch = {clave: valor | null (borrar)}
async function claims(a, ch) { const c = a.customClaims || {}, nc = { ...c }; let cambio = false;
  for (const [k, v] of Object.entries(ch)) { if (v === null || v === undefined || v === false && k !== "ap") { if (k in nc) { delete nc[k]; cambio = true; } } else if (nc[k] !== v) { nc[k] = v; cambio = true; } }
  if (cambio) await auth.setCustomUserClaims(a.uid, nc); }
const DEL = admin.firestore.FieldValue.delete();
const okU = async uid => { const a = await auth.getUser(uid).catch(() => null); return !!(a && (a.customClaims || {}).ap === true); };
// ¿Otra cuenta APROBADA ya usa el correo o WhatsApp que escribió esta persona?
async function dupDe(uid, u) { const r = u.registro || {}, e = String(r.correo || u.email || "").trim().toLowerCase(), w = String(r.whatsapp || "").replace(/\D/g, ""), Q = [];
  if (e.includes("@")) Q.push(db.collection("users").where("registro.correo", "==", e).limit(5).get(), db.collection("users").where("email", "==", e).limit(5).get());
  if (w.length >= 8) Q.push(db.collection("users").where("registro.whatsapp", "==", w).limit(5).get());
  const R = await Promise.all(Q).catch(() => []); const ids = new Set(); R.forEach(q => q.docs.forEach(d => { if (d.id !== uid) ids.add(d.id); }));
  for (const id of ids) if (await okU(id)) return true; return false; }
async function pedir(uid, u, dup) { const meta = db.doc("push_meta/aprob"), av = ((await meta.get()).data() || {}).n || {}; if (av[uid]) return;
  const n = String(u.registro.nombre).split(" ").slice(0, 2).join(" ");
  await push([...(await admins()), u.registro.patrocinadorUid], "📝 " + n + " pide entrar a la app", dup ? "Usa el correo o WhatsApp de inCruises de OTRA cuenta de la app. Revise antes de aprobarlo." : "No reconocimos su correo ni su WhatsApp de inCruises. Toque para aprobarlo o rechazarlo.", "apr");
  await meta.set({ n: { [uid]: Date.now() } }, { merge: true }); }

exports.aprobarAlRegistrar = functions.runWith({ memory: "256MB", timeoutSeconds: 60 }).firestore.document("users/{uid}").onWrite(async (ch, ctx) => {
  const u = ch.after.exists ? ch.after.data() : null; const uid = ctx.params.uid;
  if (!u || !u.registro || !u.registro.nombre || u.del) return;
  const re = !!u.apRe; if (u.apE && !re) return;                          // ya tiene veredicto y nada que revisar: 0 lecturas
  if (u.apE === "no") { if (re) await ch.after.ref.set({ apRe: DEL }, { merge: true }); return; }
  const a = await auth.getUser(uid).catch(() => null); if (!a) return;
  const c = a.customClaims || {}, ref = ch.after.ref;
  if (ADM_MAIL.includes(String(a.email || "").toLowerCase())) { if (re) await ref.set({ apRe: DEL }, { merge: true }); return; }
  const H = await huellas(), r = u.registro;
  const porCuenta = !!(a.emailVerified && H.has(ahKe(a.email)));
  const enH = porCuenta || [ahKe(r.correo), ahKe(u.email), ahKw(r.whatsapp)].filter(Boolean).some(x => H.has(x));
  const okH = enH && (porCuenta || !(await dupDe(uid, u)));
  if (re) {                                                                // corrigió su correo de inCruises (la persona o el admin)
    if (okH) { await claims(a, { ap: true, pv: null, rv: null, nr: null }); await ref.set({ apE: "ok", apT: Date.now(), apX: DEL, apSH: DEL, apRe: DEL }, { merge: true }); console.log("corrección confirmada"); return; }
    if (u.apSH && !u.apSH.c) { await ref.set({ apSH: { ...u.apSH, c: Date.now() }, apRe: DEL }, { merge: true });
      await push(await admins(), "📧 " + String(r.nombre).split(" ").slice(0, 2).join(" ") + " corrigió su correo, pero no aparece", "Revise en la lista de aprobadas sin inCruises si es socio o cliente.", "sinh"); console.log("corrigió sin aparecer"); return; }
    await ref.set({ apRe: DEL }, { merge: true }); return; }
  if (c.ap === true) { await ref.set({ apE: "ok", apT: Date.now() }, { merge: true }); return; }
  if (okH) { await claims(a, { ap: true, nr: null }); await ref.set({ apE: "ok", apT: Date.now() }, { merge: true }); console.log("aprobada al instante"); return; }
  if (enH) { await claims(a, { ap: false, nr: null }); await ref.set({ apE: "p", apT: Date.now(), apX: "dup" }, { merge: true }); await pedir(uid, u, true); console.log("revisión: dato de otra cuenta"); return; }
  if (!c.rv && r.invId && r.patrocinadorUid) {                            // invitación con paquete → al instante, provisional 72 h
    const iv = await db.doc("invitaciones/" + r.invId).get().then(d => d.exists ? d.data() : null).catch(() => null);
    const sp = await auth.getUser(r.patrocinadorUid).catch(() => null);
    const spOk = sp && ((sp.customClaims || {}).ap === true || ADM_MAIL.includes(String(sp.email || "").toLowerCase()));
    if (iv && iv.plan && iv.by === r.patrocinadorUid && (!iv.usadoPor || iv.usadoPor === uid) && spOk) {
      await claims(a, { ap: true, pv: Date.now() + 72 * 3600e3, nr: null }); await ref.set({ apE: "ok", apT: Date.now() }, { merge: true }); console.log("invitación: provisional"); return; } }
  await claims(a, { ap: false, nr: null }); await ref.set({ apE: "p", apT: Date.now() }, { merge: true }); await pedir(uid, u, false);
  console.log("en revisión");
});

exports.aprobarManual = functions.runWith({ memory: "256MB", timeoutSeconds: 60 }).firestore.document("aprob/{uid}").onCreate(async (snap, ctx) => {
  const m = snap.data() || {}, uid = ctx.params.uid; if (typeof m.ok !== "boolean") return;
  const a = await auth.getUser(uid).catch(() => null); if (!a) { await snap.ref.delete(); return; }
  const c = a.customClaims || {}, adm = (await admins()).includes(m.por), uref = db.doc("users/" + uid);
  if (m.ok) {
    if (c.rv && !adm) { await snap.ref.delete(); console.log("ignorada: solo admin reabre"); return; }
    await claims(a, { ap: true, rv: null, pv: null, nr: null, ...(adm ? { okA: true } : {}) });
    await uref.set({ apE: "ok", apT: Date.now(), apX: DEL, ...(adm ? { apSH: DEL, apOkA: Date.now() } : {}) }, { merge: true });
    await snap.ref.delete();
    if (c.ap !== true) await push([uid], "✅ ¡Su cuenta fue aprobada!", "Ya puede usar toda la app. Ciérrela y vuelva a abrirla.", "inicio");
    console.log("manual aprobada"); return; }
  if (c.ap === true) {                                                     // cuenta ya aprobada: solo un admin la pasa a revisión
    if (adm) { await claims(a, { ap: false, rv: true, pv: null }); await uref.set({ apE: "p", apT: Date.now(), apX: "adm" }, { merge: true }); console.log("admin: a revisión"); }
    await snap.ref.delete(); return; }
  await claims(a, { ap: false, nr: null }); await uref.set({ apE: "no", apT: Date.now() }, { merge: true }); await snap.ref.delete();
  console.log("manual rechazada");
});

// Presentación virtual v2 «Su próximo destino» (viaje.html, 13 nov 2026): MODO COPILOTO.
// users/{uid}/sala/{id} con id "v_…" → aviso al socio (uid) en el momento en que el prospecto
// aborda, responde cada pregunta, termina o toca un botón. Un solo aviso por escritura (el más importante).
// Campos: n (nombre), r1 (valor), pais (destino), resp (lo que más conectó), pulso ("1".."10"), como (registro|whatsapp|lider), motivo ("fin" = terminó).
exports.salaCopiloto = functions.runWith({ memory: "256MB", timeoutSeconds: 30 }).firestore.document("users/{uid}/sala/{id}").onWrite(async (ch, ctx) => {
  if (!String(ctx.params.id).startsWith("v_") || !ch.after.exists) return;
  const a = ch.after.data() || {}, b = ch.before.exists ? ch.before.data() || {} : null;
  // Índice para los recordatorios (enviar.mjs salapend): quién no terminó a las 24 h y a quién le quedan 3 h de su beneficio.
  try { const fin = (+a.pct || 0) >= 100 || a.motivo === "fin" || /^\d+$/.test(String(a.pulso || "")), ref = db.doc("salaPend/" + ctx.params.uid + "_" + ctx.params.id);
    const o = { u: ctx.params.uid, id: ctx.params.id, n: String(a.n || "").slice(0, 60), c: a.c || "", t0: a.t0 || Date.now(), t: a.t || Date.now(), pct: +a.pct || 0, pulso: +a.pulso || 0, como: a.como || "", fin };
    if (String(a.motivo || "").startsWith("cap:")) o.cap = String(a.motivo).slice(4, 40);
    if (fin && !(b && ((+b.pct || 0) >= 100 || b.motivo === "fin" || /^\d+$/.test(String(b.pulso || ""))))) o.tf = Date.now();
    await ref.set(o, { merge: true }); } catch (e) { console.log("salaPend falló", e.code || "error"); }
  const n = String(a.n || "Su prospecto").trim().split(/\s+/)[0], nv = k => a[k] && (!b || a[k] !== b[k]);
  const VAL = { viajar: "🧳 viajar más", ingresos: "💰 generar ingresos", ambas: "⭐ viajar y generar ingresos" };
  let m = null;
  if (nv("como")) m = a.como === "registro" ? ["🛳️ " + n + " tocó «Crear mi cuenta»", "Está por registrarse. Escríbale ahora para ayudarle con el pago."]
    : a.como === "lider" ? ["📞 " + n + " quiere hablar con un líder", "Pidió una llamada. Arme la llamada de 3 hoy mismo."]
    : ["💬 " + n + " le está escribiendo", "Tocó «Escribirle» al final de la presentación. Revise su WhatsApp."];
  else if (nv("pulso")) { const p = +a.pulso || 0; m = p >= 8 ? ["🔥 ¡" + n + " terminó! Está lista/o: " + p + "/10", "Escríbale en los próximos 5 minutos con su link de registro."]
    : p >= 6 ? ["🟠 " + n + " está casi: " + p + "/10", "Le falta información. Escríbale ahora y ofrézcale una llamada con un líder."]
    : ["💭 " + n + " lo está pensando: " + p + "/10", "Escríbale con calma para resolver sus dudas."]; }
  else if (nv("resp")) m = ["💡 A " + n + " lo que más le conectó: " + (VAL[a.resp] || a.resp), "Va en el cierre de la presentación."];
  else if (nv("pais")) m = ["🗺️ " + n + " sueña con conocer " + a.pais, "Minuto 2:20 de la presentación. Úselo en su seguimiento."];
  else if (nv("r1")) m = ["⭐ A " + n + " le atrae: " + (VAL[a.r1] || a.r1), "Acaba de empezar la presentación."];
  else if (!b) m = ["👀 " + n + " abordó su presentación", "La está viendo ahora. Le avisamos cada vez que responda."];
  else if (nv("motivo") && a.motivo === "fin" && !a.pulso) m = ["✅ " + n + " terminó la presentación", "Escríbale ahora."];
  if (!m) return;
  await push([ctx.params.uid], m[0], m[1], "sala");
  console.log("copiloto", ctx.params.id.slice(0, 4), m[0].slice(0, 2));
});
