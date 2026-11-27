#!/usr/bin/env python3
"""Flyers automáticos para la página de Action Leaders (Facebook + Instagram @actionleadersoficial vía Metricool).

Arma las imágenes con tools/redes/plantilla.html (manual de marca, de TÚ) y deja el plan de publicación en
tools/redes/salida.json. La tarea programada sube las imágenes (commit → actionleadersplus.com/media/redes/…)
y las programa en Metricool (marca "Action Leaders +", blogId 7963364).

Usos (desde la raíz del repo, con  python3 -m http.server 8765  corriendo):
  python3 tools/redes/redes.py manana [--fecha AAAA-MM-DD]   historia de atracción, presentación del día, training,
                                                              flyer de llamado a la acción (publicación + historia)
  python3 tools/redes/redes.py noche  [--fecha AAAA-MM-DD]   socios nuevos (uno por uno), Team Leaders y rangos nuevos
                                                              (uno por uno, máx. 3 al día, al día siguiente),
                                                              Action Leaders del mes (un solo flyer), ganadores del mes
  --nombres   no dibuja ni guarda: imprime (JSON) los nombres que van a salir y no tienen foto local → la tarea
              baja sus fotos de la app (diagperf code=fotos) a tools/redes/_fotos/<nombre-normalizado>.jpg
  --prueba    no guarda data/redes.json

Estado (data/redes.json): socios (fecha ISO del último socio publicado), hechos (nombres ya reconocidos como TL),
  rg {nombre: rango}, cola [{n, t:"tl"|"rango", r}], lz (periodo), gan (mes), enlace (página de Edwin para prospectos).
Socios nuevos, Team Leaders y rangos usan los artes de la app (bienCanvas / rgCanvas) vía una copia temporal
_redes_app.html (se borra sola; nunca se sube). Solo nombres; nunca correos, teléfonos ni uids. Las fotos de _fotos/ NO se suben (tools/redes/.gitignore).
"""
import sys, os, json, re, datetime, unicodedata, hashlib, copy

RAIZ = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
os.chdir(RAIZ)
HN = datetime.timezone(datetime.timedelta(hours=-6))
URL = 'http://localhost:8765/tools/redes/plantilla.html'
EST = 'data/redes.json'
SAL = 'tools/redes/salida.json'
FOTOS = 'tools/redes/_fotos'
MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']
DIAS = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo']
RANGOS = ['marketing director', 'senior marketing director', 'regional director', 'national director',
          'international director', 'executive director', 'board of director']
RANGO_ALIAS = {'sm director': 'senior marketing director'}
NM_PART = {"de", "del", "la", "las", "los", "y", "e", "da", "van", "von"}
POR_DIA = 3                        # reconocimientos (Team Leader / rango) por día
HORAS_RECO = ['10:00', '13:00', '16:00']


def norm(s):
    s = unicodedata.normalize('NFD', str(s or '')).encode('ascii', 'ignore').decode().lower()
    return re.sub(r'[^a-z ]', '', re.sub(r'\s+', ' ', s)).strip()


def slug(s):
    return norm(s).replace(' ', '-')


def cap(t):
    out = []
    for i, x in enumerate(t.split(' ')):
        if i and x.lower() in NM_PART:
            out.append(x.lower())
        elif x == x.lower() and len(x) > 1:
            out.append(x[0].upper() + x[1:])
        else:
            out.append(x)
    return ' '.join(out)


def nom_corto(n):
    """Igual que nomCorto() de la app: sin el segundo apellido cuando el nombre es largo."""
    n = re.sub(r'\s+', ' ', str(n or '').strip())
    if not n:
        return n
    if re.search(r'\sy\s|&|\(', n, re.I):
        return cap(n)
    w = n.split(' ')
    sig = [x for x in w if x.lower() not in NM_PART]
    if len(sig) < 4:
        return cap(n)
    return cap(re.sub(r'\s+(de|del|la|las|los|y)$', '', ' '.join(w[:-1]), flags=re.I))


def same(a, b):
    a, b = norm(a), norm(b)
    if not a or not b:
        return False
    if a == b:
        return True
    wa, wb = a.split(), b.split()
    if wa[0] != wb[0]:
        return False
    corto, largo = (wa, wb) if len(wa) <= len(wb) else (wb, wa)
    return len(corto) >= 2 and all(x in largo for x in corto)


