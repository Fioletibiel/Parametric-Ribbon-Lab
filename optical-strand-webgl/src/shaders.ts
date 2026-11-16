// Optical Presence v0.3 — real individual 3D microfilaments and an independently
// modeled low-opacity veil surface. No fract() UV stripe pattern or reference bitmap.
export const vertexShader=/* glsl */ `
precision highp float;
attribute vec3 aFlow,aNormal;
attribute float aLane,aSeed,aStrength;
uniform float uTime,uMotion,uIndex,uPass;
varying vec3 vP,vN,vT;
varying float vSide,vTpos,vLane,vSeed,vStrength;
void main(){
 float t=uv.x;
 vTpos=t;vSide=uv.y;vLane=aLane;vSeed=aSeed;vStrength=aStrength;
 vec3 p=position;
 float envelope=smoothstep(0.,.16,t)*(1.-smoothstep(.84,1.,t));
 float drift=sin(5.2*t-.34*uTime+uIndex*1.37);
 float drift2=sin(8.8*t+.18*uTime-uIndex*.79);
 // The entire guide field breathes together. Individual strands never drift independently.
 p.y+=uMotion*envelope*(.040*drift+.023*drift2);
 p.z+=uMotion*envelope*(.068*cos(t*4.2+.21*uTime+uIndex)+.018*vLane*drift);
 vec4 world=modelMatrix*vec4(p,1.);
 vP=world.xyz;
 vN=normalize(mat3(modelMatrix)*aNormal);
 vT=normalize(mat3(modelMatrix)*aFlow);
 gl_Position=projectionMatrix*viewMatrix*world;
}`;
export const fragmentShader=/* glsl */ `
precision highp float;
uniform float uTime,uTheme,uEnergy,uDensity,uIndex,uPass;
varying vec3 vP,vN,vT;
varying float vSide,vTpos,vLane,vSeed,vStrength;
float bell(float x,float r){return exp(-x*x/(r*r));}
void main(){
 float t=vTpos,lane=vLane;
 float endFade=smoothstep(0.,.10,t)*(1.-smoothstep(.85,1.,t));
 vec3 N=normalize(vN);
 vec3 V=normalize(cameraPosition-vP);
 N*=sign(dot(N,V));
 vec3 T=normalize(vT);
 vec3 key=normalize(vec3(-.45,.75,1.3));
 vec3 fill=normalize(vec3(.80,.32,.95));
 vec3 H=normalize(V+key);
 float fres=pow(1.-abs(dot(N,V)),2.2);
 float diffuse=.28+.42*max(dot(N,key),0.)+.12*max(dot(N,fill),0.);
 float aniso=pow(max(0.,1.-abs(dot(T,H))),4.0);
 float crest=pow(max(0.,dot(N,H)),14.0);
 float spec=.16+.58*aniso+.44*crest+.26*fres;
 // Few genuinely placed luminous curves: not universal stripe UV masks.
 float region=bell(t-(uIndex<1.5?.30:.69),.38);
 float ribbonShadow=mix(.46,1.,.5+.5*cos(lane*3.3+uIndex*1.13));
 // Localized internal reddish illumination, with attenuation in world space.
 vec3 redSource=vec3(.39,-.40,-.12);
 float redDist=length((vP-redSource)*vec3(.71,.95,.55));
 float redLighting=exp(-1.10*redDist*redDist);
 redLighting*= (.22+.78*max(0.,dot(N,normalize(redSource-vP))));
 redLighting*=.34+.45*(uIndex>3.5?1.:.30);
 redLighting*=.74+.26*uEnergy;
 // Selective neutral highlight (an optical specular cue, not painted entire fibers).
 float mainHighlight=bell(lane-(.27+.10*sin(t*4.2+uIndex)),.20)*region;
 float flankHighlight=bell(lane+.52,.16)*bell(t-.35,.30);
 float whiteSpec=(.4+.6*crest)*(.27+.73*mainHighlight)+.48*flankHighlight;
 vec3 darkIvory=vec3(.91,.87,.85);
 vec3 lightGraphite=vec3(.46,.34,.37);
 vec3 pale= mix(darkIvory,lightGraphite,uTheme);
 vec3 rouge=mix(vec3(.96,.23,.39),vec3(.59,.065,.18),uTheme);
 float redMix=clamp(redLighting*1.42,0.,.52);
 vec3 pigment=mix(pale,rouge,redMix);
 float alpha=0.;
 vec3 rgb=pigment;
 if(uPass<.5){
   // Optically thin, full 3D parametric membrane; not an opaque plasticky carrier.
   float softEdge=pow(max(0.,1.-abs(lane)),.52);
   float coverage=.010+.023*spec+.020*fres;
   coverage*=softEdge*endFade*vStrength;
   coverage+=.014*redLighting*softEdge;
   alpha=coverage;
   rgb*=.76+.37*diffuse+.24*fres;
 }else if(uPass<1.5){
   // A physical 3D filament strip with subpixel-smoothed cross section.
   float d=abs(vSide-.5)*2.;
   float fw=max(fwidth(vSide),.001);
   float core=1.-smoothstep(.31+fw*.20,.69+fw*.44,d);
   core=mix(core,.40,smoothstep(.52,1.1,fw));
   float optical=(.11+.31*spec+.23*mainHighlight+.12*whiteSpec);
   float heterogeneity=.28+.72*pow(vSeed,1.25);
   alpha=core*optical*heterogeneity*vStrength*ribbonShadow*endFade;
   rgb*=.51+.57*diffuse+.91*whiteSpec+.25*fres;
   rgb+=rouge*redLighting*.37;
 }else {
   // Precisely positioned white crest filaments. Soft luminous halo plus a tight core.
   float d=abs(vSide-.5)*2.;
   float halo=exp(-d*d*2.8);
   float core=exp(-d*d*30.);
   float beam=(.17+.45*region+.36*whiteSpec)*vStrength;
   alpha=(.11*halo+.56*core)*beam*endFade*(.71+.29*spec);
   rgb=mix(vec3(1.52,1.40,1.35),vec3(.74,.40,.47),uTheme);
   rgb=mix(rgb,rouge,clamp(redLighting*2.6,0.,.40));
   rgb*=.81+.39*whiteSpec;
 }
 alpha*=uTheme>.5?1.17:1.;
 if(alpha<.001)discard;
 gl_FragColor=vec4(rgb,clamp(alpha,0.,.80));
}`;
