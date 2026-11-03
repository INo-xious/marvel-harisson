import { icon } from './icons.js';
import { portfolio, tracks } from './content.js';
import { minutesInOsaka, timeLabel, startTimePreview, runningRoomDate, sunState } from './time.js';
import { RoomScene } from './scene.js';
import { mountGlassDock } from './glass-dock.js';

const $ = (s, root = document) => root.querySelector(s);
const $$ = (s, root = document) => [...root.querySelectorAll(s)];
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const escape = (s) => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const state = { entered: false, ready: false, manualTime: null, panel: null, lamp: true, music: false, track: 0, muted: false, guide: false, folder: null };
let previousFocus = null;

$('#app').innerHTML = `
  <div id="room-stage" class="room-stage"><canvas id="room-canvas" aria-label="Interactive illustrated room in Osaka" aria-describedby="room-instructions"></canvas><div class="grain" aria-hidden="true"></div><div class="scene-vignette" aria-hidden="true"></div></div>
  <div id="arrival" class="arrival" aria-labelledby="arrival-title">
    <div class="arrival-top"><span class="arrival-mark">a little room<span>.</span></span><span class="arrival-location">OSAKA, JAPAN <span id="arrival-time"></span></span></div>
    <div class="arrival-content">
      <p class="eyebrow">THOUGHTS, CODE & LITTLE THINGS</p>
      <h1 id="arrival-title">Somewhere,<br><em>in Osaka.</em></h1>
      <p class="arrival-description">A window to the city.<br>A little space to make yourself at home.</p>
      <div class="arrival-entry"><button id="enter-room" class="enter-button" disabled><span id="enter-label">Opening the room</span><span class="enter-arrow">${icon('arrow')}</span></button><p id="load-note" class="arrival-note" role="status">Opening the curtains…</p></div>
    </div>
    <div class="arrival-bottom"><span>TAKE YOUR TIME. STAY A WHILE.</span><button id="arrival-sound" class="quiet-button" aria-pressed="true">${icon('volume')}<span>Sound on</span></button></div>
  </div>
  <div id="room-ui" class="room-ui" inert>
    <header class="room-header">
      <button class="wordmark" data-action="room" aria-label="Return to the room"><span>a little room<span class="wordmark-dot">.</span></span><small>THOUGHTS, CODE & LITTLE THINGS</small></button>
    </header>
    <aside id="music-card" class="music-card hidden-card" aria-label="Radio player" aria-hidden="true" inert>
      <div class="music-topline"><button id="music-expand" class="music-expand" aria-expanded="false"><span class="equalizer" aria-hidden="true"><i></i><i></i><i></i><i></i></span> ROOM RADIO</button><button id="music-hide" class="tiny-button" aria-label="Hide music card">${icon('close')}</button></div>
      <div class="music-info"><img src="/assets/city-view.jpg" class="album-art" alt="Painted Osaka river"><div><p id="track-title">Window Seat</p><span id="track-artist">Original room sessions</span></div></div>
      <div class="music-progress"><input id="song-seek" aria-label="Song position" type="range" min="0" max="100" value="0" step="0.1"><span id="song-time">0:00</span></div>
      <div class="music-controls"><button id="song-rewind" aria-label="Rewind ten seconds">${icon('rewind')}</button><div><button id="song-prev" aria-label="Previous track">${icon('previous')}</button><button id="song-play" class="play-button" aria-label="Play radio">${icon('play')}</button><button id="song-next" aria-label="Next track">${icon('next')}</button></div><button id="song-mute" aria-label="Mute radio">${icon('volume')}</button></div>
      <div class="music-extra"><p id="track-mood">A little afternoon daydream.</p><label class="volume-label">Volume <input id="song-volume" type="range" min="0" max="1" step="0.01" value="0.3" aria-label="Radio volume"></label><div class="track-list">${tracks.map((t,i)=>`<button data-track="${i}" class="${i===0?'selected':''}"><span>0${i+1}</span>${t.title}<span class="track-playing">${icon('play')}</span></button>`).join('')}</div></div>
    </aside>
    <div id="object-label" class="object-label" role="status"></div>
    <div id="hotspots" class="hotspots"></div><button id="pan-left" class="room-pan left" aria-label="Look left">${icon('back')}</button><button id="pan-right" class="room-pan right" aria-label="Look right">${icon('back')}</button>
    <footer class="room-footer"><div class="room-caption"><span id="room-instructions">Make yourself at home.</span><small>Drag or scroll sideways to explore.</small></div>
      <nav id="dock" class="dock" aria-label="Room shortcuts"><span class="dock-glass" aria-hidden="true"></span><svg class="dock-edge" aria-hidden="true" preserveAspectRatio="none"><path fill="none"/></svg>${[['room','room','The room'],['laptop','laptop','Projects & labs'],['awards','trophy','Awards'],['radio','radio','Room radio'],['clock','clock','Time of day']].map(([action,ico,label],i)=>`<button data-action="${action}" class="dock-item ${i===0?'active':''}" aria-label="${label}"><span class="dock-tooltip">${label}</span>${icon(ico)}<span class="dock-dot"></span></button>`).join('')}<span class="dock-divider"></span><button data-action="lamp" class="dock-item" aria-label="Turn desk lamp off" aria-pressed="true"><span class="dock-tooltip">Desk lamp</span>${icon('lamp')}<span class="dock-dot"></span></button></nav>
      <div class="room-tools"><button id="guide-toggle" class="help-button" aria-label="Show interactive objects" aria-pressed="false">${icon('help')}<span>Look around</span></button></div>
    </footer>
  </div>
  <dialog id="computer" class="computer-dialog" aria-labelledby="computer-title">
    <div class="computer-camera" aria-hidden="true"></div><div class="computer-screen">
      <header class="os-bar"><span><b class="os-logo">m.</b><strong id="computer-title">My workspace</strong></span><span><span id="os-time"></span><button class="os-close" data-close aria-label="Close laptop and return to room">${icon('close')}</button></span></header>
      <div class="desktop"><div class="desktop-greeting"><p class="eyebrow">A FEW THINGS I'VE BEEN WORKING ON</p><h2>Ideas, in progress<span>.</span></h2><p>One folder at a time.</p></div><div class="desktop-folders">${[['projects','Projects','folder'],['labs','Labs','lab'],['notes','Field notes','note']].map(([id,label,ico])=>`<button class="desktop-folder ${id}" data-folder="${id}"><span class="folder-symbol">${icon(ico)}</span><span>${label}</span><small>${portfolio[id].length} ${id==='notes'?'notes':'items'}</small></button>`).join('')}</div><span class="desktop-sticker">a work in progress ✳</span><div id="finder" class="finder" hidden></div></div>
      <footer class="os-footer"><span>${icon('folder')} Personal / Computer science</span><span>Curiosity lives here.</span></footer>
    </div><div class="computer-chin">TAKE A LOOK AROUND</div>
  </dialog>
  <dialog id="detail" class="detail-dialog" aria-labelledby="detail-title"><button class="dialog-close" data-close aria-label="Return to room">${icon('close')}</button><div id="detail-content"></div></dialog>
  <dialog id="clock-panel" class="clock-dialog" aria-labelledby="clock-title"><button class="dialog-close" data-close aria-label="Close clock">${icon('close')}</button><p class="eyebrow">THE WORLD OUTSIDE</p><h2 id="clock-title">A different hour.</h2><p class="clock-intro">Let the afternoon linger.<br>Or stay until the city falls asleep.</p><div class="clock-readout"><span id="clock-time">00:00</span><span id="clock-phase">Daylight</span></div><label for="time-slider" class="sr-only">Choose the room time</label><input id="time-slider" class="time-slider" type="range" min="0" max="1439" step="1" value="720"><div class="time-scale"><span>00:00</span>${icon('sun')}<span>23:59</span></div><div class="time-presets"><button data-time="sunrise">First light</button><button data-time="noon">Midday</button><button data-time="sunset">Golden hour</button><button data-time="night">After hours</button></div><div class="live-clock-row"><span id="clock-status">Following Osaka time</span><button id="return-live">${icon('clock')} Back to now</button></div><p class="clock-footnote">OSAKA, JAPAN · JST / UTC+9</p></dialog>
  <div id="toast" class="toast" role="status" aria-live="polite"></div>
`;

