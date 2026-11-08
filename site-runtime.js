(function(){
  'use strict';

  const data=window.TANEM_SITE_DATA;
  if(!data||data.mode!=='production')return;

  const REGION=window.TANEM_REGION||{locales:data.locales||['ru','en','hy'],fallback:data.defaultLocale||'ru',resolve:lang=>lang};
  const currentLang=()=>{
    const raw=(document.body.dataset.brLang||document.documentElement.lang||REGION.fallback||'ru').toLowerCase();
    return REGION.resolve(raw);
  };
  const text=(value,lang=currentLang())=>{
    if(value==null)return '';
    if(typeof value==='string')return value;
    return value[lang]??value[data.defaultLocale||'ru']??value.ru??value.en??value.hy??'';
  };
  const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const isExternal=url=>/^(?:https?:|tg:|viber:|whatsapp:)/i.test(String(url||''));
  const phoneHref=()=>data.contacts.phone?'tel:'+String(data.contacts.phone).replace(/[^+\d]/g,''):'';
  const mapActionLabel=lang=>data.country==='RU'
    ?(lang==='en'?'Open in Yandex Maps':lang==='hy'?'Բացել Yandex Maps-ում':'Открыть в Яндекс Картах')
    :(lang==='en'?'Open in Google Maps':lang==='hy'?'Բացել Google Maps-ում':'Открыть в Google Maps');
  const callActionLabel=lang=>lang==='en'?'Call':lang==='hy'?'Զանգահարել':'Позвонить';
  const messageActionLabel=(lang,name)=>lang==='en'?'Message '+name:lang==='hy'?'Գրել '+name:'Написать в '+name;
  const setCardVisible=(node,visible)=>{
    if(!node)return;
    node.hidden=!visible;
    if(visible)node.style.removeProperty('display');
    else node.style.setProperty('display','none','important');
  };

  function setText(selector,value,scope=document){
    scope.querySelectorAll(selector).forEach(node=>{node.textContent=value});
  }
  function setLink(node,url,fallback){
    if(!node)return;
    if(url){
      node.setAttribute('href',url);
      node.removeAttribute('aria-disabled');
      if(isExternal(url)){node.setAttribute('target','_blank');node.setAttribute('rel','noopener noreferrer')}
      else{node.removeAttribute('target');node.removeAttribute('rel')}
    }else{
      node.setAttribute('href',fallback||'#');
      node.setAttribute('aria-disabled','true');
      node.removeAttribute('target');
      node.removeAttribute('rel');
    }
  }
  function replaceBrandTokens(scope,name){
    if(!scope)return;
    const walker=document.createTreeWalker(scope,NodeFilter.SHOW_TEXT);
    const nodes=[];
    while(walker.nextNode())nodes.push(walker.currentNode);
    nodes.forEach(node=>{if((node.nodeValue||'').includes('SALON NAME'))node.nodeValue=node.nodeValue.replaceAll('SALON NAME',name)});
    scope.querySelectorAll('[aria-label],[alt],[title]').forEach(node=>{
      ['aria-label','alt','title'].forEach(attribute=>{
        const value=node.getAttribute(attribute);
        if(value&&value.includes('SALON NAME'))node.setAttribute(attribute,value.replaceAll('SALON NAME',name));
      });
    });
  }

  function bookingItems(lang){
    const items=(data.contacts.booking||[]).map(item=>({...item}));
    if(data.contacts.phone&&!items.some(item=>item.type==='phone')){
      items.unshift({type:'phone',label:{ru:'Телефон',en:'Phone',hy:'Հեռախոս'},url:phoneHref()});
    }
    if(data.contacts.messengerUrl&&!items.some(item=>item.type==='messenger')){
      items.push({type:'messenger',label:data.contacts.messengerLabel,url:data.contacts.messengerUrl});
    }
    if(data.contacts.mapUrl&&!items.some(item=>item.type==='map')){
      items.push({type:'map',label:{ru:'Карты',en:'Map',hy:'Քարտեզ'},url:data.contacts.mapUrl});
    }
    const seen=new Set();
    return items.filter(item=>{
      const url=String(item.url||'').trim();
      if(!url||seen.has(url))return false;
      seen.add(url);
      item.localizedLabel=text(item.label,lang)||text(item.title,lang)||'Записаться';
      return true;
    });
  }

  function renderDesktopBooking(lang){
    const box=document.querySelector('#stdBookOverlay .std-book-options');
    if(!box)return;
    const action=lang==='hy'?'Բացել →':lang==='en'?'Open →':'Открыть →';
    box.innerHTML=bookingItems(lang).map(item=>
      `<a href="${esc(item.url)}"><span>${esc(item.localizedLabel)}</span><span>${action}</span></a>`
    ).join('');
    box.querySelectorAll('a').forEach(link=>setLink(link,link.getAttribute('href'),'#salonDesktopContacts'));
  }

  function mobileBookingIcon(type){
    if(type==='phone')return '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M7 4h3l1.3 4-2 1.5c1 2 2.6 3.6 4.6 4.6l1.5-2L19 13.5v3c0 1.1-.9 2-2 2C10.4 18.5 5.5 13.6 5.5 7A2 2 0 0 1 7 4Z"/></svg>';
    if(type==='map')return '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 21s6-5.3 6-11a6 6 0 1 0-12 0c0 5.7 6 11 6 11Z"/><circle cx="12" cy="10" r="2.2"/></svg>';
    return '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 5.5h14v10H9l-4 3v-13Z"/></svg>';
  }
  function renderMobileBooking(lang){
    const box=document.querySelector('#tn13BookSheet .tn50-book-options');
    if(!box)return;
    box.innerHTML=bookingItems(lang).map(item=>
      `<a class="tn50-book-option" href="${esc(item.url)}"><span class="tn50-book-icon ${esc(item.type||'message')}">${mobileBookingIcon(item.type)}</span><span><strong>${esc(item.localizedLabel)}</strong></span><span class="tn50-book-arrow">→</span></a>`
    ).join('');
    box.querySelectorAll('a').forEach(link=>setLink(link,link.getAttribute('href'),'#tn13Visit'));
  }

  function scheduleState(){
    const periods=data.schedule?.periods||[];
    if(!periods.length)return null;
    const parts=new Intl.DateTimeFormat('en-US',{timeZone:data.schedule.timezone||'UTC',weekday:'short',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(new Date());
    const values=Object.fromEntries(parts.map(part=>[part.type,part.value]));
    const weekday={Mon:1,Tue:2,Wed:3,Thu:4,Fri:5,Sat:6,Sun:7}[values.weekday];
    const now=(weekday-1)*1440+Number(values.hour)*60+Number(values.minute);
    const minutes=value=>{const match=String(value||'').match(/^(\d{1,2}):(\d{2})$/);return match?Number(match[1])*60+Number(match[2]):null};
    const intervals=[];
    periods.forEach(period=>(period.days||[]).forEach(day=>{
      const open=minutes(period.open),close=minutes(period.close);
      if(open==null||close==null)return;
      const start=(Number(day)-1)*1440+open;
      const end=(Number(day)-1)*1440+close+(close<=open?1440:0);
      [-10080,0,10080].forEach(shift=>intervals.push({start:start+shift,end:end+shift,open:period.open,close:period.close}));
    }));
    const active=intervals.find(interval=>now>=interval.start&&now<interval.end);
    if(active)return {open:true,time:active.close};
    const next=intervals.filter(interval=>interval.start>now).sort((a,b)=>a.start-b.start)[0];
    return {open:false,time:next?.open||''};
  }
  function statusCopy(state,lang){
    if(!state)return {main:lang==='hy'?'Աշխատանքային ժամեր':lang==='en'?'Opening hours':'График',sub:text(data.schedule.fallback,lang),full:text(data.schedule.fallback,lang)};
    const main=state.open?(lang==='hy'?'Բաց է մինչև':lang==='en'?'Open until':'Открыто до'):(lang==='hy'?'Փակ է մինչև':lang==='en'?'Closed until':'Закрыто до');
    return {main,sub:state.time,full:(main+' '+state.time).trim()};
  }
  function applySchedule(lang){
    const state=scheduleState(),copy=statusCopy(state,lang),kind=state?(state.open?'open':'closed'):'';
    const desktopMain=document.querySelector('#stdStatusMain');
    const desktopSub=document.querySelector('#stdStatusSub');
    if(desktopMain)desktopMain.textContent=copy.main;
    if(desktopSub)desktopSub.textContent=copy.sub;
    const sticky=document.querySelector('#stdStickyServiceCard');
    sticky?.classList.remove('is-open','is-closed');
    if(kind)sticky?.classList.add('is-'+kind);
    setText('#stdStickyServiceStatus',copy.main);
    setText('#stdStickyServiceStatusSub',copy.sub);
    const contactStatus=document.querySelector('#stdContactStatus');
    contactStatus?.classList.remove('open','closed');
    if(kind)contactStatus?.classList.add(kind);
    setText('#stdContactStatusText',copy.full);
    setText('#stdContactHoursSub',copy.full);
    const mobileStatus=document.querySelector('#tn22Status');
    mobileStatus?.classList.remove('open','closed');
    if(kind)mobileStatus?.classList.add(kind);
    setText('#tn22Status .tn22-status-text',copy.full);
    const mobileHero=document.querySelector('.tn50-hero-status');
    mobileHero?.classList.remove('open','closed');
    if(kind)mobileHero?.classList.add(kind);
    setText('.tn50-hero-status-main',copy.main);
    setText('.tn50-hero-status-sub',copy.sub);
    const mobileHours=document.querySelector('#tn13Visit .tn22-contact-grid > :last-child span:last-child span');
    if(mobileHours)mobileHours.textContent=copy.full;
  }

  function applyRatingAndReviews(lang){
    const value=Number(data.rating?.value);
    const count=Number(data.rating?.count)||0;
    const hasRating=Number.isFinite(value)&&value>0;
    const countCopy=lang==='hy'?`${count} գնահատական`:lang==='en'?`${count} rating${count===1?'':'s'}`:`${count} оцен${count%10===1&&count%100!==11?'ка':count%10>=2&&count%10<=4&&(count%100<12||count%100>14)?'ки':'ок'}`;
    const missing=lang==='hy'?'վարկանիշը նշված չէ':lang==='en'?'rating not specified':'рейтинг не указан';
    document.querySelectorAll('.dct-about-rating,.tn42-rating').forEach(node=>{
      const strong=node.querySelector('strong'),label=node.querySelector('span:last-child');
      if(strong)strong.textContent=hasRating?String(value).replace('.',','):'—';
      if(label)label.textContent=hasRating?countCopy:missing;
    });
    document.querySelectorAll('.std-reviews-score,.br-score,.tn30-score').forEach(node=>{
      const strong=node.querySelector('strong');
      const label=node.querySelector('.std-reviews-count,.br-count,.tn30-count');
      if(strong)strong.textContent=hasRating?String(value).replace('.',','):'—';
      if(label)label.textContent=hasRating?countCopy:missing;
    });
    document.querySelectorAll('.std-reviews-stars').forEach(node=>node.setAttribute('aria-label',hasRating?`${value} / 5`:missing));

    const reviews=data.reviews||[];
    if(reviews.length)document.querySelectorAll('#salonDesktopReviews .std-review-card').forEach((card,index)=>{
      const review=reviews[index%reviews.length];
      setText('.std-review-name',text(review.author,lang),card);
      setText('.std-review-text',text(review.text,lang),card);
      setText('.std-review-meta',text(review.source,lang),card);
      setLink(card,review.url||data.contacts.reviewsUrl,'#salonDesktopReviews');
    });
    const reviewsAll=document.querySelector('.std-reviews-all');
    if(reviewsAll)setLink(reviewsAll,data.contacts.reviewsUrl,'#salonDesktopReviews');
  }

  function applyDesktop(lang){
    const root=document.getElementById('salon-desktop-v1');
    if(!root)return;
    const salon=data.salon,contacts=data.contacts;
    setText('.std-header-brand-main,.std-logo:not(.std-logo-image),.dct-about-brand',text(salon.name,lang),root);
    const desktopBrand=root.querySelector('.std-header-brand-main');
    if(desktopBrand){
      const cleanName=text(salon.name,lang).trim();
      const fitDesktopBrand=()=>{
        if(desktopBrand.textContent.trim()!==cleanName)return;
        desktopBrand.style.removeProperty('font-size');
        const nav=root.querySelector('.std-nav');
        if(!nav)return;
        const brandRect=desktopBrand.getBoundingClientRect(),navRect=nav.getBoundingClientRect();
        const available=Math.max(0,navRect.left-brandRect.left-12);
        const rendered=desktopBrand.scrollWidth;
        const base=parseFloat(getComputedStyle(desktopBrand).fontSize)||31;
        if(available>0&&rendered>available+1){
          const fitted=Math.max(18,Math.floor(base*(available/rendered)*.96));
          desktopBrand.style.setProperty('font-size',fitted+'px','important');
        }
      };
      requestAnimationFrame(fitDesktopBrand);
      if(document.fonts?.ready)document.fonts.ready.then(()=>requestAnimationFrame(fitDesktopBrand)).catch(()=>{});
    }
    setText('.std-tagline',text(salon.heroDescription,lang),root);
    setText('.dct-about-kind',text(salon.kind,lang),root);
    setText('.dct-about-copy',text(salon.about,lang),root);
    const address=root.querySelector('.std-address');
    if(address){address.textContent='';address.append(text(salon.city,lang)+',',document.createElement('br'),text(salon.address,lang))}
    const stickyRoute=root.querySelector('.dct-service-sticky-route');
    if(stickyRoute){setText('b',text(salon.city,lang),stickyRoute);setText('small',text(salon.address,lang),stickyRoute);setLink(stickyRoute,contacts.mapUrl,'#salonDesktopContacts')}
    const addressCard=root.querySelector('#salonDesktopContacts [data-contact-type="address"]');
    const phoneCard=root.querySelector('#salonDesktopContacts [data-contact-type="phone"]');
    const messengerCard=root.querySelector('#salonDesktopContacts [data-contact-type="messenger"]');
    if(addressCard){setText('.std-contact-card-title',text(salon.city,lang)+', '+text(salon.address,lang),addressCard);setText('.std-contact-card-sub',mapActionLabel(lang),addressCard);setLink(addressCard,contacts.mapUrl,'#salonDesktopContacts')}
    setCardVisible(phoneCard,!!contacts.phone);
    if(phoneCard&&contacts.phone){setText('.std-contact-card-title',contacts.phone,phoneCard);setText('.std-contact-card-sub',callActionLabel(lang),phoneCard);setLink(phoneCard,phoneHref(),'#salonDesktopContacts')}
    setCardVisible(messengerCard,!!contacts.messengerUrl);
    if(messengerCard&&contacts.messengerUrl){setText('.std-contact-card-title',text(contacts.messengerLabel,lang),messengerCard);setText('.std-contact-card-sub',messageActionLabel(lang,text(salon.name,lang)),messengerCard);setLink(messengerCard,contacts.messengerUrl,'#salonDesktopContacts')}
    const headerPhone=root.querySelector('.std-phone');
    const contactCall=root.querySelector('.std-contact-call');
    setCardVisible(headerPhone,!!contacts.phone);
    setCardVisible(contactCall,!!contacts.phone);
    root.querySelector('#salonDesktopContacts .std-contact-actions')?.classList.toggle('is-single',!contacts.phone);
    if(headerPhone&&contacts.phone){setLink(headerPhone,phoneHref(),'#salonDesktopContacts');setText('span',contacts.phone,headerPhone)}
    setLink(root.querySelector('.std-meta .std-meta-item[href]'),contacts.mapUrl,'#salonDesktopContacts');
    if(contactCall&&contacts.phone)setLink(contactCall,phoneHref(),'#salonDesktopContacts');
    setLink(root.querySelector('.std-contact-route'),contacts.mapUrl,'#salonDesktopContacts');
    const mapFrame=root.querySelector('.std-contact-map iframe');
    if(mapFrame)mapFrame.src=contacts.mapEmbedUrl||'about:blank';
    const hero=data.media.hero?.[0];
    const heroImage=root.querySelector('#stdHeroMedia');
    if(heroImage&&hero){
      const src=typeof hero==='string'?hero:hero.src;
      const alt=typeof hero==='string'?text(salon.name,lang):text(hero.alt,lang);
      if(src)heroImage.src=src;
      heroImage.alt=alt||text(salon.name,lang);
    }
    const aboutImage=root.querySelector('.mct-about-portrait img');
    if(aboutImage&&data.media.about)aboutImage.src=data.media.about;
    const bookingAmenity=root.querySelector('.dct-about-amenities-grid article:last-child span');
    if(bookingAmenity)bookingAmenity.textContent=lang==='hy'?'Գրանցումը հասանելի է հեռախոսով, մեսենջերով կամ առցանց։':lang==='en'?'Book by phone, messenger, or online.':'Запись доступна по телефону, в мессенджере или онлайн.';
    renderDesktopBooking(lang);
  }

  function applyMobile(lang){
    const root=document.getElementById('salon-mobile');
    if(!root)return;
    const salon=data.salon,contacts=data.contacts;
    setText('.tn22-title,.br-about-brand',text(salon.name,lang),root);
    const mobileTitle=root.querySelector('.tn22-title');
    if(mobileTitle){
      const cleanName=text(salon.name,lang).trim();
      const single=cleanName.length>0&&!/\s/u.test(cleanName);
      mobileTitle.classList.toggle('is-single-line',single);
      const baseMax=cleanName.length<=5?68:cleanName.length<=8?60:cleanName.length<=10?54:49;
      mobileTitle.style.setProperty('--hero-single-max',baseMax+'px');
      if(single){
        const fitSingleTitle=()=>{
          if(mobileTitle.textContent.trim()!==cleanName)return;
          mobileTitle.style.setProperty('--hero-single-max',baseMax+'px');
          const available=mobileTitle.clientWidth,rendered=mobileTitle.scrollWidth;
          if(available>0&&rendered>available+1){
            const fitted=Math.max(34,Math.floor(baseMax*(available/rendered)*.96));
            mobileTitle.style.setProperty('--hero-single-max',fitted+'px');
          }
        };
        requestAnimationFrame(fitSingleTitle);
        if(document.fonts?.ready)document.fonts.ready.then(()=>requestAnimationFrame(fitSingleTitle)).catch(()=>{});
      }
    }
    setText('.tn22-sub,.br-about-kind',text(salon.kind,lang),root);
    setText('#tn38About .tn42-copy',text(salon.about,lang),root);
    const location=root.querySelector('.tn37-location .tn37-info-copy');
    if(location)location.innerHTML='<strong>'+esc(text(salon.city,lang))+',</strong>'+esc(text(salon.address,lang));
    const galleryBrand=root.querySelector('.tn22-gallery-title span');
    if(galleryBrand)galleryBrand.textContent=text(salon.name,lang);
    setText('.tn22-master-brand',text(salon.name,lang),root);
    const topBrand=root.querySelector('.tn22-brand');
    if(topBrand){
      const realLogo=data.mode==='production'&&data.media.logo&&!/logo-placeholder\.svg$/i.test(String(data.media.logo));
      if(realLogo){
        let brandImage=topBrand.querySelector('img');
        if(!brandImage){brandImage=document.createElement('img');topBrand.replaceChildren(brandImage)}
        brandImage.src=data.media.logo;brandImage.alt=text(salon.name,lang);
      }else topBrand.textContent=text(salon.name,lang);
    }
    const heroImage=root.querySelector('.br-hero-video');
    const hero=data.media.hero?.[0];
    if(heroImage&&hero&&heroImage.tagName==='IMG'){heroImage.src=hero.src;heroImage.alt=text(hero.alt,lang)}
    const aboutImage=root.querySelector('#tn38About .tn42-photo img');
    if(aboutImage&&data.media.about){aboutImage.src=data.media.about;aboutImage.alt=text(salon.name,lang)}
    const addressCard=root.querySelector('#tn13Visit [data-contact-type="address"]');
    const phoneCard=root.querySelector('#tn13Visit [data-contact-type="phone"]');
    const messengerCard=root.querySelector('#tn13Visit [data-contact-type="messenger"]');
    if(addressCard){setText('strong',text(salon.city,lang)+', '+text(salon.address,lang),addressCard);const sub=addressCard.querySelector('strong+span');if(sub)sub.textContent=mapActionLabel(lang);setLink(addressCard,contacts.mapUrl,'#tn13Visit')}
    setCardVisible(phoneCard,!!contacts.phone);
    if(phoneCard&&contacts.phone){setText('strong',contacts.phone,phoneCard);const sub=phoneCard.querySelector('strong+span');if(sub)sub.textContent=callActionLabel(lang);setLink(phoneCard,phoneHref(),'#tn13Visit')}
    setCardVisible(messengerCard,!!contacts.messengerUrl);
    if(messengerCard&&contacts.messengerUrl){setText('strong',text(contacts.messengerLabel,lang),messengerCard);const sub=messengerCard.querySelector('strong+span');if(sub)sub.textContent=messageActionLabel(lang,text(salon.name,lang));setLink(messengerCard,contacts.messengerUrl,'#tn13Visit')}
    const mobileCall=root.querySelector('.tn22-call');
    setCardVisible(mobileCall,!!contacts.phone);
    root.querySelector('.tn22-visit-actions')?.classList.toggle('is-single',!contacts.phone);
    if(mobileCall&&contacts.phone)setLink(mobileCall,phoneHref(),'#tn13Visit');
    setLink(root.querySelector('.tn22-route'),contacts.mapUrl,'#tn13Visit');
    const mapFrame=root.querySelector('.tn22-mapwrap iframe');
    if(mapFrame)mapFrame.src=contacts.mapEmbedUrl||'about:blank';
    renderMobileBooking(lang);
  }

  function applyOptionalSections(){
    const hasPortfolio=(data.media.portfolio||[]).length>0;
    const hasGallery=Object.values(data.media.gallery||{}).some(items=>items.length>0);
    ['#salonDesktopPortfolio','#tn13Portfolio'].forEach(selector=>{const node=document.querySelector(selector);if(node)node.hidden=!hasPortfolio});
    // Team and reviews are permanent structural sections. Missing data is rendered as a neutral empty state.
    ['#salonDesktopReviews','#tn13Reviews','#salonDesktopTeam','#tn13Team'].forEach(selector=>{const node=document.querySelector(selector);if(node)node.hidden=false});
    if(!hasGallery)document.querySelectorAll('#stdOpenGallery,#stdStickyGalleryOpen,.tn22-port-all,.tn22-worklink,.tn22-media').forEach(node=>{node.hidden=true});
  }

  function apply(){
    const lang=currentLang();
    const name=text(data.salon.name,lang),city=text(data.salon.city,lang);
    applyDesktop(lang);
    applyMobile(lang);
    applySchedule(lang);
    applyRatingAndReviews(lang);
    applyOptionalSections();
    replaceBrandTokens(document.body,name);
    document.title=city?name+' — '+city:name;
    const description=document.querySelector('meta[name="description"]');
    if(description)description.setAttribute('content',text(data.salon.heroDescription,lang)||text(data.salon.about,lang));
  }

  function setupDesktopTeamPaging(){
    const track=document.getElementById('stdTeamTrack');
    if(!track)return;
    const cards=[...track.children].filter(card=>card.classList.contains('std-master'));
    if(cards.length<=4)return;
    track.classList.add('tanem-paged-team');
    let page=0;
    const total=Math.ceil(cards.length/4);
    const controls=document.createElement('div');
    controls.className='tanem-team-controls';
    controls.innerHTML='<button type="button" data-turn="-1" aria-label="Предыдущие мастера">←</button><span aria-live="polite"></span><button type="button" data-turn="1" aria-label="Следующие мастера">→</button>';
    track.after(controls);
    const update=()=>{
      cards.forEach((card,i)=>{
        card.hidden=Math.floor(i/4)!==page;
        card.classList.toggle('tanem-team-solo',page===total-1&&cards.length%4===1&&i===cards.length-1);
      });
      controls.querySelector('span').textContent=(page+1)+' / '+total;
    };
    controls.querySelectorAll('[data-turn]').forEach(button=>button.addEventListener('click',()=>{
      page=(page+Number(button.dataset.turn)+total)%total;
      update();
    }));
    // Horizontal touch, mouse and trackpad gestures turn the same four-card pages.
    let pointer=null,suppressClick=false,wheelDelta=0;
    track.style.touchAction='pan-y';
    track.addEventListener('pointerdown',event=>{
      if(event.button!==0)return;
      pointer={id:event.pointerId,x:event.clientX,y:event.clientY,moved:false};
    });
    track.addEventListener('pointermove',event=>{
      if(!pointer||event.pointerId!==pointer.id)return;
      if(Math.abs(event.clientX-pointer.x)>12&&Math.abs(event.clientX-pointer.x)>Math.abs(event.clientY-pointer.y))pointer.moved=true;
    });
    track.addEventListener('pointerup',event=>{
      if(!pointer||event.pointerId!==pointer.id)return;
      const dx=event.clientX-pointer.x,dy=event.clientY-pointer.y;
      if(pointer.moved&&Math.abs(dx)>55&&Math.abs(dx)>Math.abs(dy)*1.2){
        page=(page+(dx<0?1:-1)+total)%total;
        update();
        suppressClick=true;
      }
      pointer=null;
    });
    track.addEventListener('pointercancel',()=>{pointer=null});
    track.addEventListener('click',event=>{
      if(!suppressClick)return;
      suppressClick=false;event.preventDefault();event.stopImmediatePropagation();
    },true);
    track.addEventListener('wheel',event=>{
      if(Math.abs(event.deltaX)<=Math.abs(event.deltaY)*1.4||Math.abs(event.deltaX)<3)return;
      event.preventDefault();
      wheelDelta+=event.deltaX;
      if(Math.abs(wheelDelta)>65){page=(page+(wheelDelta>0?1:-1)+total)%total;update();wheelDelta=0}
    },{passive:false});
    update();
  }

  function setupMasterProfiles(){
    const desktop=window.__BR_DESKTOP_DEVICE__===true;
    const overlay=document.querySelector(desktop?'#stdMasterOverlay':'.tn22-master-page');
    if(!overlay)return;
    let selectedId='';
    let renderedMasterId='',renderedLang='';
    let stopServiceToggle=()=>{},stopReviewMotion=()=>{};
    let historyEntryOpen=false;
    let restoringHistoryProfile=false;
    const historyKey='tanemMasterProfile';
    const profileCloseSelector=desktop?'#stdMasterPageClose':'.tn22-back';
    const nestedCloseSelectors=desktop?[
      '#stdBookOverlay.open #stdBookClose',
      '#stdGallery.open #stdGalleryClose',
      '#stdGalleryBrowser.open #stdGalleryBrowserBack'
    ]:[
      '#tn13BookSheet.open #tn13BookClose',
      '.tn22-viewer.open .tn22-view-close',
      '#tn13Gallery.open .tn22-gallery-back'
    ];
    const copy={
      ru:{about:'О мастере',services:'Услуги',portfolio:'Портфолио',reviews:'Отзывы',emptyServices:'Услуги уточняются в салоне.',emptyPortfolio:'Фотографии по этому направлению пока не добавлены.',portfolioNote:'Примеры работ студии по направлению мастера',emptyReviews:'Отзывы пока не добавлены.'},
      en:{about:'About',services:'Services',portfolio:'Portfolio',reviews:'Reviews',emptyServices:'Check services with the salon.',emptyPortfolio:'Studio gallery photos for this specialty are not available yet.',portfolioNote:'Studio work examples in this specialty',emptyReviews:'Reviews have not been added yet.'}
    };
    function biography(master,lang){return text(master.about,lang)}
    function serviceMarkup(service,lang,masterId){
      return window.TANEM_SERVICES.render({...service,profileId:masterId},desktop?'desktop':'mobile',lang);
    }
    function masterGallery(master){
      const groups=(master.categories||[]).map(category=>category==='Маникюр'||category==='Педикюр'?'Ногти':category);
      const gallery=groups.flatMap(category=>(data.media?.gallery?.[category]||[]).map(item=>({...item,category})));
      if(master.work?.length){
        const all=Object.values(data.media?.gallery||{}).flat();
        return master.work.map(item=>typeof item==='string'?(all.find(photo=>photo.src===item)||{src:item,alt:master.name}):item);
      }
      return gallery;
    }
    function profileReviews(master,lang){
      if(data.masterReviews?.enabled!==true)return [];
      const byId=new Map((data.reviews||[]).map(review=>[review.id,review]));
      return (master.reviewIds||[]).map(id=>byId.get(id)).filter(review=>review&&text(review.text,lang)).slice(0,9);
    }
    function reviewMarkup(review,lang,duplicate=false){
      const name=text(review.author,lang);
      const rating=Number(review.rating);
      const stars=Number.isInteger(rating)&&rating>=1&&rating<=5?'★'.repeat(rating):'';
      const url=review.url||data.contacts.reviewsUrl||'';
      const source=text(review.source,lang)+(review.preview?' · '+(lang==='en'?'TEST':'ТЕСТ'):'');
      const tag=url?'a':'article';
      const linkAttrs=url?' href="'+esc(url)+'" target="_blank" rel="noopener noreferrer"':'';
      return '<'+tag+' class="tanem-master-review '+(desktop?'std-review-card':'tn30-review-card')+'"'+linkAttrs+(duplicate?' data-review-duplicate aria-hidden="true" tabindex="-1"':'')+'>'+
        '<div class="'+(desktop?'std-review-head':'tn30-review-head')+'"><span class="'+(desktop?'std-review-avatar':'tn30-review-avatar')+'">'+esc([...String(name)][0]||'S')+'</span><span><strong class="'+(desktop?'std-review-name':'tn30-review-name')+'">'+esc(name)+'</strong><span class="'+(desktop?'std-review-meta':'tn30-review-meta')+'">'+esc(source)+(desktop?'':' '+stars)+'</span>'+(desktop&&stars?'<span class="std-review-stars">'+stars+'</span>':'')+'</span></div>'+
        '<p class="'+(desktop?'std-review-text':'')+'">'+esc(text(review.text,lang))+'</p>'+
        '<span class="'+(desktop?'std-review-more':'tn30-review-open')+'">'+esc(lang==='en'?'Read more':'Подробнее')+' →</span></'+tag+'>';
    }
    function render(master){
      const lang=currentLang()==='en'?'en':'ru',words=copy[lang];
      const target=overlay.querySelector(desktop?'#stdMasterPageContent':'.tn22-master-body');
      if(!target)return;
      stopServiceToggle();stopReviewMotion();
      const sameMaster=renderedMasterId===master.id;
      const servicesExpanded=sameMaster&&target.querySelector('[data-master-expand]')?.getAttribute('aria-expanded')==='true';
      const openOptions=new Set(sameMaster?[...target.querySelectorAll('.tanem-service-options')].filter(node=>node.dataset.expanded===undefined?node.open:node.dataset.expanded==='true').map(node=>node.closest('[data-tanem-service-id]').dataset.tanemServiceId):[]);
      renderedMasterId=master.id;renderedLang=lang;
      const items=(data.services||[]).filter(item=>master.serviceIds?.length?master.serviceIds.includes(item.id):(master.categories||[]).includes(item.category));
      const works=masterGallery(master);
      const defaultWorkCategory=(master.categories||[]).map(category=>category==='Маникюр'||category==='Педикюр'?'Ногти':category)[0]||'Салон';
      const visibleWorks=desktop&&works.length>=3?works.slice(0,Math.min(9,Math.floor(works.length/3)*3)):works;
      const personalReviews=profileReviews(master,lang);
      const reviewCards=personalReviews.map(review=>reviewMarkup(review,lang)).join('');
      const reviewDuplicates=personalReviews.length>1?personalReviews.map(review=>reviewMarkup(review,lang,true)).join(''):'';
      const reviewSection='<section class="tanem-master-section" id="tanem-master-reviews"><h3>'+esc(words.reviews)+'</h3>'+
        (personalReviews.length?'<div class="tanem-master-review-window"><div class="tanem-master-review-track">'+reviewCards+reviewDuplicates+'</div></div>':'<p class="tanem-master-empty">'+esc(words.emptyReviews)+'</p>')+
        '</section>';
      // Personal reviews appear only when the owner enables them and verifies the explicit review IDs.
      const tabs=['about','services','portfolio','reviews'];
      const name=text(master.name,lang),role=text(master.role,lang),avatar=typeof master.photo==='string'?master.photo:master.photo?.src;
      const moreLabel=lang==='en'?'Show all services':'Показать все услуги';
      const lessLabel=lang==='en'?'Collapse services':'Свернуть услуги';
      const sections=[
        '<section class="tanem-master-section" id="tanem-master-about"><h3>'+esc(words.about)+'</h3><p class="tanem-master-bio">'+esc(biography(master,lang))+'</p></section>',
        '<section class="tanem-master-section" id="tanem-master-services"><h3>'+esc(words.services)+'</h3>'+
          (items.length?'<div class="tanem-master-price-list">'+items.slice(0,6).map(item=>serviceMarkup(item,lang,master.id)).join('')+
            (items.length>6?'<div class="tanem-master-extra"'+(servicesExpanded?'':' hidden')+'>'+(servicesExpanded?items.slice(6).map(item=>serviceMarkup(item,lang,master.id)).join(''):'')+'</div>':'')+'</div>':
            '<p class="tanem-master-empty">'+esc(words.emptyServices)+'</p>')+
          (items.length>6?'<button class="tanem-master-more" type="button" aria-expanded="'+String(!!servicesExpanded)+'" data-master-expand>'+esc(servicesExpanded?lessLabel:moreLabel)+' <span>'+(servicesExpanded?'↑':'↓')+'</span></button>':'')+'</section>',
        '<section class="tanem-master-section" id="tanem-master-portfolio"><h3>'+esc(words.portfolio)+'</h3>'+
          (works.length?'<p class="tanem-master-gallery-note">'+esc(words.portfolioNote)+'</p><div class="tanem-master-gallery'+(visibleWorks.length<=2?' is-paired':'')+'">'+visibleWorks.map((item,i)=>'<button type="button" data-master-work="'+i+'" aria-label="'+esc(lang==='en'?'View photo':'Посмотреть фотографию')+'"><img src="'+esc(item.src)+'" alt="'+esc(text(item.alt,lang))+'" loading="lazy"></button>').join('')+'</div><button class="tanem-master-more" type="button" data-master-gallery>'+esc(lang==='en'?'Open gallery':'Открыть галерею')+' <span aria-hidden="true">→</span></button>':
            '<p class="tanem-master-empty">'+esc(words.emptyPortfolio)+'</p>')+'</section>',
        reviewSection
      ];
      target.innerHTML='<div class="tanem-master-head"><div class="tanem-master-photo">'+(avatar?'<img src="'+esc(avatar)+'" alt="'+esc(name)+'">':'')+'</div><h2>'+esc(name)+'</h2><p>'+esc(role)+'</p></div><div class="tanem-master-sections">'+sections.join('')+'</div>';
      const existing=overlay.querySelector('.tanem-master-jump');
      if(existing)existing.remove();
      const nav=document.createElement('nav');nav.className='tanem-master-jump '+(desktop?'std-master-tabs':'tn22-master-tabs');nav.setAttribute('aria-label',lang==='en'?'Specialist sections':'Разделы профиля');
      nav.innerHTML=tabs.map((key,i)=>'<button type="button" data-jump="'+key+'" class="'+(i===0?'active':'')+'">'+esc(words[key])+'</button>').join('');
      target.querySelector('.tanem-master-head').after(nav);
      const updateNav=()=>{
        const sections=[...target.querySelectorAll('.tanem-master-section')];
        const stickyBottom=nav.getBoundingClientRect().bottom;
        const atBottom=overlay.scrollTop>0&&overlay.scrollTop+overlay.clientHeight>=overlay.scrollHeight-3;
        const active=atBottom?sections[sections.length-1]:[...sections].reverse().find(section=>section.getBoundingClientRect().top<=stickyBottom+52)||sections[0];
        nav.querySelectorAll('[data-jump]').forEach((button,i)=>button.classList.toggle('active',active===sections[i]));
      };
      overlay.__tanemMasterUpdate=updateNav;
      nav.querySelectorAll('[data-jump]').forEach(button=>button.addEventListener('click',()=>{
        const section=target.querySelector('#tanem-master-'+button.dataset.jump);
        if(!section)return;
        const position=overlay.scrollTop+section.getBoundingClientRect().top-overlay.getBoundingClientRect().top-nav.offsetHeight-32;
        overlay.scrollTo({top:position,behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
      }));
      const moreButton=target.querySelector('[data-master-expand]');
      if(moreButton)stopServiceToggle=bindServiceToggle(moreButton,target.querySelector('.tanem-master-extra'),()=>{
        const extra=target.querySelector('.tanem-master-extra');
        extra.innerHTML=items.slice(6).map(item=>serviceMarkup(item,lang,master.id)).join('');
        window.TANEM_SERVICES.enhance(extra);
      },moreLabel,lessLabel,updateNav);
      const openWorks=(index,showGallery,origin)=>{
        document.dispatchEvent(new CustomEvent('tanem:open-master-gallery',{detail:{
          items:works.map(item=>({src:item.src,alt:text(item.alt,lang)})),index,
          category:works[index]?.category||works[0]?.category||defaultWorkCategory,showGallery,origin
        }}));
      };
      target.querySelectorAll('[data-master-work]').forEach(button=>button.addEventListener('click',()=>openWorks(Number(button.dataset.masterWork)||0,false,button)));
      target.querySelector('[data-master-gallery]')?.addEventListener('click',event=>openWorks(0,true,event.currentTarget));
      const book=overlay.querySelector(desktop?'#stdMasterPageBook':'.tn22-master-book');
      if(book){
        book.textContent=lang==='en'?'Book with this specialist':'Записаться к мастеру';
      }
      window.TANEM_SERVICES.enhance(target);
      const reviewTrack=target.querySelector('.tanem-master-review-track');
      if(reviewTrack)stopReviewMotion=startMasterReviews(reviewTrack,overlay);
      target.querySelectorAll('[data-tanem-service-id]').forEach(card=>{
        const options=card.querySelector('.tanem-service-options');
        if(options){
          const isOpen=openOptions.has(card.dataset.tanemServiceId);
          options.open=isOpen;
          options.dataset.expanded=String(isOpen);
          const summary=options.querySelector('summary');
          summary?.setAttribute('aria-expanded',String(isOpen));
          const label=options.querySelector('.tanem-options-label');
          if(label)label.textContent=label.textContent.slice(0,-2)+(isOpen?' −':' +');
        }
      });
      updateNav();
    }
    // Use the catalogue's height animation and follow the collapse button in
    // the profile's own scroll container, with cleanup for rapid reversals.
    function bindServiceToggle(button,extra,populate,moreLabel,lessLabel,updateNav){
      let frame=0,timer=0,run=0,savedAnchor=null;
      const unlock=()=>{if(savedAnchor!==null){overlay.style.overflowAnchor=savedAnchor;savedAnchor=null}};
      const stabilize=anchorTop=>{
        const delta=button.getBoundingClientRect().top-anchorTop;
        if(Number.isFinite(delta)&&Math.abs(delta)>.5)overlay.scrollTo({top:Math.max(0,overlay.scrollTop+delta),behavior:'instant'});
      };
      button.onclick=()=>{
        const expanded=button.getAttribute('aria-expanded')!=='true';
        const anchorTop=button.getBoundingClientRect().top;
        const startHeight=extra.hidden?0:extra.getBoundingClientRect().height;
        const token=++run;
        clearTimeout(timer);cancelAnimationFrame(frame);extra.ontransitionend=null;
        if(savedAnchor===null){savedAnchor=overlay.style.overflowAnchor;overlay.style.overflowAnchor='none'}
        if(expanded&&!extra.childElementCount)populate();
        button.setAttribute('aria-expanded',String(expanded));
        button.innerHTML=esc(expanded?lessLabel:moreLabel)+' <span>'+(expanded?'↑':'↓')+'</span>';
        extra.hidden=false;
        extra.style.transition='none';extra.style.height=startHeight+'px';
        const endHeight=expanded?extra.scrollHeight:0;
        const duration=window.matchMedia('(prefers-reduced-motion: reduce)').matches?0:400;
        const finish=()=>{
          if(token!==run)return;
          cancelAnimationFrame(frame);clearTimeout(timer);extra.ontransitionend=null;
          extra.style.transition='none';extra.hidden=!expanded;extra.style.height=expanded?'auto':'';
          if(!expanded)stabilize(anchorTop);
          unlock();updateNav();
        };
        if(!duration||Math.abs(startHeight-endHeight)<1){finish();return}
        extra.offsetHeight;
        extra.style.transition='height '+duration+'ms cubic-bezier(.22,1,.36,1)';
        const follow=()=>{
          if(token!==run)return;
          stabilize(anchorTop);updateNav();frame=requestAnimationFrame(follow);
        };
        frame=requestAnimationFrame(()=>{
          if(token!==run)return;
          extra.style.height=endHeight+'px';
          if(!expanded)follow();
        });
        extra.ontransitionend=event=>{if(event.target===extra&&event.propertyName==='height')finish()};
        timer=setTimeout(finish,duration+100);
        updateNav();
      };
      return ()=>{++run;clearTimeout(timer);cancelAnimationFrame(frame);extra.ontransitionend=null;unlock()};
    }
    function startMasterReviews(track,container){
      const viewport=track.parentElement;
      // Touch reviews use a normal swipe rail, so a readable card stays still.
      if(!desktop){viewport.classList.add('is-static');return ()=>{}}
      const originals=[...track.querySelectorAll('.tanem-master-review:not([data-review-duplicate])')];
      const gap=parseFloat(getComputedStyle(track).gap)||16;
      const contentWidth=originals.reduce((sum,card)=>sum+card.getBoundingClientRect().width,0)+Math.max(0,originals.length-1)*gap;
      const staticReviews=contentWidth<=viewport.clientWidth||window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      viewport.classList.toggle('is-static',staticReviews);
      if(staticReviews)return ()=>{};
      const width=contentWidth+gap;
      let offset=0,last=0,dragX=0,dragging=false,moved=false,frame=0,stopped=false;
      const move=timestamp=>{
        if(stopped||!track.isConnected||!container.classList.contains('open'))return;
        const paused=track.matches(':hover,:focus-within');
        if(!paused&&!dragging&&last&&width)offset-=Math.min((timestamp-last)*.024,1.8);
        if(width){offset=((offset%width)-width)%width;track.style.transform='translate3d('+offset+'px,0,0)'}
        last=timestamp;frame=requestAnimationFrame(move);
      };
      track.addEventListener('dragstart',event=>event.preventDefault());
      track.addEventListener('pointerdown',event=>{
        if(event.button!==0)return;
        dragging=true;moved=false;dragX=event.clientX;
      });
      track.addEventListener('pointermove',event=>{
        if(!dragging)return;
        const delta=event.clientX-dragX;
        if(!moved&&Math.abs(delta)<4)return;
        moved=true;track.setPointerCapture(event.pointerId);
        offset+=delta;dragX=event.clientX;event.preventDefault();
      });
      ['pointerup','pointercancel','lostpointercapture'].forEach(type=>track.addEventListener(type,()=>{dragging=false}));
      track.addEventListener('click',event=>{if(moved){event.preventDefault();event.stopPropagation();moved=false}},true);
      frame=requestAnimationFrame(move);
      return ()=>{stopped=true;cancelAnimationFrame(frame)};
    }
    // Profile service rows AND its persistent booking CTA use one familiar chooser.
    overlay.addEventListener('click',event=>{
      if(!event.target.closest('[data-master-book],.tanem-service-book,#stdMasterPageBook,.tn22-master-book'))return;
      event.preventDefault();event.stopImmediatePropagation();
      if(desktop)document.getElementById('stdHeaderBookBtn')?.click();
      else document.querySelector('#tn13Top .tn22-cta')?.click();
    },true);
    document.addEventListener('click',event=>{
      const trigger=event.target.closest('[data-desktop-master],[data-mid],[data-sheet-mid]');
      if(trigger)selectedId=trigger.dataset.desktopMaster||trigger.dataset.mid||trigger.dataset.sheetMid||'';
    },true);
    new MutationObserver(()=>{
      if(!overlay.classList.contains('open')){
        stopServiceToggle();stopReviewMotion();
        // Reopening from browser Forward may remove .closing before the next
        // animation frame adds .open. That intermediate state is not a close.
        if(restoringHistoryProfile)return;
        if(historyEntryOpen&&history.state?.[historyKey]){
          const state={...history.state};
          delete state[historyKey];
          history.replaceState(state,'');
        }
        historyEntryOpen=false;
        return;
      }
      restoringHistoryProfile=false;
      const fallbackName=overlay.querySelector(desktop?'.std-master-profile h2':'.tn22-profile h1')?.textContent;
      const master=(data.team||[]).find(item=>item.id===selectedId)||
        (data.team||[]).find(item=>text(item.name,'ru')===fallbackName);
      if(master){
        render(master);
        if(!historyEntryOpen){
          history.pushState({...history.state,[historyKey]:master.id},'');
          historyEntryOpen=true;
        }
      }
    }).observe(overlay,{attributes:true,attributeFilter:['class']});
    window.addEventListener('popstate',()=>{
      const masterId=history.state?.[historyKey];
      historyEntryOpen=!!masterId;
      if(masterId){
        const master=(data.team||[]).find(item=>item.id===masterId);
        if(!master)return;
        selectedId=masterId;
        if(overlay.classList.contains('open'))render(master);
        else{
          const trigger=[...document.querySelectorAll('[data-desktop-master],[data-mid]')]
            .find(button=>(button.dataset.desktopMaster||button.dataset.mid)===masterId);
          if(trigger){
            restoringHistoryProfile=true;
            trigger.click();
          }
        }
        return;
      }
      restoringHistoryProfile=false;
      if(!overlay.classList.contains('open'))return;
      nestedCloseSelectors.forEach(selector=>document.querySelector(selector)?.click());
      overlay.querySelector(profileCloseSelector)?.click();
    });
    // Handle Escape before the individual dialogs so only the top layer closes.
    document.addEventListener('keydown',event=>{
      if(event.key!=='Escape'||!overlay.classList.contains('open'))return;
      const close=nestedCloseSelectors.map(selector=>document.querySelector(selector)).find(Boolean)
        ||overlay.querySelector(profileCloseSelector);
      if(!close)return;
      event.preventDefault();event.stopImmediatePropagation();
      close.click();
    },true);
    overlay.addEventListener('scroll',()=>overlay.__tanemMasterUpdate?.(),{passive:true});
    window.addEventListener('salon-template:languagechange',()=>{
      if(!overlay.classList.contains('open'))return;
      if(renderedLang===(currentLang()==='en'?'en':'ru'))return;
      const master=(data.team||[]).find(item=>item.id===selectedId);
      if(master)requestAnimationFrame(()=>render(master));
    });
  }

  window.addEventListener('salon-template:languagechange',apply);
  apply();
  setupDesktopTeamPaging();
  setupMasterProfiles();
  [80,260,700].forEach(delay=>window.setTimeout(apply,delay));
  window.setInterval(()=>applySchedule(currentLang()),60000);
})();
