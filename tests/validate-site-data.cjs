#!/usr/bin/env node
'use strict';

const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const REQUIRED_LOCALES=['ru','en','hy'];
const COUNTRY_LOCALES=Object.freeze({RU:['ru','en'],AM:['ru','en','hy'],UZ:['ru','en','uz'],TJ:['ru','en','tg']});
const PLACEHOLDER_MEDIA=new Set(['media-placeholder.svg','logo-placeholder.svg']);
const PLACEHOLDER_RULES=[
  {test:value=>/SALON NAME/i.test(value),label:'SALON NAME'},
  {test:value=>/^(?:demo|placeholder)-/i.test(value),label:'demo/placeholder id'},
  {test:value=>/^(?:Услуга|Service|Ծառայություն)\s+\d+$/iu.test(value),label:'numbered service'},
  {test:value=>/^(?:Мастер|Specialist|Մասնագետ)\s+\d+$/iu.test(value),label:'numbered specialist'},
  {test:value=>/^(?:Клиент|Client|Հաճախորդ)\s+\d+$/iu.test(value),label:'numbered client'},
  {test:value=>/(?:будет добавлен|будет добавлено|will be added|կավելացվի)/iu.test(value),label:'future placeholder copy'},
  {test:value=>/^(?:Уточняется|To be added|Կավելացվի)$/iu.test(value),label:'unspecified value'},
  {test:value=>/^(?:Город|City|Քաղաք|Адрес салона|Salon address|Սրահի հասցե|Полный адрес салона|Full salon address|Սրահի ամբողջական հասցե)$/iu.test(value),label:'generic location'},
  {test:value=>/^(?:Описание салона\.?|Salon description\.?|Սրահի նկարագրություն։?)$/iu.test(value),label:'generic salon description'},
  {test:value=>/^(?:Источник отзыва|Review source|Կարծիքի աղբյուր)$/iu.test(value),label:'generic review source'}
];

function loadSiteData(filePath){
  const absolute=path.resolve(filePath);
  const sandbox={window:{}};
  vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync(absolute,'utf8'),sandbox,{filename:absolute,timeout:2000});
  if(!sandbox.window.TANEM_SITE_DATA)throw new Error(`${absolute}: TANEM_SITE_DATA was not created`);
  return sandbox.window.TANEM_SITE_DATA;
}

