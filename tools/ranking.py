#!/usr/bin/env python3
"""Recalcula d["ranking"] de data/team.json.

Uso:  python3 tools/ranking.py REGISTROS.txt '[activaciones nuevas en JSON]'

REGISTROS.txt: una línea por registro gratis del reporte de Drive (CSV de inCruises),
  formato  sponsor_id|sponsor_name|account_created(ISO UTC)
  (sin correos ni teléfonos; el archivo NO se guarda en el repo).
Activaciones nuevas: [{"socio","paquete","patrocinador","fecha"}] sacadas de los correos de inCruises.

- registros   = registros gratis del mes por patrocinador (filas del reporte)
- regSemana   = los de la semana actual (lunes 00:00 Honduras)
- activaciones/actSemana/volumen = de d["activaciones"] del mes (Starter 50, Classic 200, Premium 500)
- La app muestra Registros inCruises = registros + activaciones.
- SOLO SUMA VOLUMEN NUEVO DEL MES: no cuentan (ni activación ni volumen) las que traen
  ps:1 (ya era miembro y solo pasó a socio) o sc:1 (solo activó el código de socio, correo "Partner" sin membresía).
  sc:1 se pone al pasar la activación (tipo del correo). ps:1 se marca solo si su huella (ek/wk) está en
  data/red.enc como miembro o socio (t c/s). Si está como pendiente de ahorro (t p) solo avisa "REVISAR".
  Confirmar cada mes con el reporte de Compensación de inCruises (activaciones y volumen totales).
"""
import re, json, sys, unicodedata, datetime

def n(t):
    t = unicodedata.normalize('NFD', str(t or '')).encode('ascii', 'ignore').decode().lower()
    return ' '.join(t.split())

def same(a, b):
    a, b = n(a), n(b)
    if not a or not b: return False
    if a == b: return True
    A, B = a.split(), b.split(); S, L = (A, B) if len(A) <= len(B) else (B, A)
    return len(S) >= 2 and all(w in L for w in S)

def slug(t): return re.sub(r'-+', '-', re.sub(r'[^a-z0-9]', '-', n(t))).strip('-')
def bonito(t): return ' '.join(w[:1].upper() + w[1:] for w in str(t).split())

reg_file = sys.argv[1]
nuevas = json.loads(sys.argv[2]) if len(sys.argv) > 2 else []
d = json.load(open('data/team.json'))
cfg = d['config']

UNIR0 = cfg.get('rankingUnir', {})
for a in nuevas:
    for k, v in UNIR0.items():  # la cuenta unida se guarda ya con el nombre de quien la trabaja (el banner y los avisos dicen ese nombre)
        if same(k, a.get('patrocinador', '')): a['patrocinador'] = v
    if not any(same(x['socio'], a['socio']) for x in d['activaciones']):
        a.setdefault('fuente', 'gmail'); a.setdefault('id', slug(a['socio'])); d['activaciones'].append(a)
        if a['fecha'] > cfg.get('activacionesCorte', ''): cfg['activacionesCorte'] = a['fecha']

# Volumen nuevo: marca ps:1 a quien ya estaba en la red de inCruises como miembro/socio (data/red.enc)
def _red():
    try:
        import base64, os as _o
        from cryptography.hazmat.primitives.ciphers.aead import AESGCM
        k = open('/home/claude/.evk').read().strip(); k = base64.urlsafe_b64decode(k + '=' * (-len(k) % 4))
        raw = base64.b64decode(open('data/red.enc').read().strip())
        return json.loads(AESGCM(k).decrypt(raw[:12], raw[12:], None)).get('rows', [])
    except Exception as x:
        print('red.enc no disponible:', x); return []
