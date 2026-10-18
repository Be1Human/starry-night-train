vec3 mountains(vec2 p,vec3 c,float t) {
  for(int i=0;i<3;i++) {
    float layer=float(i), depth=.07+layer*.08;
    float x=p.x+cameraAt(t)*depth;
    float ridge=.305+.13*noise(vec2(x*2.8+layer*6.0,layer))+.06*noise(vec2(x*8.0+layer,3.0));
    ridge+=.17*smoothstep(1.65,2.6,p.x)*(layer/2.0);
    ridge-=layer*.022;
    vec3 far=vec3(.31,.67,.86), near=vec3(.10,.47,.42);
    vec3 color=mix(far,near,layer*.42);
    color+=vec3(.04,.07,.01)*step(.64,fbm(vec2(x*38.0,p.y*40.0)));
    c=mix(c,color,mask(p.y-ridge));
  }
  return c;
}
