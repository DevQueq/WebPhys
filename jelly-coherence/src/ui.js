const ETA=[0,0.003,0.01,0.03,0.1,0.3,1,2];
const MAP_E=[0,0.01,0.03,0.1,0.3,1],MAP_D=[0,0.1,0.2,0.4,0.6,0.8];
const $=id=>document.getElementById(id);
const sl={eta:$('sEta'),delta:$('sDel'),noise:$('sNoi'),M:$('sM'),spread:$('sSpr'),spd:$('sSpd')};
let seed=1,S=null,P=null,hist=[],ghosts=[],running=true,frame=0,col={},lut=null,last=null;
const off=document.createElement('canvas');off.width=L;off.height=L;const octx=off.getContext('2d');const img=octx.createImageData(L,L);
const probe=document.createElement('span');probe.style.display='none';document.body.appendChild(probe);
function resolve(v){probe.style.color=`var(${v})`;const m=getComputedStyle(probe).color.match(/[\d.]+/g)||[0,0,0];return m.slice(0,3).map(Number);}
function palette(){['--bg','--ink','--soft','--panel','--line','--rasp','--teal','--amber','--m0','--m1','--m2','--m3','--m4','--m5'].forEach(k=>col[k]=resolve(k));
  lut=new Uint8ClampedArray(256*3);const z=col['--panel'],p=col['--rasp'],n=col['--teal'];
  for(let j=0;j<256;j++){const x=j/127.5-1,a=Math.min(1,Math.abs(x)**0.8),t=x>0?p:n;for(let c=0;c<3;c++)lut[j*3+c]=z[c]+(t[c]-z[c])*a;}}
const rgb=(k,a=1)=>`rgba(${col[k].join(',')},${a})`;
function params(){return{eta:ETA[+sl.eta.value],delta:+sl.delta.value,noise:+sl.noise.value,M:+sl.M.value,spread:+sl.spread.value,seed};}
function label(p){return `η ${p.eta}, δ ${p.delta}, jostle ${p.noise}, ${p.M} members, spread ${p.spread}°`;}
function outputs(){$('oEta').textContent=ETA[+sl.eta.value];$('oDel').textContent=(+sl.delta.value).toFixed(2);$('oNoi').textContent=Math.round(sl.noise.value*100)+'%';
  $('oM').textContent=sl.M.value;$('oSpr').textContent=sl.spread.value+'°';$('oSpd').textContent=sl.spd.value+'×';}
function restart(keep=true){if(keep&&hist.length>20&&P){ghosts.unshift({h:hist,p:P});ghosts=ghosts.slice(0,3);}
  P=params();S=makeSim(P);hist=[];$('warn').textContent='';outputs();
  $('legend').innerHTML=KV.slice(0,P.M).map((k,m)=>`<div><i style="background:var(--m${m})"></i><span>Direction (${k[0]},${k[1]}), ω ${OM[m].toFixed(4)}</span><span id="amp${m}">100%</span></div>`).join('');
  $('fEta').textContent=P.eta;sample();renderRuns();markMap();}
function sample(){const c=measure(S),st=stats(S,c);last={c,st};hist.push([S.t/T0,st.r,Math.min(1.3,st.kept)]);
  if(hist.length>4000)hist=hist.filter((_,i)=>i%2==0);}
function sizeCanvas(cv){const r=cv.getBoundingClientRect(),d=window.devicePixelRatio||1;const w=Math.round(r.width*d),h=Math.round(r.height*d);if(cv.width!==w||cv.height!==h){cv.width=w;cv.height=h;}return[cv.getContext('2d'),w,h,d];}
function drawField(){const u=S.u,d=img.data,s=127.5/S.umax;
  for(let i=0;i<N;i++){let j=Math.round(u[i]*s+127.5);j=j<0?0:j>255?255:j;d[i*4]=lut[j*3];d[i*4+1]=lut[j*3+1];d[i*4+2]=lut[j*3+2];d[i*4+3]=255;}
  octx.putImageData(img,0,0);const[ctx,w,h]=sizeCanvas($('field'));ctx.imageSmoothingEnabled=false;ctx.drawImage(off,0,0,w,h);}
