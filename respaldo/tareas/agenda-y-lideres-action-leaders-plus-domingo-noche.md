# Agenda y líderes Action Leaders PLUS (domingo noche)

- Horario: `CRON_TZ=America/Tegucigalpa 55 22 * * 0`
- Estado al respaldar (2026-10-20): activa
- ID: trig_018nXieLL268rskXFsYxhiFn

## Instrucción exacta

```
Actualiza en la app "Action Leaders PLUS" el CALENDARIO y la LISTA de líderes calificados desde la hoja de Google "Agenda Action Leaders Plus". No toques presentaciones, socios nuevos, volumen ni el ranking. Es una tarea automática: no pidas confirmación.

DÓNDE VIVEN LOS DATOS
La app "Action Leaders PLUS" (https://actionleadersplus.com) lee sus datos del equipo del archivo data/team.json del repositorio de GitHub garciagoedwin-coder/action-leaders-plus. (el nombre del repo termina en punto). Para actualizar la app hay que modificar ese archivo y hacer push.
1. Clona: git clone https://github.com/garciagoedwin-coder/action-leaders-plus. alp && cd alp   (si falla la autenticación, usa la herramienta add_repo con owner "garciagoedwin-coder" y repo "action-leaders-plus." con access "push" y vuelve a clonar con el comando que te indique).
2. Lee data/team.json con Python (json). Estructura: {"ranking":[...],"liderazgo":[...],"calendario":[...],"activaciones":[...],"academia":[],"red":null,"config":{...},"fotos":[...]}. CONSERVA intactas todas las claves y campos que esta tarea no menciona (por ejemplo config.accesos, config.titulos, config.especiales, config.reto, config.bienvenida, fotos).
3. Guarda con json.dump(d, f, ensure_ascii=False, indent=1).
4. Solo si el archivo cambió: git add data/team.json && git -c user.email=noreply@anthropic.com -c user.name=Claude commit -m "<mensaje corto>" && git push origin HEAD:main. Si el push falla por cambios remotos: git pull --rebase origin main y vuelve a hacer push (una vez).
5. NUNCA guardes correos ni teléfonos en team.json: el repositorio es público.

HOJA: spreadsheetId 1-0ct30l0fcn8rtzgfOcrkLTGmgRHOa2xEmm2X0izvG4 (Google Sheets). Pestañas "Agenda" y "Calificados", encabezados fila 4, datos desde fila 5.
slug: minúsculas, sin acentos ni ñ (ñ→n), lo que no sea letra o número → "-", sin guiones repetidos ni al inicio/final.

PARTE A — d["calendario"]
1. Lee "Agenda!A5:P". Columnas: A Fecha (dd/mm/aaaa), B Día, C Hora Honduras ("8:00 p.m."), D Hora fin, E-G otras horas (ignorar), H Actividad, I Tipo, J Modalidad, K Presenta, L Edifica, M Lugar, N Enlace, O Notas, P Estado (ignorar). Ignora filas sin Fecha o sin Actividad.
2. Cada fila → {"titulo": H, "fecha": "AAAA-MM-DD", "hora": "HH:MM" 24 h desde C ("8:00 a.m."→"08:00", "2:00 p.m."→"14:00", "12:00 p.m."→"12:00", "12:00 a.m."→"00:00"; si no se puede, ""), "horaFin": igual desde D o "", "tipo": I, "modalidad": J (vacía → "Presencial" si Tipo es "Evento", si no "Virtual"), "responsable": K, "edifica": L, "lugar": M, "enlace": N, "notas": O, "id": fecha + "-" + hora sin ":" (o "0000") + "-" + slug(titulo) (si se repite "-2")}. Recorta espacios.
3. Las actividades de la hoja reemplazan a las del calendario para las fechas que la hoja cubre; conserva las actividades de fechas anteriores a la primera fecha de la hoja. Si la pestaña no se puede leer o viene vacía, no cambies nada.

PARTE B — d["liderazgo"]
1. Lee "Calificados!A5:J" (A #, B Nombre, C Correo, D Teléfono, E Posición, F Línea ascendente, G QBI "86%", H Meta, I Volumen actual, J Nombre en ranking). Ignora filas sin Nombre.
2. Cada fila → {"nombre": B, "rango": E, "linea": F, "qbi": número 0-100 desde G (omítelo si vacío), "meta": número desde H (sin comas; omítelo si vacío), "nombreRanking": J o "", "id": slug(nombre)}.
3. Líder existente (mismo id): actualiza SOLO esos campos y conserva presentaciones, nuevos, volumen y volumenDetalle. Líder nuevo: agrégalo con presentaciones 0, nuevos 0, volumen 0, volumenDetalle "". Líder que ya no está en la hoja: quítalo. NUNCA copies Correo, Teléfono ni Volumen (I). Si la pestaña no se puede leer, no cambies nada.

FINAL
- Si cambió el calendario: d["config"]["calendarioActualizado"] = ahora ISO con -06:00.
- Guarda y haz push solo si hubo cambios.
- Resumen corto en español: cambios en calendario y líderes, y actividades sin presentador en los próximos 7 días. Si no hubo cambios, una línea.
REGLAS: No modifiques la hoja (solo léela). No toques ranking, activaciones, fotos ni otras claves de config.
```
