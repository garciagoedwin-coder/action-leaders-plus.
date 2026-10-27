#!/bin/sh
# Marca una versión nueva para que la app instalada se actualice sola.
# Antes, prueba que la app abra sin errores (tools/smoke.js). Si falla, NO publica.
cd "$(dirname "$0")"
if command -v node >/dev/null 2>&1 && node -e "require('playwright')" 2>/dev/null; then
  python3 -m http.server 8765 >/dev/null 2>&1 & SRV=$!
  sleep 1
  node tools/smoke.js; R=$?
  kill $SRV 2>/dev/null
  if [ $R -ne 0 ]; then echo "PRUEBA FALLÓ: no se publica"; exit 1; fi
fi
V=$(date +%Y%m%d%H%M%S)
sed -i -E 's/var V="[^"]*"/var V="'$V'"/' index.html
printf '%s\n' "$V" > version.txt
