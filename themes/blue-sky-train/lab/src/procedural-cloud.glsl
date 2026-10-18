// Pure Procedural Flat-Graphic Anime Cumulonimbus (R05)
// Zero SVG path masks, zero PNG textures. Built from:
// 1. 2D cellular circular-puff cauliflower lattices (convex circular outer arcs + sharp inward cusps)
// 2. Arc-length normalized Euclidean distance around the macro cumulonimbus crest
// 3. Multi-lobe internal floret decomposition + 5-tone nested flat cel-shading
//    (#FDFAF1 White -> #D1EAF9 Pale -> #A7D4F3 Mid-Blue -> #88C1EB Deep-Blue -> #6CBAF8 Ambient Recess)
// 4. Windswept turbulent vapor contrail and detached sky wisps.

float smax(float a, float b, float k) {
  float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
  return mix(a, b, h) + k * h * (1.0 - h);
}

float smin(float a, float b, float k) {
  return -smax(-a, -b, k);
}

float epuff(vec2 p, vec2 c, vec2 r) {
  vec2 d = (p - c) / r;
  return (1.0 - length(d)) * min(r.x, r.y);
}

float roundBoxField(vec2 p, vec2 c, vec2 r, float rad) {
  vec2 q = abs(p - c) - r + rad;
  return rad - (length(max(q, 0.0)) + min(max(q.x, q.y), 0.0));
}

// 2D Cellular Cauliflower Puff Grid:
// Union of jittered circular domes on a 2D lattice -> outward convex arcs + sharp inward cusps.
float puffGrid(vec2 p, float scale, float seed) {
  vec2 g = p * scale + vec2(seed * 5.17, seed * 2.93);
  vec2 i = floor(g);
  vec2 f = g - i;
  float best = -10.0;
  for (int dy = -1; dy <= 1; dy++) {
    for (int dx = -1; dx <= 1; dx++) {
      vec2 d = vec2(float(dx), float(dy));
      vec2 cell = i + d;
      float h1 = hash(cell);
      float h2 = hash(cell + vec2(19.3, 41.7));
      vec2 o = d + 0.5 + (vec2(h1, h2) - 0.5) * 0.76 - f;
      float rad = 0.64 + 0.26 * hash(cell + vec2(73.1, 11.9));
      best = smax(best, rad - length(o), 0.045);
    }
  }
  return best / scale;
}

// Outer silhouette cauliflower edge modulation (3 octaves of convex circular domes)
float cauliflowerCrest(vec2 p, float seed, float amp) {
  vec2 w = vec2(
    fbm(p * 4.2 + vec2(seed, -seed)) - 0.5,
    fbm(p * 4.2 + vec2(4.7 - seed, seed)) - 0.5
  );
  vec2 q = p + w * 0.012;
  float c1 = puffGrid(q, 19.0, seed) - 0.0145;
  float c2 = puffGrid(q, 44.0, seed + 7.3) - 0.0062;
  float c3 = puffGrid(q, 92.0, seed + 15.1) - 0.0029;
  return (c1 * 0.55 + c2 * 0.30 + c3 * 0.15) * amp;
}

// Rich internal anime brushstroke + floret modulation for internal tone boundaries
float internalFloretField(vec2 p, float seed, float amp) {
  vec2 w = vec2(
    fbm(p * 5.8 + vec2(seed, -seed)) - 0.5,
    fbm(p * 5.8 + vec2(3.9 - seed, seed)) - 0.5
  );
  vec2 q = p + w * 0.026;
  float f1 = puffGrid(q, 14.0, seed) - 0.019;
  float f2 = puffGrid(q, 33.0, seed + 6.1) - 0.0082;
  float f3 = puffGrid(q, 72.0, seed + 13.7) - 0.0038;
  float tooth = (fbm(q * 84.0 + vec2(seed * 3.1, -seed * 2.3)) - 0.49) * 0.016;
  return (f1 * 0.90 + f2 * 0.65 + f3 * 0.42 + tooth) * amp;
}

