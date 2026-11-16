/* Optical Fold v0.2. Not a texture or an image warp.
   Three passes: optically thin veil, variable-coverage fibers, soft ridge illumination.
   Derivative filtering is used to avoid high-frequency stripe moire at mobile widths.
*/
export const vertexShader=/* glsl */`
 precision highp float;
 attribute vec3 aFlow;
 uniform float uTime,uMotion,uIndex,uPass;
 varying vec2 vUv;
 varying vec3 vWorld,vFlow;
 void main(){
  vUv=uv;
  float t=uv.x,s=uv.y;
  vec3 p=position;
  float fade=smoothstep(0.,.13,t)*(1.-smoothstep(.85,1.,t));
  // Controlled spatial deformation — source mesh, not a rendered bitmap.
  float phase=t*5.2-uTime*.33+uIndex*1.34;
  float bent=sin(phase)*.7+sin(t*8.6+uTime*.20-uIndex)*.3;
  p.y+=uMotion*fade*(.052*bent+.023*(s-.5)*cos(phase*1.2));
  p.z+=uMotion*fade*(.088*sin(t*4.7+uTime*.31+uIndex)+.040*(s-.5)*cos(t*7.-uTime*.24));
  // Optical sheets are separate planes, only micrometers apart in scene scale.
  p.z+=(uPass<.5 ? -.019 : uPass>1.5 ? .018 : 0.);
  vec4 wp=modelMatrix*vec4(p,1.);
  vWorld=wp.xyz;vFlow=normalize(mat3(modelMatrix)*aFlow);
  gl_Position=projectionMatrix*viewMatrix*wp;
 }`;
export const fragmentShader=/* glsl */`
 precision highp float;
 uniform float uTime,uTheme,uEnergy,uDensity,uIndex,uPass;
 varying vec2 vUv;
 varying vec3 vWorld,vFlow;
 float gauss(float x,float r){return exp(-x*x/(r*r));}
 void main(){
  float t=vUv.x,s=vUv.y;
  float endFade=pow(max(0.,sin(3.14159265*t)),.55);
  float crossSection=pow(max(0.,1.-abs(s*2.-1.)),.45);
  vec3 dPdx=dFdx(vWorld),dPdy=dFdy(vWorld);
  vec3 N=normalize(cross(dPdx,dPdy));
  vec3 V=normalize(cameraPosition-vWorld);
  N*=sign(dot(N,V));
  vec3 T=normalize(vFlow);
  vec3 L=normalize(vec3(-.55,.72,1.));
  vec3 H=normalize(L+V);
  float face=abs(dot(N,V));
  float fres=pow(1.-face,2.0);
  // A specular response based on both surface normal and real fiber direction.
  float silk=pow(max(0.,1.-abs(dot(T,H))),3.3)*pow(max(0.,dot(N,H)),2.0);
  float ridge=pow(max(0.,dot(N,H)),16.);
  float fineHighlight=pow(max(0.,dot(N,H)),35.);
  float glint=clamp(.10+.90*silk+.72*ridge+.30*fres,0.,2.);
  // Normal-dependent light instead of a UV-only red color mask.
  vec3 redOrigin=vec3(.75,-.26,-.50);
  float dist=length((vWorld-redOrigin)*vec3(.56,.9,.68));
  float redPool=exp(-2.25*dist*dist)*(.24+.76*max(0.,dot(N,normalize(vec3(.30,.50,.80)))));
  redPool*=.66+.34*uEnergy;
  // Broader depth lift is only a whisper: no opaque carrier.
  float veilDensity=.010+.023*silk+.029*fres;
  veilDensity*=crossSection;
  // Fibers vary in identity, local strength, width, and visibility.
  float freq=mix(17.,37.,uDensity);
  float phase=s*freq+.13*sin(t*5.7+uIndex*1.7)+.055*sin(t*13.2+s*4.8);
  float fw=max(fwidth(phase),.0001);
  float distanceToCenter=abs(fract(phase)-.5);
  float strand=1.-smoothstep(.022+fw*.24,.060+fw*.48,distanceToCenter);
  strand=mix(strand,.11,smoothstep(.52,1.18,fw));
  float id=floor(phase);
  float identity=.22+.78*pow(.5+.5*sin(id*2.37+uIndex*3.7),2.2);
  float stream=.52+.48*gauss(t-(.42+.28*sin(id*.51+uIndex)),.28);
  float opticalCoverage=(.025+.26*silk+.30*ridge+.08*fres)*identity*stream;
  float edgeFiber=gauss(s-.012,.025)+gauss(s-.988,.025);
  float edgeLight=(.03+.23*ridge+.10*fres)*edgeFiber;
  float sparkle=pow(fineHighlight,1.2)*(.28+.72*gauss(s-(.3+.18*sin(t*6.3+uIndex)),.24));
  // Spectral/white light remains concentrated in optical crests.
  vec3 whiteDark=vec3(.98,.93,.90);
  vec3 whiteLight=vec3(.61,.48,.49);
  vec3 silver=mix(whiteDark,whiteLight,uTheme);
  vec3 red=mix(vec3(1.,.18,.34),vec3(.73,.08,.22),uTheme);
  float glowIntensity=redPool*(.35+.50*silk+.3*ridge);
  vec3 c=mix(silver,red,clamp(redPool*2.4,0.,.72));
  float alpha=0.;
  if(uPass<.5){
   // Volumetric suggestion from very fine coherent optical veil.
   alpha=(veilDensity+.040*redPool)*endFade;
   c=mix(c,red,clamp(redPool,0.,.4));
  }else if(uPass<1.5){
   alpha=(strand*opticalCoverage+edgeLight+.08*sparkle)*endFade;
   c*=.66+.74*glint;
   c+=red*glowIntensity*.40;
  }else{
   // A soft second optical pass on top of sharply lit edges (not a painted stripe).
   alpha=(.035*fres+.085*ridge+.06*silk+.035*redPool)*crossSection*endFade;
   c=mix(silver,red,clamp(redPool*3.,0.,.72))*(.57+.75*glint);
  }
  // If the view undersamples dense filaments, fade toward low optical coverage.
  alpha=clamp(alpha*(uTheme>.5 ? 1.25 : 1.0),0.,.51);
  gl_FragColor=vec4(c,alpha);
 }`;