def h(s):
    return int(hashlib.md5(s.encode()).hexdigest(), 16)


def rango_n(r):
    r = norm(r)
    return RANGO_ALIAS.get(r, r)


class Datos:
    def __init__(s):
        s.t = json.load(open('data/team.json', encoding='utf-8'))
        s.c = s.t.get('config', {})
        s.fotos = s.t.get('fotos') or []
        s.alias = s.c.get('alias') or {}
        s.pedidas = []          # nombres que salen sin foto (para --nombres)
        try:
            s.hist = json.load(open('data/hist.json', encoding='utf-8'))
        except Exception:
            s.hist = {}

    def foto(s, n):
        p = os.path.join(FOTOS, slug(n) + '.jpg')
        if os.path.exists(p):
            return p
        cand = [n] + [v for k, v in s.alias.items() if same(k, n)] + [k for k, v in s.alias.items() if same(v, n)]
        for f in sorted(s.fotos, key=lambda f: -(f.get('t') or 0)):
            if any(same(f.get('nombre'), x) for x in cand):
                q = str(f.get('img') or '').split('?')[0]
                if q and os.path.exists(q):
                    return q
        if n not in s.pedidas:
            s.pedidas.append(n)
        return ''

    def rango_de(s, n):
        for k, v in list((s.c.get('rangos') or {}).items()) + list((s.c.get('titulos') or {}).items()):
            if same(k, n) and rango_n(v) in RANGOS:
                return rango_n(v)
        for l in s.t.get('liderazgo') or []:
            if (same(l.get('nombre'), n) or same(l.get('nombreRanking'), n)) and rango_n(l.get('rango')) in RANGOS:
                return rango_n(l.get('rango'))
        return ''

    def rangos(s):
        """{nombre: rango} de quienes tienen Marketing Director o más."""
        out = {}
        for l in s.t.get('liderazgo') or []:
            r = rango_n(l.get('rango'))
            if r in RANGOS and l.get('nombre'):
                out[l['nombre']] = r
        for k, v in list((s.c.get('rangos') or {}).items()) + list((s.c.get('titulos') or {}).items()):
            if rango_n(v) in RANGOS and not any(same(k, x) for x in out):
                out[k] = rango_n(v)
        return out

    def team_leaders(s):
        C = s.c.get('tl') or {}
        meta = C.get('meta') or 500
        return [x['n'] for x in C.get('l') or [] if (x.get('p') or 0) >= meta and not s.rango_de(x['n'])]


def estado():
    try:
        return json.load(open(EST, encoding='utf-8'))
    except Exception:
        return {}


