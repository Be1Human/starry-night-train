// The bank and bridge travel in the same world frame. Upper ground and lower
// water edge are separate: broad peninsulas alternate with narrow, recessed bays.
vec2 shoreProfile(float x){
 float headland=smoothstep(.23,.79,noise(vec2(x*1.65,32.0)));
 float shelf=noise(vec2(x*5.3,17.0));
 float crest=BRIDGE_FOOT-.001+.014*headland+.004*shelf;
 crest+=(noise(vec2(x*43.0,9.0))-.5)*.0025;
 float width=.012+.036*headland+.006*noise(vec2(x*3.6,45.0));
 float edge=crest-width;
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
   float spread=.050+.065*hash(vec2(id,148.0));
   for(int j=-1;j<=1;j++){
    float part=float(j),seed=hash(vec2(id*7.0+part,191.0));
    if(j==0||seed>.32){
     float cx=center+part*spread+(seed-.5)*.025;
     float h=(.047+.045*r)*mix(1.0,.66,abs(part));
     h*=.82+.32*seed;
     vec2 ground=shoreProfile(cx);
     float root=ground.x-h*.29;
     vec4 plant=foliageSprite(p,cx,root,h,2.0,foliageBend(t,id*7.0+part,.014));
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
 float meadow=smoothstep(.30,.72,noise(vec2(x*4.7,21.0)));
 float strokes=noise(vec2(pixel.x*.052,pixel.y*.27+x*2.0));
 float flat=step(.46,strokes);
 vec3 grass=mix(vec3(.235,.405,.265),vec3(.470,.615,.320),meadow);
 grass+=vec3(.060,.065,.012)*flat*uSun;
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
