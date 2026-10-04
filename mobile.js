

(function(){
  'use strict';

  const desktopDevice=window.__BR_DESKTOP_DEVICE__===true;
  if(desktopDevice)return;
  const SITE=window.TANEM_SITE_DATA;
  if(!SITE)throw new Error('TANEM_SITE_DATA must load before mobile.js');

  const font=document.createElement('link');
  font.rel='stylesheet';
  font.href='https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;1,500&family=Manrope:wght@400;500;600&display=swap';
  document.head.appendChild(font);

  const root=document.createElement('div');
  root.id='salon-mobile';
  root.innerHTML=`
    <header class="tn13-hero" id="tn13Top"></header>
    <section class="tn13-section tn13-portfolio" id="tn13Portfolio"></section>
    <section class="tn13-section tn13-services" id="tn13Services"></section>
    <section class="tn13-section tn13-team" id="tn13Team"></section>
    <section class="tn13-section tn13-reviews" id="tn13Reviews"></section>
    <section class="tn13-final" id="tn13Visit"></section>
    <footer class="tn13-footer"><div class="tn13-shell"><strong>SALON NAME</strong>Цифровой офис TANEM.RU</div></footer>
    <div class="tn13-sticky" id="tn13Sticky"></div>
    <div class="tn13-overlay" id="tn13Gallery"></div>
    <div class="tn13-sheet" id="tn13BookSheet" role="dialog" aria-modal="true" aria-labelledby="tn50BookTitle"><div class="tn13-panel"><button class="tn13-close" id="tn13BookClose" type="button" aria-label="Закрыть">×</button><p class="tn13-kicker">Запись</p><h2 class="tn50-book-title" id="tn50BookTitle">Как вам удобнее записаться?</h2><p class="tn50-book-copy">Выберите удобный способ связи.</p><div class="tn50-book-options"><a class="tn50-book-option" href="#tn13Visit" aria-disabled="true"><span class="tn50-book-icon phone"><svg aria-hidden="true"><use href="#stl-icon-phone"/></svg></span><span><strong>Телефон будет добавлен</strong></span><span class="tn50-book-arrow">→</span></a><a class="tn50-book-option" href="#tn13Visit" aria-disabled="true"><span class="tn50-book-icon viber-generic"><svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 5.5h14v10H9l-4 3v-13Z"/></svg></span><span><strong>Мессенджер будет добавлен</strong></span><span class="tn50-book-arrow">→</span></a></div></div></div>
  `;
  document.body.appendChild(root);

  const bookSheet=root.querySelector('#tn13BookSheet');
  const closeBook=()=>{
    bookSheet.classList.remove('open');
    document.body.style.overflow='';
  };
  root.querySelector('#tn13BookClose').addEventListener('click',closeBook);
  bookSheet.addEventListener('click',event=>{if(event.target===bookSheet)closeBook()});
  document.addEventListener('keydown',event=>{if(event.key==='Escape'&&bookSheet.classList.contains('open'))closeBook()});

  const sticky=root.querySelector('#tn13Sticky');
  const hero=root.querySelector('#tn13Top');
  const visit=root.querySelector('#tn13Visit');
  let scrollFrame=0;
  const syncSticky=()=>{
    scrollFrame=0;
    const heroDone=hero.getBoundingClientRect().bottom<=0;
    const finalNear=visit.getBoundingClientRect().top<=window.innerHeight+70;
    sticky.classList.toggle('show',heroDone&&!finalNear);
  };
  window.addEventListener('scroll',()=>{if(!scrollFrame)scrollFrame=requestAnimationFrame(syncSticky)},{passive:true});
  syncSticky();
})();

(function(){
'use strict';

if(window.__BR_DESKTOP_DEVICE__===true)return;
const root=document.getElementById('salon-mobile'); if(!root)return;
const SITE=window.TANEM_SITE_DATA;
if(!SITE)throw new Error('TANEM_SITE_DATA must load before mobile.js');
const localized=(value,lang='ru')=>{
  if(value==null)return '';
  if(typeof value==='string')return value;
  return value[lang]??value.ru??value.en??value.hy??'';
};
const russian=value=>localized(value,'ru');
const mediaItem=item=>({src:item.src,alt:russian(item.alt)});
const MAP_URL=SITE.contacts.mapUrl||'#tn13Visit';
const REVIEWS_URL=SITE.contacts.reviewsUrl||'#tn13Reviews';
const PHONE=SITE.contacts.phone||'';
const MESSENGER_URL=SITE.contacts.messengerUrl||'#tn13Visit';
const SERVICES=SITE.services.map(service=>({
  cat:service.category,
  title:russian(service.title),
  price:russian(service.price),
  desc:russian(service.duration),
  details:russian(service.description),
  ...(service.mobileDemoId?{demoId:service.mobileDemoId}:{})
}));
const GALLERY=Object.fromEntries(
  Object.entries(SITE.media.gallery).map(([category,items])=>[category,items.map(mediaItem)])
);
const PORTFOLIO=SITE.media.portfolio.map(mediaItem);
const REVIEW_DATA=SITE.reviews.map(review=>[russian(review.author),russian(review.text)]);
const MASTERS=SITE.team.map(master=>({
  id:master.id,
  name:russian(master.name),
  role:russian(master.role),
  about:russian(master.about),
  photo:typeof master.photo==='string'?master.photo:(master.photo?.src||''),
  cats:[...(master.categories||[])],
  work:(master.work||[]).map(item=>typeof item==='string'?item:item.src),
  reviewNames:(master.reviewIds||[]).map(id=>russian(SITE.reviews.find(review=>review.id===id)?.author)).filter(Boolean)
}));
const DISPLAY_MASTERS=MASTERS.length?MASTERS:Array.from({length:4},(_,index)=>({
  id:'placeholder-'+(index+1),name:'Мастер',role:'',about:'',photo:'',cats:[],work:[],reviewNames:[],placeholder:true
}));
const MASTER_AVATAR='<svg viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="23" r="11" fill="currentColor"></circle><path d="M12 56c2.7-11.4 10-17 20-17s17.3 5.6 20 17" fill="currentColor"></path></svg>';
const masterAvatar=m=>m&&m.photo?'<img src="'+m.photo+'" alt="'+m.name+'" style="display:block;width:100%;height:100%;object-fit:cover;border-radius:inherit">':MASTER_AVATAR;

const $=s=>root.querySelector(s); const $$=s=>[...root.querySelectorAll(s)];
const book=()=>{const s=$('#tn13BookSheet');if(s){s.classList.add('open');document.body.style.overflow='hidden'}};

// HERO
const hero=$('#tn13Top');
hero.innerHTML=`<div class="tn22-top"><a class="tn22-brand" href="#tn13Top">SALON NAME</a><button class="tn22-menu" type="button" aria-label="Меню"><i></i><i></i><i></i></button></div><button class="tn22-media" type="button" aria-label="Открыть галерею салона"><span class="tn22-slide active"></span><span class="tn22-slide"></span><span class="tn22-dots"><i class="active"></i><i></i></span></button><div class="tn22-card"><h1 class="tn22-title">SALON NAME</h1><div class="tn22-sub">Салон красоты</div><p class="tn22-copy">Описание салона.</p><div class="tn37-hero-info"><div class="tn37-info"><span class="tn37-info-icon"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5"></circle><path d="M12 7.5v5l3.2 2"></path></svg></span><span class="tn37-info-copy tn50-hero-status"><strong class="tn50-hero-status-main">Проверяем</strong><span class="tn50-hero-status-sub">режим работы</span></span></div><span class="tn37-info-divider" aria-hidden="true"></span><div class="tn37-info tn37-location"><span class="tn37-info-icon"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 10c0 5.2-7 10-7 10s-7-4.8-7-10a7 7 0 1 1 14 0Z"></path><circle cx="12" cy="10" r="2.2"></circle></svg></span><span class="tn37-info-copy"><strong>Город,</strong>Адрес салона</span></div></div><button class="tn22-cta" type="button"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="5.5" width="16" height="14" rx="2.2"></rect><path d="M8 3.5v4M16 3.5v4M4 9.5h16M8 13h.01M12 13h.01M16 13h.01M8 16h.01M12 16h.01"></path></svg><span>Записаться</span></button><a class="tn22-worklink" href="#tn13Portfolio"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 3 .9 3.1L16 7l-3.1.9L12 11l-.9-3.1L8 7l3.1-.9L12 3ZM6 13l.7 2.3L9 16l-2.3.7L6 19l-.7-2.3L3 16l2.3-.7L6 13ZM17.5 12l.8 2.7 2.7.8-2.7.8-.8 2.7-.8-2.7-2.7-.8 2.7-.8.8-2.7Z"></path></svg><span>Смотреть работы</span></a></div>`;
hero.querySelector('.tn22-cta').addEventListener('click',book);
const menuButton=hero.querySelector('.tn22-menu');
const navPop=document.createElement('nav');navPop.className='tn22-navpop';navPop.innerHTML='<a href="#tn13Portfolio">Портфолио</a><a href="#tn13Services">Услуги</a><a href="#tn38About">О нас</a><a href="#tn13Team">Команда</a><a href="#tn13Reviews">Отзывы</a><a href="#tn13Visit">Контакты</a>';hero.querySelector('.tn22-top').appendChild(navPop);menuButton.addEventListener('click',e=>{e.stopPropagation();navPop.classList.toggle('open')});navPop.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>navPop.classList.remove('open')));document.addEventListener('pointerdown',e=>{if(!e.target.closest('.tn22-top'))navPop.classList.remove('open')});
let slide=0; const slides=[...hero.querySelectorAll('.tn22-slide')],dots=[...hero.querySelectorAll('.tn22-dots i')];
function setHeroSlide(i){slide=(i+slides.length)%slides.length;slides.forEach((x,j)=>x.classList.toggle('active',j===slide));dots.forEach((x,j)=>x.classList.toggle('active',j===slide));}
const heroMedia=hero.querySelector('.tn22-media');let heroStartX=0,heroMoved=false,heroPointer=null;
heroMedia.querySelectorAll('img').forEach(img=>img.draggable=false);
heroMedia.addEventListener('pointerdown',e=>{heroStartX=e.clientX;heroMoved=false;heroPointer=e.pointerId;try{heroMedia.setPointerCapture(e.pointerId)}catch(_){}});
heroMedia.addEventListener('pointermove',e=>{if(heroPointer!==null&&Math.abs(e.clientX-heroStartX)>12)heroMoved=true});
const finishHeroGesture=e=>{if(heroPointer===null)return;const dx=e.clientX-heroStartX;try{heroMedia.releasePointerCapture(heroPointer)}catch(_){}heroPointer=null;if(Math.abs(dx)>42){setHeroSlide(slide+(dx<0?1:-1));return}if(!heroMoved)openGallery('Салон',heroMedia)};
heroMedia.addEventListener('pointerup',finishHeroGesture);heroMedia.addEventListener('pointercancel',()=>{heroPointer=null;heroMoved=false});

