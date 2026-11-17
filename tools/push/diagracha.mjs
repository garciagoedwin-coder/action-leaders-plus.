// Diagnóstico de la racha de la cuenta del creador (edwing.go). Logs públicos: solo números por día.
const { initializeApp, cert } = await import("firebase-admin/app");
const { getFirestore } = await import("firebase-admin/firestore");
const { getAuth } = await import("firebase-admin/auth");
initializeApp({ credential: cert(JSON.parse(process.env.FIREBASE_SA)) });
const db = getFirestore(), u = await getAuth().getUserByEmail("edwing.go@gmail.com");
const K = ["historia", "audio", "contactos", "presentaciones", "seguimientos"], M = process.env.MES || "2026-11";
let out = [];
for (let i = 1; i <= 31; i++) { const f = M + "-" + String(i).padStart(2, "0"); const s = await db.doc(`users/${u.uid}/datos/rutina-${f}`).get(); if (!s.exists) { out.push(f.slice(8) + ":-"); continue; } const d = s.data(); out.push(f.slice(8) + ":" + K.map(k => (+d[k] || 0) >= 1 ? "1" : "0").join("")); }
console.log("dias", out.join(" "));
for (const f of ["2026-10-30", "2026-10-31"]) { const s = await db.doc(`users/${u.uid}/datos/rutina-${f}`).get(); const d = s.exists ? s.data() : {}; console.log(f, K.map(k => (+d[k] || 0) >= 1 ? "1" : "0").join("")); }
const c = (await db.doc("constancia/" + u.uid).get()).data() || {};
console.log("const", JSON.stringify({ rv: c.rv, vr: c.vr, vg: c.vg, vu: c.vu, rvOk: c.rvOk, mesComp: c.mesComp, mesDias: c.mesDias, racha: c.racha, rr: c.rr, mes: c.mes, u: c.u }));
const p = (await db.doc(`users/${u.uid}/datos/perfil`).get()).data() || {};
console.log("rvH", JSON.stringify(p.rvH || null));
