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
    // Sunlit air separates the distant slopes from the dark bridge. Keep
    // the shapes and facets, adding more blue air toward the valley floor.
    float valleyAir=1.0-smoothstep(.31,.54,p.y);
    color=mix(color,vec3(.375,.765,.965),uSun*valleyAir*(.52-layer*.025));
    c=mix(c,color,mask(p.y-ridge));
  }
  return c;
}
