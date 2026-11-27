# Publicación automática en la página de Action Leaders (Metricool)

Aprobado por Edwin el 24 nov 2026 («HAZLO»): todo en automático, permiso de los socios por defecto.
Cuentas: Facebook + Instagram **@actionleadersoficial**, marca de Metricool **"Action Leaders +"**, `blogId` **7963364**,
zona horaria `America/Tegucigalpa`. (La marca 7543159 es la personal de Edwin: NUNCA publicar ahí.)

Decisiones de Edwin (24 nov): flyers y textos de **TÚ**; **todo** lleva llamado a la acción («Escríbenos QUIERO», link en la bio);
un flyer de llamado a la acción al día; socios nuevos, Team Leaders y rangos **uno por uno** (Team Leaders y rangos: máx. 3 al día);
Action Leaders del mes en **un solo flyer** con todos; fotos sacadas de la app.
**Socios nuevos, Team Leaders y rangos usan EXACTAMENTE los artes que ya genera la app** (bienCanvas y rgCanvas de index.html): el script hace una copia temporal `_redes_app.html` con Firebase simulado (tools/test/stub), dibuja con esas funciones y la borra. NUNCA subir `_redes_app.html`. Si la app cambia esos artes, redes cambia sola. Nunca prometer ingresos (nada de «gana dinero»).

> **(27 nov) GitHub desde la sesión:** `gh` FALLA (el GH_TOKEN de la sesión no sirve). Usar `curl` SIN encabezado de autorización (el proxy pone la credencial): disparar `curl -X POST -H 'Content-Type: application/json' https://api.github.com/repos/garciagoedwin-coder/action-leaders-plus./actions/workflows/diagperf.yml/dispatches --data-binary @body.json` (body = {"ref":"main","inputs":{…}}), listar `…/actions/workflows/diagperf.yml/runs`, log `curl -sL …/actions/runs/ID/logs`, borrar `curl -X DELETE …/actions/runs/ID`. El shell NO llega a actionleadersplus.com: para saber si Pages ya publicó, ver el run «pages build and deployment» del commit en `…/actions/runs`.

## Qué se publica

| Tarea | Pieza | Formato | Hora (HN) |
|---|---|---|---|
| mañana (7:47 a.m.) | Historia de atracción (foto real del equipo + frase) | historia | 9:00 a.m. |
| mañana | Presentación(es) del día (solo las que no han empezado) | historia | 12:00 p.m. |
| mañana | Action Leaders Training del día (`config.ponencias`) | publicación + historia | 10:00 a.m. / 6:30 p.m. |
| mañana | Llamado a la acción del día | publicación + historia | 1:00 p.m. / 4:00 p.m. |
| noche (7:41 p.m.) | Cada socio nuevo (`activaciones`), uno por uno | publicación + historia | 9:00 p.m., cada 20 min |
| noche | Team Leaders (`config.tl`) y rangos nuevos (`liderazgo`), uno por uno desde la cola de `data/redes.json`, máx. 3 | publicación + historia (dorado) | al DÍA SIGUIENTE 10 a.m., 1 p.m., 4 p.m. |
| noche | Action Leaders del mes (cuando cambia `liderazgoPeriodo`) | 1 publicación + 1 historia con todos | 8:30 p.m. |
| noche | Ganadores del mes (`config.ganadores`, mes nuevo) | publicación + historia | 8:00 p.m. |

Si la hora ya pasó, se programa 25 min después de la corrida. Quien ya tiene rango (Marketing Director+) no sale como Team Leader. Un Team Leader se reconoce una sola vez (`hechos`). Los rangos: la primera corrida solo guarda los actuales; se reconocen los ascensos de ahí en adelante.

`data/redes.json → enlace`: la página de Edwin para prospectos (destino.html?de=SU_CÓDIGO). Si está, va al final de cada texto. Si está vacío, solo «Escríbenos QUIERO».