// VIEWER
const viewer=document.createElement('div');viewer.className='tn22-viewer';viewer.innerHTML=`<div class="tn22-viewer-frame"><div class="tn23-viewer-hint">Разведите двумя пальцами, чтобы увеличить</div><div class="tn22-viewer-top"><div class="tn22-viewer-actions"><button class="tn22-vbtn tn22-view-close" type="button" aria-label="Закрыть">×</button></div></div><div class="tn42-viewer-canvas"><img class="tn22-viewer-img" alt=""></div><button class="tn22-navbtn tn22-prev" type="button">‹</button><button class="tn22-navbtn tn22-next" type="button">›</button><div class="tn23-viewer-foot"><button class="tn22-view-gallery" type="button">Открыть галерею</button><span class="tn22-viewer-count">01 / 01</span></div></div>`;root.appendChild(viewer);
let viewerItems=[],viewerIndex=0; const vCanvas=viewer.querySelector('.tn42-viewer-canvas'),vImg=viewer.querySelector('.tn22-viewer-img'),vCount=viewer.querySelector('.tn22-viewer-count'),vPrev=viewer.querySelector('.tn22-prev'),vNext=viewer.querySelector('.tn22-next');
let sx=0,sy=0,viewerScale=1,viewerX=0,viewerY=0,pinchStart=0,pinchBaseScale=1,panStartX=0,panStartY=0,gestureHadPinch=false;
const pinchDist=e=>Math.hypot(e.touches[0].clientX-e.touches[1].clientX,e.touches[0].clientY-e.touches[1].clientY);
function clampViewerPan(){if(viewerScale<=1){viewerX=0;viewerY=0;return}const maxX=(viewerScale-1)*vCanvas.clientWidth*.5,maxY=(viewerScale-1)*vCanvas.clientHeight*.5;viewerX=Math.max(-maxX,Math.min(maxX,viewerX));viewerY=Math.max(-maxY,Math.min(maxY,viewerY))}
function applyViewerTransform(){clampViewerPan();vImg.style.transform=`translate3d(${viewerX}px,${viewerY}px,0) scale(${viewerScale})`}
function resetViewerTransform(){viewerScale=1;viewerX=0;viewerY=0;pinchStart=0;pinchBaseScale=1;applyViewerTransform()}
function paintViewer(){const it=viewerItems[viewerIndex];if(!it)return;vImg.src=it.src;vImg.alt=it.alt||'';vCount.textContent=`${String(viewerIndex+1).padStart(2,'0')} из ${String(viewerItems.length).padStart(2,'0')}`;resetViewerTransform();vPrev.hidden=viewerItems.length<2;vNext.hidden=viewerItems.length<2;}
function openViewer(items,index=0,source='gallery'){viewerItems=Array.isArray(items)?items:[];if(!viewerItems.length)return;viewer.dataset.source=source;const galleryButton=viewer.querySelector('.tn22-view-gallery');if(galleryButton)galleryButton.hidden=source!=='portfolio';viewerIndex=Math.max(0,Math.min(index,viewerItems.length-1));paintViewer();viewer.classList.add('open');document.body.style.overflow='hidden'}
function closeViewer(){viewer.classList.remove('open');resetViewerTransform();if(!$('#tn13Gallery').classList.contains('open')&&!masterPage.classList.contains('open'))document.body.style.overflow=''}
vPrev.onclick=()=>{viewerIndex=(viewerIndex-1+viewerItems.length)%viewerItems.length;paintViewer()};vNext.onclick=()=>{viewerIndex=(viewerIndex+1)%viewerItems.length;paintViewer()};viewer.querySelector('.tn22-view-close').onclick=closeViewer;viewer.querySelector('.tn22-view-gallery').onclick=e=>{const origin=e.currentTarget.getBoundingClientRect();closeViewer();openGallery('Салон',origin)};viewer.addEventListener('click',e=>{if(e.target===viewer)closeViewer()});
vCanvas.addEventListener('touchstart',e=>{if(e.touches.length===2){e.preventDefault();gestureHadPinch=true;pinchStart=pinchDist(e);pinchBaseScale=viewerScale}else if(e.touches.length===1){sx=e.touches[0].clientX;sy=e.touches[0].clientY;panStartX=viewerX;panStartY=viewerY}},{passive:false});
vCanvas.addEventListener('touchmove',e=>{if(e.touches.length===2&&pinchStart){e.preventDefault();viewerScale=Math.max(1,Math.min(4,pinchBaseScale*(pinchDist(e)/pinchStart)));if(viewerScale<=1.01){viewerScale=1;viewerX=0;viewerY=0}applyViewerTransform()}else if(e.touches.length===1&&viewerScale>1){e.preventDefault();viewerX=panStartX+(e.touches[0].clientX-sx);viewerY=panStartY+(e.touches[0].clientY-sy);applyViewerTransform()}},{passive:false});
vCanvas.addEventListener('touchend',e=>{if(e.touches.length<2)pinchStart=0;if(e.touches.length===0){if(!gestureHadPinch&&viewerScale===1&&viewerItems.length>1&&e.changedTouches.length){const dx=e.changedTouches[0].clientX-sx,dy=e.changedTouches[0].clientY-sy;if(Math.abs(dx)>45&&Math.abs(dx)>Math.abs(dy)*1.15)(dx<0?vNext:vPrev).click()}gestureHadPinch=false;if(viewerScale<=1.01)resetViewerTransform()}},{passive:false});

// GALLERY
const gallery=$('#tn13Gallery');let galleryCat='Салон';
function renderGallery(){
 const items=GALLERY[galleryCat]||[];
 const categories=Object.keys(GALLERY);
 gallery.innerHTML=`<div class="tn22-gallery"><div class="tn22-gallery-top"><button class="tn22-gallery-back" type="button">←</button><div class="tn22-gallery-title"><strong>${["en","hy"].includes(document.body.dataset.brLang)?"Gallery":"Галерея"}</strong><span>SALON NAME</span></div><div></div></div><div class="tn22-gallery-tabs-wrap"><div class="tn22-gallery-tabs">${categories.map(c=>`<button class="tn22-gallery-tab${c===galleryCat?' active':''}" type="button" data-gcat="${c}">${c}</button>`).join('')}</div></div><div class="tn22-gallery-grid${galleryCat==='Салон'?' salon':''}">${items.length?items.map((x,i)=>`<button class="tn22-gallery-tile" type="button" data-gi="${i}"><img loading="lazy" decoding="async" src="${x.src}" alt="${x.alt}"></button>`).join(''):'<div class="tn23-gallery-empty">Фотографии пока не добавлены</div>'}</div></div>`;
 gallery.querySelector('.tn22-gallery-back').onclick=closeGallery;
 gallery.querySelectorAll('[data-gcat]').forEach(b=>b.onclick=()=>{galleryCat=b.dataset.gcat;renderGallery()});
 gallery.querySelectorAll('[data-gi]').forEach(b=>b.onclick=e=>{e.preventDefault();e.stopPropagation();openViewer(items,+b.dataset.gi,'gallery')});
}
let galleryCloseTimer=0;
function setGalleryOrigin(origin){
 const rect=origin&&typeof origin.getBoundingClientRect==='function'?origin.getBoundingClientRect():origin;
 if(!rect||!Number.isFinite(rect.left)||!Number.isFinite(rect.top)){gallery.style.removeProperty('--gallery-origin-x');gallery.style.removeProperty('--gallery-origin-y');return}
 const x=Math.max(0,Math.min(100,((rect.left+rect.width/2)/Math.max(1,window.innerWidth))*100));
 const y=Math.max(0,Math.min(100,((rect.top+rect.height/2)/Math.max(1,window.innerHeight))*100));
 gallery.style.setProperty('--gallery-origin-x',x+'%');
 gallery.style.setProperty('--gallery-origin-y',y+'%');
}
function openGallery(cat='Салон',origin=null){clearTimeout(galleryCloseTimer);galleryCat=Object.prototype.hasOwnProperty.call(GALLERY,cat)?cat:'Салон';setGalleryOrigin(origin);renderGallery();gallery.classList.remove('closing');gallery.scrollTop=0;requestAnimationFrame(()=>gallery.classList.add('open'))}
function closeGallery(){if(!gallery.classList.contains('open'))return;clearTimeout(galleryCloseTimer);gallery.classList.remove('open');gallery.classList.add('closing');galleryCloseTimer=setTimeout(()=>gallery.classList.remove('closing'),520)}
const heroWorksLink=hero.querySelector('.tn22-worklink');if(heroWorksLink)heroWorksLink.onclick=e=>{e.preventDefault();openGallery('Салон',e.currentTarget)};

const sectionItems=[['tn13Portfolio','Портфолио'],['tn13Services','Услуги'],['tn38About','О нас'],['tn13Team','Команда'],['tn13Reviews','Отзывы'],['tn13Visit','Визит']];const sectionIds=sectionItems.map(x=>x[0]);const sectionNav=document.createElement('nav');sectionNav.className='tn23-section-nav';sectionNav.setAttribute('aria-hidden','true');sectionNav.innerHTML=sectionItems.map((x,i)=>`<button type="button" data-section="${x[0]}" class="${i===0?'active':''}">${x[1]}</button>`).join('');sectionNav.classList.add('salon-template-fixed-nav');document.body.appendChild(sectionNav);
let activeSection='tn13Portfolio',navRaf=0,navTargetLock=null,navUnlockTimer=0;
const mobileThemeMeta=document.querySelector('meta[name="theme-color"]');
function updateThemeChrome(){const visit=document.getElementById('tn13Visit');const dark=!!visit&&visit.getBoundingClientRect().top<=window.innerHeight-24&&window.scrollY>hero.offsetHeight-48;const desired=dark?'#181818':'#fafaf9';if(mobileThemeMeta&&mobileThemeMeta.getAttribute('content')!==desired)mobileThemeMeta.setAttribute('content',desired)}
function revealActiveNavButton(btn){const navRect=sectionNav.getBoundingClientRect(),btnRect=btn.getBoundingClientRect(),pad=10;let delta=0;if(btnRect.right>navRect.right-pad)delta=btnRect.right-(navRect.right-pad);else if(btnRect.left<navRect.left+pad)delta=btnRect.left-(navRect.left+pad);if(Math.abs(delta)>1)sectionNav.scrollBy({left:delta,behavior:'smooth'})}
function setActiveSection(id){if(!id)return;activeSection=id;const btn=sectionNav.querySelector(`[data-section="${id}"]`);if(!btn)return;sectionNav.querySelectorAll('button').forEach(x=>x.classList.toggle('active',x===btn));revealActiveNavButton(btn)}
function scrollSectionFromNav(id){clearTimeout(navUnlockTimer);if(id==='tn13Portfolio'){navTargetLock=null;setActiveSection('tn13Portfolio');const top=Math.max(0,window.scrollY+hero.getBoundingClientRect().top);window.scrollTo({top,behavior:'smooth'});return}const el=document.getElementById(id);if(!el)return;navTargetLock=id;setActiveSection(id);const top=Math.max(0,window.scrollY+el.getBoundingClientRect().top-sectionNav.offsetHeight+1);window.scrollTo({top,behavior:'smooth'});navUnlockTimer=setTimeout(()=>{navTargetLock=null;updateSectionNav()},900)}
sectionNav.querySelectorAll('[data-section]').forEach(b=>b.onclick=()=>scrollSectionFromNav(b.dataset.section));
function updateSectionNav(){navRaf=0;const heroPassed=window.scrollY>=Math.max(0,hero.offsetTop+hero.offsetHeight-2);updateThemeChrome();sectionNav.classList.toggle('visible',heroPassed);sectionNav.setAttribute('aria-hidden',heroPassed?'false':'true');if(!heroPassed){navTargetLock=null;clearTimeout(navUnlockTimer);if(activeSection!=='tn13Portfolio')setActiveSection('tn13Portfolio');return}if(navTargetLock){if(activeSection!==navTargetLock)setActiveSection(navTargetLock);return}const line=sectionNav.getBoundingClientRect().bottom+3;let chosen=sectionIds[0];for(const id of sectionIds){const el=document.getElementById(id);if(!el)continue;const r=el.getBoundingClientRect();if(r.top<=line&&r.bottom>line){chosen=id;break}if(r.top<=line)chosen=id}if(chosen!==activeSection)setActiveSection(chosen)}
window.addEventListener('scroll',()=>{if(!navRaf)navRaf=requestAnimationFrame(updateSectionNav)},{passive:true});window.addEventListener('resize',updateSectionNav,{passive:true});requestAnimationFrame(updateSectionNav);

// PORTFOLIO
const port=$('#tn13Portfolio');port.innerHTML=`<div class="tn22-port"><p class="tn22-kicker">Портфолио</p><h2>Наши работы</h2><div class="tn22-port-grid">${PORTFOLIO.map((x,i)=>`<button class="tn22-photo" type="button" data-pi="${i}"><img loading="lazy" decoding="async" src="${x.src}" alt="${x.alt}"></button>`).join('')}</div><button class="tn22-port-all" type="button">Открыть галерею <span>→</span></button></div>`;port.querySelectorAll('[data-pi]').forEach(b=>b.onclick=()=>openViewer(PORTFOLIO,+b.dataset.pi,'portfolio'));port.querySelector('.tn22-port-all').onclick=e=>openGallery('Салон',e.currentTarget);

