// Mantenimiento puntual (se borra después de usarlo).
import fs from "node:fs";
const P = JSON.parse(fs.readFileSync(new URL("./mant.json", import.meta.url)));
const fnv = s => { let h = 0x811c9dc5; for (const b of Buffer.from("alp|" + s)) { h ^= b; h = Math.imul(h, 0x01000193) >>> 0; } return h.toString(16).padStart(8, "0").slice(0, 6); };
const { initializeApp, cert } = await import("firebase-admin/app");
const { getFirestore } = await import("firebase-admin/firestore");
const { getAuth } = await import("firebase-admin/auth");
initializeApp({ credential: cert(JSON.parse(process.env.FIREBASE_SA)) });
const db = getFirestore(), auth = getAuth();
let uid = null, tok;
do { const r = await auth.listUsers(1000, tok); for (const u of r.users) if (u.email && fnv("e:" + u.email.trim().toLowerCase()) === P.h) uid = u.uid; tok = r.pageToken; } while (!uid && tok);
if (!uid) { console.log("x"); process.exit(1); }
const K = ["historia", "audio", "contactos", "presentaciones", "seguimientos"];
const ref = db.doc(`users/${uid}/datos/rutina-${P.d}`), d = (await ref.get()).data() || {};
if (!(+d.contactos >= 1)) { const conL = (d.conL || []).concat([{ cid: "", n: "Persona nueva" }]); await ref.set({ conL, contactos: Math.max(1, conL.length) }, { merge: true }); }
const d2 = (await ref.get()).data() || {};
console.log("estado " + K.map(k => (+d2[k] >= 1 ? 1 : 0)).join(""));
