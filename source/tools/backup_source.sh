#!/bin/bash
# keeps a copy of all the source code in the site repo (source/), so it is saved on GitHub
set -e
cd "$(dirname "$0")";SRC=/home/user/barycenter-site/source
mkdir -p "$SRC/sims/kit" "$SRC/bio" "$SRC/quasar" "$SRC/tools" "$SRC/public"
cp -r sims/kit/. "$SRC/sims/kit/"
for d in sims/*/; do g=$(basename "$d");[ -f "$d/meta.json" ]||continue;mkdir -p "$SRC/sims/$g";cp "$d"meta.json "$d"extra.css "$d"panes.html "$d"sim.js "$d"content.js "$SRC/sims/$g/" 2>/dev/null||true;done
cp sims/publish.py "$SRC/sims/"
cp bio/head.html bio/sim.js bio/catalog.js bio/ui.js bio/game.js bio/build.py bio/creator.js "$SRC/bio/"
cp barycenter.html "$SRC/barycenter.html";cp quasar/index.html "$SRC/quasar/index.html";cp public/index.html "$SRC/public/index.html"
cp publish_all.sh build_pub.sh make_hub.py seo.py shots.cjs linkcheck.py backup_source.sh "$SRC/tools/"
