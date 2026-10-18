import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const source='assets/blue-sky-train/vector/blue-sky-train.svg';
const target='assets/blue-sky-train/vector/cloud-patterns.json';
const svg=readFileSync(resolve(root,source),'utf8');
const paths=[];
for(const match of svg.matchAll(/<path\b[^>]*\/>/g)){
  const tag=match[0],d=tag.match(/\bd="([^"]+)"/)?.[1],color=tag.match(/\bfill="#([\da-f]{6})"/i)?.[1];
  if(!d||!color)throw new Error('Unsupported source path');
  if(/[a-kno-y]/i.test(d))throw new Error('Expected polygon paths from VTracer');
  const translate=tag.match(/translate\(([-\d.]+),\s*([-\d.]+)\)/);
  const tx=Number(translate?.[1]||0),ty=Number(translate?.[2]||0);
  const coordinates=d.match(/-?\d+(?:\.\d+)?/g).map(Number);
  const ys=coordinates.filter((_,i)=>i%2===1).map(y=>y+ty);
  if(Math.min(...ys)>480||Math.max(...ys)<0)continue;
  const [r,g,b]=[0,2,4].map(i=>parseInt(color.slice(i,i+2),16));
  const cloud=r>=90&&g>=145&&b-r<138&&g/b>.72;
  const light=.2126*r+.7152*g+.0722*b;
  const layer=cloud?(light>=240?0:light>=222?1:light>=201?2:3):-1;
  paths.push([d,tx,ty,layer]);
}
const data={revision:'r03',width:2048,height:480,referenceHeight:768,source,
  sourceSha256:createHash('sha256').update(svg).digest('hex'),
  provenance:'Existing reference-derived SVG contours; four flat masks, not newly inferred geometry.',
  palette:[[253,250,241],[209,234,249],[167,212,243],[136,193,235]],
  cloudThreshold:'R>=90 && G>=145 && B-R<138 && G/B>.72',luminanceBands:[240,222,201],
  roi:[[0,324],[120,410],[240,405],[350,365],[500,420],[650,461],[850,468],[1050,462],[1230,453],[1430,438],[1600,399],[1760,335],[1920,295],[2047,245]],paths};
writeFileSync(resolve(root,target),JSON.stringify(data));
console.log(`Prepared ${paths.length} ordered vector paths as four nested flat-color masks.`);
