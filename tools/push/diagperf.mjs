// Diagnóstico (14 nov, likes): cuántas constancias no pasarían constOk de las reglas (bloquearía likes/comentarios). Solo números.
import admin from "firebase-admin";
admin.initializeApp({ credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SA)) });
const db = admin.firestore();
const L = { racha: 31, semDias: 7, semComp: 7, semPts: 35, pSemPts: 35, mesDias: 31, mesComp: 31, mesMejor: 31, mesPts: 155, semPres: 500, mesPres: 2000, hoy: 100 };
const S = await db.collection("constancia").get();
let malos = 0, likes = 0, conLike = 0; const campos = {};
S.forEach(d => { const x = d.data(); let m = false;
  for (const k in L) { const v = x[k]; if (k in x && v != null && !(typeof v === "number" && v >= 0 && v <= L[k])) { m = true; campos[k] = (campos[k] || 0) + 1; } }
  if (m) malos++; const n = Object.values(x.npl || {}).filter(Boolean).length; likes += n; if (n) conLike++; });
console.log("constancias:", S.size, "· fallarían la regla:", malos, "· campos:", JSON.stringify(campos), "· likes dados:", likes, "· socios que dieron like:", conLike);
