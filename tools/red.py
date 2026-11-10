#!/usr/bin/env python3
"""Red de inCruises (cierre de mes): cruza los reportes y deja la base CIFRADA en data/red.enc.

  python3 tools/red.py SOCIOS.csv MIEMBROS.csv PENDIENTES.csv ['{"sponsor_id":"email",...}'] [SOLO_SOCIOS.csv]
  ("-" en SOCIOS o MIEMBROS = reusar el de la carga anterior, que va guardado CIFRADO en red.enc; los arreglos
   de patrocinador y la lista solo-socios también se recuerdan. Lo corre solo .github/workflows/red.yml)

- SOLO_SOCIOS = todos los que tienen código de socio; los que no están en MIEMBROS ni PENDIENTES
  son socios sin membresía (t "x"). Un pendiente que está ahí lleva ps=1 (es socio).
- MIEMBROS = todos los miembros al día. SOCIOS = los que además son socios (hacen el negocio).
  Miembro que no está en SOCIOS → cliente. PENDIENTES = ahorro pendiente (no salen en MIEMBROS).
- Cada persona lleva la cadena de patrocinadores hacia arriba (anc) para saber quién la ve.
  El sponsor_id se enlaza por nombre y nivel; el 4.º argumento corrige los dudosos.
- NUNCA se guardan correos ni teléfonos en el repo: todo va cifrado (misma clave que ahorro.enc).
  La app del admin lo descifra y lo sube a Firestore (colección red) con quién puede verlo.
"""
import sys, csv, json, os, base64, re, unicodedata
sys.path.insert(0, os.path.dirname(__file__))
import ahorro as A
from cryptography.hazmat.primitives.ciphers.aead import AESGCM

ENC = 'data/red.enc'


def toks(s):
    s = unicodedata.normalize('NFD', str(s or '').lower())
    s = ''.join(c for c in s if unicodedata.category(c) != 'Mn')
    return set(re.sub(r'[^a-z ]', ' ', s).split())


def pk(email):
    h = 0x811c9dc5
    for b in ('alp|p:' + email.strip().lower()).encode():
        h ^= b; h = (h * 0x01000193) & 0xffffffff
    return format(h, '08x')


def wa(x):
    w = (x.get('whatsapp_url') or '').split('phone=')[-1]
    return re.sub(r'\D', '', w or x.get('mobile_phone', ''))


