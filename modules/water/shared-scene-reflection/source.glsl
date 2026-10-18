vec2 reflectionPoint(vec2 p,float t){
  float depth=max(HORIZON-p.y,0.0),perspective=1.0/(depth+.035);
  float wave=sin(p.x*65.0+perspective*3.0+t*1.5)*.6+sin(p.x*113.0-perspective*2.3+t*1.1)*.4;
  float displacement=wave*(.0005+depth*.010)*uRipple;
  return vec2(p.x+displacement,2.0*HORIZON-p.y+displacement*.18);
}
vec3 fullScene(vec2 p,float t,bool withForeground){
  vec3 c;
  if(p.y<HORIZON){
    c=aboveWater(reflectionPoint(p,t),t);float depth=HORIZON-p.y;
    c=mix(c,vec3(.13,.49,.65),.09+depth*.20);
    // Water close to the bank absorbs the bright turf colour. Horizontal,
    // interrupted ripples separate the reflected bank from the real shore.
    float bankReflection=1.0-smoothstep(.006,.034,depth);
    float brokenRipple=smoothstep(.50,.82,noise(vec2(floor(p.x*420.0)*.035,floor(depth*768.0)*.68-t*.22)));
    c=mix(c,vec3(.160,.450,.510),bankReflection*(.26+.20*brokenRipple));
    float glint=pow(max(0.0,sin(p.x*36.0+1.0/(depth+.03)*3.0-t*.8)),28.0);
    c+=vec3(.04,.055,.06)*glint*uRipple;
  }else c=aboveWater(p,t);
  if(withForeground)c=over(c,foreground(p,t));
  return c;
}
