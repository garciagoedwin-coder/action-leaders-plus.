"""Vigía del buzón (20 nov): revisa la hoja "Buzón del ranking" cada ~60 s durante casi una hora.
Si aparece una fila nueva sin estado en Correos, lanza buzon.yml (workflow_dispatch) para que la
activación entre al ranking en un par de minutos y no hasta el siguiente turno de 15 min.
Solo lee la hoja (Sheets API); no toca Firestore. Logs públicos: solo conteos."""
import json, os, sys, time, urllib.request
sys.path.insert(0, os.path.dirname(__file__))
import buzon as B

DUR = int(os.environ.get('VIGIA_SEG') or 3360)   # ~56 min
PASO = 60
REPO = os.environ.get('GITHUB_REPOSITORY', '')
GTK = os.environ.get('GH_TOKEN', '')


def disparar():
    req = urllib.request.Request('https://api.github.com/repos/%s/actions/workflows/buzon.yml/dispatches' % REPO,
                                 data=json.dumps({'ref': 'main', 'inputs': {'dry': '0'}}).encode(), method='POST',
                                 headers={'Authorization': 'Bearer ' + GTK, 'Accept': 'application/vnd.github+json'})
    urllib.request.urlopen(req).read()


def main():
    if not B.HOJA:
        B.log('Sin hoja'); return
    fin, tk_t, ult, esp = time.time() + DUR, 0, None, 0
    while time.time() < fin:
        try:
            if time.time() - tk_t > 2400:
                B.TK = B.token(); tk_t = time.time()
            rows = B.leer('Correos!A2:G')
            pend = [r[0] for r in rows if len(r) >= 5 and not (r[5:6] and r[5].strip())]
            clave = ','.join(pend)
            # dispara si hay pendientes nuevos; si siguen los mismos, vuelve a intentar cada 5 min (el buzón pudo fallar)
            if pend and (clave != ult or time.time() > esp):
                disparar(); ult, esp = clave, time.time() + 300
                B.log(time.strftime('%H:%M'), 'pendientes', len(pend), '→ buzón lanzado')
        except SystemExit as e:
            B.log('Google:', e)
        except Exception as e:
            B.log('error', type(e).__name__)
        time.sleep(PASO)
    B.log('Vigía terminado')


if __name__ == '__main__':
    main()
