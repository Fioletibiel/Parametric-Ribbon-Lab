const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function main() {
 const browser = await chromium.launch({headless:true,args:['--no-sandbox','--disable-gpu-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--enable-webgl']});
 const directory = path.resolve('docs/renders/exp03/v05');
 const results = {};
 for (const [view,width,height] of [['mobile',390,850],['desktop',1320,920]]) {
   const page = await browser.newPage({viewport:{width,height},deviceScaleFactor:1});
   const errors = [];
   page.on('pageerror', e=>errors.push(String(e)));
   page.on('console', m=>{if(m.type()==='error')errors.push(m.text())});
   await page.goto('file://'+directory+'/index.html',{waitUntil:'load'});
   await page.waitForTimeout(2500);
   const dark = await page.evaluate(()=>window.__orbisLab?.());
   await page.screenshot({path:'out/'+view+'-dark.png',fullPage:true});
   await page.click('#light'); await page.click('[data-state="speak"]');
   await page.waitForTimeout(2000);
   const light = await page.evaluate(()=>window.__orbisLab?.());
   await page.screenshot({path:'out/'+view+'-light-speaking.png',fullPage:true});
   const overflow = await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);
   results[view]={dark,light,errors,overflow};
   await page.close();
 }
 console.log(JSON.stringify(results,null,2));
 fs.writeFileSync('out/checks.json',JSON.stringify(results,null,2));
 await browser.close();
 if(Object.values(results).some(r=>r.errors.length || r.overflow || !r.dark?.webgl || !r.light?.webgl)) process.exitCode=1;
}
main().catch(e=>{console.error(e);process.exit(1)});
