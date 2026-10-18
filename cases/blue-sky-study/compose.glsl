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