# ---------- textos (de TÚ; varían cada día; nunca prometer ingresos) ----------
TX_NUEVO1 = [
    "🚀 ¡Bienvenido(a) al equipo, {p}! Decidiste viajar más, gastar menos y emprender desde tu celular. Aquí te acompañamos en cada paso.",
    "🛡️ {p} se une hoy a la familia Action Leaders. ¡Bienvenido(a)! Aquí nadie camina solo.",
    "🔥 Damos la bienvenida a {p}. Gracias por confiar en este equipo. ¡Vamos con todo!",
    "✈️ {p} dijo SÍ a su sueño. ¡Bienvenido(a) a Action Leaders!",
]
TX_TL1 = [
    "🏅 ¡Felicidades, {p}! Nuevo Team Leader: 500 puntos de directos en 30 días. Así se lidera: con el ejemplo y tomando acción.",
    "🏅 {p} es Team Leader. Constancia, presentaciones y un equipo que crece. ¡Orgullo Action Leaders!",
    "🏅 Nivel desbloqueado: Team Leader. ¡Felicidades, {p}! El que trabaja, se nota.",
]
TX_RANGO1 = [
    "🎖️ ¡Felicidades, {p}! Nuevo rango: {r}. Liderar con el ejemplo tiene recompensa.",
    "🎖️ {p} alcanzó el rango {r}. Constancia, equipo y acción todos los días. ¡Felicidades!",
]
TX_LZ = ["⭐ Ellos son los Action Leaders de {m}: líderes que califican al Sistema de liderazgo y van al frente del ranking. ¡Felicidades!"]
TX_GAN = ["🏆 Ganadores de {m}. Constancia, presentaciones y equipo. ¡Felicidades a todos los que lo dieron todo este mes!"]
TX_TR = [
    "🎓 Hoy hay Action Leaders Training a las {h} (hora de Honduras): «{t}». Conéctate, aprende y ponlo en práctica hoy mismo.",
    "🔥 Training de hoy, {h} hora de Honduras: «{t}». Los que se forman, crecen. Te esperamos en el Zoom.",
    "📚 «{t}» · Action Leaders Training hoy a las {h} (Honduras). Trae tu libreta y a tu equipo.",
]
TX_CTA = [
    "¿Quieres viajar más, gastar menos y emprender desde tu celular? Únete a la comunidad Action Leaders. ✈️",
    "Este equipo empezó igual que tú: con ganas de algo más. ¿Te unes? 🛡️",
    "Emprende desde tu celular con un equipo que te acompaña paso a paso. 📱",
    "Tu próximo viaje puede empezar con un mensaje. ¿Te animas? 🌎",
    "Aquí nadie camina solo. Si quieres emprender y viajar por el mundo, este es tu lugar. 🔥",
]
CTA_FIN = [
    "🙋 Escríbenos QUIERO y alguien de nuestro equipo te contacta.",
    "🙋 Comenta o escríbenos QUIERO: te contactamos.",
    "📩 Escríbenos y te explicamos todo, sin compromiso.",
]
TAGS = "\n\n#HASTAQUEFUNCIONE #ActionLeaders #inCruises #Emprendimiento #Viajes"
# historia de atracción de TÚ (fotos reales del equipo)
ATR = [
    ["Nadie llega", "solo.", "Se llega con un equipo que no te deja rendirte."],
    ["El miedo se vence", "haciendo.", "No esperes a sentirte listo."],
    ["Tu próximo viaje", "empieza hoy.", "Y tu negocio también."],
    ["Viajar no es un lujo.", "Es una decisión.", ""],
    ["Gente normal", "viajando más.", "¿Te imaginas aquí?"],
    ["Primero lo soñamos.", "Después lo vivimos.", ""],
    ["Coleccionamos momentos,", "no cosas.", ""],
    ["El éxito no se improvisa.", "Se entrena.", "Cada evento es un entrenamiento."],
    ["Rodéate de gente", "que sí cree.", "Aquí nadie camina solo."],
    ["Emprender desde tu celular", "es posible.", "Te enseñamos paso a paso."],
    ["Un sí", "lo cambia todo.", "¿Cuándo das el tuyo?"],
    ["Hasta que", "funcione.", "Así trabajamos en este equipo."],
]
ATR_P = ["¿Quieres ser parte de este equipo?", "¿Listo para dar el paso?", "¿Quieres viajar con nosotros?"]
CTA_TIT = ["¿Quieres viajar más y **emprender**?", "Únete a la **comunidad**", "Emprende desde tu **celular**", "Tu próximo viaje empieza **hoy**",
           "Aquí nadie camina **solo**"]


def elegir(lst, sem):
    return lst[h(sem) % len(lst)]


def pie(st, sem):
    """Cierre de cada texto: llamado a la acción + enlace (si Edwin ya lo dio)."""
    t = "\n\n" + elegir(CTA_FIN, sem)
    if st.get('enlace'):
        t += f"\n👉 {st['enlace']} (en Instagram: link en la bio)"
    return t + TAGS


def hora_txt(hhmm):
    hh, mm = map(int, hhmm.split(':'))
    return f"{(hh % 12) or 12}:{mm:02d} {'PM' if hh >= 12 else 'AM'}"


def titulo_celeste(t):
    w = str(t).split()
    if len(w) < 2:
        return f"**{t}**"
    return ' '.join(w[:-1]) + f" **{w[-1]}**"


def rango_bonito(r):
    return ' '.join(x.capitalize() if x != 'of' else 'of' for x in r.split())


# ---------- render ----------
class Render:
    def __init__(s):
        from playwright.sync_api import sync_playwright
        s.pw = sync_playwright().start()
        try:
            s.b = s.pw.chromium.launch()
        except Exception:
            exe = next((c for c in ['/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser'] if os.path.exists(c)), None)
            s.b = s.pw.chromium.launch(executable_path=exe)
        s.p = s.b.new_page(viewport={'width': 1080, 'height': 1920})
        s.p.goto(URL)
        s.p.wait_for_function('typeof render==="function"')

    def foto(s, D, out):
        s.p.set_viewport_size({'width': 1080, 'height': 1920 if D.get('fmt') == 'h' else 1350})
        s.p.evaluate('D=>render(D)', D)
        s.p.wait_for_timeout(250)
        os.makedirs(os.path.dirname(out), exist_ok=True)
        s.p.locator('#f').screenshot(path=out, type='jpeg', quality=90)
        return out

    _app = None

    def app(s):
        if not s._app:
            s._app = AppRender(s)
        return s._app

    def reco(s, *a):
        return s.app().reco(*a)

    def bien(s, *a):
        return s.app().bien(*a)

    def cerrar(s):
        if s._app:
            s._app.cerrar()
        s.b.close()
        s.pw.stop()