const audio = new Audio(tracks[0].src);
audio.preload = 'metadata';
audio.volume = 0.3;
let scene;
let toastTimer;
const notify = (message) => { $('#toast').textContent = message; $('#toast').classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(()=>$('#toast').classList.remove('show'), 4200); };
const safeURL = (value, email=false) => { if(email) return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? `mailto:${value}` : null; try { const u=new URL(value); return ['https:','http:'].includes(u.protocol)?u.href:null; }catch{return null;} };

function syncMusic() {
  const playing = !audio.paused && !audio.ended;
  state.music = playing;
  $('#music-card').classList.toggle('is-playing', playing);
  $('#song-play').innerHTML=icon(playing?'pause':'play');
  $('#song-play').setAttribute('aria-label',playing?'Pause radio':'Play radio');
  scene?.setMusic(playing);
}
async function playMusic() {
  try { await audio.play(); } catch { notify('Press play on the radio to start the music.'); }
  syncMusic();
}
function setTrack(index, play = true) {
  state.track = (index + tracks.length) % tracks.length;
  const t=tracks[state.track]; audio.src=t.src; audio.load();
  $('#track-title').textContent=t.title;$('#track-artist').textContent=t.artist; $('#track-mood').textContent=t.mood;
  $('#song-seek').value=0; $('#song-time').textContent='0:00';
  $$('.track-list button').forEach((b,i)=>b.classList.toggle('selected',i===state.track));
  if('mediaSession' in navigator && typeof MediaMetadata !== 'undefined') navigator.mediaSession.metadata=new MediaMetadata({title:t.title,artist:t.artist,album:'A room in Osaka'});
  if(play) playMusic();
}
audio.addEventListener('play',syncMusic); audio.addEventListener('pause',syncMusic);
audio.addEventListener('ended',()=>setTrack(state.track+1));
audio.addEventListener('error',()=>{syncMusic();if(state.entered)notify('This track could not load. Try the next one.');});
audio.addEventListener('timeupdate',()=>{if(Number.isFinite(audio.duration)&&audio.duration>0)$('#song-seek').value=audio.currentTime/audio.duration*100;$('#song-time').textContent=`${Math.floor(audio.currentTime/60)}:${String(Math.floor(audio.currentTime%60)).padStart(2,'0')}`;});
$('#song-play').onclick=()=>audio.paused?playMusic():audio.pause();
$('#song-next').onclick=()=>setTrack(state.track+1);
$('#song-prev').onclick=()=>audio.currentTime>3?(audio.currentTime=0):setTrack(state.track-1);
$('#song-rewind').onclick=()=>{audio.currentTime=Math.max(0,audio.currentTime-10);};
$('#song-seek').oninput=e=>{if(Number.isFinite(audio.duration))audio.currentTime=Number(e.target.value)/100*audio.duration;};
$('#song-volume').oninput=e=>{audio.volume=Number(e.target.value);audio.muted=false;syncMute();};
function syncMute(){state.muted=audio.muted;$('#song-mute').innerHTML=icon(audio.muted?'mute':'volume');$('#song-mute').setAttribute('aria-label',audio.muted?'Unmute radio':'Mute radio');}
$('#song-mute').onclick=()=>{audio.muted=!audio.muted;syncMute();};
const musicCard=$('#music-card');
let radioReturnFocus=null;
function syncDock(){const active=state.panel==='#computer'?'laptop':state.panel==='#clock-panel'?'clock':state.panel==='#detail'&&$('#detail-content .trophy-symbol')?'awards':!musicCard.classList.contains('hidden-card')?'radio':'room';$$('.dock-item').forEach(b=>{const selected=b.dataset.action===active;b.classList.toggle('active',selected);if(b.dataset.action!=='lamp'&&b.dataset.action!=='room')b.setAttribute('aria-expanded',String(selected));});}
function closeRadio(restoreFocus=false){musicCard.classList.add('hidden-card');musicCard.setAttribute('aria-hidden','true');musicCard.inert=true;musicCard.style.setProperty('--tilt-x','0deg');musicCard.style.setProperty('--tilt-y','0deg');syncDock();if(restoreFocus)radioReturnFocus?.focus?.({preventScroll:true});}
function openRadio(){if(musicCard.classList.contains('hidden-card'))radioReturnFocus=document.activeElement?.matches?.('[data-action="radio"],[data-object="radio"]')?document.activeElement:$('#dock [data-action="radio"]');scene?.reveal('radio');musicCard.classList.remove('hidden-card');musicCard.setAttribute('aria-hidden','false');musicCard.inert=false;syncDock();$('#song-play').focus({preventScroll:true});}
$('#music-hide').onclick=()=>closeRadio(true);
// Dismiss before the canvas pointer-up opens a newly pressed radio. Outside clicks
// remain available to the room, so selecting another object works in one gesture.
document.addEventListener('pointerdown',e=>{if(!musicCard.contains(e.target))closeRadio();});
document.addEventListener('focusin',e=>{if(!musicCard.contains(e.target)&&!e.target.closest('[data-action="radio"],[data-object="radio"]'))closeRadio();});
musicCard.addEventListener('pointermove',e=>{if(reduced||e.pointerType==='touch')return;const r=musicCard.getBoundingClientRect(),x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;musicCard.style.setProperty('--tilt-x',`${-y*9}deg`);musicCard.style.setProperty('--tilt-y',`${x*12}deg`);musicCard.style.setProperty('--shine-x',`${(x+.5)*100}%`);musicCard.style.setProperty('--shine-y',`${(y+.5)*100}%`);});
musicCard.addEventListener('pointerleave',()=>{musicCard.style.setProperty('--tilt-x','0deg');musicCard.style.setProperty('--tilt-y','0deg');});
$('#music-expand').onclick=()=>{const on=$('#music-card').classList.toggle('expanded');$('#music-expand').setAttribute('aria-expanded',String(on));};
$$('[data-track]').forEach(b=>b.onclick=()=>setTrack(Number(b.dataset.track)));
if('mediaSession' in navigator) {
  for(const [action,fn] of Object.entries({play:playMusic,pause:()=>audio.pause(),previoustrack:()=>setTrack(state.track-1),nexttrack:()=>setTrack(state.track+1),seekbackward:()=>{audio.currentTime=Math.max(0,audio.currentTime-10);}})) {try {navigator.mediaSession.setActionHandler(action,fn);}catch{}}
}

