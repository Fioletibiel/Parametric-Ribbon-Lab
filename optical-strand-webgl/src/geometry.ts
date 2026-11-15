import * as THREE from 'three';

// Neutral guide curves. The visual material is synthesized by the GPU.
const guides: number[][][] = [
[[-3.52,-.34,-.36],[-2.75,.28,-.19],[-1.65,.21,.15],[-.60,-.49,.50],[.27,-.56,.63],[1.45,.41,.46],[2.52,.72,.07],[3.45,.11,-.14]],
[[-3.55,-.68,-.43],[-2.73,-.22,-.44],[-1.62,-.60,-.20],[-.47,-.71,-.15],[.44,.08,-.20],[1.33,.73,-.45],[2.36,.59,-.58],[3.50,-.23,-.74]],
[[-3.48,.22,-.80],[-2.68,.70,-.85],[-1.65,.51,-.71],[-.64,.15,-.61],[.40,.23,-.47],[1.41,.77,-.36],[2.51,1.01,-.30],[3.51,.34,-.48]],
[[-3.56,-.80,.15],[-2.73,-.98,.20],[-1.43,-.72,.30],[-.44,-.27,.12],[.45,.10,.04],[1.52,-.18,.23],[2.49,-.65,.28],[3.52,-.28,.21]],
];
export const RIBBON_COUNT=guides.length;
export function createRibbonGeometry(index:number,segmentCount=150,widthCount=22):THREE.BufferGeometry{
 const curve=new THREE.CatmullRomCurve3(guides[index].map(p=>new THREE.Vector3(p[0],p[1],p[2])),false,'centripetal',.48);
 const points:number[]=[],uvs:number[]=[],faces:number[]=[];
 for(let i=0;i<=segmentCount;i++){
  const t=i/segmentCount,c=curve.getPoint(t),tangent=curve.getTangent(t).normalize();
  const lateral=new THREE.Vector3(-tangent.y,tangent.x,0).normalize();
  const twist=.47*Math.sin(t*6.2+index*1.37)+.23*Math.cos(t*12.1-index*.4);
  lateral.applyAxisAngle(tangent,twist);
  const normal=new THREE.Vector3().crossVectors(tangent,lateral).normalize();
  const taper=THREE.MathUtils.smoothstep(t,0,.12)*(1-THREE.MathUtils.smoothstep(t,.84,1));
  const breadth=(.78+.22*Math.sin(t*5.1+index*1.5))*(.22+.78*taper);
  for(let j=0;j<=widthCount;j++){
   const v=j/widthCount,span=(v-.5)*breadth;
   const p=c.clone().addScaledVector(lateral,span).addScaledVector(normal,.10*Math.sin(Math.PI*v)*Math.cos(t*7+index));
   points.push(p.x,p.y,p.z);uvs.push(t,v);
  }
 }
 for(let i=0;i<segmentCount;i++)for(let j=0;j<widthCount;j++){
  const a=i*(widthCount+1)+j,b=a+widthCount+1;
  faces.push(a,b,a+1,b,b+1,a+1);
 }
 const g=new THREE.BufferGeometry();g.setIndex(faces);
 g.setAttribute('position',new THREE.Float32BufferAttribute(points,3));
 g.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));
 g.computeVertexNormals();g.computeBoundingSphere();return g;
}
