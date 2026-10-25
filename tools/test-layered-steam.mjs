import {mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {browserHarness,root,until} from './browser-harness.mjs';
const out=resolve(root,process.env.LAYERED_VERIFICATION_DIR||'docs/verification/layered-stream-r10');mkdirSync(out,{recursive:true});
const source=readFileSync(resolve(root,'modules/train/original-starry-steam/source.glsl'),'utf8');
const referenceFragment="precision highp float;\nuniform sampler2D uNoise;\nuniform vec2 uPhase;\n#define uOct 6\n#define uSteam .82\n#define uTrainX .02\n#define DECK (-.051)\n#define uSmokeOff uPhase.x\n#define uT uPhase.y\n#define cCloudShade vec3(.43,.64,.80)\n#define cCloudTop vec3(.77,.87,.94)\n#define cCloudLit vec3(.98,.98,.92)\n"+source+"\nvoid main(){vec2 p=vec2(-(gl_FragCoord.x-8.),gl_FragCoord.y-20.)/600.;gl_FragColor=steam(p);}";
const b=await browserHarness(),report={date:new Date().toISOString(),source:'modules/train/original-starry-steam/source.glsl',sourceSha256:createHash('sha256').update(source).digest('hex')};
const save=(name,data)=>writeFileSync(resolve(out,name),Buffer.from(data.split(',')[1],'base64'));
try{
  await b.viewport(1600,1000);await b.go(`${b.base}/themes/blue-sky-train/lab/layered-stream/index.html?paused=1`);await until(()=>b.evaluate('Boolean(window.LayeredWallpaper?.state.ready)'),'layered wallpaper');
  // Render the unchanged GLSL excerpt using the same noise, palette and host
  // mapping, then compare it to the Canvas port. This catches an attractive but
  // unrelated substitute as well as coordinate/noise mistakes.
  report.reference=await b.evaluate(`(() => {
    const smoke=LayeredWallpaper.scene.smoke,canvas=document.createElement('canvas');canvas.width=432;canvas.height=128;
    const gl=canvas.getContext('webgl',{alpha:true,antialias:false,premultipliedAlpha:false,preserveDrawingBuffer:true});if(!gl)throw Error('WebGL required to verify the source shader');
    const compile=(type,source)=>{const shader=gl.createShader(type);gl.shaderSource(shader,source);gl.compileShader(shader);if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(shader));return shader;};
    const fragment=${JSON.stringify(referenceFragment)};
    const program=gl.createProgram();gl.attachShader(program,compile(gl.VERTEX_SHADER,'attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}'));gl.attachShader(program,compile(gl.FRAGMENT_SHADER,fragment));gl.bindAttribLocation(program,0,'a');gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));gl.useProgram(program);
    const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),gl.STATIC_DRAW);gl.enableVertexAttribArray(0);gl.vertexAttribPointer(0,2,gl.FLOAT,false,0,0);
    const texture=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,texture);gl.texImage2D(gl.TEXTURE_2D,0,gl.LUMINANCE,256,256,0,gl.LUMINANCE,gl.UNSIGNED_BYTE,smoke.noiseData);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.REPEAT);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.REPEAT);gl.uniform1i(gl.getUniformLocation(program,'uNoise'),0);gl.viewport(0,0,432,128);
    const samples=[],gpu=new Uint8Array(432*128*4),phase=gl.getUniformLocation(program,'uPhase');
    for(const time of [0,2,8,16,313.726,426.667]){
      smoke.render(time);const cpu=smoke.image.data;gl.uniform2f(phase,(time*.034)%(256/24),time%(256/.6));gl.drawArrays(gl.TRIANGLES,0,3);gl.readPixels(0,0,432,128,gl.RGBA,gl.UNSIGNED_BYTE,gpu);
      let union=0,intersection=0,sum=0;
      for(let y=0;y<128;y++)for(let x=0;x<432;x++){const p=(y*432+x)*4,q=((127-y)*432+x)*4,a=cpu[p+3]>0,b=gpu[q+3]>0;if(a||b)union++;if(a&&b){intersection++;for(let ch=0;ch<4;ch++)sum+=Math.abs(cpu[p+ch]-gpu[q+ch]);}}
      samples.push({time,coverageIoU:intersection/union,meanSharedChannelError:sum/(intersection*4),pixels:union});
    }
    const glError=gl.getError();gl.getExtension('WEBGL_lose_context')?.loseContext();return{samples,glError};
  })()`);
  assert.equal(report.reference.glError,0);
  for(const sample of report.reference.samples){assert(sample.coverageIoU>.98,'plume matches source silhouette');assert(sample.meanSharedChannelError<.6,'plume matches source colour bands');}
  for(const time of [0,2,8,16]){
    await b.evaluate(`LayeredWallpaper.renderAt(0,${time});LayeredWallpaper.select('steam');LayeredWallpaper.view('single')`);
    save('steam-layer-t'+time+'.png',await b.evaluate('LayeredWallpaper.exportPNG()'));
    save('steam-detail-t'+time+'.png',await b.evaluate('LayeredWallpaper.scene.smoke.canvas.toDataURL()'));
  }
  report.integration=await b.evaluate(`(() => {
    const api=LayeredWallpaper;api.reset();api.renderAt(0,8);api.setSettings({ripple:false,wind:false});
    const ctx=document.getElementById('scene').getContext('2d'),read=()=>ctx.getImageData(0,0,2048,768).data;
    const a=read();document.querySelector('.layer[data-id="steam"] input').click();const b=read();let above=0,below=0;for(let y=0;y<768;y++)for(let x=0;x<2048;x++){const p=(y*2048+x)*4;if(a[p]!==b[p]||a[p+1]!==b[p+1]||a[p+2]!==b[p+2]){if(y<562)above++;else below++;}}
    api.setVisibility('steam',true);api.select('steam');api.view('single');api.direction(-1);const left=read();api.direction(1);const right=read();let error=0,channels=0;
    // The two chimney origins sum to 2709 + 2*the shared train sway. Compare at
    // time zero for an exact integer mirror, then restore the animated frame.
    api.renderAt(0,0);api.direction(-1);const l=read();api.direction(1);const r=read();for(let y=330;y<455;y++)for(let x=1000;x<1709;x++)for(let ch=0;ch<4;ch++){error+=Math.abs(l[(y*2048+x)*4+ch]-r[(y*2048+2708-x)*4+ch]);channels++;}
    api.direction(-1);api.renderAt(0,8);api.setVisibility('engine',false);const hidden=read();let residual=0;for(let p=3;p<hidden.length;p+=4)if(hidden[p])residual++;
    api.reset();api.renderAt(0,8);const once=api.scene.smoke.frames;api.scene.render(api.state);const twice=api.scene.smoke.frames;
    const first=api.scene.smoke.canvas.toDataURL();api.renderAt(0,9);const changed=api.scene.smoke.canvas.toDataURL()!==first;api.renderAt(0,8);const deterministic=api.scene.smoke.canvas.toDataURL()===first;
    return{above,below,mirrorMeanError:error/channels,hiddenEngineResidual:residual,oneRasterPerClock:once===twice,animated:changed,deterministic,stats:api.stats};
  })()`);
  assert(report.integration.above>1000);assert(report.integration.below>500);assert(report.integration.mirrorMeanError<.1);assert.equal(report.integration.hiddenEngineResidual,0);assert(report.integration.oneRasterPerClock&&report.integration.animated&&report.integration.deterministic);
  // The periodic noise offsets must not pop when either phase wraps.
  report.phaseBoundaries=await b.evaluate(`(() => {const smoke=LayeredWallpaper.scene.smoke,result=[];for(const time of [(256/24)/.034,256/.6]){smoke.render(time-.0001);const a=new Uint8Array(smoke.image.data);smoke.render(time+.0001);const b=smoke.image.data;let sum=0;for(let i=0;i<a.length;i++)sum+=Math.abs(a[i]-b[i]);result.push({time,meanChannelError:sum/a.length});}return result;})()`);
  for(const boundary of report.phaseBoundaries)assert(boundary.meanChannelError<.05);
  await b.evaluate("LayeredWallpaper.reset();LayeredWallpaper.renderAt(0,8)");save('steam-scene.png',await b.evaluate('LayeredWallpaper.exportPNG()'));
  report.consoleErrors=b.errors;assert.deepEqual(b.errors,[]);report.passed=true;
  report.portSha256=createHash('sha256').update(readFileSync(resolve(root,'cases/blue-sky-layered/starry-steam.js'))).digest('hex');
  writeFileSync(resolve(out,'steam-report.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
}catch(error){report.passed=false;report.error=error.stack;writeFileSync(resolve(out,'steam-report.json'),JSON.stringify(report,null,2)+'\n');throw error;}finally{await b.close();}
