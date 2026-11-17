# Makes every page easy to find and nice to share: link-preview pictures (Open Graph / X cards), search-engine data,
# a tab icon per game, an install manifest, a Share button, and a sitemap. Runs after every publish.
import json,os,re,html
from PIL import Image,ImageDraw,ImageFont
SITE='/home/user/barycenter-site';BASE='https://jacob711-oss.github.io/Simulators/'
SIMS=json.load(open(os.path.join(SITE,'sims.json')))
def logo_svg(c1,c2='#3fd8ff',bg='#1a0f08',size=64,animate=True):
    # a magical library, painted rather than cartoony: shaded shelves of old books, warm lamplight,
    # a glowing open book on a carved stand, and letters that drift off the shelves into its pages
    cols=['#6e1f1a','#1f3a5a','#264d2c','#7a5a1a','#4a2a4f','#7a3a1a','#1f4a48','#5a1c22']
    books=''
    for side,x0 in (('l',5),('r',46.5)):
        for row,y in enumerate((10.5,24.5,38.5)):
            x=x0;k=row*3+(0 if side=='l' else 5)
            for j in range(4):
                w=2.5+((k+j)%3)*0.45;h=10.6-((k+j*2)%3)*1.1;c=cols[(k+j)%len(cols)];top=y+11-h
                books+=(f"<rect x='{x:.2f}' y='{top:.2f}' width='{w:.2f}' height='{h:.2f}' fill='{c}'/>"
                        f"<rect x='{x:.2f}' y='{top:.2f}' width='{w:.2f}' height='{h:.2f}' fill='url(#spine)'/>"
                        f"<rect x='{x:.2f}' y='{top+1.4:.2f}' width='{w:.2f}' height='.45' fill='#c9a24a' opacity='.75'/>"
                        f"<rect x='{x:.2f}' y='{top+h-1.8:.2f}' width='{w:.2f}' height='.45' fill='#c9a24a' opacity='.6'/>")
                x+=w+0.35
    # rune letters (an original magic script): start on the shelves, drift into the book and fade
    RUNES=['M-1.4 -2.4 V2.4 M-1.4 -2.4 L1.4 -.6 M-1.4 .2 L1.4 2','M-1.4 -2.4 L1.4 2.4 M1.4 -2.4 L-1.4 2.4 M-1.4 0 H1.4','M0 -2.4 V2.4 M-1.5 -1.2 L0 .4 L1.5 -1.2',
           'M-1.4 2.4 V-2.4 H1.4 M-1.4 0 H.9','M-1.4 -2.4 L1.4 0 L-1.4 2.4 M1.4 -2.4 V2.4','M0 -2.5 L1.5 0 L0 2.5 L-1.5 0 Z M0 -1 V1',
           'M-1.4 -2.4 V2.4 M1.4 -2.4 V2.4 M-1.4 1 L1.4 -1.4','M-1.5 -2.4 H1.5 M0 -2.4 V2.4 M-1.5 2.4 L0 1 L1.5 2.4']
    L=[(13,16,0),(52,14,1.1),(30,9,2.3),(11,34,3.0),(53,30,0.6),(22,22,1.8),(44,20,2.8),(38,11,3.6)]
    letters=''
    for i,(x,y,b) in enumerate(L):
        mx,my=(x+32)/2+(3 if x<32 else -3),(y+40)/2-4
        d=RUNES[i%len(RUNES)]
        if animate:
            letters+=(f"<g opacity='.9' transform='translate({mx} {my})'><path d='{d}' fill='none' stroke='#efe4ff' stroke-width='.55' stroke-linecap='round' stroke-linejoin='round' filter='url(#soft)' transform='scale(.85)'/>"
              f"<animateTransform attributeName='transform' type='translate' values='{x} {y};{mx} {my};32 40' dur='4.2s' begin='{b}s' repeatCount='indefinite'/>"
              f"<animate attributeName='opacity' values='0;1;.9;0' keyTimes='0;.2;.8;1' dur='4.2s' begin='{b}s' repeatCount='indefinite'/></g>")
        else:
            letters+=f"<g transform='translate({mx} {my})'><path d='{d}' fill='none' stroke='#efe4ff' stroke-width='.55' stroke-linecap='round' stroke-linejoin='round' filter='url(#soft)' transform='scale(.85)'/></g>"
    pulse=(f"<animate attributeName='opacity' values='.75;1;.75' dur='3s' repeatCount='indefinite'/>" if animate else '')
    return (f"<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64' width='{size}' height='{size}'>"
      f"<defs>"
      f"<radialGradient id='room' cx='50%' cy='40%' r='75%'><stop offset='0' stop-color='#3b2416'/><stop offset='.6' stop-color='#1e120a'/><stop offset='1' stop-color='#0a0604'/></radialGradient>"
      f"<linearGradient id='spine' x1='0' y1='0' x2='1' y2='0'><stop offset='0' stop-color='#000' stop-opacity='.55'/><stop offset='.35' stop-color='#fff' stop-opacity='.12'/><stop offset='.6' stop-color='#000' stop-opacity='0'/><stop offset='1' stop-color='#000' stop-opacity='.6'/></linearGradient>"
      f"<linearGradient id='shelf' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#6a4326'/><stop offset='1' stop-color='#2e1b0e'/></linearGradient>"
      f"<radialGradient id='lamp' cx='50%' cy='0%' r='60%'><stop offset='0' stop-color='#ffcf7a' stop-opacity='.55'/><stop offset='1' stop-color='#ffcf7a' stop-opacity='0'/></radialGradient>"
      f"<radialGradient id='glow' cx='50%' cy='66%' r='50%'><stop offset='0' stop-color='{c1}' stop-opacity='.9'/><stop offset='.4' stop-color='{c1}' stop-opacity='.28'/><stop offset='1' stop-color='{c1}' stop-opacity='0'/></radialGradient>"
      f"<linearGradient id='page' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#fff6dc'/><stop offset='1' stop-color='#d9bf86'/></linearGradient>"
      f"<linearGradient id='stand' x1='0' y1='0' x2='1' y2='0'><stop offset='0' stop-color='#24150b'/><stop offset='.5' stop-color='#5a3820'/><stop offset='1' stop-color='#1c1008'/></linearGradient>"
      f"<filter id='soft' x='-50%' y='-50%' width='200%' height='200%'><feGaussianBlur stdDeviation='.35' result='b'/><feMerge><feMergeNode in='b'/><feMergeNode in='SourceGraphic'/></feMerge></filter>"
      f"<radialGradient id='vig' cx='50%' cy='50%' r='70%'><stop offset='.6' stop-color='#000' stop-opacity='0'/><stop offset='1' stop-color='#000' stop-opacity='.65'/></radialGradient>"
      f"</defs>"
      f"<rect width='64' height='64' rx='14' fill='url(#room)'/><rect width='64' height='64' rx='14' fill='url(#lamp)'/>"
      f"<rect x='3.5' y='8' width='15' height='46' rx='1.2' fill='url(#shelf)'/><rect x='45.5' y='8' width='15' height='46' rx='1.2' fill='url(#shelf)'/>"
      f"<rect x='4.6' y='9.5' width='12.8' height='43' fill='#120a05' opacity='.75'/><rect x='46.6' y='9.5' width='12.8' height='43' fill='#120a05' opacity='.75'/>{books}"
      + ''.join(f"<rect x='{x}' y='{y}' width='15' height='1.5' fill='#7c5230'/><rect x='{x}' y='{y+1.5}' width='15' height='.7' fill='#000' opacity='.45'/>" for x in (3.5,45.5) for y in (21.5,35.5,49.5)) +
      f"<circle cx='32' cy='41' r='22' fill='url(#glow)'>{pulse}</circle>"
      + ''.join(f"<ellipse cx='32' cy='{cy}' rx='{rx}' ry='{ry}' fill='none' stroke='{c1}' stroke-width='.6' opacity='{op}'/>" for cy,rx,ry,op in [(36,12,2.6,.55),(30,9,1.9,.35),(25,6,1.3,.22)]) +
      letters +
      f"<path d='M25.5 61 L27 48.5 H37 L38.5 61 Z' fill='url(#stand)'/><rect x='22.5' y='46.5' width='19' height='3' rx='1.2' fill='#4a2d18'/><rect x='22.5' y='46.5' width='19' height='1' rx='.5' fill='#8a5a34' opacity='.6'/>"
      f"<path d='M32 46.6 C27.4 44.6 22 44.4 18.2 46 L19 38.6 C22.6 36.9 28 37 32 39.6 Z' fill='url(#page)'/><path d='M32 46.6 C36.6 44.6 42 44.4 45.8 46 L45 38.6 C41.4 36.9 36 37 32 39.6 Z' fill='url(#page)'/>"
      f"<path d='M32 39.6 V46.6' stroke='#8a6a3a' stroke-width='.5'/><path d='M18.2 46 C22 44.4 27.4 44.6 32 46.6 C36.6 44.6 42 44.4 45.8 46' fill='none' stroke='#6b4a22' stroke-width='.5' opacity='.6'/>"
      + ''.join(f"<path d='M{x1} {y} Q{(x1+x2)/2} {y-1} {x2} {y}' stroke='#7a5a30' stroke-width='.3' fill='none' opacity='.5'/>" for x1,x2,y in [(21,30,41),(21,30,42.8),(34,43,41),(34,43,42.8)]) +
      f"<rect width='64' height='64' rx='14' fill='url(#vig)'/></svg>")
