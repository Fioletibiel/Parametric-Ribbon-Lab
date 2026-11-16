import * as THREE from 'three';

/** Optical-fold study: actual spatial lofted surfaces, not screen-space sine strokes.
 * This is a temporary material/lighting test, not a reconstruction of the private art.
 */
type Knot=[number,number,number];
type Definition={name:string;knots:Knot[];breadth:number;phase:number;side:number};
const defs:Definition[]=[
 {name:'LOWER_RETURN',phase:.38,breadth:1.16,side:-.5,knots:[
  [-3.35,-.48,-.85],[-2.62,-.60,-.84],[-1.76,-.86,-.69],[-.69,-1.00,-.45],[.38,-.73,-.28],[1.33,-.23,-.32],[2.22,-.31,-.54],[3.32,-.76,-.76]
 ]},
 {name:'UPPER_SAIL',phase:-.53,breadth:1.37,side:.5,knots:[
  [-3.36,-.34,-.70],[-2.65,.14,-.64],[-1.55,.29,-.50],[-.38,.25,-.57],[.64,.73,-.46],[1.44,1.18,-.35],[2.35,1.13,-.19],[3.32,.36,-.32]
 ]},
 {name:'INNER_VEIL',phase:.18,breadth:.88,side:.15,knots:[
  [-3.24,.30,-.24],[-2.43,.52,-.25],[-1.42,.02,-.05],[-.35,-.31,.02],[.60,-.31,-.13],[1.58,.17,-.13],[2.53,.44,-.12],[3.27,.07,-.28]
 ]},
 {name:'FOREGROUND_CROSSING',phase:.82,breadth:1.06,side:-.15,knots:[
  [-3.34,-.18,.30],[-2.66,.32,.45],[-1.67,.36,.56],[-.53,-.05,.69],[.55,-.34,.82],[1.45,-.06,.83],[2.42,.56,.69],[3.31,.66,.45]
 ]}
];
export const RIBBON_COUNT=defs.length;

function sampleCentripetal(curve:THREE.CatmullRomCurve3,t:number){
 return curve.getPoint(t);
}
export function createRibbonGeometry(index:number,segments=180,across=34):THREE.BufferGeometry{
 const def=defs[index],curve=new THREE.CatmullRomCurve3(def.knots.map(k=>new THREE.Vector3(...k)),false,'centripetal');
 const xyz:number[]=[],uv:number[]=[],flows:number[]=[],faces:number[]=[];
 for(let i=0;i<=segments;i++){
  const t=i/segments,c=sampleCentripetal(curve,t);
  const T=curve.getTangent(t).normalize();
  // Ribbon lateral axis stays near world-up, then twists around the moving tangent.
  let A=new THREE.Vector3(0,1,0).addScaledVector(T,-T.y).normalize();
  const twist=.71*Math.sin(t*3.9+def.phase)+.30*Math.sin(t*8.5-def.phase*.75)+def.side*.28;
  A.applyAxisAngle(T,twist);
  const B=new THREE.Vector3().crossVectors(T,A).normalize();
  const taper=Math.pow(Math.sin(Math.PI*t),.42);
  const width=def.breadth*(.11+.89*taper)*(.86+.14*Math.sin(4.2*t+def.phase));
  for(let j=0;j<=across;j++){
   const s=j/across,sp=(s-.5)*width;
   const camber=.085*Math.sin(Math.PI*s)*Math.sin(t*5+def.phase);
   const P=c.clone().addScaledVector(A,sp).addScaledVector(B,camber);
   xyz.push(P.x,P.y,P.z);uv.push(t,s);flows.push(T.x,T.y,T.z);
  }
 }
 for(let i=0;i<segments;i++)for(let j=0;j<across;j++){
  const a=i*(across+1)+j,b=a+across+1;
  faces.push(a,b,a+1,b,b+1,a+1);
 }
 const g=new THREE.BufferGeometry();
 g.setIndex(faces);
 g.setAttribute('position',new THREE.Float32BufferAttribute(xyz,3));
 g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));
 g.setAttribute('aFlow',new THREE.Float32BufferAttribute(flows,3));
 g.computeVertexNormals();
 g.computeBoundingSphere();return g;
}
