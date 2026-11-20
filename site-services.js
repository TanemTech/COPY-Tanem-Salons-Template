(function(global){
  'use strict';
  const data=global.TANEM_SITE_DATA;
  const labels={
    ru:{book:'Записаться',options:'Варианты и цены',more:'Подробнее',less:'Свернуть',min:'мин',hour:'ч'},
    en:{book:'Book',options:'Options and prices',more:'Read more',less:'Collapse',min:'min',hour:'h'},
    hy:{book:'Ամրագրել',options:'Տարբերակներ և գներ',more:'Մանրամասն',less:'Փակել',min:'ր.',hour:'ժ.'},
    uz:{book:'Yozilish',options:'Variantlar va narxlar',more:'Batafsil',less:'Yig‘ish',min:'daq',hour:'soat'},
    tg:{book:'Сабт шудан',options:'Вариантҳо ва нархҳо',more:'Муфассал',less:'Пӯшидан',min:'дақ',hour:'соат'}
  };
  const words=lang=>labels[lang]||labels.ru;
  const localize=(value,lang)=>typeof value==='string'?value:(value?.[lang]??value?.ru??value?.en??'');
  const byId=new Map((data?.services||[]).map(service=>[service.id,service]));
  const language=()=>global.TANEM_REGION?.resolve(document.body?.dataset.brLang||document.documentElement.lang||data.defaultLocale)||'ru';
  const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const normalizePrice=value=>String(value||'').trim().replace(/[\u00a0\u202f]/g,' ')
    .replace(/^(?:от|from)\s+([\d ]+)\s+(?:до|to)\s+([\d ]+)\s*([₽֏€$£])$/iu,'$1–$2 $3')
    .replace(/([\d ])\s*[–—-]\s*(?=\d)/u,'$1–').replace(/ +/g,' ');
  const description=(service,lang)=>localize(service.description,lang).trim();
  function duration(value,lang){
    const raw=localize(value,lang),m=raw.match(/^(\d+(?:[.,]\d+)?)\s*(мин(?:ут(?:а|ы)?)?|min(?:utes?)?|ч(?:ас(?:а|ов)?)?|h(?:ours?)?)\.?$/iu);
    if(!m)return raw;
    const n=Number(m[1].replace(',','.')),minutes=/^(мин|min)/iu.test(m[2])?n:n*60;
    const {min,hour}=words(lang);
    if(minutes<60)return minutes+' '+min;
    const hours=minutes/60;
    if(Number.isInteger(hours*2))return new Intl.NumberFormat(lang,{maximumFractionDigits:1}).format(hours)+' '+hour;
    return Math.floor(hours)+' '+hour+' '+Math.round(minutes%60)+' '+min;
  }
  function priceMarkup(value,device){
    const price=normalizePrice(value),range=price.match(/^([\d ]+)[–-]([\d ]+)\s*([₽֏€$£])$/u);
    if(range&&device==='mobile')return '<span class="tanem-service-price is-range" aria-label="'+escape(price)+'"><span class="tanem-price-low">'+escape(range[1].trim())+'</span><span class="tanem-price-dash" aria-hidden="true">—</span><span class="tanem-price-high">'+escape(range[2].trim())+'</span><span class="tanem-price-currency">'+range[3]+'</span></span>';
    const single=price.match(/^(?:(от|from)\s+)?([\d ]+)\s*([₽֏€$£])$/u);
    if(single&&device==='mobile')return '<span class="tanem-service-price"><span class="tanem-price-amount">'+(single[1]?'<small>'+escape(single[1])+' </small>':'')+escape(single[2].trim())+'</span><span class="tanem-price-currency">'+single[3]+'</span></span>';
    return '<span class="tanem-service-price">'+escape(price)+'</span>';
  }
  function lengthPrice(variants,lang){
    if(variants.length<2)return '';
    const prices=variants.map(variant=>normalizePrice(localize(variant.price,lang)).match(/^([\d ]+)\s*([₽֏€$£])$/u));
    const currency=prices[0]?.[2];
    if(!currency||!prices.every(price=>price?.[2]===currency))return '';
    const amounts=prices.map(price=>Number(price[1].replace(/ /g,'')));
    const format=amount=>String(amount).replace(/\B(?=(\d{3})+(?!\d))/g,' ');
    const low=Math.min(...amounts),high=Math.max(...amounts);
    return format(low)+(high===low?'':'–'+format(high))+' '+currency;
  }
  function render(service,device,lang=language()){
    const title=localize(service.title,lang).replace(/\u00ad/g,''),variants=(service.variants||[]).filter(v=>localize(v.label,lang)||localize(v.price,lang)||localize(v.duration,lang));
    const range=service.variantType==='length'?lengthPrice(variants,lang):'';
    const copy=description(service,lang),price=range||localize(service.price,lang),time=duration(service.duration,lang);
    const id='service-description-'+device+'-'+(service.profileId||'catalogue')+'-'+service.id;
    const copyLabels=words(lang),book=copyLabels.book;
    const tariffRows=variants.map(variant=>{
      const label=localize(variant.label,lang);
      const time=duration(variant.duration,lang);
      const price=normalizePrice(localize(variant.price,lang));
      return '<div><dt>'+escape(label)+'</dt><dd>'+(time?'<span class="tanem-variant-duration">'+escape(time)+'</span>':'')+
        (price?'<span>'+escape(price)+'</span>':'')+'</dd></div>';
    }).join('');
    const tariffs=tariffRows?'<dl class="tanem-service-tariffs">'+tariffRows+'</dl>':'';
    const optionsLabel=copyLabels.options;
    const options=variants.length?'<details class="tanem-service-options"><summary><span class="tanem-options-label">'+escape(optionsLabel)+' +</span></summary><div class="tanem-options-panel">'+tariffs+'</div></details>':'';
    const prose=copy?'<div class="tanem-service-description"><p id="'+escape(id)+'">'+escape(copy)+'</p><button class="tanem-service-more" type="button" aria-expanded="false" aria-controls="'+escape(id)+'">'+copyLabels.more+'</button></div>':'';
    return '<article class="'+(device==='desktop'?'dct-service-card':'tn31-service-row')+' tanem-service-card" data-tanem-service-id="'+escape(service.id)+'" data-tanem-profile="'+escape(service.profileId||'catalogue')+'" data-tanem-layout="'+device+'" data-tanem-lang="'+lang+'">'+
      '<div class="tanem-service-copy"><strong class="tanem-service-title '+(device==='desktop'?'dct-service-card-title':'tn31-service-name')+'">'+escape(title).replace(/([+/])/g,'$1<wbr>')+'</strong>'+
      options+prose+'</div>'+
      '<div class="tanem-service-side">'+(time?'<small class="tanem-service-duration">'+escape(time)+'</small>':'')+(price?priceMarkup(price,device):'<span class="tanem-service-price">'+book+'</span>')+'</div>'+
      '<button class="tanem-service-book" type="button" '+(device==='desktop'?'data-service-book':'data-book-service')+' aria-label="'+book+': '+escape(title)+'"></button></article>';
  }
  function measure(card){
    const box=card.querySelector('.tanem-service-description');if(!box)return;
    const paragraph=box.querySelector('p'),button=box.querySelector('button');
    box.classList.add('is-measuring');
    const needsMore=paragraph.getBoundingClientRect().height>(parseFloat(getComputedStyle(paragraph).lineHeight)||18)*2+1.5;
    box.classList.remove('is-measuring');
    button.hidden=!needsMore;
    if(!needsMore){box.classList.remove('is-expanded');button.setAttribute('aria-expanded','false')}
  }
  function enhance(scope){
    scope.querySelectorAll('.tanem-service-card').forEach(card=>{
      const options=card.querySelector('.tanem-service-options');
      if(options&&!options.dataset.bound){
        options.dataset.bound='true';
        const summary=options.querySelector('summary'),panel=options.querySelector('.tanem-options-panel');
        const label=summary.querySelector('.tanem-options-label');
        const baseLabel=label.textContent.slice(0,-2);
        const initialExpanded=options.dataset.expanded===undefined?options.open:options.dataset.expanded==='true';
        let animation=null,animationTimer=0,animationRun=0;
        const syncGlint=()=>{label.style.animationDelay='-'+Math.round(performance.now()%5000)+'ms'};
        const updateLabel=expanded=>{
          label.textContent=baseLabel+(expanded?' −':' +');
          summary.setAttribute('aria-expanded',String(expanded));
          options.dataset.expanded=String(expanded);
        };
        updateLabel(initialExpanded);
        syncGlint();
        summary.addEventListener('click',event=>{
          event.preventDefault();event.stopPropagation();
          const wasVisible=options.open;
          const from=panel.getBoundingClientRect().height;
          const computedOpacity=wasVisible?Number.parseFloat(getComputedStyle(panel).opacity):0;
          animation?.cancel();animation=null;
          global.clearTimeout(animationTimer);
          const run=++animationRun;
          const expanded=options.dataset.expanded!=='true';
          options.open=true;
          updateLabel(expanded);

          // A closed <details> hides its panel. Open it, measure its natural
          // height, then establish a real zero-height start before animating.
          const naturalHeight=expanded?panel.getBoundingClientRect().height:0;
          if(!wasVisible&&expanded){
            panel.style.height='0px';
            panel.style.opacity='0';
          }
          panel.style.overflow='hidden';
          if(!wasVisible&&expanded)panel.getBoundingClientRect();

          const reduce=global.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
          const to=expanded?naturalHeight:0;
          const fromHeight=wasVisible?from:0;
          const fromOpacity=wasVisible&&Number.isFinite(computedOpacity)?computedOpacity:0;
          const duration=260;
          const clearPanelStyles=()=>{
            panel.style.removeProperty('height');
            panel.style.removeProperty('opacity');
            panel.style.removeProperty('overflow');
          };
          if(reduce||typeof panel.animate!=='function'||Math.abs(to-fromHeight)<1){
            clearPanelStyles();
            options.open=expanded;
            if(!expanded)syncGlint();
            return;
          }
          const current=panel.animate(
            [{height:fromHeight+'px',opacity:fromOpacity},{height:to+'px',opacity:expanded?1:0}],
            {duration,easing:'cubic-bezier(.22,1,.36,1)'}
          );
          animation=current;
          const finish=()=>{
            if(run!==animationRun)return;
            global.clearTimeout(animationTimer);
            animation=null;
            clearPanelStyles();
            options.open=expanded;
            if(!expanded)syncGlint();
          };
          current.onfinish=finish;
          animationTimer=global.setTimeout(()=>{
            if(run!==animationRun)return;
            current.cancel();
            finish();
          },duration+180);
        });
      }
      const button=card.querySelector('.tanem-service-more');
      if(button&&!button.dataset.bound){
        button.dataset.bound='true';
        button.onclick=event=>{
          event.preventDefault();event.stopPropagation();
          const expanded=button.getAttribute('aria-expanded')!=='true';
          button.setAttribute('aria-expanded',String(expanded));
          button.closest('.tanem-service-description').classList.toggle('is-expanded',expanded);
          button.textContent=(expanded?words(language()).less:words(language()).more);
          measure(card);
        };
      }
      measure(card);
    });
  }
  function refresh(){
    const lang=language();
    document.querySelectorAll('.tanem-service-card').forEach(card=>{
      if(card.dataset.tanemLang===lang)return;
      const service=byId.get(card.dataset.tanemServiceId);if(!service)return;
      const expanded=card.querySelector('.tanem-service-more')?.getAttribute('aria-expanded')==='true';
      const currentOptions=card.querySelector('.tanem-service-options');
      const optionsOpen=currentOptions?(currentOptions.dataset.expanded===undefined?currentOptions.open:currentOptions.dataset.expanded==='true'):false;
      const holder=document.createElement('div');holder.innerHTML=render({...service,profileId:card.dataset.tanemProfile},card.dataset.tanemLayout,lang);
      const next=holder.firstElementChild;
      // Keep booking listeners on the existing button when changing the language.
      const oldBook=card.querySelector('.tanem-service-book'),newBook=next.querySelector('.tanem-service-book');
      oldBook.setAttribute('aria-label',newBook.getAttribute('aria-label'));newBook.replaceWith(oldBook);
      card.replaceChildren(...next.childNodes);card.dataset.tanemLang=lang;
      const options=card.querySelector('.tanem-service-options');
      if(options){
        options.open=!!optionsOpen;
        options.dataset.expanded=String(!!optionsOpen);
        const summary=options.querySelector('summary');
        summary.setAttribute('aria-expanded',String(!!optionsOpen));
        const label=options.querySelector('.tanem-options-label');
        if(label)label.textContent=label.textContent.slice(0,-2)+(optionsOpen?' −':' +');
      }
      if(expanded){const button=card.querySelector('.tanem-service-more');if(button){button.setAttribute('aria-expanded','true');button.textContent=words(lang).less;button.parentElement.classList.add('is-expanded')}}
    });
    enhance(document);
  }
  global.TANEM_SERVICES={render,enhance,normalizePrice,description,duration};
  if(typeof document!=='undefined'){
    let frame=0;
    const schedule=()=>{if(!frame)frame=requestAnimationFrame(()=>{frame=0;refresh()})};
    global.addEventListener('salon-template:languagechange',schedule);
    global.addEventListener('resize',schedule,{passive:true});
    document.fonts?.ready.then(schedule).catch(()=>{});
  }
})(window);
