// Diagnóstico temporal: validación de primera presentación (solo booleanos/números en el log).
const { initializeApp, cert } = await import("firebase-admin/app");
const { getFirestore } = await import("firebase-admin/firestore");
initializeApp({ credential: cert(JSON.parse(process.env.FIREBASE_SA)) });
const db = getFirestore();
const U = (await db.collection("users").get()).docs;
const C = new Map((await db.collection("constancia").get()).docs.map(d => [d.id, d.data()]));
const nrm = s => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const pide = U.filter(d => (d.data().ir || {}).valP);
console.log("socios que pidieron validación:", pide.length);
let i = 0;
for (const d of pide) { i++; const x = d.data(), r = x.registro || {}, ir = x.ir || {}, nm = nrm(r.nombre);
  const tag = /mayck|michael|maickol/.test(nm) ? "M" : /josu.*delgado|delgado.*josu/.test(nm) ? "J" : "#" + i;
  const pat = r.patrocinadorUid, lin = (r.linea || []);
  const conVal = [...C.entries()].filter(([k, c]) => (c.irVal || {})[d.id]).map(([k]) => k === pat ? "PATROCINADOR" : lin.includes(k) ? "linea#" + lin.indexOf(k) : "otro");
  console.log(tag, "| tiene patrocinadorUid:", !!pat, "| linea:", lin.length, "| ir.val:", !!ir.val, "| valP hace h:", ((Date.now() - ir.valP) / 36e5).toFixed(1), "| validado en:", JSON.stringify(conVal), "| semana:", (ir.p || {}).w);
}
