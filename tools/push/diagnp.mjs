// Diagnóstico temporal (solo números y fechas; sin nombres).
const { initializeApp, cert } = await import("firebase-admin/app");
const { getFirestore } = await import("firebase-admin/firestore");
initializeApp({ credential: cert(JSON.parse(process.env.FIREBASE_SA)) });
const db = getFirestore();
const nrm = t => String(t || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const us = await db.collection("users").get();
const M = us.docs.filter(d => { const n = nrm((d.data().registro || {}).nombre); return n.includes("josue") && n.includes("delgado"); });
console.log("coincidencias", M.length);
for (const [i, d] of M.entries()) {
  const p = (await db.doc("users/" + d.id + "/datos/perfil").get()).data() || {}, np = p.np || {};
  const f = o => Object.fromEntries(Object.entries(o || {}).map(([k, v]) => [k, typeof v === "number" ? new Date(v - 6 * 3600e3).toISOString().slice(0, 16) : v]));
  const c = (await db.doc("constancia/" + d.id).get()).data() || {};
  console.log("#" + i, "v", JSON.stringify(f(np.v)), "d", JSON.stringify(np.d || {}), "w", JSON.stringify(f(np.w)), "q", JSON.stringify(f(np.q)), "const.np", JSON.stringify(c.np ? { n: c.np.n, t: c.np.t && new Date(c.np.t - 6 * 3600e3).toISOString().slice(0, 16) } : null));
}
