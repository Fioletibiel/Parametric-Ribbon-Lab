import './style.css';
import * as THREE from 'three';
const $=id=>document.getElementById(id);
const canvas=$('scene'),fallback=$('fallback');
let renderer;
try{renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:true,powerPreference:'high-performance'});}
catch(e){fallback.hidden=false;fallback.textContent='WebGL niedostępny: '+e.message;throw e;}
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=1.1;
renderer.setClearColor(0,0);
renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.5));
const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(33,1,.1,50),rig=new THREE.Group();
camera.position.set(0,.05,7.3);scene.add(rig);
const R=1.64;
function makeEnv(light){
 const c=document.createElement('canvas');c.width=512;c.height=256;
 const ctx=c.getContext('2d'),d=ctx.createImageData(512,256);
 const sources=[[.24,.29,.12,.21,1.2],[.7,.3,.085,.2,.6],[.86,.73,.19,.09,.55],[.4,.85,.25,.07,.45]];
 for(let y=0;y<256;y++)for(let x=0;x<512;x++){
   const u=x/512,v=y/256,base=light?[139,126,126]:[30,25,32];let z=0;
   for(const [a,b,w,h,t] of sources){
     const dx=Math.min(Math.abs(u-a),1-Math.abs(u-a))/w,dy=(v-b)/h;
     z+=t*Math.exp(-.8*(dx*dx+dy*dy));
   }
   const i=(y*512+x)*4;
   for(let k=0;k<3;k++)d.data[i+k]=Math.min(255,base[k]+Math.min(1,z)*(light?102:212));
   d.data[i+3]=255;
 }
 ctx.putImageData(d,0,0);
 const tex=new THREE.CanvasTexture(c);tex.mapping=THREE.EquirectangularReflectionMapping;tex.colorSpace=THREE.SRGBColorSpace;
 return tex;
}
const pmrem=new THREE.PMREMGenerator(renderer);
const darkEnv=pmrem.fromEquirectangular(makeEnv(false)).texture;
const lightEnv=pmrem.fromEquirectangular(makeEnv(true)).texture;
scene.environment=darkEnv;
const ambient=new THREE.AmbientLight(0xffe6df,.32);scene.add(ambient);
const key=new THREE.DirectionalLight(0xffe6d9,3.8);key.position.set(-2.2,3.8,5);scene.add(key);
const fill=new THREE.DirectionalLight(0xc69daa,1.35);fill.position.set(2.6,-1.4,3);scene.add(fill);

