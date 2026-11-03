// A second painted room, reached through the laptop screen.
// Content is supplied by content.js; empty folders never invent portfolio history.
import {watercolorReveal,cancelWatercolor} from './brush-study-wash.js?v=objects-20261103a';
import {createPaintedProjectBrowser} from './brush-study-project-browser.js?v=objects-20261103a';
import {createDesktopLandscape} from './brush-study-desktop-landscape.js?v=objects-20261103a';
import {createShorelinePassage} from './brush-study-shoreline.js?v=objects-20261103a';
import {SHORELINE_TIMING} from './brush-study-shoreline-timing.js';
import {preparePaintedEdge} from './brush-study-painted-edge.js';
const folderCatalog = [
  { id: 'timeline', label: 'Timeline', ink: '#a99579', note: 'A few chapters along the way.' },
  { id: 'resume', label: 'Résumé', ink: '#8faaa0', note: 'The things I bring to a desk.' },
  { id: 'projects', label: 'Projects', ink: '#929fb0', note: 'Ideas, made and in progress.' },
  { id: 'notes', label: 'Notes', ink: '#b89c91', note: 'Things worth remembering.' },
];
let instanceCount = 0;

const make = (tag, className, copy) => {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (copy !== undefined) element.textContent = copy;
  return element;
};
const collection = (value) => Array.isArray(value) ? value : [];
const readable = (value) => typeof value === 'string' || typeof value === 'number' ? String(value) : '';
const safeURL = (value) => {
  if (typeof value !== 'string' || !value.trim()) return null;
  try {
    const url = new URL(value, window.location.href);
    return ['http:', 'https:'].includes(url.protocol) ? url.href : null;
  } catch { return null; }
};

function folderArt(ink) {
  const wrapper = make('span', 'painted-folder-art');
  const image = make('img', 'painted-folder-bitmap');
  image.src = '/assets/painted/finder-folder-watercolor-v1.webp';
  image.alt = ''; image.draggable = false;
  wrapper.setAttribute('aria-hidden', 'true');
  const tones = {'#a99579':'ochre','#8faaa0':'sage','#929fb0':'blue','#b89c91':'rose'};
  wrapper.dataset.tone = tones[ink] || 'blue';
  wrapper.append(image); return wrapper;
}

function paragraphs(parent, value, className = 'painted-copy') {
  readable(value).split(/\n\s*\n/).filter(Boolean).forEach(copy => parent.append(make('p', className, copy)));
}

