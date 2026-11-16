import {chromium} from 'playwright';import fs from 'node:fs';import crypto from 'node:crypto';
const browser=await chromium.launch({headless:true,args:['--use-gl=angle','--use-angle=swiftshader','--enable-webgl','--enable-unsafe-swiftshader','--no-sandbox']});
const errors=[],reports=[];const outputs=new Map();
try{
 for(const [view,w,h] of [['desktop',1200,950],['mobile',390,844]]){
  const context=await browser.newContext({viewport:{width:w,height:h},deviceScaleFactor:1});
  const page=await context.newPage();page.on('pageerror',e=>errors.push(view+': '+e.message));
  page.on('console',m=>{if(m.type()==='error')errors.push(view+': '+m.text())});
  await page.goto('http://127.0.0.1:4173/',{waitUntil:'domcontentloaded',timeout:30000});
  for(const mode of ['a','b','c']){
   await page.locator('[data-m="'+mode+'"]').click();
   for(const theme of ['dark','light']){
    if(theme==='light')await page.locator('#theme').click();
    await page.waitForTimeout(mode==='c'?3000:950);
    const stat=await page.locator('#status').innerText();
    const state=await page.evaluate(()=>({w:document.querySelector('canvas').width,h:document.querySelector('canvas').height,
      overflow:document.documentElement.scrollWidth>innerWidth+3,
      alpha:(()=>{const c=document.querySelector('canvas');const b=document.createElement('canvas');b.width=300;b.height=220;const cx=b.getContext('2d');cx.drawImage(c,0,0,300,220);const pixels=cx.getImageData(0,0,300,220).data;let n=0;for(let i=3;i<pixels.length;i+=4)if(pixels[i]>5)n++;return n})()}));
    const id=view+'-'+mode+'-'+theme;
    fs.mkdirSync('screenshots',{recursive:true});
    const png=await page.locator('.stage').screenshot({path:'screenshots/'+id+'.png',timeout:45000});
    const sig=crypto.createHash('sha256').update(png).digest('hex').slice(0,10);
    reports.push({id,status:stat,...state,hash:sig});
    outputs.set(id,sig);
    if(state.overflow)errors.push(id+': horizontal overflow');
    if(stat.toLowerCase().includes('błąd'))errors.push(id+': '+stat);
    if(state.alpha<50)errors.push(id+': image too empty ('+state.alpha+')');
    if(theme==='light')await page.locator('#theme').click();
   }
  }
  await context.close();
 }
 console.log('VISUAL_SMOKE_REPORT',JSON.stringify(reports,null,2));
 for(const mode of ['a','b','c'])if(outputs.get('desktop-'+mode+'-dark')===outputs.get('desktop-'+mode+'-light'))errors.push(mode+': identical light/dark images');
 if(errors.length)throw Error(errors.join('\n'));console.log('SMOKE_PASS');
}finally{await browser.close()}