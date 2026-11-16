import * as THREE from 'three';

/** Optical-fold study: actual spatial lofted surfaces, not screen-space sine strokes.
 * This is a temporary material/lighting test, not a reconstruction of the private art.
 */
type Knot=[number,number,number];
type Definition={name:string;knots:Knot[];breadth:number;phase:number;side:number};
// Deliberately only one crossing; full character shape is out of scope here.
const defs:Definition[]=[
 {name:'REAR_OPTICAL_SAIL',phase:-.53,breadth:1.63,side:.65,knots:[
  [-3.45,-.47,-.82],[-2.66,.07,-.67],[-1.53,.32,-.56],[-.34,.23,-.65],[.63,.77,-.57],[1.51,1.25,-.45],[2.31,1.08,-.28],[3.43,.13,-.21]
 ]},
 {name:'FRONT_REFLECTIVE_FOLD',phase:.82,breadth:1.34,side:-.10,knots:[
  [-3.43,-.18,.32],[-2.68,.30,.50],[-1.64,.38,.58],[-.53,-.11,.73],[.50,-.51,.90],[1.44,-.17,1.0],[2.42,.58,.79],[3.43,.67,.50]
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
