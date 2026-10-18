#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform vec2 uRes;
uniform float uTime, uSpeed, uWind, uDetail, uRipple, uFollow;
uniform int uMode, uDebug;
const float ASPECT = 2.6666667;
const float HORIZON = 0.265;
const float DECK = 0.375;
const float TAU = 6.2831853;

// All examples use the same world: +x right, +y up, 1 unit = picture height.
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f);
  return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);
}
float fbm(vec2 p) { return .57*noise(p)+.28*noise(p*2.03+9.2)+.15*noise(p*4.11+17.6); }
float box(vec2 p, vec2 c, vec2 r) {
  vec2 q = abs(p-c)-r;
  return length(max(q,0.0))+min(max(q.x,q.y),0.0);
}
float mask(float d) { return 1.0-smoothstep(-.7/uRes.y,.7/uRes.y,d); }
float capsule(vec2 p, vec2 a, vec2 b, float r) {
  vec2 v=b-a; return length(p-a-v*clamp(dot(p-a,v)/dot(v,v),0.0,1.0))-r;
}
vec3 over(vec3 back, vec4 front) { return mix(back,front.rgb,front.a); }
void paint(inout vec4 c, float d, vec3 rgb) {
  float a=mask(d), combined=a+c.a*(1.0-a);
  c.rgb=(rgb*a+c.rgb*c.a*(1.0-a))/max(combined,.00001);
  c.a=combined;
}
