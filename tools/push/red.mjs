// Red de inCruises automática (10 nov 2026). Corre en GitHub Actions (red.yml) con FIREBASE_SA.
//   node red.mjs bajar  → si el admin subió reportes desde la app (evento/sps26/priv/rep, est "p"),
//                          los descifra a $RED_DIR/{so,mi,pe}.csv y deja la clave en $EVK_FILE (todo fuera del repo).
//   node red.mjs subir  → descifra data/red.enc y lo reparte en Firestore red/{k} (quién ve a quién),
//                          corrige registro.plan con el plan real del reporte (planPor "reporte"; nunca toca planPor "admin"),
//                          guarda team/prem (nombres Premium para la ★) y team/redMeta, y avisa a los admins.
// Logs públicos: SOLO conteos.
import fs from "node:fs"; import crypto from "node:crypto";
import { mismoNombre, rangoUsr } from "./enviar.mjs";
import { ahKe, ahKw } from "./aprobar.mjs";

const ADMINS = ["garciagoedwin@gmail.com", "actionleadersoficial@gmail.com", "edwing.go@gmail.com"];
const ROOT = "edwing.go@gmail.com", SOLO = "garciagoedwin@gmail.com";
const APP = "https://actionleadersplus.com/", ICON = APP + "icon-192.png";
const RG_MD = /director|board/i;   // Marketing Director en adelante (RED_MD = 2 en la app)
const modo = process.argv[2] || "subir", DRY = !!process.env.DRY, FORCE = !!process.env.FORCE;

const keyDe = k => Buffer.from(k.replace(/-/g, "+").replace(/_/g, "/"), "base64");
function dec(key, b64) { const raw = Buffer.from(String(b64).trim(), "base64");
  const dc = crypto.createDecipheriv("aes-256-gcm", key, raw.subarray(0, 12)); dc.setAuthTag(raw.subarray(raw.length - 16));
  return Buffer.concat([dc.update(raw.subarray(12, raw.length - 16)), dc.final()]).toString("utf8"); }
const out = (k, v) => { if (process.env.GITHUB_OUTPUT) fs.appendFileSync(process.env.GITHUB_OUTPUT, `${k}=${v}\n`); };

