// Análisis puntual de uso (solo totales, sin nombres). Se borra después.
const { initializeApp, cert } = await import("firebase-admin/app");
const { getFirestore } = await import("firebase-admin/firestore");
initializeApp({ credential: cert(JSON.parse(process.env.FIREBASE_SA)) });
const db = getFirestore(), now = Date.now(), D = 864e5, d7 = now - 7 * D, d30 = now - 30 * D, R = {};
const ms = v => { if (!v) return 0; if (typeof v === "number") return v < 1e12 ? v * 1000 : v; if (v.toMillis) return v.toMillis(); const t = Date.parse(v); return isNaN(t) ? 0 : t; };
const uidDe = ref => ref.path.split("/")[1];
// usuarios
const us = await db.collection("users").get(); const U = { total: 0, reg: 0, act1: 0, act7: 0, act30: 0, ir: 0, irMed1: 0, irMed2: 0, irGrad: 0, compSi: 0, compNo: 0, lzG: 0, metas: 0, sol: 0 };
for (const d of us.docs) { const x = d.data(); U.total++; if (x.registro && x.registro.nombre) U.reg++; const t = ms((x.actividad || {}).t); if (t > now - D) U.act1++; if (t > d7) U.act7++; if (t > d30) U.act30++;
  if (x.ir && x.ir.ini) { U.ir++; const m = x.ir.med || {}; if (m[1]) U.irMed1++; if (m[2]) U.irMed2++; if (x.ir.grad) U.irGrad++; }
  if (x.comp && x.comp.mes === "2026-11") x.comp.no ? U.compNo++ : U.compSi++; if (x.lzG && x.lzG.m === "2026-11") U.lzG++; if (x.metas) U.metas++; if (x.sol) U.sol++; }
R.usuarios = U;
const pu = await db.collection("push").get(); const P = { conToken: 0, iphone: 0, sistema: 0, conHistorial: 0 };
for (const d of pu.docs) { const x = d.data(); if (x.tk) P.conToken++; if (x.ios) P.iphone++; if (x.sis) P.sistema++; if ((x.h || []).length) P.conHistorial++; } R.avisos = P;
// rutina
const K = ["historia", "audio", "contactos", "presentaciones", "seguimientos"], ini30 = new Date(d30).toISOString().slice(0, 10), ini7 = new Date(d7).toISOString().slice(0, 10);
const dt = await db.collectionGroup("datos").get(); const RU = { dias30: 0, dias7: 0, completos30: 0, usuarios30: new Set(), usuarios7: new Set(), hAtr30: 0, hFly30: 0 }; const pk = Object.fromEntries(K.map(k => [k, { d30: 0, d7: 0 }]));
for (const d of dt.docs) { if (!d.id.startsWith("rutina-")) continue; const f = d.id.slice(7), x = d.data(); if (f < ini30) continue; const n = K.filter(k => +x[k] >= 1).length; if (!n) continue;
  RU.dias30++; RU.usuarios30.add(uidDe(d.ref)); if (n === 5) RU.completos30++; if (x.hAtr) RU.hAtr30++; if (x.hFly) RU.hFly30++;
  for (const k of K) if (+x[k] >= 1) { pk[k].d30++; if (f >= ini7) pk[k].d7++; } if (f >= ini7) { RU.dias7++; RU.usuarios7.add(uidDe(d.ref)); } }
R.rutina = { ...RU, usuarios30: RU.usuarios30.size, usuarios7: RU.usuarios7.size, porPunto: pk };
// CRM
const cr = await db.collectionGroup("crm").get(); const C = { total: 0, nuevos7: 0, nuevos30: 0, usuarios: new Set(), usuariosNuevos30: new Set(), etapas: {}, presInteractiva: 0, memEnviada: 0, conSeguimientoNotas: 0, caminoGuiado: 0, clientesDT: 0 };
for (const d of cr.docs) { const x = d.data(); C.total++; C.usuarios.add(uidDe(d.ref)); const c = ms(x.creado); if (c > d7) C.nuevos7++; if (c > d30) { C.nuevos30++; C.usuariosNuevos30.add(uidDe(d.ref)); }
  const s = x.stage || "?"; C.etapas[s] = (C.etapas[s] || 0) + 1; if (x.pres) C.presInteractiva++; if (x.memEnv) C.memEnviada++; if ((x.seg || []).length) C.conSeguimientoNotas++; if (x.fl) C.caminoGuiado++; if (x.dtc) C.clientesDT++; }
