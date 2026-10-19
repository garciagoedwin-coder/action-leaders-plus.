#!/bin/sh
# Marca una versión nueva para que la app instalada se actualice sola
cd "$(dirname "$0")"
V=$(date +%Y%m%d%H%M%S)
sed -i -E 's/var V="[^"]*"/var V="'$V'"/' index.html
printf '%s\n' "$V" > version.txt
