import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createRoomInteractions } from '../public/room-interactions.js';
class TestAudio extends EventTarget {
 constructor(){super();this.paused=true;this.duration=60;this.currentTime=0;this.volume=.45;this.attributes={};}
 set src(value){this.attributes.src=value;this.currentTime=0;this.dispatchEvent(new Event('loadedmetadata'));}
 get src(){return this.attributes.src;}
 getAttribute(name){return this.attributes[name]??null;}
 async play(){this.paused=false;this.dispatchEvent(new Event('play'));}
 pause(){this.paused=true;this.dispatchEvent(new Event('pause'));}
}
const tracks=[{title:'First',artist:'Room',src:'/first.m4a'},{title:'Second',artist:'Room',src:'/second.m4a'}];
const contacts={github:'https://github.com/INo-xious',linkedin:'https://www.linkedin.com/in/marvel-harisson/',email:'im.marvel.harisson@gmail.com'};
const click=name=>document.querySelector(`[aria-label="${name}"]`).click();
let ui;
beforeEach(()=>{document.body.replaceChildren();vi.stubGlobal('Audio',TestAudio);ui=createRoomInteractions({contacts,tracks,onLamp:vi.fn()});});
afterEach(()=>{ui.close();vi.unstubAllGlobals();});
describe('room object controls',()=>{
 it('opens one anchored URL preview and dismisses on outside click or Escape',()=>{
  const first=document.createElement('button'),second=document.createElement('button');document.body.append(first,second);ui.registerSocial('github',first);ui.registerSocial('email',second);
  ui.openContact('github','GitHub',first);
  expect(ui.active).toBe('github');expect(document.querySelector('.room-url-link').href).toBe(contacts.github);
  expect(first.getAttribute('aria-expanded')).toBe('true');
  document.body.dispatchEvent(new MouseEvent('pointerdown',{bubbles:true}));expect(ui.isOpen).toBe(false);
  ui.openContact('email','Gmail',second);expect(document.querySelector('.room-url-link').getAttribute('href')).toBe(`mailto:${contacts.email}`);
  document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}));expect(ui.isOpen).toBe(false);
 });
 it('plays, pauses, switches tracks, seeks, changes volume, and keeps music when dismissed',async()=>{
  ui.radio.hidden=false;ui.radio.click();click('Play song');await Promise.resolve();
  expect(ui.audio.paused).toBe(false);expect(ui.audio.src).toBe('/first.m4a');
  click('Next song');await Promise.resolve();expect(ui.audio.src).toBe('/second.m4a');
  const seek=document.querySelector('[aria-label="Song progress"]');seek.value=50;seek.dispatchEvent(new Event('input'));expect(ui.audio.currentTime).toBe(30);
  const volume=document.querySelector('[aria-label="Volume"]');volume.value=.2;volume.dispatchEvent(new Event('input'));expect(ui.audio.volume).toBe(.2);
  click('Close radio player');expect(ui.isOpen).toBe(false);expect(ui.audio.paused).toBe(false);
  ui.radio.click();click('Pause song');expect(ui.audio.paused).toBe(true);
  click('Previous song');await Promise.resolve();expect(ui.audio.src).toBe('/first.m4a');
 });
 it('toggles the lamp without opening a dialog',()=>{
  ui.lamp.click();expect(ui.lamp.getAttribute('aria-pressed')).toBe('false');expect(ui.isOpen).toBe(false);
  ui.lamp.click();expect(ui.lamp.getAttribute('aria-pressed')).toBe('true');expect(ui.lamp.hasAttribute('aria-expanded')).toBe(false);
 });
});