RK = {'marketing director': 'md', 'senior marketing director': 'smd', 'regional director': 'rd', 'national director': 'nd',
      'international director': 'id', 'executive director': 'ed', 'board of director': 'bod'}
APP = '_redes_app.html'   # copia temporal de index.html (se borra al terminar; NUNCA se sube)


class AppRender:
    """Dibuja con las MISMAS funciones de la app (Edwin, 24 nov: «tienen que ser los artes que ya genera la app exactamente»):
    rgCanvas (reconocimiento de Team Leader y rangos) y bienCanvas (bienvenida del socio nuevo)."""
    def __init__(s, R):
        src = open('index.html', encoding='utf-8').read()
        k = '(function(){\n"use strict";\n'
        if src.count(k) != 1:
            raise SystemExit('No encontré el inicio del script de la app en index.html (cambió la estructura): avisar a Edwin.')
        open(APP, 'w', encoding='utf-8').write(src.replace(k, k + 'window.__al={rgCanvas,bienCanvas,genF};\n'))
        stub = os.path.abspath('tools/test/stub')
        s.p = R.b.new_page(viewport={'width': 430, 'height': 900}, timezone_id='America/Tegucigalpa')
        for k2, f in [('app', 'app'), ('auth', 'auth'), ('firestore', 'fs')]:
            s.p.route(re.compile(r'gstatic\.com/firebasejs/.*firebase-' + k2 + r'\.js'),
                      lambda r, q=None, f=f: r.fulfill(path=os.path.join(stub, f + '.js'), content_type='application/javascript'))
        s.p.route(re.compile(r'fonts\.(googleapis|gstatic)\.com'), lambda r, q=None: r.abort())
        s.p.goto('http://localhost:8765/' + APP)
        s.p.wait_for_function('window.__al&&typeof window.__al.rgCanvas==="function"', timeout=60000)

    def _guardar(s, js, arg, out):
        import base64
        d = s.p.evaluate(js, arg)
        os.makedirs(os.path.dirname(out), exist_ok=True)
        open(out, 'wb').write(base64.b64decode(d.split(',')[1]))
        return out

    def reco(s, rk, nm, foto, out):
        js = "async a=>{const c=await window.__al.rgCanvas({rk:a.rk,nm:a.nm,foto:a.foto},a.f);return c.toDataURL('image/jpeg',.92)}"
        return (s._guardar(js, {'rk': rk, 'nm': nm, 'foto': foto, 'f': 'p'}, out + '.jpg'),
                s._guardar(js, {'rk': rk, 'nm': nm, 'foto': foto, 'f': 'h'}, out + '-h.jpg'))

    def bien(s, nm, pat, plan, foto, patfoto, out):
        a = {'nm': nm, 'pat': pat, 'plan': plan, 'foto': foto, 'pf': patfoto}
        hist = s._guardar("async a=>{const A=window.__al;const c=await A.bienCanvas(a.nm,A.genF(a.nm),a.pat,a.plan,a.foto,'',a.pf,0,false);return c.toDataURL('image/jpeg',.92)}", a, out + '-h.jpg')
        # publicación 1080×1350 (Instagram no acepta 9:16 en el feed): la misma historia completa, centrada, con su fondo desenfocado
        post = s._guardar("""async a=>{const A=window.__al;const h=await A.bienCanvas(a.nm,A.genF(a.nm),a.pat,a.plan,a.foto,'',a.pf,0,false);
          const c=document.createElement('canvas');c.width=1080;c.height=1350;const g=c.getContext('2d');
          g.filter='blur(28px) brightness(.45)';g.drawImage(h,-60,-(1920*1.11-1350)/2,1200,1920*1.11);g.filter='none';
          const w=1350*1080/1920;g.drawImage(h,(1080-w)/2,0,w,1350);return c.toDataURL('image/jpeg',.92)}""", a, out + '.jpg')
        return post, hist

    def cerrar(s):
        try:
            s.p.close()
        finally:
            if os.path.exists(APP):
                os.remove(APP)


