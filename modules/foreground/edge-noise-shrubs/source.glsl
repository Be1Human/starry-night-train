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
