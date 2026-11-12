// Código dormido quitado de index.html el 12 nov 2026 (Edwin). Para volver a usarlo, copiar de aquí.

function evLlegadas(L,iy){const R=(entPub&&entPub.rank)||[],yo=iy>=0?L[iy].nombre:"",md=["🥇","🥈","🥉"];
  openSheet(`<h2>🎉 Invitados que ya llegaron</h2><p class="small muted" style="margin:0">${entPub.inv} invitados han llegado al evento. Gana el socio con más invitados que lleguen. Solo se muestran los números de cada socio.</p>
   <div style="display:flex;flex-direction:column">${R.map((x,i)=>`<div class="row" style="gap:10px;padding:9px 6px;border-bottom:1px solid var(--line);${sameN(x.s,yo)?"background:#FEF9C3;border-radius:10px":""}"><span style="width:28px;text-align:center;font-weight:800">${md[i]||"#"+(i+1)}</span>${avHTML(x.s,false,false)}<b style="flex:1;font-weight:600;min-width:0">${esc(x.s)}${sameN(x.s,yo)?" (usted)":""}</b><span style="text-align:right;white-space:nowrap"><b style="font-size:18px">${x.n}</b><span class="small muted"> de ${x.r}</span></span></div>`).join("")||`<p class="small muted">Aún no ha llegado ningún invitado.</p>`}</div>
   ${isAdmin?`<p class="small muted" style="margin:0">Admin: para ver los nombres, abra Modo entrada → 🏆 Ranking y toque un socio.</p>`:""}
   <button class="btn ghost" data-close style="width:100%">Cerrar</button>`)}

function evMios(E,iy){const L=E.top,I=(L[iy].inv||[]).slice().reverse(),LLc=((entPub&&entPub.ll&&entPub.ll[L[iy].nombre])||[]).slice(),N=LLc.map(nrmN);
  const R=I.map(x=>{const k=N.indexOf(nrmN(x.n));if(k>=0){N.splice(k,1);LLc.splice(k,1)}return{n:x.n,ok:k>=0}});return{R,puerta:LLc}}

function evResultados(c,E){const L=E.top,yo=miNombreFull()||miNombreCorto(),iy=evMiIdx(L,[yo,miNombreCorto()]),R=(entPub&&entPub.rank)||[],md=["🥇","🥈","🥉"];
  let me="";if(iy>=0){const m=evMios(E,iy),ok=m.R.filter(x=>x.ok).length+m.puerta.length;me=`<div class="evMe">Usted: <b>${ok}</b> de <b>${m.R.length}</b> invitados llegaron. ¡Ahora el seguimiento hace la diferencia! 💪</div>`}
  c.innerHTML=`<div class="row between"><span class="evK">🎟️ Resultados · ${esc(E.titulo||"Evento")}</span><span class="evHoy">Terminó</span></div>
   ${entPub&&entPub.inv?`<div class="evT"><b>${entPub.inv}</b><span style="padding-bottom:4px;font-weight:700">invitados llegaron · de ${E.total} registrados</span></div>`:`<div class="evT"><b>${E.total}</b><span style="padding-bottom:4px;font-weight:700">invitados registrados</span></div>`}
   ${R.length?`<div>${R.slice(0,3).map((x,i)=>`<div class="evRow"><span style="font-size:20px;width:26px;text-align:center">${md[i]}</span>${avHTML(x.s,false,false)}<span class="nm">${esc(x.s)}</span><small>de ${x.r}</small><span class="ct">${x.n}</span></div>`).join("")}</div>`:""}
   ${me}<div class="row" style="gap:8px">${iy>=0?`<button class="btn sm" id="evSeg" type="button" style="flex:1">📲 Seguimiento del evento</button>`:""}${R.length?`<button class="btn sm" id="evLlg2" type="button" style="flex:1">🏆 Llegadas</button>`:""}</div>`+(isAdmin&&TODAY<=ENT.res?`<button class="btn sm" id="evAdm" type="button" style="width:100%;font-size:12.5px;opacity:.85">🔎 Admin: ver quién llegó de cada socio</button>`:"");
  const a=$("#evSeg");if(a)a.onclick=()=>evSeguimiento(E,iy);const b=$("#evLlg2");if(b)b.onclick=()=>evLlegadas(L,iy);const ad=$("#evAdm");if(ad)ad.onclick=()=>{abrirEntrada();entTab="r";setTimeout(()=>{try{entRender()}catch(e){}},300)}}

function evSegMsg(E,n,ok){const f=String(n||"").split(" ")[0],yo=miNombreCorto(),dia=["el domingo","el lunes","el martes","el miércoles","el jueves","el viernes","el sábado"][parseK(E.fecha).getDay()],ev=E.titulo||"evento";
  let pg="";try{if(miPaginaLista())pg=miPagina()}catch(e){}
  return ok?`Hola ${f} 👋 ¡Gracias por acompañarnos ${dia} en el *${ev}*! 🙌\n\n¿Qué fue lo que más le gustó? Me encantaría platicar unos minutos para resolver sus dudas y ver cómo puede empezar.${pg?`\n\nAquí puede volver a ver la información y elegir el horario que le quede mejor para hablar conmigo:\n${pg}`:""}\n\n¿Le gustaría que nos reunamos esta semana?${yo?`\n\nAtt. ${yo}`:""}`
   :`Hola ${f} 👋 ${dia[0].toUpperCase()+dia.slice(1)} le estuvimos esperando en el *${ev}* 🙌 Sé que a veces surgen imprevistos.\n\nFue una tarde increíble y no quiero que se quede sin conocer la información.\n\nMe gustaría invitarle a una reunión corta, por Zoom o en persona, donde le explico lo más importante en pocos minutos.${pg?`\n\nAquí puede ver un video corto y elegir el horario que le quede mejor:\n${pg}`:""}\n\n¿Le interesa que le reserve un espacio esta semana?${yo?`\n\nAtt. ${yo}`:""}`}

async function evToCRM(E,n,ok){const man=dkey(new Date(Date.now()+864e5)),nota=(ok?"Llegó al ":"Se registró y no llegó al ")+(E.titulo||"evento")+".",c=evMatchCRM(n);
  if(c){const nc=Object.assign({},c,{stage:["Nuevo","Contactado"].includes(c.stage)||(!ok&&c.stage==="Presentación")?(ok?"Presentación":"Seguimiento"):c.stage,next:c.next&&c.next>=TODAY?c.next:man,note:(c.note||"").includes(nota)?c.note:((c.note?c.note+"\n":"")+nota),updated:Date.now()});const id=await store.saveContact(nc);if(!id)return false;const i=contacts.findIndex(x=>x.id===c.id);if(i>=0)contacts[i]=nc;return "upd"}
  const nc={name:n,cc:LS.get("lastCC")||"504",phone:"",stage:ok?"Presentación":"Seguimiento",note:nota+" Complete su nombre y WhatsApp.",next:man,updated:Date.now()};const id=await store.saveContact(nc);if(!id)return false;nc.id=id;contacts.push(nc);return "new"}

function evSeguimiento(E,iy){const m=evMios(E,iy),A=m.R.filter(x=>x.ok),F=m.R.filter(x=>!x.ok);
  const row=(x,ok)=>{const c=evMatchCRM(x.n);return `<div class="row" style="gap:8px;padding:9px 0;border-bottom:1px solid var(--line)"><div class="grow" style="min-width:0"><b style="font-weight:600">${esc(nv(x.n))}</b>${premN(x.n)}<div class="small muted">${c?`En su CRM: ${esc(c.name)} · ${esc(c.stage||"")}`:"Aún no está en su CRM"}</div></div><button type="button" class="btn sm" data-evw="${esc(x.n)}" data-ok="${ok?1:0}" style="background:#25D366;color:#fff;padding:8px 10px">📲</button><button type="button" class="btn sm ghost" data-evc="${esc(x.n)}" data-ok="${ok?1:0}" style="padding:8px 10px">➕ CRM</button></div>`};
  openSheet(`<h2>📲 Seguimiento del evento</h2><p class="small muted" style="margin:0">Las primeras 48 horas son clave. Escríbales y páselos a su CRM: los que llegaron quedan en <b>Presentación</b> y los que no, en <b>Seguimiento</b>, con recordatorio para mañana.</p>
   <button class="btn" id="evAll" style="width:100%">➕ Pasar todos a mi CRM (${A.length+F.length})</button>
   <p class="entSub" style="margin:6px 0 0">✅ Llegaron (${A.length+m.puerta.length})</p>${A.map(x=>row(x,true)).join("")}${m.puerta.length?`<p class="small muted" style="margin:4px 0">+ ${m.puerta.length} ${m.puerta.length===1?"registrado":"registrados"} en la puerta: ${m.puerta.map(esc).join(", ")}</p>`:""}${!A.length&&!m.puerta.length?`<p class="small muted">Aún no hay llegadas registradas.</p>`:""}
   <p class="entSub" style="margin:10px 0 0">⏳ No llegaron (${F.length})</p>${F.map(x=>row(x,false)).join("")||`<p class="small muted">¡Llegaron todos! 🎉</p>`}
   <p class="small muted" style="margin:0">📲 abre WhatsApp con un mensaje listo. Si la persona está en su CRM con número, se abre su chat directo.</p><button class="btn ghost" data-close style="width:100%">Cerrar</button>`,()=>{
    const P=$("#sheetPanel");
    P.querySelectorAll("[data-evw]").forEach(b=>b.onclick=()=>{const n=b.dataset.evw,c=evMatchCRM(n),num=c&&String(c.phone||"").replace(/\D/g,"").length>=7?waNum(c.phone,c.cc||"504"):"";if(!num)toast("Elija el contacto de "+n.split(" ")[0]+" en WhatsApp");const t=evSegMsg(E,n,b.dataset.ok==="1");setTimeout(()=>{waIr("https://wa.me/"+(num||"")+"?text="+encodeURIComponent(t))},num?0:600)});
    P.querySelectorAll("[data-evc]").forEach(b=>b.onclick=async()=>{b.disabled=true;const r=await evToCRM(E,b.dataset.evc,b.dataset.ok==="1");if(!r){b.disabled=false;toast("No se pudo guardar");return}b.textContent=r==="new"?"✓ Agregado":"✓ Actualizado";try{renderCRM()}catch(e){}});
    $("#evAll").onclick=async()=>{const bt=$("#evAll");bt.disabled=true;let nw=0,up=0;for(const x of A.concat(F)){const r=await evToCRM(E,x.n,x.ok);if(r==="new")nw++;else if(r==="upd")up++}try{renderCRM()}catch(e){}bt.textContent=`✓ ${nw} agregados · ${up} actualizados`;toast("Listo: revise su CRM y complete los WhatsApp que falten");setTimeout(()=>evSeguimiento(E,iy),1200)}})}

const EV_SHOW=false;

function renderEvento(){const c=$("#evCard");if(!c)return;if(!EV_SHOW){c.hidden=true;return}const E=(T.config&&T.config.evento)||null;
  if(!E||!E.top||!E.top.length||!E.fecha){c.hidden=true;return}
  if(TODAY>E.fecha){if(TODAY>dkey(new Date(parseK(E.fecha).getTime()+7*864e5))){c.hidden=true;return}c.hidden=false;c.classList.add("evRes");evResultados(c,E);return}c.classList.remove("evRes");c.hidden=false;
  const md=["🥇","🥈","🥉"],L=E.top,yo=miNombreFull()||miNombreCorto(),iy=evMiIdx(L,[yo,miNombreCorto()]);
  const dias=Math.round((parseK(E.fecha)-parseK(TODAY))/864e5),cuando=dias===0?"¡Es hoy!":dias===1?"Mañana":"Faltan "+dias+" días";
  const row=(x,i)=>`<div class="evRow"><span style="font-size:20px;width:26px;text-align:center">${md[i]||"#"+(i+1)}</span>${avHTML(x.nombre,false,false)}<span class="nm">${esc(nv(x.nombre))}</span>${premN(x.nombre)}${x.hoy?`<small>+${x.hoy} hoy</small>`:""}<span class="ct">${x.n}</span></div>`;
  c.innerHTML=`<div class="row between"><span class="evK">🎟️ Reto de invitados · ${esc(E.titulo||"Evento")}</span><span class="evHoy">${cuando}</span></div>
   ${entPub&&TODAY===E.fecha&&entPub.inv?`<button type="button" id="evLlg" class="evLive" style="width:100%;text-align:left;border:0;cursor:pointer;font:inherit"><i></i><span class="grow">En vivo: <b>${entPub.inv}</b> invitados ya llegaron${entPub.rank&&entPub.rank[0]?` · va ganando <b>${esc(entPub.rank[0].s)}</b> (${entPub.rank[0].n})`:""}</span><b style="white-space:nowrap">Ver ›</b></button>`:""}
   <div class="evT"><b>${E.total}</b><span style="padding-bottom:4px;font-weight:700">invitados registrados${E.hoy?` · <span class="evHoy">+${E.hoy} hoy</span>`:""}</span></div>
   ${E.meta?`<div class="bar" style="background:rgba(255,255,255,.2);margin:0"><i style="width:${Math.min(100,Math.round(E.total/E.meta*100))}%;background:#fff"></i></div><span class="small" style="opacity:.85;margin-top:-4px">Meta: ${E.meta} invitados</span>`:""}
   <div>${L.slice(0,3).map(row).join("")}</div>
   ${iy>2?`<div class="evMe">Usted va <b>#${iy+1}</b> con <b>${L[iy].n}</b> ${L[iy].n===1?"invitado":"invitados"}. ¡A invitar! 💪</div>`:iy<0&&fbUser?`<div class="evMe">Aún no tiene invitados registrados. ¡Invite y súbase al ranking! 💪</div>`:""}
   <div class="row" style="gap:8px">${iy>=0&&(L[iy].inv||[]).length?`<button class="btn sm" id="evMis" type="button" style="flex:1">👥 Mis invitados · ${L[iy].inv.length}</button>`:""}<button class="btn sm" id="evVer" type="button" style="flex:1">Ver ranking (${L.length})</button></div>`;
  const evHoy=String(E.fecha||"")===TODAY;
  const lb=$("#evLlg");if(lb)lb.onclick=()=>evLlegadas(L,iy);
  const mb=$("#evMis");if(mb)mb.onclick=()=>{const I=L[iy].inv.slice().reverse();const LLc=((entPub&&entPub.ll&&entPub.ll[L[iy].nombre])||[]).map(nrmN);I.forEach(x=>{const k=LLc.indexOf(nrmN(x.n));x.ok=k>=0;if(k>=0)LLc.splice(k,1)});const nOk=I.filter(x=>x.ok).length+LLc.length;openSheet(`<h2>👥 Mis invitados</h2><p class="small muted" style="margin:0">${esc(E.titulo||"Evento")} · ${I.length} ${I.length===1?"persona registrada":"personas registradas"} con su nombre. Confírmeles la asistencia 💪</p>${evHoy&&entPub?`<div class="evMe" style="background:#ECFDF5;color:#065F46;border-color:#A7F3D0">✅ <b>${nOk}</b> ${nOk===1?"ya llegó":"ya llegaron"} al evento${LLc.length?` (${LLc.length} ${LLc.length===1?"registrado":"registrados"} en la puerta)`:""}</div>`:""}
    <div style="display:flex;flex-direction:column">${I.map((x,i)=>`<div class="row" style="gap:10px;padding:10px 0;border-bottom:1px solid var(--line)"><span class="step-n ok" style="width:28px;height:28px;font-size:13px">${I.length-i}</span><b style="flex:1;font-weight:600;min-width:0">${esc(nv(x.n))}<br><span class="small muted" style="font-weight:400">${esc(x.f)}</span></b>${x.ok?`<span class="small" style="color:#047857;font-weight:800;white-space:nowrap">✅ Llegó</span>`:evHoy?`<button type="button" class="btn" data-evrec="${i}" style="background:#25D366;color:#fff;padding:8px 12px;font-size:13px;white-space:nowrap">📲 Recordar</button>`:""}</div>`).join("")}</div>
    <button class="btn ghost" data-close style="width:100%">Cerrar</button>`,()=>{document.querySelectorAll("[data-evrec]").forEach(b=>b.onclick=()=>evRecordar(I[+b.dataset.evrec].n,E))})};
  $("#evVer").onclick=()=>openSheet(`<h2>🎟️ ${esc(E.titulo||"Reto de invitados")}</h2><p class="small muted" style="margin:0">${E.total} invitados registrados${E.actualizado?" · actualizado "+new Date(E.actualizado).toLocaleString("es",{day:"numeric",month:"short",hour:"numeric",minute:"2-digit"}):""}</p>
    ${isAdmin?`<p class="small" style="margin:0;font-weight:700;color:var(--brand)">👑 Vista de admin: toque un socio para ver sus invitados.</p>`:""}
    <div style="display:flex;flex-direction:column">${L.map((x,i)=>`<div ${isAdmin?`data-evi="${i}" role="button" style="cursor:pointer;border-bottom:1px solid var(--line)"`:`style="border-bottom:1px solid var(--line)"`}><div class="row" style="gap:10px;padding:9px 0"><span style="width:28px;text-align:center;font-weight:800">${md[i]||i+1}</span>${avHTML(x.nombre,false,false)}<b style="flex:1;font-weight:600">${esc(nv(x.nombre))}${premN(x.nombre)}</b>${x.hoy?`<span class="chip c-good">+${x.hoy} hoy</span>`:""}<b class="num" style="font-size:20px">${x.n}</b>${isAdmin?`<span class="muted" style="font-size:18px">›</span>`:""}</div>${isAdmin?`<div class="evInv" hidden style="padding:0 0 10px 38px;display:flex;flex-wrap:wrap;gap:6px">${(x.inv||[]).map(v=>`<span class="chip c-brand">${esc(v.n)} · ${esc(v.f)}</span>`).join("")||`<span class="small muted">Sin nombres</span>`}</div>`:""}</div>`).join("")}</div>
    ${isAdmin&&(E.sinNombre||E.repetidos)?`<p class="small muted" style="margin:0">Sin "invitado por" válido: ${E.sinNombre||0} · Registros repetidos no contados: ${E.repetidos||0}</p>`:""}
    <button class="btn ghost" data-close style="width:100%">Cerrar</button>`,()=>{if(isAdmin)$("#sheetPanel").querySelectorAll("[data-evi]").forEach(r=>r.onclick=()=>{const v=r.querySelector(".evInv");if(v)v.hidden=!v.hidden})})}

let rcJ=null,rcJT=0,rcTick=null;

function rcN(t){return String(t||"").normalize("NFD").replace(/[̀-ͯ]/g,"").toLowerCase().replace(/[^a-z ]/g," ").replace(/\s+/g," ").trim()}

function rcSame(a,b){a=rcN(a);b=rcN(b);if(!a||!b)return false;if(a===b)return true;const A=a.split(" "),B=b.split(" "),S=A.length<=B.length?A:B,L=S===A?B:A;return S.length>=2&&S.every(w=>L.includes(w))}

function rcCfg(){const R=(T.config||{}).retoCierre;if(!R||!R.desde||!R.hasta)return null;const t=Date.now();if(t<Date.parse(R.desde)||t>Date.parse(R.hasta)+18*3600e3)return null;return R}

function rcEquiv(f){const p=Math.ceil(f/500),c=Math.ceil(f/200);return `≈ ${p} Premium o ${c} Classic`}

function rcPrem(v){return v>=1500?"3+ Premium":v%500===0&&v>0?(v/500)+" Premium":v.toLocaleString("en-US")+" pts"}

function rcDatos(){const R=rcCfg();if(!R)return null;const V={Starter:50,Classic:200,Premium:500};
  const acts=(T.activaciones||[]).filter(a=>a.fecha>=R.desde&&a.fecha<R.hasta&&!actSinVol(a));
  const rows=(R.comp||[]).map(c=>({n:c.n,k:[c.n].concat(c.k||[]),v:+c.v||0,l:0,pr:0}));
  (rcJ||[]).forEach(j=>{if(!j.n||rows.some(r=>r.k.some(k=>rcSame(k,j.n))))return;rows.push({n:j.n.split(/\s+/).slice(0,2).join(" "),k:[j.n],v:+j.v||500,l:0,pr:0,app:1})});
  let tot=0;acts.forEach(a=>{const v=V[a.paquete]||0;tot+=v;let r=rows.find(x=>x.k.some(k=>rcSame(k,a.patrocinador)));
    if(!r){r={n:String(a.patrocinador).split(/\s+/).slice(0,2).map(w=>w[0].toUpperCase()+w.slice(1).toLowerCase()).join(" "),k:[a.patrocinador],v:0,l:0,pr:0,extra:1};rows.push(r)}r.l+=v;if(a.paquete==="Premium")r.pr++});
  rows.sort((a,b)=>(b.l-a.l)||((b.l>=b.v)-(a.l>=a.v))||(b.v-a.v)||a.n.localeCompare(b.n,"es"));
  const meta=+R.meta||10000,comp=rows.reduce((x,r)=>x+r.v,0),fin=Date.parse(R.hasta),cerr=Date.now()>=fin;
  const yoN=miNombreFull(),yo=rows.find(r=>r.k.some(k=>rcSame(k,yoN)));
  const cie=acts.map(a=>{const r=rows.find(x=>x.k.some(k=>rcSame(k,a.patrocinador)));return{key:a.id||(a.socio+"|"+a.fecha),n:r?r.n:a.patrocinador,v:V[a.paquete]||0,f:a.fecha}}).sort((x,y)=>y.f<x.f?-1:1);
  return {R,rows,tot,meta,comp,fin,cerr,yo,cie,nComp:rows.filter(r=>r.v>0).length,prem:acts.filter(a=>a.paquete==="Premium").length}}

function rcCargar(){const R=rcCfg();if(!R||!store.db)return;if(rcJ&&Date.now()-rcJT<1800000)return;rcJT=Date.now();
  store.db.collection("constancia").where("rc.id",R.id).get().then(q=>{rcJ=q.docs.map(d=>{const x=d.data()||{};return{n:(x.rc&&x.rc.n)||x.nombre,v:(x.rc&&x.rc.v)||500}});renderRC()}).catch(()=>{rcJ=rcJ||[]})}

function rcFila(r){const ok=r.v>0&&r.l>=r.v,fal=Math.max(0,r.v-r.l);
  return `<tr><td><span class="n">${esc(nv(r.n))}</span><small>${r.v?"Compromiso: "+rcPrem(r.v)+" · "+r.v.toLocaleString("en-US")+" pts":"Aportó sin comprometerse 👏"}</small></td><td class="r">${r.l?`<b>${r.l.toLocaleString("en-US")}</b> pts`:"0 pts"}<small>${ok?'<span class="rc-ok">✅ Cumplió</span>':r.v?`<span class="rc-f">Faltan ${fal.toLocaleString("en-US")}</span>`:""}</small></td></tr>`}

function rcCuenta(fin){const ms=Math.max(0,fin-Date.now()),h=Math.floor(ms/3600e3),m=Math.floor(ms%3600e3/60e3),sg=Math.floor(ms%60e3/1e3);return[h,m,sg]}

function renderRC(){const c=$("#rcCard");if(!c)return;const D=rcDatos();if(!D){c.hidden=true;clearInterval(rcTick);return}rcCargar();
  const {R,rows,tot,meta,fin,cerr,yo}=D,pct=Math.min(100,Math.round(tot*100/meta)),fal=Math.max(0,meta-tot),fp=Math.ceil(fal/500);
  const msg=cerr?(tot>=meta?"🎉 ¡Lo logramos! Gracias a cada líder que cumplió su palabra.":`Cerramos con ${tot.toLocaleString("en-US")} pts. ¡Gracias por darlo todo! El próximo cierre va por más.`)
    :tot>=meta?"🎉 ¡Meta cumplida! Ahora vamos por más: cada Premium suma al equipo."
    :fp<=3?`🔥 ¡Solo faltan ${fp} Premium! Es ahora o nunca.`
    :pct>=50?`💪 Vamos a la mitad. Faltan ${fp} Premium: una llamada más puede ser la que cierre.`
    :`🚀 Cada Premium cuenta. Hable hoy con quien le dijo "sí" y ayúdele a cerrar antes de las 6:00 p.m.`;
  const [h,m,sg]=rcCuenta(fin),top=rows.slice(0,6),abierto=LS.get("rcOpen:"+R.id)===1;
  rcAvisos(D,c);
  if(!abierto){const urg=!cerr&&fin-Date.now()<3600e3,Y=rows.filter(r=>r.l>0),fp=Math.ceil(fal/500);
    const F=[`🔥 <b>${D.nComp} líderes</b> ya se comprometieron`];
    if(D.cie.length)F.push(`🎉 <b>${esc(D.cie[0].n)}</b> cerró <b>+${D.cie[0].v.toLocaleString("en-US")}</b>`);
    if(Y.length)F.push("✅ Ya cerraron: "+Y.slice(0,3).map(r=>`<b>${esc(nv(r.n))}</b> +${r.l.toLocaleString("en-US")}`).join(" · ")+(Y.length>3?` · y ${Y.length-3} más`:""));
    else F.push("⏳ Aún nadie cierra. <b>¡Sea usted el primero!</b>");
    if(!cerr)F.push(`⏰ Quedan <b>${h} h ${m} min</b>: ¿quién cierra el siguiente?`);
    if(!cerr&&fal)F.push(`🎯 Faltan <b>${fp} Premium</b> para la meta del equipo`);
    if(!cerr&&!(yo&&yo.v))F.push("🙋 <b>¡Únase al reto ahora!</b> Su compromiso cuenta");
    c.innerHTML=`<div class="rc-mini" id="rcTog"><div class="rc-mt"><span class="rc-k"><i class="rc-fire">🔥</i> RETO DE CIERRE</span><b>${fal?`Faltan ${fal.toLocaleString("en-US")} pts para la meta`:"🎉 ¡Meta cumplida! "+meta.toLocaleString("en-US")+" pts"}</b>${fal&&!cerr?`<small class="rc-eq">${rcEquiv(fal)}</small>`:""}</div>
     <div class="rc-mr">${cerr?`<span class="rc-mc">Cerrado</span>`:`<span class="rc-mc${urg?" urg":""}" id="rcCd"><b>${h}</b>h <b>${String(m).padStart(2,"0")}</b>m <b>${String(sg).padStart(2,"0")}</b>s</span>`}<span class="rc-ch">›</span></div>
     <div class="rc-bar rc-live" style="grid-column:1/-1"><i style="width:${Math.max(pct,tot?3:0)}%"></i></div>
     <div class="rc-mn"><span>Vamos en <b>${tot.toLocaleString("en-US")}</b> de ${meta.toLocaleString("en-US")} pts</span><span><b>${pct}%</b></span></div>
     <div class="rc-rot" id="rcRot">${F[0]}</div>
     ${cerr?"":`<div class="rc-mb">${yo&&yo.v?`<span class="rc-in">✅ Estoy en el reto · ${rcPrem(yo.v)}</span>`:`<button class="rc-jm" id="rcJm">🙋 Unirme al reto</button>`}<button class="rc-fl" id="rcFl" aria-label="Flyer para invitar">📣</button><span class="rc-ver">Ver ▾</span></div>`}</div>`;
    c.hidden=false;c.classList.add("min");c.classList.toggle("vivo",!cerr);$("#rcTog").onclick=e=>{if(e.target.closest("#rcJm,#rcFl"))return;LS.set("rcOpen:"+R.id,1);renderRC()};
    const jm=$("#rcJm");if(jm)jm.onclick=e=>{e.stopPropagation();rcUnirme()};const fl=$("#rcFl");if(fl)fl.onclick=e=>{e.stopPropagation();rcCompartir(null)};
    let fi=0,ft=0;clearInterval(rcTick);rcTick=setInterval(()=>{const cd=$("#rcCd"),ro=$("#rcRot");if(!ro){clearInterval(rcTick);return}
      if(++ft%4===0&&F.length>1){fi=(fi+1)%F.length;ro.classList.remove("in");void ro.offsetWidth;ro.innerHTML=F[fi];ro.classList.add("in")}
      if(!cd||cerr)return;if(Date.now()>=fin){renderRC();return}const [x,y,z]=rcCuenta(fin),B=cd.querySelectorAll("b");B[0].textContent=x;B[1].textContent=String(y).padStart(2,"0");B[2].textContent=String(z).padStart(2,"0");B[2].classList.remove("tk");void B[2].offsetWidth;B[2].classList.add("tk");if(fin-Date.now()<3600e3)cd.classList.add("urg")},1000);return}
  c.classList.remove("min","vivo");
  c.innerHTML=`<button class="rc-cl" id="rcCl" aria-label="Contraer">▴</button><div class="rc-k">🔥 RETO DE CIERRE · ${esc(R.mes||"")}</div><h3>${fal?`Faltan ${fal.toLocaleString("en-US")} pts para la meta`:"🎉 ¡Meta cumplida! "+meta.toLocaleString("en-US")+" pts"}</h3>${fal&&!cerr?`<div class="rc-sub" style="color:#FDE68A;font-weight:700">${rcEquiv(fal)}</div>`:""}
   <div class="rc-sub">Meta del equipo: <b>${meta.toLocaleString("en-US")} pts</b> de volumen (${Math.round(meta/500)} Premium) · Cuenta desde las ${new Date(R.desde).toLocaleTimeString("es-HN",{hour:"numeric",minute:"2-digit",timeZone:"America/Tegucigalpa"})} hasta hoy 6:00 p.m. HN</div>
   ${cerr?`<div class="rc-msg" style="margin-top:12px">⏱️ Reto cerrado</div>`:`<div class="rc-cd" id="rcCd"><div><b>${h}</b><small>HORAS</small></div><div><b>${String(m).padStart(2,"0")}</b><small>MIN</small></div><div><b>${String(sg).padStart(2,"0")}</b><small>SEG</small></div></div>`}
   <div class="rc-bar"><i style="width:${pct}%"></i></div>
   <div class="rc-nums"><span><b>${tot.toLocaleString("en-US")}</b> de ${meta.toLocaleString("en-US")} pts · ${pct}%</span><span>${fal?`Faltan <b>${fal.toLocaleString("en-US")}</b>`:"<b>¡Meta!</b>"}</span></div>
   <div class="rc-msg">${msg}</div>
   <table class="rc-t">${top.map(rcFila).join("")}</table>
   ${rows.length>top.length?`<button class="rc-more" id="rcAll">Ver los ${rows.length} líderes del reto ›</button>`:""}
   ${yo&&yo.v?`<div class="rc-yo">✅ Usted está en el reto · compromiso ${rcPrem(yo.v)}</div>`:""}
   ${cerr?"":`<div class="rc-row">${yo&&yo.v?"":`<button class="rc-j" id="rcJoin">🙋 Unirme al reto</button>`}<button class="rc-s" id="rcInv">📣 Flyer para invitar</button></div>`}`;
  c.hidden=false;$("#rcCl").onclick=()=>{LS.set("rcOpen:"+R.id,0);renderRC()};
  const all=$("#rcAll");if(all)all.onclick=()=>openSheet(`<h2>🔥 Líderes del reto</h2><p class="muted">${D.nComp} comprometidos · logrado ${tot.toLocaleString("en-US")} de ${meta.toLocaleString("en-US")} pts</p><div style="background:#111827;border-radius:14px;padding:6px 10px;margin-top:10px" class="rcCard"><table class="rc-t">${rows.map(rcFila).join("")}</table></div><button class="btn ghost full" data-close style="margin-top:12px">Cerrar</button>`);
  const jn=$("#rcJoin");if(jn)jn.onclick=rcUnirme;const iv=$("#rcInv");if(iv)iv.onclick=()=>rcCompartir(iv);
  const K="rcConf:"+R.id+":"+(tot>=meta?"meta":TODAY);if(!LS.get(K)&&(tot>=meta||!cerr)){LS.set(K,1);setTimeout(()=>confeti(c,tot>=meta?90:40),500)}
  clearInterval(rcTick);if(!cerr)rcTick=setInterval(()=>{const cd=$("#rcCd");if(!cd){clearInterval(rcTick);return}if(Date.now()>=fin){renderRC();return}const [a,b,d]=rcCuenta(fin),B=cd.querySelectorAll("b");B[0].textContent=a;B[1].textContent=String(b).padStart(2,"0");B[2].textContent=String(d).padStart(2,"0")},1000)}

function rcAvisos(D,c){const K="rcSeen:"+D.R.id;let seen=LS.get(K);const nuevo=seen===null;seen=seen||[];
  let nw=D.cie.filter(x=>!seen.includes(x.key));if(!nw.length)return;LS.set(K,seen.concat(nw.map(x=>x.key)).slice(-200));if(nuevo)nw=nw.slice(0,1);
  const fal=Math.max(0,D.meta-D.tot);nw.slice(0,2).forEach((x,i)=>setTimeout(()=>{try{avisoTop(`🎉 ${x.n} acaba de cerrar +${x.v.toLocaleString("en-US")}`,fal?`Reto de cierre · faltan ${fal.toLocaleString("en-US")} pts`:"¡Meta del equipo cumplida!",()=>{LS.set("rcOpen:"+D.R.id,1);go&&go("inicio");renderRC()})}catch(e){}confeti(c,60)},1500+i*4500))}

async function rcCanvas(D){const W=1080,H=1920,cv=document.createElement("canvas");cv.width=W;cv.height=H;const g=cv.getContext("2d");
  await bienFonts();try{await Promise.all(["800 30px Figtree","700 30px Figtree","500 30px Figtree","400 60px 'Bebas Neue'"].map(x=>document.fonts.load(x)))}catch(x){}
  const BF="Figtree, Arial, sans-serif",BB="'Bebas Neue', ALP, Arial, sans-serif",GO="#FDE68A",AM="#FBBF24",fm=n=>n.toLocaleString("en-US");
  g.fillStyle="#07080c";g.fillRect(0,0,W,H);const bg=await imgLoad("media/flyers/lc-espartano.jpg");if(bg){g.save();g.filter="blur(6px) brightness(.42)";g.drawImage(bg,-30,-50,W+60,H+100);g.restore()}
  let gr=g.createRadialGradient(W/2,560,40,W/2,560,760);gr.addColorStop(0,"rgba(249,115,22,.38)");gr.addColorStop(1,"rgba(249,115,22,0)");g.fillStyle=gr;g.fillRect(0,0,W,H);
  gr=g.createLinearGradient(0,0,0,H);gr.addColorStop(0,"rgba(0,0,0,.25)");gr.addColorStop(.55,"rgba(0,0,0,.1)");gr.addColorStop(1,"rgba(0,0,0,.8)");g.fillStyle=gr;g.fillRect(0,0,W,H);
  const sp=(t,x,y,ls)=>{let w=0;for(const ch of t)w+=g.measureText(ch).width+ls;w-=ls;let cx=x-w/2;g.textAlign="left";for(const ch of t){g.fillText(ch,cx,y);cx+=g.measureText(ch).width+ls}};
  const C=(t,y,f,col)=>{g.font=f;g.fillStyle=col;g.textAlign="center";g.fillText(t,W/2,y)};
  const lg=await imgLoad("media/logo-al.png");if(lg){const h=56,w=lg.width*h/lg.height;g.drawImage(lg,(W-w)/2,104,w,h)}
  g.font="800 30px "+BF;g.fillStyle=AM;sp("RETO DE CIERRE · "+String(D.R.mes||"").split(" ")[0].toUpperCase(),W/2,262,11);
  g.save();g.shadowColor="rgba(249,115,22,.9)";g.shadowBlur=50;C("🔥",430,"120px 'Apple Color Emoji','Segoe UI Emoji','Noto Color Emoji',sans-serif","#fff");g.restore();
  const np=Math.round(D.meta/500),FL=Math.max(0,D.meta-D.tot);
  if(FL){g.font="400 110px "+BB;g.fillStyle="#fff";sp("FALTAN",W/2,560,8)}
  g.font="400 "+(FL?250:200)+"px "+BB;gr=g.createLinearGradient(0,600,0,820);gr.addColorStop(0,"#FFF7D6");gr.addColorStop(.55,AM);gr.addColorStop(1,"#B45309");
  g.save();g.shadowColor="rgba(0,0,0,.6)";g.shadowBlur=30;g.shadowOffsetY=8;g.fillStyle=gr;g.textAlign="center";g.fillText(FL?fm(FL):"¡META!",W/2,800);g.restore();
  g.font="400 96px "+BB;g.fillStyle="#fff";sp(FL?"PTS PARA LA META":"CUMPLIDA: "+fm(D.meta)+" PTS",W/2,910,4);
  if(FL){g.font="700 38px "+BF;g.fillStyle=GO;g.textAlign="center";g.fillText(rcEquiv(FL),W/2,985)}
  g.font="500 34px "+BF;g.fillStyle="#E7E5E4";g.textAlign="center";g.fillText("Meta del equipo: "+fm(D.meta)+" pts ("+np+" Premium)",W/2,1060);g.fillText("hoy antes de las 6:00 p.m. (hora de Honduras)",W/2,1108);
  const [hh,mm]=rcCuenta(D.fin),box=(x,v,l)=>{g.beginPath();g.roundRect(x,1170,240,200,30);g.fillStyle="rgba(255,255,255,.08)";g.fill();g.lineWidth=3;g.strokeStyle="rgba(251,191,36,.5)";g.stroke();
    g.font="400 130px "+BB;g.fillStyle=GO;g.textAlign="center";g.fillText(v,x+120,1310);g.font="800 22px "+BF;g.fillStyle="#D6D3D1";sp(l,x+120,1348,6)};
  if(D.cerr){C("¡RETO CERRADO!",1300,"400 120px "+BB,GO)}else{box(W/2-255,String(hh),"HORAS");box(W/2+15,String(mm).padStart(2,"0"),"MIN")}
  const pct=Math.min(1,D.tot/D.meta);g.beginPath();g.roundRect(80,1430,W-160,30,15);g.fillStyle="rgba(255,255,255,.14)";g.fill();
  if(pct>0){gr=g.createLinearGradient(80,0,80+(W-160)*pct,0);gr.addColorStop(0,"#F59E0B");gr.addColorStop(1,"#FDE047");g.beginPath();g.roundRect(80,1430,Math.max(30,(W-160)*pct),30,15);g.fillStyle=gr;g.fill()}
  const fal=Math.max(0,D.meta-D.tot);g.font="500 32px "+BF;g.textAlign="left";g.fillStyle="#fff";g.fillText("Vamos en ",80,1508);let x=80+g.measureText("Vamos en ").width;g.font="800 32px "+BF;g.fillStyle=GO;g.fillText(fm(D.tot),x,1508);x+=g.measureText(fm(D.tot)).width;g.font="500 32px "+BF;g.fillStyle="#fff";g.fillText(" de "+fm(D.meta)+" pts",x,1508);
  g.textAlign="right";g.font="800 32px "+BF;g.fillStyle=GO;g.fillText(fal?Math.floor(pct*100)+"% de la meta":"¡Meta cumplida!",W-80,1508);
  const Y=D.rows.filter(r=>r.l>0);g.textAlign="center";
  if(Y.length){g.font="700 30px "+BF;g.fillStyle="#4ADE80";const t="✅ Ya cerraron: "+Y.slice(0,3).map(r=>r.n.split(" ")[0]+" +"+fm(r.l)).join(" · ")+(Y.length>3?" · y "+(Y.length-3)+" más":"");g.fillText(t.length>60?t.slice(0,58)+"…":t,W/2,1572)}
  g.font="500 32px "+BF;g.fillStyle="#F5F5F4";g.fillText("🔥 "+D.nComp+" líderes ya se comprometieron",W/2,Y.length?1622:1590);
  if(!D.cerr){g.save();g.shadowColor="rgba(251,191,36,.55)";g.shadowBlur=50;gr=g.createLinearGradient(250,0,830,0);gr.addColorStop(0,"#F59E0B");gr.addColorStop(1,"#FDE047");g.beginPath();g.roundRect(250,1670,580,104,52);g.fillStyle=gr;g.fill();g.restore();
    C("🙋 ¡ÚNASE AL RETO!",1738,"800 44px "+BF,"#1C1917")}
  g.textAlign="left";g.font="400 52px "+BB;g.fillStyle="#fff";g.fillText("#HASTAQUEFUNCIONE",80,1858);g.textAlign="right";g.font="800 25px "+BF;g.fillStyle=AM;g.fillText("actionleadersplus.com",W-80,1852);
  return cv}

async function rcCompartir(bt){const D=rcDatos();if(!D)return;let file=null,lb=bt?bt.textContent:"";if(bt){bt.disabled=true;bt.textContent="Creando flyer…"}
  try{const cv=await rcCanvas(D);const b=await new Promise(ok=>cv.toBlob(ok,"image/jpeg",.92));file=new File([b],"Reto-de-cierre.jpg",{type:"image/jpeg"})}catch(e){}
  if(bt){bt.disabled=false;bt.textContent=lb}const t=rcTxt(D);
  if(file&&navigator.canShare&&navigator.canShare({files:[file],text:t})){try{await navigator.share({files:[file],text:t});return}catch(e){if(e&&e.name==="AbortError")return}}
  if(file){const a=document.createElement("a");a.href=URL.createObjectURL(file);a.download=file.name;a.click()}location.href="https://wa.me/?text="+encodeURIComponent(t)}

function rcTxt(D){const [h,m]=rcCuenta(D.fin);
  return `🔥 *RETO DE CIERRE DE MES*\n\nMeta del equipo: *${Math.round(D.meta/500)} Premium* antes de hoy a las 6:00 p.m. (hora de Honduras).\n\nVamos en *${D.tot.toLocaleString("en-US")} de ${D.meta.toLocaleString("en-US")} pts*.${D.cerr?"":` Quedan ${h} h ${m} min.`}\n\n${D.nComp} líderes ya se comprometieron. ¿Se une usted también?\n\n👉 Abra su app *Action Leaders* desde el ícono 🛡️ de su pantalla de inicio.\n\n🙋 Toque *"Unirme al reto"* en Inicio.\n\n¿Aún no tiene la app? Entre aquí:\nhttps://actionleadersplus.com\n\n#HastaQueFuncione`}

function rcUnirme(){const D=rcDatos();if(!D)return;
  openSheet(`<h2>🙋 Unirme al reto</h2><p class="muted">¿Con cuánto se compromete a cerrar hoy, antes de las 6:00 p.m. hora de Honduras?</p>
   <div class="rc-op">${[[500,"1 Premium"],[1000,"2 Premium"],[1500,"3 o más Premium"]].map(([v,t])=>`<button data-v="${v}">${t}<small>${v.toLocaleString("en-US")} pts de volumen</small></button>`).join("")}</div>
   <button class="btn ghost full" data-close>Ahora no</button>`,()=>{$("#sheetPanel .rc-op").onclick=async e=>{const b=e.target.closest("button[data-v]");if(!b)return;b.disabled=true;
     const nm=(miRegistro().nombre||miNombreFull()||"").trim();if(!nm||!store.db||!store.uid){toast("Inicie sesión para unirse");return}
     try{await store.db.doc("constancia/"+store.uid).set({u:Date.now(),rc:{id:D.R.id,v:+b.dataset.v,n:nm,t:Date.now()}},{merge:true});rcJ=(rcJ||[]).concat([{n:nm,v:+b.dataset.v}]);
       const R=(T.config||{}).retoCierre;if(R){R.comp=(R.comp||[]).concat([{n:nm.split(/\s+/).slice(0,2).join(" "),k:[nm],v:+b.dataset.v}])}
       closeSheet();toast("¡Ya está en el reto! 🔥");renderRC();const c=$("#rcCard");c&&confeti(c,70)}catch(x){b.disabled=false;toast("No se pudo guardar ("+(x.code||"error")+")")}}})}

const ENT={id:"sps26",tit:"Evento San Pedro Sula",fecha:"2026-10-25",fin:"2026-10-26",res:"2026-11-02"};

let entStaff=false,entData=null,entCk={},entOvr={},entUnsub=[],entTab="s",entQ="",entT=null,entPub=null,entResT=null;

const entPuede=()=>isAdmin||entStaff;

async function entInit(){if(!store.db||!store.uid)return;
  try{const k=new URLSearchParams(location.search).get("evk");if(k&&isAdmin){await store.db.doc("evento/sps26/priv/llave").set({k,t:Date.now()});toast("🔑 Modo entrada activado");history.replaceState(null,"",location.pathname)}}catch(e){toast("No se pudo guardar la clave del evento")}
  if(!isAdmin){try{const s=await store.db.doc("eventoStaff/"+store.uid).get();entStaff=!!s.exists}catch(e){entStaff=false}}
  renderEntCard();
  if(EV_SHOW&&TODAY>=ENT.fecha&&TODAY<=ENT.res)store.db.doc("evento/"+ENT.id).onSnapshot(d=>{entPub=d.exists?(d.data().resumen||null):null;try{renderEvento()}catch(e){}},()=>{})}

function renderEntCard(){const c=$("#entCard");if(!c)return;if(!entPuede()||TODAY>ENT.fecha){c.hidden=true;return}c.hidden=false;
  c.innerHTML=`<div class="row between" style="gap:10px"><div><b style="font-size:16px">🎟️ Modo entrada</b><div class="small muted">${esc(ENT.tit)} · ${isAdmin?"Administrador":"Recepción"}</div></div><button class="btn" id="entGo">Abrir</button></div>`;$("#entGo").onclick=abrirEntrada}

async function entCargar(){if(!llaveK){const d=await store.db.doc("evento/sps26/priv/llave").get();llaveK=d.exists?d.data().k:null}if(!llaveK)throw new Error("sin-llave");
  const r=await fetch("data/entrada.enc?t="+Date.now(),{cache:"no-store"});if(!r.ok)throw new Error("red");const raw=b64u((await r.text()).trim());
  const key=await crypto.subtle.importKey("raw",b64u(llaveK),"AES-GCM",false,["decrypt"]);
  entData=JSON.parse(new TextDecoder().decode(await crypto.subtle.decrypt({name:"AES-GCM",iv:raw.slice(0,12)},key,raw.slice(12))))}

function abrirEntrada(){document.querySelector(".entV")?.remove();const v=document.createElement("div");v.className="entV";
  v.innerHTML=`<div class="entH"><button type="button" class="entX" data-ex aria-label="Cerrar">✕</button><div class="grow"><b>🎟️ ${esc(ENT.tit)}</b><div class="small" style="opacity:.8">${isAdmin?"Administrador":"Recepción"} · ${esc(miNombreCorto()||"")}</div></div></div>
   <div class="entTabs"><button type="button" data-et="s">👔 Socios</button><button type="button" data-et="i">🎉 Invitados</button><button type="button" data-et="r">🏆 Ranking</button></div>
   <div class="entBody"><div id="entStat" class="entStat"></div><div class="entSrch" id="entSrchW"><input class="inp" id="entQ" placeholder="Buscar por nombre…" autocomplete="off"></div><div id="entList" class="entList"><p class="muted small" style="text-align:center">Cargando lista…</p></div></div>`;
  document.body.appendChild(v);document.body.style.overflow="hidden";
  v.querySelector("[data-ex]").onclick=cerrarEntrada;
  v.querySelectorAll("[data-et]").forEach(b=>b.onclick=()=>{entTab=b.dataset.et;entQ="";$("#entQ").value="";entRender()});
  $("#entQ").oninput=e=>{entQ=e.target.value;entRender()};
  const h=new Date();entTab=TODAY===ENT.fecha&&h.getHours()*60+h.getMinutes()>=14*60+15?"i":"s";
  const b="evento/"+ENT.id;
  entUnsub.push(store.db.collection(b+"/checkin").onSnapshot(s=>{entCk={};s.docs.forEach(d=>entCk[d.id]=Object.assign({id:d.id},d.data()));entRender()},()=>{}));
  entUnsub.push(store.db.collection(b+"/ovr").onSnapshot(s=>{entOvr={};s.docs.forEach(d=>entOvr[d.id]=d.data());entRender()},()=>{}));
  entRefrescar(true);entT=setInterval(()=>entRefrescar(false),120000)}

function cerrarEntrada(){clearInterval(entT);entUnsub.forEach(f=>{try{f&&f()}catch(e){}});entUnsub=[];document.querySelector(".entV")?.remove();document.body.style.overflow=""}

async function entRefrescar(first){try{await entCargar();entRender();if(Object.keys(entCk).length)entResumen()}catch(e){const l=$("#entList");if(first&&l)l.innerHTML=e.message==="sin-llave"?`<div class="entMsg">🔑 Falta activar el modo entrada.<br><small>El administrador debe abrir una vez el enlace de activación.</small></div>`:`<div class="entMsg">No se pudo cargar la lista.<br><small>Revise la conexión e intente de nuevo.</small></div>`}}

const entSoc=()=>((entData&&entData.socios)||[]).map(s=>entOvr[s.id]&&entOvr[s.id].a&&!s.a?Object.assign({},s,{a:true,pago:true}):s)
  .concat(Object.values(entCk).filter(c=>c.tipo==="s"&&c.manual).map(c=>({id:c.id,n:c.n,l:"",a:true,tk:c.tkT||"PREMIUM",manual:true})));

const entInv=()=>((entData&&entData.inv)||[]).concat(Object.values(entCk).filter(c=>c.tipo==="i"&&c.manual).map(c=>({id:c.id,n:c.n,s:c.s,manual:true})));

const entMatch=(n,q)=>{const a=nrmN(n),w=nrmN(q).split(" ").filter(Boolean);return w.length&&w.every(x=>a.split(" ").some(y=>y.startsWith(x)))};

const entHora=t=>t?new Date(t).toLocaleTimeString("es-HN",{hour:"numeric",minute:"2-digit"}):"";

const entSocioDe=x=>{const c=entCk[x.id];return (c&&c.s)||x.s||""};

function entRender(){const v=document.querySelector(".entV");if(!v)return;v.querySelectorAll("[data-et]").forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.et===entTab)));
  $("#entSrchW").hidden=entTab==="r";const st=$("#entStat"),L=$("#entList");if(!entData)return;const q=entQ.trim();
  if(entTab==="s"){const S=entSoc(),acc=S.filter(s=>s.a),ll=acc.filter(s=>entCk[s.id]),P=x=>x.filter(s=>s.tk==="PREMIUM").length,C=x=>x.filter(s=>s.tk==="CLASSIC").length;
    $("#entQ").placeholder="Buscar socio por nombre o # de ticket…";
    st.innerHTML=`<div class="entBig"><b>${ll.length}</b><span>de ${acc.length} socios con acceso han entrado</span></div><div class="entMini"><span>★ Premium ${P(ll)}/${P(acc)}</span><span>Classic ${C(ll)}/${C(acc)}</span><span>⛔ Pendiente acceso ${S.length-acc.length}</span></div>`;
    let R;const num=q.replace(/^#\s*/,"");
    if(/^\d+$/.test(num)){const c=Object.values(entCk).find(c=>c.tipo==="s"&&String(c.tk)===String(+num));R=c?S.filter(s=>s.id===c.id):[]}else R=q?S.filter(s=>entMatch(s.n,q)):null;
    const row=s=>{const c=entCk[s.id];return `<button type="button" class="entRow" data-es="${esc(s.id)}"><span class="entDot ${c?"ok":s.a?"go":"no"}"></span><span class="grow"><b>${esc(nv(s.n))}${premN(s.n)}</b><small>${c?`✅ Entró ${entHora(c.at)} · Ticket #${esc(String(c.tk||""))}`:s.a?(s.tk==="PREMIUM"?"★ PREMIUM · con buffet":"CLASSIC · solo acceso"):"⛔ Pendiente acceso · comunicarse con su líder"}</small></span><span class="muted">›</span></button>`};
    if(R===null){const U=Object.values(entCk).filter(c=>c.tipo==="s").sort((a,b)=>b.at-a.at).slice(0,8);L.innerHTML=`<p class="entHint">Escriba el nombre del socio o el número del ticket.</p>${isAdmin?`<button type="button" class="btn" id="entTodos" style="width:100%;margin-bottom:8px">📋 Ver lista completa de los que entraron (${Object.values(entCk).filter(c=>c.tipo==="s").length})</button><button type="button" class="btn ghost" id="entAddS" style="width:100%;margin-bottom:8px">➕ Agregar socio que no está en la lista</button>`:""}${U.length?`<p class="entSub">Últimas entradas</p>`+U.map(c=>row(S.find(s=>s.id===c.id)||{id:c.id,n:c.n,a:true,tk:c.tkT})).join(""):""}`}
    else L.innerHTML=R.slice(0,30).map(row).join("")||`<div class="entMsg">No aparece en la lista de socios.<br><small>Pídale que hable con su líder o pase a caja.</small></div>${isAdmin&&!/^\d+$/.test(num)?`<button type="button" class="btn ghost" id="entAddS" style="width:100%">➕ Agregar socio que no está en la lista</button>`:""}`;
    L.querySelectorAll("[data-es]").forEach(b=>b.onclick=()=>entSheetS(b.dataset.es));const ad=$("#entAddS");if(ad&&isAdmin)ad.onclick=()=>entAddSocio(q);const et=$("#entTodos");if(et&&isAdmin)et.onclick=entVerTodos}
  else if(entTab==="i"){const I=entInv(),ll=I.filter(x=>entCk[x.id]);$("#entQ").placeholder="Buscar invitado por nombre…";
    st.innerHTML=`<div class="entBig"><b>${ll.length}</b><span>invitados han llegado · ${I.length} en la lista</span></div>`;
    const row=x=>{const c=entCk[x.id],s=entSocioDe(x);return `<button type="button" class="entRow" data-ei="${esc(x.id)}"><span class="entDot ${c?"ok":"go"}"></span><span class="grow"><b>${esc(nv(x.n))}${premN(x.n)}</b><small>${c?`✅ Llegó ${entHora(c.at)} · `:""}${s?"Invitado por "+esc(s):"⚠️ Sin socio asignado"}</small></span><span class="muted">›</span></button>`};
    const R=q?I.filter(x=>entMatch(x.n,q)):null;
    if(R===null){const U=Object.values(entCk).filter(c=>c.tipo==="i").sort((a,b)=>b.at-a.at).slice(0,8);L.innerHTML=`<p class="entHint">Escriba el nombre del invitado.</p>${U.length?`<p class="entSub">Últimas llegadas</p>`+U.map(c=>row(I.find(x=>x.id===c.id)||{id:c.id,n:c.n,s:c.s})).join(""):""}`}
    else L.innerHTML=R.slice(0,30).map(row).join("")||`<div class="entMsg">No está en la lista de invitados.</div>`;
    L.insertAdjacentHTML("beforeend",`<button type="button" class="btn" id="entAddI" style="width:100%;margin-top:10px">➕ Registrar invitado en puerta</button>`);
    L.querySelectorAll("[data-ei]").forEach(b=>b.onclick=()=>entSheetI(b.dataset.ei));$("#entAddI").onclick=()=>entAddInv(q)}
  else{const R=entRank(),tot=R.reduce((a,x)=>a+x.n,0),md=["🥇","🥈","🥉"];
    st.innerHTML=`<div class="entBig"><b>${tot}</b><span>invitados han llegado</span></div>`;
    L.innerHTML=`<p class="entSub">🏆 Premio al socio con más invitados en el evento</p>`+(R.filter(x=>x.n).map((x,i)=>`<div class="entRk ${i<3?"top":""}" ${isAdmin?`data-erk="${esc(x.s)}" style="cursor:pointer"`:""}><span class="md">${md[i]||"#"+(i+1)}</span><b class="grow">${esc(x.s)}</b><span class="n">${x.n}</span><small>de ${x.r}</small></div>`).join("")||`<p class="entHint">Aún no ha llegado ningún invitado.</p>`)+(isAdmin?`<p class="entHint">Toque un socio para ver quiénes llegaron.</p>`:"");
    if(isAdmin)L.querySelectorAll("[data-erk]").forEach(b=>b.onclick=()=>entVerSocioInv(b.dataset.erk))}}

function entVerSocioInv(sn){if(!isAdmin)return;const I=entInv().filter(x=>entSocioDe(x)===sn),A=I.filter(x=>entCk[x.id]).sort((a,b)=>(entCk[a.id].at||0)-(entCk[b.id].at||0)),F=I.filter(x=>!entCk[x.id]);
  const r=(x,ok)=>`<div class="row" style="gap:10px;padding:8px 0;border-bottom:1px solid var(--line)"><span>${ok?"✅":"⏳"}</span><div class="grow" style="min-width:0"><b style="font-weight:600">${esc(nv(x.n))}</b>${premN(x.n)}${ok?`<div class="small muted">${entHora(entCk[x.id].at)}${entCk[x.id].manual||x.manual?" · registrado en puerta":""}${entCk[x.id].byN?" · recibió "+esc(entCk[x.id].byN):""}</div>`:""}</div></div>`;
  openSheet(`<h2>${esc(sn)}</h2><p class="small muted" style="margin:0">Solo lo ve el administrador · ${A.length} de ${I.length} llegaron</p><div style="display:flex;flex-direction:column;max-height:60vh;overflow:auto">${A.map(x=>r(x,true)).join("")}${F.length?`<p class="entSub" style="margin-top:10px">Aún no llegan (${F.length})</p>`+F.map(x=>r(x,false)).join(""):""}</div><button class="btn ghost" data-close style="width:100%">Cerrar</button>`)}

function entRank(){const M={};entInv().forEach(x=>{const s=entSocioDe(x);if(!s)return;const m=M[s]||(M[s]={s,n:0,r:0});m.r++;if(entCk[x.id])m.n++});return Object.values(M).sort((a,b)=>b.n-a.n||b.r-a.r||a.s.localeCompare(b.s,"es"))}

function entLL(){const o={};entInv().forEach(x=>{if(!entCk[x.id])return;const k=entSocioDe(x);if(!k)return;(o[k]=o[k]||[]).push(cortoN(x.n))});return o}

function entResumen(){clearTimeout(entResT);entResT=setTimeout(()=>{const R=entRank();const S=entSoc();
  store.db.doc("evento/"+ENT.id).set({resumen:{inv:R.reduce((a,x)=>a+x.n,0),soc:S.filter(s=>s.a&&entCk[s.id]).length,rank:R.filter(x=>x.n).map(x=>({s:x.s,n:x.n,r:x.r})),ll:entLL(),t:Date.now()}},{merge:true}).catch(()=>{})},1500)}

const entYo=()=>({by:store.uid,byN:miNombreFull()||miNombreCorto()||""});

async function entGuardar(id,d,msg){try{await store.db.doc("evento/"+ENT.id+"/checkin/"+id).set(Object.assign({at:Date.now()},entYo(),d));entCk[id]=Object.assign({id,at:Date.now()},entYo(),d);closeSheet();toast(msg);entRender();entResumen();return true}catch(e){toast("No se pudo guardar. Revise la conexión.");return false}}

const entPuedeAnular=c=>isAdmin||(c&&c.by===store.uid&&Date.now()-(c.at||0)<5*60e3);

async function entDeshacer(id){if(!entPuedeAnular(entCk[id])){toast("Ya pasaron 5 minutos. Pídale al administrador que la anule.");closeSheet();return}try{await store.db.doc("evento/"+ENT.id+"/checkin/"+id).delete();delete entCk[id];closeSheet();toast("Entrada anulada");entRender();entResumen()}catch(e){toast("No se pudo anular")}}

function entSheetS(id){const s=entSoc().find(x=>x.id===id);if(!s)return;const c=entCk[id];
  if(c){openSheet(`<h2>${esc(nv(s.n))}</h2><div class="entOk">✅ Ya entró a las ${entHora(c.at)}<br><b>Ticket #${esc(String(c.tk||"—"))}</b> · ${s.tk==="PREMIUM"?"★ Premium":"Classic"}<br><small>Lo recibió ${esc(c.byN||"—")}</small></div>${entPuedeAnular(c)?`<button class="btn ghost" id="entUndo" style="width:100%;color:var(--bad)">${isAdmin?"Anular esta entrada":"Deshacer (me equivoqué)"}</button>${isAdmin?"":`<p class="small muted" style="margin:0;text-align:center">Puede deshacerla hasta ${entHora(c.at+5*60e3)}</p>`}`:""}<button class="btn ghost" data-close style="width:100%">Cerrar</button>`,()=>{const u=$("#entUndo");if(u)u.onclick=()=>entDeshacer(id)});return}
  if(!s.a){openSheet(`<h2>${esc(nv(s.n))}</h2><div class="entNo">⛔ PENDIENTE ACCESO</div><p style="margin:0">Comuníquese con su líder responsable: <b>${esc(s.l||"—")}</b></p>${isAdmin?`<button class="btn" id="entDar" style="width:100%;background:var(--good)">✅ Dar acceso</button>`:""}<button class="btn ghost" data-close style="width:100%">Cerrar</button>`,()=>{const d=$("#entDar");if(d)d.onclick=async()=>{try{await store.db.doc("evento/"+ENT.id+"/ovr/"+id).set(Object.assign({a:true,t:Date.now()},entYo()));entOvr[id]={a:true};toast("Acceso dado ✓");entRender();entSheetS(id)}catch(e){toast("No se pudo guardar")}}});return}
  const pr=s.tk==="PREMIUM";
  openSheet(`<div data-nofocus></div><h2>${esc(nv(s.n))}</h2><div class="entTk ${pr?"pr":"cl"}">${pr?"★ PREMIUM":"CLASSIC"}<small>${pr?"Entregar ticket CON talón de buffet":"Entregar ticket SIN talón (solo acceso)"}</small></div>
   ${s.pago?`<p class="small" style="margin:0;color:var(--good);font-weight:700">✅ Acceso confirmado por el administrador</p>`:""}
   <p style="margin:0">Líder responsable: <b>${esc(s.l||"—")}</b></p>
   <div class="field"><label for="entTkN">Número del ticket que le entrega</label><input class="inp" id="entTkN" type="number" inputmode="numeric" min="1" placeholder="Ej.: 57" style="font-size:22px;font-weight:800"></div>
   <p class="small" id="entErr" style="color:var(--bad);margin:0" hidden></p>
   <button class="btn" id="entOkS" style="width:100%;font-size:17px;padding:14px">✅ Confirmar entrada</button><button class="btn ghost" data-close style="width:100%">Cancelar</button>`,()=>{
    $("#entOkS").onclick=async()=>{const t=parseInt($("#entTkN").value,10),er=$("#entErr");if(!(t>0)){er.textContent="Escriba el número del ticket.";er.hidden=false;return}
      const dup=Object.values(entCk).find(c=>c.tipo==="s"&&+c.tk===t&&c.id!==id);if(dup){er.textContent=`El ticket #${t} ya se le entregó a ${dup.n}.`;er.hidden=false;return}
      $("#entOkS").disabled=true;if(!await entGuardar(id,{tipo:"s",n:s.n,tk:t,tkT:s.tk},`✅ ${s.n.split(" ")[0]} entró · Ticket #${t}`))$("#entOkS").disabled=false}})}

function entRevTk(){if(!isAdmin)return;const E=Object.values(entCk).filter(c=>c.tipo==="s"),M={};E.forEach(c=>{const t=+c.tk;if(t>0)(M[t]=M[t]||[]).push(c)});
  const it=c=>`${esc(c.n||"")} · ${entHora(c.at)}${c.byN?" · recibió "+esc(c.byN):""}`;
  openSheet(`<h2>🎫 Revisar tickets</h2><p class="small muted" style="margin:0">Escriba los números que todavía tiene en la mano (sin entregar), separados por coma, espacio o renglón.</p>
   <div class="field"><textarea class="inp" id="rtH" rows="3" placeholder="Ej.: 1 2 3 5 8"></textarea></div><div class="field"><label for="rtT">Último número del talonario (ej.: 100)</label><input class="inp" id="rtT" type="number" inputmode="numeric" min="1"></div><button class="btn" id="rtGo" style="width:100%">Revisar</button><div id="rtR" style="display:flex;flex-direction:column;gap:6px;max-height:55vh;overflow:auto"></div><button class="btn ghost" data-close style="width:100%">Cerrar</button>`,()=>{
    $("#rtGo").onclick=()=>{const H=new Set(($("#rtH").value.match(/\d+/g)||[]).map(Number).filter(n=>n>0)),ks=Object.keys(M).map(Number),mx=Math.max(0,...ks,...H,+$("#rtT").value||0);const perd=[],err=[],dup=[],ok=[];
      for(let n=1;n<=mx;n++){const c=M[n];if(H.has(n)){if(c)err.push(`<b>#${n}</b> está en su mano pero se registró a ${c.map(it).join(" y ")}`);continue}
        if(!c)perd.push(`<b>#${n}</b> no está en su mano y no se registró a nadie → se perdió o se entregó sin anotar`);else if(c.length>1)dup.push(`<b>#${n}</b> registrado a ${c.length} personas: ${c.map(it).join(" / ")}`);else ok.push(`<b>#${n}</b> ${it(c[0])}`)}
      const sec=(t,a,col)=>a.length?`<p class="entSub" style="color:${col}">${t} (${a.length})</p>`+a.map(x=>`<div class="small" style="padding:6px 0;border-bottom:1px solid var(--line)">${x}</div>`).join(""):"";
      const P=E.filter(c=>(c.tkT||"PREMIUM")==="PREMIUM").length;$("#rtR").innerHTML=`<p class="small" style="margin:0">Talonario 1–${mx}: ${H.size} en su mano + ${E.length} registrados (★ ${P} premium) = ${H.size+E.length}. ${mx-H.size-E.length>0?`<b style="color:var(--bad)">Falta${mx-H.size-E.length>1?"n":""} ${mx-H.size-E.length}.</b>`:""}</p>`+(perd.length||err.length||dup.length?"":`<p class="small" style="color:var(--ok,#1a7f37)">✅ Todo cuadra: cada ticket que falta en su mano está registrado a una persona.</p>`)+sec("⚠️ Faltan y nadie los tiene registrados",perd,"var(--bad)")+sec("❗ En su mano pero registrados (error de número)",err,"var(--bad)")+sec("🔁 Mismo número a varias personas",dup,"var(--bad)")+sec("✅ Entregados",ok,"inherit")}})}

function entVerTodos(){if(!isAdmin)return;const S=entSoc(),E=Object.values(entCk).filter(c=>c.tipo==="s").sort((a,b)=>(a.at||0)-(b.at||0)),dentro=new Set(E.map(c=>c.id)),F=S.filter(s=>s.a&&!dentro.has(s.id)).sort((a,b)=>a.n.localeCompare(b.n,"es"));
  const tk=c=>(c.tkT||(S.find(s=>s.id===c.id)||{}).tk||"");let vista="in";
  const draw=()=>{const L=vista==="in"?E.map((c,i)=>`<div class="row" style="gap:10px;padding:9px 0;border-bottom:1px solid var(--line)"><b class="num" style="width:26px;text-align:center">${i+1}</b><div class="grow" style="min-width:0"><b style="font-weight:600">${esc(c.n||"")}</b><div class="small muted">${entHora(c.at)} · Ticket #${esc(String(c.tk||"—"))} · ${tk(c)==="PREMIUM"?"★ Premium":"Classic"}${c.manual?" · agregado en puerta":""}${c.byN?" · recibió "+esc(c.byN):""}</div></div></div>`).join(""):F.map(s=>`<div class="row" style="gap:10px;padding:9px 0;border-bottom:1px solid var(--line)"><div class="grow" style="min-width:0"><b style="font-weight:600">${esc(nv(s.n))}</b>${premN(s.n)}<div class="small muted">${s.tk==="PREMIUM"?"★ Premium":"Classic"} · Líder: ${esc(s.l||"—")}</div></div></div>`).join("");
    $("#etL").innerHTML=L||`<p class="small muted">${vista==="in"?"Aún no ha entrado nadie.":"Ya entraron todos 🎉"}</p>`;$("#etIn").setAttribute("aria-selected",String(vista==="in"));$("#etF").setAttribute("aria-selected",String(vista!=="in"))};
  const P=E.filter(c=>tk(c)==="PREMIUM").length;
  openSheet(`<h2>📋 Socios en el evento</h2><p class="small muted" style="margin:0">Solo lo ve el administrador. ★ Premium ${P} · Classic ${E.length-P}</p>
   <div class="seg"><button id="etIn" aria-selected="true">Entraron (${E.length})</button><button id="etF" aria-selected="false">Faltan (${F.length})</button></div>
   <div id="etL" style="display:flex;flex-direction:column;max-height:60vh;overflow:auto"></div>
   <button class="btn ghost" id="etCopy" style="width:100%">📄 Copiar lista</button><button class="btn" id="etRev" style="width:100%">🎫 Revisar tickets</button><button class="btn ghost" data-close style="width:100%">Cerrar</button>`,()=>{draw();$("#etRev").onclick=()=>entRevTk();
    $("#etIn").onclick=()=>{vista="in";draw()};$("#etF").onclick=()=>{vista="f";draw()};
    $("#etCopy").onclick=async()=>{const t=vista==="in"?E.map((c,i)=>`${i+1}. ${c.n} — #${c.tk||"—"} ${tk(c)==="PREMIUM"?"Premium":"Classic"} (${entHora(c.at)})`).join("\n"):F.map((s,i)=>`${i+1}. ${s.n} — ${s.tk==="PREMIUM"?"Premium":"Classic"} · ${s.l||""}`).join("\n");try{await navigator.clipboard.writeText(t);toast("Lista copiada")}catch(e){toast("No se pudo copiar")}}})}

function entAddSocio(q){openSheet(`<h2>➕ Agregar socio</h2><p class="small muted" style="margin:0">Para socios que no se registraron en la lista. Queda con entrada y su número de ticket.</p><div class="field"><label for="entSn">Nombre completo</label><input class="inp" id="entSn" value="${esc(q||"")}"></div>
   <div class="field"><label for="entSt">Ticket</label><select class="inp" id="entSt"><option>PREMIUM</option><option>CLASSIC</option></select></div>
   <div class="field"><label for="entSk">Número del ticket</label><input class="inp" id="entSk" type="number" inputmode="numeric" min="1"></div><p class="small" id="entErr" style="color:var(--bad);margin:0" hidden></p>
   <button class="btn" id="entOkA" style="width:100%">✅ Registrar y dar entrada</button><button class="btn ghost" data-close style="width:100%">Cancelar</button>`,()=>{
    $("#entOkA").onclick=()=>{const n=$("#entSn").value.trim(),t=parseInt($("#entSk").value,10),er=$("#entErr");if(n.length<3){er.textContent="Escriba el nombre.";er.hidden=false;return}if(!(t>0)){er.textContent="Escriba el número del ticket.";er.hidden=false;return}
      const dup=Object.values(entCk).find(c=>c.tipo==="s"&&+c.tk===t);if(dup){er.textContent=`El ticket #${t} ya es de ${dup.n}.`;er.hidden=false;return}
      entGuardar("ms"+Date.now(),{tipo:"s",manual:true,n,tk:t,tkT:$("#entSt").value},`✅ ${n.split(" ")[0]} entró · Ticket #${t}`)}})}

const entSocList=()=>`<datalist id="entSocL">${((entData&&entData.soc)||[]).map(x=>`<option value="${esc(x)}">`).join("")}</datalist>`;

const entSocVal=v=>((entData&&entData.soc)||[]).find(x=>nrmN(x)===nrmN(v))||"";

function entSheetI(id){const x=entInv().find(y=>y.id===id);if(!x)return;const c=entCk[id],s=entSocioDe(x);
  if(c){openSheet(`<h2>${esc(nv(x.n))}</h2><div class="entOk">✅ Ya llegó a las ${entHora(c.at)}<br><small>Invitado por ${esc(s||"—")} · lo recibió ${esc(c.byN||"—")}</small></div>${entPuedeAnular(c)?`<button class="btn ghost" id="entUndo" style="width:100%;color:var(--bad)">${isAdmin?"Anular llegada":"Deshacer (me equivoqué)"}</button>${isAdmin?"":`<p class="small muted" style="margin:0;text-align:center">Puede deshacerla hasta ${entHora(c.at+5*60e3)}</p>`}`:""}<button class="btn ghost" data-close style="width:100%">Cerrar</button>`,()=>{const u=$("#entUndo");if(u)u.onclick=()=>entDeshacer(id)});return}
  openSheet(`<div data-nofocus></div><h2>${esc(nv(x.n))}</h2>${s?`<p style="margin:0">Invitado por <b>${esc(s)}</b></p>`:`<div class="field"><label for="entIs">¿Qué socio lo invitó?</label><input class="inp" id="entIs" list="entSocL" placeholder="Escriba y elija de la lista">${entSocList()}</div>`}
   <p class="small" id="entErr" style="color:var(--bad);margin:0" hidden></p><button class="btn" id="entOkI" style="width:100%;font-size:17px;padding:14px">✅ Confirmar llegada</button><button class="btn ghost" data-close style="width:100%">Cancelar</button>`,()=>{
    $("#entOkI").onclick=()=>{let so=s;if(!so){so=entSocVal($("#entIs").value);if(!so){const er=$("#entErr");er.textContent="Elija un socio de la lista.";er.hidden=false;return}}
      entGuardar(id,{tipo:"i",n:x.n,s:so},`✅ ${x.n.split(" ")[0]} llegó`)}})}

function entAddInv(q){openSheet(`<h2>➕ Invitado nuevo en puerta</h2><div class="field"><label for="entIn">Nombre y apellido</label><input class="inp" id="entIn" value="${esc(/^\d+$/.test(q||"")?"":(q||""))}"></div>
   <div class="field"><label for="entIs">Invitado por (socio)</label><input class="inp" id="entIs" list="entSocL" placeholder="Escriba y elija de la lista">${entSocList()}</div>
   <div class="field"><label for="entIw">WhatsApp</label><div class="row" style="gap:8px"><select class="inp" id="entIc" style="max-width:110px">${PAISES.map(([pn,k])=>`<option value="${k}" ${k==="504"?"selected":""}>+${k}</option>`).join("")}</select><input class="inp grow" id="entIw" type="tel" inputmode="tel" placeholder="Número" style="min-width:0"></div></div>
   <p class="small" id="entErr" style="color:var(--bad);margin:0" hidden></p><button class="btn" id="entOkN" style="width:100%">✅ Registrar y confirmar llegada</button><button class="btn ghost" data-close style="width:100%">Cancelar</button>`,()=>{
    $("#entOkN").onclick=()=>{const n=$("#entIn").value.trim(),so=entSocVal($("#entIs").value),w=$("#entIw").value.trim(),er=$("#entErr"),sp=splitPhone(w),wa=w?(sp.cc?sp.cc+sp.num:waNum(w,$("#entIc").value)):"";
      if(n.split(/\s+/).length<2){er.textContent="Escriba nombre y apellido.";er.hidden=false;return}if(!so){er.textContent="Elija de la lista el socio que lo invitó.";er.hidden=false;return}
      if(wa.length<8){er.textContent="Escriba el WhatsApp completo.";er.hidden=false;return}
      const ya=entInv().find(y=>nrmN(y.n)===nrmN(n));if(ya){er.textContent="Esa persona ya está en la lista. Búsquela y confirme su llegada ahí.";er.hidden=false;return}
      entGuardar("mi"+Date.now(),{tipo:"i",manual:true,n,s:so,wa:wa.slice(0,15)},`✅ ${n.split(" ")[0]} registrado y llegó`)}})}
