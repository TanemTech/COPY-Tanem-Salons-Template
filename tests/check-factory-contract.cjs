#!/usr/bin/env node
'use strict';

const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const {loadSiteData,validateSiteData}=require('./validate-site-data.cjs');

const root=path.resolve(__dirname,'..');
const data=loadSiteData(path.join(root,'site-data.js'));
assert.deepEqual(validateSiteData(data,{rootDir:root}),[],'the distributed template must satisfy its schema');

const starter=loadSiteData(path.join(root,'site-data.blank.js'));
const agentRules=fs.readFileSync(path.join(root,'AGENTS.md'),'utf8');
const chatEntry=fs.readFileSync(path.join(root,'START_HERE.md'),'utf8');
const mediaRules=fs.readFileSync(path.join(root,'RULES.md'),'utf8');
const factoryGuide=fs.readFileSync(path.join(root,'docs/FACTORY_GUIDE.md'),'utf8');
const inputChecklist=fs.readFileSync(path.join(root,'docs/INPUT_CHECKLIST.md'),'utf8');
const projectPrompt=fs.readFileSync(path.join(root,'docs/PROJECT_PROMPT.md'),'utf8');
const componentContract=fs.readFileSync(path.join(root,'docs/SERVICE_AND_PROFILE_CONTRACT.md'),'utf8');
for(const token of ['START_HERE.md','RULES.md','docs/FACTORY_GUIDE.md','docs/INPUT_CHECKLIST.md','docs/SERVICE_AND_PROFILE_CONTRACT.md','site-data.blank.js']){
  assert(agentRules.includes(token),`AGENTS.md must direct a new agent to ${token}`);
}
for(const token of ['RULES.md','docs/INPUT_CHECKLIST.md','docs/FACTORY_GUIDE.md','salon.heroDescription','salon.about']){
  assert(chatEntry.includes(token),`START_HERE.md must preserve the ordinary Chat workflow token: ${token}`);
}
assert(projectPrompt.includes('START_HERE.md'),'the ordinary Chat project prompt must direct ChatGPT to START_HERE.md');
assert(chatEntry.includes('docs/SERVICE_AND_PROFILE_CONTRACT.md'),'START_HERE must point to the component behavior contract');
assert(componentContract.includes('Варианты и цены')&&componentContract.includes('1,5 ч')&&componentContract.includes('более 50'),'the component contract must define service edge cases');
assert(projectPrompt.includes('одним сообщением'),'the ordinary Chat project prompt must request missing data in one consolidated message');
assert(inputChecklist.includes('Явный список услуг из чата является окончательным источником правды'),'the input contract must keep the explicit service list authoritative');
assert(inputChecklist.includes('salon.fullAddress')&&inputChecklist.includes('mapEmbedUrl'),'the input contract must collect full address and embedded map data');
assert(factoryGuide.includes("country: 'RU'")&&factoryGuide.includes("locales: ['ru', 'en']"),'the factory guide must document the Russian RU/EN contract');
for(const token of ['hero.webp','profile.webp','gallery-01.webp','team-01.webp','logo.webp','favicon-source.png']){
  assert(mediaRules.includes(token),`RULES.md must preserve canonical media token: ${token}`);
}
assert(!Object.prototype.hasOwnProperty.call(starter.media,'heroDesktop'),'starter media must not expose obsolete heroDesktop');
assert(!Object.prototype.hasOwnProperty.call(starter.media,'desktopGalleryLimits'),'starter media must not impose per-device gallery caps');
assert.equal(starter.masterReviews.enabled,false,'master reviews must require explicit approval before display');
assert.equal(starter.media.hero.length,0,'blank starter keeps hero empty until real hero.webp is connected');
assert.equal(starter.media.about,'','blank starter keeps profile empty until real profile.webp is connected');
assert.equal(starter.mode,'template','blank starter cannot be published by accident');
assert.equal(starter.salon.fullAddress.ru,'','blank starter keeps the verified full address empty until a client is researched');
assert.deepEqual([...starter.services],[],'new customer sites must start without example services');
assert.equal(starter.salon.heroDescription.ru,'Ваша красота. Ваша уверенность.','blank starter must preserve the approved desktop slogan');
assert(starter.salon.about.ru.startsWith('В основе нашей работы — профессиональный подход'),'blank starter must preserve the approved universal About copy');
assert.deepEqual(validateSiteData(starter,{rootDir:root}),[],'blank starter must have valid schema');

