// Generated extraction; edit the original implementation and rebuild.
// Source: themes/starry-night-train/experiments/train-puffy-experiment-1792078486188.html
// 原星河云算法移植自 mdb shader，上游未附再分发许可。沿用原声明：仅供学习与欣赏，请勿商用。各模块仍需阅读原主题来源说明。
// This is an exact source excerpt, not a standalone shader.
// Dependencies: 星河实验原宿主和原uniform声明; 预览保留历史整景，不替换正式星河主题

vec2 hash2(vec2 p){
  vec3 p3=fract(vec3(p.xyx)*vec3(.1031,.1030,.0973));
  p3+=dot(p3,p3.yzx+33.33);
  return fract((p3.xx+p3.yz)*p3.zy);
}

float vnoise(vec2 p){
  vec2 i=floor(p), f=fract(p);
  f=f*f*(3.-2.*f);
  float a=hash(i), b=hash(i+vec2(1.,0.)), c=hash(i+vec2(0.,1.)), d=hash(i+vec2(1.,1.));
  return mix(mix(a,b,f.x), mix(c,d,f.x), f.y);
}

float smin(float a, float b, float k){
  float h=clamp(.5+.5*(b-a)/max(k,1e-5),0.,1.);
  return mix(b,a,h)-k*h*(1.-h);
}

float cloudEnv(float nx, float lx, float L){
  float stackMul = .45 + (uStack / .4) * .55;
  float ampMul   = .65 + (uAmp / .6) * .35;
  float covFade  = smoothstep(0., .12, uCover);
  float covOff   = (uCover - .7) * .12;

  float r1 = exp(-pow((nx - .82)/.36, 2.)) * .195;
  float r2 = exp(-pow((nx - .42)/.25, 2.)) * .085;
  float l1 = exp(-pow((nx + .80)/.38, 2.)) * .168;
  float l2 = exp(-pow((nx + .36)/.24, 2.)) * .058;
  float pinkTowers = (r1 + r2 + l1 + l2) * stackMul;

  float br1 = exp(-pow((nx - .78)/.44, 2.)) * .235;
  float br2 = exp(-pow((nx - .32)/.28, 2.)) * .115;
  float bl1 = exp(-pow((nx + .78)/.44, 2.)) * .205;
  float bl2 = exp(-pow((nx + .30)/.26, 2.)) * .090;
  float bc  = exp(-pow((nx + .02)/.22, 2.)) * .058;
  float backTowers = (br1 + br2 + bl1 + bl2 + bc) * stackMul;

  float freq = 1.9 + L * .25;
  float wave = (sin(lx * freq * 3.14159 + L * 2.1) * .014
              + cos(lx * freq * 5.2 - L * 1.4) * .009) * ampMul;

  float env;
  if(L < .5){        // L=0: 最远深靛紫高云（衬在粉云后上方，与星空银河衔接）
    env = .098 + backTowers * 1.05;
  } else if(L < 1.5){// L=1: 中远暮光紫罗兰背景云
    env = .076 + backTowers * .86;
  } else if(L < 2.5){// L=2: 主力高耸玫瑰粉积云塔（上层粉云主峰）
    env = .040 + pinkTowers * 1.02;
  } else if(L < 3.5){// L=3: 中近樱花粉蓬松积云（叠在 L=2 紫色肚腹前方，形成第2道亮粉圆弧阶梯，底部收进桥面紫影）
    env = .024 + pinkTowers * .58;
  } else if(L < 4.5){// L=4: 桥拱透光与中央低谷暖粉云（照亮桥洞与中央低谷，不遮挡两侧 L=3 的紫色云底）
    env = .022 + .018 * (1. - smoothstep(.0, .55, abs(nx))) + pinkTowers * .12;
  } else {           // L=5: 两侧桥面后方的紫罗兰/深紫前景小云簇
    float flank = smoothstep(.18, .65, abs(nx));
    env = -.008 + (.036 + pinkTowers * .22) * flank;
  }
  return (env + wave + covOff) * covFade - (1. - covFade) * .08;
}

