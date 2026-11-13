// Arranque de team/reco (13 nov, Edwin): mes en que cada uno llegó por primera vez a Team Leader / a cada rango.
// Noviembre 2026 = arranque: todos los Team Leader de hoy y los rangos detectados desde el 12 nov quedan como "2026-11". Solo conteos en el log.
import admin from "firebase-admin"; import fs from "fs";
import { recoCambios, rangoUsr, rkIdx, tlPts } from "./enviar.mjs";
admin.initializeApp({ credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SA)) });
const db = admin.firestore(), MES = "2026-11";
const NJ = JSON.parse(fs.readFileSync("../../data/team.json", "utf8")), meta = +((NJ.config || {}).tl || {}).meta || 500;
const users = (await db.collection("users").get()).docs.map(d => ({ uid: d.id, ...d.data() })).filter(u => (u.registro || {}).nombre);
const ref = db.doc("team/reco"), H = ((await ref.get()).data() || {}).h || {}, up = {};
const pon = (uid, rk) => { if ((H[uid] || {})[rk]) return; up[uid] = Object.assign({}, up[uid], { [rk]: MES }); };
let tl = 0, rg = 0;
for (const u of users) { const n = u.registro.nombre, r = rkIdx(rangoUsr(u, NJ)); if (r < 2 && tlPts(NJ, n) >= meta) { pon(u.uid, 1); tl++; } }
const S = ((await db.doc("push_meta/reco").get()).data() || {}).s || [];
for (const k of S) { const [uid, rk, m] = k.split(":"); if (+rk >= 2) { pon(uid, +rk); rg++; } else if (+rk === 1 && (!m || m === MES)) pon(uid, 1); }
await ref.set({ h: up, t: Date.now() }, { merge: true });
console.log("Team Leader hoy:", tl, "· rangos detectados en noviembre:", rg, "· cuentas guardadas:", Object.keys(up).length);