// SERVICES
const serv=$('#tn13Services');
const SERVICE_CATS=SITE.categoryOrder.filter(c=>SERVICES.some(s=>s.cat===c));
let serviceCat=SERVICE_CATS[0]||'',servicesExpanded=false;
serv.innerHTML=`<div class="tn31-services"><p class="tn22-kicker">Услуги</p><h2>Наши услуги</h2><div class="tn31-cats-wrap"><div class="tn31-cats"></div></div><div class="tn31-service-list"></div><button class="tn31-service-more" type="button"><span class="tn31-more-text"></span><span aria-hidden="true">↓</span></button></div>`;
const scats=serv.querySelector('.tn31-cats'),slist=serv.querySelector('.tn31-service-list'),sMore=serv.querySelector('.tn31-service-more');
function splitServiceTitle(raw){const parts=String(raw).split(' — ');const main=parts.shift()||raw;let detail=parts.join(' — ');if(!detail&&main.length>48){const m=main.match(/^(.*?)(\s\([^)]{5,}\)|\sBrazilian Blowout)$/i);if(m)return {main:m[1],detail:m[2].trim()}}return {main,detail}}
function serviceDurationValue(raw){const m=String(raw||'').match(/\d+(?:[.,]\d+)?/);return m?m[0]:''}
function mobileServiceLang(){const raw=(document.body.dataset.brLang||document.documentElement.lang||(navigator.languages&&navigator.languages[0])||navigator.language||'en').toLowerCase();return raw.startsWith('ru')?'ru':raw.startsWith('hy')?'hy':'en'}
function mobileDurationLabel(raw,lang=mobileServiceLang()){let v=serviceDurationValue(raw);if(!v)return '';v=lang==='ru'?v.replace('.',','):v.replace(',','.');return v+(lang==='hy'?' ժ.':lang==='en'?' h':' ч')}
function updateServiceDurationLabels(lang=mobileServiceLang()){slist?.querySelectorAll('.tn31-service-time[data-duration]').forEach(el=>{el.textContent=mobileDurationLabel(el.dataset.duration,lang)})}
function servicePriceMarkup(price){
 const range=String(price||'').trim().match(/^([\d ]+)[–-]([\d ]+)\s*([֏₽€$£])$/u);
 if(range){
  return '<span class="tn31-service-price tn31-service-range-price" aria-label="'+price+'">'+
   '<span class="tn31-price-low">'+range[1].trim()+'</span>'+
   '<span class="tn31-price-divider" aria-hidden="true">—</span>'+
   '<span class="tn31-price-high">'+range[2].trim()+'</span>'+
   '<span class="tn31-price-symbol" aria-hidden="true">'+range[3]+'</span></span>';
 }
 const single=String(price||'').trim().match(/^(?:(от|from)\s+)?([\d ]+)\s*([֏₽€$£])$/u);
 if(single){
  return '<span class="tn31-service-price tn31-service-single-price">'+
   (single[1]?'<span class="tn31-money-prefix">'+single[1]+'</span>':'')+
   '<span class="tn31-money-amount">'+single[2].trim()+'</span>'+
   '<span class="tn31-money-symbol">'+single[3]+'</span></span>';
 }
 return '<span class="tn31-service-price">'+(price||'—')+'</span>';
}
function serviceLine(s){
 const t=splitServiceTitle(s.title);
 const isDuration=x=>/^\s*\d+(?:[.,]\d+)?\s*(?:ч(?:ас(?:а|ов)?)?|мин(?:ут(?:ы)?)?|h|hr|min)\s*$/i.test(String(x||''));
 const duration=isDuration(s.desc)?s.desc:(isDuration(t.detail)?t.detail:'');
 const detail=[t.detail,s.desc].filter(x=>x&&!isDuration(x)).join(' · ');
 const name='<span class="tn31-service-copy"><strong class="tn31-service-name">'+t.main+'</strong>'+
   (detail?'<span class="tn31-service-detail">'+detail+'</span>':'')+'</span>';
 const side='<span class="tn31-service-side">'+
   (duration?'<small class="tn31-service-time" data-duration="'+duration+'">'+mobileDurationLabel(duration)+'</small>':'')+
   servicePriceMarkup(s.price)+'</span>';
 if(!s.details){
  return '<button class="tn31-service-row'+(String(s.price).includes('–')?' is-price-range':'')+'" type="button" data-book-service>'+name+side+'</button>';
 }
 const detailId=s.demoId||(s.title==='Сложное мелирование'?'tnDemoMeliorationDesc':'tnDemoRepairDesc');
 return '<div class="tn31-service-row tn31-service-demo">'+
  '<button class="tn31-service-primary" type="button" data-book-service>'+name+'</button>'+
  '<button class="tn31-service-side tn31-service-demo-book" type="button" data-book-service aria-label="Записаться">'+
   (duration?'<small class="tn31-service-time" data-duration="'+duration+'">'+mobileDurationLabel(duration)+'</small>':'')+
   servicePriceMarkup(s.price)+'</button>'+
  '<div class="tn31-service-demo-desc"><p id="'+detailId+'">'+s.details+'</p>'+
  '<button class="tn31-service-demo-more" type="button" data-service-details aria-expanded="false" aria-controls="'+detailId+'">Подробнее…</button></div>'+
 '</div>';
}
function serviceWord(n){const n10=n%10,n100=n%100;if(n10===1&&n100!==11)return 'услугу';if(n10>=2&&n10<=4&&(n100<12||n100>14))return 'услуги';return 'услуг'}
/* Category selection must not auto-scroll the viewport or horizontal rail. */
const MOBILE_SERVICE_PREVIEW_LIMIT=8;
let mobileMoreWrap=null,mobileSavedScrollAnchor=null,mobileMoreAnchorRun=0;
function bindMobileServiceControls(scope){
 scope.querySelectorAll('.tn31-service-price').forEach(price=>{if(price.textContent.trim()==='—')price.hidden=true});
 scope.querySelectorAll('[data-book-service]').forEach(btn=>btn.onclick=book);
 scope.querySelectorAll('[data-service-details]').forEach(btn=>btn.onclick=()=>{
  const row=btn.closest('.tn31-service-demo');
  if(!row.classList.contains('is-expanded'))row.style.setProperty('--service-side-center',(row.offsetHeight/2)+'px');
  const expanded=row.classList.toggle('is-expanded');
  btn.setAttribute('aria-expanded',String(expanded));
  btn.textContent=expanded?'Свернуть':'Подробнее…';
  if(btn.firstChild)btn.firstChild.__brI18nCanonical=expanded?'Свернуть':'Подробнее…';
  if(!expanded)requestAnimationFrame(syncDemoSidePositions);
 });
}
function resetMobileMore(){
 mobileMoreAnchorRun++;
 if(mobileMoreWrap){mobileMoreWrap.remove();mobileMoreWrap=null}
 servicesExpanded=false;
}
function renderServices(){
 resetMobileMore();
 const railLeft=scats.scrollLeft;
 scats.classList.toggle('is-two',SERVICE_CATS.length===2);
 scats.innerHTML=SERVICE_CATS.map(c=>'<button class="tn31-cat'+(c===serviceCat?' active':'')+'" type="button" data-scat="'+c+'">'+c+'</button>').join('');
 scats.querySelectorAll('[data-scat]').forEach(btn=>btn.onclick=()=>{
  const oldScroll=scats.scrollLeft;
  serviceCat=btn.dataset.scat;
  renderServices();
  scats.scrollLeft=oldScroll;
 });
 scats.scrollLeft=railLeft;
 const arr=SERVICES.filter(s=>s.cat===serviceCat);
 const shown=arr.slice(0,MOBILE_SERVICE_PREVIEW_LIMIT);
 const remaining=Math.max(0,arr.length-MOBILE_SERVICE_PREVIEW_LIMIT);
 slist.innerHTML=shown.map(serviceLine).join('');
 bindMobileServiceControls(slist);
 sMore.hidden=arr.length<=MOBILE_SERVICE_PREVIEW_LIMIT;
 sMore.setAttribute('aria-expanded','false');
 sMore.querySelector('.tn31-more-text').textContent='Показать ещё '+remaining+' '+serviceWord(remaining);
 sMore.querySelector('span:last-child').textContent='↓';
 updateServiceDurationLabels();
 requestAnimationFrame(syncDemoSidePositions);
}
function syncDemoSidePositions(){
 slist.querySelectorAll('.tn31-service-demo').forEach(row=>{
  const expanded=row.classList.contains('is-expanded');
  if(expanded)row.classList.remove('is-expanded');
  row.style.setProperty('--service-side-center',(row.offsetHeight/2)+'px');
  if(expanded)row.classList.add('is-expanded');
 });
}
function stabilizeMobileMoreButton(anchorTop){
 const delta=sMore.getBoundingClientRect().top-anchorTop;
 if(Number.isFinite(delta)&&Math.abs(delta)>.5)window.scrollTo({top:Math.max(0,window.scrollY+delta),behavior:'instant'});
}
function followMobileMoreButton(anchorTop,token){
 if(token!==mobileMoreAnchorRun)return;
 stabilizeMobileMoreButton(anchorTop);
 if(!servicesExpanded&&mobileMoreWrap)requestAnimationFrame(()=>followMobileMoreButton(anchorTop,token));
}
function lockMobileServiceAnchor(){
 if(mobileSavedScrollAnchor!==null)return;
 mobileSavedScrollAnchor=document.documentElement.style.overflowAnchor||'';
 document.documentElement.style.overflowAnchor='none';
}
function unlockMobileServiceAnchor(){
 if(mobileSavedScrollAnchor===null)return;
 document.documentElement.style.overflowAnchor=mobileSavedScrollAnchor;
 mobileSavedScrollAnchor=null;
}
function makeMobileExtraServices(){
 return SERVICES.filter(s=>s.cat===serviceCat).slice(MOBILE_SERVICE_PREVIEW_LIMIT).map(serviceLine).join('');
}
function paintMobileMoreButton(){
 const arr=SERVICES.filter(s=>s.cat===serviceCat);
 const remaining=Math.max(0,arr.length-MOBILE_SERVICE_PREVIEW_LIMIT);
 sMore.setAttribute('aria-expanded',String(servicesExpanded));
 sMore.querySelector('.tn31-more-text').textContent=servicesExpanded?'Свернуть':'Показать ещё '+remaining+' '+serviceWord(remaining);
 sMore.querySelector('span:last-child').textContent=servicesExpanded?'↑':'↓';
}
sMore.onclick=()=>{
 const anchorTop=sMore.getBoundingClientRect().top;
 const token=++mobileMoreAnchorRun;
 lockMobileServiceAnchor();
 const duration=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches?0:400;
 servicesExpanded=!servicesExpanded;
 paintMobileMoreButton();
 if(servicesExpanded){
  if(!mobileMoreWrap){
   mobileMoreWrap=document.createElement('div');
   mobileMoreWrap.className='tn31-service-more-wrap';
   mobileMoreWrap.innerHTML=makeMobileExtraServices();
   slist.appendChild(mobileMoreWrap);
   bindMobileServiceControls(mobileMoreWrap);
  }
  const wrap=mobileMoreWrap;
  wrap.ontransitionend=null;
  wrap.style.transitionDuration=duration+'ms';
  const expandedHeight=wrap.scrollHeight;
  if(!duration){wrap.style.height='auto';unlockMobileServiceAnchor()}
  else{
   wrap.style.height='0px';wrap.offsetHeight;
   requestAnimationFrame(()=>{if(servicesExpanded&&mobileMoreWrap===wrap)wrap.style.height=expandedHeight+'px'});
   wrap.ontransitionend=e=>{if(e.target===wrap&&e.propertyName==='height'&&servicesExpanded){wrap.style.height='auto';wrap.ontransitionend=null;unlockMobileServiceAnchor()}};
  }
  requestAnimationFrame(syncDemoSidePositions);
 }else if(mobileMoreWrap){
  const wrap=mobileMoreWrap;
  wrap.ontransitionend=null;
  wrap.style.transitionDuration=duration+'ms';
  if(!duration){wrap.remove();mobileMoreWrap=null;stabilizeMobileMoreButton(anchorTop);unlockMobileServiceAnchor()}
  else{
   wrap.style.height=wrap.getBoundingClientRect().height+'px';wrap.offsetHeight;
   requestAnimationFrame(()=>{if(!servicesExpanded&&mobileMoreWrap===wrap){followMobileMoreButton(anchorTop,token);wrap.style.height='0px'}});
   wrap.ontransitionend=e=>{if(e.target===wrap&&e.propertyName==='height'&&!servicesExpanded){wrap.remove();mobileMoreWrap=null;stabilizeMobileMoreButton(anchorTop);unlockMobileServiceAnchor()}};
  }
 }
};
window.addEventListener('salon-template:languagechange',e=>{
 updateServiceDurationLabels(e.detail&&e.detail.lang);
 requestAnimationFrame(syncDemoSidePositions);
});
window.addEventListener('resize',()=>requestAnimationFrame(syncDemoSidePositions),{passive:true});
if(document.fonts&&document.fonts.ready)
 document.fonts.ready.then(()=>requestAnimationFrame(syncDemoSidePositions));
