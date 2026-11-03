// Avisos de Action Leaders PLUS. Solo recibe notificaciones: no guarda copias de la app (no afecta las actualizaciones).
importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js","https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js");
firebase.initializeApp({apiKey:"AIzaSyA0ehZ7NNzLE46Ifs-kvWXVVYfsohpdPXM",authDomain:"action-leaders-plus-8f1b8.firebaseapp.com",projectId:"action-leaders-plus-8f1b8",storageBucket:"action-leaders-plus-8f1b8.firebasestorage.app",messagingSenderId:"782054956613",appId:"1:782054956613:web:a34f683a893d00b9980d2c"});
firebase.messaging();
self.addEventListener("install",()=>self.skipWaiting());
self.addEventListener("activate",e=>e.waitUntil(self.clients.claim()));
// Número rojo en el ícono cuando llega un aviso (cuántos avisos sin abrir).
self.addEventListener("push",e=>{if(!self.navigator||!self.navigator.setAppBadge)return;
  e.waitUntil(new Promise(r=>setTimeout(r,1200)).then(()=>self.registration.getNotifications()).then(L=>self.navigator.setAppBadge(Math.max(1,(L||[]).length))).catch(()=>{}))});
