# Manual del proyecto — Action Leaders PLUS

Este es el manual que lee primero cualquier chat nuevo que trabaje en la app, para seguir donde quedamos sin empezar de cero. Última actualización: 2026-10-20.

**Para retomar en un chat nuevo (modo agente):** clonar `garciagoedwin-coder/action-leaders-plus.` con permiso de escritura (el nombre del repo termina en punto), leer este archivo y la carpeta `respaldo/`.

## 1. Qué es

App web móvil (PWA) del equipo de Edwin García Go (Director Nacional, inCruises, Honduras) para sus socios: rutina diaria, CRM, agenda, ranking, academia y herramientas para invitar.

- **Sitio:** https://actionleadersplus.com (GitHub Pages; el dominio está en `CNAME`).
- **Repo:** github.com/garciagoedwin-coder/action-leaders-plus. (público, así que nunca guardar secretos, correos ni teléfonos de socios).
- **Firebase:** proyecto `action-leaders-plus-8f1b8`. Se usa Auth (Google y correo) y Firestore. La configuración web está en `index.html`; es pública por diseño.
- **Aparte:** la página personal de Edwin está en edwin.actionleadersplus.com, en Firebase Hosting. No es parte de este repo y no hay que tocarla desde aquí.

## 2. Archivos

| Archivo | Qué es |
|---|---|
| `index.html` | Toda la app (HTML, CSS y JS en un solo archivo). |
| `conoce.html` | Página pública del socio para prospectos ("Agenda conmigo"): reserva una cita según los horarios del socio, nunca para el mismo día. Por defecto lunes a viernes, 7 pm y 9 pm hora de Honduras. |
| `cal.html` | Página para "Agregar al calendario" (iPhone .ics y Google Calendar). Parámetros: t=yyyymmddhhmm UTC, m, n, z (Zoom), l. |
| `data/team.json` | Datos del equipo que lee la app: ranking, liderazgo, calendario, activaciones, academia, config y fotos. |
| `tools/ranking.py` | Recalcula el ranking de `team.json` (ver sección 5). |
| `.publicar.sh` | Antes de cada commit de la app: sube `version.txt` y `var V=` para que la app instalada se actualice sola. |
| `media/` | Videos de bienvenida, cursos, flyers, logos e íconos (`icono-1024.png` es el escudo Pro). |
| `respaldo/firestore.rules` | Copia exacta de las reglas de Firestore (al 2026-10-20). |
| `respaldo/tareas/` | Instrucciones exactas de las tareas programadas. |

**Publicar un cambio:** `./.publicar.sh && git add -A && git commit -m "…" && git push`. `.publicar.sh` corre antes `tools/smoke.js` (abre la app con Firebase simulado como admin y socio); si falla, NO publica. Publicar pocas veces al día: cada publicación hace recargar a todos (lecturas de Firestore). GitHub Pages tarda 1 o 2 minutos. Los socios deben cerrar y abrir la app para ver el cambio.

**Probar:** servidor local en el puerto 8765 más Playwright, con los módulos de Firebase reemplazados por stubs (app, auth y firestore falsos con localStorage). Siempre tomar captura en un teléfono de 430 px antes de publicar.

## 3. Datos (Firestore)

- `users/{uid}`
  - `registro`: nombre, patrocinador, patrocinadorUid, invitadoPor, plan (Classic/Premium), planPor, linea[] (todos los uid de arriba), whatsapp, waOk (el socio confirmó su WhatsApp), pais, invId, fecha.
  - `actividad`: hoy, racha, dias7, semana, cons{…}, presN[], cursos, bienvenida, historia, t.
  - Subcolecciones:
    - `datos/`: perfil, `rutina-AAAA-MM-DD` (con presL[{cid,n}] = nombres de las presentaciones), bienvenida, telsocios (número corregido por el líder: {uid:{n,b}}; se usa mientras el registro siga con el número b).
    - `crm/`: los prospectos del socio.
    - `citas/`: tipo zoom/whatsapp/persona/lider, fecha, hora, dur (60), cid, nombre, enlace, lugar, nota, hecha, reprog (veces reprogramada).
    - `prospectos/`: los que entran desde `conoce.html`.
- `invitaciones/{id}`: invitación personal. El patrocinador elige plan, país y WhatsApp.
- `constancia/{uid}`: resumen de la rutina para el ranking "Top Consistencia".
  - Semana de lunes a domingo, reinicia el lunes. Inicio: 2026-10-19.
  - Campos: wk, racha, semDias, semComp, semPres, semPts, pwk/pSemPts (puntos de la semana pasada, para la flecha ↑↓ del Índice de Duplicación), mes, mesDias, mesComp, mesMejor, mesPres, mesPts.
- `perfiles/{code}`: página pública del socio (uid, nombre, foto, wa, ref, slots[], zoom).
- `reservas/{code_slotms}`: horarios ya tomados.
- `fotos/{uid}`: foto del socio (inv, invNombre, linea).
- `team/…`: reto, calendario y academia que edita el admin desde la app.

