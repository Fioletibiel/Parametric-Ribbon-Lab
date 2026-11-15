// Optical coverage fields, not a Principled/PBR satin and not deformed raster imagery.
export const vertexShader=/* glsl */`
 precision highp float;
 uniform float uTime,uMotion,uIndex;
 varying vec2 vUv;varying vec3 vWorld;
 void main(){
  vUv=uv;vec3 p=position;float t=uv.x;
  float edge=smoothstep(0.,.12,t)*(1.-smoothstep(.83,1.,t));
  float wave=sin(t*6.-uTime*.42+uIndex*.91)*.65+sin(t*11.3+uTime*.23-uIndex*1.36)*.35;
  float turn=cos(t*4.6+uTime*.32+uIndex*.76);
  p.y+=edge*uMotion*(.065*wave+.032*turn*(uv.y-.5));
  p.z+=edge*uMotion*(.085*sin(t*5.2+uTime*.25+uIndex)+.035*(uv.y-.5)*turn);
  p.x+=edge*uMotion*.012*cos(t*6.-uTime*.22+uIndex);
  vec4 q=modelMatrix*vec4(p,1.);
  vWorld=q.xyz;gl_Position=projectionMatrix*viewMatrix*q;
 }`;
export const fragmentShader=/* glsl */`
 precision highp float;
 uniform float uTime,uTheme,uEnergy,uDensity,uIndex,uPass;
 varying vec2 vUv;varying vec3 vWorld;
 float g(float x,float w){return exp(-x*x/(w*w));}
 void main(){
  float t=vUv.x,s=vUv.y;
  float endFade=smoothstep(0.,.10,t)*(1.-smoothstep(.85,1.,t));
  float freq=mix(10.,27.,uDensity);
  float phase=s*freq+.18*sin(t*8.+uIndex*1.7);
  float distLine=abs(fract(phase)-.5);
  float px=max(fwidth(phase),.001);
  float strand=1.-smoothstep(.07+px*.24,.12+px*.57,distLine);
  // Keep a low-frequency averaged optical coverage at small mobile sizes.
  strand=mix(strand,.22,smoothstep(.55,1.30,px));
  float veil=pow(max(0.,1.-abs(2.*s-1.)),.48);
  vec3 n=normalize(cross(dFdx(vWorld),dFdy(vWorld)));
  vec3 vd=normalize(cameraPosition-vWorld);
  float edge=pow(1.-abs(dot(n,vd)),2.2);
  float diff=max(dot(abs(n),normalize(vec3(.7,.8,1.))),0.);
  float spec=pow(max(0.,dot(reflect(-normalize(vec3(.85,-.35,.8)),n),vd)),10.);
  float sweep=g(s-.13-.07*sin(t*5.+uTime*.19+uIndex),.065);
  float crest=g(s-.83+.06*cos(t*6.-uTime*.16),.065);
  float whiteLight=(.35+.37*diff+.42*edge)+.43*spec+.70*(sweep+crest);
  float red=g(t-(.58+.08*sin(uTime*.20+uIndex)),.21)*g(s-(.32+.12*sin(t*5.)),.31);
  red+=.48*g(t-.24,.15)*g(s-.75,.22);
  red*=mix(.62,1.10,uEnergy)*(.80+.20*sin(uIndex*1.2+1.3));
  vec3 silver=mix(vec3(.96,.93,.91),vec3(.51,.39,.42),uTheme);
  vec3 crimson=mix(vec3(.83,.11,.25),vec3(.67,.10,.25),uTheme);
  vec3 color=mix(silver,crimson,clamp(red*2.30,0.,.77));
  float strandAlpha=(.16+.25*whiteLight)*strand;
  float highlights=(.16*sweep+.13*crest+.07*edge)*whiteLight;
  float veilAlpha=(.016+.025*whiteLight)*veil;
  float alpha=(uPass<.5 ? strandAlpha+highlights : veilAlpha)*endFade;
  alpha*=.90+.12*uTheme;
  alpha+=.10*red*endFade;
  color*=.70+.55*whiteLight;
  color+=crimson*min(.19,red*.18);
  gl_FragColor=vec4(color,clamp(alpha,0.,.7));
 }`;
