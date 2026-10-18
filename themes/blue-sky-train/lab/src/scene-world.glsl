float peak(float x,float center,float width){return max(0.0,1.0-abs(x-center)/width);}
float mountainPeak(float x,float center,float width){
  float d=abs(mod(x-center+2.4,4.8)-2.4);
  return max(0.0,1.0-d/width);
}
vec3 mountains(vec2 p,vec3 c,float t){
  for(int i=0;i<3;i++){
    float layer=float(i),parallax=.035+layer*.045;
    float x=p.x+cameraAt(t)*parallax;
    float left=mountainPeak(x,.44+layer*.04,.62+layer*.05);
    float right=smoothstep(0.0,1.0,mountainPeak(x,2.95,1.45-layer*.04));
    float ridge=.375-layer*.018+left*(.070+layer*.045)+right*(.20+layer*.075);
    if(i==0)ridge+=.055*mountainPeak(x,1.35,.36)+.040*mountainPeak(x,.95,.18);
    ridge+=(noise(vec2(x*15.0+layer*11.0,2.0))-.5)*(.018+layer*.007);
    ridge+=(noise(vec2(x*43.0,layer+4.0))-.5)*.007;
    vec3 color=mix(vec3(.40,.72,.91),vec3(.12,.43,.62),layer*.44);
    color=mix(color,vec3(.13,.40,.39),right*layer*.30);
    // Broad slope facets and small vegetation flecks remain in world coordinates.
    float slope=fbm(vec2(x*12.0+p.y*9.0,p.y*19.0-layer*3.0));
    color+=vec3(.025,.050,.045)*step(.55,slope);
    color-=vec3(.018,.035,.025)*step(.69,fbm(vec2(x*24.0-p.y*12.0,p.y*25.0)));
    if(i==2){
      float trees=step(.63,fbm(vec2(x*110.0,p.y*100.0)));
      color=mix(color,vec3(.23,.46,.32),trees*.20*right);
    }
    color=mix(color,vec3(.45,.72,.87),.20*(1.0-smoothstep(.28,.53,p.y)));
    // Sunlit air separates the distant slopes from the dark bridge. Keep
    // the shapes and facets, adding more blue air toward the valley floor.
    float valleyAir=1.0-smoothstep(.31,.54,p.y);
    color=mix(color,vec3(.375,.765,.965),uSun*valleyAir*(.52-layer*.025));
    c=mix(c,color,mask(p.y-ridge));
  }
  return c;
}
// The far bank shares the bridge's world frame so each pier stays grounded.
float shoreGroundHeight(float x){
 float land=HORIZON+.012+.006*noise(vec2(x*4.2,27.0))+.002*noise(vec2(x*31.0,8.0));
 float pier=abs(mod(x+.056,.112)-.056);
 float footing=1.0-smoothstep(.013,.040,pier);
 return mix(land,BRIDGE_FOOT+.0015,footing);
}
vec4 lakeshore(vec2 p,float t){
 if(p.y>BRIDGE_FOOT+.030)return vec4(0);
 float x=p.x+cameraAt(t),top=shoreGroundHeight(x);
 vec2 pixel=floor(vec2(x,p.y)*768.0);
 float brush=noise(pixel*vec2(.095,.31));
 // A cool bank face, a muted grassy surface and intermittent sunlit flecks.
 vec3 face=mix(vec3(.115,.300,.278),vec3(.205,.385,.292),step(.50,brush));
 vec3 turf=mix(vec3(.255,.430,.303),vec3(.355,.505,.327),step(.55,brush));
 float upper=smoothstep(top-.009,top-.003,p.y);
 vec3 color=mix(face,turf,upper);
 float light=step(.61,noise(vec2(pixel.x*.057,pixel.y*.24)))*mask(top-p.y-.0025);
 color=mix(color,vec3(.465,.570,.355),light*upper*uSun*.70);
 // Wet contact is a narrow, broken dark edge, not a second bright green stripe.
 float wet=1.0-smoothstep(HORIZON+.001,HORIZON+.0045,p.y);
 color=mix(color,vec3(.075,.235,.245),wet*.72);
 vec4 bank=vec4(color,mask(p.y-top));
 // Reuse the generated understory PNG, at a distant scale and only in patches.
 // At most two samples; no new hand-drawn or synthesized leaf silhouettes.
 const float spacing=.098;
 float cell=floor(x/spacing);
 for(int i=0;i<2;i++){
  float id=cell+float(i)-.5,r=hash(vec2(id,251.0));
  float center=(id+.35+.30*hash(vec2(id,79.0)))*spacing;
  float patch=noise(vec2(center*6.0,15.0));
  if(r>.30&&patch>.36){
   float height=.029+.009*r;
   vec4 plant=foliageSprite(vec2(x,p.y),center,shoreGroundHeight(center)-.020,height,2.0,foliageBend(t,id,.012));
   plant.rgb=mix(plant.rgb,vec3(.180,.370,.315),.37);
   plant.rgb=mix(plant.rgb,vec3(.335,.515,.465),.10);
   foliageOver(bank,plant);
  }
 }
 return bank;
}
vec3 aboveWater(vec2 p,float t){
 vec3 c=cloudBank(p,sky(p),t);
 c=mountains(p,c,t);
 c=over(c,lakeshore(p,t));
 c=over(c,train(p,t));c=over(c,steam(p,t));c=over(c,bridge(p,t));
 return c;
}
vec2 reflectionPoint(vec2 p,float t){
  float depth=max(HORIZON-p.y,0.0),perspective=1.0/(depth+.035);
  float wave=sin(p.x*65.0+perspective*3.0+t*1.5)*.6+sin(p.x*113.0-perspective*2.3+t*1.1)*.4;
  float displacement=wave*(.0005+depth*.010)*uRipple;
  return vec2(p.x+displacement,2.0*HORIZON-p.y+displacement*.18);
}
vec3 fullScene(vec2 p,float t,bool withForeground){
  vec3 c;
  if(p.y<HORIZON){
    c=aboveWater(reflectionPoint(p,t),t);float depth=HORIZON-p.y;
    c=mix(c,vec3(.13,.49,.65),.09+depth*.20);
    // Water close to the bank absorbs the bright turf colour. Horizontal,
    // interrupted ripples separate the reflected bank from the real shore.
    float bankReflection=1.0-smoothstep(.006,.034,depth);
    float brokenRipple=smoothstep(.50,.82,noise(vec2(floor(p.x*420.0)*.035,floor(depth*768.0)*.68-t*.22)));
    c=mix(c,vec3(.140,.390,.420),bankReflection*(.12+.12*brokenRipple));
    float glint=pow(max(0.0,sin(p.x*36.0+1.0/(depth+.03)*3.0-t*.8)),28.0);
    c+=vec3(.04,.055,.06)*glint*uRipple;
  }else c=aboveWater(p,t);
  if(withForeground)c=over(c,foreground(p,t));
  return c;
}