## 4. Reglas del negocio (no romper)

- **Todos los mensajes a personas se escriben de "usted".**
- **Nunca guardar correos ni teléfonos de socios en `team.json`.**
- **Admins:** garciagoedwin@gmail.com, actionleadersoficial@gmail.com y edwing.go@gmail.com.
  - garciagoedwin@gmail.com es **solo admin**: no es socio ni patrocinador y no aparece en rankings.
  - **Solo un admin cambia el plan** (Classic → Premium).
- **Planes:** Socio Classic y Socio Premium. Por ahora **no** se restringe nada dentro de la app según el plan.
- **Volumen por paquete:** Starter 50, Classic 200, Premium 500.
- **Mes inCruises:** empieza el día 1 a las 00:00 UTC (último día del mes anterior a las 6 pm en Honduras). Zona horaria: America/Tegucigalpa (UTC-6).
- **Ranking:**
  - "Registros inCruises" = registros gratis + activaciones del mes. Se muestra sumado, sin desglose.
  - "Activaciones": la posición se ordena por **volumen**.
  - "🔥 Rutina" (Top Consistencia): por % de la semana, y en empate por presentaciones del plan.
  - En el podio se ve el número grande, la palabra "registros" y "#1 Top".
- **Alias:** `config.alias` une nombres que son la misma persona. Por ejemplo, "Daniel y Alejandra Interiano" = "Alejandra María Pérez Ponce".
- **Rutina:**
  - Con 1 acción en cada punto el día queda completo.
  - Desde 2026-10-24 son 5 puntos, en este orden: 1) Historia del día (se marca sola al compartir), 2) "Escuchar, leer o Training" (clic), 3) Agregar personas nuevas a la lista (+1 abre el formulario; solo cuenta si la persona NO está ya en su CRM; se guarda en el CRM; day.conL), 4) Presentar el plan (con nombre, 1 por persona por semana; day.presL), 5) Seguimiento a prospectos (elige del CRM, 1 por persona al día, marca c.ultSeg; day.segL). El "+" nunca suma sin nombre; el "−" quita el último nombre.
  - Puntos: cada uno de los 5 da máximo 1 punto al día (aunque agregue 10 personas, suma 1). Se guardan semPts/mesPts en constancia.
  - Ranking "Mi Racha" (semana): 1) racha actual (días seguidos completos; si falla un día vuelve a 0 y no muestra 🔥), 2) presentaciones, 3) puntos. Vista mes: mejor racha del mes, presentaciones, puntos. Solo aparecen quienes tienen al menos 1 punto. Cada socio muestra "Hoy N pts" y, solo a su línea de arriba (y admin), un botón verde de WhatsApp: "Felicitar" si hoy completó 5/5, "Motivar" si va 1-4 (cuántas le faltan) o 0 (empezar su racha).
- **Bienvenida:** el video es obligatorio; "Ya vi mi video" se desbloquea al 90%. Una alerta dice qué pasos faltan.
- **Mis socios:** cada socio ve **toda su línea hacia abajo**, sin límite de profundidad. Usa `registro.linea` con array-contains.
- **Inicio (rediseño 2026-10-20, orden fijo):**
  1. Saludo "¡Vamos, líder! 🛡️" + frase animada + racha.
  2. Barra delgada "Agregue su WhatsApp" (solo si falta) y banner de felicitación por activaciones del día (aparece al abrir y se va solo).
  3. Franja de meta (`#metaStrip`): rango objetivo con su color, volumen personal del mes vs puntos del rango e ingreso soñado. Si no hay metas, invita a definirlas.
  4. "🔥 Tu día" (rutina). La historia del día es una línea de la rutina con botón "Compartir" que abre la imagen en una hoja; ya no hay tarjeta grande.
  5. Accesos directos. 6. Citas de hoy y próximas actividades.
  7. "📊 Mi semana": 7 días + meta de activaciones del mes + "Ver mi mes" (registros gratis, activaciones, lugar en el ranking, constancia).
  8. "🚀 Top Activaciones": top 3 por volumen del mes.
  - Quitados de Inicio: tarjeta grande de historia, Reto del mes, Tu enlace de referido (se edita en Mi página) y Top Consistencia (sigue en Equipo → Ranking → Rutina).
  - "🎯 Mis metas": activaciones personales del mes (se reinicia cada mes), "Mi próximo rango" (sin plazo ni número de nivel, con el color del rango) e ingreso mensual soñado en 5 años (USD). Se guardan en `users/{uid}.metas` {mes, act, rango, sueno}. Las ven el socio, su patrocinador y su línea de arriba (en Mis socios).
  - Próximo rango AUTOMÁTICO: rango actual = `registro.rango` (lo pone el admin en Editar socio; "" = automático), luego `config.rangos` en team.json (nombre → rango, para quien no está en la hoja; Edwin = National Director) y, si no, la Posición de la hoja Calificados (`liderazgo.rango`: Action Leader→Líder, Senior Marketing Director→SM Director); si no aparece, es "Socio". El próximo rango es siempre el siguiente; los demás salen con 🔒 y los anteriores "✓ Logrado".
  - Rangos y colores: 1 Líder (acceso al sistema) 200 pts gris, 2 Team Leader 500 pts azul marca, 3 Marketing Director verde, 4 SM Director azul, 5 Regional Director naranja, 6 National Director rojo, 7 International Director morado, 8 Executive Director negro, 9 Board of Director amarillo-naranja. Niveles 3-9 sin puntos aún. Los puntos = volumen de activaciones personales del mes.

