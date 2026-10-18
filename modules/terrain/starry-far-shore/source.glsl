// Generated extraction; edit the original implementation and rebuild.
// Source: themes/starry-night-train/index.html
// 原星河云算法移植自 mdb shader，上游未附再分发许可。沿用原声明：仅供学习与欣赏，请勿商用。各模块仍需阅读原主题来源说明。
// This is an exact source excerpt, not a standalone shader.
// Dependencies: noise / hash / sstep; gGlow / gPx / uFarOff / uHorizon; 原宿主色板

// ---------- 远岸与灯光 ----------
vec4 farShore(vec2 p){
  float H=uHorizon;
  if(p.y>H+.03) return vec4(0.);
  float fx=p.x*3.+uFarOff;
  float town=smoothstep(.5,.72,noise(vec2(fx*.3,21.)));
  float top=H+.004+.009*noise(vec2(fx*2.,5.))+.007*town*step(.45,hash(vec2(mod(floor(fx*14.),3584.),3.)));
  float cid=mod(floor(fx*6.),1536.);
  float hc=hash(vec2(cid,7.));
  if(hc<town*.95){
    float k=gPx/540.;
    float lx=(fract(fx*6.)-(.2+.6*hash(vec2(cid,9.))))/18.;
    float ly=p.y-(H+.004+.007*hash(vec2(cid,13.)));
    float d=length(vec2(lx,ly))*gPx;
    float fl=.85+.15*sin(uT*3.+hc*40.);
    gGlow+=cLight*(sstep(1.6*k+.4,.3,d)*1.4+exp(-d*d/(70.*k*k))*.35*uGlow)*fl;
  }
  if(p.y<top) return vec4(mix(cFore,cSkyHor,.22),1.);
  return vec4(0.);
}
