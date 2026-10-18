// Ground displacement is integrated by the runtime independently of wind.
// Each plant's silhouette AND color use the same world-space root.
void foliageOver(inout vec4 back,vec4 front){
  float a=front.a+back.a*(1.0-front.a);
  back=vec4((front.rgb*front.a+back.rgb*back.a*(1.0-front.a))/max(a,.00001),a);
}
vec4 broadLeaf(vec2 p,vec2 center,vec2 axis,float length,float width,float seed){
  vec2 delta=p-center,v=vec2(dot(delta,axis),dot(delta,vec2(-axis.y,axis.x)));
  if(abs(v.x)>length+.002||abs(v.y)>width+.002)return vec4(0);
  float u=v.x/length,edge=width*max(0.0,1.0-u*u);
  float d=max(abs(v.y)-edge,abs(v.x)-length);
  vec3 color=mix(vec3(.024,.24,.22),vec3(.10,.36,.24),step(.36,seed));
  color=mix(color,vec3(.25,.46,.23),step(.73,seed));
  color=mix(color,vec3(.38,.54,.27),step(0.0,v.y)*(.22+.25*uSun));
  float vein=(1.0-smoothstep(.0004,.0010,abs(v.y)))*(1.0-smoothstep(.3,.9,abs(u)));
  color=mix(color,vec3(.37,.49,.23),vein*.40);
  float brush=noise(floor(p*768.0)/768.0*vec2(250,180));
  color+=vec3(.018,.030,.017)*(step(.61,brush)-step(brush,.28));
  d+=(brush-.5)*.0015;
  return vec4(color,mask(d));
}

vec4 nearBank(vec2 p){
  float x=p.x-uGroundTravel*.72;
  float ridge=.010+.042*pow(noise(vec2(x*2.2,71.0)),2.0);
  ridge+=.008*noise(vec2(x*17.0,13.0));
  float edge=ridge+.009*(noise(vec2(x*170.0,p.y*110.0))-.5);
  vec3 color=mix(vec3(.018,.18,.21),vec3(.055,.30,.23),step(.54,noise(vec2(x*36.0,p.y*64.0))));
  color=mix(color,vec3(.23,.40,.19),step(.65,noise(vec2(x*140.0,p.y*130.0)))*smoothstep(ridge-.025,ridge,p.y));
  return vec4(color,mask(p.y-edge));
}

vec4 passingBranch(vec2 p,float t){
  if(p.y>.65)return vec4(0);
  const float spacing=2.85;
  float world=p.x-uGroundTravel*3.2;
  float cell=floor((world+.18)/spacing+.5);
  float size=.89+.18*hash(vec2(cell,30.0));
  vec2 q=vec2(world-(cell*spacing-.18),p.y+.055)/size;
  if(abs(q.x)>.46||q.y>.65)return vec4(0);
  // Bend the branch and its leaves together, keeping the root fixed.
  float sway=(sin(t*.85+cell*2.1)*.012+sin(t*1.72+cell)*.004)*uWind;
  q.x-=sway*pow(max(q.y,0.0)/.6,2.0);
  vec4 c=vec4(0);
  paint(c,capsule(q,vec2(.04,0),vec2(-.08,.48),.0045),vec3(.055,.25,.19));
  // Open branching rather than a solid hedge: individual pointed leaves
  // briefly overlap the view, with clear sky and bridge visible between them.
  for(int j=0;j<4;j++){
    float branch=float(j),side=mod(branch,2.0)*2.0-1.0;
    vec2 from=vec2(.02-branch*.023,.13+branch*.085);
    vec2 tip=from+vec2(side*(.19-branch*.016),.10);
    vec2 axis=normalize(tip-from),normal=vec2(-axis.y,axis.x);
    paint(c,capsule(q,from,tip,.0020),vec3(.10,.30,.19));
    for(int k=0;k<4;k++){
      float u=(float(k)+.65)/4.5;
      float seed=hash(vec2(cell*31.0+branch*7.0+float(k),9));
      float len=.029+.022*seed;
      vec2 stem=mix(from,tip,u);
      vec2 a=normalize(axis*.50+normal),b=normalize(axis*.65-normal);
      foliageOver(c,broadLeaf(q,stem+a*len*.76,a,len,.012+seed*.010,seed));
      foliageOver(c,broadLeaf(q,stem+b*len*.82,b,len*.90,.011+seed*.009,fract(seed+.37)));
    }
  }
  foliageOver(c,broadLeaf(q,vec2(-.085,.49),normalize(vec2(-.2,1)),.044,.021,.7));
  return c;
}

vec4 grassLayer(vec2 p,float t,float layer){
  float spacing=mix(.085,.135,layer),speed=mix(2.5,5.2,layer);
  float world=p.x-uGroundTravel*speed;
  float baseCell=floor(world/spacing);
  vec4 c=vec4(0);
  if(p.y>mix(.14,.235,layer))return c;
  for(int j=-1;j<=1;j++){
    float cell=baseCell+float(j),seed=hash(vec2(cell,117.0+layer));
    float root=(cell+.2+.6*seed)*spacing;
    float base=-.016+.012*hash(vec2(cell,27.0+layer));
    float h=mix(.035,.067,layer)+mix(.043,.098,layer)*seed;
    vec2 q=vec2(world-root,p.y-base);
    if(abs(q.x)>spacing*1.3||q.y<0.0||q.y>h*1.28)continue;
    float gust=(sin(t*1.15+cell*.42)+.38*sin(t*2.4+cell*.13))*uWind;
    for(int i=0;i<5;i++){
      float blade=float(i)-2.0,r=hash(vec2(cell*7.0+float(i),23.0+layer));
      float height=h*(.66+.58*r),u=clamp(q.y/height,0.0,1.0);
      float bend=blade*.018+(.008+.012*layer)*gust;
      float center=blade*.006+bend*u*u;
      float width=mix(.0032,.0080,layer)*(1.0-u)*(.5+1.2*sin(u*3.14159))*(.7+.6*r);
      float d=max(abs(q.x-center)-width,max(-q.y,q.y-height));
      vec3 color=mix(vec3(.035,.25,.18),vec3(.16,.39,.21),step(.36,r));
      color=mix(color,vec3(.33,.49,.22),step(.70,r));
      float lit=step(.16,u)*step(q.x,center-width*.35)*(.24+.32*r)*uSun;
      color=mix(color,vec3(.53,.63,.29),lit);
      paint(c,d,color);
    }
  }
  return c;
}

vec4 foreground(vec2 p,float t){
  if(p.y>.65)return vec4(0);
  vec4 c=nearBank(p);
  foliageOver(c,grassLayer(p,t,0.0));
  foliageOver(c,passingBranch(p,t));
  foliageOver(c,grassLayer(p,t,1.0));
  return c;
}
