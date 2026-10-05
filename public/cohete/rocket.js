import * as THREE from './vendor/three.module.js';
import { OrbitControls } from './vendor/OrbitControls.js';

/** Monta el cohete. Llama a dispose() al desmontar el componente. */
export function createRocket(container, { autoPlay = true, autoRotate = false, detail = true } = {}) {
const vp=container;
const renderer=new THREE.WebGLRenderer({antialias:true,alpha:true});
renderer.setPixelRatio(Math.min(devicePixelRatio,2));
renderer.setClearColor(0x000000,0);
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=1.35;
renderer.domElement.style.cssText='display:block;width:100%;height:100%;touch-action:none';
renderer.domElement.setAttribute('aria-label','Cohete 3D interactivo');
vp.appendChild(renderer.domElement);
const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(36,1,.1,100);camera.position.set(12,7,20);const controls=new OrbitControls(camera,renderer.domElement);controls.target.set(0,.5,0);controls.enableDamping=true;controls.minDistance=6;controls.maxDistance=32;controls.enablePan=false;controls.autoRotateSpeed=.65;
scene.add(new THREE.HemisphereLight(0xeaf3ff,0x687a98,3));function light(color,power,pos){const l=new THREE.DirectionalLight(color,power);l.position.set(...pos);scene.add(l);}light(0xffffff,4,[5,9,7]);light(0x9ac4ff,3,[-5,3,-5]);light(0xffffff,2,[0,-3,6]);
const root=new THREE.Group();scene.add(root);root.rotation.z=-.12;
const mats={white:new THREE.MeshStandardMaterial({color:0xf2f5fa,metalness:.32,roughness:.27,side:THREE.DoubleSide}),blue:new THREE.MeshStandardMaterial({color:0x176bfa,metalness:.38,roughness:.24,side:THREE.DoubleSide}),dark:new THREE.MeshStandardMaterial({color:0x182332,metalness:.7,roughness:.3,side:THREE.DoubleSide}),silver:new THREE.MeshStandardMaterial({color:0x9aafc7,metalness:.75,roughness:.26}),pale:new THREE.MeshStandardMaterial({color:0xc5deff,metalness:.45,roughness:.25}),glass:new THREE.MeshPhysicalMaterial({color:0x095bbd,metalness:.65,roughness:.12}),circuit:new THREE.MeshStandardMaterial({color:0x235b86,metalness:.4,roughness:.4})};
const parts=[],details=[],groups=Array.from({length:6},()=>[]);
function part(name,sys,pos,delta){const g=new THREE.Group();g.position.set(...pos);g.userData={name,sys,base:new THREE.Vector3(...pos),delta:new THREE.Vector3(...delta)};root.add(g);parts.push(g);groups[sys].push(g);return g;}
function mesh(g,geo,mat,pos=[0,0,0],detail=false){const m=new THREE.Mesh(geo,mats[mat]);m.position.set(...pos);g.add(m);if(detail)details.push(m);return m;}
const cyl=(r1,r2,h,open=false,start=0,len=Math.PI*2)=>new THREE.CylinderGeometry(r1,r2,h,64,1,open,start,len);
function ring(g,r,y,mat='silver',detail=false){const m=mesh(g,new THREE.TorusGeometry(r,.035,8,64),mat,[0,y,0],detail);m.rotation.x=Math.PI/2;return m;}
function bolts(g,r,y,count=16){for(let i=0;i<count;i++){const a=i/count*Math.PI*2;mesh(g,new THREE.SphereGeometry(.035,6,4),'dark',[Math.sin(a)*r,y,Math.cos(a)*r],true);}}
// Aerodynamic nose, built as a continuous curved surface.
const nose=part('Cofia',0,[0,3.03,0],[0,2.5,0]);const profile=[];for(let i=0;i<=28;i++){const t=i/28;profile.push(new THREE.Vector2(.85*Math.cos(t*Math.PI/2),t*1.85));}mesh(nose,new THREE.LatheGeometry(profile,64),'white');mesh(nose,cyl(.855,.855,.18),'blue',[0,.06,0]);ring(nose,.83,-.025);bolts(nose,.856,.05);
const avionics=part('Aviónica',1,[0,2.35,0],[0,1.1,0]);mesh(avionics,cyl(.73,.73,.11),'dark',[0,-.27,0]);mesh(avionics,cyl(.73,.73,.11),'silver',[0,.28,0]);for(let i=0;i<4;i++){const a=i*Math.PI/2;mesh(avionics,new THREE.BoxGeometry(.34,.36,.26),'circuit',[Math.sin(a)*.4,0,Math.cos(a)*.4]);mesh(avionics,new THREE.BoxGeometry(.2,.05,.2),'dark',[Math.sin(a)*.4,.21,Math.cos(a)*.4],true);for(let k=0;k<4;k++)mesh(avionics,new THREE.BoxGeometry(.035,.22,.02),'silver',[Math.sin(a)*.4+(k-1.5)*.06,0,Math.cos(a)*.4+.14],true);}mesh(avionics,cyl(.025,.025,.55),'silver',[0,.58,0]);mesh(avionics,new THREE.SphereGeometry(.065,12,8),'blue',[0,.88,0],true);
const tank=part('Depósitos',2,[0,.15,0],[0,.25,0]);for(const [y,h,mat]of [[.82,1.6,'pale'],[-.98,1.55,'blue']]){mesh(tank,new THREE.CapsuleGeometry(.61,h-1.22,8,40),mat,[0,y,0]);ring(tank,.612,y-.12);ring(tank,.612,y+.12);mesh(tank,cyl(.12,.12,.18),'silver',[0,y+h/2+.03,0],true);}for(const x of [-.7,.7]){mesh(tank,cyl(.033,.033,3.6),'silver',[x,0,0],true);for(const y of [-1.1,.4,1.5])mesh(tank,new THREE.BoxGeometry(.11,.13,.13),'dark',[x,y,0],true);}
const frame=part('Estructura',3,[0,0,0],[-2.55,0,-.4]);for(const y of [-2,-.15,1.95]){ring(frame,.76,y,'dark');bolts(frame,.77,y,12);}for(let i=0;i<6;i++){const a=i*Math.PI/3;const x=Math.sin(a)*.74,z=Math.cos(a)*.74;mesh(frame,cyl(.026,.026,4),'silver',[x,0,z]);for(const y of [-1.1,.85]){const m=mesh(frame,cyl(.018,.018,2.1),'silver',[x,y,z],true);m.rotation.z=i%2?.35:-.35;}}
const engine=part('Motor',4,[0,-2.8,0],[0,-1.6,0]);mesh(engine,cyl(.62,.48,.3),'dark',[0,.63,0]);mesh(engine,new THREE.SphereGeometry(.34,32,24),'silver',[0,.22,0]);const bell=[];for(let i=0;i<=24;i++){const t=i/24;bell.push(new THREE.Vector2(.21+.49*t*t,-t*1.0));}mesh(engine,new THREE.LatheGeometry(bell,64),'dark');ring(engine,.7,-1,'silver');for(let i=0;i<20;i++){const a=i/20*Math.PI*2;const points=bell.map(p=>new THREE.Vector3(Math.sin(a)*(p.x+.01),p.y,Math.cos(a)*(p.x+.01)));mesh(engine,new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),24,.012,5,false),'silver',[0,0,0],true);}for(const x of [-.47,.47]){mesh(engine,cyl(.1,.1,.65),'blue',[x,.16,0]);const curve=new THREE.CatmullRomCurve3([new THREE.Vector3(x,.45,0),new THREE.Vector3(x,.65,.3),new THREE.Vector3(0,.3,.32)]);mesh(engine,new THREE.TubeGeometry(curve,15,.045,8,false),'silver',[0,0,0],true);}bolts(engine,.59,.75);
// Four independent shell petals open radially to expose the complete interior.
for(let i=0;i<4;i++){const start=i*Math.PI/2+.025,mid=start+Math.PI/4-.025;const shell=part('Carcasa',5,[0,0,0],[3.3+i*.48,(i-1.5)*.28,-1.7+i*.75]);mesh(shell,cyl(.87,.87,4.18,true,start,Math.PI/2-.05),'white',[0,.87,0]);mesh(shell,cyl(.875,.875,.4,true,start,Math.PI/2-.05),'blue',[0,-.77,0]);mesh(shell,cyl(.89,.89,1.25,true,start,Math.PI/2-.05),'white',[0,-1.83,0]);for(const y of [-2.44,-1.23,2.94]){mesh(shell,cyl(.884,.884,.04,true,start,Math.PI/2-.05),'silver',[0,y,0],true);}const finshape=new THREE.Shape();finshape.moveTo(.81,-1.2);finshape.lineTo(1.7,-2.45);finshape.lineTo(1.7,-2.95);finshape.lineTo(.82,-2.45);finshape.closePath();const fin=mesh(shell,new THREE.ExtrudeGeometry(finshape,{depth:.07,bevelEnabled:true,bevelThickness:.025,bevelSize:.025,bevelSegments:2}),'blue');fin.rotation.y= -mid+Math.PI/2;for(const y of [-2.25,-1.45,2.75]){mesh(shell,new THREE.SphereGeometry(.035,6,4),'dark',[Math.sin(mid)*.885,y,Math.cos(mid)*.885],true);}}
// Blue observation port on the front shell.
const front=groups[5][0];const windowRing=mesh(front,new THREE.TorusGeometry(.245,.055,12,40),'dark',[.59,2.3,.66]);windowRing.rotation.y=Math.PI/4;const glass=mesh(front,new THREE.CircleGeometry(.24,40),'glass',[.602,2.3,.674]);glass.rotation.y=Math.PI/4;
const grid=new THREE.PolarGridHelper(5.5,12,5,96,0xd8e1ef,0xe4eaf3);grid.position.y=-5.6;scene.add(grid);

