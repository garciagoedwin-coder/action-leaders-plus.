#!/usr/bin/env python3
"""Buzón del ranking (corre en GitHub Actions cada 15 min, ver .github/workflows/buzon.yml).

Lee la hoja privada "Buzón del ranking" (la llena tools/buzon/Codigo.gs desde el Gmail de Edwin):
  Correos   id | recibido | tipo (act|pago|falla) | asunto | datos (JSON) | estado | nota
  Registros sponsor_id | sponsor_name | account_created   (reporte de registros gratis más reciente)
y hace lo mismo que hacía el ciclo del chat: ahorro.py pago/falla, ranking.py, nuevos.py.
Al terminar marca cada fila (estado) y deja en "Salida" lo que Edwin debe saber (calificados nuevos, revisar).

SEGURIDAD: los logs de GitHub son públicos → aquí NUNCA se imprimen nombres, correos ni teléfonos (solo conteos).
Variables: FIREBASE_SA (secreto), BUZON_ID (id de la hoja), DRY=1 (prueba: no guarda, no marca, no publica).
Escribe /tmp/buzon_out.json {acts, ahorro, commit} para los pasos de avisos del workflow.
"""
import base64, hashlib, json, os, re, subprocess, sys, time, unicodedata, urllib.parse, urllib.request

from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import padding
from cryptography.hazmat.primitives.ciphers.aead import AESGCM

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.chdir(ROOT)
sys.path.insert(0, os.path.join(ROOT, 'tools'))
DRY = os.environ.get('DRY') == '1' or not os.path.exists('tools/buzon/activo')  # sin tools/buzon/activo solo prueba (lado a lado con el chat)
SA = json.loads(os.environ['FIREBASE_SA'])
HOJA = (os.environ.get('BUZON_ID') or '').strip() or (open('tools/buzon/hoja.txt').read().strip() if os.path.exists('tools/buzon/hoja.txt') else '')
PROJ = SA.get('project_id', 'action-leaders-plus-8f1b8')
OUT = {'acts': 0, 'ahorro': 0, 'commit': 0}


def log(*a): print(*a, flush=True)


# ---------- Google: token de la cuenta de servicio (JWT RS256, sin librerías extra) ----------
def token():
    b64 = lambda b: base64.urlsafe_b64encode(b).rstrip(b'=')
    now = int(time.time())
    h = b64(json.dumps({'alg': 'RS256', 'typ': 'JWT'}).encode())
    c = b64(json.dumps({'iss': SA['client_email'], 'aud': 'https://oauth2.googleapis.com/token', 'iat': now, 'exp': now + 3000,
                        'scope': 'https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/datastore'}).encode())
    k = serialization.load_pem_private_key(SA['private_key'].encode(), None)
    s = b64(k.sign(h + b'.' + c, padding.PKCS1v15(), hashes.SHA256()))
    body = urllib.parse.urlencode({'grant_type': 'urn:ietf:params:oauth:grant-type:jwt-bearer', 'assertion': (h + b'.' + c + b'.' + s).decode()}).encode()
    return json.load(urllib.request.urlopen('https://oauth2.googleapis.com/token', body))['access_token']


TK = None


def api(url, data=None, method=None):
    req = urllib.request.Request(url, data=json.dumps(data).encode() if data is not None else None, method=method,
                                 headers={'Authorization': 'Bearer ' + TK, 'Content-Type': 'application/json'})
    try:
        return json.load(urllib.request.urlopen(req))
    except urllib.error.HTTPError as e:
        msg = e.read().decode()[:600]
        if 'has not been used' in msg or 'SERVICE_DISABLED' in msg:
            log('FALTA ACTIVAR una API de Google:', re.sub(r'[^A-Za-z0-9 .:/_-]', ' ', re.sub(r'[\w.+-]+@[\w.-]+', ' correo ', msg))[:300])
        elif e.code == 403:
            log('SIN PERMISO: comparta la hoja "Buzón del ranking" con la cuenta de servicio:', SA['client_email'])
        raise SystemExit('Error %s de Google' % e.code)


