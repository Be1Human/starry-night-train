// R10: reuse the starry theme's original steam, noise and fbmB functions.
// The builder inserts their verbatim source at the marker below. Only the
// coordinate adapter and palette bind them to the blue-sky train.
uniform sampler2D uSteamNoise;
uniform vec2 uSteamPhase;
uniform float uSteamDensity, uSteamScale;
#define noise starrySteamNoise
#define fbmB starrySteamBillow
#define steam originalStarrySteam
#define uNoise uSteamNoise
#define uOct 6
#define uSteam uSteamDensity
#define uTrainX .02
#define DECK (-.051)
#define uSmokeOff uSteamPhase.x
#define uT uSteamPhase.y
#define cCloudShade vec3(.43,.64,.80)
#define cCloudTop vec3(.77,.87,.94)
#define cCloudLit vec3(.98,.98,.92)
/* ORIGINAL_STARRY_STEAM */
#undef noise
#undef fbmB
#undef steam
#undef uNoise
#undef uOct
#undef uSteam
#undef uTrainX
#undef DECK
#undef uSmokeOff
#undef uT
#undef cCloudShade
#undef cCloudTop
#undef cCloudLit
vec2 chimneyAt(float t){
  return vec2(headAt(t)-cameraAt(t)+.025*TRAIN_SCALE.x,DECK+.081*TRAIN_SCALE.y);
}
vec4 steam(vec2 p,float t){
  vec2 ch=chimneyAt(t);
  // The blue-sky locomotive faces left, so its trail extends to the right.
  vec2 q=vec2(ch.x-p.x,p.y-ch.y)/uSteamScale;
  return originalStarrySteam(q);
}
