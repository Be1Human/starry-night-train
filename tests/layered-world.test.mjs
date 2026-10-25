import test from 'node:test';
import assert from 'node:assert/strict';
import { WORLD, visibleCells, randomAt } from '../cases/blue-sky-layered/world.mjs';

test('continuous strips cover the viewport in both directions and at large distances',()=>{
  for(const camera of [-1e9,-2048,-323,-.001,0,322.999,323,2048,1e9])for(const depth of [.022,.06,.14,1,2.6,4.1]){
    const cells=visibleCells(camera,depth,323,{guard:1});
    assert(cells[0].x<=0);assert(cells.at(-1).x+323>=WORLD.width);assert(cells.length<=11);
    for(let i=1;i<cells.length;i++)assert(Math.abs(cells[i].x-cells[i-1].x-323)<.000001);
  }
});
test('crossing a cell boundary keeps every shared object moving continuously',()=>{
  for(const depth of [.022,.14,1,4.1])for(const sign of [-1,1]){
    const boundary=sign*1450/depth,delta=.01;
    const before=visibleCells(boundary-delta,depth,1450),after=visibleCells(boundary+delta,depth,1450);
    let matched=0;
    for(const a of after){const b=before.find(v=>v.id===a.id);if(b){matched++;assert(Math.abs((a.x-b.x)+2*delta*depth)<1e-8);}}
    assert(matched>=4);
  }
});
test('the same world cell reconstructs the same material choices when revisited',()=>{
  const ids=[-2147483,-1,0,1,11309],first=ids.map(id=>randomAt(id,7,42));
  for(let id=-50;id<50;id++)randomAt(id,3,15);
  assert.deepEqual(ids.map(id=>randomAt(id,7,42)),first);assert.notDeepEqual(ids.map(id=>randomAt(id,7,43)),first);assert(first.every(n=>n>=0&&n<1));
});
