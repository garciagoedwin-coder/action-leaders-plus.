#!/usr/bin/env python3
"""Reto de invitados a un evento: cuenta invitados por socio y lo guarda en d["config"]["evento"].

Uso:  python3 tools/evento.py EVENTO.txt
EVENTO.txt: una línea por respuesta del formulario, "dd/mm/aaaa h:mm:ss|Invitado por"
(solo esas dos columnas; nunca correos ni teléfonos de los invitados).
Los datos fijos del evento (titulo, fecha, lugar, meta) se ponen una vez en config.evento.
config.evento.alias: {"como lo escribieron": "nombre correcto"} para casos que el ajuste automático no une.
"""
import re, sys, json, unicodedata, datetime

def n(t):
    t = unicodedata.normalize('NFD', str(t or '')).encode('ascii', 'ignore').decode().lower()
    return ' '.join(re.sub(r'[^a-z ]', ' ', t).split())

def lev(a, b):
    if abs(len(a) - len(b)) > 2: return 9
    p = list(range(len(b) + 1))
    for i, ca in enumerate(a, 1):
        c = [i]
        for j, cb in enumerate(b, 1): c.append(min(p[j] + 1, c[j - 1] + 1, p[j - 1] + (ca != cb)))
        p = c
    return p[-1]

def wsim(x, y):  # palabra parecida (Eric/Erick, Rodriguez/Rodríguez)
    return x == y or (min(len(x), len(y)) >= 4 and lev(x, y) <= 1)

def parecido(a, b):
    A, B = n(a).split(), n(b).split()
    if not A or not B: return False
    S, L = (A, B) if len(A) <= len(B) else (B, A)
    if len(S) == 1: return False
    return all(any(wsim(w, v) for v in L) for w in S)

d = json.load(open('data/team.json'))
ev = d['config'].setdefault('evento', {})
alias = {n(k): v for k, v in (ev.get('alias') or {}).items()}
equipo = [x['nombre'] for x in d.get('ranking', [])] + [x['nombre'] for x in d.get('liderazgo', [])]
IGN = {'socio', 'otro', 'ninguno', 'nadie', 'na', 'no'}

filas = []
for ln in open(sys.argv[1], encoding='utf-8'):
    ln = ln.rstrip('\n')
    if '|' not in ln: continue
    f, quien = ln.split('|', 1); quien = ' '.join(quien.split())
    try: t = datetime.datetime.strptime(f.strip(), '%d/%m/%Y %H:%M:%S')
    except ValueError: t = None
    filas.append((t, quien))

G = []  # grupos: {nom, formas{}, n, hoy}
hoy = (datetime.datetime.now(datetime.UTC) - datetime.timedelta(hours=6)).date()
sin = 0
for t, q in filas:
    k = n(q)
    if not k or k in IGN: sin += 1; continue
    q = alias.get(k, q)
    g = next((g for g in G if n(g['nom']) == n(q) or parecido(g['nom'], q) or any(parecido(f, q) for f in g['formas'])), None)
    if not g: g = {'nom': q, 'formas': {}, 'n': 0, 'hoy': 0}; G.append(g)
    g['formas'][q] = g['formas'].get(q, 0) + 1; g['n'] += 1
    if t and t.date() == hoy: g['hoy'] += 1

# un solo nombre ("Joel", "Francisco"): se une al único grupo cuyo primer nombre coincide
for g in [g for g in G if len(n(g['nom']).split()) == 1]:
    c = [h for h in G if h is not g and len(n(h['nom']).split()) > 1 and wsim(n(h['nom']).split()[0], n(g['nom']))]
    if len(c) == 1:
        c[0]['n'] += g['n']; c[0]['hoy'] += g['hoy']; c[0]['formas'].update(g['formas']); G.remove(g)

for g in G:  # nombre bonito: el del equipo si coincide, si no la forma más usada
    m = next((e for e in equipo if parecido(e, g['nom']) or any(parecido(e, f) for f in g['formas'])), None)
    base = m or max(g['formas'], key=lambda f: (len(f.split()), g['formas'][f]))
    g['nom'] = m or ' '.join(w[:1].upper() + w[1:].lower() for w in base.split())

top = sorted(G, key=lambda g: (-g['n'], g['nom']))
nuevo = {'total': len(filas), 'hoy': sum(1 for t, _ in filas if t and t.date() == hoy), 'sinNombre': sin,
         'top': [{'nombre': g['nom'], 'n': g['n'], 'hoy': g['hoy']} for g in top]}
cambio = any(ev.get(k) != v for k, v in nuevo.items())
ev.update(nuevo)
if cambio: ev['actualizado'] = (datetime.datetime.now(datetime.UTC) - datetime.timedelta(hours=6)).strftime('%Y-%m-%dT%H:%M:00-06:00')
json.dump(d, open('data/team.json', 'w'), ensure_ascii=False, indent=1)
print('total', nuevo['total'], 'hoy', nuevo['hoy'], 'sin nombre', sin)
for g in top: print(g['n'], g['nom'], '<-', list(g['formas']))