async function main() {
  const { initializeApp, cert } = await import("firebase-admin/app");
  const { getFirestore, FieldValue } = await import("firebase-admin/firestore");
  initializeApp({ credential: cert(JSON.parse(process.env.FIREBASE_SA)) });
  const db = getFirestore();
  const k = ((await db.doc("evento/sps26/priv/llave").get()).data() || {}).k; if (!k) throw new Error("sin llave");
  const key = keyDe(k);
  const repRef = db.doc("evento/sps26/priv/rep");

  if (modo === "bajar") {
    const r = (await repRef.get()).data() || {};
    if (r.est !== "p") { console.log("Sin reportes nuevos."); out("rep", ""); return; }
    const dir = process.env.RED_DIR; fs.mkdirSync(dir, { recursive: true });
    const F = r.f || {}, hay = [];
    for (const t of ["so", "mi", "pe"]) if (F[t]) { fs.writeFileSync(`${dir}/${t}.csv`, dec(key, F[t])); hay.push(t); }
    fs.writeFileSync(process.env.EVK_FILE, k, { mode: 0o600 });
    console.log("Reportes recibidos:", hay.join(", ") || "ninguno");
    if (!hay.includes("pe") || (!hay.includes("so") !== !hay.includes("mi"))) {
      if (!DRY) await repRef.set({ est: "err", msg: "Faltan archivos: suba los 3 reportes, o solo el de pendientes.", tf: Date.now(), f: FieldValue.delete() }, { merge: true });
      out("rep", ""); return; }
    if (!DRY) await repRef.set({ est: "w", tw: Date.now() }, { merge: true });   // en proceso
    out("rep", "1"); out("so", hay.includes("so") ? `${dir}/so.csv` : "-"); out("mi", hay.includes("mi") ? `${dir}/mi.csv` : "-");
    return;
  }

  if (modo === "error") { if (!DRY) await repRef.set({ est: "err", msg: "No se pudo procesar el reporte. Revise que sean los archivos de inCruises.", tf: Date.now() }, { merge: true }); return; }

  // ---------- subir ----------
  const D = JSON.parse(dec(key, fs.readFileSync("../../data/red.enc", "utf8")));
  const team = JSON.parse(fs.readFileSync("../../data/team.json", "utf8"));
  const metaRef = db.doc("team/redMeta"), meta = (await metaRef.get()).data() || {};
  const rep = (await repRef.get()).data() || {};
  if (meta.v === D.v && !FORCE && rep.est !== "w") { console.log("La red ya está al día."); return; }

  const { getAuth } = await import("firebase-admin/auth");
  const A = []; let pt; do { const r = await getAuth().listUsers(1000, pt); A.push(...r.users); pt = r.pageToken; } while (pt);
  const mail = new Map(A.map(a => [a.uid, String(a.email || "").toLowerCase()]));
  const S = (await db.collection("users").get()).docs.map(d => ({ uid: d.id, ...d.data(), email: mail.get(d.id) || String(d.data().email || "").toLowerCase() }))
    .filter(x => x.registro && x.registro.nombre && x.email !== SOLO);
  const H = {}; for (const x of S) { const r = x.registro; for (const h of [ahKe(x.email), ahKe(r.correo), ahKw(r.whatsapp)]) if (h && !H[h]) H[h] = x; }
  const P = {}; for (const r of D.rows) P[r.k] = r;
  const U = {};
  const uOf = kk => { if (kk in U) return U[kk]; const r = P[kk]; if (!r) return (U[kk] = null);
    let x = (r.ek && H[r.ek]) || (r.wk && H[r.wk]) || null;
    if (!x) { const c = S.filter(s => mismoNombre(s.registro.nombre, r.n)); if (c.length === 1) x = c[0]; }
    return (U[kk] = x); };
  const md = new Map(S.map(x => [x.uid, RG_MD.test(rangoUsr(x, team))]));
  const invDe = x => { const n = String(x.registro.nombre || "socio").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").split("-").slice(0, 2).join("-");
    return (n || "socio") + "-" + String(x.uid).slice(0, 4).toLowerCase(); };
  const root = S.find(x => x.email === ROOT);
  const docs = {}; let enApp = 0;
  for (const r of D.rows) {
    const me = uOf(r.k); if (me) enApp++;
    const ve = new Set(); let iv = "";
    (r.anc || []).forEach((kk, j) => { const x = uOf(kk); if (!x) return; if (!iv) iv = invDe(x); if (j === 0 || md.get(x.uid)) ve.add(x.uid); });
    if (root) { ve.add(root.uid); if (!iv) iv = invDe(root); }
    if (me) ve.delete(me.uid);
    const o = { an: (r.anc || []).map(kk => (P[kk] || {}).n || ""), ap: (r.anc || []).map(kk => (P[kk] || {}).lv || 0), au: (r.anc || []).map(kk => { const x = uOf(kk); return x ? x.uid : ""; }),
      ps: r.ps ? 1 : 0, n: r.n, t: r.t, pl: r.pl || "", lv: r.lv || 0, sp: r.sp || "", w: r.w || "", ek: r.ek || "", wk: r.wk || "", ve: [...ve], u: me ? me.uid : "", iv, v: D.v };
    if (r.t === "p") { o.dp = r.dp; o.in = r.in; }
    docs[r.k] = o;
  }
  // Solo se escribe lo que cambió (sin contar v ni st)
  const old = {}; (await db.collection("red").get()).docs.forEach(d => old[d.id] = d.data());
  const sinV = o => { const { v, st, ...z } = o || {}; return JSON.stringify(Object.keys(z).sort().map(c => [c, z[c]])); };
  const ops = [];
  for (const [kk, o] of Object.entries(docs)) { const a = old[kk]; o.st = a && a.t === o.t && a.st ? a.st : {};
    if (!a || sinV(a) !== sinV(o) || JSON.stringify(a.st || {}) !== JSON.stringify(o.st)) ops.push(["set", kk, o]); }
  for (const kk of Object.keys(old)) if (!docs[kk]) ops.push(["del", kk]);
  // Plan real del reporte → registro.plan (los cambios manuales del admin mandan)
  const planes = []; const PL = /^(Classic|Premium|Starter)$/;
  for (const r of D.rows) { const me = uOf(r.k); if (!me || !PL.test(r.pl || "") || r.t === "x") continue;
    const g = me.registro; if (g.planPor === "admin" || g.plan === r.pl) continue; planes.push([me.uid, r.pl]); }
  const prem = [...new Set(D.rows.filter(r => r.t !== "x" && r.pl === "Premium").map(r => r.n))].sort();
  const c = { s: 0, c: 0, p: 0, x: 0 }; for (const r of D.rows) c[r.t] = (c[r.t] || 0) + 1;
  console.log(`personas ${D.rows.length} · socios ${c.s} · clientes ${c.c} · pendientes ${c.p} · sin membresía ${c.x} · en la app ${enApp}`);
  console.log(`cambios en red: ${ops.length} · planes corregidos: ${planes.length} · Premium: ${prem.length}${DRY ? " (prueba, no se escribe)" : ""}`);
  if (DRY) return;
  for (let i = 0; i < ops.length; i += 400) { const bt = db.batch();
    for (const [t, kk, o] of ops.slice(i, i + 400)) { const ref = db.doc("red/" + kk); t === "set" ? bt.set(ref, o) : bt.delete(ref); } await bt.commit(); }
  for (let i = 0; i < planes.length; i += 400) { const bt = db.batch();
    for (const [uid, pl] of planes.slice(i, i + 400)) bt.update(db.doc("users/" + uid), { "registro.plan": pl, "registro.planPor": "reporte", "registro.planCambio": Date.now() }); await bt.commit(); }
  await db.doc("team/prem").set({ n: prem, v: D.v, t: Date.now() });
  const res = { v: D.v, t: Date.now(), n: D.rows.length, s: c.s, c: c.c, p: c.p, x: c.x, app: enApp, pl: planes.length };
  await metaRef.set(res);
  if (rep.est === "w" || rep.est === "p") await repRef.set({ est: "ok", tf: Date.now(), res, f: FieldValue.delete() }, { merge: true });
  // Aviso a los admins
  const adm = A.filter(a => ADMINS.includes(String(a.email || "").toLowerCase())).map(a => a.uid);
  const pd = (await Promise.all(adm.map(u => db.doc("push/" + u).get()))).filter(d => d.exists && d.data().tk);
  if (!pd.length) return;
  const m = { title: "✅ Red de inCruises actualizada", body: `${D.rows.length} personas: ${c.s} socios, ${c.c} clientes, ${c.p} ahorros pendientes. ${enApp} ya están en la app.` };
  const { getMessaging } = await import("firebase-admin/messaging");
  const r = await getMessaging().sendEach(pd.map(d => ({ token: d.data().tk, webpush: { notification: { title: m.title, body: m.body, icon: ICON, badge: ICON }, fcmOptions: { link: APP + "?av=rep" } } })));
  const t = Date.now();
  await Promise.all(pd.map((d, j) => r.responses[j].success ? db.doc("push/" + d.id).set({ h: (d.data().h || []).concat([{ t, ti: m.title, b: m.body, v: "rep" }]).slice(-30) }, { merge: true }) : null));
  console.log(`aviso a admins: ${r.successCount}`);
}
main().catch(e => { console.error(e && e.message ? e.message.slice(0, 200) : e); process.exit(1); });
