/**
 * Dependency-free starfield. destroy() removes all listeners and animation.
 *
 * `options.theme === 'paper'` (añadido para la landing): el cielo se queda
 * blanco y las estrellas se dibujan en tinta oscura, ganando presencia a
 * medida que se baja. Sin ese modo el comportamiento original no cambia.
 */
export function createUniverse(canvas, options = {}) {
  const ctx = canvas.getContext('2d', { alpha: false });
  if (!ctx) throw new Error('Canvas 2D no disponible');
  const duration = options.duration ?? 28;
  const paper = options.theme === 'paper';
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let width = 1, height = 1, dpr = 1, frame = 0, last = 0, elapsed = 0;
  let paused = reduced.matches, destroyed = false;
  let scrollPosition = 0, scrollVelocity = 0;
  const scrollTarget = () => Math.max(0,Math.min(1,window.scrollY / Math.max(1,document.documentElement.scrollHeight-innerHeight)));
  let pointer = { x: 0, y: 0 }, camera = { x: 0, y: 0 };
  let seed = 727;
  const random = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
  const stars = Array.from({ length: options.count ?? 12000 }, (_, i) => {
    const spiral = i % 3 === 0;
    const radius = 150 + Math.pow(random(), .7) * 2400;
    const theta = radius * .0024 + (i % 2) * Math.PI + (random()-.5)*.8;
    return {
      x: spiral ? Math.cos(theta)*radius : (random()-.5)*5600,
      y: spiral ? Math.sin(theta)*radius*.52+(random()-.5)*200 : (random()-.5)*3600,
      z: random()*2600+100, size: .6+Math.pow(random(),4)*2.6,
      phase: random()*Math.PI*2, color: Math.floor(random()*5),
      alpha: .6+random()*.4,
      reveal: random(),
    };
  });
  const dark = [[5,8,18],[12,22,67],[28,36,108],[64,30,98],[30,35,65]];
  const light = [[225,235,255],[150,180,255],[125,145,255],[196,160,255],[236,216,255]];
  const glow = light.map(c => {
    const sprite = document.createElement('canvas'); sprite.width = sprite.height = 64;
    const g = sprite.getContext('2d');
    const grad = g.createRadialGradient(32,32,0,32,32,32);
    grad.addColorStop(0,`rgba(${c},.75)`);grad.addColorStop(.12,`rgba(${c},.3)`);grad.addColorStop(.45,`rgba(${c},.06)`);grad.addColorStop(1,`rgba(${c},0)`);
    g.fillStyle=grad;g.fillRect(0,0,64,64); return sprite;
  });
  function resize() {
    const box=canvas.getBoundingClientRect(); width=box.width; height=box.height;
    dpr=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);
    draw();
  }
  const mix = (a,b,t) => a+(b-a)*t;
  function draw() {
    const t=options.mode === "time" ? Math.min(1,elapsed/duration) : scrollPosition, night=t*t*(3-2*t);
    const bg=paper?[255,255,255]:[mix(255,3,night),mix(255,5,night),mix(255,16,night)];
    ctx.setTransform(dpr,0,0,dpr,0,0);ctx.globalAlpha=1;
    ctx.fillStyle=`rgb(${bg})`;ctx.fillRect(0,0,width,height);
    if(!paper && night>.05){
      const haze=ctx.createRadialGradient(width*.58,height*.5,0,width*.58,height*.5,width*.65);
      haze.addColorStop(0,`rgba(54,44,112,${night*.12})`);haze.addColorStop(.5,`rgba(30,46,112,${night*.055})`);haze.addColorStop(1,'rgba(0,0,0,0)');
      ctx.fillStyle=haze;ctx.fillRect(0,0,width,height);
    }
    if(!paper && night>.25){
      for(const [px,py,rgb,strength] of [[.36,.42,'76,44,166',.13],[.68,.57,'36,88,181',.12],[.54,.48,'139,76,176',.07]]){
        const nebula=ctx.createRadialGradient(width*px,height*py,0,width*px,height*py,Math.max(width,height)*.48);
        nebula.addColorStop(0,`rgba(${rgb},${night*strength})`);nebula.addColorStop(1,`rgba(${rgb},0)`);
        ctx.fillStyle=nebula;ctx.fillRect(0,0,width,height);
      }
    }
    const focal=Math.max(width,height)*.72;
    const angle=elapsed*.0025+scrollPosition*.48, co=Math.cos(angle), si=Math.sin(angle);
    const starLight = paper ? 0 : Math.pow(night,1.7);
    // En papel la tinta es cero mientras se ve el hero (`inkStart` lo fija
    // quien llama). Nada más pasarlo aparece de golpe pero suave, ya bien
    // visible, y a partir de ahí sigue ganando cuerpo hasta el final.
    const inkStart = options.inkStart ?? .2;
    const ease = v => v * v * (3 - 2 * v);
    const clamp01 = v => v < 0 ? 0 : v > 1 ? 1 : v;
    const aparicion = ease(clamp01((t - inkStart) / .045));
    const recorrido = ease(clamp01((t - inkStart) / Math.max(.2, 1 - inkStart)));
    const inkStrength = aparicion * (.42 + .4 * recorrido);
    const palette=dark.map((c,i)=>`rgb(${c.map((v,j)=>mix(v,light[i][j],starLight))})`);
    const revealProgress=Math.max(0,Math.min(1,(t-.15)/.2));
    const revealOpacity=revealProgress*revealProgress*(3-2*revealProgress);
    for (const s of stars) {
      const visibility=s.reveal<.4?1:revealOpacity;
      if(visibility===0)continue;
      const z=100+((s.z-100-elapsed*9-scrollPosition*2600)%2600+2600)%2600;
      const scale=focal/z;
      const x=(s.x*co-s.y*si-camera.x*55-Math.sin(scrollPosition*2.4)*240)*scale+width/2;
      const y=(s.x*si+s.y*co-camera.y*40-scrollPosition*260)*scale+height/2;
      if(x < -30||x>width+30||y < -30||y>height+30)continue;
      const edge=Math.min(1,(z-100)/120,(2700-z)/180);
      const r=Math.max(mix(.62,.42,night),Math.min(4.2,s.size*scale*.8));
      const twinkle=.84+.16*Math.sin(elapsed*(.6+s.alpha)+s.phase);
      const a=s.alpha*edge*mix(.95,twinkle,night)*visibility*(paper?inkStrength:1);
      if(!paper && night>.1 && r>.7){ctx.globalAlpha=a*night*.95;ctx.drawImage(glow[s.color],x-r*10,y-r*10,r*20,r*20);}
      // Short perspective trails respond to scroll speed and settle immediately.
      if(!reduced.matches && Math.abs(scrollVelocity)>.015 && r>.85){
        const strength=Math.min(.06,Math.abs(scrollVelocity)*.1)*Math.min(2,scale);
        const dx=(x-width/2)*strength, dy=(y-height/2)*strength;
        const length=Math.hypot(dx,dy), limit=Math.min(1,32/Math.max(1,length));
        ctx.globalAlpha=a*mix(.2,.5,night);ctx.strokeStyle=palette[s.color];ctx.lineWidth=r*.65;
        ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x-dx*limit*Math.sign(scrollVelocity),y-dy*limit*Math.sign(scrollVelocity));ctx.stroke();
      }
      ctx.globalAlpha=a;ctx.fillStyle=palette[s.color];ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();
      if(!paper && r>1.9 && night>.5){ctx.globalAlpha=a*(night-.5)*.7;ctx.fillRect(x-r*5,y-.3,r*10,.6);ctx.fillRect(x-.3,y-r*5,.6,r*10);}
    }
    ctx.globalAlpha=1;
    options.onProgress?.(t);
  }
  function tick(now){
    if(destroyed)return;
    const dt=last?Math.min((now-last)/1000,.05):0;last=now;
    if(!document.hidden){
      const target=scrollTarget();
      const previous=scrollPosition;
      scrollPosition += (target-scrollPosition)*(reduced.matches?1:1-Math.exp(-dt*4));
      scrollVelocity=dt>0?(scrollPosition-previous)/dt:0;
      if(!paused)elapsed+=dt;camera.x+=(pointer.x-camera.x)*Math.min(1,dt*2);camera.y+=(pointer.y-camera.y)*Math.min(1,dt*2);draw();}
    frame=requestAnimationFrame(tick);
  }
  const move=e=>{pointer.x=e.clientX/innerWidth*2-1;pointer.y=e.clientY/innerHeight*2-1;};
  const leave=()=>{pointer={x:0,y:0};};
  const motion=()=>{paused=reduced.matches;};
  const observer=new ResizeObserver(resize);observer.observe(canvas);
  window.addEventListener('pointermove',move,{passive:true});document.addEventListener('pointerleave',leave);reduced.addEventListener('change',motion);
  resize();frame=requestAnimationFrame(tick);
  return {
    pause(value=true){paused=value;},
    restart(){elapsed=0;last=0;window.scrollTo({top:0,behavior:reduced.matches?"instant":"smooth"});draw();},
    setProgress(value){scrollPosition=Math.max(0,Math.min(1,value));elapsed=scrollPosition*duration;draw();},
    get paused(){return paused;},
    destroy(){destroyed=true;cancelAnimationFrame(frame);observer.disconnect();window.removeEventListener('pointermove',move);document.removeEventListener('pointerleave',leave);reduced.removeEventListener('change',motion);},
  };
}