## 4b. Mi mapa de sueños (pestaña "Sueños", reemplazó a Prompts)

- PRIVADO: solo lo ve el socio (no se muestra a patrocinador ni línea). Prompts IA se abre desde Academia (botón "🤖 Prompts IA").
- Datos: `users/{uid}/datos/suenosInfo` {porque, crucero:{dest, fecha, img}} y `users/{uid}/suenos/{id}` {cat: tener|vivir|ser|dar|libertad, tit, fecha AAAA-MM, img (JPEG dataURL ≤900px), ok, t}.
- Pantalla: "Mi por qué", "🚢 Mi próximo crucero" con cuenta regresiva, píldoras de ingreso soñado y próximo rango, collage de fotos (primera grande, patrón de tamaños), "¡CUMPLIDO!" en cumplidos, compartir como imagen 1080×1920.
- La foto del crucero se ve de fondo en la franja de meta de Inicio.

## 5. Ranking: de dónde salen los números

1. **Registros gratis:** reporte CSV que Edwin sube a la carpeta de Google Drive `1QubWm4w4K8tNsPUxfRgjo3NueoFKvtrP`, un archivo por día con nombre `DD-MM-AA.csv` (ej. `20-10-26.csv` = 20 oct 2026). Es acumulado del mes: cada fila es una cuenta gratis creada (columnas level, first_name, last_name, email, sponsor_name, sponsor_id, country, account_created). Se usa el archivo más reciente, se cuenta por `sponsor_id` (filas con account_created dentro del mes) y se guarda solo patrocinador y fecha (nunca correos). Las cuentas que se activan desaparecen del reporte; por eso la app suma registros + activaciones.
2. **Activaciones (socios nuevos):**
   - Vienen de los correos de no-reply@incruises.com: "Tienes un nuevo Socio en tu equipo." y "Tienes un nuevo Miembro en tu equipo.".
   - En el correo, el 1.er recuadro es la persona nueva y el 2.º su **patrocinador directo**.
   - Se guardan en `team.json → activaciones`, sin correo ni teléfono.
   - `config.activacionesCorte` es la fecha del último socio nuevo guardado.
3. **Recalcular:** escribir `/tmp/.../reg.txt` con líneas `sponsor_id|sponsor_name|account_created` a partir del CSV (Drive `read_file_content`; el proxy no deja descargarlo por shell) y correr `python3 tools/ranking.py reg.txt '<json de activaciones nuevas>'`. Luego commit y push.

**Cómo corre hoy:** la tarea programada en sesiones nuevas falla porque esas sesiones no tienen permiso para hacer push al repo (está **pausada**). Por eso la actualización corre como recordatorios encadenados dentro del chat de Claude Code donde se construyó la app, a las 9:55, 12:55, 3:55 y 6:55 pm hora de Honduras. Si ese chat se pierde, hay dos opciones:
- Rehacer esa cadena desde el chat nuevo.
- Darle al repo permiso de escritura en la tarea programada y volver a activarla.

## 5b. Reto de invitados a eventos

- Tarjeta morada en Inicio (`#evCard`) mientras `config.evento.fecha` no haya pasado: total de invitados, "+N hoy", top 3 y ranking completo.
- Fuente: hoja del formulario del evento (evento actual: spreadsheet `1zAt3bZ0zBhh35YkryE9DDyMdAB5ek-nEKIJfthff554`, pestaña "Respuestas de formulario 1", columnas A Marca temporal y F "Invitado por"). Solo lectura: no hay permiso de edición.
- `python3 tools/evento.py evento.txt` (líneas `dd/mm/aaaa h:mm:ss|Invitado por|Nombre del invitado`, columnas A, F y C; en la app solo se muestra nombre + inicial, y cada socio ve solo "Mis invitados"; registros repetidos con el mismo nombre cuentan una vez) agrupa nombres mal escritos (Eric/Erick, sin acentos, solo primer nombre si es único) y guarda `config.evento` {titulo, fecha, lugar, meta, alias, total, hoy, top[]}. Si dos nombres no se unen solos, agregar `config.evento.alias`.
- Se actualiza cada hora (recordatorio "CICLO EVENTO" en el chat) hasta el día del evento. Nunca se guardan correos ni teléfonos de invitados.

## 6. Tareas programadas

