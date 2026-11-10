// Una vez (10 nov): corrige registro.whatsapp con +504 y largo raro cuando el reporte de inCruises trae el mismo número con su código real. Solo conteos.
import admin from "firebase-admin";
admin.initializeApp({credential:admin.credential.cert(JSON.parse(process.env.FIREBASE_SA))});
const db=admin.firestore();
const LEN={"504":[8],"34":[9],"1":[10],"52":[10],"57":[10],"502":[8],"503":[8],"505":[8],"506":[8],"507":[7,8],"44":[10],"51":[9],"593":[9],"56":[9],"58":[10]};
const ok=d=>{for(const k of Object.keys(LEN).sort((a,b)=>b.length-a.length))if(d.startsWith(k))return LEN[k].includes(d.length-k.length);return true};
const U=(await db.collection("users").get()).docs.map(d=>({id:d.id,...d.data()})).filter(u=>u.registro&&u.registro.nombre);
const R={};(await db.collection("red").get()).docs.forEach(d=>{const x=d.data();if(x.u)R[x.u]=String(x.w||"").replace(/\D/g,"")});
let fix=0,rev=0;
for(const u of U){const w=String(u.registro.whatsapp||"").replace(/\D/g,"");if(!w.startsWith("504")||ok(w))continue;const r=R[u.id];
  if(r&&r.slice(-8)===w.slice(-8)&&ok(r)&&!r.startsWith("504")){await db.doc("users/"+u.id).set({registro:{whatsapp:r}},{merge:true});fix++}else rev++}
console.log("corregidos con el reporte",fix,"· quedan para revisar",rev);
