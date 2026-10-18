vec4 bridge(vec2 p,float t) {
  if(p.y<HORIZON||p.y>DECK+.018) return vec4(0);
  float x=p.x+cameraAt(t), pitch=.205;
  float q=mod(x,pitch)-pitch*.5;
  vec4 color=vec4(0);
  float spring=HORIZON+.022;
  bool opening=abs(q)<.080&&(p.y<spring||length(vec2(q,(p.y-spring)*.86))<.080);
  if(p.y<DECK-.014&&!opening) {
    vec3 c=mix(vec3(.17,.36,.45),vec3(.30,.53,.61),smoothstep(HORIZON,DECK,p.y));
    c+=vec3(.035)*step(.6,noise(vec2(floor(x*130.0),floor(p.y*130.0))));
    color=vec4(c,1);
  }
  paint(color,box(p,vec2(p.x,DECK-.007),vec2(3.0,.007)),vec3(.20,.42,.51));
  float post=box(vec2(mod(x,.025),p.y),vec2(.0125,DECK+.009),vec2(.0009,.009));
  float bar=abs(p.y-DECK-.016)-.0008;
  paint(color,min(post,bar),vec3(.14,.35,.45));
  return color;
}
