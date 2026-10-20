# Aviso presentadores sin asignar

- Horario: `CRON_TZ=America/Tegucigalpa 52 9 * * 4`
- Estado al respaldar (2026-10-20): activa
- ID: trig_01H5tL2KyUFBh7gXvC52mbxA

## Instrucción exacta

```
Revisa la agenda del equipo Action Leaders y avisa a Edwin qué actividades de la PRÓXIMA semana no tienen presentador o quien edifique. Es una tarea automática: no pidas confirmación y NO modifiques nada (solo lectura).

FUENTE: hoja de Google (Google Sheets) spreadsheetId 1-0ct30l0fcn8rtzgfOcrkLTGmgRHOa2xEmm2X0izvG4, pestaña "Agenda", rango "Agenda!A5:P". Columnas: A Fecha (dd/mm/aaaa), B Día, C Hora Honduras, H Actividad, I Tipo, K Presenta, L Edifica, O Notas. Hora de Honduras UTC-6.

1. Toma las actividades del próximo lunes al próximo domingo.
2. Lista las que tienen "Presenta" vacío. Aparte, lista las Presentaciones (Tipo "Presentación") y los "Action Leaders Training" que tienen "Edifica" vacío. Ignora actividades de tipo "Capacitación" de YessMovemente.
3. Si en esas fechas no hay ninguna actividad cargada, avísalo (falta cargar la semana).
4. Respuesta en español, corta, como lista: "Día dd/mm · hora · actividad — falta presentador/edifica". Si todo está asignado, una sola línea: "✅ La próxima semana ya está completa".
```
