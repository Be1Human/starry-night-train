// Generated extraction; edit the original implementation and rebuild.
// Source: themes/starry-night-train/index.html
// 原星河云算法移植自 mdb shader，上游未附再分发许可。沿用原声明：仅供学习与欣赏，请勿商用。各模块仍需阅读原主题来源说明。
// This is an exact source excerpt, not a standalone shader.
// Dependencies: PAINT / sdBox / hash; gGlow / uTrainX / uWheel / uCars / DECK; 原宿主色板与行进状态

// ---------- 列车 ----------
#define PAINT(cond, c) if(cond){ col=(c); a=1.; }
vec4 train(vec2 p){
  float R=DECK;
  vec2 q=vec2(p.x-uTrainX,p.y-R);
  float carL=.12, gap=.006;
  float tail=-.14-uCars*(carL+gap);
  if(q.y>-.04 && q.y<.12 && q.x>tail-.06 && q.x<.7){
    float dwin=max(sdBox(q,vec2((tail-.14)*.5,.0255),vec2((-.14-tail)*.5,.0065)),0.);
    gGlow+=cWin*exp(-dwin*90.)*.28*uWin*uGlow;
    float dc=max(sdBox(q,vec2(-.085,.032),vec2(.008,.006)),0.);
    gGlow+=cWin*exp(-dc*110.)*.22*uWin*uGlow;
    vec2 hl=q-vec2(.001,.031);
    gGlow+=cLight*exp(-length(hl)*70.)*.9*uGlow;
    if(hl.x>0.){ float spread=abs(hl.y)/(hl.x+.015); gGlow+=cLight*exp(-spread*7.-hl.x*4.)*.2*uGlow; }
  }
  if(q.y<-.001||q.y>.053||q.x>.008||q.x<tail) return vec4(0.);
  vec3 body=cTrain*(.75+.75*smoothstep(0.,.05,q.y));
  vec3 dark=cTrain*.45;
  vec3 metal=mix(cTrain*2.2,cCloudTop,.3);
  vec3 col=vec3(0.); float a=0.;
  float w=q.x;
  if(w>-.103){
    // 机车
    PAINT(w>-.1&&w<-.002&&q.y>.009&&q.y<.0125, dark)
    PAINT(sdBox(q,vec2(-.04,.024),vec2(.026,.007))-.004<0., body)
    PAINT(abs(w+.03)<.0008&&q.y>.013&&q.y<.035, metal)
    PAINT(abs(w+.052)<.0008&&q.y>.013&&q.y<.035, metal)
    PAINT(sdBox(q,vec2(-.009,.024),vec2(.005,.0115))<0., cTrain*.85)
    PAINT(sdBox(q,vec2(-.02,.042),vec2(.0035,.0075))<0., body)
    PAINT(sdBox(q,vec2(-.02,.0495),vec2(.006,.0018))<0., dark)
    PAINT(length(q-vec2(-.045,.035))<.005&&q.y>.033, body)
    PAINT(sdBox(q,vec2(-.085,.027),vec2(.015,.019))<0., body)
    PAINT(sdBox(q,vec2(-.085,.032),vec2(.008,.006))<0., cWin*uWin*(1.05-.3*smoothstep(.026,.038,q.y)))
    PAINT(sdBox(q,vec2(-.085,.048),vec2(.018,.002))<0., dark)
    PAINT(w>-.004&&w<.007&&q.y>0.&&q.y<.010-(w+.004)*.9, dark)
    PAINT(length(q-vec2(-.002,.031))<.0028, cLight*1.6)
    for(int i=0;i<3;i++){
      vec2 wc=vec2(-.058+float(i)*.018,.0075);
      float d=length(q-wc);
      PAINT(d<.0075, dark)
      PAINT(d<.0075&&d>.0058, cTrain*1.3)
      PAINT(d<.0015, metal)
    }
    PAINT(length(q-vec2(-.009,.004))<.004, dark)
    vec2 o=vec2(cos(uWheel),sin(uWheel))*.0045;
    PAINT(abs(q.y-.0075-o.y)<.0011&&w>-.058+o.x&&w<-.022+o.x, metal)
  } else if(w>-.14){
    // 煤水车
    PAINT(sdBox(q,vec2(-.1215,.021),vec2(.0165,.012))-.001<0., body)
    PAINT(abs(w+.1215)<.015&&q.y>.033&&q.y<.034+.004*(.6+.4*sin(w*900.)), dark*.8)
    PAINT(length(q-vec2(-.132,.0045))<.0045||length(q-vec2(-.111,.0045))<.0045, dark)
  } else {
    // 客车厢：直接算出属于第几节
    float u=-.14-gap-w;
    float idx=floor(u/(carL+gap));
    float lu=u-idx*(carL+gap);
    if(idx>=0.&&idx<uCars){
      if(lu>carL||lu<0.){
        PAINT(q.y>.010&&q.y<.0135, dark)
      } else {
        float cx=carL*.5-lu;
        vec2 cq=vec2(cx,q.y);
        PAINT(sdBox(cq,vec2(0.,.0225),vec2(carL*.5-.002,.0125))-.002<0., body)
        PAINT(sdBox(cq,vec2(0.,.0395),vec2(carL*.5-.004,.002))-.0015<0., dark*1.3)
        PAINT(abs(q.y-.0135)<.0009&&abs(cx)<carL*.5-.002, mix(body*1.6,cCloudTop,.2))
        PAINT(abs(q.y-.0088)<.0012&&abs(cx)<carL*.5-.003, dark)
        float wx=lu-.0105; float wi=floor(wx/.0155); float wl=wx-wi*.0155;
        if(wi>=0.&&wi<7.&&wl<.009&&abs(q.y-.0255)<.0055){
          float hh=hash(vec2(wi+idx*7.,3.));
          float lit=hh<.12?.22:(.75+.25*hh);
          PAINT(true, cWin*lit*uWin*(1.05-.3*smoothstep(.02,.031,q.y)))
        }
        float ax=abs(cx);
        PAINT(length(vec2(ax-.046,q.y-.0042))<.0042||length(vec2(ax-.036,q.y-.0042))<.0042, dark)
      }
    }
  }
  return vec4(col,a);
}
