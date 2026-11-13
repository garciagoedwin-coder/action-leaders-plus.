// Arreglo puntual (13 nov, Edwin): a una cuenta se le puso por error el correo de inCruises de otra. Se quita solo de esa cuenta. Solo imprime conteos.
import admin from "firebase-admin";import {createHash} from "crypto";
admin.initializeApp({credential:admin.credential.cert(JSON.parse(process.env.FIREBASE_SA))});
const db=admin.firestore(),FV=admin.firestore.FieldValue;
const nrm=s=>String(s||"").normalize("NFD").replace(/[̀-ͯ]/g,"").toLowerCase();
const H="11190096da2dab08fb3b62be375fe2ca0970b4d4eb240c14a1c08dfa4b3cf7ff",h=s=>createHash("sha256").update(String(s||"").trim().toLowerCase()).digest("hex");
let n=0,m=0;
for(const d of (await db.collection("users").get()).docs){const r=d.data().registro||{};if(h(r.correo)!==H)continue;m++;
  if(/reyna/.test(nrm(r.nombre))&&/garcia/.test(nrm(r.nombre))){await d.ref.update({"registro.correo":FV.delete(),apRe:FV.delete()});n++}}
console.log("cuentas con ese correo",m,"· corregidas",n);
