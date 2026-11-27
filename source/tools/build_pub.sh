set -e
cd /tmp/claude-0/-home-user/89fb5cec-fa03-5d89-9ad5-7295f7c6bb89/scratchpad
cp barycenter.html release/barycenter-game.html
python3 - <<'PY'
src=open('release/barycenter-game.html').read();old=open('public/index.html').read()
head=old[:old.index('<style>')];base=old[old.index('<style>'):old.index('</title>')+8]
t='<title>Barycenter Sandbox</title>';src2=src.replace(t,'',1) if t in base else src
i=src2.index('</style>')+len('</style>')
open('public/index.html','w').write(head+base+'\n'+src2[:i]+'\n</head>\n<body>\n'+src2[i:]+'\n</body>\n</html>\n')
PY
test "$(grep -c '<title>' public/index.html)" = 1
cd public && rm -f barycenter-web.zip && zip -q barycenter-web.zip index.html && cp index.html /home/user/barycenter-web.html && cp barycenter-web.zip /home/user/barycenter-web.zip && mkdir -p /home/user/barycenter-site/barycenter && cp index.html /home/user/barycenter-site/barycenter/index.html
