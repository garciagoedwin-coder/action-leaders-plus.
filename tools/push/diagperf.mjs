// Diagnóstico (11 nov): socia nueva enviada con enlace con paquete. Solo estados en el log.
import admin from "firebase-admin";
admin.initializeApp({credential:admin.credential.cert(JSON.parse(process.env.FIREBASE_SA))});
const db=admin.firestore(),auth=admin.auth();
const nrm=s=>String(s||"").normalize("NFD").replace(/[̀-ͯ]/g,"").toLowerCase();
const users=(await db.collection("users").get()).docs;const byId=new Map(users.map(d=>[d.id,d.data()]));
const jc=users.filter(d=>nrm((d.data().registro||{}).nombre).includes("juan carlos")).map(d=>d.id);console.log("cuentas Juan Carlos",jc.length);
const inv=(await db.collection("invitaciones").get()).docs.map(d=>({id:d.id,...d.data()}));
const mar=inv.filter(x=>/marcel|marsel/.test(nrm(x.nombre)));console.log("invitaciones con su nombre",mar.length);
const hoy=Date.now()-36*3600e3;
if(0)for(const x of inv.filter(x=>jc.includes(x.by)&&(x.t||0)>hoy).concat(mar)){const u=x.usadoPor?byId.get(x.usadoPor):null;const a=x.usadoPor?await auth.getUser(x.usadoPor).catch(()=>null):null;const c=(a&&a.customClaims)||{};const r=(u&&u.registro)||{};
  console.log("INV",JSON.stringify({conNombre:!!x.nombre,esMarcelina:/marcel|marsel/.test(nrm(x.nombre)),plan:x.plan||"",gen:!!x.gen,creada:new Date(x.t||0).toISOString(),usada:!!x.usadoPor,
   cuenta:x.usadoPor?{tieneDoc:!!u,registrada:!!r.nombre,invIdIgual:r.invId===x.id,planPor:r.planPor||null,plan:r.plan||"",patroIgual:r.patrocinadorUid===x.by,apE:(u&&u.apE)||null,apX:(u&&u.apX)||null,claims:{ap:c.ap,pv:!!c.pv,rv:!!c.rv,nr:!!c.nr},creada:a&&a.metadata.creationTime}:null}))}
// fin invitaciones
// cuentas nuevas
const A=[];let pt;do{const r=await auth.listUsers(1000,pt);A.push(...r.users);pt=r.pageToken}while(pt);
for(const a of A.filter(a=>Date.parse(a.metadata.creationTime)>hoy)){const u=byId.get(a.uid)||{},r=u.registro||{},c=a.customClaims||{};
  console.log("NUEVA",JSON.stringify({creada:a.metadata.creationTime,registrada:!!r.nombre,esMarcelina:/marcel|marsel/.test(nrm(r.nombre)),patroEsJC:jc.includes(r.patrocinadorUid),invId:!!r.invId,planPor:r.planPor||null,plan:r.plan||"",apE:u.apE||null,apX:u.apX||null,claims:{ap:c.ap,pv:!!c.pv,nr:!!c.nr}}))}
