// Diagnóstico de una sola vez (10 nov): perfiles sin campo uid (antes de cerrar la regla). Solo lee; imprime solo conteos.
import admin from "firebase-admin";
admin.initializeApp({credential:admin.credential.cert(JSON.parse(process.env.FIREBASE_SA))});
const q=await admin.firestore().collection("perfiles").get();let sin=0,ok=0,inval=0;const us=new Map();
for(const d of q.docs){const x=d.data();if(!x.uid){sin++;continue}ok++;us.set(x.uid,(us.get(x.uid)||0)+1)}
let rep=0;for(const v of us.values())if(v>1)rep++;
console.log("perfiles",q.size,"con uid",ok,"SIN uid",sin,"uids con >1 perfil",rep);
