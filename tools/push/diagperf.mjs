// Diagnóstico (10 nov): ¿la cuenta de un miembro del sistema tiene el permiso sis y compromiso del mes? Solo sí/no, sin datos personales.
import admin from "firebase-admin";
admin.initializeApp({credential:admin.credential.cert(JSON.parse(process.env.FIREBASE_SA))});
const db=admin.firestore(),auth=admin.auth();
const U=(await db.collection("users").get()).docs.map(d=>({id:d.id,...d.data()})).filter(u=>u.registro&&/paz/i.test(u.registro.nombre||"")&&/karen|lizeth/i.test(u.registro.nombre||""));
console.log("cuentas encontradas",U.length);
const mes=new Date().toISOString().slice(0,7);
for(const u of U){const a=await auth.getUser(u.id).catch(()=>null);const c=(a&&a.customClaims)||{};
  console.log("comp existe:",!!u.comp,"· comp.mes:",u.comp&&u.comp.mes,"· dijo no:",!!(u.comp&&u.comp.no),"· hace horas:",u.comp&&u.comp.t?Math.round((Date.now()-u.comp.t)/36e5):null,"· constancia.comp?");console.log("sis:",!!c.sis,"· ap:",c.ap,"· compromiso del mes:",!!(u.comp&&u.comp.mes===mes&&!u.comp.no),"· lzG:",!!(u.lzG&&u.lzG.m===mes));}
const g=(await db.doc("sisPriv/grupo").get()).data()||{};const t=(await db.doc("team/liderazgo").get()).data()||{};
console.log("link del grupo en sisPriv:",!!g.link,"mes",g.m,"· team/liderazgo.grupo:",JSON.stringify({m:(t.grupo||{}).m,si:(t.grupo||{}).si}));