R.crm = { ...C, usuarios: C.usuarios.size, usuariosNuevos30: C.usuariosNuevos30.size };
// citas
const ci = await db.collectionGroup("citas").get(); const CI = { total: 0, mov30: 0, usuarios30: new Set(), tipos: {}, l3: 0, lanz: 0, presNeg: 0, conResultado: 0 };
for (const d of ci.docs) { const x = d.data(); CI.total++; const t = ms(x.t); if (t > d30) { CI.mov30++; CI.usuarios30.add(uidDe(d.ref)); } CI.tipos[x.tipo || "?"] = (CI.tipos[x.tipo || "?"] || 0) + 1; if (x.l3) CI.l3++; if (x.lz) { x.lzT === "pres" ? CI.presNeg++ : CI.lanz++; } if (x.res) CI.conResultado++; }
R.citas = { ...CI, usuarios30: CI.usuarios30.size };
// llamadas de 3 / lanzamientos
const l3 = await db.collection("llamadas3").get(); const L = { total: 0, l3: 0, lanz: 0, presNeg: 0, estados: {} };
for (const d of l3.docs) { const x = d.data(); L.total++; if (x.lz) { x.lzT === "pres" ? L.presNeg++ : L.lanz++; } else L.l3++; L.estados[x.estado || "?"] = (L.estados[x.estado || "?"] || 0) + 1; } R.llamadas3 = L;
// juntas y eventos
const ev = await db.collection("agendaEv").get(); const E = { total: 0, juntas: 0, gran: 0, canceladas: 0, creadores: new Set() };
for (const d of ev.docs) { const x = d.data(); E.total++; x.tipo === "gran" ? E.gran++ : E.juntas++; if (x.cancel) E.canceladas++; if (x.cre) E.creadores.add(x.cre); }
R.eventos = { ...E, creadores: E.creadores.size };
try { R.confirmadosJuntas = (await db.collectionGroup("rsvp").get()).size; } catch (e) { R.confirmadosJuntas = "x"; }
// presentación virtual y membresía
const sa = await db.collectionGroup("sala").get(); const S = { virtual: 0, virtualVistas: 0, membresia: 0, membresiaAbiertas: 0, simulador: 0, socios: new Set() };
for (const d of sa.docs) { const x = d.data(); S.socios.add(uidDe(d.ref)); if (d.id.startsWith("m_")) { S.membresia++; if (x.t0 || x.pct) S.membresiaAbiertas++; if (x.resp === "sim") S.simulador++; } else { S.virtual++; if (x.t0 || x.pct) S.virtualVistas++; } }
R.salaYMembresia = { ...S, socios: S.socios.size };
// constancia, perfiles, invitaciones, turnos
R.constancia = (await db.collection("constancia").get()).size;
const pf = await db.collection("perfiles").get(); let slots = 0; pf.docs.forEach(d => { if ((d.data().slots || []).length) slots++; }); R.paginaPersonal = { perfiles: pf.size, conHorarios: slots };
try { R.reservasAgendaConmigo = (await db.collection("reservas").get()).size; } catch (e) {}
try { R.prospectosPagina = (await db.collectionGroup("prospectos").get()).size; } catch (e) {}
try { const iv = await db.collection("invitaciones").get(); let n30 = 0; iv.docs.forEach(d => { if (ms(d.data().t || d.data().fecha) > d30) n30++; }); R.invitaciones = { total: iv.size, ult30: n30 }; } catch (e) {}
try { const tu = (await db.doc("turnos/2026-11").get()).data() || {}; let p = 0, e = 0; for (const v of Object.values(tu.s || {})) { if (v.p) p++; if (v.e) e++; } R.turnosNov = { presenta: p, edifica: e }; } catch (e) {}
const red = x => JSON.stringify(x, (k, v) => v instanceof Set ? v.size : v);
console.log("RESULTADO " + red(R));
