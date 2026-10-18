vec4 steam(vec2 p,float t) {
  vec4 result=vec4(0);
  const float life=4.8;
  for(int i=0;i<10;i++) {
    float age=mod(t+float(i)*life/10.0,life);
    float birth=t-age;
    // Emit in world space at birth. Old puffs must not stick to the current chimney.
    vec2 born=vec2(headAt(birth)+.025,DECK+.081);
    vec2 center=born+vec2((.022+uWind*.012)*age,.032*age);
    center.x-=cameraAt(t);
    float radius=.009+.011*age;
    vec2 q=(p-center)/vec2(1.6,1.0);
    float d=length(q)-radius+(noise(q*180.0+float(i))-.5)*radius*.25;
    float a=mask(d)*(1.0-smoothstep(life*.45,life,age))*.72;
    result.rgb=mix(result.rgb,vec3(.95,.98,.98),a);
    result.a=result.a+(1.0-result.a)*a;
  }
  // Return straight-alpha color to match over().
  result.rgb=vec3(.95,.98,.98);
  return result;
}
