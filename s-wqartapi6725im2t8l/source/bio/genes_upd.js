    const P=o.par;for(const [k] of GENES){const v=o.genes[k]??1,pv=P?((P.m[k]??1)+(P.f[k]??1))/2:null;R['g_'+k].textContent=(pv!=null?pv.toFixed(2)+'→':'')+v.toFixed(2)}
    for(const k of ['fur','heat']){const v=o.genes[k]??0,pv=P?((P.m[k]??0)+(P.f[k]??0))/2:null;R['g_'+k].textContent=(pv!=null?pv.toFixed(0)+'→':'')+v.toFixed(1)}
    R.coat.textContent=`${coatOf(o.genes)}${o.genes.from?` · ${o.genes.from.m} from mum, ${o.genes.from.f} from dad`:''}`;
    if(!R.famDone){R.famDone=1;R.fam.textContent='';const mk2=(lab,id,nm)=>{const b=document.createElement('button');b.className='btn';b.textContent=`${lab}: ${nm}`;b.onclick=()=>{const t=S.animals.find(z=>z.id===id&&!z.dead);if(t){select(t);S.follow=true}else toast(`${nm} is no longer alive`)};R.fam.appendChild(b)};
      if(P){mk2('Mother',o.mom,P.mn);if(P.fn)mk2('Father',o.dad,P.fn)}else{const sp=document.createElement('span');sp.className='note';sp.textContent='First generation: no known parents.';R.fam.appendChild(sp)}
      const kids=S.animals.filter(z=>!z.dead&&(z.mom===o.id||z.dad===o.id)).length;const sp2=document.createElement('span');sp2.className='note';sp2.textContent=` ${kids} living children${o.genes.muts?` · mutations at birth: ${o.genes.muts.join(', ')}`:''}`;R.fam.appendChild(sp2)}
    drawDNA(R.dna,o)}
