// Diagnóstico (solo admin, logs públicos: solo nombres de campos y sí/no): ¿la página pública de la cuenta del creador tiene juntas guardadas para el link corto?
const { initializeApp, cert } = await import("firebase-admin/app");
const { getFirestore } = await import("firebase-admin/firestore");
const { getAuth } = await import("firebase-admin/auth");
initializeApp({ credential: cert(JSON.parse(process.env.FIREBASE_SA)) });
const db = getFirestore(), u = await getAuth().getUserByEmail("edwing.go@gmail.com");
const q = await db.collection("perfiles").where("uid", "==", u.uid).get();
console.log("perfiles de la cuenta:", q.size);
for (const d of q.docs) { const x = d.data(); console.log("doc", d.id.replace(/-[a-z0-9]{4}$/, "-****"), "campos:", Object.keys(x).sort().join(","), "| ev:", x.ev ? Object.keys(x.ev).join(",") : "NO", "| t:", new Date(+x.t || 0).toISOString()); }
