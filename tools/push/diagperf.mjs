// Solo lectura: WhatsApp con código de Honduras que no tiene 8 dígitos (conteos, sin números).
import admin from "firebase-admin";
admin.initializeApp({credential:admin.credential.cert(JSON.parse(process.env.FIREBASE_SA))});
const db=admin.firestore();
const U=(await db.collection("users").get()).docs.map(d=>({id:d.id,...d.data()})).filter(u=>u.registro&&u.registro.nombre);
const R={};(await db.collection("red").get()).docs.forEach(d=>{const x=d.data();if(x.u)R[x.u]=String(x.w||"").replace(/\D/g,"")});
let tot=0,hn=0,malHN=0,sinCC=0,conRed=0,redDistinto=0,redArregla=0;const len={};
for(const u of U){const w=String(u.registro.whatsapp||"").replace(/\D/g,"");if(!w)continue;tot++;
  if(w.startsWith("504")){hn++;const n=w.length-3;if(n!==8){malHN++;len[n]=(len[n]||0)+1;const r=R[u.id];if(r){conRed++;if(r.slice(-8)!==w.slice(-8))redDistinto++;else redArregla++}}}
  else if(w.length<=9)sinCC++}
console.log("con WhatsApp",tot,"· empiezan 504",hn,"· 504 con largo raro",malHN,JSON.stringify(len),"· sin código país",sinCC);
console.log("de los raros: en el reporte de inCruises",conRed,"· reporte trae otro número",redDistinto,"· mismo final",redArregla);
