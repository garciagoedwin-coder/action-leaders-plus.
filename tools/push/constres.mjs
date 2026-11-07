// Resumen de constancia en UN documento (team/constres) para que cada socio lea 1 doc en vez de toda la colección.
// Corre en GitHub Actions cada 15 min (solo trae lo que cambió: where u > último) y completo 1 vez al día (FULL=1 o resumen viejo).
// La app lee team/constres + los cambios desde S.u (constFuente en index.html). Nunca guarda correos ni teléfonos.
const { initializeApp, cert } = await import("firebase-admin/app");
const { getFirestore } = await import("firebase-admin/firestore");
initializeApp({ credential: cert(JSON.parse(process.env.FIREBASE_SA)) });
const db = getFirestore(), ref = db.doc("team/constres");
const s = await ref.get(), S = s.exists ? s.data() : null;
const full = process.env.FULL === "1" || !S || !(+S.b > Date.now() - 26 * 36e5);
let m = full ? {} : Object.assign({}, S.m || {}), u = full ? 0 : +S.u || 0, n = 0;
// Margen de 30 min por relojes de teléfonos atrasados (se vuelve a leer lo reciente; solo escribe si algo cambió).
const q = full ? await db.collection("constancia").get() : await db.collection("constancia").where("u", ">", u - 30 * 6e4).get();
const J = o => JSON.stringify(o, Object.keys(o || {}).sort());
for (const d of q.docs) { const x = d.data(); if (full || J(m[d.id]) !== J(x)) { m[d.id] = x; n++; } if (+x.u > u) u = +x.u; }
if (!full && !n) { console.log("sin cambios"); process.exit(0); }
const tam = Buffer.byteLength(JSON.stringify(m));
if (tam > 900000) { console.log("resumen muy grande", tam); process.exit(1); }
await ref.set({ m, u, b: Date.now(), n: Object.keys(m).length });
console.log(full ? "completo" : "cambios", n, "total", Object.keys(m).length, "kb", Math.round(tam / 1024));
