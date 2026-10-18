// R02: authored envelope -> clustered billows -> light-facing flecks.
// All random choices are material-space and seed-based. Animation advects them.
float smin(float a,float b,float k) {
  float h=max(k-abs(a-b),0.0)/k;
  return min(a,b)-h*h*k*.25;
}
vec3 cloudHash(vec2 p) {
  vec3 q=fract(vec3(p.xyx)*vec3(.1031,.1030,.0973));
  q+=dot(q,q.yxz+33.33);
  return fract((q.xxy+q.yzz)*q.zyx);
}
float ellipse(vec2 p,vec2 c,vec2 r) { return (length((p-c)/r)-1.0)*min(r.x,r.y); }
float cloudField(vec2 q,float seed) {
  float lean=(hash(vec2(seed,3.0))-.5)*.14;
  q.x+=lean*q.y;
  vec3 profile=cloudHash(vec2(seed,4.2))-.5;
  float d=ellipse(q,vec2(-.04,-.025),vec2(.43,.115));
  d=smin(d,ellipse(q,vec2(-.27,.07),vec2(.15,.16)),.024);
  d=smin(d,ellipse(q,vec2(-.13,.21)+profile.xy*.075,vec2(.14,.245)+profile.yz*.045),.022);
  vec2 shoulder=vec2(.09,.15)+profile.yz*.08,shoulderSize=vec2(.175,.21);
  if(abs(seed-7.3)<.1){shoulder=vec2(.14,.10);shoulderSize=vec2(.115,.18);}
  d=smin(d,ellipse(q,shoulder,shoulderSize),.025);
  d=smin(d,ellipse(q,vec2(.27,.045),vec2(.16,.15)),.025);
  return d+(noise(q*8.0+seed)-.5)*.027;
}
vec2 cloudWarp(vec2 q,float seed,float phase) {
  vec2 large=vec2(noise(q*13.0+seed),noise(q*13.0+seed+7.2))-.5;
  vec2 fine=vec2(fbm(q*52.0+seed),fbm(q*52.0+seed+18.0))-.5;
  return large*.018+fine*.012*uDetail
    +vec2(sin(q.y*8.0+phase),cos(q.x*7.0+phase*.63))*.004;
}
// Project locally jittered cloud lobes. Keep the frontmost spherical cap.
// A 3x3 neighbourhood costs the same regardless of the cloud's total size.
void cloudBillows(vec2 q,float cell,float seed,float shapeSeed,float amplitude,
                  inout float surface,inout vec3 normal,inout float edge) {
  vec2 grid=floor(q/cell);
  for(int j=-1;j<=1;j++) for(int i=-1;i<=1;i++) {
    vec2 id=grid+vec2(float(i),float(j));
    vec3 random=cloudHash(id+seed);
    vec2 center=(id+.5+(random.xy-.5)*1.2)*cell;
    float envelope=cloudField(center,shapeSeed);
    float radius=cell*(.38+random.z*.67);
    radius*=1.0-smoothstep(-cell*.28,cell*.40,envelope);
    if(radius<cell*.08) continue;
    vec2 d=q-center;
    float radius2=dot(d,d)/(radius*radius);
    edge=min(edge,length(d)-radius);
    if(radius2>=1.0) continue;
    float z=sqrt(1.0-radius2);
    float base=sqrt(max(0.0,-envelope))*.10;
    float front=base+radius*z*amplitude+(random.y-.5)*cell*.85;
    if(cell<.05) front+=.015*(.45+random.x*.55);
    float w=smoothstep(-cell*.025,cell*.025,front-surface);
    normal=normalize(mix(normal,normalize(vec3(d/radius,z)),w));
    surface=max(surface,front);
  }
}
vec4 cloudVariant(vec2 p,vec2 center,vec2 scale,float phase,float seed,float haze) {
  vec2 raw=(p-center)/scale;
  if(abs(raw.x)>.60||raw.y<-.22||raw.y>.60) return vec4(0);
  vec2 q=raw+cloudWarp(raw,seed,phase);
  float envelope=cloudField(q,seed);
  if(envelope>.05) return vec4(0);
  float surface=-1.0,edge=1.0;
  vec3 n=vec3(0,0,1);
  cloudBillows(q,.068,seed,seed,1.0,surface,n,edge);
  cloudBillows(q+vec2(.007,-.005),.028,seed+31.0,seed,1.30,surface,n,edge);
  float d=edge;
  float a=mask(d*min(scale.x,scale.y));
  if(a<.001) return vec4(0);
  float e=.012;
  vec2 grad=vec2(cloudField(q+vec2(e,0),seed)-envelope,cloudField(q+vec2(0,e),seed)-envelope)/e;
  vec3 macroN=normalize(vec3(grad,.8));
  vec3 sun=normalize(vec3(-.65,.72,.65));
  // Broad blue shadow masses carry the form; individual caps only modulate them.
  // This avoids drawing a dark contour around every lobe like a pile of stones.
  float light=.41+.18*dot(n,sun)+.16*dot(macroN,sun)+.04*smoothstep(-.12,.35,q.y);
  light+=(fbm(q*12.0+seed)-.5)*.25;
  light+=(fbm(q*75.0+seed)-.5)*.12*uDetail;
  float rim=(1.0-smoothstep(0.0,.040,-envelope))*smoothstep(.0,.55,dot(macroN.xy,sun.xy));
  light+=rim*.12;
  vec3 c=mix(vec3(.46,.73,.94),vec3(.59,.80,.96),smoothstep(.30,.32,light));
  c=mix(c,vec3(.70,.87,.98),smoothstep(.45,.47,light));
  c=mix(c,vec3(.84,.93,.98),smoothstep(.65,.67,light));
  c=mix(c,vec3(.99,.985,.95),smoothstep(.75,.77,light));
  c=mix(c,vec3(.53,.78,.96),haze);
  if(uDebug==1)c=vec3(1);
  if(uDebug==2)c=n*.5+.5;
  return vec4(c,a);
}
vec4 cloud(vec2 p,vec2 center,float scale,float phase) {
  return cloudVariant(p,center,vec2(scale),phase,7.3,0.0);
}
vec3 cloudBank(vec2 p,vec3 color,float t) {
  float shift=cameraAt(t)*.035+t*uWind*.0035;
  // One call site keeps the full-scene shader compact on ANGLE.
  for(int i=0;i<12;i++) {
    float id=float(i),seed=7.3+id*9.1;
    vec2 center=vec2(mod(id*.55-shift+1.0,3.8)-.7,.405);
    vec2 size=vec2(.57,.23);
    float haze=.30;
    if(i==6){center=vec2(2.24-shift*.65,.55);size=vec2(1.18,1.13);haze=.28;}
    if(i==7){center=vec2(.18-shift,.52);size=vec2(.58,.55);haze=.08;}
    if(i==8){center=vec2(.54-shift,.465);size=vec2(.98,.70);haze=.0;seed=7.3;}
    if(i==9){center=vec2(.85-shift*.85,.425);size=vec2(.61,.37);haze=.08;}
    if(i==10){center=vec2(1.98-shift*.75,.535);size=vec2(1.04,1.01);haze=.04;seed=35.1;}
    if(i==11){center=vec2(1.43-shift*.9,.47);size=vec2(.70,.54);haze=.0;seed=21.6;}
    color=over(color,cloudVariant(p,center,size,t*(.018+id*.001)+id,seed,haze));
  }
  return color;
}
