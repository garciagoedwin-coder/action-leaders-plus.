// Diagnóstico (11 nov): racha y mejor racha de una cuenta (solo números, sin nombres).
import admin from "firebase-admin";
admin.initializeApp({credential:admin.credential.cert(JSON.parse(process.env.FIREBASE_SA))});
const db=admin.firestore();
const U=(await db.collection("users").get()).docs.filter(d=>/interiano|alejandra mar[ií]a p[eé]rez/i.test((d.data().registro||{}).nombre||""));
console.log("cuentas",U.length);
for(const [i,u] of U.entries()){const c=(await db.doc("constancia/"+u.id).get()).data()||{};
  console.log("cuenta",i+1,"· racha",c.racha,"· mesMejor",c.mesMejor,"· mesComp",c.mesComp,"· mesDias",c.mesDias,"· semComp",c.semComp,"· mes",c.mes,"· wk",c.wk,"· si",c.si);
  const R=(await db.collection("users/"+u.id+"/datos").get()).docs.filter(d=>d.id.startsWith("rutina-2026-1"));
  console.log("  días con rutina:",R.map(d=>{const x=d.data();const k=["historia","contactos","seguimientos","presentaciones","formacion","escuchar","hAtr","hFly"].filter(f=>x[f]).length;return d.id.slice(12)+"("+k+")"}).sort().join(" "));}