Las instrucciones exactas de cada una están en `respaldo/tareas/`:

- **Ranking y volumen**, 4 veces al día: pausada; ver sección 5.
- **Agenda y líderes:** domingo 10:55 pm y lunes 5:55 pm. Copia la hoja de Google "Agenda Action Leaders Plus" (pestañas Agenda y Calificados) al calendario y a liderazgo de `team.json`.
- **Resumen semanal:** lunes 6:52 am. Solo lectura.
- **Aviso de presentadores sin asignar:** jueves 9:52 am. Solo lectura.

Hoja de Google de la agenda: spreadsheetId `1-0ct30l0fcn8rtzgfOcrkLTGmgRHOa2xEmm2X0izvG4`.

## 6b. Flyer de cada actualización (pedido fijo de Edwin)

Cada vez que se publique una actualización de la app, hacer un flyer 1080×1350 con la fecha y las novedades (máximo 5, cortas, de usted) y mandárselo a Edwin por el chat para que lo envíe al equipo. Plantilla: `tools/flyer/actualizacion.html` (editar fecha y lista; captura con Playwright a 1080×1350). Cierra con "Para verla: cierre la app por completo y vuelva a abrirla".

## 7. Estilo

- **Paleta:** fondo #F3F6F9, marca #0A7DAD, celeste #2AC1F1, tinta #2B2A2D. Hay modo oscuro.
- **Fuentes:** Figtree (texto), Bricolage Grotesque (títulos), Barlow Condensed (números).
- **Diseño:** minimalista, "pro" y fácil de duplicar. Botones limpios, sin recuadros de más. Probar siempre en el celular.


## 5c. Modo entrada del evento (San Pedro Sula, 25 oct 2026) — reutilizable
- Recepción (socios marcados por el admin en Admin → Editar socio → "🎟️ Recepción del evento", doc `eventoStaff/{uid}`) y el admin ven en Inicio la tarjeta "Modo entrada".
- Lista cifrada en el repo: `data/entrada.enc` (AES-GCM). La arma `tools/entrada.py SOCIOS.txt MAPA.json CLAVE` con la pestaña 'SOCIOS EVENTO' (A:E: NO, nombre, líder, ACCESO/Pendiente, PREMIUM/CLASSIC) y el mapa invitado→socio que genera `EV_MAP=... tools/evento.py`. La clave vive en Firestore `evento/sps26/priv/llave` (solo staff) y localmente en /home/claude/.evk; NUNCA en el repo.
- Check-ins en Firestore `evento/sps26/checkin/{id}` (tipo s = socio con número de ticket, tipo i = invitado; manual = registrado en puerta con WhatsApp). `evento/sps26/ovr/{id}` = acceso dado por el admin (pagó en puerta). `evento/sps26` doc `resumen` = conteo público para la tarjeta del reto.
- Premio: el socio con más invitados que LLEGARON (incluye los registrados en puerta).
- Reglas de Firestore: ver `respaldo/firestore.rules` (bloque "Modo entrada").
- Después del evento (hasta 7 días): la tarjeta del reto pasa a "Resultados" (naranja), con "📲 Seguimiento del evento" (mensajes de WhatsApp para los que llegaron / no llegaron, con la página de prospectos del socio, y "➕ CRM") y "🏆 Llegadas". La tarjeta "Modo entrada" se oculta tras el día del evento; el admin entra al detalle desde "🔎 Admin: ver quién llegó de cada socio" hasta ENT.res.
- PRÓXIMO EVENTO (reutilizar): 1) cambiar `const ENT={id,tit,fecha,fin,res}` en index.html (id nuevo, p. ej. "tgu27"); 2) config.evento en team.json (titulo, fecha, lugar, lugarTxt, hora, llegar, mapa) y vaciar alias/top; 3) nueva clave AES (`python3 -c "import os,base64;print(base64.urlsafe_b64encode(os.urandom(32)).decode().rstrip('=')")` → /home/claude/.evk) y enlace de activación `?evk=CLAVE` abierto una vez por el admin; 4) hojas de invitados (A/F/C) y socios (A:E) → evento.py + entrada.py; 5) marcar recepción en Admin → Editar socio. Resultados de SPS 2026: 140 registrados, 51 llegaron.

## 8. Rendimiento (plan Spark: 50 000 lecturas/día)
- Uso normal ~10–15 mil lecturas/día; el día del evento (25 oct) llegó a ~54–61 mil y pasó el límite gratis.
- Las fotos de team.json son archivos en media/fotos/ (nunca base64 dentro de team.json).
- Fotos de Firestore: `cargarFotos()` con caché local de 6 h (getDocsFromCache), sin escucha en vivo.
- `constancia` (Mi Racha / Índice) se lee solo al abrir esas vistas (caché 10 min), no al iniciar la app.
- Antes de cada cambio, decirle a Edwin si puede afectar el rendimiento o las lecturas.

