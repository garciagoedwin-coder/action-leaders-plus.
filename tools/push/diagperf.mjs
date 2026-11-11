// Diagnóstico (11 nov): doc fotos de una socia (solo tamaños de campos, sin contenido).
import admin from "firebase-admin";
admin.initializeApp({credential:admin.credential.cert(JSON.parse(process.env.FIREBASE_SA))});
const db=admin.firestore();
const U=(await db.collection("users").get()).docs.filter(d=>/lizeth/i.test((d.data().registro||{}).nombre||"")&&/paz/i.test((d.data().registro||{}).nombre||""));
for(const u of U){const f=await db.doc("fotos/"+u.id).get();console.log("existe",f.exists);if(f.exists){const x=f.data();console.log(Object.entries(x).map(([k,v])=>k+":"+(typeof v==="string"?v.length:typeof v)).join(" · "))}}
const all=(await db.collection("fotos").get()).docs.map(d=>JSON.stringify(d.data()).length).sort((a,b)=>b-a);console.log("fotos más grandes",all.slice(0,5).join(", "));
