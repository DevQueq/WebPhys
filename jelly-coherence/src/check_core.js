eval(require('fs').readFileSync(require('path').join(__dirname,'core.js'),'utf8')+`
function run(P,T){const S=makeSim(P);const out=[];let next=0;const t1=Date.now();
 while(S.t<T*T0){step(S,20);if(S.t>=next){const c=measure(S);const st=stats(S,c);out.push([+(S.t/T0).toFixed(1),+st.r.toFixed(3),+st.kept.toFixed(3)]);next+=T*T0/6;}}
 const E=energy(S);return {P:JSON.stringify(P),drift:((E-S.E0)/S.E0).toExponential(2),ms:Date.now()-t1,out:JSON.stringify(out)};}
const base={eta:0,delta:0,noise:0,M:4,spread:0,seed:1};
for(const ch of [{},{M:6},{delta:0.2},{delta:0.6},{eta:0.3},{noise:0.5},{eta:0.3,noise:0.5},{eta:1,noise:0.5},{spread:180}]) console.log(run({...base,...ch},30));
`);
