#!/bin/bash
# rebuild every game and copy it into the site repo
set -e
cd "$(dirname "$0")"
python3 sims/publish.py
python3 - <<'PY'
import re
p='barycenter.html';s=open(p).read();q=open('sims/kit/askq.js').read()
s=re.sub(r'/\* ==ASKQ==.*?/\* ==/ASKQ== \*/\n?','',s,flags=re.S)
i=s.rindex('</script>');s=s[:i]+q+'\n'+s[i:];open(p,'w').write(s)
PY
python3 sims/kit/build.py sims/apogee >/dev/null && mkdir -p /home/user/barycenter-site/barycenter/rockets && cp sims/apogee/site/index.html /home/user/barycenter-site/barycenter/rockets/index.html
bash build_pub.sh >/dev/null 2>&1
(cd bio && python3 build.py >/dev/null)
python3 - <<'PY'
s=open('/home/user/barycenter-site/life/index.html').read();new=open('biosphere.html').read()
pre=s[:s.index('<title>Biosphere Sandbox</title>')];k=new.index('</style>')+8
open('/home/user/barycenter-site/life/index.html','w').write(pre+new[:k]+'\n</head>\n<body>\n'+new[k:]+'\n</body>\n</html>\n')
PY
# Quasar AI has its own page
mkdir -p /home/user/barycenter-site/quasar && cp quasar/index.html /home/user/barycenter-site/quasar/index.html
# the Our Simulations! page: preview pictures for any new simulator, then the page itself
node shots.cjs >/dev/null 2>&1 || true
python3 make_hub.py >/dev/null
# link previews, search-engine data, icons, Share button, sitemap
python3 seo.py >/dev/null
bash backup_source.sh
echo published
