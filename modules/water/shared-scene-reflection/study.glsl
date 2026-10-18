vec2 reflectionPoint(vec2 p,float t) {
  float depth=max(HORIZON-p.y,0.0);
  float perspective=1.0/(depth+.035);
  float wave=sin(p.x*65.0+perspective*3.0+t*1.5)*.6;
  wave+=sin(p.x*113.0-perspective*2.3+t*1.1)*.4;
  float displacement=wave*(.0008+depth*.020)*uRipple;
  // Reflect the same world and time. No upside-down snapshot of yesterday's train.
  return vec2(p.x+displacement,2.0*HORIZON-p.y+displacement*.18);
}
vec3 fullScene(vec2 p,float t,bool withForeground) {
  vec3 c;
  if(p.y<HORIZON) {
    c=aboveWater(reflectionPoint(p,t),t);
    float depth=HORIZON-p.y;
    c=mix(c,vec3(.08,.44,.64),.14+depth*.25);
    float glint=pow(max(0.0,sin(p.x*36.0+1.0/(depth+.03)*3.0-t*.8)),24.0);
    c+=vec3(.055,.075,.08)*glint*uRipple;
  } else c=aboveWater(p,t);
  if(withForeground) c=over(c,foreground(p,t));
  if(uDebug==3&&abs(p.y-HORIZON)<.0015) c=vec3(1.0,.42,.22);
  return c;
}
