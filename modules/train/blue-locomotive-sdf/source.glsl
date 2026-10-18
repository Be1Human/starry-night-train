// Train-local +x points toward its nose. Body, wheels and rods share this pivot.
const float WHEEL_RADIUS=.009;
void wheel(inout vec4 c, vec2 q, vec2 center, float phase) {
  vec2 d=q-center;
  paint(c,length(d)-WHEEL_RADIUS,vec3(.04,.12,.20));
  float spoke=abs(sin(atan(d.y,d.x)-phase)*length(d));
  if(length(d)<WHEEL_RADIUS*.8) paint(c,spoke-.0011,vec3(.33,.48,.56));
  paint(c,length(d)-.0019,vec3(.53,.65,.65));
}
vec4 locomotive(vec2 q, float t) {
  if(q.x<-.77||q.x>.03||q.y<-.002||q.y>.085) return vec4(0);
  vec4 c=vec4(0);
  vec3 body=vec3(.055,.19,.29), edge=vec3(.13,.32,.42), dark=vec3(.03,.10,.17);
  paint(c,box(q,vec2(-.086,.015),vec2(.086,.004)),dark);
  paint(c,box(q,vec2(-.065,.039),vec2(.050,.014))-.003,body);
  paint(c,box(q,vec2(-.127,.041),vec2(.023,.030)),body);
  paint(c,box(q,vec2(-.127,.073),vec2(.028,.003)),dark);
  paint(c,box(q,vec2(-.126,.051),vec2(.012,.010)),vec3(.95,.85,.48));
  paint(c,box(q,vec2(-.025,.064),vec2(.006,.015)),body);
  paint(c,box(q,vec2(-.025,.080),vec2(.010,.003)),dark);
  paint(c,box(q,vec2(-.012,.039),vec2(.006,.019)),edge);
  paint(c,box(q,vec2(-.067,.054),vec2(.045,.0013)),edge);
  paint(c,box(q,vec2(-.195,.037),vec2(.034,.021)),body);
  paint(c,box(q,vec2(-.195,.061),vec2(.034,.004)),dark);
  paint(c,box(q,vec2(-.171,.014),vec2(.021,.002)),edge);
  float phase=-travel(t)/WHEEL_RADIUS;
  for(int i=0;i<4;i++) wheel(c,q,vec2(-.108+float(i)*.026,.009),phase);
  wheel(c,q,vec2(-.215,.009),phase); wheel(c,q,vec2(-.175,.009),phase);
  vec2 crank=vec2(cos(phase),sin(phase))*.005;
  paint(c,capsule(q,vec2(-.108,.009)+crank,vec2(-.030,.009)+crank,.0015),vec3(.60,.69,.68));
  // Two identical coaches. Index arithmetic keeps the code independent of train length.
  for(int i=0;i<2;i++) {
    float cx=-.36-float(i)*.245;
    paint(c,box(q,vec2(cx,.036),vec2(.112,.023))-.004,body);
    paint(c,box(q,vec2(cx,.062),vec2(.115,.004)),dark);
    paint(c,box(q,vec2(cx,.022),vec2(.110,.0015)),edge);
    paint(c,box(q,vec2(cx+.126,.018),vec2(.013,.002)),dark);
    for(int j=0;j<7;j++) {
      float x=cx-.084+float(j)*.028;
      paint(c,box(q,vec2(x,.043),vec2(.007,.005)),vec3(.96,.85,.50));
    }
    wheel(c,q,vec2(cx-.080,.009),phase); wheel(c,q,vec2(cx+.080,.009),phase);
  }
  return c;
}
vec4 train(vec2 p,float t) {
  return locomotive(vec2(headAt(t)-(p.x+cameraAt(t)),p.y-DECK),t);
}