## Pasos (los sigue la tarea programada)

1. Servidor: `python3 -m http.server 8765` en la raíz del repo (en segundo plano).
2. **Fotos de la app** (solo para lo que va a salir): `python3 tools/redes/redes.py <modo> --nombres` imprime la lista de nombres sin foto. Si no está vacía, baja sus fotos igual que en `respaldo/tareas/ponencia-training.md` §1 pasos 1, 2 y 5 (`tools/training/llaves.sh`, diagperf con `inputs[code]=fotos` e `inputs[q]=primeros nombres en minúsculas sin acentos`, descifrar, BORRAR el run). Empareja cada foto por nombre y primer apellido y guárdala como JPG ≈640 px en `tools/redes/_fotos/<nombre-normalizado>.jpg` (minúsculas, sin acentos, espacios → guiones; ej. `denia-v-rivas-rocha.jpg`). Esa carpeta NO se sube (está en `tools/redes/.gitignore`). Sin foto → iniciales (igual que en la app). Si no se puede disparar diagperf, sigue sin fotos y dilo en el mensaje final.
3. `python3 tools/redes/redes.py manana` o `python3 tools/redes/redes.py noche`. Deja las imágenes en `media/redes/AAAA-MM-DD/`, el plan en `tools/redes/salida.json` y (noche) el estado en `data/redes.json`. Borra solo las carpetas de `media/redes` de más de 14 días.
4. MIRA las imágenes (Read): nombres cortados, texto encimado, fotos mal recortadas o de otra persona. Si algo está mal, corrige la plantilla `tools/redes/plantilla.html` y vuelve a correr.
5. Commit y push SOLO de `media/redes`, `data/redes.json` (y la plantilla/script si se corrigieron). NO correr `.publicar.sh` (no es una actualización de la app). Commit con `git -c user.email=noreply@anthropic.com -c user.name=Claude commit -m "Redes: <modo> AAAA-MM-DD"`, `git pull --rebase origin main`, `git push origin HEAD:main`.
6. Esperar a que GitHub Pages sirva las imágenes (2–4 min): probar `https://actionleadersplus.com/media/redes/AAAA-MM-DD/<archivo>.jpg`; si el shell no llega al sitio, esperar 4 minutos.
7. Metricool, antes de crear: `getScheduledPosts` (blogId 7963364, de hoy a mañana) para no duplicar (si ya hay una con la misma imagen, saltarla).
8. Por cada elemento de `salida.json → pub`, `createScheduledPost` con `blogId` 7963364 y `date` = hora con `-06:00`:
   - Publicación: `providers` `[{"network":"instagram"},{"network":"facebook"}]`, `instagramData {"type":"POST"}`, `facebookData {"type":"POST"}`, `media` = URLs completas (base + ruta), `text` = `texto`, `autoPublish` true.
   - Historia: mismos providers, `instagramData {"type":"STORY"}`, `facebookData {"type":"STORY"}`, una imagen, SIN texto, `autoPublish` true.
   - `publicationDate {"dateTime": hora, "timezone": "America/Tegucigalpa"}`.
   - Si una falla, reintentar una vez; si vuelve a fallar, anotarla para el mensaje final.
9. Verificar con `getScheduledPosts` que quedó todo.

## Reglas

- Solo nombres (nombre corto, como en la app). Nunca correos, teléfonos, uids ni montos de dinero.
- Textos de TÚ, nunca prometer ingresos («viajar más, gastar menos y emprender desde tu celular»), premios = «incentivo de viaje», cierran con llamado a la acción y #HASTAQUEFUNCIONE. Varían cada día (ya lo hace el script).
- Marca: Poppins 600 mayúsculas con una palabra en celeste, Figtree, Barlow Condensed, fondo #0B1220, logo blanco pequeño sin «+»; dorado solo en reconocimientos.
- Mensaje final para Edwin (corto, llega al teléfono): qué se programó y a qué hora; errores si hubo.
