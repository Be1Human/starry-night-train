// GPU implementation of the starry theme's noise(), fbmB() and steam(), with
// the original Canvas2D port retained for unavailable or lost WebGL contexts.
// Source: modules/train/original-starry-steam/source.glsl (itself extracted from
// themes/starry-night-train/index.html). Preserve that theme's source notices.
// Only the host coordinates, daylight palette and air phase are adapted here.
export const STARRY_STEAM = Object.freeze({width:432,height:128,originX:8,originY:108,scale:600,density:.82,noiseSeed:2463534242,airSpeed:.034});
const clamp=value=>Math.max(0,Math.min(1,value));
const smoothstep=(low,high,value)=>{const t=clamp((value-low)/(high-low));return t*t*(3-2*t);};
const mix=(a,b,t)=>a+(b-a)*t;
const STEAM_VERTEX=`#version 300 es
void main(){vec2 p=vec2(float((gl_VertexID<<1)&2),float(gl_VertexID&2));gl_Position=vec4(p*2.0-1.0,0.0,1.0);}`;
const STEAM_FRAGMENT=`#version 300 es
precision highp float;
precision highp int;
uniform sampler2D u_noise;
uniform vec2 u_phase;
uniform vec3 u_palette[4];
out vec4 colour;
float noise(vec2 p){
  ivec2 i=ivec2(floor(p));vec2 f=fract(p);f=f*f*(3.0-2.0*f);
  float a=texelFetch(u_noise,i&255,0).r,b=texelFetch(u_noise,(i+ivec2(1,0))&255,0).r;
  float c=texelFetch(u_noise,(i+ivec2(0,1))&255,0).r,d=texelFetch(u_noise,(i+ivec2(1,1))&255,0).r;
  return mix(mix(a,b,f.x),mix(c,d,f.x),f.y);
}
float billow(vec2 p){
  float sum=0.0,weight=0.5,total=0.0;
  for(int i=0;i<6;i++){sum+=weight*abs(2.0*noise(p)-1.0);total+=weight;weight*=0.5;p=p*2.0+vec2(17.0,9.0);}
  return sum/total;
}
void main(){
  vec2 p=vec2(-(gl_FragCoord.x-8.0),gl_FragCoord.y-20.0)/600.0;
  float dx=-p.x,dxp=max(dx,0.0),length=0.3+0.45*0.82;
  colour=vec4(0.0);
  if(dx< -0.006||dx>length)return;
  float cy=0.1*sqrt(dxp)+0.03*dxp,r=0.004+0.075*pow(dxp,0.7),dy=p.y-cy;
  if(abs(dy)>r*1.8+0.01)return;
  float fade=1.0-smoothstep(length*0.25,length,dxp);
  float n=billow(vec2((p.x+u_phase.x)*24.0,p.y*24.0-u_phase.y*0.6));
  if(abs(dy)>r*(0.25+1.5*n)*fade)return;
  int band=int(floor(clamp(dy/(r+0.002)*0.5+0.5,0.0,1.0)*3.0+0.5));
  float alpha=floor((0.35+0.65*fade)*0.82*smoothstep(-0.006,0.0,dx)*255.0+0.5)/255.0;
  colour=vec4(u_palette[band],alpha);
}`;
export class StarrySteam {
  constructor({backend='auto'}={}){
    const {width,height,noiseSeed}=STARRY_STEAM;
    this.canvas=document.createElement('canvas');this.canvas.width=width;this.canvas.height=height;
    this.ctx=this.canvas.getContext('2d');this.cpuCanvas=this.canvas;this._image=this.ctx.createImageData(width,height);
    this.noiseData=new Uint8Array(256*256);let seed=noiseSeed;
    for(let i=0;i<this.noiseData.length;i++){seed^=seed<<13;seed^=seed>>>17;seed^=seed<<5;this.noiseData[i]=seed&255;}
    this.lastTime=null;this.frames=0;this.renderMs=0;
    // The original shader uses four colour bands across the plume.
    const shade=[.43,.64,.80],top=[.77,.87,.94],lit=[.98,.98,.92],white=[1,.95,.98];
    this.palette=Array.from({length:4},(_,band)=>shade.map((v,ch)=>Math.round(mix(mix((v+top[ch])*.5,white[ch],band/3),lit[ch],.2)*255)));
    // Centreline and radius only depend on distance, so calculate once.
    const {originX,originY,scale,density}=STARRY_STEAM,L=.3+.45*density;
    this.columns=Array.from({length:width},(_,x)=>{
      const dx=(x+.5-originX)/scale,dxp=Math.max(dx,0);
      if(dx<-.006||dx>L)return null;
      return {px:-dx,cy:.1*Math.sqrt(dxp)+.03*dxp,r:.004+.075*Math.pow(dxp,.7),fade:1-smoothstep(L*.25,L,dxp),nozzle:smoothstep(-.006,0,dx)};
    });
    this.rows=Float64Array.from({length:height},(_,y)=>(originY-y-.5)/scale);
    this.backend='Canvas2D';this.gpuMs=null;
    if(backend!=='cpu')this.enableGPU();
  }
  enableGPU(){
    const canvas=document.createElement('canvas');canvas.width=STARRY_STEAM.width;canvas.height=STARRY_STEAM.height;
    const gl=canvas.getContext('webgl2',{alpha:true,premultipliedAlpha:false,antialias:false,depth:false,stencil:false,preserveDrawingBuffer:true});
    if(!gl)return;
    this.gl=gl;this.gpuCanvas=canvas;
    try{this.setupGPU();}catch(error){this.fallbackReason=error.message;gl.getExtension('WEBGL_lose_context')?.loseContext();return;}
    this.canvas=canvas;this.backend='WebGL2';
    canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();this.canvas=this.cpuCanvas;this.backend='Canvas2D';this.lastTime=null;});
    canvas.addEventListener('webglcontextrestored',()=>{
      try{this.setupGPU();this.canvas=canvas;this.backend='WebGL2';this.lastTime=null;}
      catch(error){this.fallbackReason=error.message;}
    });
  }
  setupGPU(){
    const gl=this.gl,compile=(type,source)=>{const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s;};
    const vertex=compile(gl.VERTEX_SHADER,STEAM_VERTEX),fragment=compile(gl.FRAGMENT_SHADER,STEAM_FRAGMENT),program=gl.createProgram();
    gl.attachShader(program,vertex);gl.attachShader(program,fragment);gl.linkProgram(program);
    if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));
    gl.deleteShader(vertex);gl.deleteShader(fragment);gl.useProgram(program);this.program=program;
    const texture=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,texture);
    gl.texImage2D(gl.TEXTURE_2D,0,gl.R8,256,256,0,gl.RED,gl.UNSIGNED_BYTE,this.noiseData);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.NEAREST);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.NEAREST);
    gl.uniform1i(gl.getUniformLocation(program,'u_noise'),0);
    gl.uniform3fv(gl.getUniformLocation(program,'u_palette[0]'),Float32Array.from(this.palette.flat(),v=>v/255));
    this.phaseUniform=gl.getUniformLocation(program,'u_phase');this.texture=texture;
    this.timer=gl.getExtension('EXT_disjoint_timer_query_webgl2');this.pending=null;
  }
  // Diagnostic access only: normal rendering never reads pixels back from GPU.
  // Preserve the existing verification API without putting it on the hot path.
  get image(){
    if(this.backend==='WebGL2'){
      const {width,height}=STARRY_STEAM,raw=this.readback??=new Uint8Array(width*height*4);
      this.gl.readPixels(0,0,width,height,this.gl.RGBA,this.gl.UNSIGNED_BYTE,raw);
      for(let y=0;y<height;y++)this._image.data.set(raw.subarray((height-1-y)*width*4,(height-y)*width*4),y*width*4);
    }
    return this._image;
  }
  noise(x,y){
    const ix=Math.floor(x),iy=Math.floor(y),fx=x-ix,fy=y-iy,sx=fx*fx*(3-2*fx),sy=fy*fy*(3-2*fy),data=this.noiseData;
    const x0=ix&255,x1=(ix+1)&255,y0=(iy&255)*256,y1=((iy+1)&255)*256;
    return mix(mix(data[y0+x0],data[y0+x1],sx),mix(data[y1+x0],data[y1+x1],sx),sy)/255;
  }
  billow(x,y){let sum=0,weight=.5,total=0;for(let i=0;i<6;i++){sum+=weight*Math.abs(2*this.noise(x,y)-1);total+=weight;weight*=.5;x=x*2+17;y=y*2+9;}return sum/total;}
  render(time){
    if(this.lastTime===time)return this.canvas;
    const start=performance.now(),{width,height,density,airSpeed}=STARRY_STEAM;
    // These are the exact two texture periods used by the starry shader. The
    // shared wallpaper clock freezes them on pause; no private RAF or timer.
    const phaseX=((time*airSpeed)%(256/24)+256/24)%(256/24),phaseY=((time%(256/.6))+256/.6)%(256/.6);
    if(this.backend==='WebGL2'){
      const gl=this.gl;
      if(this.pending&&gl.getQueryParameter(this.pending,gl.QUERY_RESULT_AVAILABLE)){
        if(!gl.getParameter(this.timer.GPU_DISJOINT_EXT))this.gpuMs=gl.getQueryParameter(this.pending,gl.QUERY_RESULT)/1e6;
        gl.deleteQuery(this.pending);this.pending=null;
      }
      gl.useProgram(this.program);gl.viewport(0,0,width,height);gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,this.texture);
      gl.uniform2f(this.phaseUniform,phaseX,phaseY);
      let query;if(this.timer&&!this.pending){query=gl.createQuery();gl.beginQuery(this.timer.TIME_ELAPSED_EXT,query);}
      gl.drawArrays(gl.TRIANGLES,0,3);
      if(query){gl.endQuery(this.timer.TIME_ELAPSED_EXT);this.pending=query;}
      this.lastTime=time;this.frames++;this.renderMs=performance.now()-start;return this.canvas;
    }
    const pixels=this._image.data;pixels.fill(0);
    for(let x=0;x<width;x++){
      const col=this.columns[x];if(!col)continue;
      const {px,cy,r,fade,nozzle}=col,alpha=Math.round((.35+.65*fade)*density*nozzle*255);
      if(!alpha)continue;
      for(let y=0;y<height;y++){
        const py=this.rows[y],dy=py-cy;
        if(Math.abs(dy)>r*1.8+.01)continue;
        const n=this.billow((px+phaseX)*24,py*24-phaseY*.6);
        if(Math.abs(dy)>r*(.25+1.5*n)*fade)continue;
        const band=Math.floor(clamp(dy/(r+.002)*.5+.5)*3+.5),color=this.palette[band],p=(y*width+x)*4;
        pixels[p]=color[0];pixels[p+1]=color[1];pixels[p+2]=color[2];pixels[p+3]=alpha;
      }
    }
    this.ctx.putImageData(this._image,0,0);this.lastTime=time;this.frames++;this.renderMs=performance.now()-start;
    return this.canvas;
  }
}
