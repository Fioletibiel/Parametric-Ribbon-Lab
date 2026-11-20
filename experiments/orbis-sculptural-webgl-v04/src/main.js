import './style.css';
import * as THREE from 'three';

const canvas = document.getElementById('scene');
const notice = document.getElementById('unsupported');
const metrics = document.getElementById('metrics');
const stateName = document.getElementById('stateName');
let renderer;
try {
  renderer = new THREE.WebGLRenderer({
    canvas, alpha: true, antialias: true, powerPreference: 'high-performance',
    premultipliedAlpha: false, preserveDrawingBuffer: false
  });
} catch (err) {
  notice.hidden = false;
  notice.textContent = 'Brak WebGL: ' + err.message;
  throw err;
}
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.65));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.14;
renderer.setClearColor(0x000000, 0);
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 60);
camera.position.set(0, 0.10, 7.1);
camera.lookAt(0,0,0);
const orbGroup = new THREE.Group();
scene.add(orbGroup);
const R = 1.62;

// An entirely procedural HDR-ish soft studio environment. No raster art is
// used as the Orbis itself: the environment only controls optical responses.
function envTexture(light) {
  const w = 512, h = 256;
  const c = document.createElement('canvas'); c.width=w;c.height=h;
  const ctx = c.getContext('2d');
  const data = ctx.createImageData(w,h);
  const blobs = [
    [.26,.34,.14,.23,1.45], [.67,.28,.07,.31,.62],
    [.91,.66,.18,.12,.91], [.49,.87,.26,.08,.46]
  ];
  for (let y=0;y<h;y++) for(let x=0;x<w;x++) {
    const u=x/w, v=y/h;
    let soft=0;
    for(const b of blobs){
      const dx=Math.min(Math.abs(u-b[0]),1-Math.abs(u-b[0]))/b[2];
      const dy=(v-b[1])/b[3];
      soft+=b[4]*Math.exp(-.7*(dx*dx+dy*dy));
    }
    const base=light ? [164,151,146] : [34,31,37];
    const z=Math.min(1,soft);
    const i=(y*w+x)*4;
    data.data[i]=Math.min(255,base[0]+z*(light?82:210));
    data.data[i+1]=Math.min(255,base[1]+z*(light?91:207));
    data.data[i+2]=Math.min(255,base[2]+z*(light?94:203));
    data.data[i+3]=255;
  }
  ctx.putImageData(data,0,0);
  const tex=new THREE.CanvasTexture(c);
  tex.mapping=THREE.EquirectangularReflectionMapping;
  tex.colorSpace=THREE.SRGBColorSpace;
  return tex;
}
const pmrem = new THREE.PMREMGenerator(renderer);
const envDark=pmrem.fromEquirectangular(envTexture(false)).texture;
const envLight=pmrem.fromEquirectangular(envTexture(true)).texture;
scene.environment=envDark;

