import * as THREE from 'three';

/**
 * Optical Presence 03 — actual authored 3D curves and independent optical layers.
 * No raster source, screen-space stripe texture, or post-hoc photograph deformation.
 *
 * Each fiber has a separate 3D centreline following a shared lofted guide field.
 * 3 pass types: translucent veil surface, individual strand strips, rare glints.
 */

type Knot=[number,number,number];
type Family={knots:Knot[];width:number;phase:number;twist:number;weight:number;red:number;ridge:number};
const families:Family[]=[
 { // lower return: passes BEHIND the center crossing
  knots:[[-3.48,-.46,-.72],[-2.68,-.65,-.70],[-1.72,-.93,-.56],[-.62,-.97,-.35],[.46,-.54,-.28],[1.43,-.08,-.37],[2.48,-.27,-.56],[3.46,-.68,-.73]],
  width:1.04,phase:.4,twist:.54,weight:.62,red:.54,ridge:.33
 },
 { // architectural upper sail, elevated into rear space
  knots:[[-3.43,-.39,-.84],[-2.66,.19,-.79],[-1.74,.47,-.77],[-.68,.52,-.82],[.40,.96,-.62],[1.42,1.27,-.43],[2.45,1.08,-.25],[3.45,.24,-.35]],
  width:1.38,phase:-.43,twist:.76,weight:.72,red:.09,ridge:-.29
 },
 { // turning sheer veil
  knots:[[-3.48,.01,-.16],[-2.73,.41,-.12],[-1.71,.35,-.02],[-.59,-.26,-.10],[.46,-.41,-.17],[1.43,.17,-.22],[2.44,.65,-.15],[3.45,.15,-.21]],
  width:1.04,phase:1.21,twist:-.59,weight:.58,red:.40,ridge:.35
 },
 { // bright central crossing: frontmost at the knot
  knots:[[-3.46,-.23,.20],[-2.66,.32,.40],[-1.69,.39,.62],[-.49,-.12,.82],[.55,-.46,.98],[1.52,-.11,.96],[2.48,.61,.82],[3.43,.39,.50]],
  width:1.14,phase:.86,twist:.69,weight:1.,red:.25,ridge:-.17
 },
 { // internal crimson lit recess; translucent and sheltered
  knots:[[-3.42,-.74,.04],[-2.60,-1.03,.12],[-1.55,-.87,.13],[-.48,-.56,.20],[.54,-.10,.24],[1.58,.07,.14],[2.50,-.23,.08],[3.44,-.52,.01]],
  width:.77,phase:-.70,twist:-.42,weight:.65,red:1.,ridge:.07
 }
];
export const RIBBON_COUNT=families.length;
export type OpticalPass='veil'|'fibers'|'glints';
type Attributes={p:number[];uv:number[];n:number[];flow:number[];lane:number[];seed:number[];strength:number[];idx:number[]};
const clamp=THREE.MathUtils.clamp;
const fract=(x:number)=>x-Math.floor(x);
function hash(x:number){return fract(Math.sin(x*127.1+23.6)*43758.5453)}
function frame(curve:THREE.CatmullRomCurve3,t:number,f:Family){
 const center=curve.getPoint(t),T=curve.getTangent(t).normalize();
 let A=new THREE.Vector3(0,1,0).addScaledVector(T,-T.y).normalize();
 const spin=f.twist*Math.sin(t*3.9+f.phase)+.24*Math.cos(t*8.5-f.phase*.8);
 A.applyAxisAngle(T,spin);
 const B=new THREE.Vector3().crossVectors(T,A).normalize();
 return {center,T,A,B};
}
function ribbonPoint(fr:ReturnType<typeof frame>,f:Family,t:number,lane:number,offset=0){
 const taper=Math.pow(Math.max(0,Math.sin(Math.PI*t)),.42);
 const width=f.width*(.13+.87*taper)*(.91+.09*Math.sin(t*6.4+f.phase));
 const height=(.13*Math.sin(t*6.+f.phase)+.075*Math.cos(t*13.+lane*2.6))*Math.max(0,1-lane*lane);
 return fr.center.clone()
 .addScaledVector(fr.A,lane*width*.5)
 .addScaledVector(fr.B,height+offset);
}
function geometryFor(index:number,kind:OpticalPass):THREE.BufferGeometry{
 const f=families[index],curve=new THREE.CatmullRomCurve3(f.knots.map(k=>new THREE.Vector3(...k)),false,'centripetal');
 const x:Attributes={p:[],uv:[],n:[],flow:[],lane:[],seed:[],strength:[],idx:[]};
 const faces:number[]=[];
 let count=0;
 function vertex(p:THREE.Vector3,t:number,side:number,normal:THREE.Vector3,T:THREE.Vector3,lane:number,seed:number,intensity:number){
  x.p.push(p.x,p.y,p.z);x.uv.push(t,side);x.n.push(normal.x,normal.y,normal.z);
  x.flow.push(T.x,T.y,T.z);x.lane.push(lane);x.seed.push(seed);x.strength.push(intensity);
 }
 function quad(a:THREE.Vector3,b:THREE.Vector3,c:THREE.Vector3,d:THREE.Vector3,uv0:number,uv1:number,normal:THREE.Vector3,T:THREE.Vector3,lane:number|[number,number],seed:number,intensity:number){
  const l0=typeof lane==='number'?lane:lane[0],l1=typeof lane==='number'?lane:lane[1];
  vertex(a,uv0,0,normal,T,l0,seed,intensity);vertex(b,uv0,1,normal,T,l1,seed,intensity);
  vertex(c,uv1,0,normal,T,l0,seed,intensity);vertex(d,uv1,1,normal,T,l1,seed,intensity);
  faces.push(count,count+2,count+1,count+1,count+2,count+3);count+=4;
 }
 if(kind==='veil'){
  const segments=106,strips=15;
  for(let i=0;i<segments;i++){
   const t=i/segments,tn=(i+1)/segments,fr=frame(curve,t,f),frn=frame(curve,tn,f);
   for(let j=0;j<strips;j++){
    const l0=-1+2*j/strips,l1=-1+2*(j+1)/strips;
    // Veil is geometrically shallow and never one opaque sheet.
    const A=ribbonPoint(fr,f,t,l0),B=ribbonPoint(fr,f,t,l1);
    const C=ribbonPoint(frn,f,tn,l0),D=ribbonPoint(frn,f,tn,l1);
    quad(A,B,C,D,t,tn,fr.B,fr.T,[l0,l1],index+.19,f.weight);
   }
  }
 } else {
  const fibers=kind==='glints'?5:36,segments=kind==='glints'?150:116;
  for(let k=0;k<fibers;k++){
   const seed=hash(k*4.13+index*23.7);
   const lane=kind==='glints'?
     clamp(f.ridge+.045*(k-2)+.018*(seed-.5),-.9,.9):
     (-.94+1.88*(k+.5)/fibers)+.018*(seed-.5);
   const intensity=kind==='glints' ? (.73+.18*seed)*f.weight:(.16+.78*Math.pow(seed,.85))*f.weight;
   const thin=kind==='glints'? (.023+.016*hash(seed*13)):(.0038+.0038*hash(seed*19));
   const t0=kind==='glints'?.02+.018*k:0,t1=kind==='glints'?.98-.015*k:1;
   for(let i=0;i<segments;i++){
    const t=t0+(t1-t0)*i/segments,tn=t0+(t1-t0)*(i+1)/segments;
    const fr=frame(curve,t,f),frn=frame(curve,tn,f);
    const wav=(kind==='fibers'? .008:0)*Math.sin(t*19.+seed*13.);
    const p=ribbonPoint(fr,f,t,lane+wav,kind==='glints'?.025:.016);
    const q=ribbonPoint(frn,f,tn,lane+wav,kind==='glints'?.025:.016);
    // Small camera-facing section width; 3D trajectory is NOT a flat sine graph.
    const lateral=new THREE.Vector3(-fr.T.y,fr.T.x,0).normalize().multiplyScalar(thin);
    const lateralN=new THREE.Vector3(-frn.T.y,frn.T.x,0).normalize().multiplyScalar(thin);
    quad(p.clone().sub(lateral),p.clone().add(lateral),
      q.clone().sub(lateralN),q.clone().add(lateralN),t,tn,fr.B,fr.T,lane,seed,intensity);
   }
  }
 }
 const g=new THREE.BufferGeometry();g.setIndex(faces);
 g.setAttribute('position',new THREE.Float32BufferAttribute(x.p,3));
 g.setAttribute('uv',new THREE.Float32BufferAttribute(x.uv,2));
 g.setAttribute('aNormal',new THREE.Float32BufferAttribute(x.n,3));
 g.setAttribute('aFlow',new THREE.Float32BufferAttribute(x.flow,3));
 g.setAttribute('aLane',new THREE.Float32BufferAttribute(x.lane,1));
 g.setAttribute('aSeed',new THREE.Float32BufferAttribute(x.seed,1));
 g.setAttribute('aStrength',new THREE.Float32BufferAttribute(x.strength,1));
 g.computeBoundingSphere();return g;
}
export function createOpticalGeometry(index:number,pass:OpticalPass){return geometryFor(index,pass)}
