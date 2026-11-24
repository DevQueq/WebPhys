const L=64,N=L*L;
const R=new Int32Array(N),D=new Int32Array(N);
for(let y=0;y<L;y++)for(let x=0;x<L;x++){const i=y*L+x;R[i]=y*L+(x+1)%L;D[i]=((y+1)%L)*L+x;}
const KV=[[3,4],[4,3],[3,-4],[4,-3],[5,0],[0,5]];
const OM=KV.map(([a,b])=>Math.sqrt(4*Math.sin(Math.PI*a/L)**2+4*Math.sin(Math.PI*b/L)**2));
const BASIS=KV.map(([a,b])=>{const c=new Float64Array(N);for(let y=0;y<L;y++)for(let x=0;x<L;x++)c[y*L+x]=Math.cos(2*Math.PI*(a*x+b*y)/L);return c;});
const T0=2*Math.PI/OM[0];
function rng(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
function forces(S){const u=S.u,a=S.a,kx=S.kx,ky=S.ky,b=S.beta;a.fill(0);
  for(let i=0;i<N;i++){const ui=u[i];let j=R[i],s=u[j]-ui,f=kx[i]*s+b*s*s*s;a[i]+=f;a[j]-=f;j=D[i];s=u[j]-ui;f=ky[i]*s+b*s*s*s;a[i]+=f;a[j]-=f;}}
function energy(S){const u=S.u,v=S.v,b=S.beta;let e=0;
  for(let i=0;i<N;i++){e+=v[i]*v[i]/2;let s=u[R[i]]-u[i];e+=S.kx[i]*s*s/2+b*s**4/4;s=u[D[i]]-u[i];e+=S.ky[i]*s*s/2+b*s**4/4;}return e;}
function measure(S){const u=S.u,v=S.v,out=[];
  for(let m=0;m<S.M;m++){const c=BASIS[m];let q=0,p=0;for(let i=0;i<N;i++){q+=u[i]*c[i];p+=v[i]*c[i];}q*=2/N;p*=2/N;out.push([q,-p/OM[m]]);}return out;}
function makeSim(P){
  const r1=rng(P.seed*9973+1),r2=rng(P.seed*7919+13),r3=rng(P.seed*31+7);
  const kx=new Float64Array(N),ky=new Float64Array(N);
  for(let i=0;i<N;i++){kx[i]=1+P.delta*(2*r1()-1);ky[i]=1+P.delta*(2*r1()-1);}
  const u=new Float64Array(N),v=new Float64Array(N),ph=[];
  for(let m=0;m<P.M;m++){ph.push((P.spread*Math.PI/180)*(2*r2()-1));const c=BASIS[m],A=Math.cos(ph[m]),B=-OM[m]*Math.sin(ph[m]);for(let i=0;i<N;i++){u[i]+=A*c[i];v[i]+=B*c[i];}}
  let s2=0,umax=0;for(let i=0;i<N;i++){const dx=u[R[i]]-u[i],dy=u[D[i]]-u[i];s2+=dx*dx+dy*dy;umax=Math.max(umax,Math.abs(u[i]));}s2/=2*N;
  const S={u,v,kx,ky,M:P.M,beta:P.eta>0?P.eta/(3*s2):0,t:0,dt:0.1/Math.sqrt(1+6*P.eta),a:new Float64Array(N),umax:umax||1};
  S.Eset=energy(S);
  if(P.noise>0){const g=new Float64Array(N);let mean=0;for(let i=0;i<N;i++){g[i]=Math.sqrt(-2*Math.log(r3()+1e-12))*Math.cos(2*Math.PI*r3());mean+=g[i];}mean/=N;let ke=0;for(let i=0;i<N;i++){g[i]-=mean;ke+=g[i]*g[i]/2;}const sc=Math.sqrt(P.noise*S.Eset/ke);for(let i=0;i<N;i++)v[i]+=g[i]*sc;}
  S.E0=energy(S);forces(S);
  const c=measure(S);S.w0=c.reduce((s,[x,y],m)=>s+OM[m]**2*(x*x+y*y),0);
  return S;}
function step(S,n){const u=S.u,v=S.v,a=S.a,h=S.dt,hh=h/2;
  for(let k=0;k<n;k++){for(let i=0;i<N;i++){v[i]+=hh*a[i];u[i]+=h*v[i];}forces(S);for(let i=0;i<N;i++)v[i]+=hh*a[i];}S.t+=n*h;}
function stats(S,c){let sx=0,sy=0,w=0,mx=0,my=0;
  c.forEach(([x,y],m)=>{const a=Math.hypot(x,y)||1e-12;sx+=x/a;sy+=y/a;w+=OM[m]**2*(x*x+y*y);mx+=x;my+=y;});
  return{r:Math.hypot(sx,sy)/c.length,kept:w/S.w0,mean:Math.atan2(my,mx)};}