renderServices();

// TEAM + TEAM SHEET
const team=$('#tn13Team');team.hidden=false;team.innerHTML=`<div class="tn22-team"><p class="tn22-kicker">Наша команда</p><h2>Мастера своего дела</h2><div class="tn22-team-grid">${DISPLAY_MASTERS.map(m=>m.placeholder?`<div class="tn22-master-card is-placeholder"><span class="tn22-master-circle">${masterAvatar(m)}</span><strong class="tn22-master-name">Мастер</strong><span class="tn22-master-role"></span></div>`:`<button class="tn22-master-card" type="button" data-mid="${m.id}"><span class="tn22-master-circle">${masterAvatar(m)}</span><strong class="tn22-master-name">${m.name}</strong><span class="tn22-master-role">${m.role}</span></button>`).join('')}</div><div class="tn42-team-hint">Листайте <span>→</span></div></div>`;
const teamSheet=document.createElement('div');teamSheet.className='tn22-team-sheet';root.appendChild(teamSheet);

// MASTER PAGE
const masterPage=document.createElement('div');masterPage.className='tn22-master-page';masterPage.innerHTML=`<div class="tn22-master-shell"><div class="tn22-master-top"><button class="tn22-back" type="button">←</button><div class="tn22-master-brand">SALON NAME</div><span class="tn42-master-spacer" aria-hidden="true"></span></div><div class="tn22-master-body"></div></div><button class="tn22-master-book" type="button">Записаться онлайн</button>`;root.appendChild(masterPage);let masterCloseTimer=0;function closeMaster(){if(!masterPage.classList.contains('open'))return;clearTimeout(masterCloseTimer);masterPage.classList.remove('open');masterPage.classList.add('closing');masterCloseTimer=setTimeout(()=>masterPage.classList.remove('closing'),520)}masterPage.querySelector('.tn22-back').onclick=closeMaster;masterPage.querySelector('.tn22-master-book').onclick=book;let currentMaster=null,currentMasterTab='Профиль';
function masterReviews(m){return REVIEW_DATA.filter(r=>m.reviewNames.includes(r[0]));}
function renderMasterTab(){const body=masterPage.querySelector('.tn22-master-content');if(!body||!currentMaster)return;if(currentMasterTab==='Профиль'){body.innerHTML=`<h3>О мастере</h3><p class="tn22-master-about" style="text-align:left;margin:0">${currentMaster.about}</p>`}else if(currentMasterTab==='Услуги'){const arr=SERVICES.filter(s=>currentMaster.cats.includes(s.cat)).slice(0,8);body.innerHTML=`<h3>Услуги</h3>${arr.length?arr.map(s=>`<div class="tn22-master-service"><b>${s.title}</b><span>Записаться</span></div>`).join(''):'<p class="tn22-master-about" style="text-align:left;margin:0">Пока нет данных об услугах.</p>'}`}else if(currentMasterTab==='Портфолио'){body.innerHTML=`<h3>Портфолио</h3><div class="tn22-master-works">${currentMaster.work.length?currentMaster.work.map(src=>`<img loading="lazy" decoding="async" src="${src}" alt="Работа ${currentMaster.name}">`).join(''):'<p class="tn22-master-about" style="grid-column:1/-1;text-align:left;margin:0">Пока нет фото.</p>'}</div>`}else{const rs=masterReviews(currentMaster);body.innerHTML=`<h3>Отзывы</h3>${rs.length?rs.map(r=>`<div class="tn22-master-review"><strong>${r[0]}</strong><p>${r[1]}</p></div>`).join(''):'<p class="tn22-master-about" style="text-align:left;margin:0">Пока нет отзывов.</p>'}`}}
function openMaster(id){currentMaster=MASTERS.find(m=>m.id===id);if(!currentMaster)return;currentMasterTab='Профиль';const b=masterPage.querySelector('.tn22-master-body');b.innerHTML=`<div class="tn22-profile"><div class="tn22-profile-circle">${masterAvatar(currentMaster)}</div><h1>${currentMaster.name}</h1><div class="tn22-profile-role">${currentMaster.role}</div><div class="tn22-salon-rating"><b>★</b> — <span>рейтинг не указан</span></div></div><div class="tn22-master-tabs">${['Профиль','Услуги','Портфолио','Отзывы'].map(t=>`<button class="${t==='Профиль'?'active':''}" type="button" data-mtab="${t}">${t}</button>`).join('')}</div><div class="tn22-master-content"></div>`;b.querySelectorAll('[data-mtab]').forEach(x=>x.onclick=()=>{currentMasterTab=x.dataset.mtab;b.querySelectorAll('[data-mtab]').forEach(y=>y.classList.toggle('active',y===x));renderMasterTab()});renderMasterTab();teamSheet.classList.remove('open');clearTimeout(masterCloseTimer);masterPage.classList.remove('closing');masterPage.scrollTop=0;requestAnimationFrame(()=>masterPage.classList.add('open'))}
team.querySelectorAll('[data-mid]').forEach(b=>b.onclick=()=>openMaster(b.dataset.mid));teamSheet.querySelectorAll('[data-sheet-mid]').forEach(b=>b.onclick=()=>openMaster(b.dataset.sheetMid));

// REVIEWS
const reviews=$('#tn13Reviews');
const REAL_REVIEW_DATA=REVIEW_DATA.length?REVIEW_DATA:[['','']];
const reviewInitial=n=>([...String(n).trim()][0]||'S').toUpperCase();
const reviewHref=()=>REVIEWS_URL;
const reviewCard=r=>`<a class="tn30-review-card" href="${reviewHref(r)}" aria-disabled="true"><div class="tn30-review-head"><span class="tn30-review-avatar">${reviewInitial(r[0])}</span><span><strong class="tn30-review-name">${r[0]}</strong><span class="tn30-review-meta">Источник отзыва</span></span></div><p>${r[1]}</p><span class="tn30-review-open">Подробнее →</span></a>`;
const reviewLanes=[0,1,2].map(row=>REAL_REVIEW_DATA.filter((_,i)=>i%3===row)).filter(lane=>lane.length);
reviews.innerHTML=`<div class="tn30-reviews"><p class="tn22-kicker">Отзывы</p><h2>Что говорят о нас</h2><div class="tn30-score"><strong>—</strong><div class="tn30-stars">★★★★★</div><div class="tn30-count">Отзывы будут добавлены</div></div><div class="tn30-review-stage">${reviewLanes.map((lane,i)=>{const loop=[lane[lane.length-1],...lane,lane[0]];return `<div class="tn30-lane" data-lane="${i}"><div class="tn30-track">${loop.map(reviewCard).join('')}</div></div>`}).join('')}</div><a class="tn30-review-all" href="${REVIEWS_URL}" aria-disabled="true">Смотреть все отзывы →</a></div>`;
const reviewStage=reviews.querySelector('.tn30-review-stage'),reviewTracks=[...reviews.querySelectorAll('.tn30-track')];
let reviewIndex=1,reviewPauseTimer=0,reviewMotionTimer=0,reviewDragging=false,reviewMoved=false,reviewSuppressClick=false,reviewStartX=0,reviewStartY=0,reviewDx=0;
const reviewGap=12,reviewDuration=780,reviewGroupCount=Math.max(1,...reviewLanes.map(l=>l.length));
function reviewMetrics(){const lane=reviews.querySelector('.tn30-lane'),card=reviews.querySelector('.tn30-review-card');const width=card?card.getBoundingClientRect().width:0;return {step:width+reviewGap,edge:lane?Math.max(0,(lane.clientWidth-width)/2):26}}
function paintReviewTracks(animated,drag=0){const {step,edge}=reviewMetrics();reviewTracks.forEach(t=>{t.style.transition=animated?`transform ${reviewDuration}ms cubic-bezier(.22,.66,.24,1)`:'none';t.style.transform=`translate3d(${edge-reviewIndex*step+drag}px,0,0)`})}
function scheduleReviews(){clearTimeout(reviewPauseTimer);reviewPauseTimer=setTimeout(()=>moveReviews(reviewIndex+1),4000)}
function normalizeReviewIndex(){if(reviewIndex===0){reviewIndex=reviewGroupCount;paintReviewTracks(false)}else if(reviewIndex===reviewGroupCount+1){reviewIndex=1;paintReviewTracks(false)}}
function moveReviews(next){clearTimeout(reviewPauseTimer);clearTimeout(reviewMotionTimer);reviewIndex=Math.max(0,Math.min(reviewGroupCount+1,next));paintReviewTracks(true);reviewMotionTimer=setTimeout(()=>{normalizeReviewIndex();scheduleReviews()},reviewDuration+40)}
requestAnimationFrame(()=>{paintReviewTracks(false);scheduleReviews()});
window.addEventListener('resize',()=>paintReviewTracks(false),{passive:true});
reviewStage.addEventListener('pointerdown',e=>{clearTimeout(reviewPauseTimer);clearTimeout(reviewMotionTimer);reviewDragging=true;reviewMoved=false;reviewDx=0;reviewStartX=e.clientX;reviewStartY=e.clientY;reviewStage.classList.add('dragging');paintReviewTracks(false);try{reviewStage.setPointerCapture(e.pointerId)}catch(_){}});
reviewStage.addEventListener('pointermove',e=>{if(!reviewDragging)return;const dx=e.clientX-reviewStartX,dy=e.clientY-reviewStartY;if(!reviewMoved&&Math.abs(dx)<6)return;if(!reviewMoved&&Math.abs(dy)>Math.abs(dx))return;reviewMoved=true;reviewDx=dx;paintReviewTracks(false,reviewDx)});
function finishReviewDrag(e){if(!reviewDragging)return;reviewDragging=false;reviewStage.classList.remove('dragging');try{reviewStage.releasePointerCapture(e.pointerId)}catch(_){}const {step}=reviewMetrics();if(reviewMoved&&Math.abs(reviewDx)>Math.min(70,step*.16))reviewIndex+=reviewDx<0?1:-1;reviewIndex=Math.max(0,Math.min(reviewGroupCount+1,reviewIndex));reviewSuppressClick=reviewMoved;reviewDx=0;paintReviewTracks(true);clearTimeout(reviewMotionTimer);reviewMotionTimer=setTimeout(()=>{normalizeReviewIndex();scheduleReviews()},reviewDuration+40)}
reviewStage.addEventListener('pointerup',finishReviewDrag);reviewStage.addEventListener('pointercancel',finishReviewDrag);reviewStage.addEventListener('click',e=>{if(reviewSuppressClick){e.preventDefault();e.stopPropagation();reviewSuppressClick=false}},true);

// VISIT
const visit=$('#tn13Visit');
const iconPin=`<span class="tn22-contact-icon"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s6-5.3 6-11a6 6 0 1 0-12 0c0 5.7 6 11 6 11Z"/><circle cx="12" cy="10" r="2.2"/></svg></span>`;
const iconPhone=`<span class="tn22-contact-icon"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4h3l1.3 4-2 1.5c1 2 2.6 3.6 4.6 4.6l1.5-2L19 13.5v3c0 1.1-.9 2-2 2C10.4 18.5 5.5 13.6 5.5 7A2 2 0 0 1 7 4Z"/></svg></span>`;
const iconMessage=`<span class="tn22-contact-icon"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 5.5h14v10H9l-4 3v-13Z"/></svg></span>`;
const iconClock=`<span class="tn22-contact-icon"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3.2 1.8"/></svg></span>`;
const statusClock=`<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3.2 1.8"/></svg>`;
visit.innerHTML=`<div class="tn22-visit"><div class="tn22-visit-head"><p class="tn22-kicker">Контакты</p><span class="tn22-status" id="tn22Status">${statusClock}<span class="tn22-status-text"></span></span></div><h2>Ждём вас</h2><div class="tn22-contact-grid"><a class="tn22-contact" data-contact-type="address" href="#tn13Visit" aria-disabled="true">${iconPin}<span><strong>Город, Адрес салона</strong><span>Адрес салона</span></span></a><a class="tn22-contact" data-contact-type="phone" href="#tn13Visit" aria-disabled="true">${iconPhone}<span><strong>Телефон салона</strong><span>Контакт будет добавлен</span></span></a><a class="tn22-contact" data-contact-type="messenger" href="#tn13Visit" aria-disabled="true">${iconMessage}<span><strong>Мессенджер</strong><span>Контакт будет добавлен</span></span></a><div class="tn22-contact" data-contact-type="hours">${iconClock}<span><strong>График работы</strong><span>Уточняется</span></span></div></div><div class="tn22-mapwrap"><div class="tn22-map-skeleton">Загружаем карту…</div><iframe title="Карта SALON NAME" loading="lazy" src="about:blank"></iframe></div><div class="tn22-visit-actions"><a class="tn22-visit-btn tn22-call" href="#tn13Visit" aria-disabled="true">Позвонить</a><a class="tn22-visit-btn tn22-route" href="#tn13Visit" aria-disabled="true">Построить маршрут</a></div><a class="tn22-footer" href="https://tanem.ru/" target="_blank" rel="noopener"><strong>TANEM.ru</strong><span>Цифровой офис для салонов красоты</span></a></div>`;
const map=visit.querySelector('.tn22-mapwrap'),iframe=map.querySelector('iframe');iframe.addEventListener('load',()=>map.classList.add('loaded'));setTimeout(()=>map.classList.add('loaded'),5000);
function status(){const el=visit.querySelector('#tn22Status'),txt=el&&el.querySelector('.tn22-status-text');if(txt)txt.textContent='График работы';if(el)el.className='tn22-status';const hs=hero.querySelector('.tn50-hero-status');if(hs){const main=hs.querySelector('.tn50-hero-status-main'),sub=hs.querySelector('.tn50-hero-status-sub');if(main)main.textContent='График';if(sub)sub.textContent='Уточняется';hs.classList.remove('open','closed')}}status();

