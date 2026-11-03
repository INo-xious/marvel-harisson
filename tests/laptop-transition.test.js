import {describe,expect,it} from 'vitest';
import {LAPTOP_TIMING,sampleLaptopTransition} from '../public/laptop-transition.js';
describe('screen-registered laptop motion',()=>{
 it('wakes before travel, rectifies only after the screen covers the viewport, and fades off on return',()=>{
  expect(sampleLaptopTransition('enter',0)).toMatchObject({camera:0,power:0,rectify:0});
  expect(sampleLaptopTransition('enter',100).power).toBeGreaterThan(0);
  expect(sampleLaptopTransition('enter',LAPTOP_TIMING.enter)).toEqual({camera:1,power:1,rectify:1,chrome:1,done:true});
  expect(sampleLaptopTransition('leave',0)).toMatchObject({camera:0,power:1,rectify:1});
  expect(sampleLaptopTransition('leave',LAPTOP_TIMING.leave)).toEqual({camera:1,power:0,rectify:0,chrome:0,done:true});
  for(const mode of ['enter','leave']){
   let previous=0;
   for(let elapsed=0;elapsed<=LAPTOP_TIMING[mode];elapsed+=10){
    const pose=sampleLaptopTransition(mode,elapsed);
    expect(pose.camera).toBeGreaterThanOrEqual(previous);previous=pose.camera;
    expect([pose.camera,pose.power,pose.rectify].every(x=>Number.isFinite(x)&&x>=0&&x<=1)).toBe(true);
    if(mode==='enter'&&pose.rectify>0)expect(pose.camera).toBe(1);
    if(mode==='enter'&&pose.chrome>0)expect(pose.rectify).toBe(1);
    if(mode==='leave'&&pose.rectify<1)expect(pose.chrome).toBe(0);
    if(mode==='leave'&&pose.camera>0)expect(pose.rectify).toBe(0);
   }
  }
 });
 it('eases camera velocity to zero at both endpoints',()=>{
  for(const [mode,start,end] of [['enter',250,1750],['leave',400,1950]]){
   expect(sampleLaptopTransition(mode,start+16).camera).toBeLessThan(.00002);
   expect(1-sampleLaptopTransition(mode,end-16).camera).toBeLessThan(.00002);
  }
 });
});