let soundOn = true;
$('#arrival-sound').onclick=()=>{soundOn=!soundOn;$('#arrival-sound').setAttribute('aria-pressed',String(soundOn));$('#arrival-sound').innerHTML=`${icon(soundOn?'volume':'mute')}<span>Sound ${soundOn?'on':'off'}</span>`;};
$('#enter-room').onclick=()=>{
  if(!state.ready||state.entered)return;
  state.entered=true;
  if(soundOn)playMusic();
  document.body.classList.add('entered');
  $('#room-ui').inert=false;
  scene.enter();
  $('#arrival').classList.add('leaving');
  setTimeout(()=>{$('#arrival').hidden=true;$('.wordmark').focus({preventScroll:true});},reduced?0:1100);
};

function updateTime() {
  const date=runningRoomDate(state.manualTime);
  const minute=minutesInOsaka(date), label=timeLabel(minute), light=sunState(date);
  $('#arrival-time').textContent=`${timeLabel(minutesInOsaka())} JST`;
  $('#os-time').textContent=`${timeLabel(minutesInOsaka())} JST`;
  $('#clock-time').textContent=label;$('#clock-phase').textContent=light.label;
  $('#clock-status').textContent=state.manualTime===null?'Following Osaka time':'Time is running from your chosen hour';
  if(document.activeElement!==$('#time-slider'))$('#time-slider').value=minute;
  $('#return-live').disabled=state.manualTime===null;
  document.body.classList.toggle('is-night',light.daytime<.35);
  scene?.setTime(date,light);
}
$('#time-slider').oninput=e=>{state.manualTime=startTimePreview(Number(e.target.value));updateTime();};
$('#return-live').onclick=()=>{state.manualTime=null;updateTime();};
$$('[data-time]').forEach(b=>b.onclick=()=>{const s=sunState(new Date());state.manualTime=startTimePreview({sunrise:Math.round(s.sunrise+18),noon:720,sunset:Math.round(s.sunset-32),night:1260}[b.dataset.time]);updateTime();});
setInterval(updateTime,1000);

