// Minimum cumulus: a macro silhouette, an advected contour and three light bands.
// The seed stays fixed. Time transports the field; it never rerolls the noise.
float smin(float a, float b, float k) {
  float h=clamp(.5+.5*(b-a)/k,0.0,1.0);
  return mix(b,a,h)-k*h*(1.0-h);
}
float ellipse(vec2 p, vec2 c, vec2 r) { return (length((p-c)/r)-1.0)*min(r.x,r.y); }
float cloudShape(vec2 q) {
  float d=ellipse(q,vec2(0.0,-.055),vec2(.42,.11));
  d=smin(d,ellipse(q,vec2(-.25,.01),vec2(.16,.14)),.035);
  d=smin(d,ellipse(q,vec2(-.11,.13),vec2(.15,.21)),.045);
  d=smin(d,ellipse(q,vec2(.10,.18),vec2(.19,.24)),.045);
  d=smin(d,ellipse(q,vec2(.29,.07),vec2(.17,.18)),.04);
  return d;
}
float cloudField(vec2 q) {
  // Fine contour noise does not enter the lighting gradient.
  return cloudShape(q)+(fbm(q*32.0)-.5)*.024*uDetail;
}
float cap(vec2 p,vec2 center,vec2 radius) {
  vec2 q=(p-center)/radius;
  return sqrt(max(0.0,1.0-dot(q,q)))*min(radius.x,radius.y);
}
float cloudHeight(vec2 q) {
  float h=cap(q,vec2(0.0,-.055),vec2(.42,.11));
  h=-smin(-h,-cap(q,vec2(-.25,.01),vec2(.16,.14)),.025);
  h=-smin(-h,-cap(q,vec2(-.11,.13),vec2(.15,.21)),.025);
  h=-smin(-h,-cap(q,vec2(.10,.18),vec2(.19,.24)),.025);
  h=-smin(-h,-cap(q,vec2(.29,.07),vec2(.17,.18)),.025);
  // Low-amplitude meso relief gives cloud lobes, instead of noisy contour normals.
  return h+(noise(q*18.0)-.5)*.013*uDetail;
}
vec4 cloud(vec2 p, vec2 center, float scale, float phase) {
  vec2 q=(p-center)/scale;
  if(abs(q.x)>.60||q.y<-.22||q.y>.48) return vec4(0);
  q+=vec2(sin(q.y*5.0+phase)*.012,cos(q.x*4.0+phase*.7)*.009);
  float d=cloudField(q), a=mask(d*scale);
  if(a<.001) return vec4(0);
  float e=.007, h=cloudHeight(q);
  vec2 grad=vec2(cloudHeight(q+vec2(e,0))-h,cloudHeight(q+vec2(0,e))-h)/e;
  vec3 n=normalize(vec3(-grad,1.0));
  float sun=dot(n,normalize(vec3(-.55,.8,.7)));
  float light=.20+.61*sun+.12*smoothstep(-.08,.3,q.y);
  vec3 c=mix(vec3(.43,.68,.90),vec3(.70,.85,.97),smoothstep(.36,.39,light));
  c=mix(c,vec3(.965,.98,.95),smoothstep(.66,.69,light));
  float rim=(1.0-smoothstep(.0,.024,-d))*smoothstep(.30,.75,n.y-n.x*.4);
  c=mix(c,vec3(1.0,.99,.94),rim*.7);
  if(uDebug==1) c=vec3(1);
  if(uDebug==2) c=n*.5+.5;
  return vec4(c,a);
}
vec3 cloudBank(vec2 p, vec3 color, float t) {
  // Left and right towers keep the central train corridor open.
  float shift=cameraAt(t)*.045+t*uWind*.008;
  for(int i=0;i<6;i++) {
    float id=float(i);
    float x=mod(id*.66-shift+1.0,4.0)-.7;
    float y=.41+.09*hash(vec2(id,5.0));
    float s=.45+.22*hash(vec2(id,2.0));
    vec4 c=cloud(p,vec2(x,y),s,t*.035+id);
    c.rgb=mix(c.rgb,vec3(.67,.83,.97),.18);
    color=over(color,c);
  }
  color=over(color,cloud(p,vec2(.34-shift*.35,.50),.95,t*.04));
  color=over(color,cloud(p,vec2(2.22-shift*.35,.57),1.10,t*.04+2.0));
  return color;
}
