const st={u:JSON.parse(localStorage.getItem('stubUser')||'null'),cbs:[]};
export const getAuth=()=>({});export class GoogleAuthProvider{setCustomParameters(){}}
export const signInWithPopup=async()=>{localStorage.setItem('stubUser',JSON.stringify({uid:'u1',email:'socio@gmail.com',emailVerified:true,displayName:'Juan Pérez'}));st.u=JSON.parse(localStorage.getItem('stubUser'));st.cbs.forEach(c=>c(st.u))};
export const signInWithRedirect=signInWithPopup;export const getRedirectResult=async()=>null;
export const onAuthStateChanged=(a,cb)=>{st.cbs.push(cb);setTimeout(()=>cb(st.u),50)};
export const signOut=async()=>{localStorage.removeItem('stubUser');st.u=null;st.cbs.forEach(c=>c(null))};
export const setPersistence=async()=>{};export const browserLocalPersistence={};
