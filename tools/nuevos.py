#!/usr/bin/env python3
"""Contactos de socios nuevos (correo y WhatsApp) — SOLO ADMIN, CIFRADOS.

Se guardan en data/nuevos.enc (AES-GCM, misma clave que ahorro.enc: /home/claude/.evk y
Firestore evento/sps26/priv/llave). La app los descifra solo en el teléfono del admin
(Equipo › Mi equipo › Socios nuevos del mes › 📇 Contacto). NUNCA van en team.json.

Usos:
  python3 tools/nuevos.py add 'id|email|whatsapp'    (id = el id de la activación en team.json)
  python3 tools/nuevos.py ver                         (cuántos hay, sin datos personales)
  python3 tools/nuevos.py limpiar                     (quita los de activaciones de hace más de 90 días)
"""
import sys, json, base64, os, re, datetime

from cryptography.hazmat.primitives.ciphers.aead import AESGCM

KEYF = os.environ.get('EVK_FILE') or '/home/claude/.evk'  # en GitHub (buzón) la clave llega por EVK_FILE
ENC = 'data/nuevos.enc'
TEAM = 'data/team.json'


def key():
    k = open(KEYF).read().strip()
    return base64.urlsafe_b64decode(k + '=' * (-len(k) % 4))


def cargar():
    if not os.path.exists(ENC):
        return {'c': {}}
    raw = base64.b64decode(open(ENC).read().strip())
    return json.loads(AESGCM(key()).decrypt(raw[:12], raw[12:], None))


def guardar(st):
    st['v'] = datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')
    raw = json.dumps(st, ensure_ascii=False, sort_keys=True).encode()
    iv = os.urandom(12)
    open(ENC, 'w').write(base64.b64encode(iv + AESGCM(key()).encrypt(iv, raw, None)).decode())
    print('contactos guardados:', len(st['c']))


def main():
    a = sys.argv[1:]
    if not a:
        print(__doc__); return
    st = cargar(); st.setdefault('c', {})
    if a[0] == 'add':
        for arg in a[1:]:
            i, e, w = (arg.split('|') + ['', '', ''])[:3]
            i = i.strip()
            if not i: continue
            e = e.strip().lower() if '@' in e else ''
            w = re.sub(r'\D', '', w)
            if not e and len(w) < 8: continue
            c = st['c'].get(i, {})
            if e: c['e'] = e
            if len(w) >= 8: c['w'] = w
            st['c'][i] = c
        guardar(st)
    elif a[0] == 'limpiar':
        t = json.load(open(TEAM, encoding='utf-8'))
        lim = (datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(days=90)).strftime('%Y-%m-%dT%H:%M:%SZ')
        vivos = {x.get('id') for x in t.get('activaciones', []) if x.get('fecha', '') >= lim}
        st['c'] = {k: v for k, v in st['c'].items() if k in vivos}
        guardar(st)
    elif a[0] == 'ver':
        print('contactos:', len(st['c']), '· actualizado', st.get('v', '-'))


if __name__ == '__main__':
    main()
