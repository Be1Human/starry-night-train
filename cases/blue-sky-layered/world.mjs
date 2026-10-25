export const WORLD = { width: 2048, height: 768, waterline: 562, reflectionPlane: 548, pixelsPerSecond: 14, defaultDirection: -1 };
export const MIDGROUND = Object.freeze({asset:'midground-forest',depth:.38,base:553,scale:.235,span:1900,offset:350,clusters:true,reflectFromY:500,color:'#4f9fba',tint:.16});
export const RAIL_HILLS = Object.freeze({asset:'rail-hill',depth:1.08,span:2600,offset:640,base:557,minScale:.20,scaleRange:.045});
// Preserve the painted mountain proportions. Different apparent heights come
// from uniform scale and placement, never independent width/height changes.
export const MOUNTAINS = Object.freeze([
  // Receding, interleaved ridge belts. The whole painting keeps its aspect;
  // offsets, scale and haze establish depth rather than isolated equal peaks.
  {asset:'mountain-haze',layer:'mountains-far',depth:.012,base:605,scale:.66,offset:-460,color:'#bbdef1',tint:.74},
  {asset:'mountain-haze',layer:'mountains-far',depth:.024,base:650,scale:.78,offset:650,color:'#97cdeb',tint:.53},
  {asset:'mountain-blue',layer:'mountains-far',depth:.041,base:648,scale:.54,offset:-420,color:'#72bce5',tint:.57},
  {asset:'mountain-blue',layer:'mountains-far',depth:.062,base:615,scale:.42,offset:250,color:'#539fd1',tint:.43},
  {asset:'mountain-green',layer:'mountains-near',depth:.14,base:553,scale:.385,span:2800,offset:1250,clusters:true,color:'#6bb5ca',tint:.23},
]);
// The source engine faces left. Flip the whole consist around its centre when
// travelling right, including the chimney, coaches and reflected train.
export const TRAIN = { left:1201, right:1508, chimneyX:1218, parts:[['engine',1201,449],['coach-1',1294,453],['coach-2',1397,454]] };
export function trainPose(direction,time=0){
  const facing=direction<0?-1:1,offsetX=Math.sin(time*.055)*3;
  return {facing,mirror:facing===1,offsetX,jitter:Math.sin(time*5.3)*.11,
    chimneyX:(facing===1?TRAIN.left+TRAIN.right-TRAIN.chimneyX:TRAIN.chimneyX)+offsetX,trailSign:-facing};
}
const base = 'assets/blue-sky-train/';
export const MATERIALS = [
  {id:'cloud-tower',label:'高塔积云 · 四层平涂',path:base+'clouds/r17/cloud-crown.png',kind:'flat-cloud',flatCloud:true},
  {id:'cloud-bank',label:'低云带 · 四层平涂',path:base+'clouds/r17/cloud-ribbon.png',kind:'flat-cloud',flatCloud:true},
  {id:'cloud-fan',label:'双峰积云 · 四层平涂',path:base+'clouds/r17/cloud-fan.png',kind:'flat-cloud',flatCloud:true},
  {id:'mountain-blue',path:base+'layered-stream/r07/mountain-blue.png',kind:'repeat-x',terrain:true},
  {id:'mountain-haze',label:'青蓝叠嶂 · 不规则远山',path:base+'layered-stream/r20/mountain-haze.png',kind:'repeat-x',terrain:true},
  {id:'mountain-green',path:base+'layered-stream/r11/wooded-ridge.png',kind:'hill-groups',cutout:true,clusters:true,groundY:689},
  {id:'midground-forest',path:base+'layered-stream/r11/wooded-ridge.png',kind:'hill-groups',cutout:true,clusters:true,groundY:689},
  {id:'rail-hill',path:base+'layered-stream/r11/lakeside-knoll.png',kind:'sprite',cutout:true,hill:true,groundY:778},
  {id:'leaves',label:'近景枝叶 · 四种轮廓',path:base+'foliage/r17/canopy-atlas.png',kind:'sprite-atlas',alphaCut:.30},
  {id:'low-shrub',path:base+'layered-stream/r01/low-shrub.png',kind:'sprite'},
  {id:'near-ferns',label:'近景蕨叶与草花',path:base+'foliage/r09/understory.png',kind:'sprite',alphaCut:.84,cutout:true},
  ...['bridge-deck','bridge-piers'].map(id=>({id,path:base+'layered-stream/r01/'+id+'.png',kind:'repeat-x'})),
  {id:'shore-paint',label:'草地笔触 · Shader 细节',path:base+'layered-stream/r13/shore.png',kind:'shader-detail',detailRect:[0,23,1952,16]},
  ...['engine','coach-1','coach-2'].map(id=>({id,path:base+'layered-stream/r01/'+id+'.png',kind:'sprite'})),
];
export const SCENE_LAYERS = [
  {id:'sky',name:'蓝天底色',depth:0,group:'远景',type:'渐变底层',note:'贯穿所有位置的蓝天底色。'},
  {id:'clouds-far',name:'远处云带',depth:.022,group:'远景',type:'四层平涂 · 随机云簇',assets:['cloud-bank','cloud-fan'],note:'新绘云带按固定种子改变大小、间距和高度；像素采样保持色块清晰，同一地点往返时云形不变。'},
  {id:'clouds',name:'高耸积云',depth:.045,group:'远景',type:'四层平涂 · 主云墙与低云肩',assets:['cloud-tower','cloud-fan','cloud-bank'],note:'完整云形组成高耸主云墙、较低云肩与中间的蓝天开口，缓慢漂移；换云、暂停与湖面倒影同步。'},
  {id:'mountains-far',name:'蓝色远山',depth:.062,group:'远景',type:'四重山脉 · 空气透视',assets:['mountain-haze','mountain-blue'],note:'四重等比山脉以错开的山脊互相遮掩；越远越淡、移动越慢，保留云与山之间的空间。'},
  {id:'mountains-near',name:'绿色山坡',depth:.14,group:'远景',type:'低矮连绵林坡',assets:['mountain-green'],note:'林坡降低到岸边山地的尺度，山脚树冠与远山衔接；开阔段让出中央视野，往返时保持一致。'},
  {id:'foothills',name:'中景林坡',depth:MIDGROUND.depth,group:'中景',type:'随机林坡与树冠',assets:['midground-forest'],note:'林坡连着山脚树冠，成簇出现并留出开阔路段；整座山丘等比移动，保持自然轮廓。'},
  {id:'trees',name:'林坡山脚树丛',depth:MIDGROUND.depth,group:'中景',type:'等比树冠 · 与林坡衔接',assets:['low-shrub'],note:'完整树丛按原比例缩放，疏密与大小沿林坡变化；与林坡使用同一世界坐标和速度，行进时不会分离。'},
  {id:'bridge-piers',name:'桥墩与拱肩',depth:1,group:'中景',type:'四跨重复单元',assets:['bridge-piers'],note:'从原图提取四跨石桥，桥洞透明，与桥面锁定同一相位。'},
  {id:'bridge-deck',name:'桥面与栏杆',depth:1,group:'中景',type:'四跨重复单元',assets:['bridge-deck'],note:'桥面和栏杆使用原画纹理，沿水平方向无限接续。'},
  {id:'engine',name:'蒸汽机车',depth:0,group:'列车',type:'跟随镜头',assets:['engine'],note:'车头始终朝行进方向；镜头跟随列车，背景向相反方向经过。'},
  {id:'coach-1',name:'第一节车厢',depth:0,group:'列车',type:'跟随镜头',assets:['coach-1'],note:'独立车厢素材，与机车共用位置和倒影变换。'},
  {id:'coach-2',name:'第二节车厢',depth:0,group:'列车',type:'跟随镜头',assets:['coach-2'],note:'独立车厢素材，与机车共用位置和倒影变换。'},
  {id:'steam',name:'列车蒸汽',depth:0,group:'列车',type:'星空列车连续烟带',note:'沿用星空列车的翻卷烟带；从烟囱向车尾升起，暂停、换向与湖面倒影同步。'},
  {id:'rail-hills',name:'轨前小山',depth:RAIL_HILLS.depth,group:'轨道前方',type:'独立山丘 · 山脚材质融合',assets:['rail-hill'],note:'沿岸山丘局部遮住桥梁和列车；山脚与草地在 Shader 中按笔触起伏融合，局部接触阴影与倒影同步。与开阔路段交替，离开后轨道重新显露。'},
  {id:'shore',name:'草地与岸线',depth:1,group:'水面',type:'程序化草岸与山脚融合 Shader',note:'浅湾、凸岸、草地色块与细碎水沿由世界坐标生成；经过小山时读取实际山脚纹理，草地与树根互相过渡。草岸与湖面共用轮廓遮罩。'},
  {id:'water',name:'湖面与实时倒影',depth:0,group:'水面',type:'柔化倒影与细碎波光',note:'细波打散倒影，近处更柔和；青蓝水纹与碎光随水面缓慢起伏，桥、列车和近岸倒影保持同步。'},
  {id:'understory',name:'近景低灌木',depth:2.6,group:'近景',type:'灌木与蕨叶群落',assets:['low-shrub','near-ferns'],note:'多种植物按路段形成疏密不同的群落；株高、间距、倾斜和叶色各异，留下自然的空隙。'},
  {id:'branches',name:'近景枝叶',depth:4.1,group:'近景',type:'独立植株与错落风摆',assets:['leaves','low-shrub','near-ferns'],note:'高枝与低矮灌木交替经过，每株有自己的姿态与风摆；沿同一路线往返时，植物分布保持一致。'},
];
export function randomAt(id,salt=0,seed=42){
  let n=(id|0)^Math.imul(salt+seed,0x9e3779b9);n=Math.imul(n^(n>>>16),0x21f0aaad);n=Math.imul(n^(n>>>15),0x735a2d97);return((n^(n>>>15))>>>0)/4294967296;
}
export function sceneryCell(id,seed=42){
  const value=randomAt(id,900,seed);
  // Independent rolls allowed minutes-long empty stretches at slow parallax.
  // Inspect raw neighbours, not recursive results: the third consecutive empty
  // cell becomes forest, with stable results when revisiting from either side.
  if(value<.32&&randomAt(id-1,900,seed)<.32&&randomAt(id-2,900,seed)<.32)return'forest';
  return value<.32?'open':value<.72?'forest':'hills';
}
export function visibleCells(camera,depth,span,{offset=0,width=WORLD.width,guard=2}={}){
  const shift=camera*depth-offset,first=Math.floor(shift/span)-guard,last=Math.floor((shift+width)/span)+guard;
  const result=[];for(let id=first;id<=last;id++)result.push({id,x:id*span-shift});return result;
}
export function wrapDistance(distance,span){return((distance%span)+span)%span;}
