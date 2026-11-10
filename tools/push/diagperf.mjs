// Diagnóstico de una sola vez (10 nov): ¿hay constancias o registros que chocarían con las reglas de la fase 2? Solo lee; imprime conteos.
import admin from "firebase-admin";
admin.initializeApp({credential:admin.credential.cert(JSON.parse(process.env.FIREBASE_SA))});
const db=admin.firestore();const C={racha:31,semDias:7,semComp:7,semPts:35,pSemPts:35,mesDias:31,mesComp:31,mesMejor:31,mesPts:155,semPres:500,mesPres:2000,hoy:100};
const q=await db.collection("constancia").get();const mal={};let nm=0;
for(const d of q.docs){const x=d.data();let b=false;for(const k in C){const v=x[k];if(v==null)continue;if(typeof v!=="number"||v<0||v>C[k]){mal[k]=(mal[k]||0)+1;b=true}}if(b)nm++}
console.log("constancia",q.size,"fuera de rango",nm,JSON.stringify(mal));
const u=await db.collection("users").get();let reg=0,sinN=0,rgMap=0;for(const d of u.docs){const r=(d.data()||{}).registro;if(!r)continue;reg++;if(!r.nombre)sinN++;if(typeof r!=="object")rgMap++}
console.log("users",u.size,"con registro",reg,"registro sin nombre",sinN,"registro no-mapa",rgMap);
