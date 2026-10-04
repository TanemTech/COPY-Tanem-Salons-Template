(function(global){
  'use strict';
  const t=(ru,en=ru,hy=ru)=>({ru,en,hy});
  const photo=(altRu,altEn,altHy)=>({src:'tests/fixtures/photo.svg',alt:t(altRu,altEn,altHy)});
  const siteData={
    schemaVersion:1,
    mode:'production',
    country:'AM',
    locales:['ru','en','hy'],
    defaultLocale:'ru',
    salon:{
      name:t('Люмен','Lumen','Լյումեն'),
      kind:t('Салон красоты','Beauty salon','Գեղեցկության սրահ'),
      city:t('Ереван','Yerevan','Երևան'),
      address:t('Абовяна, 12','12 Abovyan St','Աբովյան փ. 12'),
      fullAddress:t('Армения, Ереван, ул. Абовяна, 12','12 Abovyan St, Yerevan, Armenia','Հայաստան, Երևան, Աբովյան փ. 12'),
      heroDescription:t('Уход за волосами в центре Еревана','Hair care in central Yerevan','Մազերի խնամք Երևանի կենտրոնում'),
      about:t('Спокойное пространство и опытные мастера.','A calm space with experienced specialists.','Հանգիստ միջավայր և փորձառու մասնագետներ։')
    },
    schedule:{
      timezone:'Asia/Yerevan',
      periods:[{days:[1,2,3,4,5,6],open:'10:00',close:'20:00'}],
      fallback:t('По записи','By appointment','Նախնական գրանցմամբ')
    },
    contacts:{
      phone:'+374 10 555 555',
      phoneLabel:t('Позвонить','Call','Զանգահարել'),
      messengerUrl:'https://t.me/lumen_salon',
      messengerLabel:t('Telegram','Telegram','Telegram'),
      messengerHandle:'@lumen_salon',
      mapUrl:'https://www.google.com/maps/search/?api=1&query=12+Abovyan+St+Yerevan+Armenia',
      mapEmbedUrl:'https://www.google.com/maps?q=12+Abovyan+St+Yerevan+Armenia&output=embed',
      reviewsUrl:'https://example.com/reviews/lumen',
      booking:[{type:'online',label:t('Онлайн-запись','Book online','Առցանց գրանցում'),url:'https://example.com/book/lumen'}]
    },
    rating:{value:5,count:37},
    media:{
      logo:'tests/fixtures/logo.svg',
      hero:[photo('Интерьер салона','Salon interior','Սրահի ինտերիեր')],

      about:'tests/fixtures/photo.svg',
      portfolio:[],
      gallery:{'Волосы':[photo('Работа салона','Salon work','Salon work')]},
      desktopGalleryLimits:{}
    },
    categoryLabels:{'Волосы':t('Волосы','Hair','Մազեր')},
    categoryOrder:['Волосы'],
    services:[
      {
        id:'haircut',category:'Волосы',title:t('Стрижка','Haircut','Սանրվածք'),
        price:'12 000 ֏',duration:'1 ч',
        description:t('Стрижка с консультацией.','Haircut with consultation.','Սանրվածք խորհրդատվությամբ։'),variants:[]
      },
      {
        id:'coloring',category:'Волосы',title:t('Окрашивание','Coloring','Ներկում'),
        price:'18 000–30 000 ֏',duration:'2,5 ч',description:t(''),variants:[]
      },
      {
        id:'care',category:'Волосы',title:t('Уход для волос','Hair treatment','Մազերի խնամք'),
        price:'',duration:'',description:t(''),
        variants:[
          {label:t('Короткие волосы','Short hair','Կարճ մազեր'),duration:'45 мин',price:'8 000 ֏'},
          {label:t('Длинные волосы','Long hair','Երկար մազեր'),duration:'1 ч',price:'12 000 ֏'}
        ]
      }
    ],
    team:[],
    reviews:[{
      id:'review-anna',author:t('Анна','Anna','Աննա'),
      text:t('Очень аккуратно и спокойно.','Very attentive and calm.','Շատ ուշադիր և հանգիստ։'),
      rating:5,source:t('Google','Google','Google'),url:'https://example.com/reviews/lumen/anna'
    }]
  };
  const localizedRows=[];
  const collect=value=>{
    if(!value||typeof value!=='object')return;
    if(typeof value.ru==='string'&&typeof value.en==='string'&&typeof value.hy==='string'){
      if(value.ru)localizedRows.push([value.ru,value.hy,value.en]);
      return;
    }
    if(Array.isArray(value))value.forEach(collect);
    else Object.values(value).forEach(collect);
  };
  collect(siteData);
  global.TANEM_SITE_DATA=siteData;
  global.TANEM_SITE_I18N_ROWS=localizedRows;
})(window);
