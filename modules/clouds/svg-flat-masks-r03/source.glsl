// R03: four flat graphic layers, authored from the existing reference SVG.
// RGBA stores coverage for white -> pale -> blue -> deep, never surface normals.
uniform sampler2D uCloudMasks;
vec4 cloudMasks(vec2 p) {
  vec2 uv=vec2(p.x/ASPECT,(1.0-p.y)*768.0/480.0);
  if(uv.x<0.0||uv.x>1.0||uv.y<0.0||uv.y>1.0)return vec4(0);
  vec4 layers=texture2D(uCloudMasks,uv);
  layers.g=min(layers.g,layers.r);
  layers.b=min(layers.b,layers.g);
  layers.a=min(layers.a,layers.b);
  return layers;
}
vec4 colorCloudPattern(vec4 layers) {
  if(layers.r<.001)return vec4(0);
  vec3 white=vec3(253,250,241)/255.0;
  vec3 pale=vec3(209,234,249)/255.0;
  vec3 blue=vec3(167,212,243)/255.0;
  vec3 deep=vec3(136,193,235)/255.0;
  // Difference-of-masks assigns one constant fill to each region. Only the
  // one-texel edge is interpolated; there is no lighting gradient.
  vec3 weights=layers.gba;
  if(uDebug==4)weights=vec3(0);
  if(uDebug==5)weights.yz=vec2(0);
  if(uDebug==6)weights.z=0.0;
  vec3 premult=white*(layers.r-weights.x)+pale*(weights.x-weights.y)
              +blue*(weights.y-weights.z)+deep*weights.z;
  vec3 color=premult/layers.r;
  if(uDebug==1)color=vec3(1);
  if(uDebug==2)color=vec3(.12)+.80*layers.gba/layers.r;
  return vec4(color,layers.r);
}
vec2 cloudMotion(vec2 p,float t) {
  float drift=t*uWind*.0025+cameraAt(t)*.035;
  // Shared material coordinates keep the blue inside the white outline.
  // At t=0 the masks are aligned to the reference's original pixels.
  p.x+=drift;
  vec2 flow=vec2(noise(p*5.0+8.2),noise(p*5.0+29.0))-.5;
  return p+flow*sin(t*.07)*.007*uDetail;
}
vec3 cloudBank(vec2 p,vec3 color,float t) {
  return over(color,colorCloudPattern(cloudMasks(cloudMotion(p,t))));
}