function drawDial(){const[ctx,w,h,d]=sizeCanvas($('dial'));const cx=w/2,cy=h/2,R=Math.min(w,h)/2-10*d;ctx.clearRect(0,0,w,h);
  ctx.strokeStyle=rgb('--line');ctx.lineWidth=1.5*d;ctx.beginPath();ctx.arc(cx,cy,R/1.2,0,7);ctx.stroke();ctx.beginPath();ctx.moveTo(cx-R,cy);ctx.lineTo(cx+R,cy);ctx.moveTo(cx,cy-R);ctx.lineTo(cx,cy+R);ctx.stroke();
  const{c,st}=last;c.forEach(([x,y],m)=>{const a=Math.atan2(y,x)-st.mean+Math.PI/2,len=Math.min(1.2,Math.hypot(x,y))*R/1.2;
    const ex=cx+len*Math.cos(a),ey=cy-len*Math.sin(a);ctx.strokeStyle=ctx.fillStyle=rgb('--m'+m);ctx.lineWidth=3.5*d;ctx.lineCap='round';
    ctx.beginPath();ctx.moveTo(cx,cy);ctx.lineTo(ex,ey);ctx.stroke();ctx.beginPath();ctx.arc(ex,ey,5*d,0,7);ctx.fill();});
  ctx.fillStyle=rgb('--ink');ctx.beginPath();ctx.arc(cx,cy,4*d,0,7);ctx.fill();}
function drawPlot(){const[ctx,w,h,d]=sizeCanvas($('plot'));ctx.clearRect(0,0,w,h);const narrow=w/d<520;
  const L0=44*d,R0=16*d,T=14*d,B=30*d,gap=26*d,ph=(h-T-B-gap)/2,pw=w-L0-R0;
  const tNow=hist.length?hist[hist.length-1][0]:0;let tMax=30;ghosts.forEach(g=>tMax=Math.max(tMax,g.h[g.h.length-1][0]));tMax=Math.max(tMax,tNow);tMax=Math.ceil(tMax/10)*10;
  ctx.font=`${13*d}px Inter,sans-serif`;ctx.textBaseline='middle';
  [[1,'Phase coherence r',[0,0.5,1],1],[2,'Energy in set',[0,0.5,1],1.2]].forEach(([k,name,ticks,ymax],pi)=>{const y0=T+pi*(ph+gap);const Y=v=>y0+ph-(Math.max(0,Math.min(ymax,v))/ymax)*ph;
    ctx.strokeStyle=rgb('--line');ctx.lineWidth=d;ctx.fillStyle=rgb('--soft');ctx.textAlign='right';
    ticks.forEach(t=>{ctx.beginPath();ctx.moveTo(L0,Y(t));ctx.lineTo(L0+pw,Y(t));ctx.stroke();ctx.fillText(k==2?Math.round(t*100)+'%':t.toFixed(1),L0-6*d,Y(t));});
    ctx.textAlign='left';ctx.fillStyle=rgb('--ink');ctx.fillText(name,L0+8*d,y0+10*d);
    const line=(H,c,wd)=>{ctx.strokeStyle=c;ctx.lineWidth=wd*d;ctx.beginPath();H.forEach((q,i)=>{const x=L0+q[0]/tMax*pw,y=Y(q[k]);i?ctx.lineTo(x,y):ctx.moveTo(x,y);});ctx.stroke();};
    ghosts.forEach((g,i)=>line(g.h,rgb('--soft',0.55-0.12*i),1.5));line(hist,rgb('--rasp'),2.5);});
  ctx.fillStyle=rgb('--soft');ctx.textAlign='center';const step=tMax/(narrow?2:5);
  for(let t=0;t<=tMax+1e-9;t+=step)ctx.fillText(Math.round(t),L0+t/tMax*pw,h-B/2);
  ctx.textAlign='right';if(!narrow)ctx.fillText('periods',w-R0,h-B/2-14*d);}
function renderRuns(){$('runs').innerHTML=`<span><b>Now:</b> ${label(P)}</span>`+ghosts.map((g,i)=>`<span><b>Run −${i+1}:</b> ${label(g.p)}</span>`).join('');}
function readouts(){const{c,st}=last;$('rBig').textContent=st.r.toFixed(2);$('fT').textContent=(S.t/T0).toFixed(1)+' periods';
  $('fK').textContent=Math.round(st.kept*100)+'%';const e=(energy(S)-S.E0)/S.E0*100;$('fE').textContent=(e>=0?'+':'−')+Math.abs(e).toFixed(3)+'%';
  c.forEach(([x,y],m)=>{const el=$('amp'+m);if(el)el.textContent=Math.round(Math.hypot(x,y)*100)+'% amplitude';});
  if(!isFinite(e)||Math.abs(e)>5){running=false;$('bRun').textContent='Run';$('warn').textContent='The integration went unstable at this coupling. Lower η or restart.';}}
function tick(){frame++;
  if(sweep)sweepWork();
  else if(running&&S){const n=Math.max(1,Math.round(+sl.spd.value*T0/(20*S.dt)));step(S,n);sample();}
  if(S&&last){drawField();drawDial();if(frame%3==0)drawPlot();if(frame%6==0)readouts();}
  requestAnimationFrame(tick);}
