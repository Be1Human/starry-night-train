// Blue-grey masonry, with a sunlit front, a cool side plane and a deep soffit.
// All marks are evaluated in world space so they move with the bridge.
vec3 bridgeStone(vec2 p,float x,float bay){
  vec2 texel=floor(vec2(x,p.y)*768.0)/768.0;
  float patch=noise(texel*vec2(132.0,161.0)+bay*.61);
  vec3 color=vec3(.100,.350,.530);
  color+=vec3(.020,.037,.041)*step(.64,patch);
  color-=vec3(.014,.031,.037)*step(patch,.32);
  // Broken, low-contrast stone courses rather than a high-contrast brick grid.
  float row=floor((p.y-BRIDGE_FOOT)*118.0),course=fract((p.y-BRIDGE_FOOT)*118.0);
  float joint=(1.0-smoothstep(.03,.10,course))*step(.61,hash(vec2(row,bay)));
  color-=joint*vec3(.011,.021,.023);
  float speck=hash(floor(vec2(x,p.y)*768.0));
  color+=vec3(.012,.017,.019)*(step(.89,speck)-step(speck,.11));
  return color;
}
vec4 bridge(vec2 p,float t){
  if(p.y<BRIDGE_FOOT-.002||p.y>DECK+.015)return vec4(0);
  const float pitch=.112;
  float x=p.x+cameraAt(t),bay=floor((x+pitch*.5)/pitch);
  float pier=mod(x+pitch*.5,pitch)-pitch*.5;
  float opening=mod(x,pitch)-pitch*.5;
  float shaftHalf=mix(.0096,.0085,smoothstep(BRIDGE_FOOT+.010,DECK-.026,p.y));
  float openingHalf=pitch*.5-shaftHalf;
  // A flat span with a rounded haunch where it joins each pier.
  float radius=.015,corner=max(abs(opening)-(openingHalf-radius),0.0);
  float roof=DECK-.014-radius+sqrt(max(radius*radius-corner*corner,0.0));
  float hole=mask(max(abs(opening)-openingHalf,p.y-roof));
  float body=mask(max(BRIDGE_FOOT-p.y,p.y-(DECK-.005)))*(1.0-hole);
  vec3 stone=bridgeStone(p,x,bay);
  // Three restrained planes, with the darkest face on the right of each pier.
  if(abs(pier)<shaftHalf+.001){
    float side=smoothstep(.0015,.0037,pier);
    stone=mix(stone,vec3(.047,.248,.416),side*.92);
    float bevel=1.0-smoothstep(.0011,.0025,abs(pier+shaftHalf-.0011));
    stone=mix(stone,vec3(.200,.459,.600),bevel*.66);
    float capShade=smoothstep(DECK-.041,DECK-.021,p.y);
    stone=mix(stone,vec3(.047,.250,.408),capShade*.38);
  }else{
    // Dark inner arch edges give the beam visible depth at its underside.
    float soffit=1.0-smoothstep(.001,.0045,p.y-roof);
    stone=mix(stone,vec3(.035,.203,.359),soffit*.70);
  }
  vec4 c=vec4(stone,body);
  // A slightly flared plinth, mostly hidden in the distant grass.
  float plinthHalf=.013-.0025*smoothstep(BRIDGE_FOOT,BRIDGE_FOOT+.006,p.y);
  paint(c,max(abs(pier)-plinthHalf,abs(p.y-(BRIDGE_FOOT+.002))-.004),vec3(.105,.330,.435));
  // Projecting pier caps: lower shadow block, stepped upper slab, broken lit lip.
  paint(c,box(vec2(pier,p.y),vec2(0,DECK-.013),vec2(.0115,.004)),vec3(.055,.263,.427));
  paint(c,box(vec2(pier,p.y),vec2(-.001,DECK-.007),vec2(.014,.003)),vec3(.103,.355,.514));
  paint(c,box(vec2(pier,p.y),vec2(-.001,DECK-.0045),vec2(.0145,.0009)),vec3(.176,.431,.584));
  // Continuous fascia consists of a narrow top lip, a dark face and lower ledge.
  float fascia=mask(abs(p.y-(DECK-.003))-.003);
  vec3 beam=vec3(.047,.257,.431);
  beam+=vec3(.012,.022,.026)*step(.6,noise(vec2(floor(x*250.0),12.0)));
  c=vec4(mix(c.rgb,beam,fascia),max(c.a,fascia));
  paint(c,abs(p.y-DECK+.0069)-.00065,vec3(.038,.225,.378));
  paint(c,abs(p.y-DECK-.0004)-.00055,vec3(.236,.481,.625));
  // Thin double rails and taller posts over the stone caps.
  float railX=mod(x,.0373333)-.0186667;
  float posts=box(vec2(railX,p.y),vec2(0,DECK+.0056),vec2(.00065,.0054));
  float rails=min(abs(p.y-DECK-.0058)-.00038,abs(p.y-DECK-.0100)-.00042);
  paint(c,min(posts,rails),vec3(.226,.456,.592));
  paint(c,box(vec2(pier,p.y),vec2(0,DECK+.0065),vec2(.0011,.0074)),vec3(.109,.339,.498));
  float damp=(1.0-smoothstep(BRIDGE_FOOT,BRIDGE_FOOT+.008,p.y));
  float moss=step(.43,noise(vec2(x*310.0,p.y*205.0)))*damp;
  c.rgb=mix(c.rgb,vec3(.200,.372,.242),moss*.68);
  return c;
}
