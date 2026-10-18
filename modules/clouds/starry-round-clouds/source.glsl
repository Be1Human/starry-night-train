// Generated extraction; edit the original implementation and rebuild.
// Source: themes/starry-night-train/experiments/round-clouds.html
// 原星河云算法移植自 mdb shader，上游未附再分发许可。沿用原声明：仅供学习与欣赏，请勿商用。各模块仍需阅读原主题来源说明。
// This is an exact source excerpt, not a standalone shader.
// Dependencies: 该实验原宿主与原uniform声明; 预览保留历史整景，不声称独立云模块

float hash12(vec2 p){ vec3 p3=fract(vec3(p.xyx)*.1031); p3+=dot(p3,p3.yzx+33.33); return fract((p3.x+p3.y)*p3.z); }

vec3 hash32(vec2 p){ vec3 p3=fract(vec3(p.xyx)*vec3(.1031,.1030,.0973)); p3+=dot(p3,p3.yxz+33.33); return fract((p3.xxy+p3.yzz)*p3.zyx); }

float smin(float a,float b,float k){ float h=max(k-abs(a-b),0.)/k; return min(a,b)-h*h*k*.25; }

float vnoise(vec2 x){
  vec2 i=floor(x), f=fract(x); f=f*f*(3.-2.*f);
  return mix(mix(hash12(i),hash12(i+vec2(1,0)),f.x),mix(hash12(i+vec2(0,1)),hash12(i+vec2(1,1)),f.x),f.y);
}

float fbm(vec2 x){ float a=0., w=.5; for(int i=0;i<4;i++){ a+=w*vnoise(x); x=x*2.03+vec2(7.1,3.7); w*=.5; } return a; }

vec2 cloudWarp(vec2 u, float L){
  // 仅用 2 阶低频圆滑值噪声做手绘棉花糖式的轻柔形变，绝不引入破坏圆弧的高频碎噪点
  vec2 w1 = vec2(vnoise(u*7.5+vec2(L*3.7,1.3)), vnoise(u*7.5+vec2(6.1,L*4.1))) - .5;
  vec2 w2 = vec2(vnoise(u*16.+vec2(L*5.3,8.7)), vnoise(u*16.+vec2(2.9,L*6.7))) - .5;
  return w1*.014 + w2*.0055;
}

float crestAt(float nx, float wx, float L){
  // nx ∈ [-1, 1] 为相对画面中心的归一化横坐标；wx 为带漂移的场景横坐标
  // 左右两侧高耸积云塔（右侧更高更饱满），中间桥与列车上方压低成宽阔的 U 型山谷
  float lRise = pow(smoothstep(-.18, -.98, nx), 1.22);
  float rRise = pow(smoothstep(.18, .98, nx), 1.15);
  // 左右主云峰与山谷中左小云包
  float pinkTowers = .115 * lRise + .148 * rRise
    + .032 * exp(-pow((nx + .54)/.22, 2.))
    + .035 * exp(-pow((nx + .92)/.22, 2.))
    + .024 * exp(-pow((nx + .18)/.16, 2.))
    + .048 * exp(-pow((nx - .82)/.24, 2.));
  // 远景暗紫背景云在山谷与两侧肩部都显著高出粉云 (+0.045~0.075)，形成海报中鲜明的暗紫衬底云层
  float backTowers = .125 * pow(smoothstep(-.02, -.95, nx), 1.1)
    + .155 * pow(smoothstep(.02, .95, nx), 1.05)
    + .045 * exp(-pow((nx + .42)/.28, 2.))
    + .055 * exp(-pow((nx - .55)/.26, 2.));
  // 随漂移缓慢起伏的大尺度云峰波浪
  float wave = .012 * sin(wx*8.5 + L*2.1) + .009 * cos(wx*15.5 - L*1.6);

  float env;
  if(L < .5){        // L=0: 最远深靛紫高云（衬在粉云后上方，与星空银河衔接）
    env = .098 + backTowers * 1.05;
  } else if(L < 1.5){// L=1: 中远暮光紫罗兰背景云
    env = .076 + backTowers * .86;
  } else if(L < 2.5){// L=2: 主力高耸玫瑰粉积云塔（上层粉云主峰，顶部约 y=0.50~0.53）
    env = .040 + pinkTowers * 1.02;
  } else if(L < 3.5){// L=3: 中近樱花粉蓬松积云（叠在 L=2 紫色肚腹前方，形成第2道亮粉圆弧阶梯，底部收进桥面紫影）
    env = .024 + pinkTowers * .58;
  } else if(L < 4.5){// L=4: 桥拱透光与中央低谷暖粉云（高度控制在桥面附近，照亮桥洞与中央低谷，不遮挡两侧 L=3 的紫色云底）
    env = .022 + .018 * (1. - smoothstep(.0, .55, abs(nx))) + pinkTowers * .12;
  } else {           // L=5: 两侧桥面后方的紫罗兰/深紫前景小云簇（在亮粉云前形成局部深色圆球剪影对比）
    float flank = smoothstep(.18, .65, abs(nx));
    env = -.008 + (.036 + pinkTowers * .22) * flank;
  }
  return env + wave + .05 * (uCover - .65);
}

