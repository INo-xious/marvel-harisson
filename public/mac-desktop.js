import {mapPaintedScreen} from './brush-study-passage.js';
import {sampleLaptopTransition} from './laptop-transition.js?v=laptop-flight-20261103d';
import {createPaintedProjectBrowser} from './brush-study-project-browser.js?v=mac-desktop-20261103c';
const make=(tag,cls,text)=>{const el=document.createElement(tag);if(cls)el.className=cls;if(text!==undefined)el.textContent=text;return el;};
const folders=[{id:'projects',label:'Projects',icon:'folder'},{id:'timeline',label:'Timeline',icon:'calendar'},{id:'resume',label:'Résumé',icon:'folder'},{id:'notes',label:'Notes',icon:'notes'}];
const icon=name=>{const image=make('img','mac-icon');image.src=`/assets/macos/${name}.webp`;image.alt='';image.draggable=false;return image;};
function folderArt(){return icon('folder');}
function paragraphs(parent,value,className='painted-copy'){String(value||'').split(/\n\s*\n/).filter(Boolean).forEach(text=>parent.append(make('p',className,text)));}
const collection = (value) => Array.isArray(value) ? value : [];
const readable = (value) => typeof value === 'string' || typeof value === 'number' ? String(value) : '';
const safeURL = (value) => {
  if (typeof value !== 'string' || !value.trim()) return null;
  try {
    const url = new URL(value, window.location.href);
    return ['http:', 'https:'].includes(url.protocol) ? url.href : null;
  } catch { return null; }
};


