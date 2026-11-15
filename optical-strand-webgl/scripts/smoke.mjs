import{chromium}from'playwright';
import fs from'node:fs';
const base='http://127.0.0.1:4173/';
const browser=await chromium.launch({headless:true,args:['--use-gl=angle','--use-angle=swiftshader','--enable-webgl','--enable-unsafe-swiftshader']});
const errors=[];
try{
 for(const [name,w,h]of[['desktop',1440,900],['mobile',390,844]]){
  const context=await browser.newContext({viewport:{width:w,height:h},deviceScaleFactor:1});
  const page=await context.newPage();
  page.on('pageerror',e=>errors.push(name+': '+e.message));
  page.on('console',msg=>{if(msg.type()==='error')errors.push(name+': console: '+msg.text())});
  await page.goto(base,{waitUntil:'networkidle',timeout:40000});
  await page.waitForTimeout(2600);
  const state=await page.evaluate(()=>{
   const canvas=document.querySelector('.visual canvas');
   return{webgl2:!!document.createElement('canvas').getContext('webgl2'),
    canvas:!!canvas,overflow:document.documentElement.scrollWidth>innerWidth+2,
    canvasWidth:canvas?.clientWidth||0,stageHeight:document.querySelector('.stage')?.clientHeight||0};
  });
  console.log(name,JSON.stringify(state));
  fs.mkdirSync('out/screenshots',{recursive:true});
  await page.locator('.stage').screenshot({path:'out/screenshots/'+name+'-dark.png'});
  await page.getByRole('button',{name:'Jasny motyw'}).click().catch(async()=>{await page.getByText('Light',{exact:true}).click()});
  await page.waitForTimeout(1300);
  await page.locator('.stage').screenshot({path:'out/screenshots/'+name+'-light.png'});
  await page.getByRole('button',{name:'Mówienie'}).click();
  await page.waitForTimeout(400);
  const pressed=await page.getByRole('button',{name:'Mówienie'}).getAttribute('aria-pressed');
  console.log(name,'speak-state',pressed);
  if(state.overflow)throw Error(name+': horizontal overflow');
  if(!state.canvas)throw Error(name+': canvas not mounted');
  if(pressed!=='true')throw Error(name+': mode control broken');
  await context.close();
 }
 if(errors.length)throw Error('Browser errors:\n'+errors.join('\n'));
 console.log('SMOKE_OK — screenshots and controls passed');
}finally{await browser.close()}
