// R09: generated RGBA artwork only; code places, bends and composites sprites.
uniform sampler2D uGrass, uLeaves, uUnderstory;
uniform vec3 uFoliageAspect;
void foliageOver(inout vec4 back,vec4 front){
  float a=front.a+back.a*(1.0-front.a);
  back=vec4((front.rgb*front.a+back.rgb*back.a*(1.0-front.a))/max(a,.00001),a);
}
vec4 foliageSprite(vec2 p,float center,float bottom,float height,float kind,float bend){
  float aspect=kind<.5?uFoliageAspect.x:kind<1.5?uFoliageAspect.y:uFoliageAspect.z;
  vec2 uv=vec2((p.x-center)/(height*aspect)+.5,(p.y-bottom)/height);
  // Root stays fixed; tip leans farther. Soft cubic keeps the crown from shearing too hard.
  uv.x-=bend*(uv.y*uv.y*(.55+.45*uv.y));
  if(uv.x<0.0||uv.x>1.0||uv.y<0.0||uv.y>1.0)return vec4(0);
  uv.y=1.0-uv.y;
  return kind<.5?texture2D(uGrass,uv):kind<1.5?texture2D(uLeaves,uv):texture2D(uUnderstory,uv);
}
// Shared wind field: slow gust + quicker flutter, unique phase per plant.
float foliageBend(float t,float id,float amp){
  float gust=.55+.45*sin(t*.31+id*.17);
  float flutter=sin(t*1.05+id*.42)*.72+.28*sin(t*2.55+id*1.9);
  return amp*uWind*gust*flutter;
}
// One shared world-space patch per stretch of shoreline. All depth layers leave
// the SAME open water, instead of independent tile rows filling one another's gaps.
const float FOLIAGE_PATCH_SPAN=7.4;
const float FOLIAGE_TRAVEL=4.6;
vec3 foliagePatch(vec2 p,float depth){
 float world=(p.x-ASPECT*.5)/depth+ASPECT*.5-uGroundTravel*FOLIAGE_TRAVEL;
 float id=floor((world-.15)/FOLIAGE_PATCH_SPAN+.5);
 float center=id*FOLIAGE_PATCH_SPAN+.15+(hash(vec2(id,217.0))-.5)*1.2;
 return vec3(world-center,p.y/depth,id);
}
float foliageSpread(float id){return .42+.46*hash(vec2(id,93.0));}
vec4 nearBank(vec2 p,float t){
 vec3 patch=foliagePatch(p,.82);
 if(patch.y>.22||abs(patch.x)>1.25)return vec4(0);
 float id=patch.z,spread=foliageSpread(id);
 vec4 c=vec4(0);
 for(int i=0;i<2;i++){
  float j=float(i),r=hash(vec2(id,71.0+j));
  if(i==0||r>.36){
   float center=(j-.5)*spread*.66;
   foliageOver(c,foliageSprite(patch.xy,center,-.17,.31+r*.07,2.0,foliageBend(t,id+j*19.0,.034)));
  }
 }
 return c;
}
vec4 passingBranch(vec2 p,float t){
 vec3 patch=foliagePatch(p,1.02);
 if(patch.y>.65||abs(patch.x)>1.25)return vec4(0);
 float id=patch.z;
 if(hash(vec2(id,181.0))<.32)return vec4(0);
 float h=.47+.25*hash(vec2(id,30.0));
 float center=(hash(vec2(id,42.0))-.5)*1.10;
 float sway=foliageBend(t,id,.065)+sin(t*1.72+id)*.014*uWind;
 return foliageSprite(patch.xy,center,-.12,h,1.0,sway);
}
vec4 grassLayer(vec2 p,float t,float layer){
 vec3 patch=foliagePatch(p,mix(.94,1.14,layer));
 if(patch.y>.31||abs(patch.x)>1.25)return vec4(0);
 float id=patch.z,spread=foliageSpread(id);
 vec4 c=vec4(0);
 for(int i=-1;i<=1;i++){
  float j=float(i),r=hash(vec2(id*3.0+j,117.0+layer));
  if(i==0||r>.32){
   float h=mix(.25,.31,layer)+mix(.065,.09,layer)*r;
   float center=(j*.52+(hash(vec2(id*3.0+j,23.0+layer))-.5)*.20)*spread;
   float bend=foliageBend(t,id*3.0+j+layer*40.0,mix(.045,.065,layer));
   foliageOver(c,foliageSprite(patch.xy,center,mix(-.115,-.145,layer),h,0.0,bend));
  }
 }
 return c;
}
vec4 foreground(vec2 p,float t){
 if(p.y>.65)return vec4(0);
 vec4 c=nearBank(p,t);
 foliageOver(c,grassLayer(p,t,0.0));
 foliageOver(c,passingBranch(p,t));
 foliageOver(c,grassLayer(p,t,1.0));
 return c;
}