// Natural standalone cumulonimbus base profile (condensation level around y = 0.28 .. 0.33)
float cauliflowerBase(vec2 p, float seed, float amp) {
  vec2 w = vec2(
    fbm(p * 3.6 + vec2(seed, -seed)) - 0.5,
    fbm(p * 3.6 + vec2(5.1 - seed, seed)) - 0.5
  );
  vec2 q = vec2(p.x * 0.78, p.y * 1.15) + w * 0.014;
  float b1 = puffGrid(q, 11.0, seed) - 0.025;
  float b2 = puffGrid(q, 25.0, seed + 6.7) - 0.011;
  float b3 = puffGrid(q, 54.0, seed + 13.9) - 0.005;
  return (b1 * 0.58 + b2 * 0.28 + b3 * 0.14) * amp;
}

float macroBaseY(float px) {
  float u = clamp(px / ASPECT, 0.0, 1.0);
  float base = 0.305
    + 0.016 * sin(u * 6.2831853 - 0.5)
    + 0.010 * sin(u * 15.707963 + 1.2)
    - 0.014 * exp(-pow((px - 1.95) * 1.6, 2.0))
    - 0.010 * exp(-pow((px - 0.35) * 2.2, 2.0))
    + 0.018 * exp(-pow((px - 1.02) * 3.2, 2.0));
  return base;
}

float crestStation(int idx) {
  if (idx < 16) {
    if (idx < 8) {
      if (idx < 4) {
        return idx == 0 ? 0.704 : idx == 1 ? 0.728 : idx == 2 ? 0.785 : 0.750;
      } else {
        return idx == 4 ? 0.839 : idx == 5 ? 0.848 : idx == 6 ? 0.722 : 0.751;
      }
    } else {
      if (idx < 12) {
        return idx == 8 ? 0.752 : idx == 9 ? 0.588 : idx == 10 ? 0.618 : 0.570;
      } else {
        return idx == 12 ? 0.456 : idx == 13 ? 0.464 : idx == 14 ? 0.572 : 0.690;
      }
    }
  } else {
    if (idx < 24) {
      if (idx < 20) {
        return idx == 16 ? 0.700 : idx == 17 ? 0.680 : idx == 18 ? 0.698 : 0.782;
      } else {
        return idx == 20 ? 0.908 : idx == 21 ? 0.984 : idx == 22 ? 0.976 : 0.935;
      }
    } else {
      if (idx < 28) {
        return idx == 24 ? 0.984 : idx == 25 ? 1.004 : idx == 26 ? 1.005 : 0.994;
      } else {
        return idx == 28 ? 0.888 : idx == 29 ? 0.916 : idx == 30 ? 0.920 : idx == 31 ? 0.788 : 0.767;
      }
    }
  }
}

float macroCrestY(float px) {
  float u = clamp(px / ASPECT, 0.0, 1.0) * 32.0;
  int i = int(min(31.0, floor(u)));
  float f = u - float(i);
  float s = f * f * (3.0 - 2.0 * f);
  return mix(crestStation(i), crestStation(i + 1), s);
}

