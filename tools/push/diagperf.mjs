// Arreglo puntual (13 nov, Edwin): la cuenta solo-admin (garciagoedwin@) no es socio: se renombra «Admin Edwin», sale de la línea de Edwin
// (sin patrocinador ni línea), se marca soloAdm y se borra su constancia (y su entrada en team/constres). Solo conteos en el log.
import admin from "firebase-admin";
admin.initializeApp({ credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SA)) });
const db = admin.firestore(), FV = admin.firestore.FieldValue;
const U = (await db.collection("users").where("email", "==", "garciagoedwin@gmail.com").get()).docs;
let n = 0;
for (const d of U) { const id = d.id;
  await d.ref.update({ "registro.nombre": "Admin Edwin", "registro.patrocinadorUid": FV.delete(), "registro.patrocinador": FV.delete(), "registro.invitadoPor": FV.delete(), "registro.linea": [], soloAdm: true });
  await db.doc("constancia/" + id).delete().catch(() => {});
  await db.doc("fotos/" + id).set({ oculto: true, invNombre: "Admin Edwin", t: Date.now() }, { merge: true });
  await db.doc("team/constres").update({ ["m." + id]: FV.delete() }).catch(() => {});
  n++; }
console.log("cuentas solo-admin arregladas:", n);
