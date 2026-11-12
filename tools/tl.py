#!/usr/bin/env python3
"""Nivel Team Leader (inCruises) — se calcula solo, en cada ciclo del buzón.

Regla (Edwin, 12 nov 2026): solo DIRECTOS, sin contar la membresía propia, en una ventana móvil de 30 días:
  - directo que ENTRÓ en los últimos 30 días  → su paquete: Premium 500 · Classic 200 · Starter 50
  - directo que PAGÓ su ahorro en los últimos 30 días (correo de inCruises) → Premium 250 · Classic 100 · Starter 50
  - directo en ahorro pendiente o sin pago     → 0
  Suma ≥ 500 = Team Leader. Quien tiene rango (Marketing Director+) se muestra con su rango (eso lo decide la app).
«Pagó en 30 días» = está al día (no está en la lista de pendientes, que se actualiza con los correos de pago y de
pago fallido) o llegó su correo de pago en los últimos 30 días (data/pagos.enc). Quien salía pendiente en el
reporte de inCruises solo cuenta si llegó su correo de pago.

Escribe en data/team.json → config.tl = {t, v, l:[{n, p, a}]}  (n = nombre del patrocinador en inCruises,
p = puntos, a = directos que suman). Solo nombres y puntos: nunca correos ni teléfonos.

  python3 tools/tl.py [--ver]
"""
import sys, os, json, base64, re, datetime
sys.path.insert(0, os.path.dirname(__file__))
import ahorro as A
import pagos as PG
from cryptography.hazmat.primitives.ciphers.aead import AESGCM

TEAM = 'data/team.json'
ENTRA = {'premium': 500, 'classic': 200, 'starter': 50}
MENSUAL = {'premium': 250, 'classic': 100, 'starter': 50}
META = 500


def dec(f):
    if not os.path.exists(f): return {}
    raw = base64.b64decode(open(f).read().strip())
    return json.loads(AESGCM(A.key()).decrypt(raw[:12], raw[12:], None))


def plan(s):
    s = (s or '').lower()
    return 'premium' if 'premium' in s else 'classic' if 'classic' in s else 'starter' if 'starter' in s else ''


def iso(d): return d.strftime('%Y-%m-%dT%H:%M:%SZ')


def main(ver=False):
    ahora = datetime.datetime.now(datetime.timezone.utc)
    lim = iso(ahora - datetime.timedelta(days=30))
    T = json.load(open(TEAM, encoding='utf-8'))
    cfg = T.setdefault('config', {})
    alias = {PG.nrm(k): v for k, v in (cfg.get('alias') or {}).items()}
    canon = lambda n: alias.get(PG.nrm(n), A.bonito(n))
    red = (dec('data/red.enc') or {}).get('rows', [])
    pend = (dec('data/ahorro.enc') or {}).get('rows', [])
    pk = {h for x in pend for h in (x.get('k') or [])}
    pn = {PG.nrm(x.get('n')) for x in pend}
    PS = PG.cargar()
    pagos = [x for x in PS.get('p', []) if x['f'] >= lim]
    cubre = bool(PS.get('desde')) and PS['desde'] <= lim  # ya hay 30 días de pagos guardados
    pagN = {}
    for x in pagos: pagN.setdefault(PG.nrm(x['n']), x['f'])

    def pagó(n):
        k = PG.nrm(n)
        if k in pagN: return True
        P = set(k.split())
        if len(P) < 2: return False
        c = [q for q in pagN if P <= set(q.split()) or (len(q.split()) >= 2 and set(q.split()) <= P)]
        return len(c) == 1

    def pendiente(r):
        return (r.get('ek') and r['ek'] in pk) or (r.get('wk') and r['wk'] in pk) or PG.nrm(r.get('n')) in pn

    tot, cnt, usados = {}, {}, set()
    def suma(sp, pts):
        if not sp or not pts: return
        k = canon(sp); tot[k] = tot.get(k, 0) + pts; cnt[k] = cnt.get(k, 0) + 1
    # 1) activaciones de los últimos 30 días → paquete al patrocinador directo
    for a in T.get('activaciones', []):
        if a.get('sc') or a.get('ps') or (a.get('fecha') or '') < lim: continue
        p = plan(a.get('paquete'))
        if not p: continue
        suma(a.get('patrocinador'), ENTRA[p])
        for h in (a.get('ek'), a.get('wk')):
            if h: usados.add(h)
        usados.add(PG.nrm(a.get('socio')))
    # 2) directos de la red (reporte de inCruises) → su ahorro del mes
    for r in red:
        if r.get('t') == 'x': continue
        if (r.get('ek') and r['ek'] in usados) or (r.get('wk') and r['wk'] in usados) or PG.nrm(r.get('n')) in usados: continue
        p = plan(r.get('pl'))
        if not p: continue
        pg = pagó(r.get('n'))
        # al día = no está en la lista de pendientes (se actualiza con los correos de pago y de pago fallido);
        # quien salía pendiente en el reporte solo cuenta si llegó su correo de pago en los últimos 30 días.
        if pg or (not pendiente(r) and r.get('t') in ('s', 'c')):
            suma(r.get('sp'), MENSUAL[p])
    L = sorted(({'n': n, 'p': p, 'a': cnt[n]} for n, p in tot.items() if p > 0), key=lambda x: (-x['p'], x['n']))
    nuevo = {'v': 1, 'meta': META, 'cubre': int(cubre), 'l': L}
    viejo = {k: v for k, v in (cfg.get('tl') or {}).items() if k != 't'}
    tl = sum(1 for x in L if x['p'] >= META)
    print(f'Team Leader: {tl} con {META}+ · {len(L)} con puntos · pagos en ventana {len(pagos)} · cubre 30 días: {cubre}')
    if ver:
        for x in L[:40]: print('  ', x['p'], x['a'], x['n'])
    if viejo != nuevo:
        nuevo['t'] = iso(ahora)
        cfg['tl'] = nuevo
        json.dump(T, open(TEAM, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
        print('config.tl actualizado')


if __name__ == '__main__':
    main('--ver' in sys.argv)