vec4 proceduralCloudLayers(vec2 p, float t, out float ambientMask) {
  ambientMask = 0.0;
  if (p.y <= 0.20) return vec4(0.0);

  // Seamless wind drift & cauliflower boiling when t * uWind > 0 (exact 0 offset at t = 0)
  float windPhase = t * uWind;
  vec2 driftCrest = vec2(windPhase * 0.012, -windPhase * 0.004);
  vec2 driftFloret = vec2(windPhase * 0.018, -windPhase * 0.006);
  float sway = sin(windPhase * 0.35) * 0.008 * clamp(windPhase, 0.0, 1.0);
  float detail = clamp(uDetail, 0.0, 2.0);

  vec2 pm = vec2(clamp(p.x + sway, 0.0, ASPECT), p.y);
  vec2 pf = vec2(clamp(p.x + sway * 1.35, 0.0, ASPECT), p.y);

  float sc = cauliflowerCrest(pm + driftCrest, 1.7, detail);
  float scBase = cauliflowerBase(pm + driftCrest * 0.85, 8.3, detail);
  float fl1 = internalFloretField(pf + driftFloret, 3.1, detail);
  float fl2 = internalFloretField(pm + vec2(0.019, -0.015) + driftFloret * 0.85, 7.4, detail);
  float fl3 = internalFloretField(pm + vec2(0.037, -0.029) + driftFloret * 0.70, 12.8, detail);

  // 1. Main Cloud Silhouette Field (d0 > 0 inside cloud)
  // Upper cumulonimbus crest with arc-length Euclidean normalization
  float yCrest = macroCrestY(pm.x);
  float slope = (macroCrestY(pm.x + 0.018) - macroCrestY(pm.x - 0.018)) / 0.036;
  float invGrad = 1.0 / sqrt(1.0 + min(slope * slope, 8.0));
  float dTop = (yCrest - pm.y) * invGrad + sc * 0.78;

  // Complete, uncut cumulonimbus cloud base with billowy outward-convex circular domes
  float yBase = macroBaseY(pm.x);
  float baseSlope = (macroBaseY(pm.x + 0.025) - macroBaseY(pm.x - 0.025)) / 0.050;
  float invBaseGrad = 1.0 / sqrt(1.0 + min(baseSlope * baseSlope, 4.0));
  float dBottom = (pm.y - yBase) * invBaseGrad + scBase * 0.92;
  float d0 = smin(dTop, dBottom, 0.018);

  // Delicate windswept diagonal contrail: (0.879, 0.733) -> (1.270, 0.898)
  float uContrail = clamp((pm.x - 0.879) / (1.270 - 0.879), 0.0, 1.0);
  float xContrail = mix(0.879, 1.270, uContrail);
  float yContrail = mix(0.733, 0.898, uContrail)
    + 0.0085 * sin(uContrail * 3.14159265)
    + (fbm(vec2(uContrail * 22.0 + 1.3 - windPhase * 0.15, uContrail * 9.0)) - 0.5) * 0.0040;
  float taper = sin(uContrail * 3.14159265);
  float vaporBreak = fbm((pm + driftCrest * 0.5) * 92.0 + vec2(2.1, -1.7));
  float contrailR = (0.0011 + 0.0016 * taper) * smoothstep(0.28, 0.62, vaporBreak);
  float dContrail = contrailR - length(pm - vec2(xContrail, yContrail));

  // Delicate detached wisps
  float dWisps = dContrail;
  dWisps = smax(dWisps, epuff(pf, vec2(0.195, 0.772), vec2(0.022, 0.0045)) + sc * 0.18, 0.002);
  dWisps = smax(dWisps, epuff(pf, vec2(0.115, 0.752), vec2(0.018, 0.0040)) + sc * 0.18, 0.002);
  dWisps = smax(dWisps, epuff(pf, vec2(1.020, 0.580), vec2(0.042, 0.0045)) + sc * 0.18, 0.002);
  dWisps = smax(dWisps, epuff(pf, vec2(2.480, 0.935), vec2(0.020, 0.0045)) + sc * 0.18, 0.002);
  dWisps = smax(dWisps, epuff(pf, vec2(2.585, 0.890), vec2(0.028, 0.0055)) + sc * 0.18, 0.002);
  d0 = smax(d0, dWisps, 0.002);

  float aa = 1.0 / max(uRes.y, 1.0);
  float wMask = smoothstep(-aa, aa, d0);
  if (wMask <= 0.001) return vec4(0.0);

  // =========================================================================
  // TONE 0 (WHITE #FDFAF1) vs TONE 1 (PALE #D1EAF9):
  // =========================================================================
  float whiteClusters = -1.0;
  whiteClusters = smax(whiteClusters, epuff(pf, vec2(0.125, 0.748), vec2(0.068, 0.024)), 0.010);
  whiteClusters = smax(whiteClusters, epuff(pf, vec2(0.038, 0.678), vec2(0.048, 0.028)), 0.010);
  whiteClusters = smax(whiteClusters, epuff(pf, vec2(0.305, 0.818), vec2(0.058, 0.026)), 0.010);
  whiteClusters = smax(whiteClusters, epuff(pf, vec2(0.545, 0.720), vec2(0.044, 0.028)), 0.010);
  whiteClusters = smax(whiteClusters, epuff(pf, vec2(0.765, 0.578), vec2(0.082, 0.032)), 0.012);
  whiteClusters = smax(whiteClusters, epuff(pf, vec2(0.648, 0.545), vec2(0.058, 0.028)), 0.012);
  whiteClusters = smax(whiteClusters, epuff(pf, vec2(0.608, 0.505), vec2(0.040, 0.024)), 0.012);
  // Lower-left foreground sunlit sub-puffs
  whiteClusters = smax(whiteClusters, epuff(pf, vec2(0.165, 0.445), vec2(0.058, 0.025)), 0.012);
  whiteClusters = smax(whiteClusters, epuff(pf, vec2(0.395, 0.425), vec2(0.052, 0.022)), 0.012);

  float shelfWhite = smax(
    epuff(pf, vec2(1.33, 0.655), vec2(0.095, 0.042)),
    epuff(pf, vec2(1.28, 0.575), vec2(0.072, 0.042)),
    0.014
  );
  shelfWhite = smax(shelfWhite, epuff(pf, vec2(1.46, 0.585), vec2(0.055, 0.038)), 0.014);
  shelfWhite = smax(shelfWhite, epuff(pf, vec2(1.23, 0.502), vec2(0.055, 0.032)), 0.014);
  shelfWhite = smax(shelfWhite, epuff(pf, vec2(1.56, 0.748), vec2(0.044, 0.034)), 0.014);
  float shelfCrevice = smax(
    epuff(pf, vec2(1.38, 0.595), vec2(0.038, 0.028)),
    epuff(pf, vec2(1.31, 0.525), vec2(0.035, 0.022)),
    0.010
  );
  shelfWhite = smin(shelfWhite, -(shelfCrevice + fl2 * 0.6), 0.008);
  whiteClusters = smax(whiteClusters, shelfWhite, 0.012);

  whiteClusters = smax(whiteClusters, epuff(pf, vec2(1.685, 0.885), vec2(0.052, 0.088)), 0.014);
  whiteClusters = smax(whiteClusters, epuff(pf, vec2(1.815, 0.825), vec2(0.078, 0.026)), 0.014);
  whiteClusters = smax(whiteClusters, epuff(pf, vec2(1.755, 0.768), vec2(0.048, 0.024)), 0.014);

  float rightMoundWhite = smax(
    epuff(pf, vec2(2.015, 0.655), vec2(0.052, 0.055)),
    epuff(pf, vec2(1.985, 0.605), vec2(0.042, 0.032)),
    0.012
  );
  rightMoundWhite = smax(rightMoundWhite, epuff(pf, vec2(2.095, 0.448), vec2(0.068, 0.022)), 0.012);
  rightMoundWhite = smax(rightMoundWhite, epuff(pf, vec2(1.865, 0.398), vec2(0.058, 0.024)), 0.012);
  rightMoundWhite = smax(rightMoundWhite, epuff(pf, vec2(2.345, 0.455), vec2(0.056, 0.024)), 0.012);
  whiteClusters = smax(whiteClusters, rightMoundWhite, 0.012);
  whiteClusters += fl1 * 1.15;

  float rightAnvilNoWhite = smoothstep(1.95, 2.02, pm.x) * smoothstep(0.74, 0.86, pm.y);
  float rimInset = mix(0.012, -0.012, rightAnvilNoWhite) + 0.007 * clamp(1.0 - (pm.x - 0.1) * 0.5, 0.0, 1.0);
  float dPale = (macroCrestY(pm.x - 0.010) - (pm.y + rimInset)) * invGrad + fl1 * 0.85;
  dPale = smin(dPale, -whiteClusters, 0.008);

  // =========================================================================
  // TONE 1 (PALE #D1EAF9) vs TONE 2 (MID-BLUE #A7D4F3):
  // =========================================================================
  float paleClusters = -1.0;
  paleClusters = smax(paleClusters, epuff(pf, vec2(0.14, 0.665), vec2(0.150, 0.080)), 0.016);
  paleClusters = smax(paleClusters, epuff(pf, vec2(0.04, 0.600), vec2(0.082, 0.062)), 0.016);
  paleClusters = smax(paleClusters, epuff(pf, vec2(0.20, 0.455), vec2(0.092, 0.042)), 0.016);
  paleClusters = smax(paleClusters, epuff(pf, vec2(0.54, 0.665), vec2(0.054, 0.042)), 0.012);
  paleClusters = smax(paleClusters, epuff(pf, vec2(0.79, 0.545), vec2(0.070, 0.032)), 0.012);
  paleClusters = smax(paleClusters, epuff(pf, vec2(1.44, 0.658), vec2(0.088, 0.044)), 0.014);
  paleClusters = smax(paleClusters, epuff(pf, vec2(1.90, 0.415), vec2(0.092, 0.040)), 0.014);
  paleClusters = smax(paleClusters, epuff(pf, vec2(2.24, 0.475), vec2(0.088, 0.038)), 0.014);
  paleClusters = smax(paleClusters, epuff(pf, vec2(2.42, 0.465), vec2(0.082, 0.036)), 0.014);
  float upperPale = epuff(pf, vec2(1.86, 0.892), vec2(0.152, 0.078));
  upperPale = smin(upperPale, -(epuff(pf, vec2(1.94, 0.930), vec2(0.032, 0.020)) + fl2 * 0.5), 0.008);
  paleClusters = smax(paleClusters, upperPale, 0.016);
  paleClusters += fl2 * 1.15;

  float paleInset = mix(0.022, -0.014, rightAnvilNoWhite);
  float dBlue = (macroCrestY(pm.x - 0.018) - (pm.y + paleInset)) * invGrad + fl2 * 0.85;
  dBlue = smin(dBlue, -paleClusters, 0.009);
  float leftMainBlue = epuff(pm, vec2(0.39, 0.72), vec2(0.115, 0.105)) + fl2 * 0.85;
  dBlue = smax(dBlue, leftMainBlue, 0.012);
  float rightMidBlue = smax(
    epuff(pm, vec2(1.69, 0.74), vec2(0.085, 0.065)),
    epuff(pm, vec2(2.09, 0.93), vec2(0.110, 0.080)),
    0.018
  ) + fl2 * 0.85;
  dBlue = smax(dBlue, rightMidBlue, 0.012);
  dBlue = smin(dBlue, -whiteClusters, 0.006);
  dBlue = smin(dBlue, -(paleClusters - 0.005), 0.008);

  // =========================================================================
  // TONE 3 (DEEP-BLUE #88C1EB):
  // =========================================================================
  float dDeep = -1.0;
  dDeep = smax(dDeep, epuff(pm, vec2(0.465, 0.595), vec2(0.118, 0.095)), 0.018);
  dDeep = smax(dDeep, epuff(pm, vec2(0.585, 0.605), vec2(0.082, 0.065)), 0.018);
  dDeep = smax(dDeep, epuff(pm, vec2(0.440, 0.790), vec2(0.036, 0.032)), 0.014);
  dDeep = smax(dDeep, epuff(pm, vec2(0.220, 0.520), vec2(0.058, 0.032)), 0.018);
  dDeep = smax(dDeep, epuff(pm, vec2(0.780, 0.435), vec2(0.110, 0.045)), 0.018);
  dDeep = smax(dDeep, epuff(pm, vec2(1.250, 0.455), vec2(0.075, 0.035)), 0.018);
  dDeep = smax(dDeep, epuff(pm, vec2(1.685, 0.735), vec2(0.058, 0.048)), 0.014);
  dDeep = smax(dDeep, epuff(pm, vec2(1.940, 0.655), vec2(0.062, 0.075)), 0.016);
  dDeep = smax(dDeep, epuff(pm, vec2(1.620, 0.485), vec2(0.240, 0.095)), 0.020);
  // Continuous cloud-base shadow shelf along the lower belly of the standalone cloud
  float baseDeepShelf = (yBase + 0.075 - pm.y) + fl3 * 0.95;
  dDeep = smax(dDeep, baseDeepShelf, 0.022);

  float rightDeep = roundBoxField(pm, vec2(2.39, 0.64), vec2(0.26, 0.35), 0.06);
  float rightBluePuffs = smax(
    epuff(pm, vec2(2.37, 0.815), vec2(0.078, 0.048)),
    epuff(pm, vec2(2.28, 0.585), vec2(0.110, 0.038)),
    0.014
  );
  rightBluePuffs = smax(rightBluePuffs, epuff(pm, vec2(2.42, 0.505), vec2(0.105, 0.048)), 0.014);
  rightBluePuffs = smax(rightBluePuffs, epuff(pm, vec2(2.18, 0.455), vec2(0.095, 0.042)), 0.014);
  rightDeep = smin(rightDeep, -(rightBluePuffs + fl2 * 0.85), 0.012);
  dDeep = smax(dDeep, rightDeep, 0.020);
  dDeep += fl3 * 1.10;
  dDeep = smin(dDeep, -whiteClusters, 0.006);
  dDeep = smin(dDeep, -paleClusters, 0.006);

  dBlue = smax(dBlue, dDeep + 0.004, 0.006);
  dPale = smax(dPale, dBlue + 0.004, 0.006);

  // =========================================================================
  // TONE 4 (AMBIENT CLOUD-BASE RECESS #6CBAF8):
  // =========================================================================
  float dAmbient = -1.0;
  dAmbient = smax(dAmbient, epuff(pm, vec2(1.54, 0.445), vec2(0.185, 0.065)), 0.020);
  dAmbient = smax(dAmbient, epuff(pm, vec2(1.74, 0.525), vec2(0.085, 0.075)), 0.020);
  // Natural cloud underside ambient shadow band hugging the billowy base
  float baseUnderside = (yBase + 0.032 - pm.y) + fl3 * 0.85;
  dAmbient = smax(dAmbient, baseUnderside, 0.018);
  dAmbient += fl3 * 1.10;
  dAmbient = smin(dAmbient, -whiteClusters, 0.008);
  dAmbient = smin(dAmbient, -paleClusters, 0.008);

  float gMask = min(wMask, smoothstep(-aa, aa, dPale));
  float bMask = min(gMask, smoothstep(-aa, aa, dBlue));
  float aMask = min(bMask, smoothstep(-aa, aa, dDeep));
  ambientMask = min(aMask, smoothstep(-aa, aa, dAmbient));

  return vec4(wMask, gMask, bMask, aMask);
}

