// Diagnóstico temporal: turnos del mes CIFRADOS (el log es público: solo texto cifrado con la llave del equipo)
import crypto from "node:crypto";
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
initializeApp({ credential: cert(JSON.parse(process.env.FIREBASE_SA)) });
const db = getFirestore();
const k = ((await db.doc("evento/sps26/priv/llave").get()).data() || {}).k;
const key = Buffer.from(k.replace(/-/g, "+").replace(/_/g, "/"), "base64");
const t = (await db.doc("turnos/2026-11").get()).data() || {};
const iv = crypto.randomBytes(12), c = crypto.createCipheriv("aes-256-gcm", key, iv);
const enc = Buffer.concat([iv, c.update(JSON.stringify(t), "utf8"), c.final(), c.getAuthTag()]).toString("base64");
console.log("ENC-INI"); for (let i = 0; i < enc.length; i += 4000) console.log(enc.slice(i, i + 4000)); console.log("ENC-FIN");
