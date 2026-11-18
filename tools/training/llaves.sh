#!/bin/sh
# Crea un par de llaves RSA temporales FUERA del repo (carpeta $1) e imprime la pública en una línea (para el input pk de diagperf.yml).
D=${1:-/tmp/pon-k}; mkdir -p "$D"
openssl genpkey -algorithm RSA -pkeyopt rsa_keygen_bits:2048 -out "$D/priv.pem" 2>/dev/null
openssl pkey -in "$D/priv.pem" -pubout -out "$D/pub.pem"
grep -v -- ----- "$D/pub.pem" | tr -d '\n' > "$D/pk.txt"; cat "$D/pk.txt"; echo