const objectActions = {laptop:['Open the MacBook','laptop'],awards:['A few milestones','trophy'],radio:['Room radio','radio'],lamp:['A warmer corner','lamp'],clock:['Borrow a different hour','clock'],linkedin:['LinkedIn','linkedin'],github:['GitHub','github'],email:['Say hello','mail'],about:['A little about me','note'],cat:['Say hello to the cat','heart']};
for(const [action,[label,ico]] of Object.entries(objectActions)){
  const b=document.createElement('button');b.className='object-hotspot';b.dataset.object=action;b.setAttribute('aria-label',label);b.innerHTML=`${icon(ico)}<span>${label}</span>`;b.onclick=()=>activate(action);b.onfocus=()=>scene?.setHover(action);b.onblur=()=>scene?.setHover(null);$('#hotspots').append(b);
}
$('#pan-left').onclick=()=>scene?.panBy(-1);$('#pan-right').onclick=()=>scene?.panBy(1);
$('#guide-toggle').onclick=()=>{state.guide=!state.guide;$('#hotspots').classList.toggle('show-all',state.guide);$('#guide-toggle').setAttribute('aria-pressed',String(state.guide));};

function showDialog(id) { previousFocus=document.activeElement;state.panel=id;$('#room-ui').inert=true;document.body.classList.add('panel-open');$(id).showModal();syncDock(); }
async function closeDialog() {
  if(!state.panel)return;
  const id=state.panel;state.panel=null;
  $(id).classList.add('closing');
  await new Promise(r=>setTimeout(r,reduced?0:230));
  $(id).close();$(id).classList.remove('closing');document.body.classList.remove('panel-open');$('#room-ui').inert=false;
  syncDock();
  if(id==='#computer')await scene?.focusLaptop(false);
  previousFocus?.focus?.({preventScroll:true});
}
$$('dialog').forEach(d=>{d.addEventListener('cancel',e=>{e.preventDefault();closeDialog();});d.addEventListener('click',e=>{if(e.target===d){const b=d.getBoundingClientRect();if(e.clientX<b.left||e.clientX>b.right||e.clientY<b.top||e.clientY>b.bottom)closeDialog();}});});
$$('[data-close]').forEach(b=>b.onclick=closeDialog);

