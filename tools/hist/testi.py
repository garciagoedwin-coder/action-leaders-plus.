#!/usr/bin/env python3
"""Testimonios de Viajeros: lee el CSV de respuestas del formulario y escribe data/hist.json → tx[idFoto] = {n, l, f}.
Uso: python3 tools/hist/testi.py RESPUESTAS.csv [AJUSTES.json]
AJUSTES.json (opcional) = {"idFoto": {"l": "Ciudad, País"}, "Nombre original": {"n": "Nombre para mostrar"}} para corregir a mano.
Solo nombre, lugar y frase (nunca correos). Solo filas con "Autorizo". Las fotos solo salen en la app cuando Edwin las mueve a la carpeta Viajeros."""
import csv, json, os, re, sys
RAIZ = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
MAN = os.path.join(RAIZ, "data", "hist.json")
EMO = re.compile("[\U0001F1E6-\U0001F1FF\U0001F300-\U0001FAFF☀-➿️]+")
def limpia(t):
    t = EMO.sub("", t or "").strip().strip(",").strip()
    t = re.sub(r"\s+", " ", t).replace(" ,", ",").replace(" .", ".")
    return t
def frase(t):
    t = limpia(t).strip('"“”').strip()
    if t and t[-1] not in ".!?…": t += "."
    return t[:1].upper() + t[1:]
def lugar(t):
    t = limpia(t)
    t = re.sub(r"\s*,\s*", ", ", t)
    if "," not in t:  # "Madrid España" → "Madrid, España" cuando la última palabra es un país conocido
        P = ["España","Italia","Francia","Grecia","Noruega","Alemania","Suiza","Argentina","México","Honduras","Colombia","Portugal","Croacia","Turquía","Bahamas","Jamaica"]
        for p in P:
            if t.endswith(" " + p): t = t[: -len(p) - 1] + ", " + p; break
    return t
def ids(c): return re.findall(r"id=([\w-]{20,})", c or "")
def main():
    rows = list(csv.reader(open(sys.argv[1], encoding="utf-8")))
    aj = json.load(open(sys.argv[2])) if len(sys.argv) > 2 else {}
    man = json.load(open(MAN)); tx = man.setdefault("tx", {})
    n0 = len(tx)
    for r in rows[1:]:
        r += [""] * (11 - len(r))
        if "autorizo" not in (r[10] or "").lower(): continue
        nm = limpia(r[1]); nm = (aj.get(nm) or {}).get("n", nm)
        f = frase(r[2])
        for fc, lc in ((3, 4), (5, 6), (7, 8)):
            fotos = ids(r[fc])
            l = lugar(r[lc]) if len(fotos) == 1 else ""
            for i in fotos:
                e = {"n": nm, "l": l, "f": f}
                cs = ids(r[9])
                if cs: e["c"] = cs[0]
                e.update({k: v for k, v in (aj.get(i) or {}).items()})
                tx[i] = e
    man["tx"] = tx
    json.dump(man, open(MAN, "w"), ensure_ascii=False, indent=1)
    print("testimonios:", len(tx), "(nuevos/actualizados desde", n0, ")")
main()