OG=os.path.join(SITE,'simulations','og');os.makedirs(OG,exist_ok=True)
def font(sz,bold=True):
    for p in ['/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf' if bold else '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf','/usr/share/fonts/dejavu/DejaVuSans-Bold.ttf']:
        if os.path.exists(p):return ImageFont.truetype(p,sz)
    return ImageFont.load_default()
def hexrgb(h):h=h.lstrip('#');return tuple(int(h[i:i+2],16) for i in (0,2,4))
def cover(im,w,h):
    k=max(w/im.width,h/im.height);im=im.resize((int(im.width*k)+1,int(im.height*k)+1));x=(im.width-w)//2;y=(im.height-h)//2;return im.crop((x,y,x+w,y+h))
def wrap(d,text,f,maxw):
    words=text.split();lines=[];cur=''
    for w in words:
        t=(cur+' '+w).strip()
        if d.textlength(t,font=f)<=maxw:cur=t
        else:lines.append(cur);cur=w
    if cur:lines.append(cur)
    return lines[:2]
# 1200x630 share pictures
for s in SIMS:
    src=os.path.join(SITE,'simulations','img',s['id']+'.jpg')
    if not os.path.exists(src):continue
    im=cover(Image.open(src).convert('RGB'),1200,630);d=ImageDraw.Draw(im,'RGBA')
    d.rectangle((0,410,1200,630),fill=(6,8,15,215));col=hexrgb(s.get('color','#9fa8ff'));d.rectangle((0,404,1200,410),fill=col+(255,))
    d.text((48,428),s['name'],font=font(64),fill=(255,255,255));y=508
    for line in wrap(d,s['tag'],font(30,False),1100):d.text((50,y),line,font=font(30,False),fill=(205,212,235));y+=40
    lab='Free · plays in your browser';tw=d.textlength(lab,font=font(24));d.rounded_rectangle((1150-tw-22,26,1172,72),radius=23,fill=(6,8,15,215));d.text((1150,38),lab,font=font(24),fill=(255,255,255),anchor='ra')
    im.save(os.path.join(OG,s['id']+'.jpg'),quality=82)