if(data.mode==='template'){
assert.equal(data.country,'RU','the distributed template must open as a Russian salon by default');
assert.deepEqual([...data.locales],['ru','en'],'the distributed template must show only RU/EN by default');
assert.equal(data.services.length,4,'the template preview must contain exactly four neutral services');
assert.deepEqual([...data.categoryOrder],['Волосы','Маникюр','Брови и ресницы','Эпиляция'],'the preview must show the four approved service categories');
assert.deepEqual([...data.services.map(service=>service.title.en)],['Hair service','Manicure','Brows and Lashes','Hair Removal'],'demo service labels must use the approved English copy');
for(const service of data.services){
  assert.equal(service.price,'',`${service.id}: demo price must be empty`);
  assert.equal(service.duration,'',`${service.id}: demo duration must be empty`);
  assert.equal(service.description.ru,'',`${service.id}: demo description must be empty`);
  assert.deepEqual([...service.variants],[],`${service.id}: demo variants must be empty`);
}

}else{
  assert.equal(data.mode,'production','client data must use production mode');
  assert.deepEqual(validateSiteData(data,{rootDir:root}),[],'production client must satisfy all release requirements');
}

const unsafe=structuredClone(data);
unsafe.mode='production';
// Exercise release blockers independently of preview or real customer content.
unsafe.salon.name.ru='SALON NAME';
unsafe.media.hero=[{src:'media-placeholder.svg'}];
unsafe.contacts.phone='';
unsafe.contacts.messengerUrl='';
unsafe.contacts.booking=[];
const unsafeErrors=validateSiteData(unsafe,{rootDir:root});
assert(unsafeErrors.some(error=>error.includes('production placeholder')),'production mode must reject demo copy');
assert(unsafeErrors.some(error=>error.includes('placeholder media')),'production mode must reject placeholder media');
assert(unsafeErrors.some(error=>error.includes('booking method')),'production mode must require a booking method');

const ready=loadSiteData(path.join(root,'tests/fixtures/site-data.production.js'));
assert.deepEqual(validateSiteData(ready,{rootDir:root,allowTestDomains:true}),[],'a complete production fixture must pass');

// Stress the catalogue and gallery contract: 60+ services and more than 25 distinct photos remain valid.
const large=structuredClone(ready);
for(let i=0;i<55;i++){
  const service=structuredClone(ready.services[0]);
  service.id='extra-service-'+i;
  service.title={ru:'Дополнительная услуга '+(i+1),en:'Additional service '+(i+1),hy:'Լրացուցիչ ծառայություն '+(i+1)};
  large.services.push(service);
}
for(let i=0;i<30;i++)large.media.gallery['Волосы'].push({
  src:'https://cdn.example.test/gallery-'+i+'.webp',
  alt:{ru:'Работа '+i,en:'Work '+i,hy:'Աշխատանք '+i}
});
assert.deepEqual(validateSiteData(large,{rootDir:root,allowTestDomains:true}),[],'more than 50 services and 25 gallery photos must not hit artificial caps');

