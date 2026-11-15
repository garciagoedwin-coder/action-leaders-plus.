// Diagnóstico temporal: ¿las reglas publicadas en Firestore = respaldo/firestore.rules? (solo conteos)
import fs from "fs";
import { cert } from "firebase-admin/app";
const sa = JSON.parse(process.env.FIREBASE_SA), tk = (await cert(sa).getAccessToken()).access_token, H = { Authorization: "Bearer " + tk };
const B = "https://firebaserules.googleapis.com/v1/";
const rel = await (await fetch(B + "projects/" + sa.project_id + "/releases/cloud.firestore", { headers: H })).json();
const rs = await (await fetch(B + rel.rulesetName, { headers: H })).json();
const prod = ((rs.source || {}).files || [])[0]?.content || "", resp = fs.readFileSync("../../respaldo/firestore.rules", "utf8");
const n = t => t.replace(/\s+/g, " ").trim();
console.log("Publicadas:", rel.updateTime, "· líneas:", prod.split("\n").length);
console.log("Iguales al respaldo:", n(prod) === n(resp));
console.log("Tiene lleg:", prod.includes("/lleg/"), "· lectura del invitador:", prod.includes("resource.data.get('de', '') == request.auth.uid"));
