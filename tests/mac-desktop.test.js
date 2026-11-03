import {afterEach,beforeEach,describe,expect,it,vi} from 'vitest';
import {createMacDesktop} from '../public/mac-desktop.js';
import {portfolio} from '../public/content.js';
class TestImage{constructor(){this.width=640;this.height=400;this.naturalWidth=640;this.complete=true;}async decode(){return true;}}
let desktop;
beforeEach(()=>{document.body.replaceChildren();vi.stubGlobal('Image',TestImage);vi.stubGlobal('matchMedia',()=>({matches:false}));HTMLDialogElement.prototype.showModal=function(){this.setAttribute('open','');};HTMLDialogElement.prototype.close=function(){this.removeAttribute('open');};});
afterEach(()=>{desktop?.dispose();vi.unstubAllGlobals();});
const button=label=>document.querySelector(`[aria-label="${label}"]`);
describe('Mac portfolio desktop',()=>{
 it('opens the native desktop, preserves contribution links, and returns through its lifecycle',async()=>{
  const enter=vi.fn(),leave=vi.fn(),exit=vi.fn();desktop=createMacDesktop({portfolio,onEnter:enter,onLeave:leave,onExit:exit});await desktop.open();
  expect(desktop.isSettled).toBe(true);expect(enter).toHaveBeenCalledOnce();
  button('Open Projects from dock').click();expect(document.querySelectorAll('[role="option"]')).toHaveLength(9);
  [...document.querySelectorAll('.painted-work-collections button')].find(item=>item.textContent.startsWith('Contributions')).click();
  expect(document.querySelectorAll('[role="option"]')).toHaveLength(31);
  expect(document.querySelector('.project-browser-visit').getAttribute('href')).toMatch(/github.com\/[^/]+\/[^/]+\/pull\/\d+/);
  expect(document.querySelectorAll('.mac-file-bitmap')).not.toHaveLength(0);
  await desktop.close();expect(desktop.isOpen).toBe(false);expect(leave).toHaveBeenCalledOnce();expect(exit).toHaveBeenCalledOnce();
 });
 it('opens Finder from the Dock, searches, expands, and minimizes its window',async()=>{
  desktop=createMacDesktop({portfolio});await desktop.open();button('Open Finder').click();
  const search=button('Search this folder');search.value='Stockbit';search.dispatchEvent(new Event('input'));
  expect([...document.querySelectorAll('.project-browser-file')].filter(item=>!item.hidden)).toHaveLength(1);
  button('Expand window').click();expect(document.querySelector('.mac-window').classList.contains('is-maximized')).toBe(true);
  button('Minimize window').click();expect(document.querySelector('.mac-window').hidden).toBe(true);
  button('Open Résumé from dock').click();expect(document.querySelector('.mac-window-body').textContent).toContain('Ritsumeikan University');
  expect([...document.querySelectorAll('.mac-window-body a')].some(link=>link.href.includes('Marvel-Harisson-resume.pdf'))).toBe(true);
 });
});
