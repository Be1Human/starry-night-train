// Generated extraction; edit the original implementation and rebuild.
// Source: themes/starry-night-train/index.html
// 原星河云算法移植自 mdb shader，上游未附再分发许可。沿用原声明：仅供学习与欣赏，请勿商用。各模块仍需阅读原主题来源说明。
// This is an exact source excerpt, not a standalone shader.
// Dependencies: gFog / CLD / BAND; uCloudTex(1024×1024) / uNMin / uNMax / uCL[12]; 原云来源与使用限制

// ---------- 云：移植自原版 sunset-cloud-train 的 mdb shader（无再分发许可，仅本地学习使用） ----------
// 原版噪声：五次插值，从 1024 纹理的 4 个整数格点取值；格点正好落在 texel 边界，线性过滤得到相邻 2×2 texel 的平均。
// uCloudTex 预存这个 2×2 平均值（亮度 = 高 8 位，alpha = 低 2 位），一次硬件双线性采样即等价于原版的 4 次取值加插值。
float cnoise(vec2 x){
  vec2 f=fract(x);
  vec2 u=f*f*f*(f*(f*6.-15.)+10.);
  vec2 t=texture2D(uCloudTex,(floor(x)+u+.5)/1024.).xw;
  return t.x+t.y/256.;
}
// 原版 fbm：每阶权重 ×0.7、频率 ×2；每阶对 1024 取模（噪声周期），只防止坐标过大丢精度，不改变结果。
// 提前退出不改变结果：噪声值必在纹理的 [uNMin, uNMax] 内，每阶后可得最终值的上下界；
// 上界 < lo 说明这层盖不到当前像素（返回 -1），下界 > hi 说明一定落在最深色带（返回 2）。
float cfbm(vec2 x, float lo, float hi){
  float T=0., w=1.;
  for(int i=0;i<8;i++){ if(i>=uOct) break; T+=w; w*=.7; }
  float a=0., b=1., t=0.;
  for(int i=0;i<8;i++){
    if(i>=uOct) break;
    a+=b*cnoise(x); t+=b; b*=.7; x=mod(x*2.,1024.);
    if(i+1<uOct){
      float R=T-t;
      if((a+R*uNMax)/T<lo-1e-4) return -1.;
      if((a+R*uNMin)/T>hi+1e-4) return 2.;
    }
  }
  return a/t;
}
// 原版配色映射到星河版：按亮度在云暗部 → 云亮部之间取色，又亮又不饱和的（原版的奶油色）偏向云顶色
// 夜色雾化：越远的层越向天空色靠拢（原版没有，用来让远层融进夜空）
float gFog;
vec3 cpal(vec3 o){
  float l=dot(o,vec3(.299,.587,.114));
  float s=max(o.r,max(o.g,o.b))-min(o.r,min(o.g,o.b));
  vec3 c=mix(cCloudShade*.7,cCloudLit,smoothstep(.3,.72,l));
  c=mix(c,cCloudTop,.7*smoothstep(.6,.92,l)*smoothstep(.5,.15,s));
  c*=.78+.3*l;
  return mix(c,mix(cSkyHor,cSkyTop,.5),gFog);
}
// 一层云 = 一个二维 fbm 高度场；按 dh 从深到浅切出色带（与原版 layer 宏一致），命中即不透明返回。
// 云量、云层高度只改 midlevel（整体平移 / 按层间距压缩），不改单层形状。
#define CLD(mid,disp,i,dhMax) gFog=float(i)*.03; m_=.3+((mid)-.3)*uStack+(uCover-1.)*.3; D_=max((disp)*uAmp,1e-4); run_=cy<m_+(uNMax-.5)*D_; if(run_){ h_=(cfbm(vec2(p.x+uCL[i],cy),(cy-m_)/D_+.5,(cy+(dhMax)-m_)/D_+.5)-.5)*D_+m_; }
#define BAND(dh,c) if(run_&&cy<h_-(dh)) return vec4(cpal(c),1.);
vec4 clouds(vec2 p){
  // 云坐标：地平线对应原版 y=0.2，原版 c12（midlevel 0.3）落在地平线与桥面之间，和原版相对桥的位置一致
  float cy=p.y-uHorizon+.2;
  float m_, D_, h_=0.; bool run_;
  CLD(.3,.9,0,.14)   BAND(.14,vec3(.48,.19,.20)) BAND(.1,vec3(.68,.28,.19)) BAND(.07,vec3(.88,.38,.24)) BAND(0.,vec3(.95,.45,.30))
  CLD(.35,1.,1,.04)  BAND(.04,vec3(.98,.76,.64)) BAND(0.,vec3(.95,.80,.77))
  CLD(.35,3.5,2,.12) BAND(.12,vec3(.43,.32,.31)) BAND(.08,vec3(.55,.42,.41)) BAND(.04,vec3(.66,.42,.40)) BAND(0.,vec3(.77,.48,.46))
  CLD(.45,2.,3,.04)  BAND(.04,vec3(.98,.57,.36)) BAND(0.,vec3(1.,.62,.44))
  CLD(.5,2.3,4,.12)  BAND(.12,vec3(.41,.27,.27)) BAND(.08,vec3(.53,.35,.32)) BAND(.04,vec3(.80,.24,.17)) BAND(0.,vec3(.99,.29,.20))
  CLD(.5,2.5,5,.1)   BAND(.1,vec3(.88,.38,.24))  BAND(.05,vec3(.98,.42,.28)) BAND(0.,vec3(1.,.48,.35))
  CLD(.6,2.,6,.1)    BAND(.1,vec3(.95,.66,.48))  BAND(0.,vec3(1.,.76,.60))
  CLD(.75,3.5,7,.2)  BAND(.2,vec3(1.,.55,.33))   BAND(.15,vec3(.98,.50,.24)) BAND(.1,vec3(.90,.55,.40)) BAND(0.,vec3(1.,.62,.44))
  CLD(.7,2.7,8,.04)  BAND(.04,vec3(.73,.36,.30)) BAND(0.,vec3(.80,.40,.34))
  CLD(.8,2.7,9,.1)   BAND(.1,vec3(.93,.58,.35))  BAND(0.,vec3(1.,.76,.60))
  CLD(.9,3.,10,.1)   BAND(.1,vec3(.56,.25,.22))  BAND(.05,vec3(.60,.30,.27)) BAND(0.,vec3(.74,.35,.30))
  CLD(1.,5.,11,.1)   BAND(.1,vec3(.92,.85,.82))  BAND(0.,vec3(1.,.94,.91))
  return vec4(0.);
}