def main():
    a = sys.argv[1:]
    if len(a) < 3: print(__doc__); return
    L = lambda f: list(csv.DictReader(open(f, encoding='utf-8-sig')))
    # memoria cifrada del reporte anterior (lista "solo socios" y arreglos de patrocinador)
    st0 = {}
    if os.path.exists(ENC):
        try:
            raw0 = base64.b64decode(open(ENC).read().strip())
            st0 = json.loads(AESGCM(A.key()).decrypt(raw0[:12], raw0[12:], None))
        except Exception as ex: print('aviso: no se pudo leer el red.enc anterior', type(ex).__name__)
    fix = dict(st0.get('fix') or {})
    if len(a) > 3 and a[3]: fix.update(json.loads(a[3]))
    ss = L(a[4]) if len(a) > 4 and a[4] else (st0.get('ss') or [])
    CAMPOS = ('level', 'first_name', 'last_name', 'email', 'mobile_phone', 'sponsor_name', 'sponsor_id', 'plan_name', 'whatsapp_url',
              'invoices_due_date', 'invoices_expiration_date')
    mini = lambda R: [{c: x.get(c, '') for c in CAMPOS if c in x} for x in R]
    # "-" = usar el mismo reporte de la carga anterior (p. ej. solo llegaron los pendientes de la semana)
    Lx = lambda i, k: ((st0.get('raw') or {}).get(k) or []) if a[i] == '-' else mini(L(a[i]))
    so, mi, pe = Lx(0, 'so'), Lx(1, 'mi'), Lx(2, 'pe')
    if a[1] == '-':  # los que estaban pendientes y ya no salen = pagaron → vuelven a miembros al día
        ya = {x['email'].strip().lower() for x in pe}
        mi = mi + [{c: v for c, v in x.items() if not c.startswith('invoices_')} for x in ((st0.get('raw') or {}).get('pe') or []) if x['email'].strip().lower() not in ya]
    if not so or not mi: print('Falta el reporte de socios o de miembros activos (y no hay uno anterior).'); sys.exit(2)
    ss = mini(ss)
    em = lambda x: x['email'].strip().lower()
    soc = {em(x) for x in so} | {em(x) for x in ss}
    P = {}
    for x in mi + so:
        P.setdefault(em(x), dict(x, _t='s' if em(x) in soc else 'c'))
    for x in pe:
        P[em(x)] = dict(x, _t='p')
    for x in ss:
        P.setdefault(em(x), dict(x, _t='x'))
    # sponsor_id → persona
    nom, lev = {}, {}
    for x in P.values():
        nom.setdefault(x['sponsor_id'], set()).add(x['sponsor_name'].strip())
        lev[x['sponsor_id']] = int(x['level']) - 1
    sid = {}
    dud = []
    for i, ns in nom.items():
        if i in fix:
            sid[i] = fix[i].strip().lower() if fix[i] else None; continue
        if lev[i] == 0: sid[i] = 'ROOT'; continue
        c = []
        for e, x in P.items():
            if int(x['level']) != lev[i]: continue
            t = toks(x['first_name'] + ' ' + x['last_name'])
            s = max(len(t & toks(n)) / max(1, len(toks(n))) for n in ns)
            if s >= .5: c.append((s, e))
        c.sort(reverse=True)
        if c and (len(c) == 1 or c[0][0] > c[1][0]): sid[i] = c[0][1]
        else:
            sid[i] = None
            dud.append({'id': i, 'nombre': sorted(ns)[0], 'nivel': lev[i], 'opciones': len(c)})
    rows = []
    for e, x in P.items():
        anc, cur, seen = [], x, set()
        while cur is not None:
            s = sid.get(cur['sponsor_id'])
            if s == 'ROOT' or s is None:
                if s is None and int(cur['level']) == 1: pass
                break
            if s in seen or s not in P: break
            seen.add(s); anc.append(pk(s)); cur = P[s]
        r = {'k': pk(e), 'n': A.bonito(x['first_name'] + ' ' + x['last_name']), 't': x['_t'],
             'pl': x.get('plan_name', '').replace(' Member', ''), 'lv': int(x['level']),
             'sp': A.bonito(x.get('sponsor_name', '')), 'w': wa(x), 'anc': anc,
             'ek': A.ke(e), 'wk': A.kw(wa(x))}
        if x['_t'] == 'p' and e in soc: r['ps'] = 1
        if x['_t'] == 'p':
            r['dp'] = A.iso(A.fecha(x['invoices_due_date']))
            r['in'] = A.iso(A.fecha(x['invoices_expiration_date']))
        rows.append(r)
    # memoria del reporte anterior: pendientes que eran socios y socios sin membresía que ya no salen
    prev = st0.get('rows') or []
    try: acts = json.load(open(A.TEAM, encoding='utf-8')).get('activaciones', [])
    except Exception: acts = []
    actK = {h for x in acts for h in (x.get('ek'), x.get('wk')) if h and not x.get('sc')}
    old = {r['k']: r for r in prev}
    nuevos = {r['k'] for r in rows}
    ps_prev = ps_act = 0
    for r in rows:
        if r['t'] != 'p' or r.get('ps'): continue
        o = old.get(r['k'])
        if o and (o.get('t') == 's' or o.get('ps')): r['ps'] = 1; ps_prev += 1
        elif (r.get('ek') and r['ek'] in actK) or (r.get('wk') and r['wk'] in actK): r['ps'] = 1; ps_act += 1
    kx = 0
    for o in prev:
        if o.get('t') == 'x' and o['k'] not in nuevos:
            rows.append(o); kx += 1
    if prev: print(f"memoria: pendientes socios por reporte anterior {ps_prev} · por activación {ps_act} · sin membresía conservados {kx}")
    rows.sort(key=lambda r: (r['lv'], r['n']))
    st = {'v': A.iso(A.ahora()), 'rows': rows, 'dud': dud, 'ss': ss, 'fix': fix, 'raw': {'so': so, 'mi': mi, 'pe': pe}}
    raw = json.dumps(st, ensure_ascii=False, sort_keys=True).encode()
    iv = os.urandom(12)
    open(ENC, 'w').write(base64.b64encode(iv + AESGCM(A.key()).encrypt(iv, raw, None)).decode())
    c = {}
    for r in rows: c[r['t']] = c.get(r['t'], 0) + 1
    print(f"personas {len(rows)} · socios {c.get('s',0)} · clientes {c.get('c',0)} · pendientes {c.get('p',0)} ({sum(1 for r in rows if r.get('ps'))} socios) · sin membresía {c.get('x',0)}")
    if '-v' in a:
        for i in sorted(sid):
            if sid[i] not in (None, 'ROOT'):
                x = P[sid[i]]; print('   ', sorted(nom[i])[0], '→', x['first_name'], x['last_name'])
    print('sin cadena completa (patrocinador no encontrado):', len(dud))
    for d in dud: print('  ', d['id'], 'nivel', d['nivel'], 'opciones', d['opciones'])


if __name__ == '__main__':
    main()
