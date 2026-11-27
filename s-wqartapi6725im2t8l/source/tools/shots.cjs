// Takes a preview picture of every simulator's home screen for the "Our Simulations!" page.
// Usage: node shots.cjs [--all]   (without --all, only simulators that have no picture yet)
const fs=require('fs'),path=require('path'),{chromium}=require('playwright');
const SITE='/home/user/barycenter-site',OUT=path.join(SITE,'simulations','img');
(async()=>{fs.mkdirSync(OUT,{recursive:true});const sims=JSON.parse(fs.readFileSync(path.join(SITE,'sims.json'),'utf8'));const all=process.argv.includes('--all');
  const b=await chromium.launch();
  for(const s of sims){const out=path.join(OUT,s.id+'.jpg');if(!all&&fs.existsSync(out))continue;
    const rel=s.url.replace('https://jacob711-oss.github.io/Simulators/','');const file=path.join(SITE,rel,'index.html');if(!fs.existsSync(file)){console.log('skip',s.id);continue}
    const p=await b.newPage({viewport:{width:1280,height:800}});await p.goto('file://'+file);await p.waitForTimeout(7000);const hasCv=await p.$('canvas');if(hasCv)await p.addStyleTag({content:'body *:not(canvas){visibility:hidden!important}canvas{visibility:visible!important}'});await p.waitForTimeout(400);
    // the live world behind the title, to the right of the menu
    await p.screenshot({path:out,type:'jpeg',quality:72,clip:hasCv?{x:440,y:120,width:800,height:500}:{x:240,y:40,width:800,height:500}});await p.close();console.log('shot',s.id)}
  await b.close()})();