function validateSiteData(data,{rootDir=process.cwd(),allowTestDomains=false}={}){
  const errors=[];
  const production=data?.mode==='production';
  const country=typeof data?.country==='string'?data.country.trim().toUpperCase():'';
  const requiredLocales=COUNTRY_LOCALES[country]||REQUIRED_LOCALES;
  const add=(field,message)=>errors.push(`${field}: ${message}`);
  const isObject=value=>value!==null&&typeof value==='object'&&!Array.isArray(value);
  const nonEmpty=value=>typeof value==='string'&&value.trim().length>0;

  function object(value,field){
    if(!isObject(value)){add(field,'must be an object');return false}
    return true;
  }
  function array(value,field){
    if(!Array.isArray(value)){add(field,'must be an array');return false}
    return true;
  }
  function string(value,field,{required=false}={}){
    if(typeof value!=='string'){add(field,'must be a string');return false}
    if(required&&!value.trim())add(field,'must not be empty');
    return true;
  }
  function local(value,field,{required=false}={}){
    if(typeof value==='string'){
      if(required&&!value.trim())add(field,'must not be empty');
      if(production&&required)add(field,`must provide ${requiredLocales.join(', ')} translations`);
      return;
    }
    if(!object(value,field))return;
    for(const locale of requiredLocales){
      if(typeof value[locale]!=='string')add(`${field}.${locale}`,'must be a string');
      else if(required&&!value[locale].trim())add(`${field}.${locale}`,'must not be empty');
    }
  }
  function url(value,field,{required=false,allowTel=false}={}){
    if(!string(value,field,{required})||!value)return;
    const allowed=allowTel?/^(?:https?:\/\/|tel:|tg:|viber:|whatsapp:)/i:/^https?:\/\//i;
    if(!allowed.test(value))add(field,`must use ${allowTel?'https:// or an approved contact protocol':'http:// or https://'}`);
    if(production&&/^https?:\/\//i.test(value)){
      try{
        const host=new URL(value).hostname.toLowerCase();
        if(!allowTestDomains&&(/^(?:.*\.)?example\.(?:com|org|net)$/.test(host)||['localhost','127.0.0.1','0.0.0.0'].includes(host)||host.endsWith('.example')))
          add(field,'test domain or localhost is forbidden in production');
      }catch{add(field,'must be a valid URL')}
    }
  }
  function media(value,field,{required=false}={}){
    if(typeof value==='object'&&value!==null)value=value.src;
    if(!string(value,field,{required})||!value)return;
    if(production&&PLACEHOLDER_MEDIA.has(path.basename(value)))add(field,'placeholder media is forbidden in production');
    if(/^(?:https?:)?\/\//i.test(value)){
      if(!/^https:\/\//i.test(value))add(field,'remote media must use https://');
      return;
    }
    if(path.isAbsolute(value)||value.split(/[\\/]/).includes('..')){add(field,'must be a safe relative path or https URL');return}
    const localPath=path.resolve(rootDir,value);
    if(!fs.existsSync(localPath))add(field,`file does not exist: ${value}`);
  }
  function scanPlaceholders(value,field){
    if(typeof value==='string'){
      const rule=PLACEHOLDER_RULES.find(candidate=>candidate.test(value.trim()));
      if(rule)add(field,`contains production placeholder (${rule.label})`);
      return;
    }
    if(Array.isArray(value))value.forEach((item,index)=>scanPlaceholders(item,`${field}[${index}]`));
    else if(isObject(value))Object.entries(value).forEach(([key,item])=>scanPlaceholders(item,field?`${field}.${key}`:key));
  }

  if(!object(data,'TANEM_SITE_DATA'))return errors;
  if(data.schemaVersion!==1)add('schemaVersion','must equal 1');
  if(!['template','production'].includes(data.mode))add('mode','must be template or production');
  if(production&&!country)add('country','must not be empty in production');
  if(country&&!COUNTRY_LOCALES[country])add('country','unsupported country; use RU, AM, UZ or TJ');
  if(array(data.locales,'locales')){
    for(const locale of requiredLocales)if(!data.locales.includes(locale))add('locales',`must include ${locale} for ${country||'legacy configuration'}`);
    if(country&&(data.locales.length!==requiredLocales.length||data.locales.some(locale=>!requiredLocales.includes(locale))))
      add('locales',`country ${country} must have exactly ${requiredLocales.join(', ')}`);
  }
  if(!requiredLocales.includes(data.defaultLocale))add('defaultLocale',`must be one of ${requiredLocales.join(', ')}`);

  if(object(data.salon,'salon')){
    ['name','kind','city','address','fullAddress','heroDescription','about'].forEach(key=>local(data.salon[key],`salon.${key}`,{required:production}));
    if(production){
      for(const locale of requiredLocales){
        const city=typeof data.salon.city==='object'?String(data.salon.city?.[locale]||'').trim():String(data.salon.city||'').trim();
        const display=typeof data.salon.address==='object'?String(data.salon.address?.[locale]||'').trim():String(data.salon.address||'').trim();
        const full=typeof data.salon.fullAddress==='object'?String(data.salon.fullAddress?.[locale]||'').trim():String(data.salon.fullAddress||'').trim();
        if(display&&full&&display===full&&full.length>35)add(`salon.address.${locale}`,'must be a shortened UI address; keep the complete value in salon.fullAddress');
        const locationToken=value=>String(value||'').toLocaleLowerCase().replace(/^(?:г\.?|город|city)\s+/iu,'').replace(/[^\p{L}\p{N}]+/gu,' ').trim();
        const cityToken=locationToken(city),addressToken=locationToken(display);
        if(cityToken.length>=3&&addressToken&&(addressToken===cityToken||addressToken.startsWith(cityToken+' ')))
          add(`salon.address.${locale}`,'must not repeat salon.city; keep only the short street/district part');
      }
    }
  }

  if(object(data.schedule,'schedule')){
    string(data.schedule.timezone,'schedule.timezone',{required:production});
    local(data.schedule.fallback,'schedule.fallback',{required:false});
    if(array(data.schedule.periods,'schedule.periods'))data.schedule.periods.forEach((period,index)=>{
      const field=`schedule.periods[${index}]`;
      if(!object(period,field))return;
      if(array(period.days,`${field}.days`)){
        if(!period.days.length)add(`${field}.days`,'must not be empty');
        period.days.forEach(day=>{if(!Number.isInteger(day)||day<1||day>7)add(`${field}.days`,'values must be integers from 1 (Monday) to 7 (Sunday)')});
      }
      for(const key of ['open','close'])if(!/^([01]\d|2[0-3]):[0-5]\d$/.test(String(period[key]||'')))add(`${field}.${key}`,'must use 24-hour HH:MM format');
    });
  }

  if(object(data.contacts,'contacts')){
    string(data.contacts.phone,'contacts.phone');
    local(data.contacts.phoneLabel,'contacts.phoneLabel',{required:production&&!!data.contacts.phone});
    local(data.contacts.messengerLabel,'contacts.messengerLabel',{required:production&&!!data.contacts.messengerUrl});
    for(const key of ['messengerUrl','mapUrl','mapEmbedUrl','reviewsUrl'])if(data.contacts[key])url(data.contacts[key],`contacts.${key}`,{allowTel:key==='messengerUrl'});
    if(production){
      url(data.contacts.mapUrl||'','contacts.mapUrl',{required:true});
      url(data.contacts.mapEmbedUrl||'','contacts.mapEmbedUrl',{required:true});
      const providerHost=value=>{try{return new URL(value).hostname.toLowerCase()}catch{return ''}};
      const providerOk=(value,wanted)=>{
        const host=providerHost(value);
        return wanted==='yandex'?/(^|\.)yandex\./.test(host):(/(^|\.)google\./.test(host)||host==='maps.app.goo.gl'||host.endsWith('.goo.gl'));
      };
      const wanted=country==='RU'?'yandex':'google';
      if(data.contacts.mapUrl&&!providerOk(data.contacts.mapUrl,wanted))add('contacts.mapUrl',`country ${country} must use ${wanted==='yandex'?'Yandex Maps':'Google Maps'}`);
      if(data.contacts.mapEmbedUrl&&!providerOk(data.contacts.mapEmbedUrl,wanted))add('contacts.mapEmbedUrl',`country ${country} must embed ${wanted==='yandex'?'Yandex Maps':'Google Maps'}`);
      if(data.contacts.messengerUrl){
        const label=typeof data.contacts.messengerLabel==='object'?String(data.contacts.messengerLabel.ru||'').trim():String(data.contacts.messengerLabel||'').trim();
        if(!label||/^(?:Написать|Мессенджер|Message|Write)$/iu.test(label))add('contacts.messengerLabel','must name the actual messenger platform, for example Telegram, WhatsApp, MAX or Viber');
      }
    }
    if(data.contacts.phone&&!/^\+?[\d ()-]{7,}$/.test(data.contacts.phone))add('contacts.phone','has an invalid phone format');
    if(array(data.contacts.booking,'contacts.booking'))data.contacts.booking.forEach((item,index)=>{
      const field=`contacts.booking[${index}]`;
      if(!object(item,field))return;
      string(item.type,`${field}.type`,{required:true});
      local(item.label,`${field}.label`,{required:production});
      url(item.url,`${field}.url`,{required:true,allowTel:true});
    });
    if(production&&!data.contacts.phone&&!data.contacts.messengerUrl&&!(data.contacts.booking||[]).some(item=>item&&item.url))add('contacts','must provide at least one real booking method');
  }

  const categories=new Set();
  if(object(data.categoryLabels,'categoryLabels'))for(const [category,label] of Object.entries(data.categoryLabels)){
    categories.add(category);
    local(label,`categoryLabels.${category}`,{required:production});
  }
  if(array(data.categoryOrder,'categoryOrder')){
    const seen=new Set();
    data.categoryOrder.forEach((category,index)=>{
      if(!nonEmpty(category))add(`categoryOrder[${index}]`,'must be a non-empty string');
      if(seen.has(category))add(`categoryOrder[${index}]`,'duplicates an earlier category');
      seen.add(category);
      if(!categories.has(category))add(`categoryOrder[${index}]`,'has no categoryLabels entry');
    });
  }

  const serviceIds=new Set();
  if(array(data.services,'services')){
    if(production&&!data.services.length)add('services','must contain at least one service');
    data.services.forEach((service,index)=>{
      const field=`services[${index}]`;
      if(!object(service,field))return;
      if(!string(service.id,`${field}.id`,{required:true}))return;
      if(serviceIds.has(service.id))add(`${field}.id`,'must be unique');
      serviceIds.add(service.id);
      if(!categories.has(service.category))add(`${field}.category`,'must exist in categoryLabels');
      if(!data.categoryOrder?.includes(service.category))add(`${field}.category`,'must also exist in categoryOrder');
      local(service.title,`${field}.title`,{required:true});
      local(service.price,`${field}.price`);
      local(service.duration,`${field}.duration`);
      local(service.description,`${field}.description`);
      if(array(service.variants,`${field}.variants`))service.variants.forEach((variant,variantIndex)=>{
        const variantField=`${field}.variants[${variantIndex}]`;
        if(!object(variant,variantField))return;
        local(variant.label,`${variantField}.label`);
        local(variant.duration,`${variantField}.duration`);
        local(variant.price,`${variantField}.price`);
        if(!variant.label&&!variant.duration&&!variant.price)add(variantField,'must contain a label, duration or price');
      });
    });
  }

  if(object(data.media,'media')){
    // Client logo is optional. hero.webp, profile.webp and 1..25 real gallery photos are the production media contract.
    if(data.media.logo)media(data.media.logo,'media.logo');
    media(data.media.about,'media.about',{required:production});
    if(Object.prototype.hasOwnProperty.call(data.media,'heroDesktop'))add('media.heroDesktop','obsolete field; use the same hero.webp on mobile and desktop');
    if(array(data.media.hero,'media.hero')){
      if(production&&!data.media.hero.length)add('media.hero','must contain hero.webp');
      if(production&&data.media.hero.length>1)add('media.hero','must contain exactly one canonical hero.webp');
      data.media.hero.forEach((item,index)=>{media(item,`media.hero[${index}]`,{required:true});if(item?.alt)local(item.alt,`media.hero[${index}].alt`,{required:production})});
    }
    if(array(data.media.portfolio,'media.portfolio'))data.media.portfolio.forEach((item,index)=>{media(item,`media.portfolio[${index}]`,{required:true});if(item?.alt)local(item.alt,`media.portfolio[${index}].alt`,{required:production})});
    const gallerySources=new Set();
    if(object(data.media.gallery,'media.gallery'))for(const [group,items] of Object.entries(data.media.gallery))if(array(items,`media.gallery.${group}`))items.forEach((item,index)=>{
      media(item,`media.gallery.${group}[${index}]`,{required:true});
      if(item?.alt)local(item.alt,`media.gallery.${group}[${index}].alt`,{required:production});
      const source=typeof item==='string'?item:item?.src;
      if(typeof source==='string'&&source.trim())gallerySources.add(source.trim());
    });
    if(production&&gallerySources.size<1)add('media.gallery','must contain at least one real gallery-XX.webp photo');
    if(gallerySources.size>25)add('media.gallery','must contain at most 25 unique gallery photos');
  }

  const reviewIds=new Set();
  if(array(data.reviews,'reviews'))data.reviews.forEach((review,index)=>{
    const field=`reviews[${index}]`;
    if(!object(review,field))return;
    string(review.id,`${field}.id`,{required:true});
    if(reviewIds.has(review.id))add(`${field}.id`,'must be unique');
    reviewIds.add(review.id);
    local(review.author,`${field}.author`,{required:production});
    local(review.text,`${field}.text`,{required:production});
    local(review.source,`${field}.source`,{required:production});
    if(review.rating!==5)add(`${field}.rating`,'must equal 5; only five-star reviews are allowed');
    if(review.url)url(review.url,`${field}.url`);
  });

  const teamIds=new Set();
  if(array(data.team,'team'))data.team.forEach((member,index)=>{
    const field=`team[${index}]`;
    if(!object(member,field))return;
    string(member.id,`${field}.id`,{required:true});
    if(teamIds.has(member.id))add(`${field}.id`,'must be unique');
    teamIds.add(member.id);
    local(member.name,`${field}.name`,{required:production});
    local(member.role,`${field}.role`,{required:production});
    local(member.about,`${field}.about`,{required:production});
    if(production||member.photo)media(member.photo,`${field}.photo`,{required:production});
    if(array(member.categories,`${field}.categories`))member.categories.forEach((category,categoryIndex)=>{if(!categories.has(category))add(`${field}.categories[${categoryIndex}]`,'must exist in categoryLabels')});
    if(array(member.work,`${field}.work`))member.work.forEach((item,workIndex)=>media(item,`${field}.work[${workIndex}]`,{required:true}));
    if(array(member.reviewIds,`${field}.reviewIds`))member.reviewIds.forEach((id,reviewIndex)=>{if(!reviewIds.has(id))add(`${field}.reviewIds[${reviewIndex}]`,'must reference an existing review')});
  });

  if(production)scanPlaceholders(data,'');
  if(object(data.rating,'rating')){
    if(data.rating.value!==null&&(!Number.isFinite(data.rating.value)||data.rating.value<1||data.rating.value>5))add('rating.value','must be null or a number from 1 to 5');
    if(!Number.isInteger(data.rating.count)||data.rating.count<0)add('rating.count','must be a non-negative integer');
  }
  return errors;
}

function main(){
  const args=process.argv.slice(2);
  const requireProduction=args.includes('--production');
  const input=args.find(argument=>!argument.startsWith('--'))||'site-data.js';
  let data;
  try{data=loadSiteData(input)}catch(error){console.error(`FAIL: ${error.message}`);process.exitCode=1;return}
  const isFixture=path.resolve(input)===path.resolve(__dirname,'fixtures/site-data.production.js');
  const errors=validateSiteData(data,{rootDir:process.cwd(),allowTestDomains:isFixture});
  if(requireProduction&&data.mode!=='production')errors.unshift('mode: must equal production for a release check');
  if(errors.length){
    console.error(`FAIL: ${errors.length} site data problem${errors.length===1?'':'s'}`);
    errors.forEach(error=>console.error(`- ${error}`));
    process.exitCode=1;
    return;
  }
  const suffix=data.mode==='production'?'production data is ready for browser checks':'template mode; release placeholders are allowed';
  console.log(`PASS: ${input} matches schema v1 (${suffix})`);
}

module.exports={loadSiteData,validateSiteData,REQUIRED_LOCALES};
if(require.main===module)main();
