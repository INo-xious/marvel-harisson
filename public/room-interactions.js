// Room objects own their controls. Only one small, non-modal preview is open.
export function createRoomInteractions({contacts,tracks,onLamp,onOpen=()=>{},lampOn=true,reduced=false,getTime=()=>({minutes:720,live:true}),onTime=()=>{}}) {
 const make=(tag,cls,text)=>{const el=document.createElement(tag);if(cls)el.className=cls;if(text!==undefined)el.textContent=text;return el;};
 const popup=make('section','room-popup');popup.hidden=true;popup.setAttribute('role','dialog');popup.setAttribute('aria-modal','false');
 const status=make('p','room-sr-only');status.setAttribute('role','status');document.body.append(popup,status);
 let active=null,origin=null,track=0,loading=false;
 const audio=new Audio();audio.preload='none';audio.volume=.45;
 const buttons=new Map();
 function close({focus=false}={}){const previous=origin;popup.hidden=true;active=null;origin=null;buttons.forEach(button=>{if(button.hasAttribute('aria-haspopup'))button.setAttribute('aria-expanded','false');});if(focus)previous?.focus({preventScroll:true});}
 function position(){if(!clockHint.hidden){const rect=clock.getBoundingClientRect();clockHint.style.left=Math.max(12,Math.min(innerWidth-220,rect.left+rect.width/2-110))+'px';clockHint.style.top=(rect.bottom+7)+'px';}if(popup.hidden||!origin)return;const box=origin.getBoundingClientRect(),width=popup.offsetWidth,height=popup.offsetHeight;const left=Math.max(12,Math.min(innerWidth-width-12,box.left+box.width/2-width/2));const above=box.top-height-12;popup.dataset.side=above>=12?'above':'below';popup.style.left=`${left}px`;popup.style.top=`${Math.max(12,Math.min(innerHeight-height-12,above>=12?above:box.bottom+12))}px`;popup.style.setProperty('--popup-origin',`${Math.max(20,Math.min(width-20,box.left+box.width/2-left))}px`);}
 function show(id,button){if(active===id){close();return false;}close();onOpen();active=id;origin=button;button.setAttribute('aria-expanded','true');popup.replaceChildren();popup.hidden=false;return true;}
 function openContact(id,label,button){
  if(!show(id,button))return;
  popup.className='room-popup room-url-preview';popup.setAttribute('aria-label',`${label} website preview`);
  const value=contacts[id],link=make('a','room-url-link');link.href=id==='email'?`mailto:${value}`:value;
  if(id!=='email'){link.target='_blank';link.rel='noopener noreferrer';}
  const image=make('img','room-site-snapshot');image.src=`/assets/previews/${id==='email'?'gmail':id}.webp`;image.alt=`${label} website screenshot`;image.width=640;image.height=360;
  const bar=make('span','room-preview-browser');bar.append(make('span','room-preview-dots','● ● ●'),make('span','',id==='email'?'gmail.com':new URL(value).hostname));
  const caption=make('span','room-preview-caption');caption.append(make('span','room-url-title',label+' ↗'),make('span','room-url-address',id==='email'?value:value.replace(/^https?:\/\//,'').replace(/\/$/,'')));
  if(id==='linkedin')caption.append(make('span','room-preview-note','LinkedIn may ask you to sign in.'));
  if(id==='email')caption.append(make('span','room-preview-note','Gmail website preview · click to open an email.'));
  caption.append(make('span','room-snapshot-date','Page captured 3 Nov 2026'));
  link.append(bar,image,caption);link.addEventListener('click',()=>close());popup.append(link);image.onload=position;position();
 }
 const glyphs={play:'M8 5v14l11-7z',pause:'M6 5h4v14H6zm8 0h4v14h-4z',previous:'M6 5h2v14H6zm13 0v14L9 12z',next:'M16 5h2v14h-2zM5 5v14l10-7z'};
 function icon(button,kind){button.replaceChildren();const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','0 0 24 24');svg.setAttribute('aria-hidden','true');const path=document.createElementNS(svg.namespaceURI,'path');path.setAttribute('d',glyphs[kind]);svg.append(path);button.append(svg);}
 const play=make('button','radio-play','Play'),name=make('p','radio-title'),artist=make('p','radio-artist'),seek=make('input','radio-seek'),time=make('span','radio-time','0:00 / 0:00'),message=make('p','radio-message');
 seek.type='range';seek.min=0;seek.max=100;seek.step=.1;seek.value=0;seek.setAttribute('aria-label','Song progress');seek.disabled=true;
 const volume=make('input','radio-volume');volume.type='range';volume.min=0;volume.max=1;volume.step=.01;volume.value=audio.volume;volume.setAttribute('aria-label','Volume');
 const art=make('div','radio-cover');art.setAttribute('aria-hidden','true');art.append(make('span','radio-cover-word','room sessions'),make('span','radio-cover-caption','OSAKA · VOL. 01'));
 const playlist=make('select','radio-playlist');playlist.setAttribute('aria-label','Choose a song');tracks.forEach((item,index)=>{const option=make('option','',item.title);option.value=String(index);playlist.append(option);});playlist.onchange=()=>select(Number(playlist.value),!audio.paused);
 const format=value=>Number.isFinite(value)?`${Math.floor(value/60)}:${String(Math.floor(value%60)).padStart(2,'0')}`:'0:00';
 function update(){const current=tracks[track];name.textContent=current?.title||'No songs yet';artist.textContent=current?.artist||'';icon(play,audio.paused?'play':'pause');play.dataset.loading=String(loading);play.setAttribute('aria-label',audio.paused?'Play song':'Pause song');play.disabled=!current;const duration=audio.duration;seek.disabled=!Number.isFinite(duration)||duration<=0;if(!seek.matches(':active'))seek.value=Number.isFinite(duration)&&duration>0?audio.currentTime/duration*100:0;time.textContent=`${format(audio.currentTime)} / ${format(duration)}`;buttons.get('radio')?.setAttribute('data-playing',String(!audio.paused));art.dataset.track=String(track);playlist.value=String(track);}
 function select(index,autoplay=false){if(!tracks.length)return;track=(index+tracks.length)%tracks.length;audio.src=tracks[track].src;message.textContent='';update();if(autoplay)start();}
 async function start(){if(!audio.getAttribute('src'))select(track);loading=true;update();try{await audio.play();message.textContent='';}catch{message.textContent='Playback could not start. Try Play again.';}finally{loading=false;update();}}
 play.onclick=()=>audio.paused?start():audio.pause();
 const previous=make('button','','‹'),next=make('button','','›');previous.setAttribute('aria-label','Previous song');next.setAttribute('aria-label','Next song');previous.onclick=()=>select(track-1,true);next.onclick=()=>select(track+1,true);icon(previous,'previous');icon(next,'next');
 seek.oninput=()=>{if(Number.isFinite(audio.duration))audio.currentTime=Number(seek.value)/100*audio.duration;update();};volume.oninput=()=>{audio.volume=Number(volume.value);};
 for(const event of ['play','pause','loadedmetadata','timeupdate','durationchange','emptied'])audio.addEventListener(event,update);
 audio.addEventListener('ended',()=>select(track+1,true));audio.addEventListener('error',()=>{loading=false;message.textContent='This song is unavailable. Try the next one.';update();});
 function openRadio(button){if(!show('radio',button))return;popup.className='room-popup room-radio';popup.setAttribute('aria-label','Room radio player');const heading=make('div','radio-heading');heading.append(make('span','radio-label','♫  ROOM SESSIONS'));const dismiss=make('button','radio-dismiss','×');dismiss.setAttribute('aria-label','Close radio player');dismiss.onclick=()=>close({focus:true});heading.append(dismiss);const transport=make('div','radio-transport');transport.append(previous,play,next);const timeline=make('div','radio-timeline');timeline.append(seek,time);const volumeRow=make('label','radio-volume-row');volumeRow.append(make('span','','Volume'),volume);popup.append(heading,art,name,artist,timeline,transport,volumeRow,playlist,message);update();position();}
 const clockLabel=minutes=>`${String(Math.floor(minutes/60)%24).padStart(2,'0')}:${String(Math.floor(minutes)%60).padStart(2,'0')}`;
 const wrap=value=>(Math.round(value)%1440+1440)%1440;
 function updateClock(){const state=getTime();clock.setAttribute('aria-valuenow',String(Math.round(state.minutes)));clock.setAttribute('aria-valuetext',`${clockLabel(state.minutes)} in Osaka${state.live?', live time':', chosen time'}`);}
 function objectButton(id,label){const button=make('button','room-object-hit');button.type='button';button.hidden=true;button.setAttribute('aria-label',label);button.setAttribute('aria-haspopup','dialog');button.setAttribute('aria-expanded','false');document.body.append(button);buttons.set(id,button);return button;}
 const lamp=objectButton('lamp','Toggle desk lamp');lamp.removeAttribute('aria-haspopup');lamp.removeAttribute('aria-expanded');lamp.setAttribute('aria-pressed',String(lampOn));lamp.onclick=()=>{close();lampOn=!lampOn;lamp.setAttribute('aria-pressed',String(lampOn));onLamp(lampOn);status.textContent=lampOn?'Desk lamp on':'Desk lamp off';};
 const clock=objectButton('clock','Adjust painted clock hands');clock.classList.add('room-clock-hit');clock.removeAttribute('aria-haspopup');clock.removeAttribute('aria-expanded');clock.setAttribute('role','slider');clock.setAttribute('aria-valuemin','0');clock.setAttribute('aria-valuemax','1439');
 const clockHint=make('span','clock-hand-hint','Drag the hands · double-click for live time');clockHint.id='painted-clock-help';clockHint.hidden=true;document.body.append(clockHint);clock.setAttribute('aria-describedby',clockHint.id);
 clock.onpointerenter=()=>{clockHint.hidden=false;position();};clock.onpointerleave=()=>{clockHint.hidden=true;};clock.onfocus=()=>{if(clock.matches(':focus-visible')){clockHint.hidden=false;position();}};clock.onblur=()=>{clockHint.hidden=true;};
 let clockDrag=null;
 const pointOnClock=event=>{const box=clock.getBoundingClientRect();return {x:(event.clientX-box.left-box.width/2)/(box.width/2),y:(event.clientY-box.top-box.height/2)/(box.height/2)};};
 const angleOf=point=>Math.atan2(point.x,-point.y);
 function handDistance(point,angle,length){const end={x:Math.sin(angle)*length,y:-Math.cos(angle)*length};const t=Math.max(0,Math.min(1,(point.x*end.x+point.y*end.y)/(length*length)));return Math.hypot(point.x-end.x*t,point.y-end.y*t);}
 clock.onpointerdown=event=>{
  if(event.button!==0)return;close();onOpen();event.preventDefault();
  const point=pointOnClock(event),minutes=getTime().minutes,minuteAngle=minutes%60/60*Math.PI*2,hourAngle=minutes%720/720*Math.PI*2;
  const hour=handDistance(point,hourAngle,.59),minute=handDistance(point,minuteAngle,.86);
  clockDrag={minutes,angle:angleOf(point),rotation:0,hour:hour<minute&&hour<.22};clock.setPointerCapture?.(event.pointerId);clock.classList.add('is-turning');
 };
 clock.onpointermove=event=>{if(!clockDrag)return;const angle=angleOf(pointOnClock(event));let delta=angle-clockDrag.angle;if(delta>Math.PI)delta-=2*Math.PI;if(delta< -Math.PI)delta+=2*Math.PI;clockDrag.rotation+=delta;clockDrag.angle=angle;onTime(wrap(clockDrag.minutes+clockDrag.rotation/(2*Math.PI)*(clockDrag.hour?720:60)));updateClock();};
 const finishClock=event=>{if(!clockDrag)return;clockDrag=null;clock.classList.remove('is-turning');if(clock.hasPointerCapture?.(event.pointerId))clock.releasePointerCapture(event.pointerId);status.textContent=`Room time ${clockLabel(getTime().minutes)}`;};
 clock.onpointerup=finishClock;clock.onpointercancel=finishClock;
 clock.ondblclick=()=>{clockDrag=null;onTime(null);updateClock();status.textContent='Clock returned to live Osaka time';};
 clock.onkeydown=event=>{const steps={ArrowRight:5,ArrowLeft:-5,ArrowUp:60,ArrowDown:-60};if(event.key==='Home'){event.preventDefault();onTime(null);}else if(event.key in steps){event.preventDefault();onTime(wrap(getTime().minutes+steps[event.key]));}else return;updateClock();};
 updateClock();
 const radio=objectButton('radio','Open room radio');radio.onclick=()=>openRadio(radio);
 document.addEventListener('pointerdown',event=>{if(active&&!popup.contains(event.target)&&event.target!==origin&&!origin?.contains(event.target))close();},true);
 document.addEventListener('keydown',event=>{if(event.key==='Escape'&&active){event.preventDefault();close({focus:true});}});
 document.addEventListener('focusin',event=>{if(active&&!popup.contains(event.target)&&event.target!==origin)close();});
 popup.addEventListener('pointermove',event=>event.stopPropagation());
 addEventListener('resize',position);
 return {lamp,radio,clock,updateClock,close,position,openContact,registerSocial(id,button){buttons.set(id,button);button.setAttribute('aria-expanded','false');},get isOpen(){return active!==null;},get active(){return active;},audio};
}
