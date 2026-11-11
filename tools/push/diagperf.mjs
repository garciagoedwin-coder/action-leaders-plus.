// Una vez (10 nov, Edwin aprobó): compromisos de noviembre con datos pero con "no" pegado por el merge → no:false en users y constancia. Solo conteos.
import admin from "firebase-admin";
admin.initializeApp({credential:admin.credential.cert(JSON.parse(process.env.FIREBASE_SA))});
const db=admin.firestore();
const U=(await db.collection("users").get()).docs.map(d=>({id:d.id,...d.data()})).filter(u=>u.comp&&u.comp.mes==="2026-11"&&u.comp.no&&(u.comp.rango||u.comp.act!=null));
let n=0;for(const u of U){await db.doc("users/"+u.id).set({comp:{no:false}},{merge:true});
  const c=u.comp;await db.doc("constancia/"+u.id).set({u:Date.now(),comp:{mes:c.mes,no:false,rango:c.rango||"",act:c.act||0,ac:c.ac||0,ap:c.ap||0,vol:c.vol||0,pres:c.pres||0}},{merge:true});n++}
console.log("arreglados",n);