_mes = datetime.datetime.now(datetime.UTC).strftime('%Y-%m')
_pend = [a for a in d['activaciones'] if a.get('fecha', '')[:7] >= _mes and not a.get('ps') and not a.get('sc') and not a.get('rv') and (a.get('ek') or a.get('wk'))]
if _pend:
    R = _red()
    if R:
        RK = {}
        for r in R:
            for h in (r.get('ek'), r.get('wk')):
                if h: RK.setdefault(h, r)
        for a in _pend:
            r = RK.get(a.get('ek')) or RK.get(a.get('wk'))
            if not r: a['rv'] = 1; continue
            if r.get('t') in ('c', 's'):
                a['ps'] = 1; a['rv'] = 1; print('YA ERA MIEMBRO (no suma volumen):', a['socio'])
            else:
                print('REVISAR con el reporte de Compensación:', a['socio'], '· en la red como', r.get('t'))
NUEVO = lambda a: not a.get('ps') and not a.get('sc')

VOL = {"Starter": 50, "Classic": 200, "Premium": 500}
# config.rankingUnir {"Nombre en inCruises": "Nombre al que se suma"}: cuentas que trabaja otra persona (ej. la cuenta de la esposa de Edwin suma a Edwin)
UNIR = cfg.get('rankingUnir', {})
def un(nm):
    for k, v in UNIR.items():
        if same(k, nm): return v
    return nm
import os
_fz = os.environ.get('RK_NOW') or cfg.get('rankingCongelado')  # config.rankingCongelado (UTC) congela el mes hasta que el admin lo quite
now = datetime.datetime.fromisoformat(_fz.rstrip('Z')) if _fz else datetime.datetime.now(datetime.UTC).replace(tzinfo=None)  # RK_NOW=AAAA-MM-DDTHH:MM:SS (UTC) congela la fecha (cierre de mes)
mes0 = now.strftime('%Y-%m-01T00:00:00')
hn = now - datetime.timedelta(hours=6)
wk0 = (hn - datetime.timedelta(days=hn.weekday())).replace(hour=0, minute=0, second=0, microsecond=0) + datetime.timedelta(hours=6)
P = lambda s: datetime.datetime.fromisoformat(s.replace('Z', '')[:19])

# registros gratis por patrocinador (agrupado por sponsor_id)
G = {}
for ln in open(reg_file, encoding='utf-8'):
    ln = ln.strip()
    if not ln: continue
    sid, nom, f = [x.strip() for x in ln.split('|')]
    if f < mes0: continue
    nom = un(nom); sid = 'u:' + slug(nom) if UNIR and nom in UNIR.values() else sid
    g = G.setdefault(sid, {'nom': nom, 'r': 0, 'w': 0}); g['r'] += 1
    if P(f) >= wk0: g['w'] += 1

old = d['ranking']; new = []; used = set()

# Cambio de mes: guarda los calificados del mes que cerró (200+ pts) para el flyer "Líder del mes"
# y actualiza las etiquetas del mes (calificacion.mes y rankingMes).
MESES = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre']
lab = lambda k: MESES[int(k[5:7]) - 1].capitalize() + ' ' + k[:4]
mesK = mes0[:7]
if cfg.get('lcMesClave') and cfg['lcMesClave'] != mesK:
    cfg['lcCierre'] = {'mes': lab(cfg['lcMesClave']), 'hasta': (now + datetime.timedelta(days=7)).strftime('%Y-%m-%dT%H:%M:%SZ'),
                       'lista': [{'n': e['nombre'], 'v': e.get('volumen', 0)} for e in old if e.get('volumen', 0) >= 200]}
    cfg['rankingMes'] = lab(mesK)
    cfg.setdefault('calificacion', {})['mes'] = lab(mesK)
cfg['lcMesClave'] = mesK
def put(e):
    sid = slug(e['nombre'])
    while sid in used: sid += '-2'
    used.add(sid); e['id'] = sid; new.append(e)

for g in G.values():
    o = next((y for y in old if same(y['nombre'], g['nom'])), None)
    e = dict(o) if o else {"nombre": bonito(g['nom']), "linea": "", "presentaciones": 0, "presSemana": 0}
    dup = next((x for x in new if same(x['nombre'], e['nombre'])), None)
    if dup: dup['registros'] += g['r']; dup['regSemana'] += g['w']; continue
    e['registros'] = g['r']; e['regSemana'] = g['w']; put(e)

