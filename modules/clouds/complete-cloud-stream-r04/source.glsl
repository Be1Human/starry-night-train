// Complete independently painted RGBA sprites, never crops of the scene.
// Slots 0..5 are the far bank, slots 6..11 the near bank. All are whole clouds.
uniform sampler2D uCloudTower, uCloudBank;
uniform vec4 uCloudLayout[12]; // center x, lower edge, width, height
uniform float uCloudKinds[12];
vec4 completeCloud(vec2 p,vec4 layout,float kind) {
  vec2 uv=vec2((p.x-layout.x)/layout.z+.5,1.0-(p.y-layout.y)/layout.w);
  if(uv.x<0.0||uv.x>1.0||uv.y<0.0||uv.y>1.0)return vec4(0);
  return kind<.5?texture2D(uCloudTower,uv):texture2D(uCloudBank,uv);
}
vec3 cloudBank(vec2 p,vec3 color,float t) {
  for(int i=0;i<12;i++){
    vec4 cloud=completeCloud(p,uCloudLayout[i],uCloudKinds[i]);
    // A small shared atmospheric tint distinguishes depth without changing
    // the light direction; no mirroring, rotating or rectangular edge crops.
    if(i<6)cloud.rgb=mix(cloud.rgb,vec3(.58,.81,.98),.36);
    color=over(color,cloud);
  }
  return color;
}