vec4 evalDomeCluster(vec2 p, float nx, float L, float cell, float seed, vec2 lightXY){
  vec2 g = p / cell;
  float row = floor(g.y);
  g.x += mod(row, 2.) * .5;
  vec2 id = floor(g);
  vec2 f  = fract(g) - .5;

  float d1 = 1e5, d2 = 1e5;
  vec2  q1 = vec2(0.);
  float r1 = cell;

  for(int j = -1; j <= 1; j++){
    for(int i = -1; i <= 1; i++){
      vec2 nb = vec2(float(i), float(j));
      vec2 nid = id + nb;
      float nRow = row + float(j);
      float shift = (mod(nRow, 2.) - mod(row, 2.)) * .5;
      vec2 rnd = hash2(nid + vec2(seed, L * 19.3));
      vec2 c = nb + vec2(shift, 0.) + (rnd - .5) * .58;
      vec2 q = (f - c) * cell;

      vec2 wPos = p - q;
      float envH = cloudEnv(nx, wPos.x, L);
      float rad = cell * (.74 + .34 * rnd.x) * (.75 + .25 * clamp(uAmp / .6, .4, 1.8));
      float hDiff = wPos.y - envH;
      float exist = clamp(1. - smoothstep(-rad * .7, rad * .65, hDiff), 0., 1.);
      if(L > 4.5){
        float clusterPick = smoothstep(.42, .62, hash(nid * .7 + vec2(L * 11., seed)));
        exist *= clusterPick * smoothstep(.18, .50, abs(nx));
      }
      float r = rad * exist;
      if(r > cell * .15){
        float d = length(q) - r;
        if(d < d1){
          d2 = d1; d1 = d; q1 = q; r1 = r;
        } else if(d < d2){
          d2 = d;
        }
      }
    }
  }
  float sdf = smin(d1, d2, cell * .26);
  vec2 qn = clamp(q1 / max(r1, 1e-4), -1., 1.);
  float domeLit = clamp(1. - length(qn + lightXY * .55) / 1.55, 0., 1.);
  float rimDist = max(0., -sdf) / max(r1, 1e-4);
  float rimArc  = (1. - smoothstep(.0, .28, rimDist)) * smoothstep(-.05, .52, qn.y - qn.x * .16);
  float groove  = 1. - clamp((d2 - d1) / (cell * .36), 0., 1.);
  return vec4(sdf, domeLit, rimArc, groove);
}

