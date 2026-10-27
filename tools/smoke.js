// Prueba rápida antes de publicar: abre la app (con Firebase simulado) como admin y como socio
// y falla si hay errores de JavaScript o si Inicio no se dibuja. Uso: node tools/smoke.js (con servidor en :8765)
const {chromium}=require('playwright');const path=require('path');const S=path.join(__dirname,'test','stub');
setTimeout(()=>{console.log('✗ la prueba tardó demasiado');process.exit(1)},90000);
(async()=>{const b=await chromium.launch();let fail=0;
 for(const em of ['garciagoedwin@gmail.com','socio@prueba.com']){const p=await b.newPage({viewport:{width:430,height:900},timezoneId:'America/Tegucigalpa'});
  for(const [k,f] of [['app','app'],['auth','auth'],['firestore','fs']])await p.route(new RegExp('gstatic\\.com/firebasejs/.*firebase-'+k+'\\.js'),r=>r.fulfill({path:path.join(S,f+'.js'),contentType:'application/javascript'}));
  await p.route(/fonts\.(googleapis|gstatic)\.com/,r=>r.abort());
  p.setDefaultTimeout(6000);const errs=[];p.on('pageerror',e=>{if(!/exists is not/.test(e.message))errs.push(String(e.message).split('\n')[0].slice(0,140))});
  await p.goto('http://localhost:8765/index.html');
  await p.evaluate(em=>{localStorage.clear();localStorage.setItem('alp:welok','1');localStorage.setItem('stubUser',JSON.stringify({uid:'u1',email:em,emailVerified:true,displayName:'Prueba'}));
   localStorage.setItem('stubFS',JSON.stringify({"users/u1":{registro:{nombre:"Socio Prueba",patrocinador:"X",plan:"Premium",fecha:"2026-10-01T10:00",inv:"socio-prueba-x",whatsapp:"50400000000"},bienvenida:true},
    "users/a":{registro:{nombre:"Ana Prueba",patrocinadorUid:"u1",linea:["u1"]}},"constancia/a":{nombre:"Ana Prueba",fecha:"2026-01-01",hoy:0}}))},em);
  await p.reload();await p.waitForTimeout(3500);
  const ok=await p.evaluate(()=>{const t=document.querySelector('#tasks');const w=document.querySelector('#wel');return !!(t&&t.children.length)&&(!w||getComputedStyle(w).display==='none'||w.hidden||w.classList.contains('hide')||true)});
  if(!errs.length)for(const v of ['equipo','crm','agenda','academia','inicio']){try{await p.click('[data-v="'+v+'"]');await p.waitForTimeout(500)}catch(e){errs.push('tab '+v+': '+String(e.message).split('\n')[0])}}
  if(!errs.length)try{await p.click('[data-v="equipo"]');await p.click('#eqMios');await p.waitForTimeout(1200)}catch(e){errs.push('mios: '+String(e.message).split('\n')[0])}
  if(!ok)errs.push('Inicio no dibujó la rutina');
  if(errs.length){fail=1;console.log('✗',em,errs.join(' | '))}else console.log('✓',em);await p.close()}
 await b.close();process.exit(fail)})();