export function createPaintedDesktop({ portfolio = {}, reduced = false, onEnter = () => {}, onEntered=()=>{}, onLeave=()=>{}, onDraw=()=>{}, onExit = () => {} } = {}) {
  const uid = `painted-desktop-${++instanceCount}`;
  const dialog = make('dialog', 'painted-desktop is-screen-desktop is-paper-desktop');
  dialog.setAttribute('aria-labelledby', `${uid}-title`);
  dialog.setAttribute('aria-describedby', `${uid}-description`);
  const paper = make('div', 'painted-desktop-paper');
  const heading = make('div', 'painted-desktop-heading');
  const headingCopy = make('div', 'painted-desktop-heading-copy');
  const title = make('h2', '', 'Finder');
  title.id = `${uid}-title`;
  const description = make('p', '', `${readable(portfolio.name)||'My'}’s painted desktop`);
  description.id = `${uid}-description`;
  headingCopy.append(title, description);
  const roomBack = make('button', 'painted-room-back', '← Back to the room');
  roomBack.type = 'button';
  heading.append(headingCopy, roomBack);
  const toolbar=make('div','painted-desktop-toolbar');
  toolbar.setAttribute('aria-hidden','true');
  toolbar.append(...['File','Edit','View','Go','Window','Help'].map(label=>make('span','',label)));
  const scene = make('div', 'painted-computer');
  const wallpaper=make('div','painted-desktop-wallpaper');
  wallpaper.setAttribute('aria-hidden','true');
  const landscape=createDesktopLandscape({reduced});preparePaintedEdge(landscape.element);wallpaper.append(landscape.element);
  const dock=make('div','painted-desktop-dock');
  dock.setAttribute('aria-label','Folder shortcuts');
  const dockButtons=[];
  folderCatalog.forEach(({id,label,ink})=>{
    const button=make('button','painted-dock-item');button.type='button';
    button.setAttribute('aria-label',`Open ${label} from dock`);
    button.append(folderArt(ink,`${uid}-dock-${id}`),make('span','',label));
    button.addEventListener('click',()=>openFolder(id,button));dock.append(button);dockButtons.push(button);
  });
  const screen = make('div', 'painted-computer-screen');
  const home = make('div', 'painted-desktop-home');
  const homeHeading = make('p', 'painted-desktop-welcome', 'a few things I’ve made.');
  const folders = make('div', 'painted-desktop-folders');
  folders.setAttribute('aria-label', 'Portfolio folders');
  const folderButtons = new Map();
  folderCatalog.forEach(({ id, label, ink }, index) => {
    const button = make('button', 'painted-folder');
    button.type = 'button';
    button.dataset.folder = id;
    button.style.setProperty('--folder-ink', ink);
    button.style.setProperty('--folder-delay', `${index * 70}ms`);
    button.setAttribute('aria-label', `Open ${label} folder`);
    button.append(folderArt(ink, `${uid}-grain-${id}`), make('span', 'painted-folder-label', label));
    button.addEventListener('click', () => openFolder(id));
    folders.append(button);
    folderButtons.set(id, button);
  });
  const deskNote = make('p', 'painted-desktop-note', 'Open a folder. Stay a while.');
  home.append(homeHeading, folders, deskNote);
  const folderWindow = make('section', 'painted-folder-window');
  folderWindow.hidden = true;
  folderWindow.setAttribute('aria-labelledby', `${uid}-folder-title`);
  const windowBar = make('div', 'painted-folder-bar');
  const folderBack = make('button', 'painted-folder-back', '‹');
  folderBack.type = 'button';
  folderBack.setAttribute('aria-label', 'Back to all folders');
  const folderTitle = make('h3');
  folderTitle.id = `${uid}-folder-title`;
  const closeFolder = make('button', 'painted-folder-close painted-traffic-close', '×');
  closeFolder.type = 'button';
  closeFolder.setAttribute('aria-label', 'Close folder');
  const traffic=make('div','painted-traffic-lights');
  const minimizeFolder=make('button','painted-traffic-minimize','−');minimizeFolder.type='button';minimizeFolder.setAttribute('aria-label','Minimize folder');
  const expandFolder=make('button','painted-traffic-expand','+');expandFolder.type='button';expandFolder.setAttribute('aria-label','Expand folder window');expandFolder.setAttribute('aria-pressed','false');
  traffic.append(closeFolder,minimizeFolder,expandFolder);
  windowBar.append(traffic,folderBack,folderTitle);
  const windowLayout=make('div','painted-finder-layout');
  const sidebar=make('nav','painted-finder-sidebar');sidebar.setAttribute('aria-label','Finder folders');
  sidebar.append(make('p','painted-finder-sidebar-label','Favorites'));
  const sidebarButtons=new Map();
  folderCatalog.forEach(({id,label,ink})=>{const button=make('button','painted-finder-location');button.type='button';button.setAttribute('aria-label',`Open ${label} in Finder`);button.append(folderArt(ink,`${uid}-sidebar-${id}`),make('span','',label));button.addEventListener('click',()=>openFolder(id,button));sidebar.append(button);sidebarButtons.set(id,button);});
  sidebar.append(make('p','painted-finder-owner',readable(portfolio.name)));
  const windowBody = make('div', 'painted-folder-body');
  windowBody.tabIndex = 0;
  const windowFoot = make('div', 'painted-folder-foot');
  windowLayout.append(sidebar,windowBody);
  const windowSurface=make('div','painted-finder-surface');windowSurface.setAttribute('aria-hidden','true');
  folderWindow.append(windowSurface,windowBar,windowLayout,windowFoot);
  screen.append(home);
  scene.append(wallpaper,screen,dock,heading,toolbar,folderWindow);
  const caption = make('p', 'painted-desktop-caption', 'Some things begin with a blank page.');
  const announcement = make('span', 'painted-sr-only');
  announcement.setAttribute('role', 'status');
  announcement.setAttribute('aria-live', 'polite');
  paper.append(scene,caption,announcement);
  const brushFilters=document.createElementNS('http://www.w3.org/2000/svg','svg');
  brushFilters.setAttribute('aria-hidden','true');brushFilters.style.cssText='position:absolute;width:0;height:0;overflow:hidden';
  brushFilters.innerHTML=`<defs><filter id="${uid}-ui-brush" x="-20%" y="-20%" width="140%" height="140%"><feTurbulence type="fractalNoise" baseFrequency=".15" numOctaves="2" seed="11" result="grain"/><feDisplacementMap in="SourceGraphic" in2="grain" scale=".65" xChannelSelector="R" yChannelSelector="G"/></filter></defs>`;
  dialog.style.setProperty('--ui-brush-filter',`url(#${uid}-ui-brush)`);
  dialog.append(paper,brushFilters);
  document.body.append(dialog);

  let state = 'closed';
  let session = 0;
  let viewportWidth=0,viewportHeight=0;
  let activeFolder = null;
  let opener = null;
  let origin = null;
  let pendingClose = null;
  let scrollY = 0;
  let folderClosing = false;
  let folderVisit = 0;
  let folderTrigger = null;
  const effects = new Set();
  const isReduced = () => typeof reduced === 'function' ? Boolean(reduced()) : Boolean(reduced?.matches ?? reduced);
  const passage=createShorelinePassage({scene,roomCanvas:document.querySelector('#painting'),landscape});
  let flow=null,screenCorners=null,screenLight=1,portalPose=null;
  function cancelFlow(){const current=flow;flow=null;current?.resolve({cancelled:true});}
  function beginFlow(mode,start){
    cancelFlow();passage.begin(mode);
    const completed=new Promise(resolve=>{flow={mode,start,resolve,frames:0,last:0,gaps:[]};});
    if(isReduced()){
      if(mode==='enter')passage.settle();else passage.clear();
      const current=flow;flow=null;current.resolve({cancelled:false});
    }else if(screenCorners)passage.frame(0,screenCorners,screenLight,portalPose);
    return completed;
  }
  function project({corners,screenLight:nextLight=1,portalPose:nextPortal=null},now=performance.now()){
    screenCorners=corners;screenLight=nextLight;portalPose=nextPortal;
    if(!flow){if(state!=='closed')landscape.element.style.filter=`brightness(${screenLight.toFixed(4)})`;return;}
    const current=flow,pose=passage.frame(now-current.start,corners,screenLight,portalPose);
    if(!pose)return;
    if(current.last)current.gaps.push(now-current.last);current.last=now;current.frames++;
    onDraw({phase:current.mode,progress:pose.progress});
    if(current.mode==='enter'&&pose.usable&&state==='opening'){
      state='open';home.inert=false;dock.inert=false;heading.inert=false;
      roomBack.focus({preventScroll:true});
      announcement.textContent='Inside the painted laptop. Choose a folder.';
    }
    if(pose.done){
      scene.dataset[current.mode==='enter'?'entryReport':'returnReport']=JSON.stringify({duration:Math.round(now-current.start),frames:current.frames,meanFrameMs:Math.round(current.gaps.reduce((a,b)=>a+b,0)/Math.max(1,current.gaps.length)*10)/10,maxFrameMs:Math.round(Math.max(0,...current.gaps))});
      flow=null;if(current.mode==='enter')passage.settle();
      current.resolve({cancelled:false});
    }
  }
  let depthFrame=0,depthLast=0,depthX=0,depthY=0,targetX=0,targetY=0;
  scene.addEventListener('pointermove',event=>{if(isReduced()||state!=='open'||event.pointerType==='touch')return;const bounds=scene.getBoundingClientRect();targetX=Math.max(-1,Math.min(1,(event.clientX-bounds.left)/bounds.width*2-1));targetY=Math.max(-1,Math.min(1,(event.clientY-bounds.top)/bounds.height*2-1));});
  scene.addEventListener('pointerleave',()=>{targetX=targetY=0;});
  function depth(now){
    if(state!=='open')return;
    const dt=Math.min(.05,depthLast?(now-depthLast)/1000:.016);depthLast=now;
    const blend=1-Math.exp(-dt*5);depthX+=(targetX-depthX)*blend;depthY+=(targetY-depthY)*blend;
    scene.style.setProperty('--depth-x',depthX.toFixed(4));scene.style.setProperty('--depth-y',depthY.toFixed(4));landscape.setDepth(depthX,depthY);
    depthFrame=requestAnimationFrame(depth);
  }
  const paint = (element, options={}) => {
    const effect=watercolorReveal(element,{reduced:isReduced,...options});effects.add(effect);
    effect.finished.then(()=>{if(!options.hold)effects.delete(effect);});return effect;
  };
  const empty = (heading, copy) => {
    const illustration = folderArt('#b4a894', `${uid}-empty-grain`);
    illustration.classList.add('painted-empty-art');
    const block = make('div', 'painted-folder-empty');
    block.append(illustration, make('h4', '', heading), make('p', '', copy));
    windowBody.append(block);
  };
  const entryHeading = (item, fallback) => readable(item?.title || item?.role || item?.name) || fallback;
  const addLink = (parent, url, label, download = false) => {
    const href = safeURL(url);
    if (!href) return;
    const link = make('a', 'painted-content-link', label);
    link.href = href;
    if (download) link.setAttribute('download', '');
    else { link.target = '_blank'; link.rel = 'noopener noreferrer'; }
    parent.append(link);
  };
  const renderProjects = () => {
    const controls = make('div', 'painted-work-collections');
    controls.setAttribute('role', 'group');
    controls.setAttribute('aria-label', 'Choose work collection');
    const content = make('div', 'painted-work-content');
    const collections = [
      { label: 'Projects', items: collection(portfolio.projects) },
      { label: 'Contributions', items: collection(portfolio.contributions) },
    ];
    const buttons = collections.map(({label,items}, index) => {
      const button = make('button', '', `${label} · ${items.length}`);
      button.type = 'button';
      button.setAttribute('aria-pressed', String(index === 0));
      button.addEventListener('click', () => {
        buttons.forEach((item, i) => item.setAttribute('aria-pressed', String(i === index)));
        showCollection(index);
      });
      controls.append(button);
      return button;
    });
    const showCollection = index => {
      const {label,items} = collections[index];
      const browser = createPaintedProjectBrowser({items,announce:copy=>{announcement.textContent=copy;}});
      browser.element.setAttribute('aria-label', `${label} browser`);
      const checked = index === 1 ? make('p', 'painted-content-meta', 'Pull request status checked 3 November 2026. Open a pull request for its latest status.') : null;
      content.replaceChildren(...(checked ? [checked, browser.element] : [browser.element]));
    };
    windowBody.append(controls, content);
    showCollection(0);
    return collections.reduce((sum, group) => sum + group.items.length, 0);
  };
  const renderNotes = () => {
    const items = collection(portfolio.notes);
    if (!items.length) { empty('A fresh page.', 'Notes will find their way here as they’re written.'); return 0; }
    const list = make('div', 'painted-note-list');
    items.forEach(item => {
      if (typeof item === 'string') { const note = make('article', 'painted-note'); paragraphs(note, item); list.append(note); return; }
      if (!item || typeof item !== 'object') return;
      const note = make('article', 'painted-note');
      if (item.date) note.append(make('p', 'painted-content-meta', readable(item.date)));
      note.append(make('h4', '', entryHeading(item, 'A note')));
      paragraphs(note, item.body || item.content || item.description);
      addLink(note, item.url, 'Read note ↗');
      list.append(note);
    });
    windowBody.append(list);
    return list.childElementCount;
  };
  const renderTimeline = () => {
    const items = collection(portfolio.timeline);
    if (!items.length) { empty('The story is still unfolding.', 'Timeline entries will appear here when they’re added.'); return 0; }
    const list = make('ol', 'painted-timeline');
    items.forEach(item => {
      if (!item || typeof item !== 'object') return;
      const entry = make('li', 'painted-timeline-entry');
      const date = readable(item.date || item.year || item.period);
      if (date) entry.append(make('p', 'painted-timeline-date', date));
      entry.append(make('h4', '', entryHeading(item, 'A chapter')));
      const place = readable(item.organization || item.company || item.location);
      if (place) entry.append(make('p', 'painted-content-meta', place));
      paragraphs(entry, item.description || item.body);
      addLink(entry, item.url, 'Explore ↗');
      list.append(entry);
    });
    windowBody.append(list);
    return list.childElementCount;
  };
  const renderResume = () => {
    const resume = portfolio.resume;
    const url = typeof resume === 'string' ? resume : resume?.url || resume?.file;
    const sections = collection(resume?.sections).slice();
    ['experience', 'education', 'skills'].forEach(key => {
      const items = collection(resume?.[key]);
      if (items.length) sections.push({ title: key[0].toUpperCase() + key.slice(1), items });
    });
    const summary = readable(resume?.summary);
    if (!safeURL(url) && !summary && !sections.length) { empty('A résumé, soon.', 'The résumé hasn’t been added yet. It will live here when it’s ready.'); return 0; }
    const content = make('article', 'painted-resume');
    if (portfolio.name) content.append(make('h4', 'painted-resume-name', readable(portfolio.name)));
    paragraphs(content, summary);
    addLink(content, url, 'Open résumé ↗');
    addLink(content, portfolio.contacts?.linkedin, 'View LinkedIn profile ↗');
    sections.forEach(section => {
      if (!section || typeof section !== 'object') return;
      const group = make('section', 'painted-resume-section');
      group.append(make('h4', '', readable(section.title) || 'Résumé'));
      paragraphs(group, section.body || section.description);
      collection(section.items).forEach(item => {
        if (typeof item === 'string') { group.append(make('p', 'painted-resume-item', item)); return; }
        if (!item || typeof item !== 'object') return;
        const entry = make('div', 'painted-resume-entry');
        entry.append(make('h5', '', entryHeading(item, 'Entry')));
        const meta = [item.organization || item.company || item.school, item.date || item.period || item.year].map(readable).filter(Boolean);
        if (meta.length) entry.append(make('p', 'painted-content-meta', meta.join(' · ')));
        paragraphs(entry, item.description || item.body);
        addLink(entry, item.url, 'Explore ↗');
        group.append(entry);
      });
      content.append(group);
    });
    windowBody.append(content);
    return sections.length || 1;
  };
  const renderers = { timeline: renderTimeline, resume: renderResume, projects: renderProjects, notes: renderNotes };

  function openFolder(id,trigger=folderButtons.get(id)) {
    const folder = folderCatalog.find(item => item.id === id);
    if (!folder || state === 'closed' || state === 'closing' || folderClosing) return;
    folderTrigger=trigger;
    folderVisit++;
    activeFolder = id;
    folderWindow.dataset.folder=id;
    sidebarButtons.forEach((button,key)=>{if(key===id)button.setAttribute('aria-current','page');else button.removeAttribute('aria-current');});
    screen.classList.add('has-open-folder');
    home.inert = true;
    windowBody.replaceChildren();
    folderTitle.textContent = folder.label;
    const subheading = make('p', 'painted-folder-subheading', folder.note);
    windowBody.append(subheading);
    const count = renderers[id]();
    windowFoot.textContent = `${count === 0 ? 'A little space for what comes next' : `${count} ${count === 1 ? 'entry' : 'entries'}`} · ${folder.label}`;
    folderWindow.hidden = false;
    windowBody.scrollTop = 0;
    folderBack.focus({ preventScroll: true });
    announcement.textContent = `${folder.label} folder opened`;
    paint(folderWindow,{duration:620,kind:'bloom',origin:{x:.5,y:.5},ink:folder.ink,seed:21+folderVisit});
  }
  async function backToFolders() {
    if (!activeFolder || folderClosing || state==='closing' || state==='closed') return;
    folderClosing=true;
    const previous = activeFolder;
    const visit=folderVisit, currentSession=session;
    home.hidden=false;
    home.inert=true;
    cancelWatercolor(windowBody);
    const lifted=paint(folderWindow,{duration:500,lift:true,hold:true,kind:'bloom',origin:{x:.5,y:.5},ink:folderCatalog.find(item=>item.id===previous).ink,seed:21+visit});
    await lifted.finished;
    if(state==='closed'||state==='closing'||visit!==folderVisit||currentSession!==session)return;
    activeFolder = null;
    screen.classList.remove('has-open-folder');
    folderWindow.hidden = true;
    lifted.cancel();effects.delete(lifted);
    folderClosing=false;
    home.inert=false;
    (folderWindow.contains(folderTrigger)?folderButtons.get(previous):(folderTrigger||folderButtons.get(previous)))?.focus({ preventScroll: true });
    announcement.textContent = 'All folders';
  }
  folderBack.addEventListener('click', backToFolders);
  closeFolder.addEventListener('click', backToFolders);
  minimizeFolder.addEventListener('click',backToFolders);
  expandFolder.addEventListener('click',()=>{const expanded=folderWindow.classList.toggle('is-expanded');expandFolder.setAttribute('aria-pressed',String(expanded));expandFolder.setAttribute('aria-label',expanded?'Restore folder window':'Expand folder window');});
  roomBack.addEventListener('click', close);
  dialog.addEventListener('cancel', event => { event.preventDefault(); if(state==='closing')return; if (activeFolder&&!folderClosing) backToFolders(); else close(); });
  dialog.addEventListener('close', () => {
    if (state === 'closed' || dialog.open) return;
    finishClose();
  });

  function finishClose() {
    if (state === 'closed') return;
    session++;
    cancelFlow();passage.clear();
    for(const effect of effects)effect.cancel();effects.clear();
    cancelAnimationFrame(depthFrame);landscape.setDepth(0,0);depthLast=0;depthX=depthY=targetX=targetY=0;
    scene.style.removeProperty('--depth-x');scene.style.removeProperty('--depth-y');
    paper.style.removeProperty('--paper-opacity');
    state = 'closed';
    dialog.classList.remove('is-arriving', 'is-leaving', 'is-portal-painting','is-shoreline-passage');
    scene.style.transform='';
    scene.style.transformOrigin='';scene.style.visibility='';
    caption.style.visibility='';
    document.body.classList.remove('painted-desktop-open');
    activeFolder = null;
    folderTrigger = null;
    folderClosing=false;
    home.inert=false;dock.inert=false;heading.inert=false;
    folderWindow.hidden = true;
    screen.classList.remove('has-open-folder');
    home.hidden = false;
    onExit();
    if (opener?.isConnected && typeof opener.focus === 'function') opener.focus({ preventScroll: true });
    window.scrollTo({ top: scrollY, behavior: 'instant' });
    opener = null;
    pendingClose = null;
  }
  async function open({ from } = {}) {
    if (state !== 'closed') return;
    state='opening';const visit=++session;
    home.inert=true;dock.inert=true;heading.inert=true;
    opener=document.activeElement;scrollY=window.scrollY;
    origin=from&&{left:from.left??from.x,top:from.top??from.y,width:from.width,height:from.height};
    activeFolder=null;home.hidden=false;folderWindow.hidden=true;
    document.body.classList.add('painted-desktop-open');
    dialog.classList.toggle('is-reduced',isReduced());
    dialog.classList.add('is-arriving','is-shoreline-passage');
    caption.style.visibility='hidden';scene.style.visibility='';
    scene.style.setProperty('--passage-ui','0');
    dialog.showModal();landscape.resume();
    const start=performance.now(),painted=beginFlow('enter',start);
    try {
      await Promise.all([Promise.resolve(onEnter({from:origin,start,duration:SHORELINE_TIMING.enter.camera})),painted]);
    } catch(error){if(visit===session)finishClose();throw error;}
    if(visit!==session||state==='closing'||state==='closed')return;
    dialog.classList.remove('is-arriving','is-shoreline-passage');
    onEntered();state='open';
    if(!activeFolder)home.inert=false;dock.inert=false;heading.inert=false;
    if(isReduced())roomBack.focus({preventScroll:true});
    caption.style.visibility='';paint(caption,{duration:300,kind:'ink',seed:13});
    if(!isReduced())depthFrame=requestAnimationFrame(depth);
  }
  async function close() {
    if(state==='closed')return;
    if(pendingClose)return pendingClose;
    state='closing';const visit=++session;
    cancelAnimationFrame(depthFrame);depthLast=0;
    caption.style.visibility='hidden';home.inert=true;dock.inert=true;
    for(const effect of effects){effect.finish();effect.cancel();}effects.clear();
    dialog.classList.remove('is-arriving');
    dialog.classList.add('is-leaving','is-shoreline-passage');
    const start=performance.now(),painted=beginFlow('leave',start);
    pendingClose=(async()=>{
      await Promise.all([Promise.resolve(onLeave({start,duration:SHORELINE_TIMING.leave.camera})),painted]);
      if(visit!==session)return;
      if(dialog.open)dialog.close();
      finishClose();
    })();
    return pendingClose;
  }
  function resize() {
    if(viewportWidth===window.innerWidth&&viewportHeight===window.innerHeight)return;
    viewportWidth=window.innerWidth;viewportHeight=window.innerHeight;
    for(const effect of effects)effect.finish();
    if(flow)passage.resize();
    // Fixed mobile paper belongs to the dialog, outside the masked/filtering device.
    const parent=scene;
    if(folderWindow.parentElement!==parent)parent.append(folderWindow);
  }
  resize();
  return {open,close,project,landscape,get isOpen(){return state!=='closed';},get isSettled(){return state==='open'&&!flow;},resize};
}
