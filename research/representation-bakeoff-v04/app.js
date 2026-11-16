// EXP-04 — One parametric scene, three independent renderers. No image assets.
let canvas=document.getElementById('scene'),engine=null,mode='a',dark=true,motion=false,phase=0,power=.70;
const status=document.getElementById('status'),page=document.getElementById('page');
const info={a:['A / HYBRID OPTICAL TEXTILE','Rzeczywiste siatki przestrzenne z wielowarstwowym shaderem: anizotropia, Fresnel, miękkie przenikanie. Nie są to pojedyncze kreski.'],
b:['B / LAYER COMPOSITING 2.5D','Widok projektowany pod kamerę: powierzchnie ze zróżnicowaną przejrzystością, selektywne świetliste grzbiety i kontrolowana kolejność warstw.'],
c:['C / VOLUME DENSITY FIELD','Raymarching pola przestrzennej gęstości zamiast powierzchni i włókien. Test zdolności budowania optycznej objętości bez plastikowych brył.']};
const glslPoint=\`
vec3 scenePoint(int id,float u,float v,float phase) {
 float t=u*6.2831853, env=pow(max(.005,sin(3.14159265*u)),.58);
 float y,z,w,r;
 if(id==0){y=-.24+.35*sin(t-.52)+.15*sin(t*1.55+.52);z=.34+.19*sin(t+.75);w=.92;r=.50*sin(t+.18)+.30;}
 else if(id==1){y=.35+.34*sin(t+.65)+.14*sin(3.14159265*u);z=-.39+.13*cos(t-.25);w=1.19;r=-.56*sin(t-.5)+.24;}
 else{y=-.45+.27*sin(t+.85);z=-.17+.10*cos(t-.35);w=.78;r=.62*sin(t+.9)-.18;}
 w*=.08+.92*env;
 float dx=v*w*.26*sin(r),dy=v*w*.57*cos(r),dz=v*w*.54*sin(r);
 float breathe=.045*env*sin(t*1.3+phase)*min(1.,abs(v)+.5);
 return vec3(-3.16+u*6.32+dx,y+dy+breathe,z+dz+.035*sin(t*1.3+phase)*env);
}\`;
function point(id,u,v,t=0){const theta=u*6.2831853,env=Math.pow(Math.max(.005,Math.sin(Math.PI*u)),.58);let y,z,w,r;
 if(id===0){y=-.24+.35*Math.sin(theta-.52)+.15*Math.sin(theta*1.55+.52);z=.34+.19*Math.sin(theta+.75);w=.92;r=.50*Math.sin(theta+.18)+.30;}
 else if(id===1){y=.35+.34*Math.sin(theta+.65)+.14*Math.sin(Math.PI*u);z=-.39+.13*Math.cos(theta-.25);w=1.19;r=-.56*Math.sin(theta-.5)+.24;}
 else{y=-.45+.27*Math.sin(theta+.85);z=-.17+.10*Math.cos(theta-.35);w=.78;r=.62*Math.sin(theta+.9)-.18;}
 w*=.08+.92*env;return [-3.16+u*6.32+v*w*.26*Math.sin(r),y+v*w*.57*Math.cos(r)+.045*env*Math.sin(theta*1.3+t)*Math.min(1,Math.abs(v)+.5),z+v*w*.54*Math.sin(r)+.035*Math.sin(theta*1.3+t)*env];
}
function normal(id,u,v){const a=point(id,Math.min(.999,u+.002),v),b=point(id,Math.max(.001,u-.002),v),c=point(id,u,Math.min(.99,v+.004)),d=point(id,u,Math.max(-.99,v-.004));const x=a.map((q,i)=>q-b[i]),y=c.map((q,i)=>q-d[i]);let n=[x[1]*y[2]-x[2]*y[1],x[2]*y[0]-x[0]*y[2],x[0]*y[1]-x[1]*y[0]],l=Math.hypot(...n)||1;return n.map(q=>q/l)}
function screen(p){return [(p[0]/3.9*.5+.5)*canvas.width,(.5-p[1]/2.2*.365)*canvas.height]}
function makeShader(gl,type,src){let s=gl.createShader(type);gl.shaderSource(s,src);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s}
function makeProgram(gl,vs,fs){const p=gl.createProgram();gl.attachShader(p,makeShader(gl,gl.VERTEX_SHADER,vs));gl.attachShader(p,makeShader(gl,gl.FRAGMENT_SHADER,fs));gl.linkProgram(p);if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(p));return p}
function bindAttribute(gl,p,name,arr,size){const loc=gl.getAttribLocation(p,name);if(loc<0)return;const buf=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buf);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(arr),gl.STATIC_DRAW);gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,size,gl.FLOAT,false,0,0)}
class A {
 constructor(){const gl=canvas.getContext('webgl2',{alpha:true,antialias:true,preserveDrawingBuffer:true});if(!gl)throw Error('WebGL2 unavailable');this.gl=gl;
 this.p=makeProgram(gl,\`#version 300 es
 precision highp float;in vec3 p,n;in vec2 uv;out vec3 N,W;out vec2 UV;uniform float phase;
 void main(){vec3 q=p;q.y+=.035*sin(uv.x*8.+phase)*sin(uv.x*3.14159);N=n;W=q;UV=uv;gl_Position=vec4(q.x/3.9,q.y/2.2*.73,q.z/3.,1.);}\`,\`#version 300 es
 precision highp float;in vec3 N,W;in vec2 UV;out vec4 color;uniform float power,dark,family;
 float bell(float x,float r){return exp(-x*x/(r*r));}
 void main(){vec3 n=normalize(N);n*=sign(dot(n,vec3(0.,0.,1.)));vec3 light=normalize(vec3(-.5,.8,1.)),h=normalize(light+vec3(0.,0.,1.));float fres=pow(1.-abs(n.z),2.);float spec=pow(max(0.,dot(n,h)),33.);float peak=pow(max(0.,dot(n,h)),80.);
 float crimson=bell(UV.x-.64,.24)*bell(UV.y-.42,.30)*(family>1.5?.77:.24)*power;
 float fibers=.5+.5*cos(UV.y*180.+UV.x*11.);float shade=.37+.35*max(0.,dot(n,light))+.45*spec+.20*fres;
 vec3 ink=mix(vec3(.92,.87,.85),vec3(.47,.35,.39),1.-dark),red=mix(vec3(.86,.15,.30),vec3(.72,.08,.24),1.-dark);
 vec3 rgb=mix(ink,red,clamp(crimson,0.,.58))*shade+vec3(1.05,.98,.97)*(.32*peak+.16*spec)*power;
 float edge=pow(max(0.,sin(UV.x*3.14159)),.8)*pow(max(0.,sin(UV.y*3.14159)),.4);
 float alpha=edge*(.055+.12*spec+.055*fres+.022*fibers);
 color=vec4(rgb,clamp(alpha,0.,.55));}\`);
 this.parts=[];const U=100,V=16;for(let id=0;id<3;id++){const pos=[],norm=[],uv=[];for(let i=0;i<U;i++)for(let j=0;j<V;j++){const u=i/U,u2=(i+1)/U,v=-1+2*j/V,v2=-1+2*(j+1)/V;for(const [s,t] of [[u,v],[u2,v],[u,v2],[u,v2],[u2,v],[u2,v2]]){pos.push(...point(id,s,t));norm.push(...normal(id,s,t));uv.push(s,(t+1)/2)}}const vao=gl.createVertexArray();gl.bindVertexArray(vao);bindAttribute(gl,this.p,'p',pos,3);bindAttribute(gl,this.p,'n',norm,3);bindAttribute(gl,this.p,'uv',uv,2);this.parts.push({id,vao,count:pos.length/3})}}
 draw(){const gl=this.gl;gl.viewport(0,0,canvas.width,canvas.height);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);gl.disable(gl.DEPTH_TEST);gl.useProgram(this.p);for(const [n,v] of [['phase',phase],['power',power],['dark',dark?1:0]])gl.uniform1f(gl.getUniformLocation(this.p,n),v);for(const ob of [this.parts[1],this.parts[2],this.parts[0]]){gl.uniform1f(gl.getUniformLocation(this.p,'family'),ob.id);gl.bindVertexArray(ob.vao);gl.drawArrays(gl.TRIANGLES,0,ob.count)}}}
class B {
 constructor(){this.ctx=canvas.getContext('2d');if(!this.ctx)throw Error('Canvas2D unavailable')}
 draw(){const c=this.ctx,w=canvas.width,h=canvas.height,unit=w/Math.max(1,canvas.getBoundingClientRect().width);c.clearRect(0,0,w,h);
 for(const id of [1,2,0]){const n=32;for(let k=0;k<n;k++){const v=-1+2*k/n,v2=-1+2*(k+1)/n;const path=new Path2D();for(let i=0;i<=112;i++){const p=screen(point(id,i/112,v,phase));i?path.lineTo(...p):path.moveTo(...p)}for(let i=112;i>=0;i--)path.lineTo(...screen(point(id,i/112,v2,phase)));path.closePath();
 const density=Math.pow(Math.sin(Math.PI*(k+.5)/n),.7);c.globalAlpha=(.005+.008*Math.cos(k*.37+id)**2)*density*(dark?1:1.25);c.fillStyle=dark?'#f1e6e4':'#88636e';c.fill(path)}
 const body=new Path2D();for(let i=0;i<=140;i++){const p=screen(point(id,i/140,-.96,phase));i?body.lineTo(...p):body.moveTo(...p)}for(let i=140;i>=0;i--)body.lineTo(...screen(point(id,i/140,.96,phase)));body.closePath();c.save();c.clip(body);const g=c.createLinearGradient(w*.2,h*.25,w*.78,h*.77);if(dark){g.addColorStop(0,'#ded1d00a');g.addColorStop(.44,'#f9e5e61d');g.addColorStop(.74,id===2?'#a21c4942':'#f8e6e51a');g.addColorStop(1,'#eee4df00')}else{g.addColorStop(0,'#61485000');g.addColorStop(.44,'#a17a7721');g.addColorStop(.74,id===2?'#af275146':'#bd979229');g.addColorStop(1,'#61485000')}c.globalAlpha=1;c.fillStyle=g;c.fillRect(0,0,w,h);c.restore();
 for(const lane of id===2?[-.25]:[-.43,.38]){c.save();c.beginPath();for(let i=0;i<=160;i++){const u=i/160,p=screen(point(id,u,lane+.07*Math.sin(u*5.3+id),phase));i?c.lineTo(...p):c.moveTo(...p)}c.strokeStyle=id===2?'#bb426e':(dark?'#fff2ef':'#fffaf5');c.lineWidth=(id===2?1.8:2)*unit;c.globalAlpha=(id===2?.54:.57)*power;c.shadowBlur=12*unit;c.shadowColor=id===2?'#d14370':'#fff3f1';c.stroke();c.restore()}}
 c.globalAlpha=1}}
class C {
 constructor(){const gl=canvas.getContext('webgl2',{alpha:true,preserveDrawingBuffer:true});if(!gl)throw Error('WebGL2 unavailable');this.gl=gl;this.p=makeProgram(gl,\`#version 300 es
 precision highp float;void main(){vec2 t=vec2((gl_VertexID<<1)&2,gl_VertexID&2);gl_Position=vec4(t*2.-1.,0.,1.);}\`,\`#version 300 es
 precision highp float;uniform float phase,power,dark;uniform vec2 size;out vec4 color;\${glslPoint}
 float dens(vec3 p){float u=clamp((p.x+3.16)/6.32,0.,1.);if(u<.01||u>.99)return 0.;float d=0.;for(int id=0;id<3;id++)for(int j=0;j<7;j++){float v=float(j-3)/3.;vec3 q=scenePoint(id,u,v,phase);vec3 r=(p-q)*vec3(1.,1.10,.80);d+=exp(-dot(r,r)*47.)*.13;}return min(d,.7);}
 void main(){vec2 uv=gl_FragCoord.xy/size;vec3 p=vec3((uv.x-.5)*7.8,(uv.y-.5)*6.027,0.);vec3 sum=vec3(0.);float T=1.;for(int s=0;s<14;s++){p.z=-1.18+(float(s)+.5)/14.*2.36;float d=dens(p);float slope=abs(d-dens(p+vec3(0.,.026,.026)));float a=clamp(d*(.20+.16*power),0.,.25);vec3 base=mix(vec3(.88,.83,.81),vec3(.55,.40,.44),1.-dark);vec3 red=vec3(.83,.10,.25);vec3 z=(p-vec3(.38,-.43,-.13))*vec3(.60,1.,.9);float glow=exp(-dot(z,z)*1.5);vec3 col=mix(base,red,glow*.57)+vec3(1.1,1.,.98)*min(.7,slope*7.)*power;sum+=T*a*col;T*=1.-a;}color=vec4(sum,clamp(1.-T,0.,.87));}\`);this.vao=gl.createVertexArray()}
 draw(){const gl=this.gl;gl.viewport(0,0,canvas.width,canvas.height);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);gl.useProgram(this.p);for(const [n,v]of [['phase',phase],['power',power],['dark',dark?1:0]])gl.uniform1f(gl.getUniformLocation(this.p,n),v);gl.uniform2f(gl.getUniformLocation(this.p,'size'),canvas.width,canvas.height);gl.bindVertexArray(this.vao);gl.drawArrays(gl.TRIANGLES,0,3)}}
function resize(){const rect=canvas.getBoundingClientRect(),dpr=Math.min(devicePixelRatio||1,1.5),w=Math.max(180,Math.round(rect.width*dpr)),h=Math.max(180,Math.round(rect.height*dpr));if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h}}
function setMode(m){mode=m;const fresh=document.createElement('canvas');fresh.id='scene';canvas.replaceWith(fresh);canvas=fresh;try{engine=m==='a'?new A():m==='b'?new B():new C();resize();status.textContent='Aktywny'}catch(e){engine=null;status.textContent='Błąd: '+e.message;console.error(e)}document.getElementById('mode').textContent=info[m][0];document.getElementById('description').textContent=info[m][1];document.querySelectorAll('[data-m]').forEach(b=>b.classList.toggle('active',b.dataset.m===m))}
document.querySelectorAll('[data-m]').forEach(b=>b.onclick=()=>setMode(b.dataset.m));
document.getElementById('theme').onclick=()=>{dark=!dark;page.classList.toggle('light',!dark);document.getElementById('theme').textContent=dark?'☾ Dark':'☀ Light'};
document.getElementById('motion').onclick=()=>{motion=!motion;document.getElementById('motion').textContent=motion?'Ⅱ Pause':'▶ Animate'};
document.getElementById('power').oninput=e=>power=+e.target.value/100;
new ResizeObserver(()=>resize()).observe(document.querySelector('.stage'));
let previous=performance.now(),count=0;
function draw(now){const dt=Math.min(.05,(now-previous)/1000);previous=now;if(motion)phase+=dt*.65;if(engine){try{engine.draw()}catch(e){console.error(e);engine=null;status.textContent='Renderer error'}}if(++count%90===0&&engine)status.textContent='Aktywny / '+mode.toUpperCase();requestAnimationFrame(draw)}
setMode('a');requestAnimationFrame(draw);