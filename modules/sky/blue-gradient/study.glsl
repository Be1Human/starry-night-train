vec3 sky(vec2 p) {
  vec3 color=mix(vec3(.58,.83,.98),vec3(.035,.38,.91),smoothstep(.24,1.05,p.y));
  return color+vec3(.025,.025,.012)*exp(-dot(p-vec2(.75,.96),p-vec2(.75,.96))*2.0);
}