## 9. Cambios del 26 oct (noche)
- WhatsApp de socios: el registro con enlace de bienvenida ahora muestra el número y pregunta "¿Este es su WhatsApp?". Inicio pide confirmar una vez (registro.waOk). Perfil → "👤 Mis datos" (nombre, WhatsApp, ranking secundario). Líder: "✏️ Número" en Mis socios (cambiarNumSocio; el admin corrige el registro directo). Admin → tarjeta "⚠️ WhatsApp repetidos".
- Citas: "🔁 Reprogramar" (abrirReprog) con mensaje de nuevo horario (citaMsg(c,"rep")).
- "Índice de Acción" se llama ahora "Índice de Duplicación"; chips "⚡ Personal X%" y "⚡ Equipo de Nombre Y% (n socios)".
- YessMovemente: el botón de la agenda es "📧 ¿Cómo entrar?" (abrirYess), no se comparte el enlace.

## 10. Presentación virtual (`sala.html`)
- **Lanzamiento pendiente:** por ahora solo la ven los admins (`salaOk()` en index.html devuelve isAdmin). Para abrirla a todos los socios: `return true` y publicar.
- Enlace: `sala.html?de=CODIGO_PERFIL&p=Nombre&c=idCRM`. Sala oscura con el video de YouTube sin controles (capa encima, no se puede adelantar, retoma donde quedó), capítulos, preguntas dentro del video (inicio: qué tiene más valor; país; "¿Le está gustando?") y cierre (respuesta, cómo prefiere el contacto o motivo) con botón "🎁 Quiero mi link de registro" al WhatsApp del socio (`perfiles.wa` o `perfiles.waS`).
- Video y momentos: constantes `VIDEO`, `CAPS` y `MOM` al inicio del script de sala.html (fracción <1 o segundos). Cambiarlas no obliga a recargar la app.
- Datos: `users/{uid}/sala/{id}` {n, c, t0, t, pct, r1, pais, pulso, resp, como, motivo, dur}. Reglas en `respaldo/reglas-sala.txt` (Edwin debe pegarlas en Firebase).
- App: CRM → "🎬 Presentación" (envía el enlace por WhatsApp), Perfil → "🎬 Mi presentación virtual" (lista con nivel 🔥/🟠/❄️ y mensaje de seguimiento), tarjeta en Inicio con lo nuevo. Lecturas: solo si el socio ya envió alguna (LS salaOn) y solo documentos nuevos (where t > última sincronización).

## 11. Cambios del 27 oct
- Tarjeta del evento (reto/resultados) OCULTA en Inicio: `const EV_SHOW=false` en index.html. Los datos (team.json config.evento, Firestore evento/sps26, data/entrada.enc) se conservan; para mostrarla, EV_SHOW=true.
- Rutina: encabezado "🔥 Su rutina de hoy" + chip de racha + barra "X de 5" y una sola línea "👉 Siguiente paso" con botón (el primer pendiente; de 6 pm en adelante avisa si se pierde la racha; al completar "¡Día completo! … Mañana va por N"). Textos de los 5 puntos en imperativo (campos nx/bt en ROUTINE).

## 12. Llamada de 3 (27 oct)
- Socio: CRM → "📞 Llamada de 3" o Mi agenda → "Pedir llamada de 3 a un líder" (pedirL3). Elige un líder de su línea (registro.linea + patrocinadorUid; nombres desde fotos/{uid}.invNombre), día, hora, Zoom/WhatsApp, nota. Crea `llamadas3/{id}` y una cita tipo "lider" con l3=id.
- Líder: tarjeta #l3Card en Inicio (loadL3: where para==yo y nP==true) con Aceptar / Otra hora / No puedo. Al aceptar se agenda solo (l3AgendaLider) y puede avisar por WhatsApp (lee users/{de}.registro.whatsapp).
- Respuesta al socio: where de==yo y nD==true (solo si LS l3Env); actualiza el título de su cita (✅/🕗/✖). Si el líder propone otra hora, el socio la acepta y al líder se le agenda sola.
- Reglas: respaldo/reglas-llamadas3.txt (Edwin debe pegarlas). Sin notificación push (requiere Blaze + FCM).

## 13. Cambios de horario (desde 27 oct)
- "Presentación Europa" = 22:00 hora de Madrid y "YessMovemente Training" = 16:00 hora de Madrid (invierno europeo: 3:00 pm y 9:00 am Honduras; verano: 2:00 pm y 8:00 am). Todo lo demás está anclado a la hora de Honduras (UTC-6, sin cambio).
- Tarea programada "Cambios de horario (Europa / EE.UU.) en la agenda": cada miércoles 10:47 am Honduras revisa si en 8 días cambia Europa o EE.UU.; si cambia Europa, ajusta la hoja Agenda (col. C) y team.json, y avisa a Edwin. Miami solo se informa (la app calcula su hora sola).