function openFolder(id) {
  state.folder=id;
  const labels={projects:'Projects',labs:'Labs',notes:'Field notes'};
  const sub={projects:'Things built with a little curiosity.',labs:'Experiments, prototypes, and happy accidents.',notes:'Things learned along the way.'};
  const empty={projects:'The next idea is taking shape.',labs:'A space for experiments.',notes:'A fresh page.'};
  const items=portfolio[id];
  $('#finder').innerHTML=`<header class="finder-bar"><div><button id="folder-back" aria-label="Back to desktop">${icon('back')}</button>${icon('folder')}<strong>${labels[id]}</strong></div><button id="folder-close" aria-label="Close folder">${icon('close')}</button></header><div class="finder-body"><aside class="finder-sidebar"><small>ON THIS LAPTOP</small>${Object.keys(labels).map(k=>`<button data-finder="${k}" class="${k===id?'selected':''}">${icon(k==='labs'?'lab':k==='notes'?'note':'folder')}${labels[k]}</button>`).join('')}</aside><section class="finder-main"><p class="eyebrow">${id==='labs'?'EXPLORATIONS':'PERSONAL COLLECTION'}</p><h3>${labels[id]}</h3><p>${sub[id]}</p>${items.length?`<div class="project-grid">${items.map(p=>{const u=safeURL(p.url);return `<article class="project-card">${icon('folder')}<h4>${escape(p.title)}</h4><p>${escape(p.description||'')}</p><div class="tags">${(p.tags||[]).map(t=>`<span>${escape(t)}</span>`).join('')}</div>${u?`<a href="${escape(u)}" target="_blank" rel="noopener noreferrer">Open project ${icon('link')}</a>`:''}</article>`;}).join('')}</div>`:`<div class="folder-empty">${icon(id==='labs'?'lab':id==='notes'?'note':'folder')}<h4>${empty[id]}</h4><p>${id==='projects'?'Projects will be added here.':id==='labs'?'Computer science explorations will live here.':'Notes will find their way here soon.'}</p><span>NOT ADDED YET</span></div>`}</section></div><footer class="finder-footer">${items.length} items <span>Personal / ${labels[id]}</span></footer>`;
  $('#finder').hidden=false;
  $('#folder-back').onclick=$('#folder-close').onclick=()=>{$('#finder').hidden=true;state.folder=null;$(`[data-folder="${id}"]`).focus();};
  $$('[data-finder]').forEach(b=>b.onclick=()=>openFolder(b.dataset.finder));
  $('#folder-back').focus();
}
$$('[data-folder]').forEach(b=>b.onclick=()=>openFolder(b.dataset.folder));

