# Descifra la salida de diagperf (code=analisis o fotos): python3 descifrar.py LOG.txt PRIV.pem SALIDA.json
# LOG = log del run (líneas "CIFnnn:..."). Si alguna parte trae "***" (GitHub la enmascaró), repetir el run.
import sys, re, base64, gzip, json
from cryptography.hazmat.primitives import serialization, hashes
from cryptography.hazmat.primitives.asymmetric import padding
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
log, priv, out = sys.argv[1:4]
P = {}
for l in open(log, encoding="utf-8", errors="ignore"):
    m = re.search(r"CIF(\d{3}):(\S+)", l)
    if m: P[int(m.group(1))] = m.group(2)
s = "".join(P[i] for i in sorted(P))
if "***" in s: sys.exit("Salida enmascarada por GitHub (***): repita el run")
ek, iv, tag, enc = [base64.b64decode(x) for x in s.split(".")]
k = serialization.load_pem_private_key(open(priv, "rb").read(), None).decrypt(ek, padding.OAEP(mgf=padding.MGF1(hashes.SHA256()), algorithm=hashes.SHA256(), label=None))
d = gzip.decompress(AESGCM(k).decrypt(iv, enc + tag, None))
open(out, "wb").write(d); print("ok", len(d), "bytes")
