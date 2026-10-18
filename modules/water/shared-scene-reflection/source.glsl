vec2 reflectionPoint(vec2 p,float t){
 float depth=max(HORIZON-p.y,0.0),perspective=1.0/(depth+.035);
 float wave=sin(p.x*65.0+perspective*3.0+t*1.5)*.6+sin(p.x*113.0-perspective*2.3+t*1.1)*.4;
 float displacement=wave*(.0005+depth*.010)*uRipple;
 return vec2(p.x+displacement,2.0*HORIZON-p.y+displacement*.18);
}
vec3 fullScene(vec2 p,float t,bool withForeground){
 float edge=shoreWaterline(p.x+cameraAt(t));
 vec3 c;
 if(p.y<edge){
  vec2 reflected=reflectionPoint(p,t);
  c=landscapeWithoutBank(reflected,t);
  float depth=max(HORIZON-p.y,0.0),shoreDepth=edge-p.y;
  c=mix(c,vec3(.13,.49,.65),.09+depth*.20);
  // Short, broken reflections follow the local water edge. The main scene
  // still uses HORIZON, preserving straight arches and the train's alignment.
  if(shoreDepth<.065){
   float reflectedEdge=shoreWaterline(reflected.x+cameraAt(t));
   vec4 bank=lakeshore(vec2(reflected.x,reflectedEdge+shoreDepth*1.70),t);
   float ripple=noise(vec2(floor(p.x*420.0)*.035,floor(shoreDepth*768.0)*.68-t*.22));
   bank.rgb=mix(bank.rgb,vec3(.105,.365,.415),.40);
   bank.a*=(1.0-smoothstep(.006,.058,shoreDepth))*(.52+.30*step(.46,ripple));
   c=over(c,bank);
   float contact=(1.0-smoothstep(.0005,.0028,shoreDepth))*(.40+.30*step(.48,ripple));
   c=mix(c,vec3(.090,.300,.310),contact);
  }
  float glint=pow(max(0.0,sin(p.x*36.0+1.0/(depth+.03)*3.0-t*.8)),28.0);
  c+=vec3(.04,.055,.06)*glint*uRipple;
 }else c=aboveWater(p,t);
 if(withForeground)c=over(c,foreground(p,t));
 return c;
}
