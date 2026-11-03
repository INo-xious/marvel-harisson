import {describe,expect,it} from 'vitest';
import {LAPTOP_TIMING,sampleLaptopTransition,screenReveal} from '../public/laptop-transition.js';
describe('screen-registered laptop motion',()=>{
 it('wakes before travel and reaches the exact desktop and sleeping endpoints',()=>{
  expect(sampleLaptopTransition('enter',0)).toMatchObject({camera:0,power:0,rectify:0});
  expect(sampleLaptopTransition('enter',100).power).toBeGreaterThan(0);
  expect(sampleLaptopTransition('enter',LAPTOP_TIMING.enter)).toEqual({camera:1,power:1,rectify:1,chrome:1,wallpaper:1,done:true});
  expect(sampleLaptopTransition('leave',0)).toMatchObject({camera:0,power:1,rectify:1});
  expect(sampleLaptopTransition('leave',LAPTOP_TIMING.leave)).toEqual({camera:1,power:0,rectify:0,chrome:0,wallpaper:0,done:true});
  for(const mode of ['enter','leave']){
   let previous=0;
   for(let elapsed=0;elapsed<=LAPTOP_TIMING[mode];elapsed+=10){
    const pose=sampleLaptopTransition(mode,elapsed);
    expect(pose.camera).toBeGreaterThanOrEqual(previous);previous=pose.camera;
    expect([pose.camera,pose.power,pose.rectify].every(x=>Number.isFinite(x)&&x>=0&&x<=1)).toBe(true);

   }
  }
 });

 it('blends screen alignment during travel instead of a separate correction at the end',()=>{
  const middle=sampleLaptopTransition('enter',1600);
  expect(middle.camera).toBeGreaterThan(0);expect(middle.camera).toBeLessThan(1);
  expect(middle.rectify).toBeGreaterThan(0);expect(middle.rectify).toBeLessThan(1);
  for(const mode of ['enter','leave']){
   for(let time=16;time<=LAPTOP_TIMING[mode];time+=16){
    const before=sampleLaptopTransition(mode,time-16),after=sampleLaptopTransition(mode,time);
    // No 60 Hz frame should contain a large screen-alignment or UI jump.
    expect(Math.abs(after.rectify-before.rectify)).toBeLessThan(.02);
    expect(Math.abs(after.chrome-before.chrome)).toBeLessThan(.07);
   }
  }
 });
 it('overlaps the desktop reveal with ongoing camera travel',()=>{
  const pose=sampleLaptopTransition('enter',2100);
  expect(pose.wallpaper).toBeGreaterThan(.1);expect(pose.chrome).toBeGreaterThan(.1);
  expect(pose.camera).toBeLessThan(1);
  expect(sampleLaptopTransition('enter',100).camera).toBeGreaterThan(0);
  expect(sampleLaptopTransition('leave',100).camera).toBeGreaterThan(0);
 });
 it('hides native graphics until the aperture covers the viewport, then feathers them in',()=>{
  expect(screenReveal([[10,10],[990,10],[990,710],[10,710]],1000,720)).toBe(0);
  expect(screenReveal([[0,0],[1000,0],[1000,720],[0,720]],1000,720)).toBe(0);
  const partly=screenReveal([[-20,-20],[1020,-20],[1020,740],[-20,740]],1000,720);
  expect(partly).toBeGreaterThan(0);expect(partly).toBeLessThan(1);
  expect(screenReveal([[-100,-100],[1100,-100],[1100,820],[-100,820]],1000,720)).toBe(1);
  expect(screenReveal([[-100,-100],[1100,-100],[1100,820],[20,820]],1000,720)).toBe(0);
  expect(screenReveal(null,1000,720)).toBe(0);
 });
 it('eases camera velocity to zero at both endpoints',()=>{
  for(const [mode,start,end] of [['enter',0,2600],['leave',0,2600]]){
   expect(sampleLaptopTransition(mode,start+16).camera).toBeLessThan(.00002);
   expect(1-sampleLaptopTransition(mode,end-16).camera).toBeLessThan(.00002);
  }
 });
});
