// Diagnóstico (solo admin): imprime el bloque de reglas de Firestore en producción para /perfiles (las reglas no son datos personales).
const { initializeApp, cert } = await import("firebase-admin/app");
const { getSecurityRules } = await import("firebase-admin/security-rules");
initializeApp({ credential: cert(JSON.parse(process.env.FIREBASE_SA)) });
const rs = await getSecurityRules().getFirestoreRuleset();
const src = rs.source.map(f => f.content).join("\n");
console.log("reglas creadas:", rs.createTime);
let i = src.indexOf("match /perfiles");
while (i >= 0) { console.log("----"); console.log(src.slice(i, i + 600).split("\n").slice(0, 8).join("\n")); i = src.indexOf("match /perfiles", i + 5); }
if (src.indexOf("match /perfiles") < 0) console.log("SIN BLOQUE perfiles");
