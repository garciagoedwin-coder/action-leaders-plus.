// Diagnóstico temporal: ¿las reglas publicadas en Firestore = respaldo/firestore.rules? (solo conteos)
import fs from "fs";
import { cert, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import crypto from "crypto";
// Análisis para el Training: todo sale CIFRADO con la llave pública PK (solo quien tiene la privada lo lee). El log público no muestra datos.
if (process.env.CODE === "persona") { initializeApp({ credential: cert(JSON.parse(process.env.FIREBASE_SA)) }); const db = getFirestore();
  const nz=x=>String(x||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase(); const q=nz(process.env.Q);
  const us=await db.collection("users").get(); let i=0;
  for(const d of us.docs){const r=d.data().registro||{}; if(!nz(r.nombre).includes(q)&&!nz(d.data().email).includes(q))continue; i++;
    const c=(await db.collection("constancia").doc(d.id).get()).data()||{}; const a=d.data().actividad||{};
    console.log("cuenta",i,"apE",d.data().apE||"-","registrado",!!r.nombre,"patrocinadorUid",!!r.patrocinadorUid,"linea",(r.linea||[]).length,"plan",r.plan||"-",
      "constancia",!!Object.keys(c).length,"mes",c.mes||"-","mesPts",c.mesPts??"-","mesComp",c.mesComp??"-","vr",c.vr??"-","hoy",c.hoy??"-",
      "diasSinApp",a.t?Math.round((Date.now()-a.t)/864e5):"-","fotosOculto",!!((await db.collection("fotos").doc(d.id).get()).data()||{}).oculto);}
  const rd=await db.collection("red").get(); let j=0; rd.docs.forEach(x=>{const v=x.data(); if(nz(v.n).includes(q)){j++;console.log("red",j,"tipo",v.t,"plan",v.pl||"-","enApp",!!v.u)}});
  console.log("cuentas",i,"red",j); process.exit(0)}
if (process.env.CODE === "sis") { initializeApp({ credential: cert(JSON.parse(process.env.FIREBASE_SA)) }); const db = getFirestore();
  const nz=x=>String(x||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase(); const q=nz(process.env.Q); const mes=new Date(Date.now()).toISOString().slice(0,7);
  const g=(await db.doc("sisPriv/grupo").get()).data()||{}, gl=((await db.doc("team/liderazgo").get()).data()||{}).grupo||{};
  console.log("mesUTC",mes,"sisPriv.grupo m",g.m||"-","link",!!g.link,"team.liderazgo.grupo m",gl.m||"-");
  for(const d of (await db.collection("users").get()).docs){const x=d.data()||{},r=x.registro||{}; if(!nz(r.nombre).includes(q))continue;
    let cl={}; try{cl=(await getAuth().getUser(d.id)).customClaims||{}}catch(e){cl={err:e.code}}
    const c=(await db.doc("constancia/"+d.id).get()).data()||{};
    console.log("cuenta","apE",x.apE||"-","claims",JSON.stringify({ap:cl.ap,sis:cl.sis,pv:!!cl.pv,rv:!!cl.rv}),"comp",JSON.stringify({mes:(x.comp||{}).mes,no:(x.comp||{}).no,vol:(x.comp||{}).vol}),"constComp",JSON.stringify({mes:(c.comp||{}).mes,no:(c.comp||{}).no}),"lzG",JSON.stringify(x.lzG||null),"mesPts",c.mesPts??"-","mesComp",c.mesComp??"-","diasMes",new Date().getUTCDate()); const nn=nz(r.nombre); console.log("palabras",nn.split(/\s+/).length,"tiene:",["odett","isaguirre","aguirre","aguilar"].map(w=>w+"="+nn.includes(w)).join(" "),"fecha",r.fecha||"-"); if(process.env.PK){const out=JSON.stringify({n:r.nombre||"",nr:r.nombreRanking||""});const k=crypto.randomBytes(32),iv=crypto.randomBytes(12),cc=crypto.createCipheriv("aes-256-gcm",k,iv),zz=(await import("zlib")).gzipSync(out),enc=Buffer.concat([cc.update(zz),cc.final()]),tag=cc.getAuthTag();const ek=crypto.publicEncrypt({key:"-----BEGIN PUBLIC KEY-----\n"+process.env.PK+"\n-----END PUBLIC KEY-----",oaepHash:"sha256"},k);console.log("CIF000:"+[ek,iv,tag,enc].map(x=>x.toString("base64")).join("."))}}
  { const su=(await db.doc("team/sisU").get()).data()||{}; console.log("sisU.n",su.n,"sin",(su.sin||[]).length,"ellaEnSin",(su.sin||[]).some(n=>nz(n).includes(q)||nz(n).includes("isaguirre")),"sisU.t",su.t?new Date(su.t).toISOString():"-"); }
  process.exit(0)}
if (process.env.CODE === "salayo") { initializeApp({ credential: cert(JSON.parse(process.env.FIREBASE_SA)) }); const db = getFirestore(); const q = (process.env.Q||"").toLowerCase();
  const us = await db.collection("users").get(); let i = 0;
  for (const u of us.docs) { const n = ((u.data().registro||{}).nombre||"").toLowerCase(); if (!q || !n.includes(q)) continue; i++;
    const sd = await db.collection("users/"+u.id+"/sala").get(); const all = sd.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>(b.t||0)-(a.t||0));
    const yo = all.map((x,k)=>({k,x})).filter(o=>o.x.c==="yo"); const c = (await db.doc("constancia/"+u.id).get()).data()||{};
    console.log("persona", i, "docs sala", all.length, "yo", yo.length, yo.map(o=>"[pos "+o.k+" pct "+(o.x.pct||0)+" fin "+(o.x.motivo==="fin"?1:0)+" pulso "+(o.x.pulso?1:0)+"]").join(" "), "svY", c.svY||null); }
  process.exit(0); }
if (process.env.CODE === "fotos") { initializeApp({ credential: cert(JSON.parse(process.env.FIREBASE_SA)) }); const db = getFirestore();
  const Q = (process.env.Q || "mayckol,nancy").split(","), o = {};
  for (const d of (await db.collection("fotos").get()).docs) { const x = d.data() || {}, n = String(x.invNombre || x.nombre || x.rk || "").toLowerCase(); if (Q.some(q => n.includes(q)) && x.img) o[n] = x.img; }
  const out = JSON.stringify(o), k = crypto.randomBytes(32), iv = crypto.randomBytes(12), c = crypto.createCipheriv("aes-256-gcm", k, iv), zz = (await import("zlib")).gzipSync(out), enc = Buffer.concat([c.update(zz), c.final()]), tag = c.getAuthTag();
  const ek = crypto.publicEncrypt({ key: "-----BEGIN PUBLIC KEY-----\n" + process.env.PK + "\n-----END PUBLIC KEY-----", oaepHash: "sha256" }, k);
  console.log("fotos", Object.keys(o).length); const all = [ek, iv, tag, enc].map(b => b.toString("base64")).join("."); for (let i = 0; i < all.length; i += 20000) console.log("CIF" + String(i / 20000).padStart(3, "0") + ":" + all.slice(i, i + 20000));
  await new Promise(r => process.stdout.write("", r)); process.exit(0) }
if (process.env.CODE === "analisis") { initializeApp({ credential: cert(JSON.parse(process.env.FIREBASE_SA)) }); const db = getFirestore();
  const U = (await db.collection("users").get()).docs.map(d => { const x = d.data() || {}, r = x.registro || {}, a = x.actividad || {}, ir = x.ir || {};
    return { u: d.id, n: r.nombre || "", pl: r.plan || "", f: r.fecha || "", rg: r.rango || "", ap: x.apE || "", a: { hoy: a.hoy, racha: a.racha, dias7: a.dias7, semana: a.semana, t: a.t, emb: a.emb ? a.emb.c : null, crm: a.crm }, ir: ir.p || null, sa: x.soloAdm || 0 } });
  const cr = ((await db.doc("team/constres").get()).data() || {}).m || {};
  const mA = new Date(Date.now() - 6 * 36e5).toISOString().slice(0, 7), mB = new Date(Date.now() + 9 * 864e5 - 6 * 36e5).toISOString().slice(0, 7), tu = { s: {} };
  for (const m of [...new Set([mA, mB])]) Object.assign(tu.s, ((await db.doc("turnos/" + m).get()).data() || {}).s || {});
  const out = JSON.stringify({ U, cr, tu: { s: tu.s || {} }, t: Date.now() });
  const k = crypto.randomBytes(32), iv = crypto.randomBytes(12), c = crypto.createCipheriv("aes-256-gcm", k, iv), zz = (await import("zlib")).gzipSync(out), enc = Buffer.concat([c.update(zz), c.final()]), tag = c.getAuthTag();
  const ek = crypto.publicEncrypt({ key: "-----BEGIN PUBLIC KEY-----\n" + process.env.PK + "\n-----END PUBLIC KEY-----", oaepHash: "sha256" }, k);
  console.log("usuarios", U.length, "constancia", Object.keys(cr).length);
  const all = [ek, iv, tag, enc].map(b => b.toString("base64")).join("."); for (let i = 0; i < all.length; i += 20000) console.log("CIF" + String(i / 20000).padStart(3, "0") + ":" + all.slice(i, i + 20000));
  await new Promise(r => process.stdout.write("", r)); process.exit(0) }
if (process.env.CODE === "agenda") { initializeApp({ credential: cert(JSON.parse(process.env.FIREBASE_SA)) }); const db = getFirestore();
  // Solo CONTEOS de uso de la agenda en los últimos 30 días (nada personal en el log)
  const d30 = Date.now() - 30 * 864e5, f30 = new Date(d30).toISOString().slice(0, 10), C = {}, inc = (k, n = 1) => C[k] = (C[k] || 0) + n, quien = {};
  const ts = x => { const v = x.t || x.creado || x.updated || x.t0 || 0; return typeof v === "number" ? v : (v && v.toMillis ? v.toMillis() : Date.parse(v) || 0) };
  for (const d of (await db.collectionGroup("citas").get()).docs) { const x = d.data() || {}, u = d.ref.parent.parent.id, f = x.fecha || ""; if (f < f30 && ts(x) < d30) continue;
    const k = x.lz ? (x.lzT === "pres" ? "cita_presentacion_negocios" : "cita_lanzamiento") : x.l3 ? "cita_llamada3" : "cita_" + (x.tipo || "otra"); inc(k); (quien[k] = quien[k] || new Set()).add(u) }
  for (const d of (await db.collection("llamadas3").get()).docs) { const x = d.data() || {}; if (ts(x) < d30) continue; const k = x.lz ? (x.lzT === "pres" ? "sol_presentacion_negocios" : "sol_lanzamiento") : "sol_llamada3"; inc(k); (quien[k] = quien[k] || new Set()).add(x.de || "") }
  for (const d of (await db.collection("agendaEv").get()).docs) { const x = d.data() || {}; if ((x.fecha || "") < f30 && ts(x) < d30) continue; const k = "ev_" + (x.tipo === "gran" ? (x.bx ? "business" : "evento") : x.tipo || "otro"); inc(k); (quien[k] = quien[k] || new Set()).add(x.cre || "") }
  for (const d of (await db.collectionGroup("sala").get()).docs) { if (!d.id.startsWith("v_")) continue; const x = d.data() || {}; if (ts(x) < d30) continue; const u = d.ref.parent.parent.id; if (x.c === "yo") continue; inc("pv_abierta"); (quien.pv_abierta = quien.pv_abierta || new Set()).add(u) }
  for (const k of Object.keys(C).sort((a, b) => C[b] - C[a])) console.log("USO", k.padEnd(28), String(C[k]).padStart(5), "socios", quien[k] ? quien[k].size : 0);
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
if (process.env.CODE === "rep") { initializeApp({ credential: cert(JSON.parse(process.env.FIREBASE_SA)) }); const db = getFirestore(), now = Date.now();
  for (const mail of ["edwing.go@gmail.com", "garciagoedwin@gmail.com"]) { const q = await db.collection("users").where("email", "==", mail).limit(1).get(); if (q.empty) { console.log(mail[0], "sin cuenta"); continue; }
    const uid = q.docs[0].id, C = (await db.collection(`users/${uid}/crm`).where("cat", "array-contains", "camp").get()).docs;
    const cnt = {}; let rp = 0; for (const d of C) { const r = d.data().rep; cnt[r ? (r.st || "?") : "sin"] = (cnt[r ? (r.st || "?") : "sin"] || 0) + 1; if (d.data().repP === true) rp++; }
    console.log("cuenta", mail[0], "camp", C.length, "repP", rp, JSON.stringify(cnt));
    const A = (await db.collection(`users/${uid}/crm`).orderBy("updated", "desc").limit(4).get()).docs.map(d => { const x = d.data(); return Math.round((now - (x.updated || 0)) / 60000) + "m/" + (x.stage || "") + "/camp:" + (Array.isArray(x.cat) && x.cat.includes("camp") ? 1 : 0) + "/rep:" + (x.rep ? x.rep.st : "-") + "/id:" + d.id.slice(0, 2); });
    const U = (await db.doc(`users/${uid}`).get()).data() || {}, at = (U.actividad || {}).t, cs = ((await db.doc(`constancia/${uid}`).get()).data() || {}).u;
    console.log(" crm ultimos cambios hace (min)", A.join(","), "· actividad hace", at ? Math.round((now - at) / 60000) : "-", "· constancia hace", cs ? Math.round((now - cs) / 60000) : "-");
    const rec = C.map(d => ({ id: d.id, ...d.data() })).filter(x => x.rep && now - (x.rep.t || 0) < 864e5).sort((a, b) => b.rep.t - a.rep.t);
    for (const x of rec.slice(0, 15)) { let ex = "-", st = ""; if (x.rep.u) { const t = await db.doc(`users/${x.rep.u}/crm/${x.id}`).get(); ex = t.exists ? "si" : "NO"; st = t.exists ? (t.data().stage || "") : ""; }
      console.log(" hace", Math.round((now - x.rep.t) / 60000), "min · st", x.rep.st, "· repP", x.repP, "· upd hace", Math.round((now - (x.updated || 0)) / 60000), "min · copia", ex, st); } }
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
