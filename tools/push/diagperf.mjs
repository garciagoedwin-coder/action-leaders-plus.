// Diagnóstico (13 nov): cuentas con nombre «Edwin García». Solo datos no personales en el log (sin correos completos).
import admin from "firebase-admin";
admin.initializeApp({ credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SA)) });
const db = admin.firestore(), ADM = ["garciagoedwin@gmail.com", "actionleadersoficial@gmail.com", "edwing.go@gmail.com"];
const nrm = s => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const U = (await db.collection("users").get()).docs.map(d => ({ uid: d.id, ...d.data() }));
const E = U.filter(u => /edwin/.test(nrm((u.registro || {}).nombre)) && /garcia/.test(nrm((u.registro || {}).nombre)));
for (const u of E) { const r = u.registro || {}, em = String(u.email || "").toLowerCase(), pat = U.find(x => x.uid === r.patrocinadorUid);
  console.log("cuenta", u.uid.slice(0, 6), "· admin#", ADM.indexOf(em), "· nombre", r.nombre, "· patrocinador:", pat ? (pat.registro || {}).nombre + " (" + pat.uid.slice(0, 6) + ", admin#" + ADM.indexOf(String(pat.email || "").toLowerCase()) + ")" : "-", "· directos:", U.filter(x => (x.registro || {}).patrocinadorUid === u.uid).length, "· en línea de:", U.filter(x => ((x.registro || {}).linea || []).includes(u.uid)).length); }
