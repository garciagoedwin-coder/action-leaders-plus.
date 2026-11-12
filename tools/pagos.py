#!/usr/bin/env python3
"""Pagos de ahorro del equipo (correos «Miembro del Equipo Pagado» / «Alguien al que referiste pagó…») — CIFRADOS.

Sirven para calcular el nivel Team Leader (tools/tl.py): quién pagó su ahorro en los últimos 30 días.
Se guardan en data/pagos.enc (AES-GCM, misma clave que ahorro.enc). Solo nombre y fecha; NUNCA correos ni teléfonos.

  python3 tools/pagos.py add 'Nombre|2026-11-12T04:05:30Z' ...   (repetidos = mismo nombre y mismo día → se ignoran)
  python3 tools/pagos.py ver                                       (conteos, sin nombres)
"""
import sys, os, json, base64, re, unicodedata, datetime
sys.path.insert(0, os.path.dirname(__file__))
import ahorro as A
from cryptography.hazmat.primitives.ciphers.aead import AESGCM

ENC = 'data/pagos.enc'
DIAS = 75  # se guardan 75 días (la ventana del cálculo es de 30)


def nrm(s):
    s = unicodedata.normalize('NFD', str(s or '').lower())
    return ' '.join(re.sub(r'[^a-z ]', ' ', ''.join(c for c in s if unicodedata.category(c) != 'Mn')).split())


def cargar():
    if not os.path.exists(ENC):
        return {'p': [], 'desde': None}
    raw = base64.b64decode(open(ENC).read().strip())
    return json.loads(AESGCM(A.key()).decrypt(raw[:12], raw[12:], None))


def guardar(st):
    raw = json.dumps(st, ensure_ascii=False, sort_keys=True).encode()
    iv = os.urandom(12)
    open(ENC, 'w').write(base64.b64encode(iv + AESGCM(A.key()).encrypt(iv, raw, None)).decode())


def main():
    a = sys.argv[1:]
    if not a: print(__doc__); return
    st = cargar()
    if a[0] == 'ver':
        print('pagos guardados:', len(st['p']), '· desde', st.get('desde')); return
    if a[0] != 'add': print(__doc__); return
    ya = {(nrm(x['n']), x['f'][:10]) for x in st['p']}
    n = 0
    for arg in a[1:]:
        nom, _, f = arg.partition('|')
        nom, f = A.bonito(nom.strip()), f.strip()
        if not nom or not re.match(r'\d{4}-\d{2}-\d{2}', f): continue
        k = (nrm(nom), f[:10])
        if k in ya: continue
        ya.add(k); st['p'].append({'n': nom, 'f': f}); n += 1
        if not st.get('desde') or f < st['desde']: st['desde'] = f
    lim = (datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(days=DIAS)).strftime('%Y-%m-%dT%H:%M:%SZ')
    antes = len(st['p'])
    st['p'] = [x for x in st['p'] if x['f'] >= lim]
    if n or len(st['p']) != antes:
        st['p'].sort(key=lambda x: x['f'])
        guardar(st)
    print('pagos nuevos:', n, '· total:', len(st['p']))


if __name__ == '__main__':
    main()