vec4 evalCloudLayer(float L, float cx, float cy, float nx0, float drift, float pxW){
  float lx = cx + drift + L * 1.73;
  float envApprox = cloudEnv(nx0, lx, L);
  if(cy > envApprox + .14 || cy < -.04) return vec4(0.);

  vec2 p = vec2(lx, cy);
  vec2 warp = vec2(
    vnoise(p * 6.5 + vec2(L * 5.1, 2.3)) - .5,
    vnoise(p * 6.5 + vec2(8.7, L * 4.3)) - .5
  ) * .015;
  float fineRipple = (vnoise(p * 18. + vec2(L * 9.1, 4.7)) - .5) * .0032;
  vec2 pw = p + warp + vec2(fineRipple, fineRipple * .7);

  vec2 lightXY = normalize(vec2(-.24 * sign(nx0 + .05), -.97));

  float cell1 = (.076 - L * .0045) * (.82 + .18 * clamp(uAmp / .6, .5, 1.5));
  float cell2 = cell1 * .54;
  float cell3 = cell1 * .31;

  vec4 c1 = evalDomeCluster(pw, nx0, L, cell1, 11.3, lightXY);
  vec4 c2 = evalDomeCluster(pw + vec2(.017, -.006), nx0, L, cell2, 37.9, lightXY);
  vec4 c3 = evalDomeCluster(pw + vec2(-.009, .011), nx0, L, cell3, 73.1, lightXY);

  float field = smin(c1.x, c2.x + cell1 * .04, cell1 * .20);
  float edgeZone = 1. - smoothstep(0., cell3 * 1.05, abs(field));
  field = mix(field, smin(field, c3.x + cell3 * .10, cell3 * .28), edgeZone * .82);

  float aa = max(pxW * 1.2, .0008);
  float alpha = smoothstep(aa, -aa, field);
  if(alpha <= .002) return vec4(0.);

  float w2 = smoothstep(cell2 * .32, -cell2 * .22, c2.x - c1.x) * .52;
  float w3 = edgeZone * smoothstep(cell3 * .20, -cell3 * .20, c3.x - field) * .38;
  float domeLit = mix(mix(c1.y, c2.y, w2), c3.y, w3);
  float rimArc  = max(c1.z, max(c2.z * .85, c3.z * edgeZone * .9));
  float groove  = max(c1.w * .45, c2.w * .30);

  float topDist = clamp((envApprox + .032 - cy) / max(envApprox + .01, .065), 0., 1.3);
  float macroLit = clamp(1.05 - topDist * .76, 0., 1.);
  float bridgeBaseShade = smoothstep(.048, .065, cy) * (1. - smoothstep(.068, .105, cy)) * smoothstep(.12, .55, abs(nx0)) * .24;
  float leftOuterShade = smoothstep(-.50, -.96, nx0) * .26 + bridgeBaseShade;
  macroLit -= leftOuterShade;

  float lit = domeLit * .48 + macroLit * .52 - groove * .10;
  float bandW = .020;
  float t1 = smoothstep(.27 - bandW, .27 + bandW, lit);
  float t2 = smoothstep(.49 - bandW, .49 + bandW, lit);
  float topMask = smoothstep(.42, .85, macroLit);
  float t3 = smoothstep(.74 - bandW, .74 + bandW, lit + rimArc * .26 * topMask) * topMask;

  vec3 cDeep, cMid, cBody, cRim;
  if(L < .5){
    cDeep = vec3(.14, .09, .28);
    cMid  = vec3(.24, .16, .43);
    cBody = vec3(.38, .24, .56);
    cRim  = vec3(.55, .36, .68);
  } else if(L < 1.5){
    cDeep = vec3(.19, .12, .35);
    cMid  = vec3(.36, .22, .52);
    cBody = vec3(.58, .35, .64);
    cRim  = vec3(.78, .50, .74);
  } else if(L < 2.5){
    cDeep = vec3(.22, .14, .38);
    cMid  = vec3(.52, .30, .54);
    cBody = vec3(.86, .46, .65);
    cRim  = vec3(.99, .69, .78);
  } else if(L < 3.5){
    cDeep = vec3(.25, .15, .41);
    cMid  = vec3(.57, .33, .56);
    cBody = vec3(.92, .51, .68);
    cRim  = vec3(1.0, .74, .82);
  } else if(L < 4.5){
    cDeep = vec3(.28, .17, .43);
    cMid  = vec3(.61, .36, .58);
    cBody = vec3(.95, .56, .71);
    cRim  = vec3(1.0, .79, .86);
  } else {
    cDeep = vec3(.15, .10, .29);
    cMid  = vec3(.28, .18, .45);
    cBody = vec3(.52, .31, .56);
    cRim  = vec3(.84, .52, .70);
  }

  // 与面板 3 个云颜色选择器联动（默认颜色下保持 1:1 海报精确配色）
  vec3 litScale = cCloudLit / vec3(1., .561, .741);
  vec3 topScale = cCloudTop / vec3(.561, .592, .941);
  vec3 shdScale = cCloudShade / vec3(.294, .247, .561);
  cRim  *= mix(litScale, topScale, .25);
  cBody *= litScale;
  cMid  *= mix(litScale, shdScale, .65);
  cDeep *= shdScale;

  vec3 col = mix(cDeep, cMid, t1);
  col = mix(col, cBody, t2);
  col = mix(col, cRim,  t3);
  return vec4(col, alpha);
}

vec4 clouds(vec2 p){
  if(uCover <= .001) return vec4(0.);
  float cy = (p.y - uHorizon) * .5;
  if(cy < -.03 || cy > .36) return vec4(0.);
  float cx = (p.x - gC.x) * .5;
  float aspect = uRes.x / uRes.y;
  float nx0 = clamp(cx / (.5 * aspect), -1.25, 1.25);
  float pxW = .5 / gPx;

  // 从前到后合成 6 层圆球簇积云（近层遮挡远层，累计不透明度满即提前退出）
  vec4 acc = vec4(0.);
  for(int i = 5; i >= 0; i--){
    vec4 cl = evalCloudLayer(float(i), cx, cy, nx0, uCL[i], pxW);
    acc.rgb += (1. - acc.a) * cl.a * cl.rgb;
    acc.a   += (1. - acc.a) * cl.a;
    if(acc.a > .995) break;
  }
  return acc;
}
