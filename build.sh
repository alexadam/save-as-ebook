#!/bin/sh
# Package web-extension/ into clean .zip files for AMO / Chrome Web Store upload.
# Avoids Finder's "Compress", which adds __MACOSX/._* forks and .DS_Store files.
#
# The two stores disagree about the background script key, so each zip gets a
# manifest tailored to its target:
#   firefox - background.scripts (event page); service_worker removed
#   chrome  - background.service_worker; scripts + browser_specific_settings removed
#
# Usage: ./build.sh [firefox|chrome]   (no argument builds both)

set -e

cd "$(dirname "$0")/web-extension"

VERSION=$(sed -n 's/.*"version"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' manifest.json | head -1)
TARGETS="${1:-firefox chrome}"

# Strip any macOS metadata already on disk before packaging.
find . -name '.DS_Store' -delete

TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT

for TARGET in $TARGETS; do
    OUT="$PWD/save-as-ebook-$VERSION-$TARGET.zip"
    rm -f "$OUT"

    python3 - "$TARGET" "$TMP/manifest.json" <<'PY'
import json, sys

target, out = sys.argv[1], sys.argv[2]
m = json.load(open('manifest.json'))

if target == 'firefox':
    # Firefox ignores service_worker and warns about it; it runs background.scripts.
    m['background'].pop('service_worker', None)
    # Firefox also warns about message_serialization, which is a Chrome-specific setting.
    m.pop('message_serialization', None)
elif target == 'chrome':
    m['background'].pop('scripts', None)
    m.pop('browser_specific_settings', None)
else:
    sys.exit(f'unknown target: {target}')

json.dump(m, open(out, 'w'), indent=4)
PY

    # -X drops extra file attributes (uid/gid, resource forks).
    # manifest.json is excluded here and added from $TMP below.
    zip -r -q -X "$OUT" . \
        -x '.*' \
        -x '*/.*' \
        -x '__MACOSX/*' \
        -x '*/__MACOSX/*' \
        -x '*.zip' \
        -x 'manifest.json'

    (cd "$TMP" && zip -q -X "$OUT" manifest.json)

    echo "Built $OUT"
    unzip -l "$OUT" | tail -3
done
