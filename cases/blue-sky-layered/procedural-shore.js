// A small GPU surface shared by the painted bank and the lake's land mask.
// The coastline is a field in world space, never a wrapped silhouette texture.
export const SHORE = Object.freeze({top:528,width:2048,height:88,originSpan:4096,depthScale:.35});
const SHORE_VERTEX = `#version 300 es
void main(){
  vec2 p=vec2(float((gl_VertexID<<1)&2),float(gl_VertexID&2));
  gl_Position=vec4(p*2.0-1.0,0.0,1.0);
}`;
const SHORE_FRAGMENT = `#version 300 es
precision highp float;
precision highp int;
uniform int u_origin;
uniform float u_offset;
uniform uint u_seed;
uniform sampler2D u_paint;
uniform sampler2D u_contact;
out vec4 colour;

uint hash(ivec2 p,uint salt){
  uint h=uint(p.x)*0x8da6b343u ^ uint(p.y)*0xd8163841u ^ u_seed*0xcb1ab31fu ^ salt;
  h^=h>>16;h*=0x7feb352du;h^=h>>15;h*=0x846ca68bu;h^=h>>16;
  return h;
}
float random(ivec2 p,uint salt){return float(hash(p,salt)>>8)*(1.0/16777216.0);}
float field(vec2 p,float scale,uint salt){
  vec2 q=p/scale,cell=floor(q),f=fract(q);
  // Every octave divides 4096 exactly. Rebasing changes only the integer hash
  // index, so fine paint survives long trips and negative-coordinate crossings.
  ivec2 i=ivec2(cell);i.x+=u_origin*int(4096.0/scale);
  vec2 s=f*f*f*(f*(f*6.0-15.0)+10.0);
  return mix(mix(random(i,salt),random(i+ivec2(1,0),salt),s.x),
             mix(random(i+ivec2(0,1),salt),random(i+ivec2(1,1),salt),s.x),s.y);
}
float ridge(float x,float scale,uint salt){return field(vec2(x,0.0),scale,salt);}
float coast(float x){
  float warp=180.0*(ridge(x,1024.0,31u)-0.5)+70.0*(ridge(x,256.0,32u)-0.5);
  float reach=smoothstep(0.12,0.88,ridge(x+warp,512.0,11u));
  float width=7.0+11.0*ridge(x,2048.0,7u);
  return 564.0+width*reach+4.2*ridge(x+warp,128.0,12u)
    +2.7*(ridge(x,32.0,13u)-0.5)+1.4*(ridge(x,8.0,14u)-0.5)
    +0.7*(ridge(x,2.0,15u)-0.5);
}
vec3 brushSample(ivec2 cell,vec2 delta){
  vec2 origin=vec2(random(cell,81u),0.5+0.14*(random(cell,82u)-0.5));
  return texture(u_paint,origin+delta*vec2(0.08,0.36)).rgb;
}
vec3 paint(vec2 p){
  vec2 q=vec2(p.x/64.0,(p.y-528.0)/4.0),f=fract(q),s=f*f*(3.0-2.0*f);
  ivec2 i=ivec2(floor(q));i.x+=u_origin*64;
  return mix(mix(brushSample(i,f),brushSample(i+ivec2(1,0),f-vec2(1,0)),s.x),
             mix(brushSample(i+ivec2(0,1),f-vec2(0,1)),brushSample(i+ivec2(1,1),f-vec2(1,1)),s.x),s.y);
}
void main(){
  vec2 p=vec2(gl_FragCoord.x+u_offset,528.0+88.0-gl_FragCoord.y);
  vec2 uv=vec2(gl_FragCoord.x/2048.0,(p.y-528.0)/88.0);
  vec4 hill=texture(u_contact,uv);
  // Recess the grassy projections toward the lake's minimum water line while
  // retaining the existing world-space bays and keeping their shared mask.
  float edge=mix(562.5,coast(p.x),${SHORE.depthScale.toFixed(2)});
  float roots=545.0-2.0*ridge(p.x,128.0,20u)-3.7*ridge(p.x,16.0,21u)
    -1.7*ridge(p.x,4.0,22u)-0.7*ridge(p.x,2.0,23u);
  float coastAlpha=1.0-smoothstep(edge-0.55,edge+0.55,p.y);
  float bankAlpha=smoothstep(roots-0.6,roots+0.6,p.y)*coastAlpha;
  float hillAlpha=hill.a*coastAlpha;
  float alpha=max(bankAlpha,hillAlpha);
  if(alpha<=0.0){colour=vec4(0.0);return;}

  // Horizontal, broken brush masses use a different field from the silhouette.
  // Palette steps and small irregular strokes retain the source's painted look.
  float drift=12.0*(field(vec2(p.x,p.y*3.0),64.0,41u)-0.5);
  vec2 brush=vec2(p.x+drift,(p.y-528.0)*5.0);
  float masses=0.58*field(brush,64.0,51u)+0.29*field(brush,16.0,52u)+0.13*field(brush,4.0,53u);
  vec3 grass=vec3(0.49,0.67,0.22);
  grass=mix(grass,vec3(0.64,0.77,0.30),smoothstep(0.39,0.43,masses));
  grass=mix(grass,vec3(0.75,0.83,0.40),smoothstep(0.57,0.61,masses));
  float shade=field(vec2(p.x+28.0,(p.y-528.0)*7.0),32.0,60u);
  grass=mix(grass,vec3(0.29,0.52,0.24),0.52*(1.0-smoothstep(0.22,0.37,shade)));
  float strokes=field(vec2(p.x,(p.y-528.0)*9.0),8.0,65u);
  grass=mix(grass,vec3(0.72,0.81,0.37),0.24*smoothstep(0.68,0.75,strokes));
  // Only a 16-pixel-deep, fully opaque paint sample supplies brush detail.
  // Hashed overlapping sample windows do not carry any source shoreline shape.
  grass=mix(grass,paint(p),0.66);

  // Bush roots at the back, a sunlit grass lip, and an intermittent wet face.
  // They follow this same SDF rather than three independent horizontal strips.
  float rootShade=1.0-smoothstep(roots+0.5,roots+6.0+4.0*shade,p.y);
  grass=mix(grass,vec3(0.16,0.39,0.30),rootShade*(0.67+0.23*shade));
  float d=edge-p.y,lip=(1.0-smoothstep(3.0,7.0,d))*smoothstep(0.8,2.7,d);
  grass=mix(grass,vec3(0.72,0.80,0.35),lip*(0.24+0.16*masses));
  float wet=1.0-smoothstep(0.8,2.1+1.6*shade,d);
  grass=mix(grass,vec3(0.15,0.39,0.31),wet*(0.62+0.22*shade));

  // The contact texture contains the actual, uniformly placed local hills.
  // Extend their cool root colours into the grass, with a broken contact shade
  // that follows each foot rather than a horizontal shadow under the whole bank.
  float contact=0.28*texture(u_contact,vec2(uv.x,12.5/88.0)).a
    +0.22*texture(u_contact,vec2(uv.x-7.0/2048.0,14.5/88.0)).a
    +0.22*texture(u_contact,vec2(uv.x+7.0/2048.0,14.5/88.0)).a
    +0.14*texture(u_contact,vec2(uv.x-18.0/2048.0,12.5/88.0)).a
    +0.14*texture(u_contact,vec2(uv.x+18.0/2048.0,12.5/88.0)).a;
  contact=smoothstep(0.08,0.86,contact);
  vec3 rootColour=vec3(0.19,0.41,0.27);
  float rootReach=1.0-smoothstep(549.0,edge+1.0,p.y);
  grass=mix(grass,rootColour,contact*rootReach*(0.20+0.10*shade));

  // Height blending changes only colour within this narrow foot band. Neither
  // UV coordinates nor mountain silhouettes are displaced; opaque hills remain
  // solid while irregular grass masses climb into their lowest painted leaves.
  float joinNoise=14.0*(masses-0.5)+7.0*(strokes-0.5);
  float grassHeight=smoothstep(531.0,559.0,p.y+joinNoise);
  grassHeight=smoothstep(0.10,0.90,grassHeight);
  vec3 surface=mix(hill.rgb,grass,grassHeight);
  colour=vec4(mix(grass,surface,hill.a),alpha);
}`;

