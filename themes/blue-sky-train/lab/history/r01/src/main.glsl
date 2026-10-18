void main() {
  vec2 p=vec2(gl_FragCoord.x/uRes.x*ASPECT,gl_FragCoord.y/uRes.y);
  vec3 color;
  if(uMode==0) {
    float drift=sin(uTime*uWind*.06)*.18;
    color=over(sky(p),cloud(p,vec2(1.31-drift,.36),1.30,uTime*.07));
  } else if(uMode==1) {
    vec3 bg=mix(vec3(.86,.92,.92),vec3(.66,.82,.88),p.y);
    vec2 q=vec2((.40-p.x)/2.65,(p.y-.29)/2.65);
    color=over(bg,locomotive(q,uTime));
    float rail=abs(p.y-.28)-.006;
    color=mix(color,vec3(.2,.35,.4),mask(rail));
    // Enlarged carriage follows its own local pivot; show steam in that same space.
    vec2 world=vec2(headAt(uTime)-cameraAt(uTime)-q.x,DECK+q.y);
    color=over(color,steam(world,uTime));
  } else {
    color=fullScene(p,uTime,uMode==3);
  }
  // Explicit art-space palette for this study; production linear-light blending is a gate.
  gl_FragColor=vec4(clamp(color,0.0,1.0),1.0);
}