SH = 'https://sheets.googleapis.com/v4/spreadsheets/' + HOJA


def leer(rango):
    return api(SH + '/values/' + urllib.parse.quote(rango)).get('values', [])


def escribir(datos):
    if DRY or not datos: return
    api(SH + '/values:batchUpdate', {'valueInputOption': 'RAW', 'data': datos})


def agregar(rango, filas):
    if DRY or not filas: return
    api(SH + '/values/' + urllib.parse.quote(rango) + ':append?valueInputOption=RAW&insertDataOption=INSERT_ROWS', {'values': filas})


def llave():
    d = api('https://firestore.googleapis.com/v1/projects/%s/databases/(default)/documents/evento/sps26/priv/llave' % PROJ)
    k = d['fields']['k']['stringValue']
    p = '/tmp/evk'
    open(p, 'w').write(k)
    os.chmod(p, 0o600)
    return p


# ---------- utilidades ----------
def nrm(t):
    t = unicodedata.normalize('NFD', str(t or '')).encode('ascii', 'ignore').decode().lower()
    return ' '.join(re.sub(r'[^a-z ]', ' ', t).split())


def bonito(t): return ' '.join(w[:1].upper() + w[1:].lower() for w in str(t).split())


def py(*args):
    r = subprocess.run([sys.executable] + list(args), capture_output=True, text=True, env=dict(os.environ, EVK_FILE=EVK))
    if r.returncode: raise RuntimeError((args[0], r.returncode, 'stderr oculto'))
    return r.stdout


def red_rows():
    try:
        k = open(EVK).read().strip(); k = base64.urlsafe_b64decode(k + '=' * (-len(k) % 4))
        raw = base64.b64decode(open('data/red.enc').read().strip())
        return json.loads(AESGCM(k).decrypt(raw[:12], raw[12:], None)).get('rows', [])
    except Exception:
        return []


