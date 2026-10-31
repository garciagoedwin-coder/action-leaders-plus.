const K='stubFS';const load=()=>JSON.parse(localStorage.getItem(K)||'{}');const save=d=>localStorage.setItem(K,JSON.stringify(d));
export const initializeFirestore=()=>({});export const persistentLocalCache=()=>({});
export const doc=(db,...a)=>({p:a.join('/')});export const collection=(db,...a)=>({p:a.join('/')});export const getFirestore=()=>({});
export const getDoc=async r=>{const d=load();return{exists:()=>r.p in d,data:()=>d[r.p]}};
export const setDoc=async(r,b,o)=>{const d=load();const dm=(a,c)=>{const z=Object.assign({},a||{});for(const k in c){z[k]=(c[k]&&typeof c[k]==='object'&&!Array.isArray(c[k])&&z[k]&&typeof z[k]==='object'&&!Array.isArray(z[k]))?dm(z[k],c[k]):c[k]}return z};d[r.p]=o&&o.merge?dm(d[r.p],b):b;save(d)};
export const getDocs=async r=>{const d=load();const docs=Object.keys(d).filter(k=>k.startsWith(r.p+'/')&&k.slice(r.p.length+1).indexOf('/')<0).map(k=>({id:k.slice(r.p.length+1),data:()=>d[k]}));const g=(o,f)=>f.split('.').reduce((a,k)=>a&&a[k],o);const W0=r.ws||(r.w?[r.w]:[]),lim=(W0.find(w=>w.op==='limit')||{}).v,W=W0.filter(w=>w.op!=='limit');let out=docs.filter(x=>W.every(w=>w.op==='array-contains'?(g(x.data(),w.f)||[]).includes(w.v):w.op==='array-contains-any'?(g(x.data(),w.f)||[]).some(z=>(w.v||[]).includes(z)):w.op==='>'?g(x.data(),w.f)>w.v:g(x.data(),w.f)===w.v));return{docs:lim?out.slice(0,lim):out}};
export const addDoc=async(r,b)=>{const id='x'+Date.now();await setDoc({p:r.p+'/'+id},b);return{id}};
export const deleteDoc=async r=>{const d=load();delete d[r.p];save(d)};
export const onSnapshot=(r,cb)=>{const d=load();if(r.p in d&&!Object.keys(d).some(k=>k.startsWith(r.p+"/")))cb({exists:()=>true,id:r.p.split("/").pop(),data:()=>d[r.p]});else{let last="";const tick=()=>getDocs(r).then(q=>{const k=JSON.stringify(q.docs.map(x=>[x.id,x.data()]));if(k!==last){last=k;cb(q)}});tick();if(r.ws){const iv=setInterval(tick,1000);return()=>clearInterval(iv)}}return()=>{}};
export const serverTimestamp=()=>new Date().toISOString();
export const where=(f,op,v)=>({f,op,v});export const query=(c,...ws)=>({p:c.p,ws});
const _gd=getDocs;
export const getDocsFromCache=async r=>{const q=await getDocs(r);if(!q.docs.length)throw new Error("no-cache");return q};

export const limit=n=>({op:'limit',v:n});
export const updateDoc=async(r,b)=>{const d=load();if(!(r.p in d))throw new Error('not-found');d[r.p]=Object.assign({},d[r.p],b);save(d)};
export const writeBatch=()=>{const o=[];return{set:(r,b)=>o.push(()=>setDoc(r,b)),delete:r=>o.push(()=>deleteDoc(r)),commit:async()=>{for(const f of o)await f()}}};
