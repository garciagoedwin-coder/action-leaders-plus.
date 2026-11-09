// Corrección manual SOLO para la cuenta del creador (Edwin): anotar en un día pasado una persona agregada a la lista que se olvidó registrar.
// Uso (GitHub Actions, workflow_dispatch): FECHA=AAAA-MM-DD, PRES=1 también anota una presentación. Logs públicos: solo conteos.
const { initializeApp, cert } = await import("firebase-admin/app");
const { getFirestore } = await import("firebase-admin/firestore");
const { getAuth } = await import("firebase-admin/auth");
initializeApp({ credential: cert(JSON.parse(process.env.FIREBASE_SA)) });
const F = process.env.FECHA || "";
if (!/^\d{4}-\d{2}-\d{2}$/.test(F)) { console.log("fecha inválida"); process.exit(1); }
const u = await getAuth().getUserByEmail("edwing.go@gmail.com");
const ref = getFirestore().doc(`users/${u.uid}/datos/rutina-${F}`);
const s = await ref.get(), d = s.exists ? s.data() : {};
const K = ["historia", "audio", "contactos", "presentaciones", "seguimientos"];
const pts = x => K.filter(k => (+x[k] || 0) >= 1).length;
console.log("antes", pts(d), "de 5", K.map(k => k + ":" + ((+d[k] || 0) >= 1 ? "ok" : "falta")).join(" "));
const conL = (d.conL || []).concat([{ cid: "", n: String(process.env.NOMBRE || "Anotado después").slice(0, 60) }]);
const nd = Object.assign({}, d, { conL, contactos: Math.max((+d.contactos || 0) + 1, conL.length) });
if (process.env.PRES === "1") { nd.presL = (d.presL || []).concat([{ cid: "", n: "Anotado después" }]); nd.presentaciones = Math.max((+d.presentaciones || 0) + 1, nd.presL.length); }
if (process.env.DRY !== "1") await ref.set(nd);
console.log(process.env.DRY === "1" ? "prueba" : "guardado", "después", pts(nd), "de 5");