## 14. Ahorro pendiente y calificación del sistema (27 oct)
- **Ahorro pendiente:** `tools/ahorro.py` (ver su ayuda). Lista completa CIFRADA en `data/ahorro.enc` (misma clave del evento, /home/claude/.evk; solo admin). En `team.json → config.ahorro` solo van huellas parciales (FNV-1a, 6 hex) de email y WhatsApp (últimos 8 dígitos) con su fecha de gracia, `ini` (nadie se bloquea antes; octubre = 2026-11-01 00:00 HN) y `li` (líderes pendientes, huella de su id).
  - Fuentes: reporte CSV de inCruises (Edwin lo sube; el 31 oct manda el final) → `ahorro.py csv REPORTE.csv LIDERES.txt` (LIDERES = Nombre|email|tel de la pestaña Calificados, archivo temporal fuera del repo). Desde noviembre, en cada ciclo del ranking: correo "Tu pago de Membresía inCruises no se realizó con éxito." → `ahorro.py falla 'email|Nombre|fecha|plan|patrocinador'` (gracia 5 días); correos "Alguien al que referiste pagó su factura exitosamente." / "¡Miembro del Equipo Pagado!" → `ahorro.py pago 'email o nombre'`.
  - App: Inicio `#ahCard` (pendiente con fecha límite + "Hablar con mi patrocinador", o "✅ Su ahorro está al día"). Mis socios (solo línea ascendente): chip "🔴 Ahorro pendiente" y botón "💰 Motivar su ahorro". Al vencer la gracia (`ahGate`): rutina, CRM nuevo, llamada de 3, presentación virtual y Academia en pausa. Admin → "💰 Ahorro pendiente → Revisar coincidencias" (descifra la lista y muestra quién no coincide).
  - Pendiente por hacer antes del 1 nov si Edwin lo pide: sacar de rankings a los bloqueados (desde ranking.py) y pausar "Agenda conmigo".
- **Calificación del sistema (Liderazgo):** `config.calificacion` {mes, lider:200, esp:500}. Ahorro al día obligatorio. Socio/Líder/Team Leader califican por puntos personales del mes (volumen de activaciones directas: Starter 50, Classic 200, Premium 500; no cuenta su membresía): 🛡️ Líder ≥200, ⚔️ Espartano ≥500. Marketing Director en adelante: ✅ por rango (Posición de la hoja Calificados). El motivo "ahorro pendiente" solo lo ven el líder, su línea (campo linea) y admin; los demás ven "⏳ No califica aún". Para noviembre: cambiar `config.calificacion` en team.json (sin publicar).

## 15. Índice activo y ficha de Liderazgo (27 oct, noche)
- Índice de Duplicación: solo cuentan socios activos (abrieron la app o hicieron rutina en 14 días: `idxActivo`, `IDX_INACT`). Los socios con ahorro pendiente cuentan SIEMPRE, y si están en pausa por ahorro valen 0 % (`idxPersX`), para que el líder tenga motivo de recuperar el ahorro. Chips "👥 Equipo activo X de Y" y "😴 Por reactivar" (abrirReactivar, con WhatsApp).
- Mis socios: chip "🚢 Ahorro al día" (no está en el reporte de pendientes) o "🔴 Ahorro pendiente", y "😴 N días sin actividad".
- Liderazgo: ficha con 🎯 Presentaciones (de la rutina/CRM, mesPres), 🚀 Socios nuevos, 📝 Registros sin activar (ranking: registros − activaciones), 💼 Volumen, ⚡ Índice equipo (activos/total) y 📈 Productividad (rutina personal del mes). Los calcula la app del admin (`liderResGuardar`, máx. 1 vez por hora, al cargar Admin) y los guarda en `team/liderazgo`; cada socio lee ese único documento (`liderResCargar`, caché 10 min). Enlace líder ↔ socio por nombre (nombre o nombreRanking = registro.nombre).

## 16. Reto del mes en Inicio (27 oct)
- Tarjeta `#premCard` (renderPremios) en el lugar de Top Activaciones (que se oculta mientras el reto está visible), con confeti al abrir. Datos en `team.json → config.premios` {mes, fin (cierre del mes inCruises en UTC), vol:{t,ic,min}, reg:{t,ic}, res}.
- Octubre 2026: 🏝️ Viaje a Roatán = un solo ganador, el de más volumen personal (mismas activaciones del ranking), mínimo 1,000 pts; si hay empate sigue en noviembre. 📚 Pack de libros de negocios = más registros inCruises (gratis + activados), mismo criterio de empate.
- Tras el cierre la tarjeta queda 5 días ("Cerrado"). Al cerrar: anotar el ganador en `config.premios.res` y, para el mes siguiente, actualizar mes/fin (sin publicar).
- (27 oct) Banner de activaciones: la línea ascendente del patrocinador ve "👏 Felicitar a {Nombre}" (banFelicitar): WhatsApp al patrocinador con uno de 8 mensajes distintos (FEL_MSG, elegido por uid del que felicita + activación, así cada líder envía uno diferente), con párrafos y el avance del reto de Roatán si está activo.

