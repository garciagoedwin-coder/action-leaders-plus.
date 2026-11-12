// Diagnóstico (12 nov): ¿quedó guardada la declaración de hoy de Edwin? Solo imprime fechas y conteos.
import admin from "firebase-admin";
admin.initializeApp({credential:admin.credential.cert(JSON.parse(process.env.FIREBASE_SA))});
const db=admin.firestore();
const nrm=s=>String(s||"").normalize("NFD").replace(/[̀-ͯ]/g,"").toLowerCase();
const U=(await db.collection("users").get()).docs.filter(x=>/edwin/.test(nrm((x.data().registro||{}).nombre))&&/garcia/.test(nrm((x.data().registro||{}).nombre)));
console.log("cuentas",U.length);
for(const d of U){const p=(await d.ref.collection("datos").doc("perfil").get()).data()||{};console.log("cuenta",U.indexOf(d),"dec",JSON.stringify(p.dec||null),"decA.d",(p.decA||{}).d||null,"perfil.t",p.t||p.updated||null)}
const hoy=new Date(Date.now()-6*36e5).toISOString().slice(0,10);let n=0,m=0;
for(const d of (await db.collectionGroup("datos").get()).docs){if(d.id!=="perfil")continue;const p=d.data();if(p.dec&&p.dec.d===hoy)n++;if(p.decA&&p.decA.d===hoy)m++}
console.log("hoy",hoy,"· declaraciones",n,"· con acción",m);
