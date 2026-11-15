// Diagnóstico temporal: perfil público de la presentación virtual (solo sí/no y tamaños)
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
const sa = JSON.parse(process.env.FIREBASE_SA); initializeApp({ credential: cert(sa) });
const code = process.env.CODE || "";
const d = await getFirestore().doc("perfiles/" + code).get(), x = d.data() || {};
console.log("existe:", d.exists, "· nombre:", !!x.nombre, "· uid:", !!x.uid, "· foto:", (x.foto || "").length, "· wa:", !!x.wa, "· waS:", !!x.waS, "· campos:", Object.keys(x).sort().join(","));
const r = await fetch("https://firestore.googleapis.com/v1/projects/" + sa.project_id + "/databases/(default)/documents/perfiles/" + code + "?mask.fieldPaths=uid");
console.log("lectura pública sin sesión:", r.status);