// A master explicitly links to real services and real reviews; no automatic name-based matching.
const linkedMaster=structuredClone(ready);
linkedMaster.masterReviews={enabled:true};
linkedMaster.team=[{
  id:'master-anna',name:{ru:'Анна',en:'Anna',hy:'Աննա'},role:{ru:'Колорист',en:'Colorist',hy:'Գունաբան'},
  about:{ru:'Описание мастера.',en:'Master bio.',hy:'Մասնագետի մասին։'},
  photo:{src:'tests/fixtures/photo.svg',alt:{ru:'Анна',en:'Anna',hy:'Աննա'}},
  categories:['Волосы'],serviceIds:['haircut'],work:[],reviewIds:['review-anna']
}];
assert.deepEqual(validateSiteData(linkedMaster,{rootDir:root,allowTestDomains:true}),[],'explicit master service/review links must pass');
const invalidMasterLink=structuredClone(linkedMaster);
invalidMasterLink.team[0].serviceIds=['missing-service'];
assert(validateSiteData(invalidMasterLink,{rootDir:root,allowTestDomains:true}).some(error=>error.includes('must reference an existing service')),'unknown master service links must fail');
const tooManyMasterReviews=structuredClone(linkedMaster);
tooManyMasterReviews.team[0].reviewIds=Array(10).fill('review-anna');
assert(validateSiteData(tooManyMasterReviews,{rootDir:root,allowTestDomains:true}).some(error=>error.includes('at most 9 verified reviews')),'master profiles must cap linked reviews at nine');
assert(validateSiteData(ready,{rootDir:root}).some(error=>error.includes('test domain')),'test domains must never pass a real client release');
const duplicatedAddress=structuredClone(ready);
duplicatedAddress.salon.address.ru='Ереван, ул. Абовяна, 12';
assert(validateSiteData(duplicatedAddress,{rootDir:root,allowTestDomains:true}).some(error=>error.includes('must not repeat salon.city')),
  'short UI address must reject a repeated city name');
// A Russian salon must not need Armenian; Uzbek and Tajik salons must supply their own third language.
for(const [country,locales] of Object.entries({RU:['ru','en'],AM:['ru','en','hy'],UZ:['ru','en','uz'],TJ:['ru','en','tg']})){
  const sample=structuredClone(ready);
  sample.country=country;sample.locales=locales;
  if(country==='RU'){
    sample.contacts.mapUrl='https://yandex.ru/maps/?text=Москва';
    sample.contacts.mapEmbedUrl='https://yandex.ru/map-widget/v1/?text=Москва';
  }else{
    sample.contacts.mapUrl='https://www.google.com/maps/search/?api=1&query=Yerevan';
    sample.contacts.mapEmbedUrl='https://www.google.com/maps?q=Yerevan&output=embed';
  }
  const augment=value=>{
    if(!value||typeof value!=='object')return;
    if(typeof value.ru==='string'&&typeof value.en==='string'){
      if(country==='UZ')value.uz=value.en;
      if(country==='TJ')value.tg=value.en;
      return;
    }
    if(Array.isArray(value))value.forEach(augment);
    else Object.values(value).forEach(augment);
  };
  augment(sample);
  assert.deepEqual(validateSiteData(sample,{rootDir:root,allowTestDomains:true}),[],`${country} locale schema should accept its supported languages`);
  const context={window:{TANEM_SITE_DATA:sample}};
  vm.runInNewContext(fs.readFileSync(path.join(root,'site-regions.js'),'utf8'),context);
  assert.deepEqual(Array.from(context.window.TANEM_REGION.locales),locales,`${country} switcher languages`);
  assert.equal(context.window.TANEM_REGION.teamHeading('ru'),'Наша команда');
  assert.equal(context.window.TANEM_REGION.teamHeading(locales.at(-1)),locales.at(-1)==='ru'?'Наша команда':'Our Team');
  if(country==='RU'){
    const invalid=structuredClone(sample);invalid.locales=['ru','en','hy'];
    assert(validateSiteData(invalid,{rootDir:root,allowTestDomains:true}).some(e=>e.includes('exactly ru, en')),'Russia must not expose HY');
  }
  if(country==='UZ'||country==='TJ'){
    const invalid=structuredClone(sample);invalid.salon.name[locales[2]]='';
    assert(validateSiteData(invalid,{rootDir:root,allowTestDomains:true}).some(e=>e.includes(`salon.name.${locales[2]}`)),'Missing regional salon name must fail release');
  }
}
ready.reviews[0].rating=4;
assert(validateSiteData(ready,{rootDir:root,allowTestDomains:true}).some(error=>error.includes('only five-star reviews')),'non-five-star reviews must be rejected');

