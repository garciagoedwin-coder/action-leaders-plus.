// Diagnóstico puntual (solo totales, sin nombres ni correos). Se borra después.
const { initializeApp, cert } = await import("firebase-admin/app");
const { getFirestore } = await import("firebase-admin/firestore");
initializeApp({ credential: cert(JSON.parse(process.env.FIREBASE_SA)) });
const db = getFirestore(), now = Date.now(), D = 864e5, out = [];
const P = (k, v) => out.push(k + "=" + (typeof v === "object" ? Object.entries(v).sort((a,b)=>b[1]-a[1]).map(([a, b]) => a + ":" + b).join(" | ") : v));
const ms = v => { if (!v) return 0; if (typeof v === "number") return v < 1e12 ? v * 1000 : v; if (v.toMillis) return v.toMillis(); const t = Date.parse(v); return isNaN(t) ? 0 : t; };
const inc = (o, k, n = 1) => { o[k] = (o[k] || 0) + n };
const uidDe = ref => ref.path.split("/")[1];
const us = await db.collection("users").get(), pu = await db.collection("push").get();
const PU = new Map(pu.docs.map(d => [d.id, d.data()]));
const crm = await db.collectionGroup("crm").get(), CR = new Map();
for (const d of crm.docs) { const u = uidDe(d.ref); if (!CR.has(u)) CR.set(u, []); CR.get(u).push(d.data()); }
const ci = await db.collectionGroup("citas").get(), CI = new Map();
for (const d of ci.docs) { const u = uidDe(d.ref); if (!CI.has(u)) CI.set(u, []); CI.get(u).push(d.data()); }
// ===== AVISOS =====
const A = {}, actK = {};
for (const d of us.docs) { const x = d.data(); if (!(x.registro && x.registro.nombre) || x.soloAdmin) continue; const t = ms((x.actividad || {}).t); const p = PU.get(d.id);
  Object.keys(x.actividad || {}).forEach(k => inc(actK, k));
  const g = t > now - 7 * D ? "act7" : t > now - 30 * D ? "act30" : "inact";
  inc(A, g + "_total"); if (!p) inc(A, g + "_nuncaActivo"); else if (!p.tk) inc(A, g + "_perdioToken"); else inc(A, g + "_conAvisos");
  if (p) inc(A, g + (p.ios ? "_iphone" : "_android")); if (p && p.tk && ms(p.t) < now - 30 * D) inc(A, g + "_tokenViejo30d"); }
