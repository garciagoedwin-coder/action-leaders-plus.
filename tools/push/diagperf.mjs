// Diagnóstico temporal: ¿las reglas nuevas (respaldo/firestore.rules) compilan? Solo valida, no publica.
import fs from "fs";
import { cert } from "firebase-admin/app";
const sa = JSON.parse(process.env.FIREBASE_SA), tk = (await cert(sa).getAccessToken()).access_token;
const src = fs.readFileSync("../../respaldo/firestore.rules", "utf8");
const r = await fetch("https://firebaserules.googleapis.com/v1/projects/" + sa.project_id + ":test", { method: "POST", headers: { Authorization: "Bearer " + tk, "Content-Type": "application/json" },
  body: JSON.stringify({ source: { files: [{ name: "firestore.rules", content: src }] } }) });
const j = await r.json();
console.log("HTTP", r.status, "· problemas:", (j.issues || []).length);
for (const i of j.issues || []) console.log(i.severity, (i.sourcePosition || {}).line, i.description);
if (j.error) console.log("Error:", j.error.message);
