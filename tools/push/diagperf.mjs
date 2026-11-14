// Arreglo puntual (13 nov, Edwin): su patrocinador real (Santiago, Puerto Rico) no usa la app → registro.patExt en SU cuenta de socio
// (edwing.go@). Solo marca el paso «Conectado con su patrocinador» del Inicio Rápido; no cambia línea, rankings ni duplicación.
import admin from "firebase-admin";
admin.initializeApp({ credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SA)) });
const db = admin.firestore();
const U = (await db.collection("users").where("email", "==", "edwing.go@gmail.com").get()).docs;
let n = 0;
for (const d of U) { await d.ref.update({ "registro.patExt": "Santiago" }); n++; }
console.log("cuentas actualizadas:", n);