// Pure standalone cloud color + alpha layer (alpha = 0 outside cloud, 1 inside cloud)
vec4 proceduralCloudRGBA(vec2 p, float t) {
  float ambientMask = 0.0;
  vec4 layers = proceduralCloudLayers(p, t, ambientMask);
  if (layers.r <= 0.001) return vec4(0.0);
  if (uDebug == 4) { layers = vec4(layers.r, 0.0, 0.0, 0.0); ambientMask = 0.0; }
  if (uDebug == 5) { layers = vec4(layers.rg, 0.0, 0.0); ambientMask = 0.0; }
  if (uDebug == 6) { layers = vec4(layers.rgb, 0.0); ambientMask = 0.0; }

  vec3 white   = vec3(253.0, 250.0, 241.0) / 255.0;
  vec3 pale    = vec3(209.0, 234.0, 249.0) / 255.0;
  vec3 blue    = vec3(167.0, 212.0, 243.0) / 255.0;
  vec3 deep    = vec3(136.0, 193.0, 235.0) / 255.0;
  vec3 ambient = vec3(108.0, 187.0, 248.0) / 255.0;

  // Compute unpremultiplied interior cloud color so alpha edge has zero sky bleed
  float invAlpha = 1.0 / max(layers.r, 0.001);
  float gRel = clamp(layers.g * invAlpha, 0.0, 1.0);
  float bRel = clamp(layers.b * invAlpha, 0.0, 1.0);
  float aRel = clamp(layers.a * invAlpha, 0.0, 1.0);
  float ambRel = clamp(ambientMask * invAlpha, 0.0, 1.0);

  vec3 c = white;
  c = mix(c, pale, gRel);
  c = mix(c, blue, bRel);
  c = mix(c, deep, aRel);
  c = mix(c, ambient, ambRel);
  float farTint = smoothstep(2.05, 2.55, p.x) * bRel * (1.0 - ambRel);
  c = mix(c, vec3(c.r * 0.90, c.g * 0.98, min(1.0, c.b * 1.07)), farTint * 0.55);

  if (uDebug == 2) {
    c = vec3(1.0, gRel * 0.85, bRel * 0.7 + aRel * 0.3);
  }
  if (uDebug == 1) {
    float edge = layers.r * (1.0 - layers.r) * 4.0;
    c = mix(c, vec3(1.0, 0.42, 0.18), clamp(edge * 2.2, 0.0, 1.0));
  }
  return vec4(c, layers.r);
}

vec3 cloudBank(vec2 p, vec3 skyColor, float t) {
  vec4 cloud = proceduralCloudRGBA(p, t);
  if (uDebug == 2) return mix(skyColor * 0.22, cloud.rgb, cloud.a);
  return mix(skyColor, cloud.rgb, cloud.a);
}

