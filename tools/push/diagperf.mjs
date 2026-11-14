// Conteo (14 nov, Edwin): cuántos escucharon el audio de Santiago Santiago. Solo números (los logs son públicos).
import admin from "firebase-admin";
admin.initializeApp({ credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SA)) });
const db = admin.firestore();
const S = await db.collection("constancia").get();
let p = 0, f = 0;
S.forEach(d => { const a = ((d.data().aud) || {})["santiago-1"]; if (a) { p++; if (a.f) f++; } });
console.log("abrieron:", p, "· completo:", f, "· de", S.size);
