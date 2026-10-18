// The cloud study's locomotive is retained; only its distant screen proportions change.
vec4 train(vec2 p,float t){
  vec2 q=vec2(headAt(t)-(p.x+cameraAt(t)),p.y-DECK)/TRAIN_SCALE;
  vec4 c=locomotive(q,t);
  c.rgb=mix(c.rgb,vec3(.28,.54,.68),.10);
  return c;
}