const index=fs.readFileSync(path.join(root,'index.html'),'utf8');
const desktop=fs.readFileSync(path.join(root,'desktop.js'),'utf8');
const mobile=fs.readFileSync(path.join(root,'mobile.js'),'utf8');
const runtime=fs.readFileSync(path.join(root,'site-runtime.js'),'utf8');
const serviceRenderer=fs.readFileSync(path.join(root,'site-services.js'),'utf8');
assert(index.indexOf('site-data.js')<index.indexOf("desktop?'desktop.js"),'site-data.js must load before either UI bundle');
assert(index.indexOf('site-services.js')<index.indexOf("desktop?'desktop.js"),'shared service renderer must load before either UI bundle');
assert(mobile.includes('salon-palette.css?v=tanem-components-20261108-v1'),'mobile must load the current shared component palette');
assert(index.includes('site-runtime.js'),'the production hydration runtime must load');
assert(index.includes("matchMedia('(min-width:1024px)').matches"),'wide touch devices must use the desktop layout');
assert(index.includes('(hover:hover) and (pointer:fine), (min-width:1024px)'),'wide touch devices must receive desktop styles');
assert(desktop.includes('SITE.services.filter'),'desktop services must come from the unified source');
assert(desktop.includes('DESKTOP_SERVICE_TABS.length<=5'),'desktop must compact up to five real service categories');
assert(desktop.includes('DESKTOP_SERVICE_TABS=[...SERVICE_CATEGORIES]'),'desktop categories must not add a synthetic All tab');
assert(!desktop.includes("activeServiceCategory==='Все'")&&!desktop.includes('mct-tab-all'),'desktop must not retain a legacy synthetic All category path');
assert(desktop.includes('href="#salonDesktopTeam"'),'desktop navigation must include Team');
const desktopNavOrder=['#salonDesktopServices','#salonDesktopPortfolio','#salonDesktopAbout','#salonDesktopTeam','#salonDesktopReviews','#salonDesktopContacts'];
let desktopNavCursor=-1;
for(const href of desktopNavOrder){const next=desktop.indexOf('href="'+href+'"',desktopNavCursor+1);assert(next>desktopNavCursor,'desktop navigation order must match the six-item contract');desktopNavCursor=next;}
assert(desktop.includes('function clientServiceCard(item)'),'desktop production cards must use the shared renderer');
assert(mobile.includes('SITE.services.map'),'mobile services must come from the unified source');
assert(mobile.includes('function clientServiceLine(item)'),'mobile production rows must use the shared renderer');
assert(mobile.includes('Услуги</a><a href="#tn13Portfolio">Наши работы</a><a href="#tn38About">О нас</a><a href="#tn13Team">Команда</a><a href="#tn13Reviews">Отзывы</a><a href="#tn13Visit">Контакты</a>'),'mobile hamburger navigation must match the six-item desktop order');
assert(mobile.includes("SERVICE_CATS.length===2"),'mobile must stretch exactly two service categories');
assert(!mobile.includes('SERVICE_CATS.length>0&&SERVICE_CATS.length<=4'),'mobile must not use the old 1-4 compact-grid rule');
const mobileCategoryCSS=fs.readFileSync(path.join(root,'mobile-overrides.css'),'utf8');
assert(mobileCategoryCSS.includes('font-size:13.98px!important')&&mobileCategoryCSS.includes('.tn31-cats.is-two')&&mobileCategoryCSS.includes('flex:0 0 auto!important')&&mobileCategoryCSS.includes('overflow-x:auto!important'),
  'mobile service categories must use the 13.98px rule, stretch exactly two, and otherwise keep natural scrolling widths');
