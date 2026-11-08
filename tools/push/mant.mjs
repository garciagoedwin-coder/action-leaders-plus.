const { initializeApp, cert } = await import("firebase-admin/app");
const { getFirestore } = await import("firebase-admin/firestore");
initializeApp({ credential: cert(JSON.parse(process.env.FIREBASE_SA)) });
const db = getFirestore(), q = s => /navarro/i.test(s || "");
for (const d of (await db.collection("fotos").get()).docs) { const x = d.data(); if (q(x.nombre) || q(x.invNombre) || q(x.alias) || q(x.rk) || q(x.pub)) console.log("FOTO nombre=" + x.nombre + " | inv=" + x.invNombre + " | alias=" + x.alias + " | rk=" + x.rk + " | pub=" + x.pub + " | img=" + !!x.img + " | oculto=" + !!x.oculto); }
for (const d of (await db.collection("users").get()).docs) { const r = (d.data().registro || {}); if (q(r.nombre) || q(r.nombreRanking)) console.log("USER nombre=" + r.nombre + " | rk=" + r.nombreRanking); }