# the Our Simulations! picture: a collage
tiles=[Image.open(os.path.join(SITE,'simulations','img',s['id']+'.jpg')).convert('RGB') for s in SIMS if s['id']!='quasar' and os.path.exists(os.path.join(SITE,'simulations','img',s['id']+'.jpg'))][:8]
hub=Image.new('RGB',(1200,630),(6,8,15))
for i,t in enumerate(tiles):hub.paste(cover(t,300,180),((i%4)*300,(i//4)*180))
d=ImageDraw.Draw(hub,'RGBA');d.rectangle((0,330,1200,630),fill=(6,8,15,235));d.text((48,370),'Our Simulations!',font=font(84),fill=(255,210,80))
d.text((52,480),f'{len([s for s in SIMS if s["id"]!="quasar"])} free simulators: space, life, Earth, chemistry, cities and more',font=font(30,False),fill=(215,220,240))
d.text((52,530),'Plus Quasar AI. No download, works on phones.',font=font(30,False),fill=(170,178,205))
hub.save(os.path.join(OG,'hub.jpg'),quality=84)
# app icons for "add to home screen": the orbit logo, drawn at full size by a headless browser
open(os.path.join(OG,'logo.svg'),'w').write(logo_svg('#b388ff',size=512,animate=False))
open(os.path.join(OG,'logo-anim.svg'),'w').write(logo_svg('#b388ff',size=96,animate=True))
import subprocess
subprocess.run(['node','-e',"const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();for(const s of [192,512]){const p=await b.newPage({viewport:{width:s,height:s}});await p.goto('file://"+OG+"/logo.svg');await p.setViewportSize({width:s,height:s});await p.evaluate(s=>{const v=document.querySelector('svg');v.setAttribute('width',s);v.setAttribute('height',s);document.documentElement.style.margin=0},s);await p.screenshot({path:'"+OG+"/icon'+s+'.png',omitBackground:true});await p.close()}await b.close()})()"],check=True)
json.dump({"name":"Our Simulations!","short_name":"Simulators","start_url":"./","scope":"./","display":"standalone","background_color":"#06080f","theme_color":"#06080f",
  "description":"Free simulators that run in your browser.","icons":[{"src":"simulations/og/icon192.png","sizes":"192x192","type":"image/png"},{"src":"simulations/og/icon512.png","sizes":"512x512","type":"image/png","purpose":"any maskable"}]},open(os.path.join(SITE,'manifest.webmanifest'),'w'),indent=1)
def favicon(letter,colour):
    svg=logo_svg(colour)
    return 'data:image/svg+xml,'+svg.replace('#','%23').replace('<','%3C').replace('>','%3E').replace('"',"'")
SHARE_JS="""<script>(()=>{const go=()=>{if(document.getElementById('shareBtn'))return;const at=document.getElementById('hSims')||document.querySelector('.chips');if(!at)return;
const b=document.createElement(at.id==='hSims'?'button':'a');b.id='shareBtn';b.className=at.id==='hSims'?'chip':'count';b.href='javascript:void 0';b.type='button';b.innerHTML='<svg width="13" height="13" viewBox="0 0 20 20" style="display:inline-block;vertical-align:-2px;margin-right:5px"><circle cx="15" cy="4.5" r="2.5" fill="none" stroke="currentColor" stroke-width="1.7"/><circle cx="5" cy="10" r="2.5" fill="none" stroke="currentColor" stroke-width="1.7"/><circle cx="15" cy="15.5" r="2.5" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="M7.2 8.8l5.6-3M7.2 11.2l5.6 3" stroke="currentColor" stroke-width="1.7"/></svg>Share';
b.onclick=async e=>{e.preventDefault();const d={title:document.title,text:(document.querySelector('meta[name=description]')||{}).content||document.title,url:location.href.split('#')[0]};
 try{if(navigator.share){await navigator.share(d);return}}catch(x){if(x&&x.name==='AbortError')return}try{await navigator.clipboard.writeText(d.url);b.lastChild.textContent='Link copied!';setTimeout(()=>b.lastChild.textContent='Share',2000)}catch(x){prompt('Copy this link:',d.url)}};
if(at.id==='hSims')at.after(b);else at.appendChild(b)};if(document.readyState!=='loading')go();else document.addEventListener('DOMContentLoaded',go);setTimeout(go,1500)})();</script>"""
def block(title,desc,url,img,icon,ld):
    e=lambda s:html.escape(s,quote=True)
    return ('<!--SEO-->\n'+f'<link rel="canonical" href="{e(url)}">\n<meta name="robots" content="index,follow">\n<meta name="theme-color" content="#06080f">\n'
      f'<link rel="icon" href="{e(icon)}">\n<link rel="manifest" href="{BASE}manifest.webmanifest">\n<link rel="apple-touch-icon" href="{BASE}simulations/og/icon192.png">\n'
      f'<meta property="og:type" content="website">\n<meta property="og:site_name" content="Our Simulations!">\n<meta property="og:title" content="{e(title)}">\n<meta property="og:description" content="{e(desc)}">\n'
      f'<meta property="og:url" content="{e(url)}">\n<meta property="og:image" content="{e(img)}">\n<meta property="og:image:width" content="1200">\n<meta property="og:image:height" content="630">\n'
      f'<meta name="twitter:card" content="summary_large_image">\n<meta name="twitter:title" content="{e(title)}">\n<meta name="twitter:description" content="{e(desc)}">\n<meta name="twitter:image" content="{e(img)}">\n'
      f'<script type="application/ld+json">{json.dumps(ld)}</script>\n'+SHARE_JS+'\n<!--/SEO-->')
def put(path,blk,desc):
    t=open(path,encoding='utf-8').read();t=re.sub(r'<!--SEO-->.*?<!--/SEO-->\n?','',t,flags=re.S)
    if 'name="description"' not in t:t=t.replace('</title>','</title>\n<meta name="description" content="'+html.escape(desc,quote=True)+'">',1)
    i=t.find('</head>')
    if i<0:i=t.find('<body');
    t=t[:i]+blk+'\n'+t[i:];open(path,'w',encoding='utf-8').write(t)
urls=[BASE]
for s in SIMS:
    rel=s['url'].split('/Simulators/',1)[1];p=os.path.join(SITE,rel,'index.html')
    if not os.path.exists(p):continue
    title=f"{s['name']}: free online simulator" if s['id']!='quasar' else 'Quasar AI: free AI chat, pictures and videos'
    desc=s['tag']+('. Free to play in your browser, no download. Challenges, tutorial and saved worlds.' if s['id']!='quasar' else '. Free, no sign-up.')
    ld={"@context":"https://schema.org","@type":"VideoGame" if s['id']!='quasar' else "WebApplication","name":s['name'],"description":desc,"url":s['url'],"image":f"{BASE}simulations/og/{s['id']}.jpg",
        "applicationCategory":"GameApplication" if s['id']!='quasar' else "UtilitiesApplication","operatingSystem":"Any (web browser)","genre":"Simulation","isAccessibleForFree":True,"offers":{"@type":"Offer","price":"0","priceCurrency":"USD"}}
    put(p,block(title,desc,s['url'],f"{BASE}simulations/og/{s['id']}.jpg",favicon(s['name'][0],s.get('color','#9fa8ff')),ld),desc);urls.append(s['url'])
hubdesc=f"{len([s for s in SIMS if s['id']!='quasar'])} free simulators that run in your browser: space, ecosystems, plate tectonics, weather, chemistry, oceans, trains, roads, ants, electricity, ships and planes. Plus Quasar AI."
hubld={"@context":"https://schema.org","@type":"WebSite","name":"Our Simulations!","url":BASE,"description":hubdesc,"hasPart":[{"@type":"VideoGame","name":s['name'],"url":s['url']} for s in SIMS if s['id']!='quasar']}
for p in [os.path.join(SITE,'index.html'),os.path.join(SITE,'simulations','index.html')]:
    put(p,block('Our Simulations! Free online simulators',hubdesc,BASE,BASE+'simulations/og/hub.jpg',favicon('S','#b388ff'),hubld),hubdesc)
open(os.path.join(SITE,'sitemap.xml'),'w').write('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'+''.join(f'  <url><loc>{u}</loc><changefreq>weekly</changefreq><priority>{"1.0" if u==BASE else "0.8"}</priority></url>\n' for u in urls)+'</urlset>\n')
print('seo pages',len(urls),'share pictures',len(os.listdir(OG)))
