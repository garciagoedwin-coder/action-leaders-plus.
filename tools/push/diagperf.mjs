// Una sola vez: compara reglas de PRODUCCIÓN con respaldo/firestore.rules. Solo lee.
import admin from "firebase-admin";import fs from "node:fs";import {execSync} from "node:child_process";
admin.initializeApp({credential:admin.credential.cert(JSON.parse(process.env.FIREBASE_SA))});
const rs=await admin.securityRules().getFirestoreRuleset();
const src=rs.source.map(f=>f.content).join("\n");fs.writeFileSync("/tmp/prod.rules",src);
console.log("ruleset",rs.name,"creado",rs.createTime,"líneas",src.split("\n").length);
try{execSync("diff -u -w -B ../../respaldo/firestore.rules /tmp/prod.rules",{stdio:"inherit"});console.log("IGUALES")}catch(e){console.log("(fin del diff)")}
const g=(await admin.firestore().doc("privAp/grupo").get()).data();console.log("privAp/grupo tiene link:",!!(g&&g.link));
