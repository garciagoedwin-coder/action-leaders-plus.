// Aprobación INSTANTÁNEA de cuentas (10 nov 2026, Edwin). Firebase Cloud Functions (1.ª gen).
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
async function admins() { const r = await auth.getUsers(ADM_MAIL.map(email => ({ email }))); return r.users.map(u => u.uid); }
async function setAp(a, ap) { const c = a.customClaims || {}; const nc = { ...c, ap }; delete nc.nr; if (c.ap !== ap || c.nr) await auth.setCustomUserClaims(a.uid, nc); }

exports.aprobarAlRegistrar = functions.runWith({ memory: "256MB", timeoutSeconds: 60 }).firestore.document("users/{uid}").onWrite(async (ch, ctx) => {
  const u = ch.after.exists ? ch.after.data() : null; const uid = ctx.params.uid;
  if (!u || !u.registro || !u.registro.nombre || u.apE) return;            // ya tiene veredicto o aún no se registra: nada (0 lecturas)
  const a = await auth.getUser(uid).catch(() => null); if (!a) return;
  if ((a.customClaims || {}).ap === true) { await ch.after.ref.set({ apE: "ok", apT: Date.now() }, { merge: true }); return; }
  if (ADM_MAIL.includes(String(a.email || "").toLowerCase())) return;
  const ks = [a.emailVerified ? ahKe(a.email) : null, ahKe(u.registro.correo), ahKw(u.registro.whatsapp)].filter(Boolean);
  const H = await huellas();
  if (ks.some(x => H.has(x))) {
    await setAp(a, true); await ch.after.ref.set({ apE: "ok", apT: Date.now() }, { merge: true });
    console.log("aprobada al instante"); return;
  }
  // No reconocida → en revisión + aviso (una vez) a admins y patrocinador
  await setAp(a, false); await ch.after.ref.set({ apE: "p", apT: Date.now() }, { merge: true });
  const meta = db.doc("push_meta/aprob"), av = ((await meta.get()).data() || {}).n || {};
  if (!av[uid]) { const n = String(u.registro.nombre).split(" ").slice(0, 2).join(" ");
    await push([...(await admins()), u.registro.patrocinadorUid], "📝 " + n + " pide entrar a la app", "No reconocimos su correo ni su WhatsApp de inCruises. Toque para aprobarlo o rechazarlo.", "apr");
    await meta.set({ n: { [uid]: Date.now() } }, { merge: true }); }
  console.log("en revisión");
});

exports.aprobarManual = functions.runWith({ memory: "256MB", timeoutSeconds: 60 }).firestore.document("aprob/{uid}").onCreate(async (snap, ctx) => {
  const m = snap.data() || {}, uid = ctx.params.uid; if (typeof m.ok !== "boolean") return;
  const a = await auth.getUser(uid).catch(() => null); if (!a) { await snap.ref.delete(); return; }
  await setAp(a, m.ok); await db.doc("users/" + uid).set({ apE: m.ok ? "ok" : "no", apT: Date.now() }, { merge: true });
  await snap.ref.delete();
  if (m.ok) await push([uid], "✅ ¡Su cuenta fue aprobada!", "Ya puede usar toda la app. Ciérrela y vuelva a abrirla.", "inicio");
  console.log(m.ok ? "manual aprobada" : "manual rechazada");
});
