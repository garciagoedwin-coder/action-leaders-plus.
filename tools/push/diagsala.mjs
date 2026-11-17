// Diagnóstico temporal de avisos de la presentación virtual (cuenta edwing.go). Logs públicos: solo números, sin nombres.
const { initializeApp, cert } = await import("firebase-admin/app");
const { getFirestore } = await import("firebase-admin/firestore");
const { getAuth } = await import("firebase-admin/auth");
initializeApp({ credential: cert(JSON.parse(process.env.FIREBASE_SA)) });
const db = getFirestore(), H = h => ((Date.now() - (+h || 0)) / 36e5).toFixed(1) + "h";
for (const mail of ["edwing.go@gmail.com", "garciagoedwin@gmail.com"]) {
  let u; try { u = await getAuth().getUserByEmail(mail); } catch { continue; }
  const p = (await db.doc("push/" + u.uid).get()).data() || {};
  console.log("== cuenta", mail.slice(0, 4), "| tk:", !!p.tk, "| tk guardado hace", H(p.t), "| ios:", !!p.ios, "| pr:", JSON.stringify(p.pr || {}), "| historial:", (p.h || []).length);
  console.log("ultimos avisos (v, hace):", (p.h || []).slice(-12).map(x => (x.v || "?") + "@" + H(x.t)).join(" "));
  const S = (await db.collection("users/" + u.uid + "/sala").where("t", ">", Date.now() - 72 * 36e5).get()).docs;
  console.log("sala 72h:", S.length);
  for (const d of S) { const a = d.data(); console.log(" doc", d.id.slice(0, 2) + "…", "t0", H(a.t0), "t", H(a.t), "pct", a.pct, "pulso", !!a.pulso, "r1", !!a.r1, "pais", !!a.pais, "resp", !!a.resp, "como", !!a.como, "c", a.c === "yo" ? "yo" : !!a.c); }
}
