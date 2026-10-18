float peak(float x,float center,float width){return max(0.0,1.0-abs(x-center)/width);}
float mountainPeak(float x,float center,float width){
  float d=abs(mod(x-center+2.4,4.8)-2.4);
  return max(0.0,1.0-d/width);
}
vec3 mountains(vec2 p,vec3 c,float t){
  for(int i=0;i<3;i++){
    float layer=float(i),parallax=.035+layer*.045;
    float x=p.x+cameraAt(t)*parallax;
    float left=mountainPeak(x,.44+layer*.04,.62+layer*.05);
    float right=smoothstep(0.0,1.0,mountainPeak(x,2.95,1.45-layer*.04));
    float ridge=.375-layer*.018+left*(.070+layer*.045)+right*(.20+layer*.075);
    if(i==0)ridge+=.055*mountainPeak(x,1.35,.36)+.040*mountainPeak(x,.95,.18);
    ridge+=(noise(vec2(x*15.0+layer*11.0,2.0))-.5)*(.018+layer*.007);
    ridge+=(noise(vec2(x*43.0,layer+4.0))-.5)*.007;
    vec3 color=mix(vec3(.40,.72,.91),vec3(.12,.43,.62),layer*.44);
    color=mix(color,vec3(.13,.40,.39),right*layer*.30);
    // Broad slope facets and small vegetation flecks remain in world coordinates.
    float slope=fbm(vec2(x*12.0+p.y*9.0,p.y*19.0-layer*3.0));
    color+=vec3(.025,.050,.045)*step(.55,slope);
    color-=vec3(.018,.035,.025)*step(.69,fbm(vec2(x*24.0-p.y*12.0,p.y*25.0)));
    if(i==2){
      float trees=step(.63,fbm(vec2(x*110.0,p.y*100.0)));
      color=mix(color,vec3(.23,.46,.32),trees*.20*right);
    }
    color=mix(color,vec3(.45,.72,.87),.20*(1.0-smoothstep(.28,.53,p.y)));
    c=mix(c,color,mask(p.y-ridge));
  }
  return c;
}
vec3 aboveWater(vec2 p,float t){
  vec3 c=cloudBank(p,sky(p),t);
  c=mountains(p,c,t);
  float x=p.x+cameraAt(t)*.6;
  float shrubs=HORIZON+.027+.012*noise(vec2(x*55.0,9.0));
  vec3 foliage=mix(vec3(.14,.37,.29),vec3(.32,.52,.28),step(.52,fbm(vec2(x*90.0,p.y*150.0))));
  c=mix(c,foliage,mask(p.y-shrubs));
  float bank=HORIZON+.011+.003*noise(vec2(x*64.0,6.0));
  c=mix(c,vec3(.47,.64,.29),mask(p.y-bank));
  c=over(c,train(p,t));c=over(c,steam(p,t));c=over(c,bridge(p,t));
  return c;
}
vec4 foreground(vec2 p,float t){
  if(p.y>.64)return vec4(0);
  float left=1.0-smoothstep(.0,.68,p.x),right=smoothstep(ASPECT-.60,ASPECT,p.x);
  float edge=max(left,right);
  float x=p.x+cameraAt(t)*1.5+sin(t*.8+p.x*3.0)*p.y*p.y*.025;
  float h=-.035+left*.55+right*.49+.035*noise(vec2(x*8.0,8.0));
  h+=.12*peak(p.x,.85,.45)*(1.0-edge);
  float d=p.y-h-(noise(vec2(x*95.0,p.y*78.0))-.5)*.060;
  vec3 c=mix(vec3(.018,.17,.23),vec3(.08,.31,.27),step(.52,fbm(vec2(x*45.0,p.y*43.0))));
  c=mix(c,vec3(.28,.46,.24),step(.70,noise(vec2(x*100.0,p.y*85.0)))*smoothstep(h-.08,h+.02,p.y));
  return vec4(c,mask(d));
}
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
    float glint=pow(max(0.0,sin(p.x*36.0+1.0/(depth+.03)*3.0-t*.8)),28.0);
    c+=vec3(.04,.055,.06)*glint*uRipple;
  }else c=aboveWater(p,t);
  if(withForeground)c=over(c,foreground(p,t));
  return c;
}
