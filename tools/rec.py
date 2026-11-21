#!/usr/bin/env python3
"""Pago recurrente (20 nov 2026, Edwin): guarda en team.json → config.rec SOLO huellas parciales
(6 hex de FNV-1a, las mismas de config.ahorro) de correo y WhatsApp. Nunca correos ni teléfonos.

  python3 tools/rec.py CON.csv SIN.csv PEND_SIN.csv
     CON      = miembros activos CON pago recurrente
     SIN      = miembros activos SIN pago recurrente
     PEND_SIN = miembros pendientes SIN pago recurrente (los demás pendientes sí tienen recurrente: su cobro falló)
  Cualquiera puede ser "-" (se conserva la lista anterior).

config.rec = {t, c:[...], s:[...], p:[...], n:{c,s,p}}
"""
import sys, csv, json, datetime
sys.path.insert(0, 'tools')
from ahorro import ke, kw  # mismas huellas que el ahorro (la app usa ahKe / ahKw)

TEAM = 'data/team.json'


def huellas(f):
    H, n = set(), 0
    for x in csv.DictReader(open(f, encoding='utf-8-sig')):
        n += 1
        w = (x.get('whatsapp_url') or '').split('phone=')[-1]
        for h in (ke(x.get('email')), kw(w), kw(x.get('mobile_phone'))):
            if h: H.add(h)
    return sorted(H), n


def main():
    a = sys.argv[1:]
    if len(a) != 3: print(__doc__); sys.exit(1)
    d = json.load(open(TEAM, encoding='utf-8'))
    old = d.setdefault('config', {}).get('rec') or {}
    rec = {'t': datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ'),
           'c': old.get('c', []), 's': old.get('s', []), 'p': old.get('p', []), 'n': dict(old.get('n') or {})}
    for k, f in zip('csp', a):
        if f == '-': continue
        rec[k], rec['n'][k] = huellas(f)
    d['config']['rec'] = rec
    json.dump(d, open(TEAM, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print('Pago recurrente →', 'con', rec['n'].get('c', 0), '· sin', rec['n'].get('s', 0), '· pendientes sin', rec['n'].get('p', 0))


if __name__ == '__main__':
    main()
