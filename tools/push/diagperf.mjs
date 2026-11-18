// Diagnóstico temporal: ¿las reglas publicadas en Firestore = respaldo/firestore.rules? (solo conteos)
import fs from "fs";
import { cert, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
if (process.env.CODE === "camp") { initializeApp({ credential: cert(JSON.parse(process.env.FIREBASE_SA)) }); const db = getFirestore();
  const u = (await db.collection("users").where("email", "==", "edwing.go@gmail.com").limit(1).get()).docs[0];
  const C = (await db.collection(`users/${u.id}/crm`).where("cat", "array-contains", "camp").get()).docs.map(d => d.data()).sort((a, b) => (a.creado || 0) - (b.creado || 0));
  const h = t => t ? new Date(t - 6 * 36e5).toISOString().slice(5, 16).replace("T", " ") : "-";
  C.forEach((c, i) => console.log("#" + (i + 1), "etapa:", c.stage, "· gc.p:", (c.gc || {}).p ?? "-", "· gc pasos:", Object.keys((c.gc || {}).t || {}).join(",") || "-", "· fl:", Object.keys((c.fl || {}).h || {}).join(",") || "-", "· seg:", (c.seg || []).length, "· ultSeg:", c.ultSeg || "-", "· rep:", (c.rep || {}).st || "-", "· creado:", h(c.creado), "· upd:", h(c.updated)));
  process.exit(0); }
if (process.env.CODE === "lluvia") { initializeApp({ credential: cert(JSON.parse(process.env.FIREBASE_SA)) }); const m = (await getFirestore().doc("push_meta/lluvia").get()).data() || {}; console.log("lluvia fx:", JSON.stringify(m.fx || null), "· hace", m.fx ? Math.round((Date.now() - m.fx.t) / 60000) + " min" : "-"); process.exit(0); }
const sa = JSON.parse(process.env.FIREBASE_SA), tk = (await cert(sa).getAccessToken()).access_token, H = { Authorization: "Bearer " + tk };
const B = "https://firebaserules.googleapis.com/v1/";
const rel = await (await fetch(B + "projects/" + sa.project_id + "/releases/cloud.firestore", { headers: H })).json();
const rs = await (await fetch(B + rel.rulesetName, { headers: H })).json();
const prod = ((rs.source || {}).files || [])[0]?.content || "", resp = fs.readFileSync("../../respaldo/firestore.rules", "utf8");
const n = t => t.replace(/\s+/g, " ").trim();
console.log("Publicadas:", rel.updateTime, "· líneas:", prod.split("\n").length);
console.log("Iguales al respaldo:", n(prod) === n(resp));
console.log("Tiene lleg:", prod.includes("/lleg/"), "· lectura del invitador:", prod.includes("resource.data.get('de', '') == request.auth.uid"));
