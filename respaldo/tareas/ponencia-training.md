# Tarea: ponencia del Action Leaders Training (preparar / actualizar)

Instrucciones para las tareas programadas «Ponencia del Training». Todo en español; textos para el equipo SIEMPRE de «usted», nunca prometer ingresos ni hablar de dinero/ganancias. No pidas confirmación (es automática).

## 0. Preparar el entorno
1. Clona con permiso de escritura: herramienta add_repo (owner `garciagoedwin-coder`, repo `action-leaders-plus.`, access `push`) y el comando que indique. Entra a la carpeta.
2. Lee `CLAUDE.md` completo (sobre todo «Ponencias del Action Leaders Training» y «Action Leaders Training con ponentes y tema»). Si la sesión tiene el Proyecto «App Movil», lee también `claude/guia-app-para-entrenamientos.md` y `claude/manual-de-marca-action-leaders.md` (nombres EXACTOS de botones).
3. Fecha objetivo = el día del Training que dice la tarea (hora de Honduras, UTC-6). Evento: en `data/team.json → calendario`, el `Action Leaders Training` de esa fecha (id `AAAA-MM-DD-2000-action-leaders-training`). Si no existe o tiene `cancel:true`: termina y avisa a Edwin en una línea.

## 1. Datos (cifrados; el log de GitHub es público)
1. `sh tools/training/llaves.sh /tmp/pon-k` → imprime la llave pública (pk). La privada se queda en /tmp/pon-k (NUNCA en el repo).
2. Dispara `diagperf.yml` con la API REST (GraphQL está bloqueado):
   `gh api -X POST repos/garciagoedwin-coder/action-leaders-plus./actions/workflows/diagperf.yml/dispatches -f ref=main -f 'inputs[code]=analisis' -f "inputs[pk]=$(cat /tmp/pon-k/pk.txt)"`
   Busca el run nuevo filtrando `created_at >= hora de disparo` (no tomes «el último» a ciegas). Espera con un bucle until (no sleeps sueltos encadenados). Descarga el log (`gh api repos/…/actions/runs/ID/logs > l.zip; unzip -p l.zip '*'`) y descifra: `python3 tools/training/descifrar.py LOG.txt /tmp/pon-k/priv.pem /tmp/pon-k/a.json`. Si sale «***», repite el run. BORRA el run al terminar (`gh api -X DELETE repos/…/actions/runs/ID`).
3. a.json trae: `U` (socios: nombre, plan, rango, actividad con emb = conteo del CRM por etapa, ir = Plan de Inicio Rápido), `cr` (constancia de cada uid: racha, vr, rv, mesComp, mesPres, semPts, svY/svE/svT de la presentación virtual, comp…) y `tu.s` (Turnos del mes actual y el siguiente).
4. Ponentes = `tu.s[idEvento]` lugares `p`, `e`, `p3`, `p4` con `n` y SIN `st` o con `st` "ok" (aceptados). Orden de presentación (Edwin, 20 nov): de rango MÁS BAJO a MÁS ALTO; el rango más alto va de ÚLTIMO y CIERRA (Marketing Director < SM < Regional < National < … < Board). Empate: quien se apuntó antes abre. Tema elegido por los admins = `tu.s[idEvento].tema` (si existe, manda).
5. Fotos de los ponentes y anfitrión: dispara diagperf con `inputs[code]=fotos` e `inputs[q]=primernombre1,primernombre2` (minúsculas, sin acentos), descifra igual → JSON {nombre: dataURL}. Guárdalas como `tools/training/AAAA-MM-DD/f-<nombre>.jpg` (≈640 px; están en .gitignore, NO se suben). Sin foto → iniciales.
6. Números públicos: `data/team.json` → ranking (volumen = activaciones del mes), activaciones, config.metaEquipo, calendario de la semana, config.anuncio (próximo evento).
Si no se puede disparar el diagnóstico (sin permiso de API), sigue solo con team.json y dilo en el aviso a Edwin.

