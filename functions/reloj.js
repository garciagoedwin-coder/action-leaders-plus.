// RELOJ DE AVISOS (23 nov 2026, Edwin «Hazlo»). Antes corrían como horarios de GitHub Actions, pero GitHub
// los frenaba (desde el 18 nov: 4–5 veces al día en vez de cada 15 min). Ahora UNA función programada de Firebase
// (cada 15 min) corre los mismos modos de tools/push/enviar.mjs y constres.mjs (copiados aquí al publicar, carpeta push/).
// Cada modo corre como proceso aparte con las credenciales de Firebase (sin clave en el repo).
// Diarios: se corren una vez por día a partir de su hora (Honduras), con marca en push_meta/reloj para no repetir.
// Logs: solo lo que imprimen los scripts (conteos), nunca datos de socios.
const fs = require("node:fs"), path = require("node:path"), { execFile } = require("node:child_process");
const SITE = "https://actionleadersplus.com/";
const R = "/tmp/alp", PUSH = R + "/tools/push";

async function preparar() {
  fs.mkdirSync(PUSH, { recursive: true }); fs.mkdirSync(R + "/data", { recursive: true });
  for (const f of ["enviar.mjs", "constres.mjs", "aprobar.mjs"]) fs.copyFileSync(path.join(__dirname, "push", f), path.join(PUSH, f));
  const nm = R + "/node_modules"; if (!fs.existsSync(nm)) fs.symlinkSync(path.join(__dirname, "node_modules"), nm, "dir");
  for (const f of ["team.json", "ahorro.enc", "hist.json"]) {
    try { const r = await fetch(SITE + "data/" + f + "?t=" + Date.now(), { cache: "no-store" }); if (r.ok) fs.writeFileSync(R + "/data/" + f, Buffer.from(await r.arrayBuffer())); else console.log("bajar", f, r.status); }
    catch (e) { console.log("bajar", f, e.code || e.name); }
  }
}
let EST = {};
const correr = (script, args = [], env = {}) => new Promise(res => {
  const t0 = Date.now();
  execFile(process.execPath, [script, ...args], { cwd: PUSH, env: { ...process.env, FIREBASE_SA: "", DRY: "", ...env }, timeout: 180000, maxBuffer: 4e6 }, (err, out, er) => {
    const txt = (String(out || "") + (err ? " | " + String(er || err.message).slice(0, 300) : "")).trim().replace(/\s+/g, " ").slice(0, 600);
    console.log("reloj", [script, ...args].join(" "), err ? "ERROR" : "ok", Math.round((Date.now() - t0) / 1000) + "s", txt);
    EST[[script.replace(/\.mjs$/, ""), ...args].join(" ")] = err ? "err" : "ok";
    res(!err);
  });
});
const en = (m, ...a) => correr("enviar.mjs", [m, ...a]);

// Hora de Honduras (UTC-6, sin horario de verano)
function hn() { const d = new Date(Date.now() - 6 * 36e5); return { f: d.toISOString().slice(0, 10), min: d.getUTCHours() * 60 + d.getUTCMinutes(), dia: d.getUTCDay(), dm: d.getUTCDate() }; }
// [clave, hora "H:MM", qué correr, condición opcional]. Ventana: desde la hora hasta 2 h después.
const DIARIOS = [
  ["full", "2:07", async () => correr("constres.mjs", [], { FULL: "1" })],
  ["manana", "7:00", async () => { await en("manana"); await en("rhito"); }],
  ["inact", "8:30", async () => en("inact")],
  ["recodia", "8:30", async () => en("recodia"), h => h.dm === 1],
  ["inc1", "9:00", async () => en("inc1")],
  ["sinapp", "9:47", async () => en("sinapp")],
  ["lzg", "10:00", async () => en("lzg")],
  ["viaje", "11:00", async () => en("viaje"), h => h.dia === 6],
  ["crec", "20:00", async () => en("crec"), h => h.dia === 0],
  ["lzs1", "13:20", async () => en("lzg-sync")],
  ["lzs2", "16:20", async () => en("lzg-sync")],
  ["racha", "19:00", async () => { await en("racha"); await en("rhito"); }],
  ["inc2", "19:05", async () => en("inc2")],
  ["lzs3", "19:20", async () => en("lzg-sync")],
  ["racha2", "21:30", async () => { await en("racha2"); await en("rhito"); await en("rc3top"); }],
  ["lzs4", "22:20", async () => en("lzg-sync")],
];
const aMin = s => { const [h, m] = s.split(":").map(Number); return h * 60 + m; };

async function ciclo(db) {
  EST = {}; await preparar();
  const h = hn(), metaRef = db.doc("push_meta/reloj"), meta = (await metaRef.get()).data() || {}, hechos = meta.d || {};
  // Diarios primero (son los que tienen hora fija)
  for (const [k, hr, fn, cond] of DIARIOS) {
    const ini = aMin(hr);
    if (hechos[k] === h.f || h.min < ini || h.min > ini + 120 || (cond && !cond(h))) continue;
    hechos[k] = h.f; await metaRef.set({ d: hechos, t: Date.now() }, { merge: true }); // se marca antes para no repetir si algo se cae a medias
    await fn();
  }
  // Cada 15 min
  await en("agenda"); await en("equipo");
  if (await correr("constres.mjs")) await en("rc3");
  await en("turnos"); await en("pon");
  await en("curso"); await en("logros");
  // Cada 30 min y cada hora (según el minuto de Honduras)
  const q = Math.floor((h.min % 60) / 15); // 0..3
  if (q === 1 || q === 3) await en("salapend");
  if (q === 0) { await en("sol"); await en("evaut"); await en("val"); }
  await metaRef.set({ u: Date.now(), e: EST }, { merge: true }); // e = ok/err por modo (sin datos de socios)
}
module.exports = { ciclo };
