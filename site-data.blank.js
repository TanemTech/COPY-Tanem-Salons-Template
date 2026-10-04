(function(global){
  'use strict';
  // Fill client information in this file, then rename it to site-data.js.
  // Never publish a client site while mode is 'template'.
  const t=(ru='',en='',hy='',uz='',tg='')=>({ru,en,hy,uz,tg});
  // Approved universal copy. Keep it unchanged for every salon.
  const heroDescription=t(
    'Ваша красота. Ваша уверенность.',
    'Your beauty. Your confidence.',
    'Ձեր գեղեցկությունը։ Ձեր վստահությունը։'
  );
  const about=t(
    'В основе нашей работы — профессиональный подход, внимание к деталям и уважение к индивидуальности каждого гостя. Мы создаём комфортное пространство, где качество и забота остаются главным приоритетом.',
    'Our work is built on professionalism, attention to detail, and respect for every guest’s individuality. We create a comfortable space where quality and care remain our highest priorities.',
    'Մեր աշխատանքի հիմքում մասնագիտական մոտեցումն է, ուշադրությունը մանրուքներին և հարգանքը յուրաքանչյուր հյուրի անհատականության նկատմամբ։ Մենք ստեղծում ենք հարմարավետ միջավայր, որտեղ որակն ու հոգատարությունը մնում են գլխավոր առաջնահերթությունները։'
  );
  const data={
    schemaVersion:1,
    mode:'template',
    country:'RU', // RU: ru/en; AM: ru/en/hy; UZ: ru/en/uz; TJ: ru/en/tg
    locales:['ru','en'],
    defaultLocale:'ru',
    // city/address are short UI strings; fullAddress keeps the verified full postal/admin address for maps and metadata.
    salon:{name:t(),kind:t('Салон красоты','Beauty salon','Գեղեցկության սրահ'),city:t(),address:t(),fullAddress:t(),heroDescription,about},
    schedule:{timezone:'Europe/Moscow',periods:[],fallback:t()},
    contacts:{phone:'',phoneLabel:t('Позвонить','Call','Զանգահարել'),
      messengerUrl:'',messengerLabel:t('Написать','Message','Գրել'),messengerHandle:'',
      mapUrl:'',mapEmbedUrl:'',reviewsUrl:'',booking:[]},
    rating:{value:null,count:0},
    // Media contract: hero.webp -> hero[0], profile.webp -> about, gallery-01.webp...gallery-25.webp -> portfolio/gallery, optional transparent logo.*.
    media:{logo:'',hero:[],about:'',portfolio:[],gallery:{},desktopGalleryLimits:{}},
    categoryLabels:{},
    categoryOrder:[],
    services:[], // No demo services. Add one object per actual client service.
    team:[],
    reviews:[]
  };
  global.TANEM_SITE_DATA=data;
  const rows=[];
  const collect=value=>{
    if(!value||typeof value!=='object')return;
    if(typeof value.ru==='string'&&typeof value.en==='string'&&typeof value.hy==='string'){
      if(value.ru)rows.push([value.ru,value.hy,value.en]);
      return;
    }
    if(Array.isArray(value))value.forEach(collect);
    else Object.values(value).forEach(collect);
  };
  collect(data);
  global.TANEM_SITE_I18N_ROWS=rows;
})(window);
