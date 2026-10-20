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

**Publicar un cambio:** `./.publicar.sh && git add -A && git commit -m "…" && git push`. GitHub Pages tarda 1 o 2 minutos. Los socios deben cerrar y abrir la app para ver el cambio.

**Probar:** servidor local en el puerto 8765 más Playwright, con los módulos de Firebase reemplazados por stubs (app, auth y firestore falsos con localStorage). Siempre tomar captura en un teléfono de 430 px antes de publicar.

## 3. Datos (Firestore)

- `users/{uid}`
  - `registro`: nombre, patrocinador, patrocinadorUid, invitadoPor, plan (Classic/Premium), planPor, linea[] (todos los uid de arriba), whatsapp, pais, invId, fecha.
  - `actividad`: hoy, racha, dias7, semana, cons{…}, presN[], cursos, bienvenida, historia, t.
  - Subcolecciones:
    - `datos/`: perfil, `rutina-AAAA-MM-DD` (con presL[{cid,n}] = nombres de las presentaciones), bienvenida, telsocios.
    - `crm/`: los prospectos del socio.
    - `citas/`: tipo zoom/whatsapp/persona/lider, fecha, hora, dur (60), cid, nombre, enlace, lugar, nota, hecha.
    - `prospectos/`: los que entran desde `conoce.html`.
- `invitaciones/{id}`: invitación personal. El patrocinador elige plan, país y WhatsApp.
- `constancia/{uid}`: resumen de la rutina para el ranking "Top Consistencia".
  - Semana de lunes a domingo, reinicia el lunes. Inicio: 2026-10-19.
  - Campos: wk, racha, semDias, semComp, semPres, mes, mesDias, mesComp, mesMejor, mesPres.
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
  - Puntos: contactos, seguimientos, presentaciones (con nombre, 1 por persona por semana), video, historia del día (se marca sola), 15 min de audio (Spotify), 30 min de formación, apoyar a un socio.
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
  - Próximo rango AUTOMÁTICO: rango actual = `registro.rango` (lo pone el admin en Editar socio; "" = automático) o, si no, la Posición de la hoja Calificados (`liderazgo.rango`: Action Leader→Líder, Senior Marketing Director→SM Director); si no aparece, es "Socio". El próximo rango es siempre el siguiente; los demás salen con 🔒 y los anteriores "✓ Logrado".
  - Rangos y colores: 1 Líder (acceso al sistema) 200 pts gris, 2 Team Leader 500 pts azul marca, 3 Marketing Director verde, 4 SM Director azul, 5 Regional Director naranja, 6 National Director rojo, 7 International Director morado, 8 Executive Director negro, 9 Board of Director amarillo-naranja. Niveles 3-9 sin puntos aún. Los puntos = volumen de activaciones personales del mes.

## 5. Ranking: de dónde salen los números

1. **Registros y presentaciones:**
   - Vienen del artefacto "Ranking Action Leaders", https://claude.ai/artifact/6yt41DTCmkM6EQnTMhSUXP. Lo actualiza otro chat.
   - Se lee con la herramienta Artifact (read, path `index.html`). Dentro hay un bloque `<script id="ranking-data">` con el JSON.
2. **Activaciones (socios nuevos):**
   - Vienen de los correos de no-reply@incruises.com: "Tienes un nuevo Socio en tu equipo." y "Tienes un nuevo Miembro en tu equipo.".
   - En el correo, el 1.er recuadro es la persona nueva y el 2.º su **patrocinador directo**.
   - Se guardan en `team.json → activaciones`, sin correo ni teléfono.
   - `config.activacionesCorte` es la fecha del último socio nuevo guardado.
3. **Recalcular:** `python3 tools/ranking.py '<json de activaciones nuevas>' <ruta del index.html del artefacto>`. Luego commit y push.

**Cómo corre hoy:** la tarea programada en sesiones nuevas falla porque esas sesiones no tienen permiso para hacer push al repo (está **pausada**). Por eso la actualización corre como recordatorios encadenados dentro del chat de Claude Code donde se construyó la app, a las 9:55, 12:55, 3:55 y 6:55 pm hora de Honduras. Si ese chat se pierde, hay dos opciones:
- Rehacer esa cadena desde el chat nuevo.
- Darle al repo permiso de escritura en la tarea programada y volver a activarla.

## 6. Tareas programadas

Las instrucciones exactas de cada una están en `respaldo/tareas/`:

- **Ranking y volumen**, 4 veces al día: pausada; ver sección 5.
- **Agenda y líderes:** domingo 10:55 pm y lunes 5:55 pm. Copia la hoja de Google "Agenda Action Leaders Plus" (pestañas Agenda y Calificados) al calendario y a liderazgo de `team.json`.
- **Resumen semanal:** lunes 6:52 am. Solo lectura.
- **Aviso de presentadores sin asignar:** jueves 9:52 am. Solo lectura.

Hoja de Google de la agenda: spreadsheetId `1-0ct30l0fcn8rtzgfOcrkLTGmgRHOa2xEmm2X0izvG4`.

## 7. Estilo

- **Paleta:** fondo #F3F6F9, marca #0A7DAD, celeste #2AC1F1, tinta #2B2A2D. Hay modo oscuro.
- **Fuentes:** Figtree (texto), Bricolage Grotesque (títulos), Barlow Condensed (números).
- **Diseño:** minimalista, "pro" y fácil de duplicar. Botones limpios, sin recuadros de más. Probar siempre en el celular.
