// Generated extraction; edit the original implementation and rebuild.
// Source: themes/starry-night-train/index.html
// 原星河云算法移植自 mdb shader，上游未附再分发许可。沿用原声明：仅供学习与欣赏，请勿商用。各模块仍需阅读原主题来源说明。
// This is an exact source excerpt, not a standalone shader.
// Dependencies: 完整场景与原 main 的相机变换; JS advance(dt,aspect)、M、CLOUD_DIST 保留在完整宿主; source.glsl仅为原GLSL主函数，不能单独代表JS运动系统
// Original main is preserved with camera, reflection and postprocessing together.

void main(){
  // 镜头：以屏幕中心为原点缩放，再按镜头高度整体上下平移（与原版 zoom/offset 同义）
  gC=.5*uRes/uRes.y;
  gPx=uRes.y*uZoom; gPxS=uRes.y*sqrt(uZoom);
  vec2 p=(gl_FragCoord.xy/uRes.y-gC)/uZoom+gC+vec2(0.,uCamY);
  float H=uHorizon;
  float depth=H-p.y;
  vec2 q=p;
  float wy=1./(max(depth,0.)+.015);
  if(depth>0.){
    float n=noise(vec2(p.x*8.,wy*2.5-uT*.9))-.5;
    float n2=noise(vec2(p.x*23.,wy*6.-uT*1.7))-.5;
    float off=(n+.5*n2)*uRipple*(.002+.03*depth);
    q=vec2(p.x+off,H+depth+off*.25);
  }
  vec3 col=scene(q);
  if(depth>0.){
    col=mix(col*uRefl,cSkyTop*.55,.12+.35*smoothstep(0.,.4,depth));
    float ln=smoothstep(.66,.74,noise(vec2(p.x*2.5+uT*.02,wy*5.-uT*.5)));
    col+=cCloudTop*ln*.07*uRipple;
    col+=cSkyHor*.25*exp(-depth*gPx*.6);
  }
  col*=uExposure;
  float l=dot(col,vec3(.299,.587,.114));
  col=max(mix(vec3(l),col,uSat),0.);
  vec2 uv=gl_FragCoord.xy/uRes;
  col*=mix(1.,.4+.6*pow(max(16.*uv.x*uv.y*(1.-uv.x)*(1.-uv.y),0.),.25),uVignette);
  if(uPoster>1.5){ float d=hash(gl_FragCoord.xy)-.5; col=floor(col*uPoster+.5+d*.7)/uPoster; }
  gl_FragColor=vec4(clamp(col,0.,1.),1.);
}
