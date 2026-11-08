const { initializeApp, cert } = await import("firebase-admin/app");
const { getFirestore } = await import("firebase-admin/firestore");
initializeApp({ credential: cert(JSON.parse(process.env.FIREBASE_SA)) });
const db = getFirestore(), q = s => /navarro/i.test(s || "");
for (const d of (await db.collection("fotos").get()).docs) { const x = d.data(); if (q(x.nombre) || q(x.invNombre) || q(x.alias) || q(x.rk) || q(x.pub)) console.log("F", JSON.stringify({ n: x.nombre, inv: x.invNombre, al: x.alias, rk: x.rk, pub: x.pub, img: !!x.img, oc: !!x.oculto })); }
for (const d of (await db.collection("users").get()).docs) { const r = (d.data().registro || {}); if (q(r.nombre) || q(r.nombreRanking)) console.log("U", JSON.stringify({ n: r.nombre, rk: r.nombreRanking })); }