assert(desktop.includes('В основе нашей работы — профессиональный подход'),'desktop About must contain the approved universal copy');
assert(!desktop.includes("locales:['ru','en','hy']"),'desktop fallback must not expose Armenian for the default template');
assert(!mobile.includes("locales:['ru','en','hy']"),'mobile fallback must not expose Armenian for the default template');
assert(index.includes('favicon-source.png'),'salon template must use the TANEM system favicon');
assert(!runtime.includes("node.hidden=!hasReviews"),'reviews must remain a permanent structural section');
assert(!runtime.includes("node.hidden=!hasTeam"),'team must remain a permanent structural section');
assert(runtime.includes('function setupMasterProfiles()')&&runtime.includes('function setupDesktopTeamPaging()'),'master profile and desktop team paging logic must be present');
assert(runtime.includes('cards.length<=4')&&runtime.includes('Math.ceil(cards.length/4)'),'desktop team must page four masters at a time');
assert(runtime.includes('items.slice(0,6)'),'master profile must preview six services before expanding');
assert(runtime.includes('Math.floor(works.length/3)*3')&&runtime.includes('Math.min(9'),'desktop master portfolio must preview complete rows up to nine images');
assert(![desktop,mobile,runtime,serviceRenderer].join('\\n').match(/data-eva-|eva-options-animation|Ева|EvaPavlina/i),'shared template code must not contain Eva-specific identifiers or content');
assert(runtime.includes('masterReviews?.enabled!==true')&&runtime.includes('slice(0,9)'),'master reviews must be opt-in and capped at nine');
assert(!desktop.includes('desktopGalleryLimits')&&!desktop.includes('items.slice(0,limit)'),'desktop gallery must not truncate supplied photos');
assert(serviceRenderer.includes('tanem-service-variant-duration')&&serviceRenderer.includes('duration(v.duration,lang)'),'variant-specific durations must be rendered');
assert(serviceRenderer.includes('data-tanem-service-id')&&!serviceRenderer.includes('data-eva-service-id'),'shared service code must not retain client-specific Eva attributes');
assert(!mobile.includes("team.hidden=!MASTERS.length"),'mobile team must stay visible without real team data');
assert(mobile.includes('DISPLAY_MASTERS=MASTERS.length?MASTERS:Array.from({length:4}'),'mobile empty team must render four neutral system cards');
assert(desktop.includes('DISPLAY_TEAM_MASTERS=TEAM_MASTERS.length?TEAM_MASTERS:Array.from({length:4}'),'desktop empty team must render four neutral system cards');
assert(!runtime.includes("desktopBrand.classList.add('has-logo')"),'desktop header must remain text even when a client logo exists');
assert(runtime.includes('Открыть в Яндекс Картах')&&runtime.includes('Открыть в Google Maps'),'runtime must select the map action label by country');
assert(mobile.includes('const loop=[...groups,...groups,...groups]'),'mobile reviews must use a circular triple-buffer loop');

// Execute the shared renderer in an isolated browser-like context and verify variant durations/prices.
const rendererWindow={
  TANEM_SITE_DATA:{defaultLocale:'ru'},
  TANEM_REGION:{resolve:value=>value==='en'?'en':'ru'},
  addEventListener(){},clearTimeout(){},setTimeout(){return 1}
};
const rendererDocument={body:{dataset:{brLang:'ru'}},documentElement:{lang:'ru'},querySelectorAll(){return []}};
vm.runInNewContext(serviceRenderer,{window:rendererWindow,document:rendererDocument,performance:{now:()=>1000}});
const rendered=rendererWindow.TANEM_SERVICES.render({
  id:'color-by-length',title:{ru:'Окрашивание',en:'Coloring'},price:'',duration:'',
  description:{ru:'',en:''},variantType:'length',
  variants:[
    {label:{ru:'Короткие волосы',en:'Short hair'},price:'5 000 ₽',duration:'1 ч'},
    {label:{ru:'Средние волосы',en:'Medium hair'},price:'7 000 ₽',duration:'1,5 ч'},
    {label:{ru:'Длинные волосы',en:'Long hair'},price:'9 000 ₽',duration:'2 ч'},
    {label:{ru:'Консультация',en:'Consultation'},price:'По запросу',duration:''}
  ]
},'mobile','ru');
for(const token of ['Короткие волосы','1 ч','1,5 ч','2 ч','5 000 ₽','7 000 ₽','9 000 ₽','По запросу','tanem-service-variant-duration'])
  assert(rendered.includes(token),`shared renderer must display variant detail: ${token}`);
assert(!rendered.includes('—'),'missing service price or duration must not render a dash');
assert(rendered.includes('Стоимость по длине'),'length-based variants must use the approved heading');
console.log('PASS: service renderer displays each option duration and flexible price format');

console.log('PASS: schema, release blockers, unified services, and wide-touch routing are enforced');
