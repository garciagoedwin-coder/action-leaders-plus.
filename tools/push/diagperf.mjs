// Diagnóstico (13 nov): cuántos líderes del sistema tienen índice personal en team/liderazgo. Solo conteos.
import admin from "firebase-admin"; import fs from "fs";
admin.initializeApp({ credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SA)) });
const db = admin.firestore(), T = JSON.parse(fs.readFileSync("../../data/team.json", "utf8"));
const d = (await db.doc("team/liderazgo").get()).data() || {}, L = d.L || {}, ids = (T.liderazgo || []).map(l => l.id);
console.log("mes doc:", d.mes, "· t:", new Date(d.t || 0).toISOString(), "· líderes en team.json:", ids.length, "· con datos:", ids.filter(i => L[i]).length, "· con prod:", ids.filter(i => L[i] && L[i].prod != null).length, "· prod>0:", ids.filter(i => L[i] && L[i].prod > 0).length, "· entradas L:", Object.keys(L).length);
