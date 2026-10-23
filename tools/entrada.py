#!/usr/bin/env python3
"""Modo entrada del evento: arma la lista cifrada data/entrada.enc (AES-GCM).

Uso:  python3 tools/entrada.py SOCIOS.txt MAPA.json CLAVE.txt
SOCIOS.txt: "NO|Nombre|Líder|Acceso/Pendiente|PREMIUM/CLASSIC" (pestaña SOCIOS EVENTO).
MAPA.json:  [{"n": invitado, "s": socio que lo invitó}] (lo genera tools/evento.py con EV_MAP=...).
CLAVE.txt:  clave AES de 32 bytes en base64url. La app la lee de Firestore evento/sps26/priv/llave
            (solo admin y Recepción). El archivo cifrado sí va al repo público; la lista en claro NUNCA.
Sin correos ni teléfonos.
"""
import sys, json, hashlib, base64, os, unicodedata, re, datetime
from cryptography.hazmat.primitives.ciphers.aead import AESGCM

def n(t):
    t = unicodedata.normalize('NFD', str(t or '')).encode('ascii', 'ignore').decode().lower()
    return ' '.join(re.sub(r'[^a-z ]', ' ', t).split())
def bonito(t): return ' '.join(w[:1].upper() + w[1:].lower() for w in str(t).split())
hid = lambda p, x: p + hashlib.sha1(n(x).encode()).hexdigest()[:10]

socios, vistos = [], set()
for ln in open(sys.argv[1], encoding='utf-8'):
    p = [x.strip() for x in ln.rstrip('\n').split('|')]
    if len(p) < 5 or not p[1]: continue
    i = hid('s', p[1])
    if i in vistos: continue
    vistos.add(i)
    socios.append({'id': i, 'n': bonito(p[1]), 'l': bonito(p[2]), 'a': n(p[3]) == 'acceso', 'tk': 'CLASSIC' if 'classic' in n(p[4]) else 'PREMIUM'})

inv, vi = [], set()
for x in json.load(open(sys.argv[2], encoding='utf-8')):
    i = hid('i', x['n'])
    if i in vi or not n(x['n']): continue
    vi.add(i); inv.append({'id': i, 'n': bonito(x['n']), 's': x['s']})

def lev(a, b):
    if abs(len(a) - len(b)) > 2: return 9
    p = list(range(len(b) + 1))
    for i, ca in enumerate(a, 1):
        c = [i]
        for j, cb in enumerate(b, 1): c.append(min(p[j] + 1, c[j - 1] + 1, p[j - 1] + (ca != cb)))
        p = c
    return p[-1]
def wsim(x, y): return x == y or (min(len(x), len(y)) >= 4 and lev(x, y) <= 1)
def parecido(a, b):
    A, B = n(a).split(), n(b).split()
    if len(A) < 2 or len(B) < 2: return n(a) == n(b)
    S, L = (A, B) if len(A) <= len(B) else (B, A)
    return all(any(wsim(w, v) for v in L) for w in S)
# un solo nombre por socio: el del reto (el mismo que usa el ranking) y luego los socios que no estén ya
grupos = sorted({x['s'] for x in inv if x['s']}, key=n)
soc = grupos + [s['n'] for s in socios if not any(parecido(g, s['n']) for g in grupos)]
soc = sorted(dict.fromkeys(soc), key=n)
data = {'v': datetime.datetime.now(datetime.UTC).strftime('%Y-%m-%dT%H:%M:%SZ'), 'socios': socios, 'inv': inv, 'soc': soc}
raw = json.dumps(data, ensure_ascii=False, sort_keys=True).encode()
k = open(sys.argv[3]).read().strip(); k = base64.urlsafe_b64decode(k + '=' * (-len(k) % 4))
# no reescribir si el contenido (sin la fecha) no cambió
dig = hashlib.sha256(json.dumps({**data, 'v': ''}, ensure_ascii=False, sort_keys=True).encode()).hexdigest()
old = json.load(open('data/entrada.json')) if os.path.exists('data/entrada.json') else {}
if old.get('h') != dig:
    iv = os.urandom(12)
    open('data/entrada.enc', 'w').write(base64.b64encode(iv + AESGCM(k).encrypt(iv, raw, None)).decode())
    json.dump({'h': dig, 'v': data['v']}, open('data/entrada.json', 'w'))
    print('actualizado')
print('socios', len(socios), 'acceso', sum(s['a'] for s in socios), 'invitados', len(inv), 'sin socio', sum(1 for x in inv if not x['s']))
