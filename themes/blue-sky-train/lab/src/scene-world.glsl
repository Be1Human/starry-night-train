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
// The bank and bridge travel in the same world frame. Upper ground and lower
// water edge are separate: broad peninsulas alternate with narrow, recessed bays.
vec2 shoreProfile(float x){
 float headland=smoothstep(.23,.79,noise(vec2(x*2.35,32.0)));
 float shelf=noise(vec2(x*5.3,17.0));
 float crest=BRIDGE_FOOT-.001+.020*headland+.007*(shelf-.3);
 crest+=(noise(vec2(x*43.0,9.0))-.5)*.004;
 crest=max(BRIDGE_FOOT-.001,crest);
 float edge=HORIZON+.016-.024*headland;
 edge+=(noise(vec2(x*7.3,45.0))-.5)*.007;
 // Fine erosion breaks the contour without making the broad bank a sine wave.
 edge+=(noise(vec2(floor(x*768.0)*.047,63.0))-.5)*.003;
 return vec2(crest,edge);
}
float shoreWaterline(float x){return shoreProfile(x).y;}
vec4 shorePlants(vec2 p,float t){
 vec4 plants=vec4(0);
 const float spacing=.46;
 float cell=floor(p.x/spacing);
 // Uneven groups with broad empty stretches, never one plant per bridge pier.
 for(int i=-1;i<=1;i++){
  float id=cell+float(i),r=hash(vec2(id,251.0));
  if(r>.28){
   float center=(id+.22+.56*hash(vec2(id,79.0)))*spacing;
   float spread=.065+.090*hash(vec2(id,148.0));
   for(int j=-1;j<=1;j++){
    float part=float(j),seed=hash(vec2(id*7.0+part,191.0));
    if(j==0||seed>.32){
     float cx=center+part*spread+(seed-.5)*.025;
     float h=(.047+.045*r)*mix(1.0,.66,abs(part));
     h*=.82+.32*seed;
     vec2 ground=shoreProfile(cx);
     float base=mix(ground.y+.003,ground.x-.002,.22+.65*seed);
     float root=base-h*.20;
     vec2 spritePoint=vec2(cx+(p.x-cx)/(1.08+.32*r),p.y);
     vec4 plant=foliageSprite(spritePoint,cx,root,h,2.0,foliageBend(t,id*7.0+part,.014));
     // Distant clumps inherit the blue atmosphere; retain generated leaf shapes.
     plant.rgb=mix(plant.rgb,vec3(.135,.340,.280),.29);
     plant.rgb=mix(plant.rgb,vec3(.255,.480,.420),.13);
     plant.a*=smoothstep(ground.y,ground.y+.004,p.y);
     foliageOver(plants,plant);
    }
   }
  }
 }
 return plants;
}
vec4 lakeshore(vec2 p,float t){
 if(p.y>BRIDGE_FOOT+.077||p.y<HORIZON-.026)return vec4(0);
 float x=p.x+cameraAt(t);
 vec2 profile=shoreProfile(x);
 float crest=profile.x,edge=profile.y;
 vec2 pixel=floor(vec2(x,p.y)*768.0);
 // Broad lit meadows between blue-green shrub shadows; horizontal brush marks
 // follow the slope instead of filling a constant-height rectangle with noise.
 float meadow=smoothstep(.30,.72,noise(vec2(x*4.7+p.y*9.0,p.y*47.0+21.0)));
 float strokes=noise(vec2(pixel.x*.052,pixel.y*.27+x*2.0));
 float strokeMask=step(.46,strokes);
 vec3 grass=mix(vec3(.235,.405,.265),vec3(.470,.615,.320),meadow);
 grass+=vec3(.060,.065,.012)*strokeMask*uSun;
 float sunPatch=step(.64,noise(vec2(x*17.0,p.y*82.0)))*meadow;
 grass=mix(grass,vec3(.585,.690,.360),sunPatch*.52*uSun);
 vec3 wet=mix(vec3(.075,.245,.225),vec3(.165,.340,.250),step(.48,strokes));
 float dry=smoothstep(.0015,.0065,p.y-edge);
 vec3 color=mix(wet,grass,dry);
 color=mix(color,vec3(.130,.330,.270),step(.58,noise(vec2(x*29.0,p.y*132.0)))*(1.0-meadow)*.27);
 float a=mask(p.y-crest)*mask(edge-p.y);
 vec4 bank=vec4(color,a);
 foliageOver(bank,shorePlants(vec2(x,p.y),t));
 return bank;
}
// Keep the bridge reflection on one horizontal plane. Only the shallow bank
// gets its own local reflection, so a meandering shoreline cannot bend the bridge.
vec3 landscapeWithoutBank(vec2 p,float t){
 vec3 c=cloudBank(p,sky(p),t);
 c=mountains(p,c,t);
 c=over(c,train(p,t));c=over(c,steam(p,t));c=over(c,bridge(p,t));
 return c;
}
vec3 aboveWater(vec2 p,float t){
 return over(landscapeWithoutBank(p,t),lakeshore(p,t));
}
vec2 reflectionPoint(vec2 p,float t){
 float depth=max(HORIZON-p.y,0.0),perspective=1.0/(depth+.035);
 float wave=sin(p.x*65.0+perspective*3.0+t*1.5)*.6+sin(p.x*113.0-perspective*2.3+t*1.1)*.4;
 float displacement=wave*(.0005+depth*.010)*uRipple;
 return vec2(p.x+displacement,2.0*HORIZON-p.y+displacement*.18);
}
vec3 fullScene(vec2 p,float t,bool withForeground){
 float edge=HORIZON;
 if(p.y>HORIZON-.080&&p.y<BRIDGE_FOOT+.015)edge=shoreWaterline(p.x+cameraAt(t));
 vec3 c;
 if(p.y<edge){
  vec2 reflected=reflectionPoint(p,t);
  c=landscapeWithoutBank(reflected,t);
  float depth=max(HORIZON-p.y,0.0),shoreDepth=edge-p.y;
  c=mix(c,vec3(.13,.49,.65),.09+depth*.20);
  // Short, broken reflections follow the local water edge. The main scene
  // still uses HORIZON, preserving straight arches and the train's alignment.
  if(shoreDepth<.065){
   float reflectedEdge=shoreWaterline(reflected.x+cameraAt(t));
   vec4 bank=lakeshore(vec2(reflected.x,reflectedEdge+shoreDepth*1.70),t);
   float ripple=noise(vec2(floor(p.x*420.0)*.035,floor(shoreDepth*768.0)*.68-t*.22));
   bank.rgb=mix(bank.rgb,vec3(.105,.365,.415),.40);
   bank.a*=(1.0-smoothstep(.006,.058,shoreDepth))*(.52+.30*step(.46,ripple));
   c=over(c,bank);
   float contact=(1.0-smoothstep(.0005,.0028,shoreDepth))*(.40+.30*step(.48,ripple));
   c=mix(c,vec3(.090,.300,.310),contact);
  }
  float glint=pow(max(0.0,sin(p.x*36.0+1.0/(depth+.03)*3.0-t*.8)),28.0);
  c+=vec3(.04,.055,.06)*glint*uRipple;
 }else c=aboveWater(p,t);
 if(withForeground)c=over(c,foreground(p,t));
 return c;
}
