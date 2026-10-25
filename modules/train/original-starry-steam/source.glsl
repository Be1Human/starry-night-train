// Generated extraction; edit the original implementation and rebuild.
// Source: themes/starry-night-train/index.html
// 原星河云算法移植自 mdb shader，上游未附再分发许可。沿用原声明：仅供学习与欣赏，请勿商用。各模块仍需阅读原主题来源说明。
// This is an exact source excerpt, not a standalone shader.
// Dependencies: noise / fbmB / uNoise(256×256) / uOct; uSteam / uSmokeOff / uT / uTrainX / DECK / 烟色板; 展示星河原烟；蓝天 R10 适配未因此自动获得验收

float noise(vec2 x){ vec2 i=floor(x); vec2 f=fract(x); f=f*f*(3.-2.*f); return texture2D(uNoise,(i+f+.5)/256.).x; }

float fbmB(vec2 x){
  float a=0., w=.5, s=0.;
  for(int i=0;i<6;i++){ if(i>=uOct) break; a+=w*abs(2.*noise(x)-1.); s+=w; w*=.5; x=x*2.+vec2(17.,9.); }
  return a/s;
}

vec4 steam(vec2 p){
  if(uSteam<=0.) return vec4(0.);
  vec2 ch=vec2(uTrainX-.02,DECK+.051);
  float dx=ch.x-p.x;
  float L=.3+.45*uSteam;
  if(dx<-.006||dx>L) return vec4(0.);
  float dxp=max(dx,0.);
  float yc=ch.y+.1*sqrt(dxp)+.03*dxp;
  float r=.004+.075*pow(dxp,.7);
  float dy=p.y-yc;
  if(abs(dy)>r*1.8+.01) return vec4(0.);
  float n=fbmB(vec2((p.x+uSmokeOff)*24.,p.y*24.-uT*.6));
  float fade=1.-smoothstep(L*.25,L,dxp);
  float d=abs(dy)-r*(.25+1.5*n)*fade;
  if(d>0.) return vec4(0.);
  float s=floor(clamp(dy/(r+.002)*.5+.5,0.,1.)*3.+.5)/3.;
  vec3 c=mix(mix(cCloudShade,cCloudTop,.5),vec3(1.,.95,.98),s);
  c=mix(c,cCloudLit,.2);
  return vec4(c,(.35+.65*fade)*min(uSteam,1.)*smoothstep(-.006,0.,dx));
}