## 17. Lanzamiento de negocio (27 oct, noche)
- Mi agenda → "🚀 Planear mi lanzamiento de negocio" (abrirLanz): elige un líder de su línea ascendente (miLinea), fecha, hora y Zoom. Se guarda como cita tipo "lider" con lz:1, lzU/lzN/lzR (líder) e inv[] (ids del CRM invitados).
- Flyer 1080×1350 dibujado en el teléfono (lzCanvas, mismo diseño que tools/flyer/lanzamiento.html): fotos del socio (miFotoUrl) y del líder (fotoDe), rango del líder (lzRango), fecha, hora con bandera según la zona del teléfono (lzTz).
- "📩 Enviar invitación a {líder}": reutiliza la colección `llamadas3` con lz:true (mismas reglas, Aceptar / Otra hora / No puedo en la tarjeta #l3Card del líder; textos de "lanzamiento").
- "👥 Invitar a mis prospectos" (lzInvitados): lista del CRM con búsqueda y "➕ Agregar persona nueva"; cada envío comparte flyer + mensaje (lzMsg, de usted, en párrafos, con Zoom) o abre WhatsApp; marca el contacto ("🚀 Invitado a mi lanzamiento", next = fecha).
- (27 oct) Bienvenida oficial: el botón "💬 Darle la bienvenida" sale a la línea ascendente cuando el socio nuevo YA se registró en la app (banSocio): coincide por huella de email `ek` o de WhatsApp `wk` guardadas en la activación (FNV-1a 6 hex, como el ahorro; desde el 28 oct el ciclo del ranking las agrega), o por nombre, y su `registro.fecha` es posterior a la activación (así no se le da la bienvenida a socios antiguos que se registran por primera vez). Ventana de 30 días. Si solo falta la bienvenida, el banner dice "🎉 ¡{Nombre} ya entró a la app!". 5 mensajes de bienvenida distintos (banMsg).
- (27 oct, noche) El lanzamiento también lo planea el LÍDER: en abrirLanz hay dos modos, "🙋 Mi lanzamiento" (elige líder de su línea ascendente) y "👥 De un socio de mi equipo" (elige un socio de su línea descendente, `mios`, con buscador). Si no tiene línea ascendente (Edwin), entra directo al segundo. Cita del líder: lzE:1, lzSU/lzSN (socio que lanza). La invitación va en `llamadas3` con lzE:true; al aceptar, al socio se le crea su cita de lanzamiento (lzU/lzN = líder, lzR3:1) y desde "Mis lanzamientos" tiene su flyer para invitar.

## 18. Academia: cursos desde team.json (27 oct)
- `config.cursos` en team.json [{k, t, d, yt (id de YouTube), pdf?, pdfN?, pdfT?}] va primero y se suma a `CURSOS` de index.html (cursosL). Agregar un curso nuevo = editar team.json, sin publicar. El botón de PDF solo sale si el curso tiene `pdf`.
- Curso 1: "Cómo usar la app Action Leaders PLUS" (YouTube myejXMydAv0, entrenamiento por Zoom del 27 oct).

## 19. Eventos y Juntas de negocios (27 oct, noche)
- Agenda → Agenda del equipo → tarjeta "🎤 Eventos y juntas" (#evAg, renderEvA) con "➕ Crear" (abrirCrearEva). Colección Firestore `agendaEv` (reglas en respaldo/reglas-eventos.txt; Edwin debe pegarlas).
- 🤝 Junta de negocios: cualquier socio con ahorro al día; 1 a 3 anfitriones. La ven el creador, su línea descendente y su línea ascendente (+ los anfitriones). 🎤 Gran evento: desde Team Leader (miRangoIdx>=1 o admin); 1 invitado especial + 0 a 3 acompañantes; 🔓 Abierto (todos) o 🔒 Cerrado (creador + línea descendente + líderes).
- Visibilidad por fichas en `ver[]`: "all", "u:UID", "d:UID"; cada socio consulta con array-contains-any ["all","u:yo", "d:"+cada uid de su línea ascendente] (loadEvA, caché 10 min).
- Doc: {tipo, modo presencial|virtual, ciudad, lugar, lugarSub, maps, zoom, fecha, hora, form (Google Forms), dis 1-3, vis, lid[{uid,n,r,rol esp|acomp|anf}], lidU[], cre, creN, conf{uid:ok|no}, ver[]}.
- Líderes incluidos: tarjeta #evaInv en Inicio (Confirmar / No puedo / Ver flyer).
- Flyer en canvas (evaCanvas): fondos prediseñados en media/eventos/{g1,g2,g3,j1,j2,j3}.jpg (sacados de tools/flyer/evento/*.html con lo variable oculto) + textos y fotos encima; fuentes en media/fonts (Outfit y Bricolage, OFL). Script de invitación: evaScript (con link del formulario). Invitar desde el CRM: evaInvitar.

## 20. Resultado de citas y avisos (27 oct, noche)
- Citas pasadas (cualquier tipo, sin resultado): "✅ Se realizó" / "✖ No se realizó" (citaResultado) con notas opcionales; guarda c.res y c.resNota, agrega la nota al contacto del CRM; si es prospecto y se realizó, suma la presentación (sumarPres → c.hecha). "No se realizó" ofrece "🔁 Guardar y reprogramar" (reprogramar limpia res).
- Citas de Llamada de 3 / Lanzamiento: botón fijo "💬 Avisar por WhatsApp" (citaAvisar: lee llamadas3/{l3} y el WhatsApp de la otra persona) y "🚀 Ver flyer" en lanzamientos. En lzVer, si ya se envió la invitación, sale "💬 Avisar a … por WhatsApp".
- Botón "📞 Pedir llamada de 3" en azul de marca.

## 21. Avisos en vivo (app abierta)
- loadL3 usa onSnapshot (l3Un): para==yo&nP (solicitudes nuevas) y de==yo&nD (respuestas). evaListen escucha agendaEv con ver array-contains-any de evaFichas.
- avisoTop(t,sub,fn): banner arriba + vibración 8 s. Campanita #bellBtn/#bellN (bellPinta) cuenta l3P + eventos sin confirmar; avisosVer lleva a Inicio.
- Dedupe con LS "l3Seen"; el primer snapshot no dispara banner. Con la app cerrada NO hay aviso (requeriría Blaze + FCM).
- Stub de pruebas: onSnapshot de consultas re-consulta cada 1 s.

## 22. Citas compartidas: rol, recordar, cancelar, reprogramar
- citaRol(c): "para" (invitado: l3R / lzR3 / l3 sin cid) o "de" (quien pidió). El invitado NO ve WhatsApp al otro; solo Reprogramar y Cancelar.
- Quien pidió: "⏰ Recordar a {prospecto}" (recL3, cid del CRM) y "💬 Avisar a {líder}". Lanzamiento: 📣 Invitar + ⏰ Recordar (ci.inv). Eventos: ⏰ Recordar (LS evInv:id) en evaVer.
- recMsg: 3 variantes (ahF), separadas por párrafos; hoy/mañana. LS recH marca recordados. #recCard en Inicio para hoy/mañana.
- Cancelar (cancelarSheet + motivo): llamadas3 estado "cancelada", mot, canN; nP/nD para el otro → l3Cancelada (aviso + cita tachada c.cancel). Eventos: set cancel{mot,por,t} (ya no se borran); EVA filtra cancelados; aviso a lidU e invitadores.
- Reprogramar en cita l3: "de" → estado pendiente rep:true nP; "para" → propuesta pFecha/pHora nD. l3AgendaLider actualiza la cita existente.
- Scripts de evento y lanzamiento: fecha/hora, lugar, mapa, cupo y formulario en bloques separados; links en su propia línea.

## 23. Cuenta solo-admin y confirmación de lectura
- garciagoedwin@gmail.com nunca es líder/patrocinador: soloAdminFix (admin, al cargar socios) pasa a edwing.go@gmail.com a quien tenga patrocinadorUid de la solo-admin, reconstruye líneas (las líneas excluyen esSoloAdmin) y marca fotos/{uid}.oculto. Al entrar con esa cuenta: fotos oculto y sin código de invitación (publicarInv).
- fotosFs excluye ocultos (fotosOc); miLinea los excluye: no aparece en buscadores de líderes.
- llamadas3.visto: lo escribe el líder al recibir la pendiente (l3Vistos). Quien envió consulta sus citas "por confirmar" (l3EstadoEnv, al abrir y al volver a la app): "📨 aún no la abre" / "👀 ya vio".
- Errores de escucha de llamadas3 → l3Err (toast una vez).

## 24. My Dream Team ("Camino a mi libertad")
- Tarjeta #dtCard en Inicio (renderDT). Meta 30 directos ACTIVOS = registrados en la app con su enlace (registro.patrocinadorUid) y ahorro al día (ahSoc). Pendientes salen con ⚠️ y no cuentan. Solo lo ve el propio socio; la cuenta solo-admin no lo ve.
- Datos: dtArmar() desde mios (loadMios); resumen en LS "dtSum:uid" (se refresca cada 3 h o al abrir el cuadro). Bajo cada foto: activos en toda su línea.
- Pantallas: dtCuadro (30 casillas, "+" → dtInvitar con miEnlace), dtFicha (felicitar / motivar ahorro por WhatsApp, 3 variantes), dtNumeros (team/dreamteam, lo calcula el admin con dtStatsGuardar cada 6 h al cargar socios), dtSimular (solo cuentas en el teléfono; aviso "no es promesa de resultados ni ingresos"), dtHito (celebración 5/10/20/30 una vez; la primera vez solo guarda el nivel, sin celebrar).
- Nunca prometer ingresos ni "garantiza": usar "Su camino a Marketing Director".