/* regime map */
let sweep=null,mapVals=[];
function cellOrder(){const a=[];MAP_D.forEach((dd,di)=>MAP_E.forEach((ee,ei)=>a.push({di,ei})));return a;}
function buildMap(){let h='';for(let di=MAP_D.length-1;di>=0;di--){h+=`<div class="ax">δ ${MAP_D[di]}</div>`;MAP_E.forEach((e,ei)=>h+=`<button class="c" id="c${di}_${ei}" data-d="${di}" data-e="${ei}" aria-label="η ${e}, δ ${MAP_D[di]}">·</button>`);}
  h+='<div class="ax"></div>'+MAP_E.map(e=>`<div class="ax">η ${e}</div>`).join('');$('map').innerHTML=h;markMap();}
function paintCell(di,ei,v,metric){const el=$(`c${di}_${ei}`);if(v==null||!isFinite(v)){el.textContent='–';el.style.background='';return;}
  const x=Math.max(0,Math.min(1,v));el.textContent=metric=='r'?v.toFixed(2):Math.round(v*100)+'%';
  el.style.background=`color-mix(in oklab,var(--rasp) ${Math.round(x*100)}%,var(--panel))`;el.style.color=x>0.55?'#fff':'var(--ink)';}
function markMap(){document.querySelectorAll('.map .c').forEach(el=>el.classList.toggle('cur',P&&MAP_E[el.dataset.e]==P.eta&&MAP_D[el.dataset.d]==P.delta));}
function startSweep(){const base=params();sweep={base,cells:cellOrder(),i:0,T:+$('mDur').value,metric:$('mMetric').value,sim:null};mapVals=[];
  document.querySelectorAll('.map .c').forEach(el=>{el.textContent='·';el.style.background='';el.style.color='';});$('bMap').textContent='Stop';}
function sweepWork(){const t0=performance.now(),sw=sweep;
  while(performance.now()-t0<14){
    if(!sw.sim){const{di,ei}=sw.cells[sw.i];sw.sim=makeSim({...sw.base,eta:MAP_E[ei],delta:MAP_D[di]});sw.acc=0;sw.n=0;sw.next=0.75*sw.T*T0;}
    const s=sw.sim;step(s,10);
    if(s.t>=sw.next){const st=stats(s,measure(s));sw.acc+=sw.metric=='r'?st.r:Math.min(1.3,st.kept);sw.n++;sw.next+=T0/4;}
    if(s.t>=sw.T*T0||!isFinite(s.u[0])){const{di,ei}=sw.cells[sw.i];const v=isFinite(s.u[0])?sw.acc/Math.max(1,sw.n):NaN;mapVals.push(v);paintCell(di,ei,v,sw.metric);sw.sim=null;sw.i++;
      if(sw.i>=sw.cells.length){endSweep(`Done: ${label(sw.base).replace(/^η [^,]+, δ [^,]+, /,'')}, ${sw.T} periods.`);return;}}}
  $('mBar').style.width=(sweep.i/sweep.cells.length*100)+'%';$('mStat').textContent=`Running cell ${sweep.i+1} of ${sweep.cells.length}…`;}
function endSweep(msg){sweep=null;$('bMap').textContent='Run map';$('mBar').style.width=msg.startsWith('Done')?'100%':'0';$('mStat').textContent=msg;}
/* wiring */
Object.entries(sl).forEach(([k,el])=>el.addEventListener('input',()=>{outputs();if(k!=='spd')restart();}));
$('bRun').addEventListener('click',()=>{running=!running;$('bRun').textContent=running?'Pause':'Run';});
$('bRestart').addEventListener('click',()=>{running=true;$('bRun').textContent='Pause';restart();});
$('bSeed').addEventListener('click',()=>{seed++;restart();});
document.querySelectorAll('.presets button').forEach(b=>b.addEventListener('click',()=>{const p=JSON.parse(b.dataset.p);sl.eta.value=p.eta;sl.delta.value=p.delta;sl.noise.value=p.noise;sl.M.value=p.M;sl.spread.value=p.spread;running=true;$('bRun').textContent='Pause';restart();}));
$('bMap').addEventListener('click',()=>sweep?endSweep('Stopped.'):startSweep());
$('map').addEventListener('click',e=>{const b=e.target.closest('.c');if(!b||sweep)return;sl.eta.value=ETA.indexOf(MAP_E[b.dataset.e]);sl.delta.value=MAP_D[b.dataset.d];running=true;$('bRun').textContent='Pause';restart();window.scrollTo({top:0,behavior:'smooth'});});
new MutationObserver(palette).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
matchMedia('(prefers-color-scheme: dark)').addEventListener('change',palette);
if(matchMedia('(prefers-reduced-motion: reduce)').matches){running=false;$('bRun').textContent='Run';}
palette();buildMap();restart(false);requestAnimationFrame(tick);
