#!/usr/bin/env python3
"""Sincroniza las carpetas públicas de Drive (Eventos, Viajeros) con media/hist/ y data/hist.json.
Corre en GitHub Actions (allí sí hay salida a Google). Sin claves: usa la vista pública de la carpeta.
data/hist.json = {"v":ISO,"ev":[{"id","w","h"}],"vi":[...],"tx":{id:{"n","l","f"}}}  (tx lo mantiene el ciclo del ranking)."""
import json, os, re, sys, io, html, urllib.request, datetime
from PIL import Image, ImageOps

CARPETAS = {"ev": "1Lk5vMZ2hNUxHmFhvLsNffF1kk3TtF1kt", "vi": "14o0vxerCDS3CB7RVL2l-Kl6JoVNmnvrQ"}
RAIZ = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
MAN = os.path.join(RAIZ, "data", "hist.json")
UA = {"User-Agent": "Mozilla/5.0 (ActionLeadersSync)"}

def get(url, tries=3):
    for i in range(tries):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=60) as r:
                return r.read(), r.headers.get("Content-Type", "")
        except Exception as e:
            err = e
    raise err

def listar(fid):
    b, _ = get("https://drive.google.com/embeddedfolderview?id=%s" % fid)
    t = b.decode("utf-8", "replace")
    ids = re.findall(r'id="entry-([\w-]{20,})"', t)
    tit = [html.unescape(x) for x in re.findall(r'class="flip-entry-title">([^<]*)<', t)]
    out = []
    for i, x in enumerate(ids):
        n = tit[i] if i < len(tit) else ""
        if re.search(r"\.(jpe?g|png|heic|webp)$", n, re.I) or not n:
            out.append((x, n))
    return out

def bajar(fid, dest):
    b, ct = get("https://drive.usercontent.google.com/download?id=%s&export=download&confirm=t" % fid)
    im = Image.open(io.BytesIO(b))
    im = ImageOps.exif_transpose(im).convert("RGB")
    return achicar(im, dest)

def achicar(im, dest):
    """Tamaño de historia: cubre 1080x1920; lo que pase de 3:4 en ancho se recorta al centro (nunca se ve)."""
    w, h = im.size
    if w / h > 0.75:
        nw = round(h * 0.75); x = (w - nw) // 2; im = im.crop((x, 0, x + nw, h)); w = nw
    s = min(1.0, max(1080 / w, 1920 / h))
    if s < 1:
        im = im.resize((round(w * s), round(h * s)), Image.LANCZOS)
    im.save(dest, "JPEG", quality=78, optimize=True, progressive=True)
    return im.size

def main():
    man = json.load(open(MAN)) if os.path.exists(MAN) else {}
    cambio = False
    for k, fid in CARPETAS.items():
        try:
            vivos = listar(fid)
        except Exception as e:
            print("No pude listar", k, e); continue
        d = os.path.join(RAIZ, "media", "hist", k); os.makedirs(d, exist_ok=True)
        prev = {x["id"]: x for x in man.get(k, [])}
        nuevos = []
        for x, n in vivos:
            if x in prev and os.path.exists(os.path.join(d, x + ".jpg")):
                nuevos.append(prev[x]); continue
            try:
                w, h = bajar(x, os.path.join(d, x + ".jpg"))
                nuevos.append({"id": x, "w": w, "h": h}); cambio = True; print("+", k, n)
            except Exception as e:
                print("No pude bajar", k, n, e)
        # orden: los que ya estaban mantienen su lugar; los nuevos al final
        orden = [i for i in prev if any(y["id"] == i for y in nuevos)]
        orden += [y["id"] for y in nuevos if y["id"] not in prev]
        porid = {y["id"]: y for y in nuevos}
        lista = [porid[i] for i in orden]
        vivos_ids = {x for x, _ in vivos}
        if vivos:  # solo borra si la carpeta respondió con algo (evita vaciar por un error de Google)
            for i in prev:
                if i not in vivos_ids:
                    cambio = True; print("-", k, i)
                    try: os.remove(os.path.join(d, i + ".jpg"))
                    except FileNotFoundError: pass
        elif prev:
            lista = list(prev.values())
        if lista != man.get(k, []):
            cambio = True
        man[k] = lista
    man.setdefault("tx", {})
    if cambio:
        man["v"] = datetime.datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")
        json.dump(man, open(MAN, "w"), ensure_ascii=False, indent=1)
    print("cambio" if cambio else "sin cambios", {k: len(man.get(k, [])) for k in CARPETAS})

if __name__ == "__main__":
    main()
