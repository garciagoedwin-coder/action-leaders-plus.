import admin from "firebase-admin";
admin.initializeApp({credential:admin.credential.cert(JSON.parse(process.env.FIREBASE_SA))});
const d=(await admin.firestore().doc("privAp/zoom").get()).data()||{};
console.log("zoom guardado:",!!d.tr,"· es zoom.us:",/^https:\/\/([a-z0-9-]+\.)*zoom\.us\//i.test(d.tr||""),"· hace min:",d.t?Math.round((Date.now()-d.t)/6e4):"-");
