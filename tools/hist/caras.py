#!/usr/bin/env python3
"""Detecta caras (YuNet, opencv_zoo, licencia MIT: tools/hist/yunet.onnx) y devuelve la caja que las une, normalizada [x,y,w,h].
La app la usa para encuadrar la foto y que el texto no tape las caras. Uso suelto: python3 tools/hist/caras.py  (recalcula data/hist.json)."""
import os, json
import cv2, numpy as np
AQUI = os.path.dirname(os.path.abspath(__file__))
_det = None
def rostros(path, una=False):
    global _det
    im = cv2.imread(path)
    if im is None: return None
    h, w = im.shape[:2]; s = 640 / max(w, h); sm = cv2.resize(im, (int(w * s), int(h * s)))
    if _det is None: _det = cv2.FaceDetectorYN.create(os.path.join(AQUI, "yunet.onnx"), "", (sm.shape[1], sm.shape[0]), 0.75)
    _det.setInputSize((sm.shape[1], sm.shape[0]))
    _, F = _det.detect(sm)
    if F is None or not len(F): return None
    W, H = sm.shape[1], sm.shape[0]
    F = [f for f in F if f[2] * f[3] > (W * H) * 0.0008]  # ignora caras diminutas del fondo
    if not F: return None
    big = max(f[2] * f[3] for f in F); F = [f for f in F if f[2] * f[3] > big * 0.15]  # solo las protagonistas
    if una: F = [max(F, key=lambda f: f[2] * f[3])]  # foto de la cara del socio: solo la más grande
    x0 = min(f[0] for f in F); y0 = min(f[1] for f in F); x1 = max(f[0] + f[2] for f in F); y1 = max(f[1] + f[3] for f in F)
    r = lambda v: round(float(v), 3)
    return [r(max(0, x0) / W), r(max(0, y0) / H), r((min(W, x1) - max(0, x0)) / W), r((min(H, y1) - max(0, y0)) / H)]
if __name__ == "__main__":
    RAIZ = os.path.dirname(os.path.dirname(AQUI)); MAN = os.path.join(RAIZ, "data", "hist.json")
    man = json.load(open(MAN)); n = 0
    for k in ("ev", "vi", "caras"):
        for x in man.get(k, []):
            fz = rostros(os.path.join(RAIZ, "media", "hist", k, x["id"] + ".jpg"), k == "caras")
            if fz: x["fz"] = fz; x.pop("nf", None); n += 1
            else: x.pop("fz", None); x["nf"] = 1
    json.dump(man, open(MAN, "w"), ensure_ascii=False, indent=1); print("con caras:", n)