controls.autoRotate=autoRotate;
details.forEach(m=>m.visible=detail);
let value=0,target=0,playing=autoPlay,phase=0,last=performance.now(),frameId,disposed=false;
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
if(reduced)playing=false;
function resize(){const w=Math.max(vp.clientWidth,1),h=Math.max(vp.clientHeight,1);renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();}
const observer=new ResizeObserver(resize);observer.observe(vp);resize();
function tick(now){if(disposed)return;const dt=Math.min((now-last)/1000,.05);last=now;
if(playing){phase+=dt;const cycle=phase%14;target=cycle<2?0:cycle<7?1:cycle<9?1:0;}
value+=(target-value)*(reduced?1:Math.min(1,dt*(playing?1.3:5)));
if(Math.abs(target-value)<.001)value=target;
const smooth=value*value*(3-2*value);
parts.forEach(p=>p.position.copy(p.userData.base).addScaledVector(p.userData.delta,smooth));
controls.update();renderer.render(scene,camera);frameId=requestAnimationFrame(tick);
}
frameId=requestAnimationFrame(tick);
return {
setSeparation(percent){if(!Number.isFinite(percent)||percent<0||percent>100)throw new RangeError('Usa un porcentaje entre 0 y 100');playing=false;target=percent/100;},
play(){playing=true;phase=0;},
pause(){playing=false;target=value;},
setDetail(enabled){details.forEach(m=>m.visible=Boolean(enabled));},
setAutoRotate(enabled){controls.autoRotate=Boolean(enabled);},
resetCamera(){camera.position.set(12,7,20);controls.target.set(0,.5,0);controls.update();},
dispose(){if(disposed)return;disposed=true;cancelAnimationFrame(frameId);observer.disconnect();controls.dispose();const geometries=new Set(),materials=new Set();scene.traverse(o=>{if(o.geometry)geometries.add(o.geometry);if(o.material)(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>materials.add(m));});geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());renderer.dispose();renderer.domElement.remove();}
};
}