// STICKY
const sticky=$('#tn13Sticky');if(sticky){sticky.innerHTML=`<strong>Доступно ${SERVICES.length} ${serviceWord(SERVICES.length)}</strong><button type="button">Записаться</button>`;sticky.querySelector('button').onclick=book}

document.addEventListener('keydown',e=>{if(e.key!=='Escape')return;if(viewer.classList.contains('open'))closeViewer();else if(masterPage.classList.contains('open'))closeMaster();else if(teamSheet.classList.contains('open'))teamSheet.classList.remove('open');else if(gallery.classList.contains('open'))closeGallery()});
})();

(function(){
'use strict';
if(window.__BR_DESKTOP_DEVICE__===true)return;
const root=document.getElementById('salon-mobile');
if(!root||document.getElementById('tn38About'))return;
const services=root.querySelector('#tn13Services');
if(!services)return;

const about=document.createElement('section');
about.id='tn38About';
about.innerHTML=`<div class="tn42-about"><p class="tn42-kicker">О нас</p><div class="tn42-card"><div class="tn42-photo"><img src="media-placeholder.svg" alt="SALON NAME" loading="lazy"><div class="tn42-rating"><span class="tn42-rating-star">★</span><strong>—</strong><span>рейтинг не указан</span></div></div><div class="tn42-body"><p class="tn42-lead">SALON NAME — салон красоты.</p><p class="tn42-copy">В основе нашей работы — профессиональный подход, внимание к деталям и уважение к индивидуальности каждого гостя. Мы создаём комфортное пространство, где качество и забота остаются главным приоритетом.</p><div class="tn42-facts"><div class="tn42-fact">Мастера разных направлений</div><div class="tn42-fact">Комфортная атмосфера</div><div class="tn42-fact">Индивидуальный подход</div></div></div></div></div>`;
services.insertAdjacentElement('afterend',about);
})();

/* Reveal the enhanced site only after the complete bundle has initialized. */
(()=>{
  const root=document.getElementById('salon-mobile');
  if(!root) return;
  root.dataset.brAppReady='1';
  document.body.classList.add('br-app-ready');
})();

(function(){
  'use strict';
  if(window.__BR_DESKTOP_DEVICE__===true) return;

    /* Remove only the client-rejected descriptive sentence. */
    const heroCopy=document.querySelector('#salon-mobile .tn22-copy');
    if(heroCopy) heroCopy.remove();

    /* Update only About copy/typography. */
    const aboutLead=document.querySelector('#salon-mobile #tn38About .tn42-lead');
    if(aboutLead){
      aboutLead.innerHTML='<span class="br-about-brand">SALON NAME</span><span class="br-about-kind">Салон красоты</span>';
    }
    const aboutCopy=document.querySelector('#salon-mobile #tn38About .tn42-copy');
    if(aboutCopy){
      aboutCopy.textContent='В основе нашей работы — профессиональный подход, внимание к деталям и уважение к индивидуальности каждого гостя. Мы создаём комфортное пространство, где качество и забота остаются главным приоритетом.';
    }

    /* Client migration compatibility removed in the clean template. */

    /* Rebuild only reviews: 3 stacked cards per slide, centered with neighbor edges visible. */
    const reviewsRoot=document.querySelector('#salon-mobile #tn13Reviews');
    if(reviewsRoot){
      const site=window.TANEM_SITE_DATA;
      const pick=value=>typeof value==='string'?value:(value?.ru??value?.en??value?.hy??'');
      const REVIEW_URL=site.contacts.reviewsUrl||'#tn13Reviews';
      const reviewData=site.reviews.map(review=>[pick(review.author),pick(review.text),pick(review.source),review.url||REVIEW_URL]);
      if(!reviewData.length){
        reviewsRoot.hidden=false;
        reviewsRoot.innerHTML='<div class="br-reviews"><p class="tn22-kicker">Отзывы</p><h2>Что говорят о нас</h2><div class="br-score"><strong>—</strong><div class="br-stars" aria-hidden="true">★★★★★</div><div class="br-count">Отзывы будут добавлены</div></div><p class="tn22-master-about" style="text-align:left;margin:18px 0 0">Пока нет отзывов.</p></div>';
      }else{
      const initial=name=>([...String(name).trim()][0]||'B').toUpperCase();
      const card=r=>`<a class="br-review-card" href="${r[3]}"${r[3].startsWith('#')?' aria-disabled="true"':''}><div class="br-review-head"><span class="br-review-avatar">${initial(r[0])}</span><span><strong class="br-review-name">${r[0]}</strong><span class="br-review-meta"><span>${r[2]||'Источник отзыва'}</span><span class="br-review-meta-stars">★★★★★</span></span></span></div><p>${r[1]}</p><span class="br-review-open">Подробнее →</span></a>`;
      const groups=[];
      for(let i=0;i<reviewData.length;i+=3){const group=reviewData.slice(i,i+3);while(group.length<3)group.push(reviewData[(i+group.length)%reviewData.length]);groups.push(group)}
      const page=g=>`<div class="br-review-page">${g.map(card).join('')}</div>`;
      const loop=[...groups,...groups,...groups];
      reviewsRoot.innerHTML=`<div class="br-reviews"><p class="tn22-kicker">Отзывы</p><h2>Что говорят о нас</h2><div class="br-score"><strong>—</strong><div class="br-stars">★★★★★</div><div class="br-count">Отзывы будут добавлены</div></div><div class="br-review-viewport"><div class="br-review-track">${loop.map(page).join('')}</div></div><a class="br-review-all" href="${REVIEW_URL}" aria-disabled="true">Смотреть все отзывы →</a></div>`;

      const viewport=reviewsRoot.querySelector('.br-review-viewport');
      const track=reviewsRoot.querySelector('.br-review-track');
      const total=groups.length;
      let pageIndex=total,startX=0,startY=0,dx=0,dragging=false,moved=false,autoTimer=0,gestureAxis=null,capturedPointer=null;
      const gap=12;
      const metrics=()=>{
        const page=track.querySelector('.br-review-page');
        const width=page?page.getBoundingClientRect().width:Math.max(0,window.innerWidth-52);
        return {width,step:width+gap,edge:Math.max(0,(viewport.clientWidth-width)/2)};
      };
      const paint=(animate=true,drag=0)=>{
        const {step,edge}=metrics();
        track.style.transition=animate?'transform 650ms cubic-bezier(.22,.66,.24,1)':'none';
        track.style.transform=`translate3d(${edge-pageIndex*step+drag}px,0,0)`;
      };
      const schedule=()=>{
        clearTimeout(autoTimer);
        autoTimer=setTimeout(()=>{
          pageIndex+=1;
          paint(true);
        },3200);
      };
      const normalize=()=>{
        if(!total)return;
        if(pageIndex>=total*2){
          pageIndex-=total;
          paint(false);
        }else if(pageIndex<total){
          pageIndex+=total;
          paint(false);
        }
      };
      track.addEventListener('transitionend',()=>{
        normalize();
        schedule();
      });
      viewport.addEventListener('pointerdown',e=>{
        clearTimeout(autoTimer);
        dragging=true;
        moved=false;
        gestureAxis=null;
        capturedPointer=null;
        dx=0;
        startX=e.clientX;
        startY=e.clientY;
      });
      viewport.addEventListener('pointermove',e=>{
        if(!dragging)return;
        const x=e.clientX-startX,y=e.clientY-startY;
        if(!gestureAxis){
          if(Math.max(Math.abs(x),Math.abs(y))<7)return;
          if(Math.abs(y)>Math.abs(x)){
            gestureAxis='vertical';
            dragging=false;
            viewport.classList.remove('dragging');
            schedule();
            return;
          }
          gestureAxis='horizontal';
          viewport.classList.add('dragging');
          capturedPointer=e.pointerId;
          try{viewport.setPointerCapture(e.pointerId)}catch(_){}
        }
        if(gestureAxis!=='horizontal')return;
        moved=true;
        dx=x;
        paint(false,dx);
      });
      const endDrag=e=>{
        if(!dragging)return;
        dragging=false;
        viewport.classList.remove('dragging');
        if(capturedPointer!==null){try{viewport.releasePointerCapture(capturedPointer)}catch(_){}}
        capturedPointer=null;
        gestureAxis=null;
        const {step}=metrics();
        if(moved&&Math.abs(dx)>Math.min(70,step*.16)) pageIndex+=dx<0?1:-1;
        pageIndex=Math.max(0,Math.min(total*3-1,pageIndex));
        dx=0;
        paint(true);
        if(!moved)schedule();
      };
      viewport.addEventListener('pointerup',endDrag);
      viewport.addEventListener('pointercancel',endDrag);
      viewport.addEventListener('click',e=>{
        if(moved){e.preventDefault();e.stopPropagation();moved=false}
      },true);
      window.addEventListener('resize',()=>paint(false),{passive:true});
      paint(false);
      schedule();
      }
    }

    /* Replace only the TANEM footer content with the compact badge. */
    const tanemFooter=document.querySelector('#salon-mobile #tn13Visit .tn22-footer');
    if(tanemFooter){
      tanemFooter.innerHTML='<span class="br-tanem-mark">T</span><span class="br-tanem-copy">Создано в <strong>TANEM.ru</strong></span>';
    }

    /* Make browser/system chrome dark whenever the contacts section is visible. */
    let themeMeta=document.querySelector('meta[name="theme-color"]');
    if(!themeMeta){
      themeMeta=document.createElement('meta');
      themeMeta.name='theme-color';
      document.head.appendChild(themeMeta);
    }
    let appleStatus=document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');
    if(!appleStatus){
      appleStatus=document.createElement('meta');
      appleStatus.name='apple-mobile-web-app-status-bar-style';
      document.head.appendChild(appleStatus);
    }
    const lightTheme='#f8f4ee',darkTheme='#11100f';
    const visit=document.querySelector('#salon-mobile #tn13Visit');
    const applySystemTheme=dark=>{
      themeMeta.setAttribute('content',dark?darkTheme:lightTheme);
      appleStatus.setAttribute('content',dark?'black-translucent':'default');
      document.documentElement.style.backgroundColor=dark?darkTheme:lightTheme;
      document.body.style.backgroundColor=dark?darkTheme:lightTheme;
    };
    const syncSystemTheme=()=>{
      if(!visit){applySystemTheme(false);return}
      const rect=visit.getBoundingClientRect();
      applySystemTheme(rect.top<window.innerHeight && rect.bottom>0);
    };
    syncSystemTheme();
    window.addEventListener('scroll',syncSystemTheme,{passive:true});
    window.addEventListener('resize',syncSystemTheme,{passive:true});
    window.addEventListener('orientationchange',syncSystemTheme,{passive:true});

    /* All external destinations open separately from the site. */
    document.querySelectorAll('#salon-mobile a[href]').forEach(a=>{
      const href=(a.getAttribute('href')||'').trim();
      if(/^(https?:|viber:)/i.test(href)){
        a.setAttribute('target','_blank');
        a.setAttribute('rel','noopener');
      }
    });

})();

