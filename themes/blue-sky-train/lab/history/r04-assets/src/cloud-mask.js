// Authoring data -> four nested masks. Geometry is explicitly traced from the
// reference SVG, then rasterized once. The PNG is not a runtime input.
function prepareCloudMasks(gl,data) {
  const canvas=document.createElement('canvas');canvas.width=data.width;canvas.height=data.height;
  const ctx=canvas.getContext('2d',{willReadFrequently:true});
  ctx.fillStyle='#000';ctx.fillRect(0,0,canvas.width,canvas.height);
  const labels=['rgb(255,32,0)','rgb(255,96,0)','rgb(255,160,0)','rgb(255,224,0)'];
  // Preserve source painter order, including non-cloud paths that occlude it.
  for(const [d,x,y,layer] of data.paths){ctx.setTransform(1,0,0,1,x,y);ctx.fillStyle=layer<0?'#000':labels[layer];ctx.fill(new Path2D(d));}
  ctx.resetTransform();
  const rgba=ctx.getImageData(0,0,data.width,data.height).data;
  const masks=new Uint8Array(rgba.length),ridge=data.roi;
  const ramp=(v,a,b)=>Math.max(0,Math.min(1,(v-a)/(b-a)));
  for(let x=0;x<data.width;x++){
    const end=ridge.findIndex(p=>p[0]>=x),b=ridge[Math.max(1,end)],a=ridge[Math.max(0,end-1)];
    const bottom=a[1]+(b[1]-a[1])*(x-a[0])/(b[0]-a[0]);
    for(let y=0;y<Math.min(bottom,data.height);y++){
      const k=(y*data.width+x)*4,coverage=rgba[k],label=coverage?rgba[k+1]*255/coverage:0;
      masks[k]=coverage;
      masks[k+1]=Math.round(coverage*ramp(label,48,80));
      masks[k+2]=Math.round(coverage*ramp(label,112,144));
      masks[k+3]=Math.round(coverage*ramp(label,176,208));
    }
  }
  const texture=gl.createTexture();gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,texture);
  gl.pixelStorei(gl.UNPACK_ALIGNMENT,1);gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL,false);
  gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,data.width,data.height,0,gl.RGBA,gl.UNSIGNED_BYTE,masks);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
  return {texture,width:data.width,height:data.height,bytes:masks.byteLength,paths:data.paths.length};
}