// Actual glass geometry (back and front hemisphere, not a 2D circle).
const glassGeom = new THREE.SphereGeometry(R, 96, 64);
const glassVert = [
  'varying vec3 vNormalW;',
  'varying vec3 vWorld;',
  'varying vec3 vLocal;',
  'void main(){',
  ' vec4 wp=modelMatrix*vec4(position,1.0);',
  ' vWorld=wp.xyz; vLocal=position;',
  ' vNormalW=normalize(mat3(modelMatrix)*normal);',
  ' gl_Position=projectionMatrix*viewMatrix*wp;',
  '}'
].join('\n');
const glassFrag = [
  'precision highp float;',
  'uniform float uTheme, uGlass, uTime;',
  'varying vec3 vNormalW,vWorld,vLocal;',
  'float gauss(vec2 p,vec2 c,vec2 sigma){vec2 q=(p-c)/sigma;return exp(-dot(q,q)*0.9);}',
  'void main(){',
  ' vec3 N=normalize(vNormalW);',
  ' vec3 V=normalize(cameraPosition-vWorld);',
  ' float front=clamp(dot(N,V),0.0,1.0);',
  ' float rim=pow(1.0-front,2.8);',
  ' float box1=gauss(vLocal.xy,vec2(-0.77,0.94),vec2(0.46,0.65));',
  ' float box2=gauss(vLocal.xy,vec2(1.13,-1.20),vec2(.44,.39));',
  ' float curved=pow(max(0.0,dot(reflect(-normalize(vec3(-.5,.7,.5)),N),V)),16.0);',
  ' float hot=clamp(box1*.73+box2*.46+curved*.29,0.0,1.0);',
  ' vec3 smoke=mix(vec3(.18,.12,.15),vec3(.35,.27,.28),uTheme);',
  ' vec3 ivory=mix(vec3(.95,.89,.86),vec3(1.0,.97,.93),uTheme);',
  ' vec3 col=mix(smoke,ivory,clamp(hot*1.05+rim*.42,0.0,1.0));',
  ' col+=vec3(.48,.18,.27)*pow(rim,1.55)*.13;',
  ' float alpha=clamp((.024+.22*rim+.31*hot)*(.36+uGlass*.9),0.0,.67);',
  ' gl_FragColor=vec4(col,alpha);',
  '}'
].join('\n');
const glassUniforms = {
  uTheme:{value:0}, uGlass:{value:.6},uTime:{value:0}
};
const frontGlass=new THREE.Mesh(glassGeom,new THREE.ShaderMaterial({
  vertexShader:glassVert,fragmentShader:glassFrag,uniforms:glassUniforms,
  transparent:true,side:THREE.FrontSide,depthWrite:false,depthTest:true
}));
frontGlass.renderOrder=30;
orbGroup.add(frontGlass);
const backGlass=new THREE.Mesh(glassGeom,new THREE.MeshPhysicalMaterial({
  color:0xc4b1ae,metalness:0.015,roughness:0.09,transmission:.92,
  thickness:.15,ior:1.32,envMapIntensity:.68,side:THREE.BackSide,
  depthWrite:false,transparent:true,opacity:.16
}));
backGlass.renderOrder=-5;
orbGroup.add(backGlass);
// Explicit sharp outer edge trace, using actual shell mesh normals.
const rimVert=glassVert;
const rimFrag=[
  'precision highp float;', 'uniform float uTheme;', 'varying vec3 vNormalW,vWorld,vLocal;',
  'void main(){',
  ' vec3 N=normalize(vNormalW),V=normalize(cameraPosition-vWorld);',
  ' float a=pow(1.0-abs(dot(N,V)),9.0);',
  ' vec3 c=mix(vec3(.93,.74,.71),vec3(.55,.39,.42),uTheme);',
  ' gl_FragColor=vec4(c,a*.7);',
  '}'
].join('\n');
const rim=new THREE.Mesh(glassGeom,new THREE.ShaderMaterial({
  vertexShader:rimVert,fragmentShader:rimFrag,
  uniforms:{uTheme:glassUniforms.uTheme},side:THREE.FrontSide,
  transparent:true,depthWrite:false
}));
rim.renderOrder=31;orbGroup.add(rim);