def main():
    global TK, EVK
    if not HOJA:
        log('Falta la hoja del buzón (tools/buzon/hoja.txt). Compártala con la cuenta de servicio:', SA.get('client_email')); return
    TK = token()
    correos = leer('Correos!A2:G')
    pend = [(i + 2, r + [''] * (7 - len(r))) for i, r in enumerate(correos) if len(r) >= 5 and not (r[5:6] and r[5].strip())]
    regs = [r for r in leer('Registros!A2:C') if len(r) >= 3 and r[0]]
    reg_txt = '\n'.join('%s|%s|%s' % (r[0].strip(), r[1].strip().replace('|', ' '), r[2].strip()) for r in regs)
    reg_h = hashlib.sha256(reg_txt.encode()).hexdigest()[:16]
    est = {r[0]: (r[1] if len(r) > 1 else '') for r in leer('Estado!A2:B') if r}
    reg_cambio = est.get('registros_hash_app') != reg_h
    log('pendientes', len(pend), '· registros', len(regs), '(cambiaron)' if reg_cambio else '(sin cambios)', '· DRY' if DRY else '')
    if not pend and not reg_cambio:
        log('Nada nuevo'); return
    EVK = llave()
    import ahorro as A
    A.KEYF = EVK
    estados, salida, nuevas, contactos = {}, [], [], {}
    t0 = json.load(open('data/team.json', encoding='utf-8'))
    eks = {a.get('ek') for a in t0.get('activaciones', []) if a.get('ek')}
    socios0 = [nrm(a.get('socio')) for a in t0.get('activaciones', [])]
    RED = None
    cuenta = {'act': 0, 'rep': 0, 'pago': 0, 'pago0': 0, 'falla': 0, 'falla0': 0, 'err': 0}
    for fila, r in pend:
        tipo = r[2].strip()
        try:
            d = json.loads(r[4] or '{}')
        except Exception:
            estados[fila] = 'error: datos ilegibles'; cuenta['err'] += 1; continue
        try:
            if tipo == 'act':
                email, tel, socio = (d.get('email') or '').strip().lower(), d.get('tel') or '', (d.get('socio') or '').strip()
                if not socio or not d.get('patrocinador'):
                    estados[fila] = 'revisar: correo sin datos'; cuenta['err'] += 1
                    salida.append(['aviso', 'Un correo de socio/miembro nuevo no se pudo leer (fila %d de Correos). Revíselo.' % fila]); continue
                ek, wk = A.ke(email), A.kw(tel)
                if (ek and ek in eks) or nrm(socio) in socios0 or any(n.get('ek') == ek and ek for n in nuevas):
                    estados[fila] = 'repetido'; cuenta['rep'] += 1; continue
                a = {'socio': socio, 'paquete': d.get('paquete') or '', 'patrocinador': d['patrocinador'].strip(), 'fecha': r[1].strip(), 'ek': ek, 'wk': wk}
                if d.get('soloPartner'):
                    a['sc'] = 1
                    salida.append(['aviso', '🔑 %s activó solo su código de socio (sin membresía): no suma volumen.' % socio])
                elif not a['paquete']:
                    estados[fila] = 'revisar: sin paquete'; cuenta['err'] += 1
                    salida.append(['aviso', 'No se pudo leer el paquete de %s (fila %d de Correos).' % (socio, fila)]); continue
                nuevas.append(a); contactos[ek or socio] = (email, re.sub(r'\D', '', tel))
                estados[fila] = 'ok'; cuenta['act'] += 1
            elif tipo == 'pago':
                q = (d.get('email') or '').strip().lower()
                st = A.cargar(); h = A.ke(q) if q else None
                hay = any(h and h in x['k'] for x in st['rows']) if h else False
                if not hay and d.get('nombre'):
                    # nombre: exacto, o todas las palabras de uno dentro del otro (mín. 2) y UNA sola coincidencia.
                    # Así "Carmen Cecilia" = "Carmen Cecilia Lagos", pero "Irma yolanda Torres castillo" ≠ "Irma Yolanda Hernandez Torres".
                    P = set(nrm(d['nombre']).split())
                    ex = [x for x in st['rows'] if nrm(x['n']) == nrm(d['nombre'])]
                    sub = [x for x in st['rows'] if len(P) >= 2 and (P <= set(nrm(x['n']).split()) or (len(nrm(x['n']).split()) >= 2 and set(nrm(x['n']).split()) <= P))]
                    c = ex if ex else (sub if len(sub) == 1 else [])
                    hay = bool(c)
                    if hay: q = c[0]['n']
                    elif len(sub) > 1: salida.append(['aviso', '💰 Pagó %s pero hay %d personas con nombre parecido en pendientes: revíselo.' % (d['nombre'], len(sub))])
                if hay:
                    out = py('tools/ahorro.py', 'pago', q)
                    estados[fila] = 'pagó: quitado' if 'quitados 0' not in out else 'no estaba'
                    cuenta['pago' if 'quitados 0' not in out else 'pago0'] += 1
                else:
                    estados[fila] = 'no estaba'; cuenta['pago0'] += 1
            elif tipo == 'falla':
                email = (d.get('email') or '').strip().lower(); h = A.ke(email)
                st = A.cargar()
                if not h:
                    estados[fila] = 'revisar: sin correo'; cuenta['err'] += 1; continue
                if any(h in x['k'] for x in st['rows']):
                    estados[fila] = 'ya estaba'; cuenta['falla0'] += 1; continue      # no alargar su fecha
                if RED is None: RED = red_rows()
                rr = next((x for x in RED if x.get('ek') == h), None)
                nom = (rr or {}).get('n') or bonito(d.get('nombre') or '')
                sp = (rr or {}).get('sp') or ''
                if not sp:
                    for c in d.get('cc') or []:
                        s2 = next((x for x in RED if x.get('ek') == A.ke(c)), None)
                        if s2: sp = s2.get('n', ''); break
                py('tools/ahorro.py', 'falla', '|'.join([email, nom, r[1].strip(), d.get('plan') or '', sp]))
                estados[fila] = 'agregado a pendientes'; cuenta['falla'] += 1
            else:
                estados[fila] = 'ignorado'
        except Exception as e:
            estados[fila] = 'error: %s' % type(e).__name__; cuenta['err'] += 1
    log('resultado', json.dumps(cuenta))
    # ---- ranking ----
    if nuevas or reg_cambio:
        open('/tmp/reg.txt', 'w', encoding='utf-8').write(reg_txt + '\n')
        out = py('tools/ranking.py', '/tmp/reg.txt', json.dumps(nuevas, ensure_ascii=False))
        for ln in out.splitlines():
            if ln.startswith('NUEVO EN SISTEMA:'):
                p = [x.strip() for x in ln.split(':', 1)[1].split('|')]
                salida.append(['calificado', p[0] + '|' + (p[1] if len(p) > 1 else p[0])])
            elif ln.startswith('YA ERA MIEMBRO'):
                salida.append(['aviso', '🔄 ' + ln.strip() + ' (pasó de miembro a socio: no suma volumen).'])
            elif ln.startswith('REVISAR'):
                salida.append(['aviso', '⚠️ ' + ln.strip()])
        log('ranking recalculado', '· calificados nuevos', sum(1 for s in salida if s[0] == 'calificado'))
        if nuevas:
            t1 = json.load(open('data/team.json', encoding='utf-8'))
            args = []
            for a in t1.get('activaciones', []):
                c = contactos.get(a.get('ek') or a.get('socio'))
                if c and a.get('id'): args.append('%s|%s|%s' % (a['id'], c[0], c[1]))
            if args: py('tools/nuevos.py', 'add', *args)
            OUT['acts'] = len(nuevas)
    cambios = subprocess.run(['git', 'status', '--porcelain', 'data'], capture_output=True, text=True).stdout.strip()
    OUT['ahorro'] = int('data/ahorro.enc' in cambios)
    if DRY:
        log('DRY: cambios que se guardarían →', cambios.replace('\n', ' · ') or 'ninguno')
        for f, r in pend:
            e = estados.get(f, '')
            if e not in ('repetido', 'no estaba', 'ya estaba', 'ok'): log('  fila', f, r[1], r[2], '→', e)
        log('DRY: estados →', json.dumps(sorted(set(estados.values()))), '· avisos para Edwin', len(salida))
        subprocess.run(['git', 'checkout', '--', 'data'])
        return
    if cambios:
        subprocess.run(['git', 'add', 'data'], check=True)
        msg = 'Buzón: %d socios nuevos · %d pagos · %d pendientes nuevos%s' % (cuenta['act'], cuenta['pago'], cuenta['falla'], ' · registros' if reg_cambio else '')
        subprocess.run(['git', '-c', 'user.name=Action Leaders Bot', '-c', 'user.email=actions@users.noreply.github.com', 'commit', '-q', '-m', msg], check=True)
        ok = False
        for _ in range(4):
            if subprocess.run(['git', 'pull', '-q', '--rebase']).returncode == 0 and subprocess.run(['git', 'push', '-q']).returncode == 0:
                ok = True; break
            time.sleep(6)
        if not ok: raise SystemExit('No se pudo publicar (se reintenta en la próxima corrida)')
        OUT['commit'] = 1
    # ---- marcar la hoja (solo después de publicar) ----
    hora = time.strftime('%Y-%m-%d %H:%M UTC', time.gmtime())
    escribir([{'range': 'Correos!F%d:G%d' % (f, f), 'values': [[e, hora]]} for f, e in estados.items()])
    agregar('Salida!A:D', [[hora, t, tx, ''] for t, tx in salida])
    if reg_cambio:
        k = list(est.keys())
        if 'registros_hash_app' in k:
            escribir([{'range': 'Estado!B%d' % (k.index('registros_hash_app') + 2), 'values': [[reg_h]]}])
        else:
            agregar('Estado!A:B', [['registros_hash_app', reg_h]])
    log('listo')


EVK = ''
if __name__ == '__main__':
    try:
        main()
    finally:
        json.dump(OUT, open('/tmp/buzon_out.json', 'w'))
        try: os.remove('/tmp/evk')
        except OSError: pass
