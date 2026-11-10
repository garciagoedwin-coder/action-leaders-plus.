// Una sola vez (10 nov, fase 3): compara reglas de PRODUCCIÓN con respaldo/firestore.rules y, si son iguales,
// mueve el link del grupo del sistema de team/liderazgo.grupo.link a sisPriv/grupo. No imprime el link.
import admin from "firebase-admin";import fs from "node:fs";import {execSync} from "node:child_process";
admin.initializeApp({credential:admin.credential.cert(JSON.parse(process.env.FIREBASE_SA))});
const rs=await admin.securityRules().getFirestoreRuleset();
const src=rs.source.map(f=>f.content).join("\n");fs.writeFileSync("/tmp/prod.rules",src);
console.log("ruleset",rs.name,"creado",rs.createTime,"líneas",src.split("\n").length);
let igual=false;try{execSync("diff -u -w -B ../../respaldo/firestore.rules /tmp/prod.rules",{stdio:"inherit"});igual=true;console.log("IGUALES")}catch(e){console.log("(fin del diff)")}
if(igual){const db=admin.firestore(),ref=db.doc("team/liderazgo"),G=((await ref.get()).data()||{}).grupo||{};
  if(G.link){await db.doc("sisPriv/grupo").set({m:G.m||"",link:G.link,t:G.t||Date.now()});
    await ref.update({grupo:{m:G.m||"",si:true,t:G.t||Date.now()}});console.log("link movido a sisPriv, mes",G.m);}
  else{const p=(await db.doc("sisPriv/grupo").get()).data();console.log("sin link en team; sisPriv tiene link:",!!(p&&p.link),"mes",p&&p.m,"grupo.si",!!G.si);}}
