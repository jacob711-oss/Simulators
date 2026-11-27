// colour animals by a gene, to watch evolution spread across the map
function geneColor(a){const k=S.geneView,G=a.genes;if(k==='coat'){const c=coatOf(G);return c==='white'?'#ffffff':c==='dark'?'#222':(G.coat||'').includes('w')?'#ffd27a':'#c08850'}
  const def=GENES.find(x=>x[0]===k),v=k==='fur'||k==='heat'?(G[k]??0)/15:((G[k]??1)-1)/((def?def[3]:2)-1);const t=clamp(0.5+v*1.4,0,1);return `rgb(${Math.round(lerp(60,255,t))},${Math.round(lerp(120,90,Math.abs(t-.5)*2))},${Math.round(lerp(255,60,t))})`}
function drawGeneView(vx0,vx1,vy0,vy1,z){const r=Math.max(2.5,z*3.2);for(const a of S.animals){if(a.dead||a.x<vx0||a.x>vx1||a.y<vy0||a.y>vy1)continue;ctx.strokeStyle=geneColor(a);ctx.lineWidth=Math.max(1.5,z*.9);ctx.beginPath();ctx.arc(sx(a.x),sy(a.y),r+SP[a.sp].len*z*0.35,0,TAU);ctx.stroke()}}
