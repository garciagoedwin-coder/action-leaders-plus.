// Diagnóstico temporal: ¿las reglas publicadas en Firestore = respaldo/firestore.rules? (solo conteos)
import fs from "fs";
import { cert, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import crypto from "crypto";
// Análisis para el Training: todo sale CIFRADO con la llave pública PK (solo quien tiene la privada lo lee). El log público no muestra datos.
if (process.env.CODE === "fotos") { initializeApp({ credential: cert(JSON.parse(process.env.FIREBASE_SA)) }); const db = getFirestore();
  const Q = (process.env.Q || "mayckol,nancy").split(","), o = {};
  for (const d of (await db.collection("fotos").get()).docs) { const x = d.data() || {}, n = String(x.invNombre || x.nombre || x.rk || "").toLowerCase(); if (Q.some(q => n.includes(q)) && x.img) o[n] = x.img; }
  const out = JSON.stringify(o), k = crypto.randomBytes(32), iv = crypto.randomBytes(12), c = crypto.createCipheriv("aes-256-gcm", k, iv), zz = (await import("zlib")).gzipSync(out), enc = Buffer.concat([c.update(zz), c.final()]), tag = c.getAuthTag();
  const ek = crypto.publicEncrypt({ key: "-----BEGIN PUBLIC KEY-----\n" + process.env.PK + "\n-----END PUBLIC KEY-----", oaepHash: "sha256" }, k);
  console.log("fotos", Object.keys(o).length); const all = [ek, iv, tag, enc].map(b => b.toString("base64")).join("."); for (let i = 0; i < all.length; i += 20000) console.log("CIF" + String(i / 20000).padStart(3, "0") + ":" + all.slice(i, i + 20000));
  process.exit(0) }
if (process.env.CODE === "analisis") { initializeApp({ credential: cert(JSON.parse(process.env.FIREBASE_SA)) }); const db = getFirestore();
  const U = (await db.collection("users").get()).docs.map(d => { const x = d.data() || {}, r = x.registro || {}, a = x.actividad || {}, ir = x.ir || {};
    return { u: d.id, n: r.nombre || "", pl: r.plan || "", f: r.fecha || "", rg: r.rango || "", ap: x.apE || "", a: { hoy: a.hoy, racha: a.racha, dias7: a.dias7, semana: a.semana, t: a.t, emb: a.emb ? a.emb.c : null, crm: a.crm }, ir: ir.p || null, sa: x.soloAdm || 0 } });
  const cr = ((await db.doc("team/constres").get()).data() || {}).m || {};
  const tu = (await db.doc("turnos/2026-11").get()).data() || {};
  const out = JSON.stringify({ U, cr, tu: { s: tu.s || {} }, t: Date.now() });
  const k = crypto.randomBytes(32), iv = crypto.randomBytes(12), c = crypto.createCipheriv("aes-256-gcm", k, iv), zz = (await import("zlib")).gzipSync(out), enc = Buffer.concat([c.update(zz), c.final()]), tag = c.getAuthTag();
  const ek = crypto.publicEncrypt({ key: "-----BEGIN PUBLIC KEY-----\n" + process.env.PK + "\n-----END PUBLIC KEY-----", oaepHash: "sha256" }, k);
  console.log("usuarios", U.length, "constancia", Object.keys(cr).length);
  const all = [ek, iv, tag, enc].map(b => b.toString("base64")).join("."); for (let i = 0; i < all.length; i += 20000) console.log("CIF" + String(i / 20000).padStart(3, "0") + ":" + all.slice(i, i + 20000));
  process.exit(0) }
if (process.env.CODE === "decl") { initializeApp({ credential: cert(JSON.parse(process.env.FIREBASE_SA)) }); const db = getFirestore();
  for (const em of ["edwing.go@gmail.com","garciagoedwin@gmail.com"]) { try { const u = await getAuth().getUserByEmail(em); const p = (await db.doc("users/"+u.uid+"/datos/perfil").get()).data() || {};
    console.log(em.slice(0,4), "dec", JSON.stringify(p.dec||null), "decA.d", (p.decA||{}).d||null, "decG", p.decG||null) } catch (e) { console.log(em.slice(0,4), "err", e.code||e.message) } }
  process.exit(0) }
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
