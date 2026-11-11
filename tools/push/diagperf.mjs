// Diagnóstico (11 nov): tokens de avisos guardados recientemente y fotos subidas (solo conteos).
import admin from "firebase-admin";
admin.initializeApp({credential:admin.credential.cert(JSON.parse(process.env.FIREBASE_SA))});
const db=admin.firestore(),auth=admin.auth(),now=Date.now();
const P=(await db.collection("push").get()).docs.map(d=>({id:d.id,...d.data()}));
const hrs=h=>P.filter(p=>p.tk&&p.t&&now-p.t<h*36e5).length;
console.log("push con token",P.filter(p=>p.tk).length,"· guardados en 6h",hrs(6),"· 12h",hrs(12),"· 24h",hrs(24),"· 48h",hrs(48));
const F=(await db.collection("fotos").get()).docs.map(d=>d.data().t||0);
console.log("fotos subidas en 6h",F.filter(t=>now-t<6*36e5).length,"· 24h",F.filter(t=>now-t<24*36e5).length,"· 48h",F.filter(t=>now-t<48*36e5).length);
for(const e of ["garciagoedwin@gmail.com","edwing.go@gmail.com"]){const a=await auth.getUserByEmail(e).catch(()=>null);if(!a)continue;const p=P.find(x=>x.id===a.uid);
  console.log(e.slice(0,5)+"…","token:",!!(p&&p.tk),"· guardado hace h:",p&&p.t?Math.round((now-p.t)/36e5):null,"· ios:",p&&p.ios,"· último acceso h:",a.metadata.lastRefreshTime?Math.round((now-Date.parse(a.metadata.lastRefreshTime))/36e5):null);}