## 2. MODO PREPARAR
Tema según el día:
- MARTES = una HABILIDAD que el análisis muestre débil (ej.: muchos en «Nuevo» sin contactar → primer contacto; muchos en Seguimiento → cierre; presentaciones bajas → invitar; IC bajo → constancia/rutina). 1 ponente.
- JUEVES = REDES SOCIALES y marca personal (historias, perfil, Mi página, presentación virtual). 1 ponente.
- DOMINGO = MENTALIDAD, CREENCIAS y LIDERAZGO. Con 2–3 ponentes se divide: 1 = tema completo; 2 = Mentalidad + Habilidad; 3 = Creencia + Habilidad + Liderazgo. Abre el de rango más bajo y CIERRA el de rango más alto (el cierre, la tarea de 48 horas y el «Escriba en el chat» son suyos).
No repitas el tema de las últimas 2 semanas (mira las carpetas de tools/training/). Siempre usa datos reales del análisis.

Pasos:
1. Copia `tools/training/2026-11-19/` como plantilla a `tools/training/AAAA-MM-DD/` (deck.html y guion.html; mismo modelo de 13 diapositivas, mismo CSS). Modelo fijo de diapositivas: portada · anfitrión · así va el equipo (top 3 activaciones, mejores rachas, meta del equipo) · lo que viene (tip de la app, pago recurrente de forma positiva, agenda de la semana, próximo evento) · portada del ponente (una por parte) · «Lo que dice nuestra app» con números reales · contenido · acción con la app (botones EXACTOS entre « ») · Tarea de 48 horas · cierre con #HASTAQUEFUNCIONE.
2. Anfitrión: si Turnos no tiene uno aparte, usa el ponente 2 o deja «Anfitrión: por confirmar».
3. Render: `python3 -m http.server 8765` en la raíz del repo y `python3 tools/training/pdf.py http://localhost:8765/tools/training/AAAA-MM-DD/deck.html media/training/AAAA-MM-DD-<tema-corto>.pdf /tmp/pon-shots` (1920×1080). Guion: Playwright `pg.pdf(path='media/training/AAAA-MM-DD-guion.pdf', format='Letter', print_background=True)`. Portada: captura de la 1.ª diapositiva a 1280×720 → `media/training/AAAA-MM-DD-portada.jpg`. MIRA las capturas (texto cortado, encimado, fotos) y corrige antes de seguir.
4. `data/team.json` → `config.ponencias[idEvento] = {t, s, pdf, g, img, roles:{Nombre: "Ponente"|"Anfitrión/a"}, act: ahora ISO UTC}`. Borra las entradas de ponencias con fecha de hace más de 14 días. Guarda con `json.dump(d, f, ensure_ascii=False, indent=1)` (indent 1, o se reescribe todo el archivo).
5. Commit (`git -c user.email=noreply@anthropic.com -c user.name=Claude commit`) de tools/training/AAAA-MM-DD (sin fotos), media/training y data/team.json; `git pull --rebase origin main` y `git push origin HEAD:main`. NO correr .publicar.sh (no se publica la app).
6. Aviso a Edwin (mensaje final, llega a su teléfono): tema, ponentes, 3 datos clave usados y adjunta los 2 PDF con SendUserFile. DOMINGO: pídele que lo revise el sábado y responda con cambios. Si no hay ponentes aceptados en Turnos: prepárala igual con «Ponente: por confirmar» y dile que asigne a alguien en Turnos.
Al ponente le llega solo el aviso «Su ponencia de mañana está lista» (servidor, ~30 h antes).

## 3. MODO ACTUALIZAR (el día del Training, 6:15 p.m. HN)
1. Si `config.ponencias[idEvento]` no existe: termina («no había ponencia preparada»).
2. Repite §1 (datos nuevos y Turnos). Si cambiaron los ponentes aceptados, ajusta nombres/fotos/roles.
3. En deck.html y guion.html cambia SOLO los números (ranking, rachas, meta, CRM, presentación virtual) y los nombres que cambiaron; no reescribas el contenido. Vuelve a renderizar los PDF y la portada.
4. `config.ponencias[idEvento].act = ahora ISO UTC` (la app muestra «Actualizada…/Nueva versión» y el servidor manda «Descargue su ponencia otra vez»). Commit + push como arriba.
5. Aviso a Edwin en una línea: «Ponencia de hoy actualizada con los números de las 6:15 p.m.» + qué cambió.

## Reglas
- Nunca correos, teléfonos ni uids en el repo, ni en el log de GitHub (solo conteos).
- Logs de diagnóstico: bórralos al terminar.
- Respeta la marca: fondo #0B1220, celeste #2AC1F1, marca #0A7DAD; Poppins títulos, Figtree texto, Barlow Condensed números; «ACTION LEADERS Training!» con Bebas + Kaushan (excepción aprobada). En maquetas no usar el nombre «Karen Lizeth Paz».
