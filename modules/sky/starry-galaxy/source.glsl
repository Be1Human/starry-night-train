// Generated extraction; edit the original implementation and rebuild.
// Source: themes/starry-night-train/index.html
// 原星河云算法移植自 mdb shader，上游未附再分发许可。沿用原声明：仅供学习与欣赏，请勿商用。各模块仍需阅读原主题来源说明。
// This is an exact source excerpt, not a standalone shader.
// Dependencies: hash / fbm / sstep; uNoise及星空色板; gC / gPxS与原宿主

// ---------- 天空 ----------
float starLayer(vec2 p, float cell, float dens, float seed, float big){
  vec2 g=p/cell; vec2 id=floor(g); vec2 f=fract(g);
  float h=hash(id+seed);
  if(h>dens) return 0.;
  vec2 c=vec2(hash(id+seed+1.7),hash(id+seed+4.3))*.6+.2;
  vec2 d=(f-c)*cell*gPxS;
  float r=length(d);
  float tw=1.-uTwinkle*.5*(1.+sin(uT*(1.2+3.*hash(id+seed+2.9))+h*80.));
  float b=.45+.55*hash(id+seed+5.5);
  float s;
  if(big>0.){
    float k=max(gPxS/540.,.6);
    s=sstep(1.8*k,0.,r)+(exp(-abs(d.x)/(2.6*k)-abs(d.y)/(.45*k))+exp(-abs(d.y)/(2.6*k)-abs(d.x)/(.45*k)))*.9;
  } else {
    float sz=.35+.9*hash(id+seed+8.1);
    s=sstep(sz+.8,sz-.2,r);
  }
  return s*tw*b;
}
float meteor(vec2 p, float slot){
  if(uMeteor<=0.) return 0.;
  float per=mix(18.,3.,uMeteor)*(1.+slot*.63);
  float tt=uT+slot*7.3;
  float k=floor(tt/per); float lt=tt-k*per;
  float dur=1.1;
  if(lt>dur) return 0.;
  float asp=uRes.x/uRes.y;
  vec2 s=vec2(mix(.45,asp+.05,hash(vec2(k,slot+3.))),mix(.76,.98,hash(vec2(k+5.,slot+9.))));
  vec2 dir=normalize(vec2(-1.,-.42));
  float pr=lt/dur;
  vec2 head=s+dir*pr*.5;
  float len=.2*min(1.,pr*2.5)+1e-4;
  vec2 rel=p-head;
  float al=dot(rel,-dir);
  float pe=abs(dot(rel,vec2(-dir.y,dir.x)));
  float w=(1.+1.4*(1.-clamp(al/len,0.,1.)))/gPxS;
  float tail=step(0.,al)*sstep(len,0.,al)*sstep(w,0.,pe);
  float hd=exp(-dot(rel,rel)*gPxS*gPxS*.12);
  return (tail*.9+hd*1.6)*sin(pr*3.14159);
}
vec3 sky(vec2 sp){
  float H=uHorizon;
  float hy=clamp((sp.y-H)/(1.-H),0.,1.);
  vec3 col=mix(cSkyHor,cSkyTop,pow(hy,.6));
  // 场景坐标 → 屏幕坐标 → 星空坐标：星空只按 √zoom 缩放、镜头高度只移一半
  vec2 s=(sp-vec2(0.,uCamY)-gC)*uZoom+gC;
  vec2 p=(s-gC)/sqrt(uZoom)+gC+vec2(0.,uCamY*.5);
  float asp=uRes.x/uRes.y;
  float v=p.y-(.6+.3*(p.x-.5*asp));
  float band=exp(-v*v/.018);
  if(band>.01 && uMilky>0.){
    vec2 r=vec2(p.x+p.y*.3,v);
    float n=fbm(r*vec2(3.,6.)+vec2(3.,7.));
    float dust=smoothstep(.45,.65,fbm(r*vec2(6.,14.)+vec2(11.,2.)));
    float mw=band*(.2+n*n*1.7)*(1.-.65*dust*band);
    col+=mix(vec3(.38,.36,.9),vec3(.95,.62,.95),n)*mw*uMilky*.7;
  }
  float st=starLayer(p,1./90.,uStars*(.35+.45*band),0.,0.);
  st+=starLayer(p,1./14.,uStars*.2,31.,1.);
  col+=vec3(.95,.93,1.)*st*smoothstep(H,H+.12,sp.y);
  col+=vec3(.85,.9,1.)*(meteor(p,0.)+meteor(p,1.));
  return col;
}
