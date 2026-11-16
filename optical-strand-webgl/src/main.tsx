import React,{useEffect,useMemo,useRef,useState} from 'react';
import{createRoot}from'react-dom/client';
import{Canvas,useFrame,useThree}from'@react-three/fiber';
import*as THREE from'three';
import{createOpticalGeometry,RIBBON_COUNT}from'./geometry';
import{vertexShader,fragmentShader}from'./shaders';
import './style.css';

type Mode='idle'|'listen'|'think'|'speak';
type Theme='light'|'dark';
const modes:{id:Mode;label:string;desc:string;symbol:string}[]=[
{id:'idle',label:'Spoczynek',desc:'Spokojna, płynna obecność',symbol:'◌'},
{id:'listen',label:'Słuchanie',desc:'Delikatne, skupione drgania',symbol:'⌁'},
{id:'think',label:'Myślenie',desc:'Reorganizacja przepływu',symbol:'◇'},
{id:'speak',label:'Mówienie',desc:'Odpowiedź świetlna',symbol:'≋'}];
const energy:{[key in Mode]:number}={idle:.18,listen:.45,think:.58,speak:.83};
const motion:{[key in Mode]:number}={idle:.63,listen:.85,think:1.18,speak:1.05};

function CameraFit(){
 const {camera,size}=useThree();
 useEffect(()=>{
  const cam=camera as THREE.OrthographicCamera;
  cam.zoom=Math.min(size.width/8.25,size.height/3.05);
  cam.updateProjectionMatrix();
 },[camera,size.width,size.height]);
 return null;
}
function Filaments({theme,mode,density,paused,reduced,onFps}:{theme:Theme,mode:Mode,density:number,paused:boolean,reduced:boolean,onFps:(x:number)=>void}){
 const geos=useMemo(()=>Array.from({length:RIBBON_COUNT},(_,i)=>[
  createOpticalGeometry(i,'veil'),createOpticalGeometry(i,'fibers'),createOpticalGeometry(i,'glints')
 ]).flat(),[]);
 const materials=useMemo(()=>geos.map((_,idx)=>new THREE.ShaderMaterial({
  vertexShader,fragmentShader,transparent:true,depthTest:true,depthWrite:false,
  side:THREE.DoubleSide,blending:idx%3===2?THREE.AdditiveBlending:THREE.NormalBlending,
  uniforms:{
   uTime:{value:0},uIndex:{value:Math.floor(idx/3)},uPass:{value:idx%3},uTheme:{value:0},
   uEnergy:{value:.18},uMotion:{value:.6},uDensity:{value:.5}
  }
 })),[geos]);
 const t=useRef(0),ticks=useRef(0),elapsed=useRef(0);
 useEffect(()=>()=>{geos.forEach(x=>x.dispose());materials.forEach(x=>x.dispose());},[geos,materials]);
 useFrame((_,dt)=>{
  if(!paused&&!reduced)t.current+=Math.min(dt,.06);
  elapsed.current+=dt;ticks.current++;
  if(elapsed.current>1.3){onFps(Math.round(ticks.current/elapsed.current));ticks.current=0;elapsed.current=0;}
  materials.forEach(m=>{
   m.uniforms.uTime.value=t.current;
   m.uniforms.uTheme.value=theme==='light'?1:0;
   m.uniforms.uEnergy.value=energy[mode];
   m.uniforms.uMotion.value=reduced?0:motion[mode];
   m.uniforms.uDensity.value=density;
  });
 });
 return <group>{geos.map((g,i)=><mesh key={i} geometry={g} material={materials[i]} renderOrder={i}/>)}</group>;
}
function Glyph({kind}:{kind:'sun'|'moon'|'play'|'pause'|'github'|'expand'}){
 const strokes:Record<string,React.ReactNode>={
  sun:<><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4l1.4 1.4M2 12h2m16 0h2"/></>,
  moon:<path d="M20 14.5A8 8 0 019.5 4 8 8 0 1020 14.5z"/>,
  pause:<><path d="M8 4v16m8-16v16"/></>,
  play:<path d="M8 5l11 7-11 7z"/>,
  github:<><path d="M9 19c-4 1-4-2-6-2m15 4v-3a3 3 0 00-.8-2.5c3-.4 5.4-1.5 5.4-6a4.8 4.8 0 00-1.3-3.3A4.4 4.4 0 0021 2s-1 0-3.3 1.7a11 11 0 00-6 0C9.4 2 8.4 2 8.4 2a4.4 4.4 0 00-.1 3.3A4.8 4.8 0 007 8.6c0 4.5 2.4 5.6 5.4 6a3 3 0 00-.8 2.5V21"/></>,
  expand:<path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5"/>
 };
 return <svg viewBox="0 0 24 24" width="17" height="17" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">{strokes[kind]}</svg>;
}
function App(){
 const [theme,setTheme]=useState<Theme>('dark'),[mode,setMode]=useState<Mode>('idle');
 const [density,setDensity]=useState(.46),[paused,setPaused]=useState(false);
 const [fps,setFps]=useState(0),[reduced,setReduced]=useState(false),[noGl,setNoGl]=useState(false);
 const [large,setLarge]=useState(false);
 useEffect(()=>{const q=matchMedia('(prefers-reduced-motion: reduce)');setReduced(q.matches);const onChange=()=>setReduced(q.matches);q.addEventListener('change',onChange);return()=>q.removeEventListener('change',onChange)},[]);
 useEffect(()=>{const canvas=document.createElement('canvas');setNoGl(!canvas.getContext('webgl2')&&!canvas.getContext('webgl'));},[]);
 const selected=modes.find(x=>x.id===mode)!;
 return <main className={theme}><div className="shell">
 <header className="topbar"><div className="brand"><span className="sound-bars"><i/><i/><i/><i/><i/></span>KONSTANTIN <span className="separator"/> <small>RESEARCH DIVISION</small></div><a className="repo" href="https://github.com/Fioletibiel/Parametric-Ribbon-Lab/tree/experiment/optical-strand-webgl-v01/optical-strand-webgl" target="_blank" rel="noreferrer"><Glyph kind="github"/> PUBLIC LAB ↗</a></header>
 <section className="intro"><div className="eyebrow"><span/> KONSTANTY / OPTICAL PRESENCE STUDY 03</div><h1>Światło, które <em>ma formę.</em></h1><p>Programowo generowana przestrzenna rzeźba z niezależnych włókien 3D, optycznych woali i świetlnych grzbietów — bez deformacji wzorcowej grafiki.</p></section>
 <div className="stage-bar"><span className="online"><b/> LIVE GPU <i>// OPTICAL STRANDS</i></span><div className="themes"><button className={theme==='light'?'active':''} onClick={()=>setTheme('light')}><Glyph kind="sun"/>Light</button><button className={theme==='dark'?'active':''} onClick={()=>setTheme('dark')}><Glyph kind="moon"/>Dark</button></div></div>
 <section className={'stage'+(large?' expanded':'')} aria-label="Animowany prototyp optycznego Konstantego">
  <span className="corner tl"/><span className="corner tr"/><span className="corner bl"/><span className="corner br"/>
  <div className="stage-heading"><div className="assistant-name"><span className="tiny-sound">≋</span><div><strong>Konstanty</strong><small>Jestem do dyspozycji</small></div></div><span className="ready"><b/>Gotowy</span></div>
  <div className="visual">
   {noGl?<div className="fallback">WebGL nie jest dostępny w tej przeglądarce. Otwórz podgląd na urządzeniu z akceleracją GPU.</div>:<Canvas orthographic camera={{position:[0,0,12],zoom:70,near:.1,far:100}} dpr={[1,1.6]} gl={{alpha:true,antialias:true,powerPreference:'high-performance'}} fallback={<div className="fallback">WebGL niedostępny</div>}><CameraFit/><Filaments theme={theme} mode={mode} density={density} paused={paused} reduced={reduced} onFps={setFps}/></Canvas>}
  </div>
  <div className="stage-foot"><span><b/> {selected.desc}</span><span>{fps||'—'} FPS <i/> <button onClick={()=>setLarge(x=>!x)} aria-label="Zmień rozmiar sceny"><Glyph kind="expand"/></button></span></div>
 </section>
 <div className="after-stage"><span>OPTICAL PRESENCE / MATERIAL STUDY <i>/ REAL-TIME</i></span><button onClick={()=>setPaused(p=>!p)}><Glyph kind={paused?'play':'pause'}/>{paused?'Wznów ruch':'Zatrzymaj ruch'}</button></div>
 <section className="controls"><div className="control-title"><strong>CONTROL STUDIO</strong><span>NO. 01—03</span></div><div className="control-group"><div className="control-label">01 / ZACHOWANIE</div><div className="modes">{modes.map(m=><button aria-pressed={mode===m.id} className={mode===m.id?'active':''} key={m.id} onClick={()=>setMode(m.id)}><span>{m.symbol}</span>{m.label}</button>)}</div><p>{selected.desc}. Pasma mają odrębne trajektorie w przestrzeni. Wszystkie podlegają wspólnemu polu deformacji.</p></div>
 <div className="control-group"><div className="control-label"><span>02 / GĘSTOŚĆ WŁÓKIEN</span><span>{Math.round(18+26*density)} linii / warstwę</span></div><div className="range"><span>Subtelne</span><input type="range" min="0" max="1" step=".01" value={density} onChange={e=>setDensity(+e.target.value)} aria-label="Gęstość włókien"/><span>Gęste</span></div><p>Rzeczywiste cienkie pasma mają miękko filtrowane krawędzie. Zmiana gęstości wpływa na ich udział optyczny.</p></div>
 <div className="control-group last"><div className="control-label">03 / RENDERING ENGINE</div><div className="technologies"><div><b>Authored 3D fiber paths</b><span>Geometria przestrzenna</span></div><div><b>Physical filament ribbons</b><span>Filtrowane włókna</span></div><div><b>Independent optical veils</b><span>Subtelna przezroczystość</span></div><div><b>Directional crest glints</b><span>Białe i czerwone refleksy</span></div></div></div></section>
 <footer><span>OPTICAL PRESENCE LAB / EXPERIMENTAL 0.3</span><span>Badanie renderingu. Nie jest to zatwierdzony projekt komercyjny.</span></footer>
 </div></main>;
}
createRoot(document.getElementById('root')!).render(<App/>);