P("AVISOS", A); P("ACTIVIDAD_CAMPOS", actK);
// ===== INICIO RAPIDO =====
const V2D = Date.parse("2026-11-06T06:00:00Z"), IRD = "2026-11-02";
const pasos = {}, primero = {}, semanas = {}, dias = {}; let nIR = 0;
for (const d of us.docs) { const x = d.data(), r = x.registro || {}; if (!r.nombre || x.soloAdmin) continue; const ir = x.ir || {};
  const nuevo = String(r.fecha || "") >= IRD; if (!ir.ini && !nuevo) continue; nIR++;
  const ini = ir.ini || Date.parse(r.fecha) || now, V2 = Date.parse(r.fecha || "") >= V2D, mk = ir.mk || {}, c = ir.c || {}, med = ir.med || {};
  const dia = Math.floor((now - ini) / D) + 1; inc(dias, dia <= 7 ? "dia1a7" : dia <= 14 ? "dia8a14" : dia <= 21 ? "dia15a21" : dia <= 30 ? "dia22a30" : "mas30");
  inc(semanas, med[4] || ir.grad ? "graduado" : med[3] ? "sem4" : med[2] ? "sem3" : med[1] ? "sem2" : "sem1");
  if (med[1]) continue; // ya pasó la semana 1
  let sn = null, pf = null; try { sn = (await db.doc("users/" + d.id + "/datos/suenosInfo").get()).data() } catch (e) {} try { pf = (await db.doc("users/" + d.id + "/datos/perfil").get()).data() } catch (e) {}
  const C = CR.get(d.id) || [], pt = PU.get(d.id), iniD = new Date(ini).toISOString().slice(0, 10);
  const lid = (CI.get(d.id) || []).filter(z => z.tipo === "lider" && !z.cancel && String(z.fecha || "") >= iniD).length;
  const herrN = ["alp", "yess", "pres"].filter(k => mk[k]).length + ((mk.avisos || (pt && pt.tk)) ? 1 : 0);
  const L = [["1porque", !!(sn && String(sn.porque || "").trim())], ["2meta", !!(ir.meta && ir.meta.tiempo)], ["3pagoRecurrente", !!mk.pago], ["4patrocinador", !!r.patrocinadorUid],
    ["5linkReferido", !!(pf && String(pf.ref || "").trim())], ["6herramientas", herrN >= 4 || ["pago","app","arr","work","yess","caja"].every(k => mk[k])], ["7actividadConLider", lid > 0 || !!mk.act1],
    ...(V2 ? [["8lista20", C.length >= 20], ["9contactar10", C.filter(z => (z.stage || "Nuevo") !== "Nuevo").length >= 10], ["10pres3", (c.pres || 0) >= 3], ["11training", !!mk.ent]]
      : [["8lista30", C.length >= 30], ["9contactar10", C.filter(z => (z.stage || "Nuevo") !== "Nuevo").length >= 10], ["10pres5", (c.pres || 0) >= 5], ["11seguim5", (c.seg || 0) >= 5]])];
  L.forEach(([k, ok]) => inc(pasos, k + (ok ? "_SI" : "_NO"))); const f = L.find(z => !z[1]); inc(primero, f ? f[0] : "todoListo");
  inc(pasos, "herrAlp_" + (mk.alp ? 1 : 0)); inc(pasos, "herrAvisos_" + ((mk.avisos || (pt && pt.tk)) ? 1 : 0)); inc(pasos, "herrYess_" + (mk.yess ? 1 : 0)); inc(pasos, "herrPres_" + (mk.pres ? 1 : 0));
  inc(pasos, "pendientesEnSem1_" + L.filter(z => !z[1]).length); }
P("IR_TOTAL", nIR); P("IR_SEMANA_ACTUAL", semanas); P("IR_DIAS", dias); P("IR_SEM1_PRIMER_PASO_PENDIENTE", primero);
Object.entries(pasos).sort().forEach(([k, v]) => out.push("IR_PASO " + k + "=" + v));
// ===== CIERRE =====
const K = {}; const usPC = new Set(), usSeg = new Set();
for (const [u, L] of CR) for (const z of L) { const s = z.stage || "Nuevo", t = ms(z.stT || z.updated); const age = t ? Math.floor((now - t) / D) : 999;
  if (s === "Por cerrar" || s === "Seguimiento") { inc(K, s + (age <= 7 ? "_0a7d" : age <= 14 ? "_8a14d" : age <= 30 ? "_15a30d" : "_mas30d")); (s === "Por cerrar" ? usPC : usSeg).add(u); }
  if ((s === "Socio" || s === "Cliente") && t > now - 30 * D) inc(K, "cerrados30d"); if (s === "No interesado" && t > now - 30 * D) inc(K, "noInteresado30d"); }
P("CIERRE", K); P("SOCIOS_CON_PORCERRAR", usPC.size); P("SOCIOS_CON_SEGUIMIENTO", usSeg.size);
// ===== AGENDA CONMIGO =====
const pf = await db.collection("perfiles").get(); let slots = 0; pf.docs.forEach(d => { if ((d.data().slots || []).length) slots++ });
let rs = { total: 0, ult30: 0 }; try { const r = await db.collection("reservas").get(); rs.total = r.size; r.docs.forEach(d => { const x = d.data(); if (ms(x.t || x.creado || x.fecha) > now - 30 * D) rs.ult30++ }) } catch (e) { rs.total = "x" }
P("PAGINAS", pf.size); P("PAGINAS_CON_HORARIOS", slots); P("RESERVAS_TOTAL", rs.total); P("RESERVAS_30D", rs.ult30);
console.log("DIAG_INICIO"); out.forEach(l => console.log("DIAG " + l.replace(/[{}]/g, ""))); console.log("DIAG_FIN");
