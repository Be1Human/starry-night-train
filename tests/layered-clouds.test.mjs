import test from 'node:test';
import assert from 'node:assert/strict';
import {cloudInstances,FLAT_CLOUDS} from '../cases/blue-sky-layered/flat-clouds.js';

const assets={
  'cloud-tower':{image:{width:500,height:283}},
  'cloud-fan':{image:{width:572,height:217}},
  'cloud-bank':{image:{width:700,height:144}},
};
const state={camera:0,time:8,windTime:8,wind:true,seed:42,cloudSeed:42};

test('cloud groups reconstruct when returning from distant positions and use all new shapes',()=>{
  const seen=new Set();
  for(const far of [false,true]){
    const initial=cloudInstances(state,far,assets);
    for(const camera of [-1e8,-2000,2000,1e8]){
      const items=cloudInstances({...state,camera},far,assets);
      assert(items.length>0&&items.length<9,'cloud population stays bounded');
      items.forEach(item=>seen.add(item.asset));
    }
    assert.deepEqual(cloudInstances(state,far,assets),initial);
  }
  assert.deepEqual([...seen].sort(),['cloud-bank','cloud-fan','cloud-tower']);
  assert.notDeepEqual(cloudInstances({...state,cloudSeed:43},false,assets),cloudInstances(state,false,assets));
});

test('cloud cell boundaries preserve shared clouds in either travel direction',()=>{
  for(const far of [false,true])for(const sign of [-1,1]){
    const depth=far?FLAT_CLOUDS.farDepth:FLAT_CLOUDS.nearDepth;
    const span=far?FLAT_CLOUDS.farSpan:FLAT_CLOUDS.nearSpan,camera=sign*span/depth;
    const before=cloudInstances({...state,camera:camera-.01},far,assets);
    const after=cloudInstances({...state,camera:camera+.01},far,assets);
    let shared=0;
    for(const item of after){
      const previous=before.find(p=>p.id===item.id);if(!previous)continue;shared++;
      assert.equal(item.asset,previous.asset);assert.equal(item.width,previous.width);assert.equal(item.height,previous.height);
      assert.equal(item.y,previous.y);assert(Math.abs(item.x-previous.x+.02*depth)<1e-7);
    }
    assert(shared>=2,'shared clouds continue through the boundary');
  }
});

test('freezing the wind phase holds clouds even while the host clock advances',()=>{
  const initial=cloudInstances(state,false,assets);
  assert.deepEqual(cloudInstances({...state,time:1000,wind:false},false,assets),initial);
  const later=cloudInstances({...state,windTime:38},false,assets);
  assert.notDeepEqual(later,initial);
  for(const item of later){
    const previous=initial.find(p=>p.id===item.id);if(!previous)continue;
    assert.equal(item.asset,previous.asset);assert.equal(item.width,previous.width);
    assert(Math.abs(item.width/item.height-assets[item.asset].image.width/assets[item.asset].image.height)<1e-10);
  }
});