async function activate(action) {
  if(!state.entered || state.panel || scene?.busy)return;
  if(action!=='radio')closeRadio();
  scene?.nudge(action);
  if(action==='laptop'){
    await scene?.focusLaptop(true);if(!state.entered)return;showDialog('#computer');
  } else if(action==='room'){
    scene?.reset();state.guide=false;$('#hotspots').classList.remove('show-all');$('#guide-toggle').setAttribute('aria-pressed','false');
  } else if(action==='clock'){updateTime();showDialog('#clock-panel');
  } else if(action==='lamp'){
    state.lamp=!state.lamp;scene?.setLamp(state.lamp);
    const b=$('[data-action="lamp"]');b.setAttribute('aria-pressed',String(state.lamp));b.setAttribute('aria-label',`Turn desk lamp ${state.lamp?'off':'on'}`);notify(state.lamp?'A little warmer.':'Let the window do the lighting.');
  } else if(action==='radio'){
    openRadio();
  } else if(action==='cat'){
    scene?.petCat();
  } else if(action==='awards'){
    $('#detail-content').innerHTML=`<div class="detail-symbol trophy-symbol">${icon('trophy')}</div><p class="eyebrow">ON THE SHELF</p><h2 id="detail-title">Little milestones.</h2><p class="detail-subtitle">A collection of moments worth keeping.</p>${portfolio.awards.length?`<div class="award-list">${portfolio.awards.map(a=>`<article><span>${escape(a.year)}</span><div><h3>${escape(a.title)}</h3><small>${escape(a.organization||'')}</small><p>${escape(a.description||'')}</p></div></article>`).join('')}</div>`:`<div class="paper-empty"><span>THE COLLECTION IS ON ITS WAY</span><p>Awards and achievements<br>will be placed here.</p></div>`}<p class="hand-note">More than a shiny thing on a shelf.</p>`;showDialog('#detail');
  } else if(['linkedin','github','email'].includes(action)){
    const info={linkedin:['LinkedIn','For professional hellos.'],github:['GitHub','Where ideas become commits.'],email:['Say hello.','Good things often start with a hello.']}[action];
    const u=safeURL(portfolio.contacts[action],action==='email');
    $('#detail-content').innerHTML=`<div class="detail-symbol contact-symbol ${action}">${icon(action==='email'?'mail':action)}</div><p class="eyebrow">LET'S CONNECT</p><h2 id="detail-title">${info[0]}</h2><p class="detail-subtitle">${info[1]}</p>${u?`<a class="primary-link" href="${escape(u)}" ${action==='email'?'':'target="_blank" rel="noopener noreferrer"'}>${action==='email'?'Write an email':'Visit my profile'}${icon('link')}</a>`:`<div class="paper-empty"><span>CONTACT DETAILS COMING SOON</span><p>${action==='email'?'An email address':`A ${info[0]} profile`} hasn't been added yet.</p></div>`}<p class="hand-note">Thanks for stopping by.</p>`;showDialog('#detail');
  } else if(action==='about'){
    $('#detail-content').innerHTML=`<div class="detail-symbol">${icon('note')}</div><p class="eyebrow">A PAGE FROM THE NOTEBOOK</p><h2 id="detail-title">Hello${portfolio.name?`, I'm ${escape(portfolio.name)}`:' there'}.</h2><p class="detail-subtitle">${portfolio.introduction?escape(portfolio.introduction):'A home for code, curiosity, and things still in progress.'}</p><p class="notebook-copy">${portfolio.introduction?'':'A personal introduction will be added here.'}</p><p class="hand-note">Make yourself at home.</p>`;showDialog('#detail');
  }
}
$$('[data-action]').forEach(b=>b.onclick=()=>activate(b.dataset.action));
const dock=$('#dock');
for(const[action,id]of Object.entries({laptop:'computer',awards:'detail',radio:'music-card',clock:'clock-panel'})){$(`#dock [data-action="${action}"]`).setAttribute('aria-controls',id);}
syncDock();
mountGlassDock(dock,reduced);
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!state.panel&&state.entered){closeRadio(true);state.guide=false;$('#hotspots').classList.remove('show-all');$('#guide-toggle').setAttribute('aria-pressed','false');}});

