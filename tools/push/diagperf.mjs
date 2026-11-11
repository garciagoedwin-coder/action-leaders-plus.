// Diagnóstico (10 nov): compromisos guardados con "no" pegado (bug de merge). Solo conteos.
import admin from "firebase-admin";
admin.initializeApp({credential:admin.credential.cert(JSON.parse(process.env.FIREBASE_SA))});
const db=admin.firestore();
const U=(await db.collection("users").get()).docs.map(d=>d.data()).filter(u=>u.comp&&u.comp.mes==="2026-11");
console.log("compromisos nov",U.length,"· dijeron no (sin datos)",U.filter(u=>u.comp.no&&!u.comp.rango&&u.comp.act==null).length,"· AFECTADOS (no + datos de compromiso)",U.filter(u=>u.comp.no&&(u.comp.rango||u.comp.act!=null)).length);
