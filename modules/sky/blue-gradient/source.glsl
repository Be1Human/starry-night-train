vec3 sky(vec2 p){
  vec3 c=mix(vec3(.49,.80,.98),vec3(.025,.41,.94),smoothstep(.30,1.0,p.y));
  return c+vec3(.012,.022,.014)*exp(-dot(p-vec2(.8,.95),p-vec2(.8,.95))*2.0);
}
