// Arreglo único (11 nov, Edwin aprobó): citas de lanzamiento/presentación/llamada de 3 que perdieron sus datos al «Editar».
// Se recuperan desde llamadas3. Solo conteos en el log. APLICAR=1 escribe.
import admin from "firebase-admin";
admin.initializeApp({credential:admin.credential.cert(JSON.parse(process.env.FIREBASE_SA))});
const db=admin.firestore(),AP=!!process.env.APLICAR;
const prim=n=>String(n||"").trim().split(/\s+/)[0].toLowerCase();
const L3=(await db.collection("llamadas3").get()).docs.map(d=>({id:d.id,...d.data()}));
const citas=await db.collectionGroup("citas").get();
let dan=0,rep=0,sin=0;
for(const c of citas.docs){const x=c.data();if(x.tipo!=="lider"||x.l3||x.lz)continue;const t=String(x.titulo||"");
  const uid=c.ref.parent.parent.id;let m,fix=null,cand;
  const cerca=a=>a.sort((p,q)=>Math.abs(Date.parse((p.fecha||"")+"T12:00")-Date.parse((x.fecha||"")+"T12:00"))-Math.abs(Date.parse((q.fecha||"")+"T12:00")-Date.parse((x.fecha||"")+"T12:00"))||(q.t||0)-(p.t||0))[0];
  if((m=t.match(/^(🚀 Mi lanzamiento con|🎤 Mi presentación con) (\S+)/))){dan++;
    cand=cerca(L3.filter(d=>d.lz&&!d.lzXi&&((d.de===uid&&!d.lzE&&prim(d.paraN)===m[2].toLowerCase())||(d.para===uid&&d.lzE&&prim(d.deN)===m[2].toLowerCase()))));
    if(cand)fix=cand.de===uid?{lz:1,lzT:cand.lzT||"",lzX:cand.lzX||[],l3:cand.id,lzU:cand.para,lzN:cand.paraN||"",inv:x.inv||[]}:{lz:1,lzT:cand.lzT||"",lzX:cand.lzX||[],l3:cand.id,lzR3:1,lzU:cand.de,lzN:cand.deN||"",inv:x.inv||[]}}
  else if((m=t.match(/^(🚀 Lanzamiento de|🎤 Presentación de) (\S+)/))&&!/invitado especial/.test(t)){dan++;
    cand=cerca(L3.filter(d=>d.lz&&!d.lzXi&&((d.de===uid&&d.lzE&&prim(d.paraN)===m[2].toLowerCase())||(d.para===uid&&!d.lzE&&prim(d.deN)===m[2].toLowerCase()))));
    if(cand)fix=cand.de===uid?{lz:1,lzE:1,lzT:cand.lzT||"",lzX:cand.lzX||[],l3:cand.id,lzSU:cand.para,lzSN:cand.paraN||"",inv:x.inv||[]}:{l3:cand.id,l3R:1,ldN:cand.deN||""}}
  else if(/^📞 Llamada de 3/.test(t)){dan++;
    cand=cerca(L3.filter(d=>!d.lz&&(d.de===uid||d.para===uid)));
    if(cand)fix=cand.de===uid?{l3:cand.id,cid:cand.cid||x.cid||"",ldN:cand.paraN||""}:{l3:cand.id,l3R:1,ldN:cand.deN||""}}
  if(fix){rep++;if(AP)await c.ref.set(fix,{merge:true})}else if(cand===undefined&&dan)sin++;}
console.log("citas dañadas",dan,"· recuperables",rep,"· sin invitación encontrada",dan-rep,AP?"· APLICADO":"· (prueba)");
