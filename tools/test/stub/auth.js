const st={u:JSON.parse(localStorage.getItem('stubUser')||'null'),cbs:[]};
export const getAuth=()=>({});export class GoogleAuthProvider{setCustomParameters(){}}
export const signInWithPopup=async()=>{localStorage.setItem('stubUser',JSON.stringify({uid:'u1',email:'socio@gmail.com',emailVerified:true,displayName:'Juan Pérez'}));st.u=JSON.parse(localStorage.getItem('stubUser'));st.cbs.forEach(c=>c(st.u))};
export const signInWithRedirect=signInWithPopup;export const getRedirectResult=async()=>null;
export const onAuthStateChanged=(a,cb)=>{st.cbs.push(cb);setTimeout(()=>cb(st.u),50)};
export const signOut=async()=>{localStorage.removeItem('stubUser');st.u=null;st.cbs.forEach(c=>c(null))};
export const setPersistence=async()=>{};export const browserLocalPersistence={};

// correo y contraseña (stub): stubPw = {correo:{p,v}}
const pw=()=>JSON.parse(localStorage.getItem('stubPw')||'{}');const setU=u=>{localStorage.setItem('stubUser',JSON.stringify(u));st.u=u;st.cbs.forEach(c=>c(u))};
const E=c=>{const e=new Error(c);e.code=c;return e};
export const signInWithEmailAndPassword=async(a,e,p)=>{const x=pw()[e];if(!x||x.p!==p)throw E('auth/invalid-credential');setU({uid:'m_'+e.replace(/\W/g,''),email:e,emailVerified:!!x.v,displayName:''})};
export const createUserWithEmailAndPassword=async(a,e,p)=>{const P=pw();if(P[e])throw E('auth/email-already-in-use');if(p.length<6)throw E('auth/weak-password');P[e]={p,v:false};localStorage.setItem('stubPw',JSON.stringify(P));const u={uid:'m_'+e.replace(/\W/g,''),email:e,emailVerified:false,displayName:''};setU(u);return {user:u}};
export const sendEmailVerification=async()=>{localStorage.setItem('stubVerifSent',String(Date.now()))};
export const sendPasswordResetEmail=async(a,e)=>{localStorage.setItem('stubReset',e)};
