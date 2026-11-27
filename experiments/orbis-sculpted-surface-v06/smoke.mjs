import { chromium } from 'playwright';
const browser=await chromium.launch({headless:true,args:[
 '--no-sandbox','--enable-unsafe-swiftshader','--enable-webgl',
 '--use-angle=swiftshader','--use-gl=angle'
]});
const failures=[];
for(const [theme,w,h] of [['dark',390,844],['light',390,844],['desktop',1366,850]]){
 const page=await browser.newPage({viewport:{width:w,height:h},deviceScaleFactor:1});
 const errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
 await page.goto('http://127.0.0.1:4173/',{waitUntil:'load'});
 await page.waitForTimeout(1000);
 if(theme==='light')await page.locator('#themeLight').click();
 await page.locator('[data-mode="listen"]').click();
 await page.waitForTimeout(320);
 await page.locator('[data-mode="speak"]').click();
 await page.waitForTimeout(450);
 const diagnostic=await page.evaluate(()=>window.orbisDiagnostics?.());
 const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);
 await page.screenshot({path:'test-results/'+theme+'.png',fullPage:true});
 console.log(theme,JSON.stringify({diag:diagnostic,overflow,errors}));
 if(!diagnostic||diagnostic.error||errors.length||overflow)failures.push({theme,diagnostic,overflow,errors});
 await page.close();
}
await browser.close();
if(failures.length){console.error('smoke failed',JSON.stringify(failures));process.exit(1)}
console.log('PASS: WebGL renderer and controls with screenshot artifacts; visual fidelity still NOT approved');
