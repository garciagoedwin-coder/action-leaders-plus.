#!/usr/bin/env python3
"""Ahorro pendiente: mantiene la lista de socios con ahorro (membresía) pendiente.

La lista completa (nombres, patrocinador, plan, huellas) va CIFRADA en data/ahorro.enc (AES-GCM,
misma clave del evento: /home/claude/.evk y Firestore evento/sps26/priv/llave; solo admin la abre).
En team.json → config.ahorro solo van huellas parciales (6 hex de FNV-1a) de email y WhatsApp,
sin nombres ni datos legibles. NUNCA se guardan correos ni teléfonos en claro.

Usos:
  python3 tools/ahorro.py csv REPORTE.csv [LIDERES.txt] [GRACIA_ISO]
        Reemplaza la lista con el reporte de inCruises (columnas first_name, last_name, email,
        mobile_phone, sponsor_name, plan_name, level, invoices_due_date, whatsapp_url).
        GRACIA_ISO por defecto = fecha de vencimiento de cada factura.
  python3 tools/ahorro.py falla 'email|Nombre|fecha_correo_ISO|plan|patrocinador'
        Correo "Tu pago de Membresía inCruises no se realizó con éxito." → pendiente, gracia 5 días.
  python3 tools/ahorro.py pago 'email o nombre completo'
        Correo de pago exitoso → sale de la lista.
  python3 tools/ahorro.py lideres LIDERES.txt
        Enlaza líderes (Nombre|email|teléfono de la pestaña Calificados; el archivo NO va al repo).
  python3 tools/ahorro.py ver        (resumen sin datos personales)
"""
import sys, json, base64, os, re, unicodedata, datetime, csv

from cryptography.hazmat.primitives.ciphers.aead import AESGCM

KEYF = '/home/claude/.evk'
ENC = 'data/ahorro.enc'
TEAM = 'data/team.json'
INI = '2026-11-01T06:00:00Z'   # nadie se bloquea antes del 1 de noviembre (hora de Honduras)


def fnv(s):
    h = 0x811c9dc5
    for b in ('alp|' + s).encode():
        h ^= b
        h = (h * 0x01000193) & 0xffffffff
    return format(h, '08x')[:6]


def ke(e):
    e = str(e or '').strip().lower()
    return fnv('e:' + e) if '@' in e else None


def kw(w):
    d = re.sub(r'\D', '', str(w or ''))
    return fnv('w:' + d[-8:]) if len(d) >= 8 else None


def kid(i): return fnv('i:' + i)


def nrm(t):
    t = unicodedata.normalize('NFD', str(t or '')).encode('ascii', 'ignore').decode().lower()
    return ' '.join(re.sub(r'[^a-z ]', ' ', t).split())


def bonito(t): return ' '.join(w[:1].upper() + w[1:].lower() for w in str(t).split())


def key():
    k = open(KEYF).read().strip()
    return base64.urlsafe_b64decode(k + '=' * (-len(k) % 4))


def cargar():
    if not os.path.exists(ENC):
        return {'rows': [], 'lid': {}}
    raw = base64.b64decode(open(ENC).read().strip())
    return json.loads(AESGCM(key()).decrypt(raw[:12], raw[12:], None))


def iso(d): return d.astimezone(datetime.timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')


def ahora(): return datetime.datetime.now(datetime.timezone.utc)


def guardar(st):
    st['v'] = iso(ahora())
    raw = json.dumps(st, ensure_ascii=False, sort_keys=True).encode()
    iv = os.urandom(12)
    open(ENC, 'w').write(base64.b64encode(iv + AESGCM(key()).encrypt(iv, raw, None)).decode())
    # huellas públicas: {huella: gracia}
    K = {}
    for r in st['rows']:
        for h in r['k']:
            if h:
                K[h] = min(K.get(h, r['g']), r['g'])
    li = sorted({kid(i) for i, hs in st['lid'].items() if any(h in K for h in hs if h)})
    t = json.load(open(TEAM, encoding='utf-8'))
    t.setdefault('config', {})['ahorro'] = {'v': st['v'], 'ini': INI, 'k': dict(sorted(K.items())), 'li': li}
    json.dump(t, open(TEAM, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    resumen(st)


def resumen(st):
    n = ahora()
    vence = sum(1 for r in st['rows'] if r['g'] <= iso(n))
    lids = sum(1 for i, hs in st['lid'].items() if any(h in {x for r in st['rows'] for x in r['k']} for h in hs if h))
    print(f"pendientes {len(st['rows'])} · gracia vencida {vence} · líderes pendientes {lids}")


def fecha(s):
    s = str(s).strip().replace(' ', 'T')
    if s.endswith('Z'): s = s[:-1] + '+00:00'
    d = datetime.datetime.fromisoformat(s)
    return d if d.tzinfo else d.replace(tzinfo=datetime.timezone.utc)


def lideres(st, f):
    for ln in open(f, encoding='utf-8'):
        p = [x.strip() for x in ln.rstrip('\n').split('|')]
        if not p or not p[0]: continue
        i = re.sub(r'[^a-z0-9]+', '-', nrm(p[0])).strip('-')
        st['lid'][i] = [ke(p[1] if len(p) > 1 else ''), kw(p[2] if len(p) > 2 else '')]


def main():
    a = sys.argv[1:]
    if not a: print(__doc__); return
    st = cargar()
    st.setdefault('rows', []); st.setdefault('lid', {})
    if a[0] == 'csv':
        rows = []
        for x in csv.DictReader(open(a[1], encoding='utf-8-sig')):
            due = fecha(x['invoices_due_date'])
            g = fecha(a[3]) if len(a) > 3 else due
            w = x.get('whatsapp_url', '').split('phone=')[-1] or x.get('mobile_phone', '')
            rows.append({'n': bonito(x['first_name'] + ' ' + x['last_name']), 's': bonito(x.get('sponsor_name', '')),
                         'p': x.get('plan_name', '').replace(' Member', ''), 'lv': x.get('level', ''),
                         'k': [ke(x['email']), kw(w), kw(x.get('mobile_phone', ''))], 'g': iso(g), 'f': 'reporte'})
        st['rows'] = rows
        if len(a) > 2 and a[2] and os.path.exists(a[2]): lideres(st, a[2])
    elif a[0] == 'falla':
        e, nom, f, plan, sp = (a[1].split('|') + [''] * 5)[:5]
        h = ke(e)
        g = iso(fecha(f) + datetime.timedelta(days=5))
        r = next((r for r in st['rows'] if h and h in r['k']), None)
        if r: r['g'] = min(r['g'], g) if r.get('f') == 'correo' else g; r['f'] = 'correo'
        else: st['rows'].append({'n': bonito(nom), 's': bonito(sp), 'p': plan, 'lv': '', 'k': [h, None, None], 'g': g, 'f': 'correo'})
    elif a[0] == 'pago':
        q = a[1].strip(); h = ke(q)
        antes = len(st['rows'])
        st['rows'] = [r for r in st['rows'] if not ((h and h in r['k']) or (not h and nrm(r['n']) == nrm(q)))]
        print('quitados', antes - len(st['rows']))
    elif a[0] == 'lideres':
        lideres(st, a[1])
    elif a[0] == 'ver':
        resumen(st); return
    guardar(st)


if __name__ == '__main__':
    main()
