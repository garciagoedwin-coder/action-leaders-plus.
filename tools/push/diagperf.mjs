// Diagnóstico (11 nov): por qué una socia nueva (enviada con enlace con paquete) sale pendiente. Solo booleanos/estados en el log.
import admin from "firebase-admin";
admin.initializeApp({credential:admin.credential.cert(JSON.parse(process.env.FIREBASE_SA))});
const db=admin.firestore(),auth=admin.auth();
const nrm=s=>String(s||"").normalize("NFD").replace(/[̀-ͯ]/g,"").toLowerCase();
const U=(await db.collection("users").get()).docs.filter(d=>nrm((d.data().registro||{}).nombre).includes("marcelina")||nrm(d.data().nombre).includes("marcelina"));
console.log("cuentas encontradas",U.length);
for(const d of U){const u=d.data(),r=u.registro||{};const a=await auth.getUser(d.id).catch(()=>null);const c=(a&&a.customClaims)||{};
  const sp=r.patrocinadorUid?await auth.getUser(r.patrocinadorUid).catch(()=>null):null;const spn=sp?nrm((await db.doc("users/"+sp.uid).get()).data()?.registro?.nombre||""):"";
  let iv=null;if(r.invId){const x=await db.doc("invitaciones/"+r.invId).get();iv=x.exists?x.data():"NOEXISTE"}
  const invs=(await db.collection("invitaciones").where("by","==",r.patrocinadorUid||"x").get()).docs.map(x=>x.data()).filter(x=>nrm(x.nombre).includes("marcelina"));
  console.log(JSON.stringify({apE:u.apE||null,apX:u.apX||null,apSH:!!u.apSH,claims:{ap:c.ap,pv:!!c.pv,rv:!!c.rv,nr:!!c.nr},creada:a&&a.metadata.creationTime,registroFecha:r.fecha||null,
    plan:r.plan||"",planPor:r.planPor||null,invId:!!r.invId,inv:iv===null?null:iv==="NOEXISTE"?"no existe":{plan:iv.plan||"",byEsPatro:iv.by===r.patrocinadorUid,usado:iv.usadoPor?(iv.usadoPor===d.id?"ella":"OTRA"):"no"},
    patroEsJuanCarlos:spn.includes("juan carlos"),patroAp:sp?(sp.customClaims||{}).ap:null,invitacionesDelPatroConSuNombre:invs.map(x=>({plan:x.plan,usado:x.usadoPor?(x.usadoPor===d.id?"ella":"OTRA"):"no",t:new Date(x.t||0).toISOString()})),
    tieneCorreoIC:!!r.correo,tieneWa:!!r.whatsapp}))}
