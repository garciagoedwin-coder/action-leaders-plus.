// Diagnóstico puntual (logs públicos: sin nombres, solo sí/no): ¿cómo está registrada la cuenta de una líder del sistema?
const { initializeApp, cert } = await import("firebase-admin/app");
const { getFirestore } = await import("firebase-admin/firestore");
initializeApp({ credential: cert(JSON.parse(process.env.FIREBASE_SA)) });
const db = getFirestore();
const nrm = s => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z ]/g, " ").replace(/\s+/g, " ").trim();
const OBJ = nrm("Karen Lizeth Paz Escober"), W = OBJ.split(" ");
const U = (await db.collection("users").get()).docs.map(d => ({ uid: d.id, ...d.data() }));
const C = U.filter(u => { const n = nrm(u.registro && u.registro.nombre); return n && (n.includes("lizeth") || (n.includes("paz") && (n.includes("karen") || n.includes("escob")))); });
console.log("cuentas candidatas:", C.length);
for (const u of C) { const n = nrm(u.registro.nombre), w = n.split(" "), todas = w.length >= 2 && w.every(x => W.includes(x));
  const ah = u.registro || {};
  console.log("· palabras:", w.length, "| igual exacto:", n === OBJ, "| todas sus palabras en el nombre del sistema:", todas, "| palabras que NO coinciden:", w.filter(x => !W.includes(x)).length,
    "| rango puesto:", !!ah.rango, "| miNombre en perfil:", "?", "| tiene linea:", Array.isArray(ah.linea) && ah.linea.length > 0); }