// Each sheet is a separately triangulated sculptural membrane with hundreds of
// live vertices, plus fine strand geometry following exactly the SAME surface.
const definitions=[
  {
    name:'A / upper ivory architecture',kind:'ivory',w:.59,twist:-.7,
    points:[[-1.28,-.22,-.28],[-.96,.24,-.42],[-.32,.63,-.30],[.18,.92,-.28],[.87,.69,-.12],[1.31,.41,-.12]]
  },
  {
    name:'B / primary ivory fan',kind:'ivory',w:.62,twist:.70,
    points:[[-1.32,-.39,.15],[-.96,.02,.23],[-.40,-.02,.28],[.14,.43,.25],[.65,.74,.06],[1.24,.59,-.12]]
  },
  {
    name:'C / burgundy current',kind:'burgundy',w:.55,twist:-.40,
    points:[[-1.19,-.93,.13],[-.84,-.84,.35],[-.38,-.63,.48],[.18,.02,.50],[.65,.29,.27],[1.22,.19,.12]]
  },
  {
    name:'D / lower pearl return',kind:'ivory',w:.45,twist:1.15,
    points:[[-.86,-1.18,-.24],[-.34,-.96,-.02],[.17,-.42,.22],[.63,-.29,.14],[1.18,-.58,-.13]]
  },
  {
    name:'E / rear translucent arch',kind:'shadow',w:.52,twist:-.35,
    points:[[-1.23,.29,-.60],[-.80,.68,-.64],[-.18,.72,-.62],[.44,.29,-.60],[1.22,.05,-.60]]
  }
];
const rows=112,cols=28,strands=42;
const surfaces=[];
const sheetVert=[
 'varying vec3 vNormalW,vWorld;',
 'varying vec2 vTex;',
 'void main(){',
 ' vWorld=(modelMatrix*vec4(position,1.0)).xyz;',
 ' vNormalW=normalize(normalMatrix*normal);',
 ' vTex=uv;',
 ' gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);',
 '}'
].join('\n');
const sheetFrag=[
 'precision highp float;',
 'uniform vec3 uBase,uHighlight;',
 'uniform float uTheme,uRed,uOpacity;',
 'varying vec3 vNormalW,vWorld;',
 'varying vec2 vTex;',
 'void main(){',
 ' vec3 V=normalize(cameraPosition-vWorld);',
 ' float grazing=pow(1.0-abs(dot(normalize(vNormalW),V)),1.75);',
 ' float edge=pow(abs(vTex.y*2.0-1.0),7.0);',
 ' float silk=pow(abs(sin(vTex.y*190.0+vTex.x*12.0)),18.0);',
 ' float glint=pow(max(dot(reflect(normalize(vec3(-.5,-.5,-1.0)),normalize(vNormalW)),V),0.0),16.0);',
 ' float shine=clamp(grazing*.62+edge*.52+glint*.42,0.0,1.0);',
 ' vec3 base=mix(uBase,uHighlight,shine*.86);',
 ' base+=uHighlight*silk*.055;',
 ' base*=mix(.88,1.11,uTheme);',
 ' float a=uOpacity*(.49+grazing*.5+edge*.26+glint*.13);',
 ' a+=uRed*.06*silk;',
 ' gl_FragColor=vec4(base,clamp(a,0.015,.68));',
 '}'
].join('\n');
function buildSurface(def,index) {
  const curve=new THREE.CatmullRomCurve3(
    def.points.map(p=>new THREE.Vector3(p[0],p[1],p[2])),false,'centripetal'
  );
  const sample=[];
  for(let i=0;i<=rows;i++) {
    const u=i/rows;
    const p=curve.getPoint(u),t=curve.getTangent(u);
    const b=new THREE.Vector3(-t.y,t.x,0).normalize();
    sample.push({p,t,b,u});
  }
  const vertices=new Float32Array((rows+1)*(cols+1)*3);
  const uvs=new Float32Array((rows+1)*(cols+1)*2);
  const indices=[];
  for(let i=0;i<=rows;i++)for(let j=0;j<=cols;j++){
    const q=i*(cols+1)+j;
    uvs[q*2]=i/rows;uvs[q*2+1]=j/cols;
    if(i<rows&&j<cols){
      const a=q,b=q+cols+1;
      indices.push(a,b,a+1,b,b+1,a+1);
    }
  }
  const g=new THREE.BufferGeometry();
  g.setAttribute('position',new THREE.BufferAttribute(vertices,3));
  g.setAttribute('uv',new THREE.BufferAttribute(uvs,2));
  g.setIndex(indices);
  const burgundy=def.kind==='burgundy',rear=def.kind==='shadow';
  const uniforms={
    uBase:{value:new THREE.Color(burgundy?0x701d37:rear?0x5d5359:0xbba49f)},
    uHighlight:{value:new THREE.Color(burgundy?0xf37a92:0xffe8dc)},
    uTheme:{value:0},uRed:{value:burgundy?1:0},
    uOpacity:{value:burgundy?.28:rear?.10:.26}
  };
  const mat=new THREE.ShaderMaterial({vertexShader:sheetVert,fragmentShader:sheetFrag,uniforms,
    transparent:true,side:THREE.DoubleSide,depthWrite:false,depthTest:true});
  const mesh=new THREE.Mesh(g,mat);
  mesh.name=def.name;mesh.renderOrder=5+index;
  orbGroup.add(mesh);
  const fiberList=[];
  for(let k=0;k<strands;k++){
    const v=-.92+1.84*k/(strands-1);
    const arr=new Float32Array((rows+1)*3);
    const fiberG=new THREE.BufferGeometry();
    fiberG.setAttribute('position',new THREE.BufferAttribute(arr,3));
    const isKey=k===0||k===strands-1||k===Math.round(strands*.47);
    const brightness=(1-Math.abs(k-(strands-1)*.49)/(strands*.61));
    const col=burgundy?(isKey?0xff9fae:0x9e5265):(isKey?0xfff1e6:0xc6aaa5);
    const m=new THREE.LineBasicMaterial({
      color:col,transparent:true,opacity:(isKey?.74:.11+Math.max(0,brightness)*.22)*(rear?.25:1),
      blending:THREE.AdditiveBlending,depthWrite:false,depthTest:true
    });
    const line=new THREE.Line(fiberG,m);
    line.frustumCulled=false;line.renderOrder=12+index;
    orbGroup.add(line);
    fiberList.push({v,arr,geo:fiberG});
  }
  // Add a wide transparent glowing border for the signature red stream.
  let halo=null;
  if(burgundy){
    const hPos=new Float32Array((rows+1)*2*3),inds=[];
    for(let i=0;i<rows;i++){
      const a=i*2;inds.push(a,a+1,a+2,a+1,a+3,a+2);
    }
    const hGeo=new THREE.BufferGeometry();
    hGeo.setAttribute('position',new THREE.BufferAttribute(hPos,3));
    hGeo.setIndex(inds);
    const hmat=new THREE.MeshBasicMaterial({
      color:0xd54e70,transparent:true,opacity:.24,
      side:THREE.DoubleSide,blending:THREE.AdditiveBlending,depthWrite:false
    });
    halo=new THREE.Mesh(hGeo,hmat);halo.renderOrder=17;
    orbGroup.add(halo);
    halo.userData={pos:hPos,geo:hGeo};
  }
  return {def,index,sample,vertices,g,mesh,uniforms,fiberList,halo};
}
definitions.forEach((d,i)=>surfaces.push(buildSurface(d,i)));
function pointOnSurface(s,i,v,time,energy,returned) {
  const item=s.sample[i],u=item.u;
  const fade=Math.pow(Math.max(.001,Math.sin(Math.PI*u)),.35);
  const flow=(.018+energy*.047)*Math.sin(6.3*u-time*(.21+energy*2.8)+s.index*.77);
  const breath=.023*Math.sin(time*.33+s.index*.68+u*3.9);
  const vx=item.b.x,vy=item.b.y;
  const angle=s.def.twist + u*(1.65-s.index*.12)+.26*Math.sin(u*5.8+s.index*.9);
  const w=s.def.w*(.22+.78*fade)*(1+.04*Math.sin(u*8+time*.2));
  const sideways=v*w;
  let x=item.p.x+vx*Math.cos(angle)*sideways+.08*Math.sin(u*3.8+s.index)*v*v;
  let y=item.p.y+vy*Math.cos(angle)*sideways+flow*fade+breath*fade;
  let z=item.p.z+Math.sin(angle)*sideways+.12*(1-v*v)*fade*Math.cos(u*5+s.index*.8+time*.12);
  // The glass is a true spatial constraint: never let a membrane protrude.
  const r=Math.hypot(x,y,z);
  if(r>R-.15){const q=(R-.15)/r;x*=q;y*=q;z*=q;}
  returned[0]=x;returned[1]=y;returned[2]=z;
  return returned;
}
const pointScratch=[0,0,0];
function updateSurface(s,time,energy) {
  const pos=s.vertices,p=pointScratch;
  for(let i=0;i<=rows;i++)for(let j=0;j<=cols;j++){
    pointOnSurface(s,i,j/cols*2-1,time,energy,p);
    const k=(i*(cols+1)+j)*3;
    pos[k]=p[0];pos[k+1]=p[1];pos[k+2]=p[2];
  }
  s.g.attributes.position.needsUpdate=true;
  s.g.computeVertexNormals();
  for(const f of s.fiberList){
    for(let i=0;i<=rows;i++){
      pointOnSurface(s,i,f.v,time,energy,p);
      const k=i*3;f.arr[k]=p[0];f.arr[k+1]=p[1];f.arr[k+2]=p[2];
    }
    f.geo.attributes.position.needsUpdate=true;
  }
  if(s.halo) {
    const a=s.halo.userData.pos;
    for(let i=0;i<=rows;i++){
      // This thin glowing geometry sits on the actual red wave's edge.
      pointOnSurface(s,i,-.93,time,energy,p);
      a[i*6]=p[0];a[i*6+1]=p[1];a[i*6+2]=p[2];
      pointOnSurface(s,i,-.77,time,energy,p);
      a[i*6+3]=p[0];a[i*6+4]=p[1];a[i*6+5]=p[2];
    }
    s.halo.userData.geo.attributes.position.needsUpdate=true;
  }
}
const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
let mode='idle',light=false,eco=false,energyIntensity=.45,glassIntensity=.60;
let autoTurn=0,manualX=0,manualY=0,dragged=false,lastX=0,lastY=0;
let lastFrame=performance.now(),time=0,frameCount=0,acc=0,smoothed=.05;
function setMode(next) {
  mode=next;
  document.querySelectorAll('[data-mode]').forEach(el=>el.classList.toggle('chosen',el.dataset.mode===next));
  stateName.textContent=next==='idle'?'Gotowy':next==='listen'?'Słucha':'Mówi';
}
document.querySelectorAll('[data-mode]').forEach(b=>b.addEventListener('click',()=>setMode(b.dataset.mode)));
function setTheme(next) {
  light=next;
  document.body.classList.toggle('theme-light',next);
  document.getElementById('dark').classList.toggle('active',!next);
  document.getElementById('light').classList.toggle('active',next);
  scene.environment=next?envLight:envDark;
  glassUniforms.uTheme.value=next?1:0;
  surfaces.forEach(s=>s.uniforms.uTheme.value=next?1:0);
  backGlass.material.envMapIntensity=next?.85:.68;
  renderer.toneMappingExposure=next?1.25:1.14;
}
document.getElementById('dark').onclick=()=>setTheme(false);
document.getElementById('light').onclick=()=>setTheme(true);
function setQuality(next) {
  eco=next;
  document.getElementById('eco').classList.toggle('active',eco);
  document.getElementById('high').classList.toggle('active',!eco);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,eco?1.0:1.65));
  resize();
}
document.getElementById('eco').onclick=()=>setQuality(true);
document.getElementById('high').onclick=()=>setQuality(false);
document.getElementById('energy').oninput=e=>{
  energyIntensity=Number(e.target.value)/100;
  document.getElementById('energyValue').textContent=e.target.value+'%';
};
document.getElementById('glass').oninput=e=>{
  glassIntensity=Number(e.target.value)/100;
  glassUniforms.uGlass.value=glassIntensity;
  document.getElementById('glassValue').textContent=e.target.value+'%';
};
canvas.addEventListener('pointerdown',e=>{
  dragged=true;lastX=e.clientX;lastY=e.clientY;
  canvas.setPointerCapture(e.pointerId);
});
canvas.addEventListener('pointermove',e=>{
  if(!dragged)return;
  manualY+=(e.clientX-lastX)*.006;
  manualX+=(e.clientY-lastY)*.005;
  manualX=THREE.MathUtils.clamp(manualX,-.52,.52);
  manualY=THREE.MathUtils.clamp(manualY,-1.5,1.5);
  lastX=e.clientX;lastY=e.clientY;
});
canvas.addEventListener('pointerup',()=>dragged=false);
canvas.addEventListener('pointercancel',()=>dragged=false);
function resize() {
  const r=canvas.getBoundingClientRect();
  if(r.width<2||r.height<2)return;
  camera.aspect=r.width/r.height;
  camera.fov=r.width<470?38:34;
  camera.position.z=(r.width<400)?7.8:7.1;
  camera.updateProjectionMatrix();
  renderer.setSize(Math.round(r.width),Math.round(r.height),false);
}
const observer=new ResizeObserver(resize);
observer.observe(canvas);
resize();
let fatal=null;
function animate(now) {
  requestAnimationFrame(animate);
  if(document.hidden||fatal)return;
  const dt=Math.min(.05,Math.max(.001,(now-lastFrame)/1000));
  lastFrame=now;
  frameCount++;acc+=dt;
  if(acc>=1) {
    metrics.textContent='WEBGL · FPS '+Math.round(frameCount/acc)
      +' · '+(eco?'ECO':'HIGH')+' · '+(renderer.getPixelRatio().toFixed(1))+'×';
    acc=0;frameCount=0;
  }
  if(eco&&frameCount%2===1)return;
  if(!reduced)time+=dt;
  let target=.045;
  if(mode==='listen')target=.19+.04*Math.sin(time*2.0);
  if(mode==='speak')target=.42+.27*Math.pow(Math.sin(time*5.3),2)*Math.pow(Math.sin(time*.75+.9),2);
  target*=energyIntensity/.45;
  smoothed+=Math.min(1,dt*4.6)*(target-smoothed);
  for(const s of surfaces)updateSurface(s,time,smoothed);
  glassUniforms.uTime.value=time;
  if(!dragged&&!reduced)autoTurn=time*.15;
  orbGroup.rotation.y=manualY+Math.sin(autoTurn)*.07;
  orbGroup.rotation.x=manualX+Math.sin(time*.18)*.018;
  orbGroup.rotation.z=Math.sin(time*.13)*.009;
  try{renderer.render(scene,camera)}catch(e){
    fatal=e;notice.hidden=false;notice.textContent='Błąd renderowania WebGL: '+e.message;
    console.error(e);
  }
}
requestAnimationFrame(animate);
canvas.addEventListener('webglcontextlost',ev=>{
  ev.preventDefault();
  fatal=new Error('Kontekst GPU utracony');
  notice.hidden=false;notice.textContent='Utracono kontekst WebGL. Odśwież stronę.';
});
window.__orbisDiagnostics=()=>({
  actualGeometry:true,meshCount:surfaces.length+3,filaments:surfaces.length*strands,
  mode,light,eco,fpsLabel:metrics.textContent,error:fatal?.message||null,
  rendererInfo:renderer.info.render
});