(function(){
  'use strict';
  if(window.__BR_DESKTOP_DEVICE__===true) return;

  const VIBER_URL="#tn13Visit";

  

  function forceExternalLinks(scope){
    (scope||document).querySelectorAll('a[href]').forEach(a=>{
      const raw=(a.getAttribute('href')||'').trim();
      const label=(a.textContent||'').trim().toLowerCase();

      if(/^viber:/i.test(raw) || label.includes('viber')){
        if(raw!==VIBER_URL) a.setAttribute('href',VIBER_URL);
      }

      const href=(a.getAttribute('href')||'').trim();
      if(/^https?:\/\//i.test(href)){
        if(a.getAttribute('target')!=='_blank') a.setAttribute('target','_blank');
        if(a.getAttribute('rel')!=='noopener noreferrer') a.setAttribute('rel','noopener noreferrer');
      }
    });
  }

  function patchBooking(root){
    const sheet=root.querySelector('#tn13BookSheet');
    if(!sheet) return false;

    const panel=sheet.querySelector('.tn13-panel');
    if(panel){
      panel.querySelectorAll('.br-book-phone-art').forEach(el=>el.remove());
    }

    const phoneOption=[...sheet.querySelectorAll('.tn50-book-option')].find(a=>(a.textContent||'').toLowerCase().includes('телефон'));
    if(phoneOption){
      const phoneIcon=phoneOption.querySelector('.tn50-book-icon');
      if(phoneIcon && phoneIcon.dataset.brPhoneReady!=='1'){
        phoneIcon.dataset.brPhoneReady='1';
        phoneIcon.classList.add('phone');
        phoneIcon.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M7 4h3l1.3 4-2 1.5c1 2 2.6 3.6 4.6 4.6l1.5-2L19 13.5v3c0 1.1-.9 2-2 2C10.4 18.5 5.5 13.6 5.5 7A2 2 0 0 1 7 4Z"/></svg>';
      }
    }

    sheet.querySelectorAll('.tn50-book-option').forEach(a=>{
      const label=(a.textContent||'').toLowerCase();
      if(label.includes('viber')){
        if(a.getAttribute('href')!==VIBER_URL) a.setAttribute('href',VIBER_URL);
        if(a.getAttribute('target')!=='_blank') a.setAttribute('target','_blank');
        if(a.getAttribute('rel')!=='noopener noreferrer') a.setAttribute('rel','noopener noreferrer');
      }
    });

    return true;
  }

  let pageLocked=false;
  let lockedScrollY=0;

  function setPageLock(shouldLock){
    if(shouldLock && !pageLocked){
      pageLocked=true;
      lockedScrollY=window.scrollY||window.pageYOffset||0;
      document.documentElement.style.overflow='hidden';
      document.body.style.position='fixed';
      document.body.style.top='-'+lockedScrollY+'px';
      document.body.style.left='0';
      document.body.style.right='0';
      document.body.style.width='100%';
      document.body.style.overflow='hidden';
      document.body.style.touchAction='';
      return;
    }
    if(!shouldLock && pageLocked){
      pageLocked=false;
      const previousScrollBehavior=document.documentElement.style.scrollBehavior;
      document.documentElement.style.scrollBehavior='auto';
      document.documentElement.style.overflow='';
      document.body.style.position='';
      document.body.style.top='';
      document.body.style.left='';
      document.body.style.right='';
      document.body.style.width='';
      document.body.style.overflow='';
      document.body.style.touchAction='';
      window.scrollTo({top:lockedScrollY,left:0,behavior:'auto'});
      requestAnimationFrame(()=>{document.documentElement.style.scrollBehavior=previousScrollBehavior});
    }
  }

  function syncPageLock(root){
    if(!root) return;
    const active=!!root.querySelector('#tn13BookSheet.open,#tn13Gallery.open,#tn13Gallery.closing,.tn22-master-page.open,.tn22-master-page.closing,.tn22-viewer.open');
    setPageLock(active);
  }

  function apply(){

    forceExternalLinks(document);

    const root=document.getElementById('salon-mobile');
    if(!root) return false;

    patchBooking(root);
    forceExternalLinks(root);
    syncPageLock(root);

    if(!root.dataset.brExternalObserver){
      root.dataset.brExternalObserver='1';
      const observer=new MutationObserver(()=>syncPageLock(root));
      observer.observe(root,{subtree:true,attributes:true,attributeFilter:['class']});
    }
    return true;
  }

  let attempts=0;
  const timer=setInterval(()=>{
    attempts+=1;
    if(apply() || attempts>80) clearInterval(timer);
  },100);
  apply();
})();

