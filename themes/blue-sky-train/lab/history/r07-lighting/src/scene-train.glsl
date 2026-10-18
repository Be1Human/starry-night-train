// The cloud study's locomotive is retained; only its distant screen proportions change.
vec4 train(vec2 p,float t){
  vec2 q=vec2(headAt(t)-(p.x+cameraAt(t)),p.y-DECK)/TRAIN_SCALE;
  vec4 c=locomotive(q,t);
  c.rgb=mix(c.rgb,vec3(.28,.54,.68),.10);
  return c;
}
vec4 steam(vec2 p,float t){
  const float life=6.5;
  vec4 result=vec4(.94,.98,.99,0);
  for(int i=0;i<14;i++){
    float age=mod(t+float(i)*life/14.0,life),birth=t-age;
    vec2 born=vec2(headAt(birth)+.025*TRAIN_SCALE.x,DECK+.081*TRAIN_SCALE.y);
    vec2 center=born+vec2((.007+uWind*.006)*age,.009*age);
    center.x-=cameraAt(t);
    float radius=.0035+.0038*age;
    vec2 q=(p-center)/vec2(1.65,1.0);
    float d=length(q)-radius+(noise(q*270.0+float(i))-.5)*radius*.30;
    float a=mask(d)*(1.0-smoothstep(life*.35,life,age))*.55;
    result.a+=a*(1.0-result.a);
  }
  return result;
}
