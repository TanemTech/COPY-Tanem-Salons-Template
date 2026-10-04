(function(global){
  'use strict';

  const t=(ru,en=ru,hy=ru)=>({ru,en,hy});
  const placeholder='media-placeholder.svg';
  const placeholderWork=()=>({src:placeholder,alt:t('Работа салона','Salon work','Սրահի աշխատանք')});
  const placeholderSalon=()=>({src:placeholder,alt:t('Фото салона','Salon photo','Սրահի լուսանկար')});

  const categoryLabels={
    'Маникюр':t('Маникюр','Manicure','Մատնահարդարում'),
    'Брови и ресницы':t('Брови и ресницы','Brows and Lashes','Հոնքեր և թարթիչներ'),
    'Волосы':t('Волосы','Hair','Մազեր'),
    'Эпиляция':t('Эпиляция','Hair Removal','Էպիլյացիա'),
    'Другое':t('Другое','Other','Այլ'),
    'Косметология':t('Косметология','Cosmetology','Կոսմետոլոգիա'),
    'Макияж':t('Макияж','Makeup','Դիմահարդարում'),
    'Массаж':t('Массаж','Massage','Մերսում')
  };

  // Four neutral service cards solely for testing the responsive layout.
  // Prices, durations, descriptions and variants intentionally stay empty.
  // Client sites always start from site-data.blank.js (zero demo services).
  const services=[
    {id:'demo-hair',category:'Волосы',title:t('Услуга для волос','Hair service','Մազերի ծառայություն'),price:'',duration:'',description:t(''),variants:[]},
    {id:'demo-manicure',category:'Маникюр',title:t('Маникюр','Manicure','Մատնահարդարում'),price:'',duration:'',description:t(''),variants:[]},
    {id:'demo-brows-lashes',category:'Брови и ресницы',title:t('Брови и ресницы','Brows and Lashes','Հոնքեր և թարթիչներ'),price:'',duration:'',description:t(''),variants:[]},
    {id:'demo-hair-removal',category:'Эпиляция',title:t('Эпиляция','Hair Removal','Էպիլյացիա'),price:'',duration:'',description:t(''),variants:[]}
  ];

  const reviews=Array.from({length:9},(_,index)=>{
    const number=index+1;
    return {
      id:`review-${number}`,
      author:t(`Клиент ${number}`,`Client ${number}`,`Հաճախորդ ${number}`),
      text:t(
        'Текст отзыва клиента будет добавлен при заполнении шаблона.',
        'The client review will be added when the template is completed.',
        'Հաճախորդի կարծիքը կավելացվի ձևանմուշը լրացնելիս։'
      ),
      rating:5,source:t('Источник отзыва','Review source','Կարծիքի աղբյուր'),url:''
    };
  });

  const team=[
    {id:'master-1',name:t('Мастер 1','Specialist 1','Մասնագետ 1'),role:t('Специалист','Specialist','Մասնագետ'),about:t(''),categories:['Маникюр'],work:[placeholder,placeholder,placeholder],reviewIds:[]},
    {id:'master-2',name:t('Мастер 2','Specialist 2','Մասնագետ 2'),role:t('Специалист','Specialist','Մասնագետ'),about:t(''),categories:['Волосы'],work:[placeholder,placeholder,placeholder],reviewIds:[]},
    {id:'master-3',name:t('Мастер 3','Specialist 3','Մասնագետ 3'),role:t('Специалист','Specialist','Մասնագետ'),about:t(''),categories:['Косметология'],work:[],reviewIds:[]},
    {id:'master-4',name:t('Мастер 4','Specialist 4','Մասնագետ 4'),role:t('Специалист','Specialist','Մասնագետ'),about:t(''),categories:['Брови и ресницы'],work:[],reviewIds:[]}
  ];

  const siteData={
    schemaVersion:1,
    mode:'template',
    country:'RU',
    locales:['ru','en'],
    defaultLocale:'ru',
    salon:{
      name:t('SALON NAME','SALON NAME','SALON NAME'),
      kind:t('Салон красоты','Beauty salon','Գեղեցկության սրահ'),
      city:t('Город','City','Քաղաք'),
      address:t('Адрес салона','Salon address','Սրահի հասցե'),
      fullAddress:t('Полный адрес салона','Full salon address','Սրահի ամբողջական հասցե'),
      heroDescription:t('Ваша красота. Ваша уверенность.','Your beauty. Your confidence.','Ձեր գեղեցկությունը։ Ձեր վստահությունը։'),
      about:t(
        'В основе нашей работы — профессиональный подход, внимание к деталям и уважение к индивидуальности каждого гостя. Мы создаём комфортное пространство, где качество и забота остаются главным приоритетом.',
        'Our work is built on professionalism, attention to detail, and respect for every guest’s individuality. We create a comfortable space where quality and care remain our highest priorities.',
        'Մեր աշխատանքի հիմքում մասնագիտական մոտեցումն է, ուշադրությունը մանրուքներին և հարգանքը յուրաքանչյուր հյուրի անհատականության նկատմամբ։ Մենք ստեղծում ենք հարմարավետ միջավայր, որտեղ որակն ու հոգատարությունը մնում են գլխավոր առաջնահերթությունները։'
      )
    },
    schedule:{timezone:'Europe/Moscow',periods:[],fallback:t('Уточняется','To be added','Կավելացվի')},
    contacts:{phone:'',phoneLabel:t('Телефон салона','Salon phone','Սրահի հեռախոս'),messengerUrl:'',messengerLabel:t('Мессенджер','Messenger','Մեսենջեր'),messengerHandle:'',mapUrl:'',mapEmbedUrl:'',reviewsUrl:'',booking:[]},
    rating:{value:null,count:0},
    media:{
      logo:'logo-placeholder.svg',hero:[placeholderSalon(),placeholderWork()],about:placeholder,
      portfolio:Array.from({length:7},placeholderWork),
      gallery:{
        'Салон':Array.from({length:2},placeholderSalon),
        'Ногти':Array.from({length:10},placeholderWork),
        'Волосы':Array.from({length:9},placeholderWork),
        'Макияж':Array.from({length:3},placeholderWork)
      },
      desktopGalleryLimits:{'Салон':2,'Ногти':9,'Волосы':7,'Макияж':3}
    },
    categoryLabels,
    categoryOrder:['Волосы','Маникюр','Брови и ресницы','Эпиляция'],
    services,
    team,
    reviews
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
  collect(siteData.salon);
  collect(siteData.categoryLabels);
  collect(siteData.services);
  collect(siteData.team);
  collect(siteData.reviews);
  collect(siteData.contacts);
  collect(siteData.schedule);
  collect(siteData.media);

  global.TANEM_SITE_DATA=siteData;
  global.TANEM_SITE_I18N_ROWS=localizedRows;
})(window);
