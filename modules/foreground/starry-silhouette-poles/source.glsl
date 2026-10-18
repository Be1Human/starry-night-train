// Generated extraction; edit the original implementation and rebuild.
// Source: themes/starry-night-train/index.html
// 原星河云算法移植自 mdb shader，上游未附再分发许可。沿用原声明：仅供学习与欣赏，请勿商用。各模块仍需阅读原主题来源说明。
// This is an exact source excerpt, not a standalone shader.
// Dependencies: landMask / hash / noise; gPx / uFore / uHorizon / cFore; 原宿主近景积分状态

// ---------- 近景：树丛、电线杆 ----------
float landMask(float fx){ float s=mod(fx+.35,1.95); return smoothstep(0.,.05,s)*sstep(.56,.48,s); }
vec4 fore(vec2 p){
  float H=uHorizon;
  float fx=p.x+uFore;
  float s=mod(fx+.35,1.95);
  float ptop=H+.24;
  float dp=min(abs(s-.15),abs(s-.42));
  if(p.y<ptop&&dp<max(.0022,1./gPx)) return vec4(cFore,1.);
  if(abs(p.y-(ptop-.012))<max(.0016,.6/gPx)&&dp<.02) return vec4(cFore,1.);
  if(abs(p.y-(ptop-.03))<max(.0014,.6/gPx)&&dp<.014) return vec4(cFore,1.);
  if(p.y<ptop){
    float u, sag;
    if(s>=.15&&s<=.42){ u=(s-.15)/.27; sag=.01; }
    else { float s2=s<.15?s+1.95:s; u=(s2-.42)/1.68; sag=.06; }
    float dropW=4.*u*(1.-u)*sag;
    float lw=max(.0009,.55/gPx);
    if(abs(p.y-(ptop-.012-dropW))<lw||abs(p.y-(ptop-.03-dropW))<lw) return vec4(cFore,.9);
  }
  float lm=landMask(fx);
  if(lm<=0.||p.y>H+.2) return vec4(0.);
  float cw=.025; float id=floor(fx/cw);
  float top=H+.01*lm;
  for(int k=-1;k<=1;k++){
    float cid=id+float(k);
    float hm=mod(cid,78.);
    float c=(cid+.5)*cw+(hash(vec2(hm,1.))-.5)*.01;
    float ht=landMask(c)*(.025+.1*hash(vec2(hm,2.))*hash(vec2(hm,5.))+.025*hash(vec2(hm,7.)));
    float dxn=abs(fx-c)/(cw*(.8+.8*hash(vec2(hm,3.))));
    if(dxn<1.) top=max(top,H+ht*sqrt(1.-dxn*dxn));
  }
  top+=.006*(noise(vec2(fx*131.282,p.y*70.))-.5)*step(H+.02,top);
  if(p.y<top) return vec4(cFore,1.);
  return vec4(0.);
}
