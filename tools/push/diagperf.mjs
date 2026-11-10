// Diagnóstico de una sola vez: ¿existe una cuenta con este correo? (se busca por hash; no imprime correos ni nombres)
import admin from "firebase-admin";import crypto from "node:crypto";
admin.initializeApp({credential:admin.credential.cert(JSON.parse(process.env.FIREBASE_SA))});
const H="c43c656002036564",A=[];let pt;do{const r=await admin.auth().listUsers(1000,pt);A.push(...r.users);pt=r.pageToken}while(pt);
const h=e=>crypto.createHash("sha256").update(String(e||"").toLowerCase()).digest("hex").slice(0,16);
const m=A.filter(a=>h(a.email)===H||a.providerData.some(p=>h(p.email)===H));
console.log("cuentas",A.length,"coincidencias",m.length);
for(const a of m){const d=await admin.firestore().doc("users/"+a.uid).get();const u=d.exists?d.data():{};
 console.log("proveedores",a.providerData.map(p=>p.providerId).join(","),"| creada",a.metadata.creationTime,"| último acceso",a.metadata.lastSignInTime,"| verificado",a.emailVerified,"| doc users",d.exists,"| registrado",!!(u.registro&&u.registro.nombre),"| claims",JSON.stringify(a.customClaims||{}));}