// One cached Mac screen is shared by the physical laptop and its desktop.
function createMacScreen(){
 const image=new Image();image.src='/assets/macos/sonoma.webp';let ready=false,painted='';
 const icons=new Map(folders.map(folder=>{const image=new Image();image.src=`/assets/macos/${folder.icon}.webp`;image.onload=()=>{painted='';};return[folder.id,image];}));
 const loaded=image.decode().then(()=>{ready=true;return true;}).catch(()=>false);
 return {ready:loaded,getPortalLayers:()=>[],paintTo(context,width,height){
  if(!ready)return false;const key=`${width}/${height}/${Math.floor(Date.now()/60000)}`;if(key===painted)return false;painted=key;
  const scale=Math.max(width/image.width,height/image.height),w=image.width*scale,h=image.height*scale;
  context.clearRect(0,0,width,height);context.drawImage(image,(width-w)/2,(height-h)/2,w,h);
  context.fillStyle='#ffffff9c';context.fillRect(0,0,width,19);context.fillStyle='#17251e';context.font='bold 9px -apple-system, sans-serif';context.fillText('   Finder',10,13);context.font='8px sans-serif';context.fillText('File   Edit   View   Go   Window   Help',73,13);
  context.fillText(new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Tokyo',hour:'2-digit',minute:'2-digit',hour12:false}).format(new Date()),width-35,13);
  folders.forEach((folder,index)=>{const x=width-49,y=35+index*65;const img=icons.get(folder.id);if(img.complete&&img.naturalWidth)context.drawImage(img,x-20,y,38,38);context.fillStyle='#fff';context.font='9px sans-serif';context.textAlign='center';context.fillText(folder.label,x,y+49);context.textAlign='left';});
  const dockWidth=folders.length*46+16;context.fillStyle='#dbe6de88';context.beginPath();context.roundRect((width-dockWidth)/2,height-56,dockWidth,48,12);context.fill();folders.forEach((folder,index)=>{const img=icons.get(folder.id);if(img.complete&&img.naturalWidth)context.drawImage(img,(width-dockWidth)/2+13+index*46,height-50,36,36);});return true;
 }};
}
export function createMacDesktop({portfolio={},reduced=false,onEnter=()=>{},onEntered=()=>{},onLeave=()=>{},onExit=()=>{}}={}){
 const uid='mac-portfolio';let state='closed',session=0,opener=null,activeFolder=null,lastFolder='projects',menu=null,drag=null,motion=null,screenCorners=null;
 const landscape=createMacScreen();
 const dialog=make('dialog','mac-desktop');dialog.setAttribute('aria-label','Mac desktop');
 const displayBacking=make('div','mac-display-backing');displayBacking.setAttribute('aria-hidden','true');
 const surface=make('div','mac-surface');
 const menubar=make('div','mac-menubar');const left=make('div','mac-menu-left');const apple=make('button','mac-apple','');apple.setAttribute('aria-label','Apple menu');const finder=make('strong','','Finder');left.append(apple,finder);
 const menuButton=(label,items)=>{const button=make('button','mac-menu-button',label);button.type='button';button.setAttribute('aria-haspopup','menu');button.onclick=()=>showMenu(button,items);left.append(button);return button;};
 const back=make('button','mac-return','← Room');back.setAttribute('aria-label','Back to the room');back.onclick=()=>close();
 const date=make('span','mac-date');const right=make('div','mac-menu-right');const symbols=make('span','mac-system-symbols');symbols.setAttribute('aria-hidden','true');symbols.innerHTML='<svg viewBox="0 0 24 24"><path d="M3 9a14 14 0 0 1 18 0M6 13a9 9 0 0 1 12 0M9 17a4 4 0 0 1 6 0" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="12" cy="21" r="1"/></svg><svg viewBox="0 0 28 18"><rect x="1" y="3" width="23" height="12" rx="3" fill="none" stroke="currentColor"/><rect x="3" y="5" width="18" height="8" rx="1"/><path d="M26 6v6" stroke="currentColor" stroke-width="2"/></svg>';right.append(symbols,date,back);menubar.append(left,right);
 const desktop=make('div','mac-desktop-files');desktop.setAttribute('aria-label','Desktop files');const folderButtons=new Map();
 for(const folder of folders){const button=make('button','mac-desktop-file');button.setAttribute('aria-label',`Open ${folder.label} folder`);button.append(icon('folder'),make('span','',folder.label));button.onclick=()=>{desktop.querySelectorAll('button').forEach(item=>item.classList.toggle('is-selected',item===button));if(matchMedia('(pointer:coarse)').matches)openFolder(folder.id);};button.ondblclick=()=>openFolder(folder.id);button.onkeydown=event=>{if(event.key==='Enter'){event.preventDefault();openFolder(folder.id);}};desktop.append(button);folderButtons.set(folder.id,button);}
 const dock=make('nav','mac-dock');dock.setAttribute('aria-label','Dock');const finderDock=make('button','mac-dock-app');finderDock.setAttribute('aria-label','Open Finder');finderDock.append(icon('finder'),make('span','mac-dock-label','Finder'));finderDock.onclick=()=>openFolder(lastFolder);dock.append(finderDock);
 for(const folder of folders){const button=make('button','mac-dock-app');button.setAttribute('aria-label',`Open ${folder.label} from dock`);button.append(icon(folder.icon),make('span','mac-dock-label',folder.label));button.onclick=()=>openFolder(folder.id);dock.append(button);}
 const windowPanel=make('section','mac-window');windowPanel.hidden=true;windowPanel.setAttribute('aria-labelledby',uid+'-window-title');
 const toolbar=make('div','mac-window-toolbar'),traffic=make('div','mac-traffic');
 for(const [action,color,label] of [['close','red','Close window'],['minimize','yellow','Minimize window'],['zoom','green','Expand window']]){const button=make('button','mac-traffic-'+color);button.setAttribute('aria-label',label);button.onclick=()=>{if(action==='zoom'){const expanded=windowPanel.classList.toggle('is-maximized');button.setAttribute('aria-label',expanded?'Restore window':'Expand window');}else hideWindow();};traffic.append(button);}
 const folderTitle=make('h2');folderTitle.id=uid+'-window-title';const search=make('input','mac-search');search.type='search';search.placeholder='Search';search.setAttribute('aria-label','Search this folder');toolbar.append(traffic,folderTitle,search);
 const layout=make('div','mac-window-layout'),sidebar=make('nav','mac-sidebar');sidebar.setAttribute('aria-label','Finder folders');sidebar.append(make('p','','Favorites'));const sidebarButtons=new Map();
 for(const folder of folders){const button=make('button','mac-sidebar-item');button.setAttribute('aria-label',`Open ${folder.label} in Finder`);button.append(icon(folder.icon),make('span','',folder.label));button.onclick=()=>openFolder(folder.id);sidebar.append(button);sidebarButtons.set(folder.id,button);}
 sidebar.append(make('p','mac-owner',portfolio.name||'Portfolio'));const windowBody=make('div','mac-window-body');windowBody.tabIndex=0;const windowFoot=make('div','mac-window-foot');layout.append(sidebar,windowBody);windowPanel.append(toolbar,layout,windowFoot);
 const announcement=make('span','mac-sr-only');announcement.setAttribute('role','status');
 surface.append(menubar,desktop,windowPanel,dock);dialog.append(displayBacking,surface,announcement);document.body.append(dialog);
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
      const {label,items} = collections[index];search.value='';windowFoot.textContent=`${items.length} ${label.toLowerCase()}`;
      const browser = createPaintedProjectBrowser({items,native:true,animate:false,announce:copy=>{announcement.textContent=copy;}});
      browser.element.setAttribute('aria-label', `${label} browser`);
      const checked = index === 1 ? make('p', 'painted-content-meta', 'Pull request status checked 3 November 2026. Open a pull request for its latest status.') : null;
      content.replaceChildren(...(checked ? [checked, browser.element] : [browser.element]));
    };
    windowBody.append(controls, content);
    showCollection(0);
    return collections[0].items.length;
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

 function hideWindow(){windowPanel.hidden=true;activeFolder=null;folderButtons.get(lastFolder)?.focus({preventScroll:true});}
 function openFolder(id){if(state==='closed'||state==='closing')return;const folder=folders.find(folder=>folder.id===id);if(!folder)return;activeFolder=lastFolder=id;search.value='';folderTitle.textContent=folder.label;windowBody.replaceChildren();const count=renderers[id]();windowFoot.textContent=`${count} ${count===1?'item':'items'}`;windowPanel.hidden=false;windowBody.scrollTop=0;sidebarButtons.forEach((button,key)=>{if(key===id)button.setAttribute('aria-current','page');else button.removeAttribute('aria-current');});windowBody.focus({preventScroll:true});announcement.textContent=`${folder.label} opened`;}
 search.oninput=()=>{const value=search.value.toLowerCase();const entries=windowBody.querySelectorAll('.project-browser-file,.painted-timeline-entry,.painted-resume-section,.painted-note');let count=0;entries.forEach(entry=>{entry.hidden=!entry.textContent.toLowerCase().includes(value);if(!entry.hidden)count++;});if(activeFolder==='projects'){const files=[...windowBody.querySelectorAll('.project-browser-file')],first=files.find(item=>!item.hidden),preview=windowBody.querySelector('.project-browser-preview');if(preview)preview.hidden=!first;if(first)first.click();}windowFoot.textContent=value?`${count} results`:activeFolder==='projects'?`${portfolio.projects?.length||0} projects`:'All items';};
 function dismissMenu(){menu?.remove();menu=null;}
 function showMenu(button,items){if(menu?.dataset.trigger===button.textContent){dismissMenu();return;}dismissMenu();menu=make('div','mac-menu-popup');menu.dataset.trigger=button.textContent;menu.setAttribute('role','menu');for(const [label,action] of items){const item=make('button','',label);item.setAttribute('role','menuitem');item.onclick=()=>{dismissMenu();action();};menu.append(item);}dialog.append(menu);const box=button.getBoundingClientRect();menu.style.left=box.left+'px';menu.style.top=box.bottom+3+'px';}
 const folderMenu=folders.map(folder=>[folder.label,()=>openFolder(folder.id)]);
 apple.onclick=()=>showMenu(apple,[[portfolio.name||'Portfolio',()=>openFolder('resume')],['Return to the room',()=>close()]]);
 menuButton('File',[...folderMenu,['Close window',hideWindow]]);
 menuButton('Edit',[['Copy portfolio link',async()=>{try{await navigator.clipboard.writeText(location.origin);announcement.textContent='Portfolio link copied';}catch{announcement.textContent='Copy is unavailable in this browser';}}]]);
 menuButton('View',[['Show as icons',()=>windowBody.querySelector('[aria-label="Show projects as icons"]')?.click()],['Show as list',()=>windowBody.querySelector('[aria-label="Show projects as a list"]')?.click()]]);
 menuButton('Go',folderMenu);menuButton('Window',[['Minimize',hideWindow],['Zoom',()=>traffic.querySelector('.mac-traffic-green').click()]]);
 menuButton('Help',[['Using this desktop',()=>{folderTitle.textContent='Portfolio Help';windowBody.replaceChildren();windowBody.append(make('h4','','Welcome to my desktop'),make('p','painted-copy','Double-click a desktop folder, or click an icon in the Dock. Drag a Finder window by its title bar. The red button closes it, yellow minimizes it, and green expands it. Use the sidebar to browse my work. Choose Room in the menu bar to return to the painting.'));windowPanel.hidden=false;windowFoot.textContent='Portfolio Help';}]]);
 dialog.addEventListener('pointerdown',event=>{if(menu&&!menu.contains(event.target)&&!event.target.closest('.mac-menu-button,.mac-apple'))dismissMenu();});
 toolbar.onpointerdown=event=>{if(event.target.closest('button,input')||windowPanel.classList.contains('is-maximized'))return;const box=windowPanel.getBoundingClientRect();drag={x:event.clientX,y:event.clientY,left:box.left,top:box.top};toolbar.setPointerCapture(event.pointerId);};
 toolbar.onpointermove=event=>{if(!drag)return;windowPanel.style.transform='none';windowPanel.style.left=Math.max(0,Math.min(innerWidth-120,drag.left+event.clientX-drag.x))+'px';windowPanel.style.top=Math.max(30,Math.min(innerHeight-120,drag.top+event.clientY-drag.y))+'px';};toolbar.onpointerup=toolbar.onpointercancel=()=>{drag=null;};toolbar.ondblclick=event=>{if(!event.target.closest('button,input'))traffic.querySelector('.mac-traffic-green').click();};
 dialog.addEventListener('cancel',event=>{event.preventDefault();if(menu)dismissMenu();else if(!windowPanel.hidden)hideWindow();else close();});
 function updateDate(){date.textContent=new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Tokyo',weekday:'short',day:'numeric',month:'short',hour:'2-digit',minute:'2-digit',hour12:false}).format(new Date());}
 const dateTimer=setInterval(()=>{if(state!=='closed')updateDate();},30000);
 function project({corners}={},now=performance.now()){
  if(Array.isArray(corners)&&corners.length===4)screenCorners=corners;
  if(state==='closed')return;
  if(!motion||reduced){surface.style.transform='none';surface.style.opacity='1';displayBacking.style.transform='none';displayBacking.style.opacity='1';dialog.style.clipPath='none';return;}
  const pose=sampleLaptopTransition(motion.mode,now-motion.start);
  const rectify=motion.mode==='leave'?pose.rectify*motion.fromRectify:pose.rectify;
  const power=motion.mode==='leave'?pose.power*motion.fromPower:pose.power;
  const target=[[0,0],[innerWidth,0],[innerWidth,innerHeight],[0,innerHeight]];
  if(screenCorners){
   const quad=screenCorners.map(([x,y],i)=>[x+(target[i][0]-x)*rectify,y+(target[i][1]-y)*rectify]);
   const matrix=mapPaintedScreen({source:{left:0,top:0,width:innerWidth,height:innerHeight},corners:quad});
   if(matrix)displayBacking.style.transform=matrix;
   // Only the wallpaper belongs to the moving display plane. Desktop chrome
   // appears at the end of entry and fades before retreat, always level.
   surface.style.transform='none';
   dialog.style.clipPath=`polygon(${screenCorners.map(([x,y])=>`${x}px ${y}px`).join(',')})`;
  }
  surface.style.opacity=String(pose.chrome*(motion.mode==='leave'?motion.fromChrome:1));displayBacking.style.opacity=String(power);surface.dataset.screenPower=power.toFixed(3);surface.dataset.registration=rectify.toFixed(3);
 }
 async function open({from}={}){
  if(state!=='closed')return;const visit=++session;state='opening';opener=document.activeElement;
  await landscape.ready;if(visit!==session)return;
  updateDate();surface.inert=true;motion={mode:'enter',start:performance.now()};project();
  dialog.showModal();dialog.tabIndex=-1;dialog.focus({preventScroll:true});document.body.classList.add('mac-desktop-open');
  await onEnter({from,start:motion.start});if(visit!==session)return;
  motion=null;state='open';surface.inert=false;project();onEntered();finderDock.focus({preventScroll:true});
 }
 async function close(){
  if(state!=='open'&&state!=='opening')return;
  const current=motion?sampleLaptopTransition(motion.mode,performance.now()-motion.start):{rectify:1,power:1,chrome:1};
  state='closing';++session;dismissMenu();surface.inert=true;
  motion={mode:'leave',start:performance.now(),fromRectify:current.rectify,fromPower:current.power,fromChrome:current.chrome};project();
  await onLeave({start:motion.start});
  dialog.close();document.body.classList.remove('mac-desktop-open');motion=null;state='closed';windowPanel.hidden=true;activeFolder=null;surface.inert=false;onExit();opener?.focus({preventScroll:true});
 }

 return {open,close,landscape,project,resize(){drag=null;windowPanel.style.left='';windowPanel.style.top='';windowPanel.style.transform='';},get isOpen(){return state!=='closed';},get isSettled(){return state==='open';},dispose(){clearInterval(dateTimer);dialog.remove();}};
}
