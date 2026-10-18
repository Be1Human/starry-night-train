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
vec4 nearBank(vec2 p,float t){
  if(p.y>.20)return vec4(0);
  const float spacing=.37;
  float world=p.x-uGroundTravel*.72,cell=floor(world/spacing);
  vec4 c=vec4(0);
  for(int i=-1;i<=1;i++){
    float id=cell+float(i),r=hash(vec2(id,71.0));
    foliageOver(c,foliageSprite(vec2(world,p.y),(id+.5)*spacing,-.19,.36+r*.04,2.0,foliageBend(t,id,.034)));
  }
  return c;
}
vec4 passingBranch(vec2 p,float t){
  if(p.y>.65)return vec4(0);
  const float spacing=2.85;
  float world=p.x-uGroundTravel*3.2,cell=floor((world+.18)/spacing+.5);
  float h=.64+.09*hash(vec2(cell,30.0));
  float sway=foliageBend(t,cell,.078)+sin(t*1.72+cell)*.018*uWind;
  return foliageSprite(vec2(world,p.y),cell*spacing-.18,-.12,h,1.0,sway);
}
vec4 grassLayer(vec2 p,float t,float layer){
  if(p.y>mix(.25,.34,layer))return vec4(0);
  float spacing=mix(.36,.48,layer),speed=mix(2.5,5.2,layer);
  float world=p.x-uGroundTravel*speed,cell=floor(world/spacing);
  vec4 c=vec4(0);
  for(int i=-1;i<=1;i++){
    float id=cell+float(i),r=hash(vec2(id,117.0+layer));
    float h=mix(.27,.36,layer)+mix(.065,.10,layer)*r;
    float center=(id+.45+.12*hash(vec2(id,23.0)))*spacing;
    float amp=mix(.055,.075,layer);
    float bend=foliageBend(t,id+layer*40.0,amp);
    foliageOver(c,foliageSprite(vec2(world,p.y),center,mix(-.115,-.155,layer),h,0.0,bend));
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