function onFailure(error) {
  console.error('Room could not load',error);
  $('#load-note').textContent='The room could not open. Please try again.';
  $('#enter-label').textContent='Try again';$('#enter-room').disabled=false;$('#enter-room').onclick=()=>location.reload();
  $('#arrival-sound').hidden=true;
}
try {
  scene=new RoomScene($('#room-canvas'),{
    onAction:activate,
    onHover:(action,x,y)=>{const el=$('#object-label');$$('[data-object]').forEach(b=>b.classList.toggle('is-hovered',b.dataset.object===action));if(action&&state.entered&&!state.panel){el.textContent=objectActions[action]?.[0]||'';el.style.left=`${Math.min(innerWidth-180,Math.max(16,x+18))}px`;el.style.top=`${y-40}px`;el.classList.add('visible');}else el.classList.remove('visible');},
    onProject:(positions)=>{
      for(const[id,p]of Object.entries(positions)){const b=$(`[data-object="${id}"]`);if(b){b.style.left=`${p.x}px`;b.style.top=`${p.y}px`;b.style.visibility=p.visible?'visible':'hidden';}}
      const p=positions.radioTop;if(p){const width=Math.min(224,Math.max(178,(positions.radioWidth||125)*1.52));musicCard.style.width=`${width}px`;const h=musicCard.offsetHeight||185;musicCard.style.left=`${Math.max(12,Math.min(innerWidth-width-12,p.x-width/2))}px`;musicCard.style.top=`${Math.max(14,Math.min(innerHeight-h-100,p.y-h-10))}px`;musicCard.style.setProperty('--origin-x',`${Math.max(15,Math.min(width-15,p.x-parseFloat(musicCard.style.left)))}px`);}
      if(positions.pan){$('#pan-left').hidden=!positions.pan.left;$('#pan-right').hidden=!positions.pan.right;}
    },
    onContextLost:()=>notify('The room paused. Your browser is restoring the scene.'),
  });
  updateTime();
  scene.load().then(()=>{state.ready=true;$('#enter-label').textContent='Enter the room';$('#enter-room').disabled=false;$('#load-note').textContent='The door is open.';$('#arrival').classList.add('ready');updateTime();}).catch(onFailure);
}catch(error){onFailure(error);}

// Public content stays in content.js; no credentials or private data are required.
