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
vec3 aboveWater(vec2 p,float t) {
  vec3 c=cloudBank(p,sky(p),t);
  c=mountains(p,c,t);
  float bank=HORIZON+.010+.005*noise(vec2((p.x+cameraAt(t)*.16)*38.0,9.0));
  c=mix(c,vec3(.38,.61,.23),mask(p.y-bank));
  c=over(c,train(p,t));
  c=over(c,steam(p,t));
  c=over(c,bridge(p,t));
  return c;
}
vec4 foreground(vec2 p,float t) {
  if(p.y>.48) return vec4(0);
  float edge=max(1.0-smoothstep(.0,.62,p.x),smoothstep(ASPECT-.62,ASPECT,p.x));
  float x=p.x+cameraAt(t)*1.15+sin(t*1.2+p.x*3.0)*p.y*p.y*.04;
  float h=.025+edge*.36+noise(vec2(x*9.0,8.0))*.045;
  float d=p.y-h-(noise(vec2(x*70.0,p.y*50.0))-.5)*.045;
  vec3 c=mix(vec3(.015,.19,.22),vec3(.12,.37,.24),step(.56,fbm(vec2(x*36.0,p.y*30.0))));
  c=mix(c,vec3(.36,.57,.22),step(.73,noise(vec2(x*66.0,p.y*56.0)))*smoothstep(h-.08,h+.02,p.y));
  return vec4(c,mask(d));
}
vec2 reflectionPoint(vec2 p,float t) {
  float depth=max(HORIZON-p.y,0.0);
  float perspective=1.0/(depth+.035);
  float wave=sin(p.x*65.0+perspective*3.0+t*1.5)*.6;
  wave+=sin(p.x*113.0-perspective*2.3+t*1.1)*.4;
  float displacement=wave*(.0008+depth*.020)*uRipple;
  // Reflect the same world and time. No upside-down snapshot of yesterday's train.
  return vec2(p.x+displacement,2.0*HORIZON-p.y+displacement*.18);
}
vec3 fullScene(vec2 p,float t,bool withForeground) {
  vec3 c;
  if(p.y<HORIZON) {
    c=aboveWater(reflectionPoint(p,t),t);
    float depth=HORIZON-p.y;
    c=mix(c,vec3(.08,.44,.64),.14+depth*.25);
    float glint=pow(max(0.0,sin(p.x*36.0+1.0/(depth+.03)*3.0-t*.8)),24.0);
    c+=vec3(.055,.075,.08)*glint*uRipple;
  } else c=aboveWater(p,t);
  if(withForeground) c=over(c,foreground(p,t));
  if(uDebug==3&&abs(p.y-HORIZON)<.0015) c=vec3(1.0,.42,.22);
  return c;
}