// Explicit spatial control points for each visible sheet in each pose.
// No image deformation, no oscillating sine over the geometry, no strands.
const definitions=[
 {name:'Rear architecture',kind:'pearl',alpha:.56,width:[.01,.36,.48,.41,.01],twist:[-.32,-.17,.05,.22,.35],
  rest:[[-1.16,.19,-.49],[-.83,.56,-.52],[-.22,.96,-.50],[.46,1.02,-.46],[1.22,.60,-.41]],
  listen:[[-1.16,.20,-.49],[-.83,.57,-.52],[-.22,.97,-.50],[.46,1.02,-.46],[1.22,.60,-.41]],
  speak:[[-1.16,.19,-.49],[-.83,.60,-.49],[-.22,1.02,-.47],[.46,1.05,-.44],[1.22,.59,-.41]]},
 {name:'Ivory sweep',kind:'ivory',alpha:.74,width:[.01,.35,.45,.50,.01],twist:[-.48,-.17,.20,.53,.65],
  rest:[[-1.30,-.31,-.13],[-.86,-.10,.06],[-.23,.20,.27],[.43,.68,.19],[1.27,.53,-.19]],
  listen:[[-1.30,-.31,-.13],[-.86,-.09,.06],[-.23,.23,.27],[.43,.68,.19],[1.27,.53,-.19]],
  speak:[[-1.30,-.30,-.13],[-.86,-.07,.08],[-.23,.27,.31],[.43,.75,.19],[1.27,.57,-.19]]},
 {name:'Burgundy current',kind:'burgundy',alpha:.83,width:[.01,.31,.41,.38,.01],twist:[.07,.18,.20,-.19,-.43],
  rest:[[-1.22,-.72,.23],[-.79,-.85,.30],[-.18,-.56,.39],[.49,.12,.33],[1.22,.23,.04]],
  listen:[[-1.22,-.72,.23],[-.79,-.83,.30],[-.18,-.53,.39],[.49,.14,.33],[1.22,.23,.04]],
  speak:[[-1.22,-.71,.23],[-.79,-.79,.31],[-.18,-.45,.43],[.49,.20,.35],[1.22,.26,.04]]},
 {name:'Lower ivory return',kind:'ivory',alpha:.65,width:[.01,.28,.42,.38,.01],twist:[.45,.19,-.33,-.60,-.29],
  rest:[[-1.17,-.79,-.28],[-.82,-1.05,-.19],[-.26,-1.11,-.15],[.48,-.72,-.09],[1.24,-.43,-.26]],
  listen:[[-1.17,-.79,-.28],[-.82,-1.05,-.19],[-.26,-1.10,-.15],[.48,-.70,-.09],[1.24,-.43,-.26]],
  speak:[[-1.17,-.79,-.28],[-.82,-1.02,-.17],[-.26,-1.05,-.10],[.48,-.65,-.05],[1.24,-.43,-.26]]}
];
const NU=112,NV=34,sheets=[];
function points(def,pose){
 const cp=def[pose].map(v=>new THREE.Vector3(...v));
 const curve=new THREE.CatmullRomCurve3(cp,false,'centripetal');
 const arr=new Float32Array((NU+1)*(NV+1)*3);
 const interpolate=(a,u)=>{const t=u*4,i=Math.min(3,Math.floor(t));return THREE.MathUtils.lerp(a[i],a[i+1],Math.min(1,t-i));};
 for(let i=0;i<=NU;i++){
   const u=i/NU,c=curve.getPoint(u),t=curve.getTangent(u);
   const side=new THREE.Vector3(-t.y,t.x,0).normalize();
   const w=interpolate(def.width,u),twist=interpolate(def.twist,u);
   for(let j=0;j<=NV;j++){
     const v=j/NV*2-1;
     const p=c.clone().addScaledVector(side,v*w*Math.cos(twist));
     p.z+=v*w*Math.sin(twist)+(1-v*v)*.08*Math.sin(Math.PI*u);
     const radius=p.length();
     if(radius>R-.14)p.multiplyScalar((R-.14)/radius);
     const k=(i*(NV+1)+j)*3;arr[k]=p.x;arr[k+1]=p.y;arr[k+2]=p.z;
   }
 }
 return arr;
}
function makeSheet(def){
 const rest=points(def,'rest'),listen=points(def,'listen'),speak=points(def,'speak');
 const geo=new THREE.BufferGeometry(),idx=[],uv=new Float32Array((NU+1)*(NV+1)*2),
  col=new Float32Array((NU+1)*(NV+1)*3);
 for(let i=0;i<=NU;i++)for(let j=0;j<=NV;j++){
   const n=i*(NV+1)+j,u=i/NU,v=j/NV*2-1;
   uv[n*2]=u;uv[n*2+1]=j/NV;
   const dark=new THREE.Color(def.kind==='burgundy'?0x66162d:0x9d8582);
   const bright=new THREE.Color(def.kind==='burgundy'?0xe4778b:0xffe7dc);
   const c=dark.lerp(bright,.18+.52*Math.pow(Math.abs(v),2.6)+.16*Math.sin(Math.PI*u));
   col[n*3]=c.r;col[n*3+1]=c.g;col[n*3+2]=c.b;
   if(i<NU&&j<NV){const b=n+NV+1;idx.push(n,b,n+1,b,b+1,n+1);}
 }
 geo.setAttribute('position',new THREE.BufferAttribute(rest,3));
 geo.setAttribute('color',new THREE.BufferAttribute(col,3));
 geo.setAttribute('uv',new THREE.BufferAttribute(uv,2));
 geo.setIndex(idx);geo.computeVertexNormals();
 // Morph targets interpolate on GPU; CPU never moves individual vertices.
 geo.morphAttributes.position=[
  new THREE.Float32BufferAttribute(listen,3),new THREE.Float32BufferAttribute(speak,3)
 ];
 const burgundy=def.kind==='burgundy';
 const mat=new THREE.MeshPhysicalMaterial({
  vertexColors:true,side:THREE.DoubleSide,transparent:true,opacity:def.alpha,
  depthWrite:false,roughness:burgundy?.20:.23,metalness:.02,
  transmission:.22,thickness:.025,ior:1.36,clearcoat:.4,clearcoatRoughness:.16,
  envMapIntensity:1.45,emissive:burgundy?0x4c1026:0x160b12,
  emissiveIntensity:burgundy?.24:.03
 });
 const m=new THREE.Mesh(geo,mat);m.name=def.name;
 m.frustumCulled=false;m.renderOrder=10+sheets.length;
 rig.add(m);sheets.push(m);
}
definitions.forEach(makeSheet);
const sphereGeo=new THREE.SphereGeometry(R,112,72);
const glassBack=new THREE.Mesh(sphereGeo,new THREE.MeshPhysicalMaterial({
 color:0xbdb4b7,roughness:.08,metalness:0,transmission:.94,
 thickness:.15,ior:1.48,envMapIntensity:1,transparent:true,
 opacity:.16,side:THREE.BackSide,depthWrite:false
}));
glassBack.renderOrder=-10;rig.add(glassBack);
// Optical highlights are procedurally shaded on a REAL SPHERE surface,
// not based on an image of the Orbis or a distorted background texture.
const vert=['varying vec3 vWorld,vNormal,vLocal;',
 'void main(){vLocal=position;vWorld=(modelMatrix*vec4(position,1.)).xyz;',
 'vNormal=normalize(mat3(modelMatrix)*normal);',
 'gl_Position=projectionMatrix*viewMatrix*vec4(vWorld,1.);}'].join('\n');
