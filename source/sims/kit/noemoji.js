/* ===== flat icons: every emoji in labels, buttons and messages is drawn as a flat one-colour silhouette instead of a colourful emoji ===== */
(function(){
  if(window.__noEmoji)return;window.__noEmoji=true;
  const RE=/(?:\p{Extended_Pictographic}|\p{Regional_Indicator})(?:️|⃣)?(?:‍(?:\p{Extended_Pictographic})(?:️)?)*|[\u{1F3FB}-\u{1F3FF}]/gu,HAS=/\p{Extended_Pictographic}|\p{Regional_Indicator}/u;
  const KEEP=new Set([...'★☆✓✔✗✕✖×→←↑↓↔⤢⊗⊙▸◂−±°©®™']);
  const strip=s=>s.replace(RE,m=>KEEP.has(m)?m:'').replace(/[️‍]/g,'').replace(/ {2,}/g,' ');
  window.noEmoji=strip;
  // emoji drawn on a square background turn into plain squares as silhouettes: swap them for ones that make good flat icons
  const SWAP={'⚛️':'🧪','⚛':'🧪','☢️':'⚠️','☯️':'⭐','🔆':'☀️','🔅':'☀️','🔃':'⇄','🔀':'⇄','🌌':'✨','🚇':'🚈','🌉':'🏗️','🔄':'⇄','🔁':'⟳','🆕':'+','🌁':'🏗️','🌃':'🌙','🌄':'⛰️','🌅':'☀️','🏞️':'⛰️','🎑':'🌙','🖼️':'🎨'};
  const PLAIN=new Set(['OPTION','TITLE','TEXTAREA','SCRIPT','STYLE','INPUT']);
  // turn one text node into text + flat icon spans
  function flatten(n){const p=n.parentElement;if(!p||p.classList.contains('fi')||p.closest('.fi'))return;
    if(PLAIN.has(p.tagName)||p.closest('svg')){n.nodeValue=strip(n.nodeValue);return}
    const s=n.nodeValue;RE.lastIndex=0;let m,last=0,parts=[];
    while((m=RE.exec(s))){if(KEEP.has(m[0]))continue;if(m.index>last)parts.push(document.createTextNode(s.slice(last,m.index)));const sw=SWAP[m[0]]||SWAP[m[0].replace(/\uFE0F/g,'')];const g=sw||m[0];if(sw&&!HAS.test(sw)){parts.push(document.createTextNode(sw))}else{const sp=document.createElement('span');sp.className='fi';sp.setAttribute('aria-hidden','true');sp.textContent=g;parts.push(sp)}last=m.index+m[0].length}
    if(!parts.length)return;if(last<s.length)parts.push(document.createTextNode(s.slice(last)));const f=document.createDocumentFragment();parts.forEach(x=>f.appendChild(x));p.replaceChild(f,n)}
  function clean(root){if(!root)return;if(root.nodeType===3){if(HAS.test(root.nodeValue))flatten(root);return}
    if(root.nodeType!==1||PLAIN.has(root.tagName)&&root.tagName!=='OPTION'&&root.tagName!=='TITLE')return;if(root.classList&&root.classList.contains('fi'))return;
    for(const a of ['title','aria-label','placeholder','alt'])if(root.hasAttribute&&root.hasAttribute(a)&&HAS.test(root.getAttribute(a)))root.setAttribute(a,strip(root.getAttribute(a)).trim());
    const w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT|NodeFilter.SHOW_ELEMENT);const texts=[];let n;
    while((n=w.nextNode())){if(n.nodeType===1){for(const a of ['title','aria-label','placeholder','alt'])if(n.hasAttribute(a)&&HAS.test(n.getAttribute(a)))n.setAttribute(a,strip(n.getAttribute(a)).trim());continue}if(HAS.test(n.nodeValue))texts.push(n)}
    texts.forEach(flatten)}
  // canvas labels: emoji are left out there (the map draws its own shapes)
  for(const P of [window.CanvasRenderingContext2D&&CanvasRenderingContext2D.prototype,window.OffscreenCanvasRenderingContext2D&&OffscreenCanvasRenderingContext2D.prototype])if(P)for(const f of ['fillText','strokeText']){const o=P[f];P[f]=function(t,...a){if(typeof t==='string'&&HAS.test(t)){t=strip(t).trim();if(!t)return}return o.call(this,t,...a)}}
  const css=document.createElement('style');
  css.textContent='.fi{display:inline-block;line-height:1;font-style:normal;filter:brightness(0) drop-shadow(1px 0 0 #fff) drop-shadow(-1px 0 0 #fff) drop-shadow(0 1px 0 #fff) drop-shadow(0 -1px 0 #fff);opacity:.92;vertical-align:-.08em}.ne-lab{display:none}';
  const go=()=>{document.head.appendChild(css);document.title=strip(document.title).trim();clean(document.body);
    new MutationObserver(ms=>{for(const m of ms){if(m.type==='characterData'){if(m.target.parentElement&&!m.target.parentElement.classList.contains('fi'))clean(m.target)}else if(m.type==='attributes')clean(m.target);else for(const x of m.addedNodes)clean(x)}}).observe(document.body,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['title','aria-label','placeholder']})};
  if(document.body)go();else document.addEventListener('DOMContentLoaded',go);
})();