class SinRender:
    def foto(s, D, out):
        return out

    def reco(s, rk, nm, foto, out):
        return out + '.jpg', out + '-h.jpg'

    def bien(s, nm, pat, plan, foto, patfoto, out):
        return out + '.jpg', out + '-h.jpg'

    def cerrar(s):
        pass


def hora(fecha, hhmm, ahora, dias=0):
    """Hora de publicación; si ya pasó, 25 min desde ahora (lo que tarda en subir la imagen)."""
    f = fecha + datetime.timedelta(days=dias)
    hh, mm = map(int, hhmm.split(':'))
    t = datetime.datetime(f.year, f.month, f.day, hh, mm, tzinfo=HN)
    if t < ahora + datetime.timedelta(minutes=25):
        t = (ahora + datetime.timedelta(minutes=25)).replace(second=0, microsecond=0)
    return t.strftime('%Y-%m-%dT%H:%M:00')


def mas_min(hhmm, m):
    hh, mm = map(int, hhmm.split(':'))
    x = min(hh * 60 + mm + m, 23 * 60 + 59)
    return f"{x // 60:02d}:{x % 60:02d}"


def foto_hist(d, n, cp='ev'):
    H = d.hist or {}
    fuera = set(H.get('fuera') or [])
    otro = 'vi' if cp == 'ev' else 'ev'
    L = [(cp, f) for f in H.get(cp) or [] if f['id'] not in fuera] or [(otro, f) for f in H.get(otro) or [] if f['id'] not in fuera]
    if not L:
        return None
    c, f = L[n % len(L)]
    fz = f.get('fz')
    px = f"{round((fz[0] + fz[2] / 2) * 100)}% {round(max(0, min(1, (fz[1] + fz[3] / 2) - .12)) * 100)}%" if fz else "50% 30%"
    return {'f': f, 'cp': c, 'img': f"media/hist/{c}/{f['id']}.jpg", 'px': px}