export class ProceduralShore {
  constructor(){
    this.canvas=document.createElement('canvas');this.canvas.width=SHORE.width;this.canvas.height=SHORE.height;
    this.gl=this.canvas.getContext('webgl2',{alpha:true,premultipliedAlpha:false,antialias:false,depth:false,stencil:false,preserveDrawingBuffer:true});
    if(!this.gl)throw Error('程序化岸线需要 WebGL 2，请启用浏览器硬件加速。');
    this.contactCanvas=document.createElement('canvas');this.contactCanvas.width=SHORE.width;this.contactCanvas.height=SHORE.height;this.contactCtx=this.contactCanvas.getContext('2d');
    this.hillRootsCanvas=document.createElement('canvas');this.hillRootsCanvas.width=SHORE.width;this.hillRootsCanvas.height=SHORE.height;this.hillRootsCtx=this.hillRootsCanvas.getContext('2d');this.contactKey=null;this.contactCount=0;
    this.frames=0;this.renderMs=0;this.gpuMs=null;this.lost=false;this.key=null;
    this.canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();this.lost=true;this.key=null;});
    this.canvas.addEventListener('webglcontextrestored',()=>{this.lost=false;this.setup();this.key=null;});
    this.setup();
  }
  setup(){
    const gl=this.gl,compile=(type,source)=>{const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s;};
    const vertex=compile(gl.VERTEX_SHADER,SHORE_VERTEX),fragment=compile(gl.FRAGMENT_SHADER,SHORE_FRAGMENT),program=gl.createProgram();
    gl.attachShader(program,vertex);gl.attachShader(program,fragment);gl.linkProgram(program);
    if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));
    gl.deleteShader(vertex);gl.deleteShader(fragment);this.program=program;gl.useProgram(program);
    this.uniforms=Object.fromEntries(['u_origin','u_offset','u_seed','u_paint','u_contact'].map(name=>[name,gl.getUniformLocation(program,name)]));
    this.texture=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,this.texture);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.REPEAT);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
    if(this.detail)this.setDetail(this.detail);
    this.contactTexture=gl.createTexture();gl.activeTexture(gl.TEXTURE1);gl.bindTexture(gl.TEXTURE_2D,this.contactTexture);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,this.contactCanvas);
    this.timer=gl.getExtension('EXT_disjoint_timer_query_webgl2');this.pending=null;
    const debug=gl.getExtension('WEBGL_debug_renderer_info');this.renderer=gl.getParameter(debug?debug.UNMASKED_RENDERER_WEBGL:gl.RENDERER);
  }
  setDetail(image){this.detail=image;const gl=this.gl;gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,this.texture);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,image);this.key=null;}
  setContacts(image,instances,key){
    if(key===this.contactKey)return;
    const ctx=this.contactCtx;ctx.clearRect(0,0,SHORE.width,SHORE.height);
    for(const hill of instances){ctx.save();ctx.translate(hill.x,hill.y-SHORE.top);ctx.scale(hill.scale,hill.scale);ctx.drawImage(image,0,0);ctx.restore();}
    if(!this.lost){const gl=this.gl;gl.activeTexture(gl.TEXTURE1);gl.bindTexture(gl.TEXTURE_2D,this.contactTexture);gl.texSubImage2D(gl.TEXTURE_2D,0,0,0,gl.RGBA,gl.UNSIGNED_BYTE,this.contactCanvas);}
    this.contactKey=key;this.contactCount=instances.length;this.key=null;
  }
  render(state){
    if(this.lost)return this.canvas;
    const gl=this.gl,key=state.camera+':'+state.seed;
    if(key===this.key)return this.canvas;
    const start=performance.now(),origin=Math.floor(state.camera/SHORE.originSpan);
    if(this.pending&&gl.getQueryParameter(this.pending,gl.QUERY_RESULT_AVAILABLE)){
      if(!gl.getParameter(this.timer.GPU_DISJOINT_EXT))this.gpuMs=gl.getQueryParameter(this.pending,gl.QUERY_RESULT)/1e6;
      gl.deleteQuery(this.pending);this.pending=null;
    }
    gl.useProgram(this.program);gl.viewport(0,0,SHORE.width,SHORE.height);
    gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,this.texture);gl.uniform1i(this.uniforms.u_paint,0);
    gl.activeTexture(gl.TEXTURE1);gl.bindTexture(gl.TEXTURE_2D,this.contactTexture);gl.uniform1i(this.uniforms.u_contact,1);
    gl.uniform1i(this.uniforms.u_origin,origin|0);gl.uniform1f(this.uniforms.u_offset,state.camera-origin*SHORE.originSpan);gl.uniform1ui(this.uniforms.u_seed,state.seed>>>0);
    let query;if(this.timer&&!this.pending){query=gl.createQuery();gl.beginQuery(this.timer.TIME_ELAPSED_EXT,query);}
    gl.drawArrays(gl.TRIANGLES,0,3);
    if(query){gl.endQuery(this.timer.TIME_ELAPSED_EXT);this.pending=query;}
    // The reflected hill receives the very same blended foot colours. This
    // separate alpha retains only the hill, so it cannot mirror the whole bank
    // around the hill's independently chosen reflection anchor.
    const roots=this.hillRootsCtx;roots.clearRect(0,0,SHORE.width,SHORE.height);
    if(this.contactCount){roots.drawImage(this.contactCanvas,0,0);roots.globalCompositeOperation='source-atop';roots.drawImage(this.canvas,0,0);roots.globalCompositeOperation='source-over';}
    this.key=key;this.frames++;this.renderMs=performance.now()-start;return this.canvas;
  }
  get stats(){return{method:'world-space-shore-sdf',backend:'WebGL2',resolution:[SHORE.width,SHORE.height],frames:this.frames,renderMs:this.renderMs,gpuMs:this.gpuMs,renderer:this.renderer,textureCount:2,detailBytes:this.detail?this.detail.width*this.detail.height*4:0,colorBufferBytes:SHORE.width*SHORE.height*4,contactBufferBytes:SHORE.width*SHORE.height*4*3,contactHills:this.contactCount,contactBlend:'height-and-painted-roots',originSpan:SHORE.originSpan,sharedWaterMask:true};}
}