/* Salon template media assets integration — 2026-09-18 */
(function(){
  'use strict';
  if(window.__BR_DESKTOP_DEVICE__===true) return;

  const BRAND_SRC=window.TANEM_SITE_DATA?.media?.logo||'';
  const ABOUT_SRC='media-placeholder.svg';
  const VIDEO_SRC='';

  

  function applyBrand(root){
    const brand=root.querySelector('.tn22-brand');
    if(!brand || brand.dataset.brLogoReady==='1') return;
    brand.dataset.brLogoReady='1';
    const site=window.TANEM_SITE_DATA;
    const salonName=typeof site?.salon?.name==='string'?site.salon.name:(site?.salon?.name?.ru||site?.salon?.name?.en||'SALON NAME');
    brand.setAttribute('aria-label',salonName);
    if(!BRAND_SRC){brand.textContent=salonName;return}
    brand.classList.add('br-logo-brand');
    brand.innerHTML='<img src="'+BRAND_SRC+'" alt="'+salonName+'" decoding="async">';
  }

  function applyHeroVideo(root){
    const media=root.querySelector('.tn22-media');
    if(!media || media.dataset.brVideoReady==='1') return;
    media.dataset.brVideoReady='1';
    media.classList.add('br-video-media');
    media.setAttribute('aria-label','Видео SALON NAME');
    media.innerHTML=VIDEO_SRC?'<video class="br-hero-video" muted autoplay loop playsinline webkit-playsinline preload="metadata" poster="media-placeholder.svg" src="'+VIDEO_SRC+'"></video>':'<img class="br-hero-video" src="media-placeholder.svg" alt="Фото салона">';
    const video=media.querySelector('video');
    if(video){
      video.muted=true;
      video.defaultMuted=true;
      const tryPlay=()=>{const p=video.play();if(p&&typeof p.catch==='function')p.catch(()=>{});};
      video.addEventListener('loadeddata',tryPlay,{once:true});
      video.addEventListener('canplay',tryPlay,{once:true});
      window.requestAnimationFrame(tryPlay);
      document.addEventListener('visibilitychange',()=>{if(!document.hidden) tryPlay()});
      document.addEventListener('pointerdown',tryPlay,{once:true,passive:true});
    }
  }

  function applyAbout(root){
    const img=root.querySelector('#tn38About .tn42-photo img');
    if(!img || img.dataset.brAboutReady==='1') return;
    img.dataset.brAboutReady='1';
    img.classList.add('br-about-image');
    img.src=ABOUT_SRC;
    img.alt='SALON NAME';
    img.loading='lazy';
  }

  function removeDropText(scope){
    const root=scope||document.body;
    if(!root) return;
    const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
    const nodes=[];
    while(walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(node=>{
      const value=node.nodeValue||'';
      if(/drop\s*n/i.test(value)){
        node.nodeValue=value.replace(/drop\s*n(?:\s+drop\s*n)?/gi,'').trim();
      }
    });
  }

  function openExternalLinks(root){
    root.querySelectorAll('a[href]').forEach(a=>{
      const href=(a.getAttribute('href')||'').trim();
      if(/^https?:\/\//i.test(href)){
        if(a.target!=='_blank') a.target='_blank';
        if(a.rel!=='noopener noreferrer') a.rel='noopener noreferrer';
      }
    });
  }

  function apply(){

    const root=document.getElementById('salon-mobile');
    if(!root) return false;
    applyBrand(root);
    applyHeroVideo(root);
    applyAbout(root);
    removeDropText(root);
    openExternalLinks(root);
    return true;
  }

  let attempts=0;
  const timer=setInterval(()=>{
    attempts+=1;
    if(apply() || attempts>100) clearInterval(timer);
  },80);
  apply();
})();

/* Salon template multilingual interface — languages enabled for the site country. */
(function(){
  'use strict';
  if(window.__BR_DESKTOP_DEVICE__===true) return;

  var STORAGE_KEY='salon-template-language';
  var REGION=window.TANEM_REGION||{locales:['ru','en'],fallback:'ru',labels:{ru:'RU',en:'EN'},resolve:value=>['ru','en'].includes(value)?value:'ru',ui:()=>null};
  var currentLang=REGION.fallback||'ru';
  var root=null;

  var meta={
    ru:{
      title:'SALON NAME',
      description:'Универсальный шаблон цифрового офиса салона.'
    },
    hy:{
      title:'SALON NAME',
      description:'Универсальный шаблон цифрового офиса салона.'
    },
    en:{
      title:'SALON NAME',
      description:'Универсальный шаблон цифрового офиса салона.'
    }
  };

  var rows=[
    ["Окрашивание волос средней длины","Միջին երկարության մազերի ներկում","Medium-length hair coloring"],
    ["Сложное мелирование","Բարդ մելիրավորում","Advanced highlights"],
    ["Сложная покраска волос с заливкой","Մազերի բարդ ներկում՝ գույնի լցմամբ","Complex hair coloring with color filling"],
    ["Мужская стрижка","Տղամարդու սանրվածք","Men's haircut"],
    ["Окрашивание волос без маски","Մազերի ներկում առանց դիմակի","Hair coloring without a mask"],
    ["Мелирование мелирования","Մելիրավորման մելիրավորում","Highlighting highlights"],
    ["Мужская стрижка с покраской","Տղամարդու սանրվածք և ներկում","Men's haircut and coloring"],
    ["Для того чтобы постричься мужчине, нужно определить, какой уровень он имеет, для того чтобы сделать так-то, так-то. Без этого не получится сформулировать единогласное решение судей, которое пунктурирует невыносимое обстоятельство обстоятельств.","Տղամարդուն սանրվածք անելու համար նախ պետք է պարզել, թե ինչ մակարդակ ունի նա, որպեսզի ամեն ինչ ճիշտ արվի։ Առանց դրա հնարավոր չէ ձևակերպել դատավորների միաձայն որոշումը, որը վերացնում է անտանելի հանգամանքների հանգամանքները։","To cut a man's hair, we first need to determine his level in order to do this and that. Without this, it is impossible to formulate the judges' unanimous decision, which punctures an unbearable set of circumstances."],
    ["Мужская стрижка с последующим окрашиванием волос.","Տղամարդու սանրվածք՝ հետագա մազերի ներկմամբ։","Men's haircut followed by hair coloring."],
    ["4 600 ₽","4 600 ₽","4 600 ₽"],
    ["от 15 000 ₽","from 15 000 ₽","from 15 000 ₽"],
    ["от 4 000 ₽","from 4 000 ₽","from 4 000 ₽"],
    ["от","from","from"],
    ["1 000 ₽","1 000 ₽","1 000 ₽"],
    ["Привет, это описание. Оно очень необходимо для того, чтобы вы понимали, что это такое. Но это мелирование, поэтому действуйте именно вот так.","Բարև, սա ծառայության նկարագրությունն է։ Այն անհրաժեշտ է, որպեսզի հասկանաք, թե ինչ է այս ծառայությունը։ Սա մելիրավորում է, ուստի պետք է գործել հենց այսպես։","Hello, this is a description. It is important so you understand what this service is. Since this is highlighting, follow these instructions."],
    ["если ваши волосы когда-то испортились или вы обожгли их утюгом, есть специальное средство для того, чтобы выйти из этого состояния и вновь обрести хорошие, свежие, красивые волосы. Чтобы всё было хорошо, запишитесь к нам на услугу, и мы примем вас, как только вы возьмёте.","Եթե ձեր մազերը երբևէ վնասվել են կամ այրվել են արդուկից, կա հատուկ միջոց, որը կօգնի վերականգնել դրանք և վերադարձնել առողջ, թարմ ու գեղեցիկ տեսքը։ Գրանցվեք այս ծառայությանը, և մենք ձեզ կընդունենք հենց որ ամրագրեք այցը։","If your hair was damaged or burned with a straightener, there is a special treatment to help restore it and bring back a healthy, fresh, beautiful look. Book this service and we will welcome you as soon as you make an appointment."],
    ["Подробнее…","Ավելին…","Read more…"],
    ["5 000–10 000 ֏","5 000–10 000 ֏","5 000–10 000 ֏"],
    ["15 000 ₽","15 000 ₽","15 000 ₽"],
    ["от 6 000 ₽","from 6 000 ₽","from 6 000 ₽"],
    ['Меню','Մենյու','Menu'],
    ['Открыть меню','Բացել մենյուն','Open menu'],
    ['Салон красоты','Գեղեցկության սրահ','Beauty salon'],
    ['Описание салона.','Գեղեցկության սրահ Քաղաքի սրտում։','A beauty salon in the heart of City.'],
    ['Проверяем','Ստուգում ենք','Checking'],
    ['режим работы','աշխատանքային ժամերը','opening hours'],
    ['Город,','Քաղաք,','City,'],
    ['Адрес салона','Սրահի հասցեն','Salon address'],
    ['Телефон салона','Սրահի հեռախոսահամարը','Salon phone'],
    ['Контакт будет добавлен','Կոնտակտը կավելացվի','Contact will be added'],
    ['Мессенджер','Մեսենջեր','Messenger'],
    ['Записаться','Ամրագրել','Book now'],
    ['Записаться →','Ամրագրել →','Book now →'],
    ['Записаться онлайн','Ամրագրել առցանց','Book online'],
    ['Смотреть работы','Դիտել աշխատանքները','View our work'],
    ['Портфолио','Պորտֆոլիո','Portfolio'],
    ['Услуги','Ծառայություններ','Services'],
    ['О салоне','Սրահի մասին','About'],
    ['Команда','Թիմ','Team'],
    ['Отзывы','Կարծիքներ','Reviews'],
    ['Контакты','Կոնտակտներ','Contacts'],
    ['Визит','Այց','Visit'],
    ['Разведите двумя пальцами, чтобы увеличить','Մեծացնելու համար երկու մատով բացեք պատկերը','Pinch with two fingers to zoom'],
    ['Закрыть','Փակել','Close'],
    ['Фото SALON NAME','SALON NAME-ի լուսանկար','SALON NAME photo'],
    ['Открыть галерею','Բացել պատկերասրահը','Open gallery'],
    ['Галерея','Պատկերասրահ','Gallery'],
    ['Салон','Սրահ','Salon'],
    ['Ногти','Եղունգներ','Nails'],
    ['Волосы','Մազեր','Hair'],
    ['Брови и ресницы','Հոնքեր և թարթիչներ','Brows and Lashes'],
    ['Эпиляция','Էպիլյացիա','Hair Removal'],
    ['Макияж','Դիմահարդարում','Makeup'],
    ['Массаж','Մերսում','Massage'],
    ['Другое','Այլ','Other'],
    ['Косметология','Կոսմետոլոգիա','Cosmetology'],
    ['Все','Բոլորը','All'],
    ['Фото ресниц пока не добавлены','Թարթիչների լուսանկարները դեռ չեն ավելացվել','Eyelash photos have not been added yet'],
    ['Наши работы','Մեր աշխատանքները','Our work'],
    ['Открыть галерею','Բացել պատկերասրահը','Open gallery'],
    ['Наши услуги','Մեր ծառայությունները','Our services'],
    ['Свернуть','Փակել ցանկը','Show less'],
    ['Наша команда','Մեր թիմը','Our team'],
    ['Мастера своего дела','Իրենց գործի վարպետները','Experts in their craft'],
    ['Информация о мастерах будет добавлена.','Մասնագետների մասին տեղեկությունը կավելացվի։','Specialist information will be added.'],
    ['Листайте','Սահեցրեք','Swipe'],
    ['Nail-мастер','Մատնահարդարման վարպետ','Nail specialist'],
    ['Парикмахер','Վարսահարդար','Hair stylist'],
    ['Косметолог','Կոսմետոլոգ','Cosmetologist'],
    ['Маникюр · педикюр','Մատնահարդարում · ոտնահարդարում','Manicure · pedicure'],
    ['Волосы · укладки','Մազեր · հարդարում','Hair · styling'],
    ['Профиль','Պրոֆիլ','Profile'],
    ['О мастере','Մասնագետի մասին','About the specialist'],
    ['Пока нет данных об услугах.','Ծառայությունների մասին տվյալներ դեռ չկան։','No service information yet.'],
    ['Пока нет фото.','Լուսանկարներ դեռ չկան։','No photos yet.'],
    ['Пока нет отзывов.','Կարծիքներ դեռ չկան։','No reviews yet.'],
    ['рейтинг салона','սրահի վարկանիշ','salon rating'],
    ['Что говорят о нас','Ինչ են ասում մեր մասին','What clients say about us'],
    ['Подробнее →','Ավելին →','Read more →'],
    ['Смотреть все отзывы →','Դիտել բոլոր կարծիքները →','View all reviews →'],
    ['Ждём вас','Սպասում ենք ձեզ','We look forward to seeing you'],
    ['Город, Адрес салона','Քաղաք, Սրահի հասցե','City, salon address'],
    ['Открыть карту','Բացել քարտեզը','Open map'],
    ['Нажмите, чтобы позвонить','Սեղմեք զանգահարելու համար','Tap to call'],
    ['Написать в салон','Գրել սրահին','Message the salon'],
    ['График работы','Աշխատանքային ժամեր','Opening hours'],
    ['Уточняется','Կավելացվի','To be added'],
    ['Загружаем карту…','Քարտեզը բեռնվում է…','Loading map…'],
    ['Позвонить','Զանգահարել','Call'],
    ['Построить маршрут','Ստանալ երթուղին','Get directions'],
    ['Цифровой офис для салонов красоты','Թվային գրասենյակ գեղեցկության սրահների համար','Digital office for beauty salons'],
    ['График работы','Աշխատանքային ժամեր','Opening hours'],
    ['График работы','Աշխատանքային ժամեր','Opening hours'],
    ['Открыто','Բաց է','Open'],
    ['Закрыто','Փակ է','Closed'],
    ['Уточняется','Կավելացվի','To be added'],
    ['Уточняется','Կավելացվի','To be added'],
    ['О нас','Մեր մասին','About us'],
    ['Салон красоты в городе','Գեղեցկության սրահ Քաղաքում','Beauty salon in City'],
    ['SALON NAME — салон красоты.','SALON NAME — գեղեցկության սրահ Քաղաքում։','SALON NAME — a beauty salon in City.'],
    ['Описание услуг салона.','Մատնահարդարում, մազեր, հոնքեր և թարթիչներ, դիմահարդարում, կոսմետոլոգիա, էպիլյացիա և մերսում՝ մեկ վայրում։','Manicure, hair, brows and lashes, makeup, cosmetology, hair removal and massage — all in one place.'],
    ['В основе нашей работы — профессиональный подход, внимание к деталям и уважение к индивидуальности каждого гостя. Мы создаём комфортное пространство, где качество и забота остаются главным приоритетом.','Մեր աշխատանքի հիմքում մասնագիտական մոտեցումն է, ուշադրությունը մանրուքներին և հարգանքը յուրաքանչյուր հյուրի անհատականության նկատմամբ։ Մենք ստեղծում ենք հարմարավետ միջավայր, որտեղ որակն ու հոգատարությունը մնում են գլխավոր առաջնահերթությունները։','Our work is built on professionalism, attention to detail, and respect for every guest’s individuality. We create a comfortable space where quality and care remain our highest priorities.'],
    ['Мастера разных направлений','Տարբեր ուղղությունների մասնագետներ','Specialists in different fields'],
    ['Комфортная атмосфера','Հարմարավետ մթնոլորտ','Comfortable atmosphere'],
    ['Индивидуальный подход','Անհատական մոտեցում','Personal approach'],
    ['Запись','Ամրագրում','Booking'],
    ['Как вам удобнее записаться?','Ինչպե՞ս է ձեզ հարմար ամրագրել։','How would you like to book?'],
    ['Выберите удобный способ связи.','Ընտրեք ձեզ հարմար կապի տարբերակը։','Choose the most convenient way to contact us.'],
    ['Телефон','Հեռախոս','Phone'],
    ['Создано в','Ստեղծված է','Created with'],
    ['Создано в TANEM.ru','Ստեղծված է TANEM.ru-ում','Created with TANEM.ru'],
    ['ежедневно','ամեն օր','daily'],
    ['рейтинг','վարկանիշ','rating'],
    ['оценок','գնահատական','ratings'],
    ['услуг','ծառայություն','services'],
    ['Педикюр','Ոտնահարդարում','Pedicure'],
    ['Процедуры для бровей','Հոնքերի խնամքի ծառայություններ','Brow treatments'],
    ['Свадебные прически','Հարսանեկան սանրվածքներ','Bridal hairstyles'],
    ['Тридинг бровей','Հոնքերի թրիդինգ','Brow threading'],
    ['Удаление волос нитью','Մազահեռացում թելով','Threading hair removal'],
    ['Укладка волос','Մազերի հարդարում','Hair styling'],
    ['Прокалывание ушей','Ականջների ծակում','Ear piercing'],
    ['Шугаринг','Շուգարինգ','Sugaring'],
    ['Стрижка волос','Մազերի կտրում','Haircut'],
    ['Электроэпиляция игловая','Ասեղային էլեկտրոէպիլյացիա','Needle electrolysis'],
    ['Окрашивание волос','Մազերի ներկում','Hair coloring'],
    ['Уход за волосами восстановление повреждённых волос','Մազերի խնամք և վնասված մազերի վերականգնում','Hair care and damaged hair restoration'],
    ['Спа процедура для волос','ՍՊԱ խնամք մազերի համար','Hair spa treatment'],
    ['Наращивание ногтей','Եղունգների երկարացում','Nail extensions'],
    ['Маникюр + покрытие гельлак','Մատնահարդարում + գել-լաք ծածկույթ','Manicure + gel polish'],
    ['Маникюр + покрытие лак','Մատնահարդարում + լաք ծածկույթ','Manicure + nail polish'],
    ['Парафинотерапия для рук','Ձեռքերի պարաֆինաթերապիա','Paraffin hand treatment'],
    ['Карбокси терапия','Կարբոքսիթերապիա','Carboxytherapy'],
    ['Ультразвуковая чистка лица','Դեմքի ուլտրաձայնային մաքրում','Ultrasonic facial cleansing'],
    ['Восковая эпиляция','Մոմային էպիլյացիա','Waxing'],
    ['Коррекция формы бровей','Հոնքերի ձևի շտկում','Brow shaping'],
    ['Косы','Հյուսքեր','Braids'],
    ['Ламинирование бровей','Հոնքերի լամինացիա','Brow lamination'],
    ['Ламинирование ресниц','Թարթիչների լամինացիա','Lash lamination'],
    ['Маникюр','Մատնահարդարում','Manicure'],
    ['Мытье головы шампунем и кондиционирование','Մազերի լվացում շամպունով և կոնդիցիոներով','Shampoo and conditioning'],
    ['Наращивание волос','Մազերի երկարացում','Hair extensions'],
    ['Наращивание ресниц','Թարթիչների երկարացում','Eyelash extensions']
  ];

  if(window.TANEM_SITE_DATA?.mode==='production')rows.push(...(window.TANEM_SITE_I18N_ROWS||[]));
  var direct={};
  rows.forEach(function(row){ direct[row[0]]=row; });

  var langIndex={ru:0,hy:1,en:2,uz:2,tg:2};

  function getSaved(){
    try{
      var v=localStorage.getItem(STORAGE_KEY);
      return REGION.locales.includes(v)?v:null;
    }catch(_){ return null; }
  }

  function detect(){
    var saved=getSaved();
    if(saved) return saved;
    var langs=(navigator.languages&&navigator.languages.length?navigator.languages:[navigator.language||'en']).map(function(x){return String(x||'').toLowerCase()});
    for(var lang of ['hy','uz','tg','ru','en'])if(REGION.locales.includes(lang)&&langs.some(function(x){return x.indexOf(lang)===0}))return lang;
    return REGION.locales.includes('en')?'en':REGION.fallback;
  }

  function save(lang){
    try{ localStorage.setItem(STORAGE_KEY,lang); }catch(_){}
  }

  function dynamicValue(source,lang){
    var serviceMatch=source.match(/^Услуга (\d+)$/);
    if(serviceMatch) return lang==='hy'?'Ծառայություն '+serviceMatch[1]:lang==='en'?'Service '+serviceMatch[1]:source;
    var masterMatch=source.match(/^Мастер (\d+)$/);
    if(masterMatch) return lang==='hy'?'Մասնագետ '+masterMatch[1]:lang==='en'?'Specialist '+masterMatch[1]:source;
    var m;
    m=source.match(/^Показать ещё (\d+) (?:услугу|услуги|услуг)$/);
    if(m) return lang==='hy'?'Ցույց տալ ևս '+m[1]+' ծառայություն':lang==='en'?'Show '+m[1]+' more services':source;
    m=source.match(/^Доступно (\d+) (?:услуг|услуги|услугу)$/);
    if(m) return lang==='hy'?'Հասանելի է '+m[1]+' ծառայություն':lang==='en'?m[1]+' services available':source;
    if(source==='Сведения уточняются') return lang==='hy'?'Տվյալները շուտով':lang==='en'?'Details coming soon':source;
    if(source==='Информация о мастере появится после подтверждения салоном.') return lang==='hy'?'Մասնագետի տվյալները կհրապարակվեն հաստատումից հետո։':lang==='en'?'The master profile will be published after confirmation.':source;
    m=source.match(/^(\d+) отзыв(?:ов|а)?(?: на сайте)? · Источник отзывов$/);
    if(m) return lang==='hy'?'Կարծիքները կավելացվեն':lang==='en'?'Reviews will be added':'Отзывы будут добавлены';
    m=source.match(/^(\d{1,2}) из (\d{1,2})$/);
    if(m) return lang==='hy'?m[1]+' / '+m[2]:lang==='en'?m[1]+' of '+m[2]:source;
    return null;
  }

  function canTranslate(source){
    return !!direct[source] || dynamicValue(source,'ru')!==null || !!REGION.ui(source,'uz') || !!REGION.ui(source,'tg');
  }

  function outputFor(source,lang){
    var row=direct[source];
    if(source==='Наша команда')return lang==='ru'?'Наша команда':'Our Team';
    var special=REGION.ui(source,lang,row&&row[2]);
    if(special!==null)return special;
    if(row) return row[langIndex[lang]];
    var dyn=dynamicValue(source,lang);
    return dyn===null?source:dyn;
  }

  function skipText(node){
    var el=node.parentElement;
    if(!el) return true;
    if(el.closest('.br-lang-switch')) return true;
    if(el.closest('.tn30-review-card p,.br-review-card p,.tn22-master-review p')) return true;
    return /^(SCRIPT|STYLE|NOSCRIPT)$/.test(el.tagName);
  }

  function translateTree(scope,lang){
    if(!scope) return;
    var walker=document.createTreeWalker(scope,NodeFilter.SHOW_TEXT);
    var nodes=[];
    while(walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(function(node){
      if(skipText(node)) return;
      var raw=node.nodeValue||'';
      var trimmed=raw.trim();
      if(!trimmed) return;
      var canonical=node.__brI18nCanonical;
      if(!canonical && canTranslate(trimmed)){
        canonical=trimmed;
        node.__brI18nCanonical=canonical;
      }
      if(!canonical) return;
      var next=outputFor(canonical,lang);
      var leading=(raw.match(/^\s*/)||[''])[0];
      var trailing=(raw.match(/\s*$/)||[''])[0];
      node.nodeValue=leading+next+trailing;
    });
  }

  function translateAttributes(scope,lang){
    if(!scope) return;
    ['aria-label','title','alt'].forEach(function(attr){
      scope.querySelectorAll('['+attr+']').forEach(function(el){
        var key='brI18n'+attr.replace(/-([a-z])/g,function(_,c){return c.toUpperCase();}).replace(/^./,function(c){return c.toUpperCase();});
        var source=el.dataset[key];
        var current=(el.getAttribute(attr)||'').trim();
        if(!source && canTranslate(current)){
          source=current;
          el.dataset[key]=source;
        }
        if(source) el.setAttribute(attr,outputFor(source,lang));
      });
    });
  }

  function ensureStyle(){
    if(document.getElementById('salon-mobile-i18n-style')) return;
    var style=document.createElement('style');
    style.id='salon-mobile-i18n-style';
    style.textContent=[
      '@media(max-width:1023px){',
      '#salon-mobile .br-lang-switch{position:absolute;z-index:66;top:0;right:57px;height:52px;display:flex;align-items:center;gap:3px;font-family:Manrope,-apple-system,BlinkMacSystemFont,"Segoe UI",Arial,sans-serif}',
      '#salon-mobile .br-lang-switch button{border:0;background:transparent;padding:0 3px;min-width:27px;height:36px;color:#8b817b;font:600 11.5px/1 Manrope,-apple-system,BlinkMacSystemFont,"Segoe UI",Arial,sans-serif;letter-spacing:.035em;-webkit-tap-highlight-color:transparent}',
      '#salon-mobile .br-lang-switch button.active{color:#171513}',
      '#salon-mobile .br-lang-switch .sep{color:#c7bbb3;font-size:10px;line-height:1;pointer-events:none}',
      '#salon-mobile .br-lang-switch button:active{transform:scale(.92)}',
      '@media(max-width:360px){#salon-mobile .br-lang-switch{right:52px;gap:1px}#salon-mobile .br-lang-switch button{min-width:23px;padding:0 1px;font-size:10.5px}}',
      'body[data-br-lang="hy"] #tn13Portfolio .tn22-port h2{font-size:38px!important;line-height:1!important;letter-spacing:-.035em!important;max-width:100%!important;overflow-wrap:anywhere!important}',
      'body[data-br-lang="hy"] #tn13Services .tn31-services h2{font-size:39px!important;line-height:1!important;letter-spacing:-.035em!important;white-space:normal!important;max-width:100%!important;overflow-wrap:anywhere!important}',
      'body[data-br-lang="hy"] #tn13Services .tn31-service-row{grid-template-columns:minmax(0,1fr) 92px!important;gap:10px!important}',
      'body[data-br-lang="hy"] #tn13Services .tn31-service-copy{min-width:0!important}',
      'body[data-br-lang="hy"] #tn13Services .tn31-service-name{font-weight:500!important;line-height:1.2!important;max-width:100%!important;overflow-wrap:anywhere!important;word-break:normal!important;-webkit-line-clamp:3!important}',
      'body[data-br-lang="hy"] #tn13Services .tn31-service-detail{white-space:normal!important;overflow-wrap:anywhere!important}',
      'body[data-br-lang="hy"] #tn13Visit h2{font-size:39px!important;line-height:1!important;white-space:nowrap!important;letter-spacing:-.035em!important}',
      'body[data-br-lang="hy"] #tn13Visit .tn22-contact:last-child strong{font-size:13.2px!important;white-space:nowrap!important}',
      'body[data-br-lang="hy"] #tn13Visit .tn22-contact:last-child>span:last-child>span{font-size:8.8px!important;white-space:nowrap!important}',
      'body[data-br-lang="hy"] #tn13Visit .tn22-route{font-size:11.5px!important;white-space:nowrap!important}',
      '#salon-mobile .tn22-master-top{display:grid!important;grid-template-columns:40px minmax(0,1fr) 40px!important;align-items:center!important}',
      '#salon-mobile .tn22-master-brand{text-align:center!important;justify-self:center!important;max-width:100%!important;font-size:14px!important;letter-spacing:.12em!important;white-space:nowrap!important}',
      '}'
    ].join('');
    document.head.appendChild(style);
  }

  function ensureSwitcher(){
    if(!root) return;
    var top=root.querySelector('.tn22-top');
    if(!top || top.querySelector('.br-lang-switch')) return;
    var sw=document.createElement('div');
    sw.className='br-lang-switch';
    sw.setAttribute('role','group');
    sw.setAttribute('aria-label','Language');
    var order=REGION.locales.includes('hy')?['hy','ru','en']:REGION.locales;
    sw.innerHTML=order.map(function(lang,index){return (index?'<span class="sep">/</span>':'')+'<button type="button" data-lang="'+lang+'">'+REGION.labels[lang]+'</button>'}).join('');
    sw.addEventListener('pointerdown',function(e){e.stopPropagation();});
    sw.addEventListener('click',function(e){
      var btn=e.target.closest('[data-lang]');
      if(!btn) return;
      e.preventDefault();
      e.stopPropagation();
      setLanguage(btn.getAttribute('data-lang'),true);
    });
    var menu=top.querySelector('.tn22-menu');
    top.insertBefore(sw,menu||null);
  }

  function updateSwitcher(){
    if(!root) return;
    root.querySelectorAll('.br-lang-switch [data-lang]').forEach(function(btn){
      var active=btn.getAttribute('data-lang')===currentLang;
      btn.classList.toggle('active',active);
      btn.setAttribute('aria-pressed',active?'true':'false');
    });
  }

  function applySpecials(){
    if(!root) return;
    var credit=root.querySelector('.br-tanem-copy');
    if(credit){
      if(currentLang==='hy') credit.innerHTML='Ստեղծված է <strong>TANEM.ru</strong>-ում';
      else if(currentLang==='en') credit.innerHTML='Created with <strong>TANEM.ru</strong>';
      else credit.innerHTML='Создано в <strong>TANEM.ru</strong>';
    }

    var galleryHeading=root.querySelector('#tn13Gallery .tn22-gallery-title strong');
    if(galleryHeading) galleryHeading.textContent=currentLang==='ru'?'Галерея':'Gallery';
    var masterBrand=root.querySelector('.tn22-master-brand');
    if(masterBrand) masterBrand.textContent='SALON NAME';

    if(currentLang==='hy'){
      var team=root.querySelector('#tn13Team');
      var masterPage=root.querySelector('.tn22-master-page');
      if(team){
        translateTree(team,'en');
        translateAttributes(team,'en');
      }
      if(masterPage){
        translateTree(masterPage,'en');
        translateAttributes(masterPage,'en');
      }
    }
  }

  function updateMeta(){
    var m=meta[currentLang]||meta.en;
    document.documentElement.lang=currentLang;
    document.documentElement.dir='ltr';
    document.title=m.title;
    var desc=document.querySelector('meta[name="description"]');
    if(desc) desc.setAttribute('content',m.description);
  }

  function applyLanguage(){
    if(!root) return;
    ensureSwitcher();
    translateTree(root,currentLang);
    translateAttributes(root,currentLang);
    const fixedNav=document.querySelector('.salon-template-fixed-nav');
    if(fixedNav){translateTree(fixedNav,currentLang);translateAttributes(fixedNav,currentLang)}
    updateSwitcher();
    applySpecials();
    updateMeta();
    document.body.dataset.brLang=currentLang;
    window.dispatchEvent(new CustomEvent('salon-template:languagechange',{detail:{lang:currentLang}}));
  }

  function setLanguage(lang,userChoice){
    lang=REGION.resolve(lang);
    currentLang=lang;
    if(userChoice) save(lang);
    applyLanguage();
    setTimeout(applyLanguage,0);
    setTimeout(applyLanguage,80);
    setTimeout(applyLanguage,260);
  }

  function start(){
    ensureStyle();
    currentLang=detect();
    var attempts=0;
    var timer=setInterval(function(){
      attempts++;
      root=document.getElementById('salon-mobile');
      if(!root){
        if(attempts>100) clearInterval(timer);
        return;
      }
      clearInterval(timer);
      setLanguage(currentLang,false);
      [250,700,1400].forEach(function(ms){setTimeout(applyLanguage,ms);});
      root.addEventListener('click',function(e){
        if(e.target.closest('.br-lang-switch')) return;
        setTimeout(applyLanguage,0);
        setTimeout(applyLanguage,90);
      },true);
      setInterval(function(){
        var statusRoot=root.querySelector('#tn22Status');
        var heroStatus=root.querySelector('.tn50-hero-status');
        if(statusRoot) translateTree(statusRoot,currentLang);
        if(heroStatus) translateTree(heroStatus,currentLang);
      },1000);
    },80);
  }

  start();
})();

/* salon-template-cold-neutral-20260924 */
(function(){if(document.getElementById('salon-template-cold-neutral-20260924'))return;const lateCss=document.createElement('link');lateCss.id='salon-template-cold-neutral-20260924';lateCss.rel='stylesheet';lateCss.href='mobile-overrides.css?v=salon-20261003-v4';document.head.appendChild(lateCss);const paletteCss=document.createElement('link');paletteCss.id='tanem-salon-palette-v2';paletteCss.rel='stylesheet';paletteCss.href='salon-palette.css?v=salon-20261003-v2';document.head.appendChild(paletteCss);})();
