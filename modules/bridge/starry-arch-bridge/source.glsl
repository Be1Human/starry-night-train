// Generated extraction; edit the original implementation and rebuild.
// Source: themes/starry-night-train/index.html
// 原星河云算法移植自 mdb shader，上游未附再分发许可。沿用原声明：仅供学习与欣赏，请勿商用。各模块仍需阅读原主题来源说明。
// This is an exact source excerpt, not a standalone shader.
// Dependencies: noise / hash / sstep; DECK / gPx / uCamX / 桥色板; 桥体与护栏分别合成

// ---------- 石拱桥 ----------
vec4 bridge(vec2 p){
  float H=uHorizon, deck=DECK;
  if(p.y>deck||p.y<H) return vec4(0.);
  float P=.2, aw=.074, spring=H+.012;
  float bx=p.x+uCamX;
  float lx=mod(bx,P)-P*.5;
  float ax=abs(lx);
  float ey=max(p.y-spring,0.)/.8;
  float e=length(vec2(ax,ey))-aw;
  if(ax<aw && (p.y<spring || e<0.)) return vec4(0.);
  vec3 c=cBridge*(.88+.24*noise(vec2(bx,p.y)*82.0513));
  if(p.y>spring-.004 && e<.011){
    float ang=atan(ey,lx);
    float joint=step(.84,fract(ang*14./3.14159));
    c=cBridge*(1.32-.4*joint);
  }
  if(p.y>deck-.011 && p.y<deck-.008) c=cBridge*.7;
  if(p.y>deck-.007) c=cBridge*1.45;
  if(p.y>deck-.002) c=mix(cBridge*2.,cCloudTop,.35);
  c*=mix(.7,1.,smoothstep(H,H+.07,p.y));
  return vec4(c,1.);
}
vec4 railing(vec2 p){
  float ry=p.y-DECK;
  if(ry<0.||ry>.013) return vec4(0.);
  float bx=p.x+uCamX;
  float post=step(abs(mod(bx,.016)-.008),max(.0011,.55/gPx));
  float rail=step(abs(ry-.0115),max(.001,.55/gPx))+step(abs(ry-.006),max(.0007,.5/gPx));
  return vec4(cBridge*1.3,clamp(post+rail,0.,1.));
}