void evalScale(
  vec2 uv, float cell, float seed, float L, float aspect, float off, float blendK, vec2 lightXY,
  float isMeso, float parentField,
  inout float field, inout float height, inout float domeLit, inout float rimAcc, inout float aoAcc
){
  float j0 = floor(uv.y / cell);
  for(int dj = -1; dj <= 1; dj++){
    float j = j0 + float(dj);
    if(j < -1.) continue;
    float rowOff = mod(abs(j), 2.) * .5;
    float i0 = floor(uv.x / cell - rowOff);
    for(int di = -1; di <= 1; di++){
      float i = i0 + float(di);
      vec2 id = vec2(i, j);
      vec3 h = hash32(id + vec2(seed, L*43.7));
      vec2 center = vec2((i + .5 + (h.x - .5)*.45 + rowOff)*cell, (j + .5 + (h.y - .5)*.38)*cell);
      if(center.y < -.03) continue;
      float wx = center.x;
      float screenX = center.x - off*.32;
      float nx = clamp((screenX / aspect)*2. - 1., -1.25, 1.25);
      float env = crestAt(nx, wx, L);
      // 大球填满包络，中球簇拥在包络中上部与大球外缘
      float topLim = isMeso > .5 ? env + cell*.20 : env;
      float presence = smoothstep(-cell*.48, cell*.34, topLim - center.y);
      if(isMeso > .5){
        presence *= smoothstep(-cell*.75, -cell*.02, parentField);
        if(h.x < .25) continue;
      }
      if(presence < .01) continue;
      float r = cell * mix(.66, .90, h.z) * (.48 + .52*presence);
      vec2 q = uv - center;
      float lenQ = length(q);
      float d = r - lenQ;
      // 外轮廓平滑并集（菜花状圆弧轮廓）
      field = -smin(-field, -d, cell * mix(.14, .26, uRound));
      if(d < -cell*.14) continue;

      vec2 qn = q / max(r, 1e-4);
      float u2 = clamp(dot(qn, qn), 0., 1.);
      float domeShape = smoothstep(-.85, .25, dot(qn, lightXY));
      float zNorm = sqrt(1. - u2 * .82) * domeShape * smoothstep(-cell*.14, cell*.04, d);
      float surf = zNorm + .10*(h.y - .5) + .04*isMeso - .12*clamp(center.y / max(env, .06), 0., 1.2);

      // 球面圆弧光照坐标：以球体背光侧偏心点 (-lightXY * 0.55) 为圆心的同心圆弧距离
      float arcDist = clamp(length(qn + lightXY * .55) / 1.55, 0., 1.);
      // 球顶月牙高光：仅在靠近云层顶部外缘的球冠迎光弧出现纤细月牙(🌙)
      float topZone = smoothstep(env - cell*.65, env + cell*.15, center.y);
      float crescent = smoothstep(.74, .95, lenQ/r) * smoothstep(.42, .82, dot(qn, lightXY)) * topZone;

      float b = mix(.08, .20, uRound);
      float w = smoothstep(-b, b, surf - height) * (isMeso > .5 ? .52 : 1.);
      float seam = 4. * w * (1. - w);
      aoAcc = mix(aoAcc, 0., w) + seam * (isMeso > .5 ? .22 : .38);
      height = mix(height, surf, w) + b * .12 * seam;
      domeLit = mix(domeLit, arcDist, w);
      rimAcc = mix(rimAcc, crescent, w);
    }
  }
}

