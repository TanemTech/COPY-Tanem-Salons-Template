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
    setText('.std-header-brand-main,.std-logo,.dct-about-brand',text(salon.name,lang),root);
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

  window.addEventListener('salon-template:languagechange',apply);
  apply();
  [80,260,700].forEach(delay=>window.setTimeout(apply,delay));
  window.setInterval(()=>applySchedule(currentLang()),60000);
})();
