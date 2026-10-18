vec3 aboveWater(vec2 p,float t){
  vec3 c=cloudBank(p,sky(p),t);
  c=mountains(p,c,t);
  float x=p.x+cameraAt(t)*.6;
  float shrubs=HORIZON+.027+.012*noise(vec2(x*55.0,9.0));
  vec3 foliage=mix(vec3(.14,.37,.29),vec3(.32,.52,.28),step(.52,fbm(vec2(x*90.0,p.y*150.0))));
  float crown=1.0-smoothstep(.003,.020,shrubs-p.y);
  float grassPatch=step(.44,noise(vec2(floor(x*768.0)*.12,p.y*260.0)));
  vec3 litGrass=mix(vec3(.42,.60,.22),vec3(.62,.73,.26),grassPatch);
  foliage=mix(foliage,litGrass,uSun*(.32+.62*crown));
  c=mix(c,foliage,mask(p.y-shrubs));
  float bank=HORIZON+.011+.003*noise(vec2(x*64.0,6.0));
  vec3 bankColor=mix(vec3(.47,.64,.29),vec3(.64,.73,.31),uSun*(.55+.20*grassPatch));
  c=mix(c,bankColor,mask(p.y-bank));
  c=over(c,train(p,t));c=over(c,steam(p,t));c=over(c,bridge(p,t));
  return c;
}
