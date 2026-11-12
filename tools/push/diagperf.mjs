// Prueba (12 nov): la función aprobarAlRegistrar reacciona a users.apRe en la cuenta de prueba (no cambia nada más).
import admin from "firebase-admin";
admin.initializeApp({credential:admin.credential.cert(JSON.parse(process.env.FIREBASE_SA))});
const db=admin.firestore(),auth=admin.auth();
const nrm=s=>String(s||"").normalize("NFD").replace(/[̀-ͯ]/g,"").toLowerCase();
const d=(await db.collection("users").get()).docs.find(x=>nrm((x.data().registro||{}).nombre).includes("movimiento emprendedores"));
if(!d){console.log("sin cuenta de prueba");process.exit(0)}
const t0=Date.now();await d.ref.set({apRe:t0},{merge:true});console.log("apRe puesto");
for(let i=0;i<20;i++){await new Promise(r=>setTimeout(r,1500));const x=(await d.ref.get()).data();if(!x.apRe){console.log("la función respondió en",((Date.now()-t0)/1000).toFixed(1),"s · apE",x.apE||null);process.exit(0)}}
console.log("la función NO respondió en 30 s");await d.ref.set({apRe:admin.firestore.FieldValue.delete()},{merge:true});