def manana(d, fecha, ahora, R, carp, st):
    sal = []
    ds = fecha.isoformat()
    n = (fecha - datetime.date(2026, 1, 1)).days
    # 1) historia de atracción (foto real del equipo + frase de TÚ + llamado a la acción)
    x = foto_hist(d, n * 5 + 3, ["vi", "vi", "ev", "vi", "ev", "vi", "ev"][(fecha.weekday() + 1) % 7])
    if x:
        D = {'tipo': 'atr', 'fmt': 'h', 'foto': x['img'], 'px': x['px'], 'p': ATR_P[n % 3], 'pill': '🙋 Escríbenos QUIERO'}
        tx = (d.hist.get('tx') or {}).get(x['f']['id']) if x['cp'] == 'vi' else None
        if tx and tx.get('f'):
            t = tx['f'].strip()
            m = re.match(r'^(.*[.!?…])\s+([^.!?…]+[.!?…]?)$', t) or re.match(r'^(.*,)\s+(.+)$', t)
            a, b = (m.group(1), m.group(2)) if m else ('', t)
            D.update(a='“' + a if a else '“', b=b + '”', quien=tx.get('n', ''), lugar=tx.get('l', ''), tz=76, tag='Así viaja nuestro equipo')
        else:
            fr = ATR[n % len(ATR)]
            D.update(a=fr[0], b=fr[1], c=fr[2])
        sal.append({'id': 'atraccion', 'red': 'story', 'hora': hora(fecha, '09:00', ahora), 'media': [R.foto(D, f'{carp}/atraccion.jpg')], 'texto': ''})
    cal = [c for c in d.t.get('calendario') or [] if c.get('fecha') == ds and not c.get('cancel')]
    # 2) presentación(es) de negocio del día (solo las que todavía no empiezan)
    pres = sorted([c for c in cal if c.get('tipo') == 'Presentación'], key=lambda c: c.get('hora', ''))
    pres = [c for c in pres if datetime.datetime.combine(fecha, datetime.time.fromisoformat(c.get('hora', '20:00')), HN) > ahora + datetime.timedelta(minutes=60)]
    if pres:
        fondos = sorted(f for f in os.listdir('media/flyers/pres') if f.endswith('-h.jpg'))
        horas = []
        for c in pres:
            hh = c.get('hora', '20:00')
            if 'europa' in norm(c.get('titulo')):
                hm = int(hh[:2]) + 7
                horas.append({'h': hora_txt(hh), 't': 'Europa', 'z': f"Honduras · {hora_txt(f'{hm % 24:02d}:{hh[3:]}')} Madrid"})
            else:
                horas.append({'h': hora_txt(hh), 't': re.sub(r'(?i)presentaci[oó]n\s*', '', c.get('titulo', '')).strip() or 'Latinoamérica', 'z': 'Hora de Honduras · Zoom'})
        D = {'tipo': 'pres', 'fmt': 'h', 'foto': 'media/flyers/pres/' + fondos[n % len(fondos)], 'dia': DIAS[fecha.weekday()] + ' ' + str(fecha.day),
             'tit': elegir(['Viaja más, gasta **menos**', 'Emprende desde tu **celular**', 'Tu próximo viaje empieza **hoy**'], ds),
             'sub': 'Conoce cómo nuestro equipo viaja más, gasta menos y emprende desde el celular.', 'horas': horas, 'cta': '💬 Escríbenos INFO'}
        sal.append({'id': 'presentacion', 'red': 'story', 'hora': hora(fecha, '12:00', ahora), 'media': [R.foto(D, f'{carp}/presentacion.jpg')], 'texto': ''})
    # 3) Action Leaders Training
    tr = [c for c in cal if 'action leaders training' in norm(c.get('titulo'))]
    if tr:
        c = tr[0]
        po = (d.c.get('ponencias') or {}).get(c['id']) or {}
        pon = [k for k, v in (po.get('roles') or {}).items() if 'ponente' in norm(v)]
        L = [{'n': nom_corto(p), 's': 'Ponente', 'foto': d.foto(p)} for p in pon]
        tit = po.get('t') or 'Action Leaders Training'
        base = {'tipo': 'training', 'tit': titulo_celeste(tit), 'sub': po.get('s', ''), 'hora': hora_txt(c.get('hora', '20:00')),
                'dia': 'Hoy ' + DIAS[fecha.weekday()] + ' ' + str(fecha.day) + ' de ' + MESES[fecha.month - 1], 'L': L, 'cta': 'Te esperamos 🔥'}
        txt = elegir(TX_TR, ds).format(h=hora_txt(c.get('hora', '20:00')), t=tit) + pie(st, ds + 'tr')
        sal.append({'id': 'training', 'red': 'post', 'hora': hora(fecha, '10:00', ahora), 'media': [R.foto(dict(base, fmt='p'), f'{carp}/training.jpg')], 'texto': txt})
        sal.append({'id': 'training-h', 'red': 'story', 'hora': hora(fecha, '18:30', ahora), 'media': [R.foto(dict(base, fmt='h'), f'{carp}/training-h.jpg')], 'texto': ''})
    # 4) llamado a la acción del día (publicación + historia)
    x = foto_hist(d, n * 7 + 11, 'ev')
    D = {'tipo': 'cta', 'tag': 'Únete a la comunidad', 'tit': CTA_TIT[n % len(CTA_TIT)],
         'sub': 'Viaja más, gasta menos y emprende desde tu celular con un equipo que te acompaña.',
         'pill': '🙋 Escríbenos QUIERO', 'nota': 'Link en la bio · alguien de nuestro equipo te contacta',
         'foto': x['img'] if x else '', 'px': x['px'] if x else ''}
    txt = TX_CTA[n % len(TX_CTA)] + pie(st, ds + 'cta')
    sal.append({'id': 'llamado', 'red': 'post', 'hora': hora(fecha, '13:00', ahora), 'media': [R.foto(dict(D, fmt='p'), f'{carp}/llamado.jpg')], 'texto': txt})
    sal.append({'id': 'llamado-h', 'red': 'story', 'hora': hora(fecha, '16:00', ahora), 'media': [R.foto(dict(D, fmt='h'), f'{carp}/llamado-h.jpg')], 'texto': ''})
    return sal


def uno(R, carp, nombre, p, tag, tit, sub, cta, oro=False):
    D = {'tipo': 'uno', 'tag': tag, 'tit': tit, 'sub': sub, 'cta': cta, 'oro': oro, 'L': [p]}
    return R.foto(dict(D, fmt='p'), f'{carp}/{nombre}.jpg'), R.foto(dict(D, fmt='h'), f'{carp}/{nombre}-h.jpg')


