#!/usr/bin/env bash
# Compila / empaqueta el proyecto Defold con bob.jar (necesita Java 17+).
#   tools/build.sh            -> solo compila (valida scripts y recursos)
#   tools/build.sh html5      -> bundle HTML5 en ./bundle/html5
#   tools/build.sh android    -> bundle Android (APK) en ./bundle/android
# Para bundle, bob descarga el motor de d.defold.com (necesita acceso a esa red).
set -euo pipefail
cd "$(dirname "$0")/.."
VER="${DEFOLD_VERSION:-1.9.0}"
BOB="tools/bob.jar"
[ -f "$BOB" ] || curl -fL -o "$BOB" "https://github.com/defold/defold/releases/download/$VER/bob.jar"
cd ultimo_refugio
case "${1:-build}" in
  build)   java -jar "../$BOB" --root . resolve build ;;
  html5)   java -jar "../$BOB" --root . --archive --platform js-web --architectures wasm-web --bundle-output ../bundle/html5 distclean build bundle ;;
  android) java -jar "../$BOB" --root . --archive --platform armv7-android --architectures armv7-android,arm64-android --bundle-output ../bundle/android distclean build bundle ;;
  *) echo "uso: $0 [build|html5|android]"; exit 1 ;;
esac