acts = [dict(a, patrocinador=un(a['patrocinador'])) for a in d['activaciones'] if a['fecha'] >= mes0 and NUEVO(a)]
for a in acts:
    if not any(same(e['nombre'], a['patrocinador']) for e in new):
        o = next((y for y in old if same(y['nombre'], a['patrocinador'])), None)
        e = dict(o) if o else {"nombre": a['patrocinador'], "linea": "", "presentaciones": 0, "presSemana": 0}
        e['registros'] = 0; e['regSemana'] = 0; put(e)

for e in new:
    mine = [a for a in acts if same(a['patrocinador'], e['nombre'])]
    e['activaciones'] = len(mine); e['volumen'] = sum(VOL.get(a['paquete'], 0) for a in mine)
    e['actSemana'] = len([a for a in mine if P(a['fecha']) >= wk0])
cambio = json.dumps(new, sort_keys=True) != json.dumps(old, sort_keys=True) or bool(nuevas)
d['ranking'] = new

for L in d.get('liderazgo', []):
    names = [L['nombre']] + [z.strip() for z in str(L.get('nombreRanking') or '').split('|') if z.strip()]
    L['presentaciones'] = sum(e['registros'] for e in new if any(same(e['nombre'], k) for k in names))
    # volumen del mes = el mayor entre la hoja Calificados (volumenHoja) y las activaciones del ranking
    rv = sum(e['volumen'] for e in new if any(same(e['nombre'], k) for k in names))
    if 'volumenHoja' not in L: L['volumenHoja'] = int(L.get('volumen') or 0)
    L['volumen'] = max(int(L.get('volumenHoja') or 0), rv)

# Sistema de liderazgo automático (5 nov, Edwin): quien llega a 200+ (Líder) o 500+ (Líder Espartano) en el mes
# y no está en d["liderazgo"] entra solo (auto = mes). Quien ya entró solo sube su ptsBase si sube de nivel.
# config.lzNoAuto = nombres que nunca se agregan (Edwin). Imprime NUEVO EN SISTEMA para escribirlo en la hoja Calificados.
NOAUTO = cfg.setdefault('lzNoAuto', ["Edwin García Go", "Edwin Alexander Garcia Gomez"])
LZ = d.setdefault('liderazgo', [])
def _lz_de(nm):
    for L in LZ:
        ns = [L['nombre']] + [z.strip() for z in str(L.get('nombreRanking') or '').split('|') if z.strip()]
        if any(same(k, nm) for k in ns): return L
    return None
for e in new:
    v = int(e.get('volumen') or 0)
    if v < 200 or any(same(x, e['nombre']) for x in NOAUTO): continue
    L = _lz_de(e['nombre'])
    if L is None:
        nb = bonito(e['nombre']); LZ.append({"nombre": nb, "nombreRanking": e['nombre'], "rango": "", "linea": "", "meta": 500, "nuevos": 0, "presentaciones": 0,
            "volumen": v, "volumenDetalle": "", "id": slug(nb), "volumenHoja": 0, "ptsBase": v, "auto": mesK})
        cambio = True; print('NUEVO EN SISTEMA:', nb, '|', e['nombre'], '|', v, 'pts')
    elif L.get('auto') == mesK and v > int(L.get('ptsBase') or 0):
        L['ptsBase'] = v; cambio = True; print('SUBE EN SISTEMA:', L['nombre'], v)

if cambio: cfg['rankingActualizado'] = (now - datetime.timedelta(hours=6)).strftime('%Y-%m-%dT%H:%M:00-06:00')
cfg['rankingFuente'] = 'drive-csv'
json.dump(d, open('data/team.json', 'w'), ensure_ascii=False, indent=1)
print('volumen nuevo del mes', sum(VOL.get(a['paquete'], 0) for a in acts), '· sin volumen (ps/sc):', [a['socio'] for a in d['activaciones'] if a['fecha'] >= mes0 and not NUEVO(a)])
print('socios', len(new), 'registros', sum(e['registros'] for e in new), 'semana', sum(e['regSemana'] for e in new), 'activaciones mes', len(acts))
print(sorted([(e['nombre'], e['registros']) for e in new], key=lambda x: -x[1])[:8])