def noche(d, fecha, ahora, R, carp, st):
    sal = []
    ds = fecha.isoformat()
    # 1) socios nuevos, UNO POR UNO (desde la última publicación; la primera vez, desde las 00:00 de hoy)
    corte = st.get('socios') or datetime.datetime(fecha.year, fecha.month, fecha.day, tzinfo=HN).astimezone(datetime.timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')
    nuevos = sorted([a for a in d.t.get('activaciones') or [] if str(a.get('fecha', '')) > corte and a.get('socio')], key=lambda a: a['fecha'])
    vistos = set()
    i = 0
    for a in nuevos:
        k = norm(a['socio'])
        if k in vistos:
            continue
        vistos.add(k)
        p = {'n': nom_corto(a['socio']), 'foto': d.foto(a['socio'])}
        pat = nom_corto(a.get('patrocinador') or '')
        plan = 'premium' if norm(a.get('paquete')) == 'premium' else 'classic'
        post, hist = R.bien(p['n'], pat, plan, p['foto'], d.foto(pat) if pat else '', f'{carp}/socio-{slug(a["socio"])[:40]}')
        hh = mas_min('21:00', 20 * i)
        sal.append({'id': f'socio-{i + 1}', 'red': 'post', 'hora': hora(fecha, hh, ahora), 'media': [post], 'texto': elegir(TX_NUEVO1, ds + k).format(p=p['n']) + pie(st, ds + k)})
        sal.append({'id': f'socio-{i + 1}-h', 'red': 'story', 'hora': hora(fecha, hh, ahora), 'media': [hist], 'texto': ''})
        i += 1
    if nuevos:
        st['socios'] = nuevos[-1]['fecha']
    # 2) reconocimientos UNO POR UNO: Team Leaders y rangos nuevos → cola; salen máx. 3 al día (al día siguiente 10, 1 y 4)
    cola = st.setdefault('cola', [])
    hechos = st.setdefault('hechos', [])
    for nm in d.team_leaders():
        if not any(same(nm, x) for x in hechos) and not any(same(nm, c['n']) for c in cola):
            cola.append({'n': nm, 't': 'tl'})
    rg = st.get('rg') or {}
    primera_rg = not rg
    for nm, r in d.rangos().items():
        prev = next((v for k, v in rg.items() if same(k, nm)), None)
        if not primera_rg and prev != r and (prev is None or RANGOS.index(r) > RANGOS.index(prev)):
            cola.insert(0, {'n': nm, 't': 'rango', 'r': r})   # los rangos nuevos van primero
        rg = {k: v for k, v in rg.items() if not same(k, nm)}
        rg[nm] = r
    st['rg'] = rg
    for j, c in enumerate(cola[:POR_DIA]):
        p = {'n': nom_corto(c['n']), 'foto': d.foto(c['n'])}
        if c['t'] == 'rango':
            rb = rango_bonito(c['r'])
            post, hist = R.reco(RK[c['r']], p['n'], p['foto'], f'{carp}/rango-{slug(c["n"])[:40]}')
            txt = elegir(TX_RANGO1, ds + c['n']).format(p=p['n'], r=rb)
        else:
            post, hist = R.reco('tl', p['n'], p['foto'], f'{carp}/tl-{slug(c["n"])[:40]}')
            txt = elegir(TX_TL1, ds + c['n']).format(p=p['n'])
        hh = HORAS_RECO[j]
        sal.append({'id': f'reco-{j + 1}', 'red': 'post', 'hora': hora(fecha, hh, ahora, 1), 'media': [post], 'texto': txt + pie(st, ds + c['n'])})
        sal.append({'id': f'reco-{j + 1}-h', 'red': 'story', 'hora': hora(fecha, hh, ahora, 1), 'media': [hist], 'texto': ''})
        if c['t'] == 'tl':
            hechos.append(c['n'])
    st['cola'] = cola[POR_DIA:]
    # 3) Action Leaders del mes: UN SOLO flyer con todos (cuando cambia el periodo)
    per = d.c.get('liderazgoPeriodo')
    if per and st.get('lz') != per:
        st['lz'] = per
        L = [nom_corto(l['nombre']) for l in d.t.get('liderazgo') or [] if l.get('nombre')]
        L = [(x.split()[0] + ' ' + x.split()[-1]) if len(x) > 17 and len(x.split()) > 2 else x for x in L]  # nombre y apellido para que quepan
        if L:
            m = per.split()[0].lower()
            D = {'tipo': 'mosaico', 'oro': True, 'tag': 'Sistema de liderazgo', 'tit': f'Action Leaders de **{m}**',
                 'sub': f'{len(L)} líderes que lideran con el ejemplo y van al frente del ranking.', 'N': L, 'cta': '⭐ ¡Felicidades!'}
            sal.append({'id': 'action-leaders-mes', 'red': 'post', 'hora': hora(fecha, '20:30', ahora), 'media': [R.foto(dict(D, fmt='p'), f'{carp}/action-leaders-mes.jpg')],
                        'texto': TX_LZ[0].format(m=m) + pie(st, ds + 'lz')})
            sal.append({'id': 'action-leaders-mes-h', 'red': 'story', 'hora': hora(fecha, '20:30', ahora), 'media': [R.foto(dict(D, fmt='h'), f'{carp}/action-leaders-mes-h.jpg')], 'texto': ''})
    # 4) Ganadores del mes (config.ganadores), cuando aparece un mes nuevo
    g = d.c.get('ganadores') or {}
    if g.get('mes') and st.get('gan') != g['mes']:
        st['gan'] = g['mes']
        L = []
        for k in ['roatan', 'libros']:
            if g.get(k) and g[k].get('n'):
                L.append({'n': nom_corto(g[k]['n']), 's': re.sub(r'(?i)viaje a roat[aá]n|roat[aá]n', 'Incentivo de viaje', g[k].get('k', '')), 'foto': d.foto(g[k]['n'])})
        for i2, r in enumerate(g.get('racha') or []):
            L.append({'n': nom_corto(r['n']), 's': f'Top {i2 + 1} Mi Racha', 'foto': d.foto(r['n'])})
        if L:
            m = g.get('mesN') or g['mes']
            D = {'tipo': 'lista', 'oro': True, 'tag': 'Reconocimientos del mes', 'tit': f'Ganadores de **{m}**', 'sub': 'Constancia, presentaciones y equipo.',
                 'cta': '🏆 ¡Felicidades!', 'L': L, 'max': 8}
            sal.append({'id': 'ganadores', 'red': 'post', 'hora': hora(fecha, '20:00', ahora), 'media': [R.foto(dict(D, fmt='p'), f'{carp}/ganadores.jpg')],
                        'texto': TX_GAN[0].format(m=m) + pie(st, ds + 'gan')})
            sal.append({'id': 'ganadores-h', 'red': 'story', 'hora': hora(fecha, '20:00', ahora), 'media': [R.foto(dict(D, fmt='h', max=14), f'{carp}/ganadores-h.jpg')], 'texto': ''})
    return sal


def main():
    a = sys.argv[1:]
    if not a or a[0] not in ('manana', 'noche'):
        print(__doc__)
        return
    modo = a[0]
    ahora = datetime.datetime.now(HN)
    fecha = datetime.date.fromisoformat(a[a.index('--fecha') + 1]) if '--fecha' in a else ahora.date()
    d = Datos()
    st = estado()
    carp = f'media/redes/{fecha.isoformat()}'
    if '--nombres' in a:
        (manana if modo == 'manana' else noche)(d, fecha, ahora, SinRender(), carp, copy.deepcopy(st))
        print(json.dumps(d.pedidas, ensure_ascii=False))
        return
    # limpieza: Metricool ya copió las imágenes al publicarlas; se guardan solo 14 días en el repo
    import shutil
    if os.path.isdir('media/redes'):
        for x in os.listdir('media/redes'):
            try:
                if (fecha - datetime.date.fromisoformat(x)).days > 14:
                    shutil.rmtree(os.path.join('media/redes', x))
            except ValueError:
                pass
    R = Render()
    try:
        sal = (manana if modo == 'manana' else noche)(d, fecha, ahora, R, carp, st)
    finally:
        R.cerrar()
    json.dump({'modo': modo, 'fecha': fecha.isoformat(), 'base': 'https://actionleadersplus.com/', 'pub': sal}, open(SAL, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    if '--prueba' not in a and modo == 'noche':
        json.dump(st, open(EST, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    for p in sal:
        print(p['red'], p['hora'], p['id'], len(p['media']), 'imágenes')
    if not sal:
        print('nada que publicar')


if __name__ == '__main__':
    main()
