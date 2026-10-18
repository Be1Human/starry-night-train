import {moduleSource, syncModuleMirrors} from './module-sources.mjs';
syncModuleMirrors();
import {readFileSync,writeFileSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..'),lab=resolve(root,'themes/blue-sky-train/lab');
const source=moduleSource;
const starry=readFileSync(resolve(root,'themes/starry-night-train/index.html'),'utf8');
function originalFunction(signature){
 const start=starry.indexOf(signature);if(start<0)throw Error('Missing original steam function: '+signature);
 const brace=starry.indexOf('{',start);let depth=1,end=brace+1;
 while(depth&&end<starry.length){if(starry[end]==='{')depth++;if(starry[end]==='}')depth--;end++;}
 if(depth)throw Error('Unclosed original steam function');
 return starry.slice(start,end);
}
const originalSteam=['float noise(vec2 x)','float fbmB(vec2 x)','vec4 steam(vec2 p)'].map(originalFunction).join('\n');
const steam=source('scene-steam.glsl').replace('/* ORIGINAL_STARRY_STEAM */',originalSteam);
const assetPaths=[['tower','uCloudTower','assets/blue-sky-train/clouds/r04/cloud-tower.png'],['bank','uCloudBank','assets/blue-sky-train/clouds/r04/cloud-bank.png'],['grass','uGrass','assets/blue-sky-train/foliage/r09/grass.png'],['leaves','uLeaves','assets/blue-sky-train/foliage/r09/leaves.png'],['understory','uUnderstory','assets/blue-sky-train/foliage/r09/understory.png']];
const assets=assetPaths.map(([id,sampler,path])=>({id,sampler,data:'data:image/png;base64,'+readFileSync(resolve(root,path)).toString('base64')}));
const main=`void main(){vec2 p=vec2(gl_FragCoord.x/uRes.x*ASPECT,gl_FragCoord.y/uRes.y);vec3 c;
if(uMode==4||uMode==5){c=sky(p);c=over(c,completeCloud(p,vec4(ASPECT*.5,.025,1.425,.95),float(uMode-4)));}
else if(uMode==0)c=cloudBank(p,sky(p),uTime);
else if(uMode==6)c=over(mix(vec3(.10,.25,.32),vec3(.31,.49,.55),p.y),foreground(p,uTime));
else if(uMode>=7&&uMode<=9)c=over(vec3(.17,.30,.38),foliageSprite(p,ASPECT*.5,.05,.9,float(uMode-7),0.0));
else if(uMode==10){vec2 q=vec2((p.x-ASPECT*.5)/3.4+chimneyAt(uTime).x+.14,(p.y-.34)/3.4+chimneyAt(uTime).y);c=over(vec3(.23,.48,.67),train(q,uTime));c=over(c,steam(q,uTime));}
else if(uMode==12)c=sky(p);
else if(uMode==13)c=mountains(p,sky(p),uTime);
else if(uMode==14){vec2 q=(p-vec2(ASPECT*.5,.5))/3.0+vec2(ASPECT*.5,DECK-.04);c=over(vec3(.29,.46,.56),bridge(q,uTime));}
else if(uMode==15)c=fullScene(p,uTime,false);
else c=fullScene(p,uTime,true);
if(uDebug==7)c=vec3(train(p,uTime).a);
if(uDebug==8)c=vec3(bridge(p,uTime).a);
if(uDebug==9)c=vec3(passingBranch(p,uTime).a);
if(uDebug==10)c=vec3(grassLayer(p,uTime,1.0).a);
if(uDebug==11)c=vec3(steam(p,uTime).a);
gl_FragColor=vec4(c,1.0);}`;
// Reuse locomotive detail without changing the archived R03/R04 scene modules.
const locomotive='#define train studyTrain\n#define steam studySteam\n#define travel trainLocalTravel\n'+source('train.glsl')+'\n#undef train\n#undef steam\n#undef travel\n';
const fragment=[source('scene-common.glsl'),source('asset-cloud.glsl'),locomotive,source('scene-train.glsl'),steam,source('scene-bridge.glsl'),source('scene-foreground.glsl'),source('scene-world.glsl'),main].join('\n');
const png=path=>'data:image/png;base64,'+readFileSync(resolve(root,path)).toString('base64');
const values={CONFIG:JSON.stringify({revision:'r10-original-steam',assets,steam:{scale:.60,noiseSeed:2463534242,noiseSize:256,source:'themes/starry-night-train/index.html'}}),FRAGMENT:JSON.stringify(fragment),RUNTIME:source('asset-stream.js')+'\n'+source('asset-runtime.js'),STREAM_CODE:source('asset-stream.js').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;'),REFERENCE:png('assets/blue-sky-train/source/blue-sky-train.png'),BEFORE:png('themes/blue-sky-train/lab/evidence/r09-generated-foreground/scene.png')};
writeFileSync(resolve(lab,'cloud-library.html'),source('cloud-library.html.template').replace(/%%([A-Z_]+)%%/g,(_,k)=>values[k]??''));
console.log('Built complete-cloud asset library and standalone streaming demo.');
