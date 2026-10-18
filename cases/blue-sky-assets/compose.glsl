// The far bank shares the bridge's world frame so each pier stays grounded.
float shoreGroundHeight(float x){
 // Keep the plinths rooted in one continuous slope, without repeating a mound
 // below every pier. Broad, low-amplitude undulation supplies the shoreline.
 return BRIDGE_FOOT+.001-.003*noise(vec2(x*4.2,27.0))-.001*noise(vec2(x*31.0,8.0));
}
vec4 lakeshore(vec2 p,float t){
 if(p.y>BRIDGE_FOOT+.030)return vec4(0);
 float x=p.x+cameraAt(t),top=shoreGroundHeight(x);
 vec2 pixel=floor(vec2(x,p.y)*768.0);
 float brush=noise(pixel*vec2(.095,.31));
 // A cool bank face, a muted grassy surface and intermittent sunlit flecks.
 float shade=smoothstep(.35,.68,noise(vec2(x*7.5,18.0))+.12*brush);
 vec3 face=mix(vec3(.075,.285,.270),vec3(.205,.385,.292),shade);
 vec3 turf=mix(vec3(.185,.365,.285),vec3(.370,.515,.315),step(.49,brush)*(.42+.58*shade));
 float upper=smoothstep(top-.009,top-.003,p.y);
 vec3 color=mix(face,turf,upper);
 float light=step(.61,noise(vec2(pixel.x*.057,pixel.y*.24)))*mask(top-p.y-.0025);
 color=mix(color,vec3(.465,.570,.355),light*upper*uSun*.70);
 // Wet contact is a narrow, broken dark edge, not a second bright green stripe.
 float wet=1.0-smoothstep(HORIZON+.001,HORIZON+.0045,p.y);
 color=mix(color,vec3(.075,.235,.245),wet*.72);
 vec4 bank=vec4(color,mask(p.y-top));
 // Reuse the generated understory PNG, at a distant scale and only in patches.
 // At most two samples; no new hand-drawn or synthesized leaf silhouettes.
 const float spacing=.098;
 float cell=floor(x/spacing);
 for(int i=0;i<2;i++){
  float id=cell+float(i)-.5,r=hash(vec2(id,251.0));
  float center=(id+.35+.30*hash(vec2(id,79.0)))*spacing;
  float patch=noise(vec2(center*6.0,15.0));
  if(r>.42&&patch>.39){
   float height=.023+.007*r;
   vec4 plant=foliageSprite(vec2(x,p.y),center,shoreGroundHeight(center)-.020,height,2.0,foliageBend(t,id,.012));
   plant.rgb=mix(plant.rgb,vec3(.180,.370,.315),.37);
   plant.rgb=mix(plant.rgb,vec3(.335,.515,.465),.10);
   foliageOver(bank,plant);
  }
 }
 return bank;
}
vec3 aboveWater(vec2 p,float t){
 vec3 c=cloudBank(p,sky(p),t);
 c=mountains(p,c,t);
 c=over(c,lakeshore(p,t));
 c=over(c,train(p,t));c=over(c,steam(p,t));c=over(c,bridge(p,t));
 return c;
}