const frag=['precision highp float;uniform float uLight,uGlass;',
 'varying vec3 vWorld,vNormal,vLocal;',
 'void main(){vec3 N=normalize(vNormal);vec3 V=normalize(cameraPosition-vWorld);',
 'float fres=pow(1.-clamp(dot(N,V),0.,1.),3.2);',
 'float a=exp(-pow((vLocal.x+.81)/.33,2.)-pow((vLocal.y-.82)/.51,2.));',
 'float b=exp(-pow((vLocal.x-.97)/.28,2.)-pow((vLocal.y+.93)/.35,2.));',
 'float shine=clamp(a*.74+b*.57,0.,1.);',
 'vec3 col=mix(vec3(.76,.67,.67),vec3(1.,.94,.88),shine*.77+fres*.2);',
 'float alpha=clamp((.015+.25*fres+.30*shine)*(.62+uGlass*.9),0.,.70);',
 'gl_FragColor=vec4(col,alpha);}'].join('\n');
const shellUniforms={uLight:{value:0},uGlass:{value:.55}};
const glassFront=new THREE.Mesh(sphereGeo,new THREE.ShaderMaterial({
 vertexShader:vert,fragmentShader:frag,uniforms:shellUniforms,
 side:THREE.FrontSide,transparent:true,depthWrite:false
}));
glassFront.renderOrder=30;rig.add(glassFront);
let mode='idle',light=false,quality='quality',motion=.45,dragging=false,rx=0,ry=0,x=0,y=0;
const reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
function changeMode(m){
 mode=m;$('stateLabel').textContent=m==='idle'?'Gotowy':m==='listen'?'Słucha':'Mówi';
 document.querySelectorAll('[data-mode]').forEach(b=>b.classList.toggle('selected',b.dataset.mode===m));
}
document.querySelectorAll('[data-mode]').forEach(b=>b.onclick=()=>changeMode(b.dataset.mode));
function changeTheme(v){
 light=v;document.body.classList.toggle('light',v);
 $('themeDark').classList.toggle('on',!v);$('themeLight').classList.toggle('on',v);
 scene.environment=v?lightEnv:darkEnv;
 renderer.toneMappingExposure=v?1.02:1.1;
 ambient.intensity=v?.48:.32;key.intensity=v?4.1:3.8;fill.intensity=v?1:1.35;
 shellUniforms.uLight.value=v?1:0;glassBack.material.opacity=v?.11:.16;
 for(const s of sheets){
  const red=s.name.includes('Burgundy');
  s.material.opacity=v?(red?.81:.68):(red?.83:.74);
  s.material.envMapIntensity=v?1.15:1.45;
 }
}
$('themeDark').onclick=()=>changeTheme(false);$('themeLight').onclick=()=>changeTheme(true);
function changeQuality(q){
 quality=q;$('eco').classList.toggle('on',q==='eco');$('quality').classList.toggle('on',q==='quality');
 renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,q==='eco'?1:1.5));resize();
}
$('eco').onclick=()=>changeQuality('eco');$('quality').onclick=()=>changeQuality('quality');
$('motion').oninput=e=>{motion=+e.target.value/100;$('motionRead').textContent=e.target.value+'%'};
$('glass').oninput=e=>{shellUniforms.uGlass.value=+e.target.value/100;$('glassRead').textContent=e.target.value+'%'};
canvas.addEventListener('pointerdown',e=>{dragging=true;x=e.clientX;y=e.clientY;canvas.setPointerCapture(e.pointerId)});
canvas.addEventListener('pointermove',e=>{if(!dragging)return;ry+=(e.clientX-x)*.005;rx+=(e.clientY-y)*.005;rx=THREE.MathUtils.clamp(rx,-.6,.6);x=e.clientX;y=e.clientY;});
['pointerup','pointercancel'].forEach(k=>canvas.addEventListener(k,()=>dragging=false));
function resize(){
 const s=canvas.getBoundingClientRect();if(s.width<4||s.height<4)return;
 camera.aspect=s.width/s.height;camera.position.z=s.width<450?7.8:7.3;
 camera.fov=s.width<450?37:33;camera.updateProjectionMatrix();
 renderer.setSize(Math.round(s.width),Math.round(s.height),false);
}
new ResizeObserver(resize).observe(canvas);resize();
let t=0,last=performance.now(),l=0,s=0,elapsed=0,frames=0,error=null;
function frame(now){
 requestAnimationFrame(frame);
 if(document.hidden||error)return;
 const dt=Math.min(.06,(now-last)/1000);last=now;
 if(!reduce)t+=dt;
 // Slow, purpose-built morph states; no fast per-vertex sinuous waves.
 const wave=(1-Math.cos(t*2.05))*.5,scale=motion/.45;
 const lt=mode==='listen'?Math.min(.55,.35*scale):0;
 const st=mode==='speak'?Math.min(.8,(.40+.25*wave)*scale):0;
 l=THREE.MathUtils.damp(l,lt,2.1,dt);
 s=THREE.MathUtils.damp(s,st,2.1,dt);
 for(const mesh of sheets){
  mesh.morphTargetInfluences[0]=l;
  mesh.morphTargetInfluences[1]=s;
 }
 rig.rotation.set(rx,ry,0);
 try{renderer.render(scene,camera)}catch(e){error=e;fallback.hidden=false;fallback.textContent=e.message;}
 elapsed+=dt;frames++;
 if(elapsed>1){$('perf').textContent='WEBGL · '+Math.round(frames/elapsed)+' FPS · '+quality.toUpperCase();elapsed=0;frames=0;}
}
requestAnimationFrame(frame);
canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();error=new Error('GPU context lost');fallback.hidden=false;fallback.textContent='Utracono kontekst WebGL'});
window.orbisDiagnostics=()=>({mode,light,quality,morph:{l,s},geometry:sheets.map(x=>x.name),render:renderer.info.render,error:error?.message??null});