vec4 cloudLayer(vec2 p, float L, float n, float off){
  if(p.y < uHorizon - .01 || p.y > uHorizon + .36) return vec4(0.);
  float aspect = uRes.x / uRes.y;
  float k = n > 1. ? L / (n - 1.) : 1.;
  // 快速包络剔除
  float nx0 = clamp((p.x / aspect)*2. - 1., -1.25, 1.25);
  float envApprox = crestAt(nx0, p.x + off*.32, L);
  float cy = p.y - uHorizon;
  if(cy > envApprox + .085) return vec4(0.);

  vec2 rawUV = vec2(p.x + off*.32, cy);
  vec2 uv = rawUV + cloudWarp(rawUV, L);

  // 光源方向：来自上方星月并朝向画面中央山谷，使左右两侧云塔的顶部与朝向山谷的内侧都迎光
  vec2 lightXY = normalize(vec2(-clamp(nx0 * .52, -.48, .48), .86));

  float blendK = uRound;
  float field = -1., height = -10., domeLit = .5, rimAcc = 0., aoAcc = 0.;

  // 1. 大尺度主云穹 (Macro Domes)：建立连贯饱满的大体量团块
  float cell1 = mix(.066, .088, smoothstep(0., 1., k)) * uBump;
  if(L > 4.5) cell1 = .060 * uBump;
  evalScale(uv, cell1, 13.7, L, aspect, off, blendK, lightXY, 0., 1., field, height, domeLit, rimAcc, aoAcc);
  float macroField = field;

  // 2. 中尺度蓬松云球簇 (Meso Lobes)：在大云穹上簇拥出多层次圆球
  float cell2 = cell1 * .50;
  evalScale(uv, cell2, 59.3, L, aspect, off, blendK, lightXY, 1., macroField, field, height, domeLit, rimAcc, aoAcc);

  // 3. 边缘小尺度菜花云朵 (Micro Rim Buds)：仅附着在云团外轮廓附近，塑造蓬松棉花糖边缘
  float cell3 = cell1 * .26;
  if(abs(field) < cell3 * 1.05){
    float j0 = floor(uv.y / cell3);
    for(int dj = -1; dj <= 1; dj++){
      float j = j0 + float(dj);
      if(j < 0.) continue;
      float rowOff = mod(abs(j), 2.) * .5;
      float i0 = floor(uv.x / cell3 - rowOff);
      for(int di = -1; di <= 1; di++){
        float i = i0 + float(di);
        vec3 h = hash32(vec2(i, j) + vec2(113.1, L*71.3));
        if(h.x < .32) continue;
        vec2 c = vec2((i + .5 + (h.x - .5)*.46 + rowOff)*cell3, (j + .5 + (h.y - .5)*.42)*cell3);
        vec2 q = uv - c;
        float r = cell3 * (.58 + .32*h.z) * smoothstep(-cell3*.60, cell3*.18, field);
        if(r < .002) continue;
        float d = r - length(q);
        field = -smin(-field, -d, cell3*.20);
        if(d > -cell3*.06 && field < cell3*.42){
          vec2 qn = q / max(r, 1e-4);
          float w = smoothstep(-cell3*.10, cell3*.06, d) * .40;
          float microArc = clamp(length(qn + lightXY * .55) / 1.55, 0., 1.);
          domeLit = mix(domeLit, microArc, w);
        }
      }
    }
  }

  float a = smoothstep(-uPx*.85, uPx*.85, field);
  if(a < .001) return vec4(0.);

  // ---------- 赛璐璐 / 插画 4 阶圆弧着色 ----------
  // 大体量云团受光场 (macroLit)：顶部与朝向中央山谷一侧受星月照射明亮，外侧与桥面云底渐入紫罗兰与深靛紫阴影
  float topDist = clamp((envApprox + .032 - cy) / max(envApprox + .01, .065), 0., 1.3);
  float macroLit = clamp(1.05 - topDist * .76, 0., 1.);
  // 贴合海报：左侧云塔最左外缘偏暗紫，且桥面上方(cy: 0.055~0.088)两侧云底自然收进暮光紫阴影（而桥洞内 cy<0.05 保持粉亮透光）
  float bridgeBaseShade = smoothstep(.048, .065, cy) * (1. - smoothstep(.068, .105, cy)) * smoothstep(.12, .55, abs(nx0)) * .24;
  float leftOuterShade = smoothstep(-.50, -.96, nx0) * .26 + bridgeBaseShade;
  macroLit -= leftOuterShade;

  // 综合体积受光量 v（控制 1.深紫暗底 -> 2.暮光紫中调 -> 3.珊瑚樱花粉亮面主体 三大体积色阶）
  float v = .54 * macroLit
          + .46 * domeLit
          - .18 * clamp(aoAcc, 0., .8);

  // 迎光顶弧高光 (b3)：严格限制在云层外缘迎光顶边与强凸出球冠的月牙细弧（2~5px 宽），绝不泛滥成大片白斑！
  float outerCrescent = (1. - smoothstep(0., cell2 * .18, field)) * smoothstep(.66, .84, domeLit) * smoothstep(.42, .78, macroLit);
  float rimHighlight = clamp(max(outerCrescent, rimAcc * .72 * smoothstep(.48, .82, macroLit)), 0., 1.);

  // 4 档圆弧色阶阈值
  float b1 = smoothstep(.35, .39, v);            // 1->2: 深紫蓝暗底 -> 暮光紫中调
  float b2 = smoothstep(.50, .54, v);            // 2->3: 暮光紫中调 -> 珊瑚/樱花粉亮面主体
  float b3 = smoothstep(.42, .68, rimHighlight); // 3->4: 亮面主体 -> 蜜桃粉迎光月牙顶弧

  // 各深度层专属插画调色板（严格对应海报的远近层次）
  vec3 pShade = cShade;
  vec3 pMid   = cMid;
  vec3 pLit   = cLit;
  vec3 pHi    = cHi;

  if(L < .5){
    // L=0 最远层（最高）：暗紫蓝高云 (#1f163d 暗 ~ #3a2860 亮)，衬在粉云后方与星空银河衔接
    pShade = mix(cTop, cShade, .50);
    pMid   = mix(cTop, cShade, .84);
    pLit   = mix(cShade, cMid, .26);
    pHi    = mix(cShade, cMid, .52);
  } else if(L < 1.5){
    // L=1 中远层：紫罗兰/暮光紫过渡层，露出饱满暗紫圆顶
    pShade = mix(cTop, cShade, .76);
    pMid   = mix(cShade, cMid, .42);
    pLit   = mix(cShade, cMid, .78);
    pHi    = mix(cMid, cLit, .42);
  } else if(L < 2.5){
    // L=2 主力高耸玫瑰粉层：浓郁珊瑚粉亮面 + 暮光紫肚腹 + 蜜桃亮边
    pShade = cShade * .92;
    pMid   = mix(cShade, cMid, .88);
    pLit   = mix(cMid, cLit, .94);
    pHi    = cHi;
  } else if(L < 3.5){
    // L=3 中近饱满樱花粉层：最纯正的海报主色调
    pShade = cShade;
    pMid   = cMid;
    pLit   = cLit;
    pHi    = cHi;
  } else if(L < 4.5){
    // L=4 近景柔亮桃粉层（含桥洞透光）：温暖亮粉，使桥拱洞内透出与海报一致的粉霞云光
    pShade = mix(cShade, cMid, .22);
    pMid   = mix(cMid, cLit, .18);
    pLit   = cLit;
    pHi    = cHi;
  } else {
    // L=5 两侧桥面后方的紫罗兰/粉紫局部前景云簇：下腹深紫、顶弧柔粉，增强前景层次
    pShade = mix(cTop, cShade, .72);
    pMid   = mix(cShade, cMid, .55);
    pLit   = mix(cMid, cLit, .65);
    pHi    = mix(cLit, cHi, .50);
  }

  vec3 col = mix(pShade, pMid, b1);
  col = mix(col, pLit, b2);
  col = mix(col, pHi, b3);

  return vec4(col * a, a);
}
