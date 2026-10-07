/* салон desktop — SalonTemplate reference build. Mobile bundle is intentionally untouched. */
(function(){
  'use strict';
  const desktopDevice=window.__BR_DESKTOP_DEVICE__===true || (!('__BR_DESKTOP_DEVICE__' in window) && !!window.matchMedia && window.matchMedia('(hover:hover) and (pointer:fine)').matches);
  if(!desktopDevice) return;

  const SITE=window.TANEM_SITE_DATA;
  if(!SITE) throw new Error('TANEM_SITE_DATA must load before desktop.js');
  const localized=(value,lang='ru')=>{
    if(value==null)return '';
    if(typeof value==='string')return value;
    return value[lang]??value.ru??value.en??value.hy??'';
  };
  const russian=value=>localized(value,'ru');
  const REGION=window.TANEM_REGION||{locales:['ru','en'],fallback:'ru',labels:{ru:'RU',en:'EN'},resolve:v=>['ru','en'].includes(v)?v:'ru',ui:()=>null,teamHeading:l=>l==='ru'?'Наша команда':'Our Team'};
  const MAP_URL=SITE.contacts.mapUrl||'#salonDesktopContacts';
  const ROUTE=MAP_URL;
  const MESSENGER_URL=SITE.contacts.messengerUrl||'#salonDesktopContacts';
  const REVIEWS_URL=SITE.contacts.reviewsUrl||'#salonDesktopReviews';
  const DESKTOP_REAL_REVIEWS=SITE.reviews.map(review=>[russian(review.author),russian(review.text)]);
  const mediaItem=item=>({src:item.src,alt:russian(item.alt)});
  const PORTFOLIO=SITE.media.portfolio.map(mediaItem);
  const DESKTOP_GALLERY_GROUPS=Object.fromEntries(
    Object.entries(SITE.media.gallery).map(([category,items])=>{
      const limit=SITE.media.desktopGalleryLimits?.[category]??items.length;
      return [category,items.slice(0,limit).map(mediaItem)];
    })
  );
  const SERVICE_CATEGORIES=SITE.categoryOrder.filter(category=>SITE.services.some(service=>service.category===category));
  const SERVICE_DATA=Object.fromEntries(SERVICE_CATEGORIES.map(category=>[
    category,
    SITE.services.filter(service=>service.category===category).map(service=>{
      const variants=(service.variants||[]).map(variant=>[
        russian(variant.duration),
        russian(variant.label),
        russian(variant.price)
      ]);
      const tuple=[russian(service.title),russian(service.price),russian(service.duration),variants,russian(service.description)];
      if(service.id==='mens-cut-long'||service.id==='mens-cut-color')tuple.push(service.id);
      return tuple;
    })
  ]));
  const TEAM_MASTERS=SITE.team.map(master=>({
    id:master.id,
    name:russian(master.name),
    role:russian(master.role),
    about:russian(master.about),
    photo:typeof master.photo==='string'?master.photo:(master.photo?.src||''),
    cats:[...(master.categories||[])],
    work:(master.work||[]).map(item=>typeof item==='string'?item:item.src)
  }));
  const DISPLAY_TEAM_MASTERS=TEAM_MASTERS.length?TEAM_MASTERS:Array.from({length:4},(_,index)=>({
    id:'placeholder-'+(index+1),name:'Мастер',role:'',about:'',photo:'',cats:[],work:[],placeholder:true
  }));
  const TEAM_AVATAR='<svg viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="23" r="11" fill="currentColor"></circle><path d="M12 56c2.7-11.4 10-17 20-17s17.3 5.6 20 17" fill="currentColor"></path></svg>';
  const teamAvatar=master=>master.photo?'<img src="'+master.photo+'" alt="'+master.name+'" style="display:block;width:100%;height:100%;object-fit:cover;border-radius:inherit">':TEAM_AVATAR;

  const font=document.createElement('link');
  font.rel='stylesheet';
  font.href='https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600&family=Manrope:wght@400;500;600;700&display=swap';
  document.head.appendChild(font);
  const root=document.createElement('div');
  root.id='salon-desktop-v1';
  root.dataset.emptyTeam='0'; // Team is permanent: an empty team uses the neutral visible state.
  root.innerHTML=`
    <header class="std-header">
      <a class="std-header-brand" href="#salonDesktopTop" aria-label="SALON NAME">
        <span class="std-header-brand-main">SALON NAME</span>

      </a>
      <div class="std-lang-switch std-lang-switch-under-brand" role="group" aria-label="Language">${REGION.locales.map((lang,index)=>(index?'<span class="sep">|</span>':'')+'<button type="button" data-desktop-lang="'+lang+'">'+REGION.labels[lang]+'</button>').join('')}</div>
      <nav class="std-nav" aria-label="Основная навигация">
        <a href="#salonDesktopServices">Услуги</a>
        <a href="#salonDesktopPortfolio">Наши работы</a>
        <a href="#salonDesktopAbout">О нас</a>
        <a href="#salonDesktopReviews">Отзывы</a>
        <a href="#salonDesktopContacts">Контакты</a>
      </nav>
      <div class="std-header-right">
        <div class="std-lang-switch std-lang-switch-placeholder" aria-hidden="true"></div>
        <a class="std-phone" href="#salonDesktopContacts" aria-disabled="true" aria-label="Позвонить в SALON NAME">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13.83 16.57a1 1 0 0 0 1.21-.3l.36-.47A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.47.35a1 1 0 0 0-.29 1.23 14 14 0 0 0 6.39 6.39Z" fill="currentColor"/></svg>
          <span>Телефон салона</span>
        </a>
        <button class="std-header-book" id="stdHeaderBookBtn" type="button">Записаться</button>
      </div>
    </header>

    <section class="std-hero" id="salonDesktopTop" aria-label="SALON NAME">
      <div class="std-hero-copy">
        <div class="std-hero-frame">
          <div class="std-copy-inner">

          <h1 class="std-logo">SALON NAME</h1>


          <p class="std-tagline">Ваша красота. Ваша уверенность.</p>

          <div class="std-meta">
            <div class="std-meta-item">
              <span class="std-meta-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.2" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M12 7.7v4.8l3 1.8" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
              </span>
              <span class="std-meta-text"><span class="std-status-main" id="stdStatusMain">График</span><span class="std-status-sub" id="stdStatusSub">Уточняется</span></span>
            </div>

            <span class="std-meta-divider" aria-hidden="true"></span>

            <a class="std-meta-item" href="#salonDesktopContacts" aria-disabled="true">
              <span class="std-meta-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24"><path d="M12 21s6-5.2 6-11a6 6 0 1 0-12 0c0 5.8 6 11 6 11Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><circle cx="12" cy="10" r="2.1" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>
              </span>
              <span class="std-meta-text std-address">Город,<br>Адрес салона</span>
            </a>
          </div>

          <div class="std-actions">
            <button class="std-btn std-btn-primary" id="stdBookBtn" type="button">
              <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="6" width="16" height="14" rx="2" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M8 3.8v4.4M16 3.8v4.4M4 10h16M8 13.5h.01M12 13.5h.01M16 13.5h.01M8 17h.01M12 17h.01M16 17h.01" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
              <span>Записаться</span>
            </button>
            <a class="std-btn" id="stdViewWorks" href="#salonDesktopPortfolio">
              <span class="std-sparkles" aria-hidden="true">✦</span>
              <span>Смотреть работы</span>
            </a>
          </div>
          </div>
          <a class="std-scroll-hint" href="#salonDesktopPortfolio" aria-label="Листайте вниз"><span class="std-scroll-label">Листайте вниз</span><span class="std-scroll-circle" aria-hidden="true">↓</span></a>
        </div>
      </div>

      <div class="std-hero-photo">
        <img id="stdHeroMedia" src="media-placeholder.svg" alt="Медиа салона">
      </div>
    </section>

    <section class="std-portfolio" id="salonDesktopPortfolio" aria-labelledby="salonDesktopPortfolioTitle">
      <div class="std-portfolio-inner">
        <div class="std-portfolio-head">
          <p class="std-portfolio-kicker">Портфолио</p>
          <h2 class="std-portfolio-title" id="salonDesktopPortfolioTitle">Наши работы</h2>
          <p class="std-portfolio-copy">${SITE.mode==='production'?'Фотографии работ салона.':'Фотографии и работы салона будут добавлены при заполнении шаблона.'}</p>
        </div>
        <div class="std-portfolio-grid">
          ${PORTFOLIO.map((item,i)=>`<button class="std-work" type="button" data-portfolio-index="${i}" aria-label="Открыть фотографию"><img src="${item.src}" alt="${item.alt}" loading="${i<4?'eager':'lazy'}"></button>`).join('')}
        </div>
        <button class="std-portfolio-more" id="stdOpenGallery" type="button">Открыть галерею <span aria-hidden="true">→</span></button>
      </div>
    </section>

    <section class="mct-prices" id="salonDesktopServices" aria-labelledby="stdServicesTitle">
      <div class="mct-shell">
        <div class="mct-price-head">
          <div class="dct-service-sticky-card" id="stdStickyServiceCard" aria-label="Выберите услугу">
            <strong>Выберите услугу</strong>
            <p class="dct-service-sticky-lead">Все услуги собраны по направлениям. Выберите подходящую процедуру — запись откроется сразу, без лишних шагов.</p>
            <div class="dct-service-sticky-info">
              <div class="dct-service-sticky-row dct-service-availability">
                <span class="dct-service-sticky-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.5"></circle><path d="M12 7.5v5l3.2 2"></path></svg>
                </span>
                <span class="dct-service-sticky-copy">
                  <b id="stdStickyServiceStatus">График</b>
                  <small id="stdStickyServiceStatusSub">Уточняется</small>
                </span>
              </div>
              <a class="dct-service-sticky-row dct-service-sticky-route" href="#salonDesktopContacts" aria-disabled="true" aria-label="Построить маршрут">
                <span class="dct-service-sticky-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24"><path d="M19 10c0 5.2-7 10-7 10s-7-4.8-7-10a7 7 0 1 1 14 0Z"></path><circle cx="12" cy="10" r="2.2"></circle></svg>
                </span>
                <span class="dct-service-sticky-copy">
                  <b>Город</b>
                  <small>Адрес салона</small>
                </span>
              </a>
            </div>
            <div class="dct-service-sticky-steps" aria-label="Как записаться">
              <span class="dct-service-sticky-steps-title">Быстрая запись</span>
              <ol>
                <li><b>01</b><span>Выберите услугу</span></li>
                <li><b>02</b><span>Записаться</span></li>
                <li><b>03</b><span>Связь с салоном</span></li>
              </ol>
            </div>
            <button class="dct-service-sticky-book" id="stdStickyServiceBook" type="button"><span>Записаться</span><span aria-hidden="true">→</span></button>
            <button class="dct-service-sticky-work" id="stdStickyGalleryOpen" type="button"><span>Открыть галерею</span><span aria-hidden="true">✦</span></button>
          </div>
        </div>

        <div class="dct-services-main-title" id="stdServicesTitle">Услуги и цены</div>
        <div class="mct-tabs-ribbon-wrap is-many">
          <div class="mct-tabs mct-tabs-scroll is-many" role="tablist" aria-label="Категории услуг">
            <div class="mct-tabs-track" id="stdServiceTabs"></div>
          </div>
        </div>

        <div class="dct-service-groups" id="stdServiceList" aria-label="Услуги по категориям на компьютере"></div>

        <button class="mct-more-services" id="stdServiceMore" type="button" aria-expanded="false">
          <span class="mct-more-services-mobile-copy" id="stdServiceMoreTextMobile"></span>
          <span class="mct-more-services-desktop-copy" id="stdServiceMoreText"></span>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true"><path d="M2.5 4.5 6 8l3.5-3.5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </button>
      </div>
    </section>

    <section class="mct-about br-about-team" id="salonDesktopAbout" aria-labelledby="stdAboutTitle">
      <div class="br-about-team-headings">
        <h2 id="stdAboutTitle">О салоне</h2>
        <h2 id="stdTeamTitle">Наша команда</h2>
      </div>
      <div class="mct-shell br-about-team-shell">
        <article class="br-about-column">
          <div class="mct-about-card">
            <div class="mct-about-portrait-wrap">
              <figure class="mct-about-portrait">
                <img src="media-placeholder.svg" alt="SALON NAME" loading="lazy">
                <div class="dct-about-rating"><span class="dct-about-rating-star">★</span><strong>—</strong><span>рейтинг не указан</span></div>
              </figure>
            </div>
            <div class="mct-about-copy">
              <p class="mct-about-lead"><span class="dct-about-brand">SALON NAME</span><span class="dct-about-kind">Салон красоты</span></p>
              <p class="dct-about-copy">В основе нашей работы — профессиональный подход, внимание к деталям и уважение к индивидуальности каждого гостя. Мы создаём комфортное пространство, где качество и забота остаются главным приоритетом.</p>
              <div class="dct-about-amenities">
                <div class="dct-about-amenities-grid">
                  <article><strong>Разные направления</strong><span>Волосы, маникюр, брови и ресницы, эпиляция.</span></article>
                  <article><strong>Комфорт</strong><span>Спокойная атмосфера и внимание к каждому гостю.</span></article>
                  <article><strong>Прямая запись</strong><span>Контакты будут добавлены при заполнении шаблона.</span></article>
                </div>
              </div>
            </div>
          </div>
        </article>

        <aside class="br-team-panel" id="salonDesktopTeam" aria-labelledby="stdTeamTitle">
          <p class="std-team-kicker">Наша команда</p>
          <p class="std-team-subtitle">${TEAM_MASTERS.length?'Нажмите на мастера, чтобы открыть страницу специалиста.':'Команда салона'}</p>
          <div class="std-team-track" id="stdTeamTrack">
            ${DISPLAY_TEAM_MASTERS.map(master=>master.placeholder?`
              <div class="std-master is-placeholder">
                <div class="std-master-avatar">${teamAvatar(master)}</div>
                <strong class="std-master-name">Мастер</strong>
                <span class="std-master-role"></span>
                <span class="std-master-cats"></span>
              </div>
            `:`
              <button class="std-master" type="button" data-desktop-master="${master.id}">
                <div class="std-master-avatar">${teamAvatar(master)}</div>
                <strong class="std-master-name">${master.name}</strong>
                <span class="std-master-role">${master.role}</span>
                <span class="std-master-cats">${master.cats.map(cat=>'<span class="std-master-cat">'+cat+'</span>').join('')}</span>
              </button>
            `).join('')}
          </div>
        </aside>
      </div>
    </section>

    <section class="std-reviews" id="salonDesktopReviews" aria-labelledby="stdReviewsTitle">
      <div class="std-reviews-head">
        <p class="std-reviews-kicker">Отзывы</p>
        <h2 class="std-reviews-title" id="stdReviewsTitle">Что говорят о нас</h2>
        <div class="std-reviews-score">
          <strong>—</strong>
          <div class="std-reviews-stars" aria-label="Рейтинг не указан">★★★★★</div>
          <div class="std-reviews-count">Отзывы будут добавлены</div>
        </div>
      </div>

      <div class="std-reviews-viewport" id="stdReviewsViewport" aria-label="Отзывы клиентов. Наведите курсор, чтобы остановить ленту.">
        <div class="std-reviews-loop">
          <div class="std-reviews-set">
            ${DESKTOP_REAL_REVIEWS.map(r=>`
              <a class="std-review-card" href="${REVIEWS_URL}" aria-disabled="true">
                <div class="std-review-head">
                  <span class="std-review-avatar">${([...(String(r[0]).trim())][0]||'S').toUpperCase()}</span>
                  <span>
                    <strong class="std-review-name">${r[0]}</strong>
                    <span class="std-review-meta">Источник отзыва</span>
                    <span class="std-review-stars">★★★★★</span>
                  </span>
                </div>
                <p class="std-review-text">${r[1]}</p>
                <span class="std-review-more">Подробнее →</span>
              </a>
            `).join('')}
          </div>
          <div class="std-reviews-set" aria-hidden="true">
            ${DESKTOP_REAL_REVIEWS.map(r=>`
              <a class="std-review-card" href="${REVIEWS_URL}" aria-disabled="true" tabindex="-1">
                <div class="std-review-head">
                  <span class="std-review-avatar">${([...(String(r[0]).trim())][0]||'S').toUpperCase()}</span>
                  <span>
                    <strong class="std-review-name">${r[0]}</strong>
                    <span class="std-review-meta">Источник отзыва</span>
                    <span class="std-review-stars">★★★★★</span>
                  </span>
                </div>
                <p class="std-review-text">${r[1]}</p>
                <span class="std-review-more">Подробнее →</span>
              </a>
            `).join('')}
          </div>
        </div>
      </div>

      <div class="std-reviews-actions">
        <a class="std-reviews-all" href="${REVIEWS_URL}" aria-disabled="true">Смотреть все отзывы →</a>
      </div>
    </section>

    <section class="std-contact" id="salonDesktopContacts" aria-labelledby="stdContactTitle">
      <div class="std-contact-inner">
        <div class="std-contact-head">
          <div>
            <p class="std-contact-kicker">Контакты</p>
            <h2 class="std-contact-title" id="stdContactTitle">Ждём вас</h2>
          </div>
          <div class="std-contact-status" id="stdContactStatus">
            <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5"></circle><path d="M12 7.5V12l3.2 1.8"></path></svg>
            <span id="stdContactStatusText">График работы</span>
          </div>
        </div>

        <div class="std-contact-body">
          <div class="std-contact-list">
            <a class="std-contact-card" data-contact-type="address" href="${MAP_URL}" aria-disabled="true">
              <span class="std-contact-card-icon">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s6.5-5.4 6.5-11a6.5 6.5 0 1 0-13 0c0 5.6 6.5 11 6.5 11Z"></path><circle cx="12" cy="10" r="2.2"></circle></svg>
              </span>
              <span class="std-contact-card-copy"><strong class="std-contact-card-title">Город, адрес салона</strong><span class="std-contact-card-sub">Адрес салона</span></span>
            </a>

            <a class="std-contact-card" data-contact-type="phone" href="#salonDesktopContacts">
              <span class="std-contact-card-icon">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4h3l1.3 4-2 1.5c1 2 2.6 3.6 4.6 4.6l1.5-2L19 13.5v3c0 1.1-.9 2-2 2C10.4 18.5 5.5 13.6 5.5 7A2 2 0 0 1 7 4Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
              </span>
              <span class="std-contact-card-copy"><strong class="std-contact-card-title">Телефон салона</strong><span class="std-contact-card-sub">Контакт будет добавлен</span></span>
            </a>

            <a class="std-contact-card" data-contact-type="messenger" href="${MESSENGER_URL}" aria-disabled="true">
              <span class="std-contact-card-icon">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 5.5h14v10H9l-4 3v-13Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M8.5 9.2c.8 2.2 2.1 3.5 4.3 4.3" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
              </span>
              <span class="std-contact-card-copy"><strong class="std-contact-card-title">Мессенджер</strong><span class="std-contact-card-sub">Контакт будет добавлен</span></span>
            </a>

            <div class="std-contact-card static" data-contact-type="hours">
              <span class="std-contact-card-icon">
                <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5"></circle><path d="M12 7.5V12l3.2 1.8"></path></svg>
              </span>
              <span class="std-contact-card-copy"><strong class="std-contact-card-title">График работы</strong><span class="std-contact-card-sub" id="stdContactHoursSub">Уточняется</span></span>
            </div>
          </div>

          <div class="std-contact-right">
            <div class="std-contact-map"><iframe title="Карта салона" loading="eager" src="about:blank"></iframe></div>
            <div class="std-contact-actions">
              <a class="std-contact-action-btn std-contact-call" href="#salonDesktopContacts">Позвонить</a>
              <a class="std-contact-action-btn std-contact-route" href="${ROUTE}" aria-disabled="true">Построить маршрут</a>
            </div>
          </div>
        </div>
      </div>

      <div class="std-contact-bottom">
        <a class="std-contact-brand" href="https://tanem.ru/" target="_blank" rel="noopener">
          <span class="br-tanem-mark">T</span>
          <span class="br-tanem-copy">Создано в <strong>TANEM.ru</strong></span>
        </a>
      </div>
    </section>

    <div class="std-master-overlay" id="stdMasterOverlay" role="dialog" aria-modal="true" aria-label="Мастер SALON NAME">
      <div class="std-master-page-panel">
        <div class="std-master-page-top">
          <button class="std-master-page-close" id="stdMasterPageClose" type="button" aria-label="Закрыть">←</button>
          <span>SALON NAME</span>
          <i aria-hidden="true"></i>
        </div>
        <div class="std-master-page-content" id="stdMasterPageContent"></div>
        <button class="std-master-page-book" id="stdMasterPageBook" type="button">Записаться онлайн</button>
      </div>
    </div>

    <div class="std-book-overlay" id="stdBookOverlay" role="dialog" aria-modal="true" aria-label="Запись SALON NAME">
      <div class="std-book-panel">
        <button class="std-book-close" id="stdBookClose" type="button" aria-label="Закрыть">×</button>
        <p class="std-services-kicker">Запись</p><h3>Как вам удобнее записаться?</h3><p>Выберите удобный способ связи.</p>
        <div class="std-book-options">
          <a href="#salonDesktopContacts" aria-disabled="true"><span>Телефон</span><span>Будет добавлен →</span></a>
          <a href="#salonDesktopContacts" aria-disabled="true"><span>Мессенджер</span><span>Будет добавлен →</span></a>
          <a href="${MAP_URL}" aria-disabled="true"><span>Карты</span><span>Будут добавлены →</span></a>
        </div>
      </div>
    </div>

    <div class="std-gallery-browser" id="stdGalleryBrowser" role="dialog" aria-modal="true" aria-label="Галерея SALON NAME">
      <div class="std-gallery-browser-shell">
        <div class="std-gallery-browser-top">
          <button class="std-gallery-browser-back" id="stdGalleryBrowserBack" type="button" aria-label="Закрыть галерею">←</button>
          <div class="std-gallery-browser-title"><strong>Галерея</strong><span>SALON NAME</span></div>
          <div></div>
        </div>
        <div class="std-gallery-browser-tabs" id="stdGalleryBrowserTabs"></div>
        <div class="std-gallery-browser-grid" id="stdGalleryBrowserGrid"></div>
      </div>
    </div>

    <div class="std-gallery" id="stdGallery" role="dialog" aria-modal="true" aria-label="Галерея SALON NAME">
      <button class="std-gallery-close" id="stdGalleryClose" type="button" aria-label="Закрыть">×</button>
      <div class="std-gallery-stage">
        <div class="std-gallery-hint">Увеличение: прокрутите колесо мыши или дважды нажмите на фотографию</div>
        <div class="std-gallery-canvas"><img class="std-gallery-image" id="stdGalleryImage" src="" alt="Фотография SALON NAME"></div>
        <button class="std-gallery-nav std-gallery-prev" id="stdGalleryPrev" type="button" aria-label="Предыдущее фото">‹</button>
        <button class="std-gallery-nav std-gallery-next" id="stdGalleryNext" type="button" aria-label="Следующее фото">›</button>
        <span class="std-gallery-count" id="stdGalleryCount"></span>
        <button class="std-view-gallery" id="stdViewGallery" type="button">Открыть галерею</button>
      </div>
    </div>
  `;
  document.body.appendChild(root);
  const revealDesktopRoot=()=>requestAnimationFrame(()=>root.classList.add('desktop-ready'));
  if(document.documentElement.classList.contains('br-booting')){
    window.addEventListener('br:intro-done',revealDesktopRoot,{once:true});
  }else{
    revealDesktopRoot();
  }

  const bookBtn=document.getElementById('stdBookBtn');
  const bookOverlay=document.getElementById('stdBookOverlay');
  const openDesktopBooking=()=>{bookOverlay.classList.add('open');document.body.style.overflow='hidden'};
  const closeDesktopBooking=()=>{bookOverlay.classList.remove('open');if(!document.querySelector('.std-gallery.open,.std-gallery-browser.open'))document.body.style.overflow=''};
  bookBtn.addEventListener('click',openDesktopBooking);
  const headerBookBtn=document.getElementById('stdHeaderBookBtn');
  if(headerBookBtn)headerBookBtn.addEventListener('click',openDesktopBooking);
  const stickyServiceBook=document.getElementById('stdStickyServiceBook');
  if(stickyServiceBook)stickyServiceBook.addEventListener('click',openDesktopBooking);
  document.getElementById('stdBookClose').addEventListener('click',closeDesktopBooking);
  bookOverlay.addEventListener('click',e=>{if(e.target===bookOverlay)closeDesktopBooking()});

  const galleryBrowser=document.getElementById('stdGalleryBrowser');
  const galleryBrowserTabs=document.getElementById('stdGalleryBrowserTabs');
  const galleryBrowserGrid=document.getElementById('stdGalleryBrowserGrid');
  const gallery=document.getElementById('stdGallery');
  const galleryStage=document.querySelector('.std-gallery-stage');
  const galleryCanvas=document.querySelector('.std-gallery-canvas');
  const galleryImage=document.getElementById('stdGalleryImage');
  const galleryCount=document.getElementById('stdGalleryCount');
  const galleryViewAll=document.getElementById('stdViewGallery');
  let galleryCategory='Ногти';
  let galleryItems=PORTFOLIO.slice();
  let galleryIndex=0;
  let galleryScale=1,galleryX=0,galleryY=0;
  let galleryDragStartX=0,galleryDragStartY=0,galleryPanStartX=0,galleryPanStartY=0,galleryDragging=false;
  let galleryPinchStart=0,galleryPinchBase=1,galleryHadPinch=false;
  const galleryWarmCache=new Map();
  function warmGalleryImage(src){
    if(!src||galleryWarmCache.has(src))return;
    const image=new Image();image.decoding="async";image.src=src;
    galleryWarmCache.set(src,image);
    if(galleryWarmCache.size>8)galleryWarmCache.delete(galleryWarmCache.keys().next().value);
  }
  function warmGalleryNeighbours(){
    if(galleryItems.length<2)return;
    warmGalleryImage(galleryItems[(galleryIndex+1)%galleryItems.length].src);
    warmGalleryImage(galleryItems[(galleryIndex-1+galleryItems.length)%galleryItems.length].src);
  }

  function clampDesktopViewer(){
    if(galleryScale<=1){galleryX=0;galleryY=0;return}
    const maxX=(galleryScale-1)*galleryCanvas.clientWidth*.5;
    const maxY=(galleryScale-1)*galleryCanvas.clientHeight*.5;
    galleryX=Math.max(-maxX,Math.min(maxX,galleryX));
    galleryY=Math.max(-maxY,Math.min(maxY,galleryY));
  }
  function applyDesktopViewerTransform(){
    clampDesktopViewer();
    galleryImage.style.transform='translate3d('+galleryX+'px,'+galleryY+'px,0) scale('+galleryScale+')';
  }
  function resetDesktopViewer(){
    galleryScale=1;galleryX=0;galleryY=0;galleryPinchStart=0;galleryPinchBase=1;
    applyDesktopViewerTransform();
  }
  function paintGallery(){
    const item=galleryItems[galleryIndex];
    if(!item)return;
    warmGalleryImage(item.src);
    galleryImage.decoding="async";
    galleryImage.src=item.src;
    galleryImage.alt=item.alt||'Фотография SALON NAME';
    if(typeof galleryImage.decode==="function")galleryImage.decode().catch(()=>{});
    warmGalleryNeighbours();
    galleryCount.textContent=String(galleryIndex+1).padStart(2,'0')+' / '+String(galleryItems.length).padStart(2,'0');
    document.getElementById('stdGalleryPrev').hidden=galleryItems.length<2;
    document.getElementById('stdGalleryNext').hidden=galleryItems.length<2;
    resetDesktopViewer();
  }
  function openDesktopViewer(items,index=0,source='gallery'){
    galleryItems=Array.isArray(items)&&items.length?items:PORTFOLIO.slice();
    gallery.dataset.source=source;
    galleryViewAll.hidden=source!=='portfolio';
    galleryIndex=Math.max(0,Math.min(index,galleryItems.length-1));
    paintGallery();
    gallery.classList.add('open');
    document.body.style.overflow='hidden';
  }
  function closeDesktopViewer(){
    gallery.classList.remove('open');
    resetDesktopViewer();
    if(!galleryBrowser.classList.contains('open'))document.body.style.overflow='';
  }
  function moveDesktopGallery(step){
    if(galleryItems.length<2)return;
    galleryIndex=(galleryIndex+step+galleryItems.length)%galleryItems.length;
    paintGallery();
  }

  function renderDesktopGalleryBrowser(){
    const cats=Object.keys(DESKTOP_GALLERY_GROUPS);
    const items=DESKTOP_GALLERY_GROUPS[galleryCategory]||[];
    if(!galleryBrowserTabs.childElementCount){
      galleryBrowserTabs.innerHTML=cats.map(cat=>'<button class="std-gallery-browser-tab" type="button" data-gallery-category="'+cat+'">'+cat+'</button>').join('');
      galleryBrowserTabs.querySelectorAll('[data-gallery-category]').forEach(btn=>btn.onclick=()=>{
        galleryCategory=btn.dataset.galleryCategory;
        renderDesktopGalleryBrowser();
      });
    }
    galleryBrowserTabs.querySelectorAll('[data-gallery-category]').forEach(btn=>{
      const active=btn.dataset.galleryCategory===galleryCategory;
      btn.classList.toggle('active',active);
      btn.setAttribute('aria-selected',active?'true':'false');
    });
    galleryBrowserGrid.innerHTML=items.map((item,i)=>'<button class="std-gallery-browser-tile" type="button" data-gallery-item="'+i+'" aria-label="Открыть фотографию"><img src="'+item.src+'" alt="'+item.alt+'" loading="lazy" decoding="async"></button>').join('');
    if(items.length)warmGalleryImage(items[0].src);
  }
  galleryBrowserGrid.addEventListener("click",e=>{
    const tile=e.target.closest("[data-gallery-item]");
    if(!tile)return;
    const items=DESKTOP_GALLERY_GROUPS[galleryCategory]||[];
    openDesktopViewer(items,Number(tile.dataset.galleryItem)||0,"gallery");
  });
  galleryBrowserGrid.addEventListener("pointerover",e=>{
    const tile=e.target.closest("[data-gallery-item]");
    if(!tile)return;
    const item=(DESKTOP_GALLERY_GROUPS[galleryCategory]||[])[Number(tile.dataset.galleryItem)||0];
    if(item)warmGalleryImage(item.src);
  },{passive:true});
  function openDesktopGalleryBrowser(cat='Салон'){
    galleryCategory=Object.prototype.hasOwnProperty.call(DESKTOP_GALLERY_GROUPS,cat)?cat:'Салон';
    renderDesktopGalleryBrowser();
    galleryBrowser.classList.add('open');
    galleryBrowser.scrollTop=0;
    document.body.style.overflow='hidden';
  }
  function closeDesktopGalleryBrowser(){
    galleryBrowser.classList.remove('open');
    if(!gallery.classList.contains('open'))document.body.style.overflow='';
  }

  document.querySelectorAll('.std-work').forEach(btn=>{
    btn.addEventListener('click',()=>openDesktopViewer(PORTFOLIO,Number(btn.dataset.portfolioIndex)||0,'portfolio'));
  });
  document.getElementById('stdOpenGallery').addEventListener('click',()=>openDesktopGalleryBrowser('Ногти'));
  document.getElementById('stdStickyGalleryOpen')?.addEventListener('click',()=>openDesktopGalleryBrowser('Ногти'));
  document.getElementById('stdViewWorks')?.addEventListener('click',e=>{e.preventDefault();openDesktopGalleryBrowser('Ногти')});
  document.getElementById('stdGalleryBrowserBack').addEventListener('click',closeDesktopGalleryBrowser);
  document.getElementById('stdGalleryClose').addEventListener('click',closeDesktopViewer);
  document.getElementById('stdGalleryPrev').addEventListener('click',()=>moveDesktopGallery(-1));
  document.getElementById('stdGalleryNext').addEventListener('click',()=>moveDesktopGallery(1));
  galleryViewAll.addEventListener('click',()=>{closeDesktopViewer();openDesktopGalleryBrowser('Ногти')});
  gallery.addEventListener('click',e=>{if(e.target===gallery)closeDesktopViewer()});

  galleryStage.addEventListener('wheel',e=>{
    if(!gallery.classList.contains('open'))return;
    e.preventDefault();
    const delta=e.deltaY<0?.18:-.18;
    galleryScale=Math.max(1,Math.min(4,galleryScale+delta));
    if(galleryScale<=1.01)galleryScale=1;
    applyDesktopViewerTransform();
  },{passive:false});
  const toggleDesktopViewerZoom=e=>{
    if(e)e.preventDefault();
    galleryScale=galleryScale>1?1:2;
    if(galleryScale===1){galleryX=0;galleryY=0}
    applyDesktopViewerTransform();
  };
  galleryCanvas.addEventListener('dblclick',toggleDesktopViewerZoom);
  galleryImage.addEventListener('dblclick',toggleDesktopViewerZoom);

  galleryStage.addEventListener('pointerdown',e=>{
    if(e.pointerType==='touch'||e.target.closest('.std-gallery-nav,.std-view-gallery'))return;
    galleryDragging=true;
    galleryDragStartX=e.clientX;galleryDragStartY=e.clientY;
    galleryPanStartX=galleryX;galleryPanStartY=galleryY;
    try{galleryStage.setPointerCapture(e.pointerId)}catch(_){}
  });
  galleryStage.addEventListener('pointermove',e=>{
    if(!galleryDragging||e.pointerType==='touch')return;
    if(galleryScale>1){
      galleryX=galleryPanStartX+(e.clientX-galleryDragStartX);
      galleryY=galleryPanStartY+(e.clientY-galleryDragStartY);
      applyDesktopViewerTransform();
    }
  });
  galleryStage.addEventListener('pointerup',e=>{
    if(!galleryDragging||e.pointerType==='touch')return;
    galleryDragging=false;
    const dx=e.clientX-galleryDragStartX,dy=e.clientY-galleryDragStartY;
    try{galleryStage.releasePointerCapture(e.pointerId)}catch(_){}
    if(galleryScale===1&&Math.abs(dx)>55&&Math.abs(dx)>Math.abs(dy)*1.1)moveDesktopGallery(dx<0?1:-1);
  });
  galleryStage.addEventListener('pointercancel',()=>{galleryDragging=false});

  const pinchDistance=e=>Math.hypot(e.touches[0].clientX-e.touches[1].clientX,e.touches[0].clientY-e.touches[1].clientY);
  galleryCanvas.addEventListener('touchstart',e=>{
    if(e.touches.length===2){
      e.preventDefault();galleryHadPinch=true;galleryPinchStart=pinchDistance(e);galleryPinchBase=galleryScale;
    }else if(e.touches.length===1){
      galleryDragStartX=e.touches[0].clientX;galleryDragStartY=e.touches[0].clientY;
      galleryPanStartX=galleryX;galleryPanStartY=galleryY;
    }
  },{passive:false});
  galleryCanvas.addEventListener('touchmove',e=>{
    if(e.touches.length===2&&galleryPinchStart){
      e.preventDefault();
      galleryScale=Math.max(1,Math.min(4,galleryPinchBase*(pinchDistance(e)/galleryPinchStart)));
      applyDesktopViewerTransform();
    }else if(e.touches.length===1&&galleryScale>1){
      e.preventDefault();
      galleryX=galleryPanStartX+(e.touches[0].clientX-galleryDragStartX);
      galleryY=galleryPanStartY+(e.touches[0].clientY-galleryDragStartY);
      applyDesktopViewerTransform();
    }
  },{passive:false});
  galleryCanvas.addEventListener('touchend',e=>{
    if(e.touches.length<2)galleryPinchStart=0;
    if(e.touches.length===0){
      if(!galleryHadPinch&&galleryScale===1&&galleryItems.length>1&&e.changedTouches.length){
        const dx=e.changedTouches[0].clientX-galleryDragStartX;
        const dy=e.changedTouches[0].clientY-galleryDragStartY;
        if(Math.abs(dx)>45&&Math.abs(dx)>Math.abs(dy)*1.15)moveDesktopGallery(dx<0?1:-1);
      }
      galleryHadPinch=false;
      if(galleryScale<=1.01)resetDesktopViewer();
    }
  },{passive:false});

  document.addEventListener('keydown',e=>{if(bookOverlay.classList.contains('open')&&e.key==='Escape'){closeDesktopBooking();return}});
  document.addEventListener('keydown',e=>{
    if(gallery.classList.contains('open')){
      if(e.key==='Escape')closeDesktopViewer();
      else if(e.key==='ArrowLeft')moveDesktopGallery(-1);
      else if(e.key==='ArrowRight')moveDesktopGallery(1);
      return;
    }
    if(galleryBrowser.classList.contains('open')&&e.key==='Escape')closeDesktopGalleryBrowser();
  });

  const SERVICE_PREVIEW_LIMIT=8;
  let activeServiceCategory='Все';
  let desktopServicesExpanded=false;
  let desktopServiceLanguageReady=false;
  const serviceTabs=document.getElementById('stdServiceTabs');
  const serviceList=document.getElementById('stdServiceList');
  const serviceMore=document.getElementById('stdServiceMore');
  const serviceMoreText=document.getElementById('stdServiceMoreText');
  const serviceMoreTextMobile=document.getElementById('stdServiceMoreTextMobile');
  const DESKTOP_SERVICE_TABS=['Все',...SERVICE_CATEGORIES];

  function desktopServiceWord(n){
    const n10=n%10,n100=n%100;
    if(n10===1&&n100!==11)return 'услугу';
    if(n10>=2&&n10<=4&&(n100<12||n100>14))return 'услуги';
    return 'услуг';
  }

  function desktopDurationValue(raw){const m=String(raw||'').match(/\d+(?:[.,]\d+)?/);return m?m[0]:''}
  function activeDesktopServiceLang(){const raw=(document.body.dataset.brLang||document.documentElement.lang||'en').toLowerCase();return raw.startsWith('ru')?'ru':raw.startsWith('hy')?'hy':'en'}
  function desktopDurationLabel(raw,lang=activeDesktopServiceLang()){let v=desktopDurationValue(raw);if(!v)return '';v=lang==='ru'?v.replace('.',','):v.replace(',','.');const minutes=/(?:мин|minutes?|mins?)/i.test(String(raw||''));return v+(minutes?(lang==='hy'?' րոպե':lang==='en'?' min':' мин'):(lang==='hy'?' ժ.':lang==='en'?' h':' ч'))}
  function updateDesktopServiceDurations(lang=activeDesktopServiceLang()){document.querySelectorAll('#salonDesktopServices .dct-service-duration[data-duration]').forEach(el=>{el.textContent=desktopDurationLabel(el.dataset.duration,lang)})}
  window.addEventListener('salon-template:languagechange',e=>updateDesktopServiceDurations(e.detail&&e.detail.lang));

  function desktopPriceMarkup(raw){
    const value=String(raw||'').trim();
    const m=value.match(/^(?:(от|from)\s+)?([\d ]+(?:[–-][\d ]+)?)\s*([֏₽€$£])$/u);
    if(!m)return value;
    return '<span class="dct-money-prefix">'+(m[1]||'')+'</span>'+
      '<span class="dct-money-amount">'+m[2].trim()+'</span>'+
      '<span class="dct-money-symbol">'+m[3]+'</span>';
  }

  function templateServiceCard(item){
    const title=item[0];
    const price=item[1]||'';
    const duration=item[2]||'';
    const description=item[4]||'';
    const variants=item[3]||[];
    const hasVariants=variants.length>0;
    const action=price||'Записаться';
    const actionDisplay=price?desktopPriceMarkup(price):action;
    const actionClass=price?'is-price':'is-book';
    const hasPriceRange=/^[\d ]+[–-][\d ]+\s*[֏₽€$£]$/u.test(price);
    const durationMarkup=duration?'<span class="dct-service-duration" data-duration="'+duration+'">'+desktopDurationLabel(duration)+'</span>':'';
    const sideRailMarkup='<span class="dct-service-side-rail">'+durationMarkup+
      '<span class="dct-service-card-meta"><b class="'+actionClass+'">'+actionDisplay+'</b></span></span>';

    if(hasVariants){
      return '<button class="dct-service-card has-variants'+(description?' has-description':'')+'" type="button" data-service-book>'+
        '<span class="dct-service-card-body">'+
          '<strong class="dct-service-card-title">'+title+'</strong>'+durationMarkup+
          '<div class="dct-service-card-description '+(description?'has-copy':'is-empty')+'">'+(description?'<p>'+description+'</p>':'')+'</div>'+
          '<div class="dct-service-card-variants">'+variants.map(v=>{
            const variantAction=v[2]||action;
            const variantClass=variantAction==='Записаться'?'is-book':'is-price';
            return '<div class="dct-service-card-variant"><span class="dct-service-duration" data-duration="'+v[0]+'">'+desktopDurationLabel(v[0])+'</span><span class="dct-service-card-variant-meta">'+(v[1]?'<small>'+v[1]+'</small>':'')+'<b class="'+variantClass+'">'+variantAction+'</b></span></div>';
          }).join('')+'</div>'+
        '</span>'+
      '</button>';
    }

    // Any service with a description gets independent booking and a More button only when the text exceeds two rendered lines.
    if(description){
      const descriptionId='stdServiceDesc-'+(item[5]||title+'-'+price).replace(/[^\p{L}\p{N}-]+/gu,'-');
      return '<article class="dct-service-card has-description is-demo-expandable'+(hasPriceRange?' is-price-range':'')+'">'+
        '<div class="dct-service-card-body">'+
          '<strong class="dct-service-card-title">'+title+'</strong>'+sideRailMarkup+
          '<div class="dct-service-card-description has-copy">'+
            '<p id="'+descriptionId+'">'+description+'</p>'+
            '<button class="dct-service-demo-more" type="button" data-service-details aria-expanded="false" aria-controls="'+descriptionId+'">Подробнее…</button>'+
          '</div>'+
        '</div>'+
        '<button class="dct-service-demo-book-hit" type="button" data-service-book data-demo-title="'+title+'" aria-label="Записаться: '+title+'"></button>'+
      '</article>';
    }

    return '<button class="dct-service-card'+(description?' has-description':'')+(hasPriceRange?' is-price-range':'')+'" type="button" data-service-book>'+
      '<span class="dct-service-card-body">'+
        '<strong class="dct-service-card-title">'+title+'</strong>'+sideRailMarkup+
        '<div class="dct-service-card-description '+(description?'has-copy':'is-empty')+'">'+(description?'<p>'+description+'</p>':'')+'</div>'+
      '</span>'+
    '</button>';
  }

  function currentTemplateServiceState(){
    const groups=activeServiceCategory==='Все'
      ? SERVICE_CATEGORIES.map(cat=>({id:cat,label:cat,services:SERVICE_DATA[cat]||[]}))
      : SERVICE_CATEGORIES.filter(cat=>cat===activeServiceCategory).map(cat=>({id:cat,label:cat,services:SERVICE_DATA[cat]||[]}));

    const total=groups.reduce((sum,group)=>sum+group.services.length,0);
    if(desktopServicesExpanded||total<=SERVICE_PREVIEW_LIMIT){
      return {groups,total,hidden:Math.max(total-SERVICE_PREVIEW_LIMIT,0)};
    }

    let remaining=SERVICE_PREVIEW_LIMIT;
    const visible=groups.map(group=>{
      const services=group.services.slice(0,Math.max(remaining,0));
      remaining-=services.length;
      return {...group,services};
    }).filter(group=>group.services.length>0);

    return {groups:visible,total,hidden:Math.max(total-SERVICE_PREVIEW_LIMIT,0)};
  }

  // Anchor the time column to the first range-priced service (2 h), preserving price alignment.
  function syncDesktopDurationRail(){
    const firstRange=serviceList.querySelector('.dct-service-card.is-price-range .dct-service-card-meta>b.is-price');
    if(!firstRange)return;
    const priceWidth=firstRange.getBoundingClientRect().width;
    if(priceWidth>0)serviceList.style.setProperty('--desktop-aligned-rail-width',Math.ceil(priceWidth+58+12)+'px');
  }

  function renderDesktopServices(){
    // “All” plus up to four real categories share the full available width.
    // Keep the original blurred scrolling rail for five or more real categories.
    const ribbon=serviceTabs.closest('.mct-tabs-ribbon-wrap');
    const compact=DESKTOP_SERVICE_TABS.length<=5;
    ribbon?.classList.toggle('is-compact',compact);
    ribbon?.classList.toggle('is-many',!compact);
    serviceTabs.closest('.mct-tabs')?.classList.toggle('is-many',!compact);
    serviceTabs.style.setProperty('--salon-service-tab-count',String(DESKTOP_SERVICE_TABS.length));
    serviceTabs.innerHTML=DESKTOP_SERVICE_TABS.map(cat=>
      '<button class="mct-tab'+(cat==='Все'?' mct-tab-all':'')+(cat===activeServiceCategory?' is-active':'')+'" type="button" role="tab" aria-selected="'+(cat===activeServiceCategory?'true':'false')+'" data-service-category="'+cat+'">'+cat+'</button>'
    ).join('');

    serviceTabs.querySelectorAll('[data-service-category]').forEach(btn=>btn.onclick=()=>{
      const rail=serviceTabs.closest('.mct-tabs');
      const previousScroll=rail?.scrollLeft||0;
      activeServiceCategory=btn.dataset.serviceCategory;
      desktopServicesExpanded=false;
      desktopMoreAnchorRun++;
      desktopMoreWrap=null;
      unlockServiceScrollAnchor();
      renderDesktopServices();
      if(rail)rail.scrollLeft=previousScroll;
    });

    const state=currentTemplateServiceState();
    serviceList.innerHTML=state.groups.map(group=>{
      const heading=activeServiceCategory==='Все'
        ? '<div class="dct-service-category-heading"><span>'+group.label+'</span><i aria-hidden="true"></i></div>'
        : '';
      return '<section class="dct-service-category">'+heading+'<div class="dct-service-category-list">'+group.services.map(templateServiceCard).join('')+'</div></section>';
    }).join('');

    bindDesktopServiceControls(serviceList);

    serviceMore.hidden=state.total<=SERVICE_PREVIEW_LIMIT;
    serviceMore.classList.toggle('is-open',desktopServicesExpanded);
    serviceMore.setAttribute('aria-expanded',desktopServicesExpanded?'true':'false');

    const copy=desktopServicesExpanded
      ? 'Свернуть услуги'
      : ('Открыть ещё '+state.hidden+' '+desktopServiceWord(state.hidden));
    serviceMoreText.textContent=copy;
    serviceMoreTextMobile.textContent=copy;

    updateDesktopServiceDurations();
    if(desktopServiceLanguageReady){
      translateDesktopTree(serviceTabs,currentDesktopLang);
      translateDesktopTree(serviceList,currentDesktopLang);
      translateDesktopTree(serviceMore,currentDesktopLang);
      serviceList.querySelectorAll('[data-demo-title]').forEach(btn=>btn.setAttribute('aria-label',desktopTrText('Записаться',currentDesktopLang)+': '+desktopTrText(btn.dataset.demoTitle,currentDesktopLang)));
    }
    requestAnimationFrame(()=>{syncDesktopDurationRail();refreshDesktopServiceLayout()});
  }

  function bindDesktopServiceControls(scope){
    scope.querySelectorAll('[data-service-book]').forEach(btn=>btn.onclick=openDesktopBooking);
    scope.querySelectorAll('[data-service-details]').forEach(btn=>btn.onclick=()=>{
      const card=btn.closest('.is-demo-expandable');
      if(!card.classList.contains('is-expanded'))card.style.setProperty('--desktop-side-y',(card.offsetHeight/2)+'px');
      const expanded=card.classList.toggle('is-expanded');
      btn.setAttribute('aria-expanded',String(expanded));
      btn.textContent=expanded?'Свернуть описание':'Подробнее…';
      translateDesktopTree(btn,currentDesktopLang);
      if(!expanded)requestAnimationFrame(refreshDesktopServiceLayout);
    });
  }

  function refreshDesktopServiceDescriptionOverflow(){
    serviceList.querySelectorAll('.is-demo-expandable').forEach(card=>{
      const text=card.querySelector('.dct-service-card-description p');
      const more=card.querySelector('[data-service-details]');
      if(!text||!more)return;
      text.classList.add('is-measuring');
      const lineHeight=parseFloat(getComputedStyle(text).lineHeight)||16;
      const actualHeight=text.getBoundingClientRect().height;
      text.classList.remove('is-measuring');
      const needsMore=actualHeight>lineHeight*2+1.5;
      more.hidden=!needsMore;
      if(!needsMore&&card.classList.contains('is-expanded')){
        card.classList.remove('is-expanded');
        more.setAttribute('aria-expanded','false');
        more.textContent='Подробнее…';
        translateDesktopTree(more,currentDesktopLang);
      }
    });
  }
  function refreshDesktopServiceLayout(){
    refreshDesktopServiceDescriptionOverflow();
    syncDesktopServiceSidePositions();
  }
  function syncDesktopServiceSidePositions(){
    serviceList.querySelectorAll('.is-demo-expandable').forEach(card=>{
      const expanded=card.classList.contains('is-expanded');
      if(expanded)card.classList.remove('is-expanded');
      card.style.setProperty('--desktop-side-y',(card.offsetHeight/2)+'px');
      if(expanded)card.classList.add('is-expanded');
    });
  }
  window.addEventListener('resize',()=>requestAnimationFrame(()=>{syncDesktopDurationRail();refreshDesktopServiceLayout()}),{passive:true});
  window.addEventListener('salon-template:languagechange',()=>requestAnimationFrame(refreshDesktopServiceLayout));
  if(document.fonts&&document.fonts.ready)document.fonts.ready.then(()=>requestAnimationFrame(()=>{syncDesktopDurationRail();refreshDesktopServiceLayout()}));

  /* Append extra cards below the existing eight; never re-render the visible cards or force page scroll. */
  let desktopMoreWrap=null;
  let desktopSavedScrollAnchor=null;
  let desktopMoreAnchorRun=0;
  function stabilizeDesktopMoreButton(anchorTop){
    const delta=serviceMore.getBoundingClientRect().top-anchorTop;
    if(Number.isFinite(delta)&&Math.abs(delta)>.5){
      window.scrollTo({top:Math.max(0,window.scrollY+delta),behavior:'instant'});
    }
  }
  function followDesktopMoreButton(anchorTop,token){
    if(token!==desktopMoreAnchorRun)return;
    stabilizeDesktopMoreButton(anchorTop);
    if(!desktopServicesExpanded&&desktopMoreWrap){
      requestAnimationFrame(()=>followDesktopMoreButton(anchorTop,token));
    }
  }
  function lockServiceScrollAnchor(){
    if(desktopSavedScrollAnchor!==null)return;
    desktopSavedScrollAnchor=document.documentElement.style.overflowAnchor||'';
    document.documentElement.style.overflowAnchor='none';
  }
  function unlockServiceScrollAnchor(){
    if(desktopSavedScrollAnchor===null)return;
    document.documentElement.style.overflowAnchor=desktopSavedScrollAnchor;
    desktopSavedScrollAnchor=null;
  }
  function makeDesktopExtraServices(){
    const groups=activeServiceCategory==='Все'
      ? SERVICE_CATEGORIES.map(cat=>({id:cat,label:cat,services:SERVICE_DATA[cat]||[]}))
      : SERVICE_CATEGORIES.filter(cat=>cat===activeServiceCategory).map(cat=>({id:cat,label:cat,services:SERVICE_DATA[cat]||[]}));
    let shown=SERVICE_PREVIEW_LIMIT;
    const sections=[];
    groups.forEach(group=>{
      const already=Math.min(Math.max(0,shown),group.services.length);
      shown-=already;
      const extra=group.services.slice(already);
      if(!extra.length)return;
      const cards=extra.map(templateServiceCard).join('');
      if(already){
        sections.push('<div class="dct-service-category-list dct-service-extra-cards">'+cards+'</div>');
      }else{
        const heading=activeServiceCategory==='Все'
          ? '<div class="dct-service-category-heading"><span>'+group.label+'</span><i aria-hidden="true"></i></div>'
          : '';
        sections.push('<section class="dct-service-category">'+heading+
          '<div class="dct-service-category-list">'+cards+'</div></section>');
      }
    });
    return sections.join('');
  }
  function paintDesktopMoreButton(){
    serviceMore.classList.toggle('is-open',desktopServicesExpanded);
    serviceMore.setAttribute('aria-expanded',String(desktopServicesExpanded));
    const state=currentTemplateServiceState();
    const copy=desktopServicesExpanded?'Свернуть услуги':
      'Открыть ещё '+state.hidden+' '+desktopServiceWord(state.hidden);
    serviceMoreText.textContent=copy;
    serviceMoreTextMobile.textContent=copy;
    translateDesktopTree(serviceMore,currentDesktopLang);
  }
  serviceMore.onclick=()=>{
    const anchorTop=serviceMore.getBoundingClientRect().top;
    const anchorToken=++desktopMoreAnchorRun;
    lockServiceScrollAnchor();
    const duration=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches?0:400;
    desktopServicesExpanded=!desktopServicesExpanded;
    paintDesktopMoreButton();

    if(desktopServicesExpanded){
      if(!desktopMoreWrap){
        desktopMoreWrap=document.createElement('div');
        desktopMoreWrap.className='dct-service-more-wrap';
        desktopMoreWrap.innerHTML=makeDesktopExtraServices();
        serviceList.appendChild(desktopMoreWrap);
        bindDesktopServiceControls(desktopMoreWrap);
        if(desktopServiceLanguageReady){
          translateDesktopTree(desktopMoreWrap,currentDesktopLang);
          desktopMoreWrap.querySelectorAll('[data-demo-title]').forEach(btn=>
            btn.setAttribute('aria-label',desktopTrText('Записаться',currentDesktopLang)+': '+desktopTrText(btn.dataset.demoTitle,currentDesktopLang)));
        }
      }
      const wrap=desktopMoreWrap;
      wrap.ontransitionend=null;
      wrap.style.transitionDuration=duration+'ms';
      const expandedHeight=wrap.scrollHeight;
      if(!duration){
        wrap.style.height='auto';
        unlockServiceScrollAnchor();
      }else{
        wrap.style.height=wrap.getBoundingClientRect().height+'px';
        wrap.offsetHeight;
        requestAnimationFrame(()=>{
          if(desktopServicesExpanded&&desktopMoreWrap===wrap)wrap.style.height=expandedHeight+'px';
        });
        wrap.ontransitionend=e=>{
          if(e.target===wrap&&e.propertyName==='height'&&desktopServicesExpanded){
            wrap.style.height='auto';
            wrap.ontransitionend=null;
            unlockServiceScrollAnchor();
          }
        };
      }
      requestAnimationFrame(()=>{syncDesktopDurationRail();refreshDesktopServiceLayout()});
    }else if(desktopMoreWrap){
      const wrap=desktopMoreWrap;
      wrap.ontransitionend=null;
      wrap.style.transitionDuration=duration+'ms';
      if(!duration){
        wrap.remove();
        desktopMoreWrap=null;
        stabilizeDesktopMoreButton(anchorTop);
        unlockServiceScrollAnchor();
      }else{
        wrap.style.height=wrap.getBoundingClientRect().height+'px';
        wrap.offsetHeight;
        requestAnimationFrame(()=>{
          if(!desktopServicesExpanded&&desktopMoreWrap===wrap){
            followDesktopMoreButton(anchorTop,anchorToken);
            wrap.style.height='0px';
          }
        });
        wrap.ontransitionend=e=>{
          if(e.target===wrap&&e.propertyName==='height'&&!desktopServicesExpanded){
            wrap.remove();
            desktopMoreWrap=null;
            stabilizeDesktopMoreButton(anchorTop);
            unlockServiceScrollAnchor();
          }
        };
      }
    }
  };
  renderDesktopServices();

  const desktopReviewsViewport=document.getElementById('stdReviewsViewport');
  const desktopReviewsLoop=desktopReviewsViewport?.querySelector('.std-reviews-loop');
  const desktopReviewsFirstSet=desktopReviewsViewport?.querySelector('.std-reviews-set');
  if(desktopReviewsViewport&&desktopReviewsLoop&&desktopReviewsFirstSet){
    desktopReviewsLoop.style.setProperty('animation','none','important');
    desktopReviewsViewport.style.cursor='grab';
    let reviewCycle=0;
    let reviewX=0;
    let reviewLast=performance.now();
    let reviewDragging=false;
    let reviewMoved=false;
    let reviewStartX=0;
    let reviewStartOffset=0;
    let reviewPauseUntil=0;
    let reviewHoverPause=false;
    let reviewIgnoreHoverUntil=0;
    let reviewSuppressClick=false;
    let reviewInView=false;
    let reviewRaf=0;
    if('IntersectionObserver' in window){
      const reviewObserver=new IntersectionObserver(entries=>{
        reviewInView=!!entries[0]?.isIntersecting;
        if(reviewInView)startDesktopReviews();
        else stopDesktopReviews();
      },{rootMargin:'160px 0px',threshold:0});
      reviewObserver.observe(desktopReviewsViewport);
    }else{
      reviewInView=true;
    }

    function measureDesktopReviews(){
      reviewCycle=desktopReviewsFirstSet.getBoundingClientRect().width+16;
      if(reviewCycle>0){
        while(reviewX<=-reviewCycle)reviewX+=reviewCycle;
        while(reviewX>0)reviewX-=reviewCycle;
      }
    }
    function paintDesktopReviews(){
      desktopReviewsLoop.style.setProperty('transform','translate3d('+reviewX+'px,0,0)','important');
    }
    function desktopReviewsFrame(now){
      reviewRaf=0;
      const dt=Math.min(50,now-reviewLast);
      reviewLast=now;
      const hoverBlocked=reviewHoverPause&&Date.now()>=reviewIgnoreHoverUntil;
      if(!document.hidden&&!reviewDragging&&Date.now()>=reviewPauseUntil&&!hoverBlocked&&reviewCycle>0){
        reviewX-=52*dt/1000;
        if(reviewX<=-reviewCycle)reviewX+=reviewCycle;
        paintDesktopReviews();
      }
      if(reviewInView&&!document.hidden)reviewRaf=requestAnimationFrame(desktopReviewsFrame);
    }
    function startDesktopReviews(){
      if(reviewRaf||!reviewInView||document.hidden)return;
      reviewLast=performance.now();
      reviewRaf=requestAnimationFrame(desktopReviewsFrame);
    }
    function stopDesktopReviews(){
      if(!reviewRaf)return;
      cancelAnimationFrame(reviewRaf);
      reviewRaf=0;
    }
    measureDesktopReviews();
    paintDesktopReviews();
    startDesktopReviews();
    document.addEventListener('visibilitychange',()=>{
      if(document.hidden)stopDesktopReviews();
      else startDesktopReviews();
    });
    window.addEventListener('resize',()=>{measureDesktopReviews();paintDesktopReviews()},{passive:true});

    desktopReviewsViewport.addEventListener('pointerenter',()=>{
      if(Date.now()>=reviewIgnoreHoverUntil)reviewHoverPause=true;
    });
    desktopReviewsViewport.addEventListener('pointerleave',()=>{
      reviewHoverPause=false;
      reviewPauseUntil=Date.now()+900;
    });
    desktopReviewsViewport.addEventListener('pointerdown',e=>{
      reviewDragging=true;
      reviewMoved=false;
      reviewStartX=e.clientX;
      reviewStartOffset=reviewX;
      reviewHoverPause=false;
      reviewPauseUntil=Number.POSITIVE_INFINITY;
      desktopReviewsViewport.style.cursor='grabbing';
      try{desktopReviewsViewport.setPointerCapture(e.pointerId)}catch(_){}
    });
    desktopReviewsViewport.addEventListener('pointermove',e=>{
      if(!reviewDragging)return;
      const dx=e.clientX-reviewStartX;
      if(Math.abs(dx)>5)reviewMoved=true;
      reviewX=reviewStartOffset+dx;
      if(reviewCycle>0){
        while(reviewX<=-reviewCycle)reviewX+=reviewCycle;
        while(reviewX>0)reviewX-=reviewCycle;
      }
      paintDesktopReviews();
    });
    function finishDesktopReviewDrag(e){
      if(!reviewDragging)return;
      reviewDragging=false;
      reviewSuppressClick=reviewMoved;
      desktopReviewsViewport.style.cursor='grab';
      reviewPauseUntil=Date.now()+3200;
      reviewIgnoreHoverUntil=Date.now()+3200;
      reviewHoverPause=false;
      try{desktopReviewsViewport.releasePointerCapture(e.pointerId)}catch(_){}
    }
    desktopReviewsViewport.addEventListener('pointerup',finishDesktopReviewDrag);
    desktopReviewsViewport.addEventListener('pointercancel',finishDesktopReviewDrag);
    desktopReviewsViewport.addEventListener('click',e=>{
      if(reviewSuppressClick){
        e.preventDefault();
        e.stopPropagation();
        reviewSuppressClick=false;
      }
    },true);
    desktopReviewsViewport.addEventListener('wheel',e=>{
      const horizontal=Math.abs(e.deltaX)>Math.abs(e.deltaY)&&Math.abs(e.deltaX)>2;
      if(!horizontal)return;
      e.preventDefault();
      const delta=e.deltaX;
      reviewX-=delta;
      if(reviewCycle>0){
        while(reviewX<=-reviewCycle)reviewX+=reviewCycle;
        while(reviewX>0)reviewX-=reviewCycle;
      }
      paintDesktopReviews();
      reviewPauseUntil=Date.now()+2600;
      reviewIgnoreHoverUntil=Date.now()+2600;
      reviewHoverPause=false;
    },{passive:false});
  }

  // Desktop master pages: mobile structure adapted to a wide screen.
  const masterOverlay=document.getElementById('stdMasterOverlay');
  const masterPageContent=document.getElementById('stdMasterPageContent');
  const masterPageClose=document.getElementById('stdMasterPageClose');
  const masterPageBook=document.getElementById('stdMasterPageBook');
  let activeDesktopMaster=null;
  let activeDesktopMasterTab='Профиль';

  function desktopMasterServices(master){
    return (master.cats||[]).flatMap(cat=>(SERVICE_DATA[cat]||[]).map(item=>({cat,item})));
  }
  function desktopMasterAbout(master){
    const map={
      nails:'Маникюр и педикюр. Аккуратная работа и внимание к деталям.',
      hair:'Стрижки, окрашивание, укладки и уход за волосами.',
      cosmetology:'Косметология и профессиональный уход за кожей.',
      brows:'Брови и ресницы — форма, ламинирование и уход.'
    };
    return map[master.id]||'Описание специалиста.';
  }
  function paintDesktopMasterTab(){
    const target=masterPageContent.querySelector('.std-master-tab-content');
    if(!target||!activeDesktopMaster)return;
    const master=activeDesktopMaster;
    const items=desktopMasterServices(master);
    const works=master.work||[];
    if(activeDesktopMasterTab==='Профиль'){
      target.innerHTML='<h3>О мастере</h3><p class="std-master-about-copy">'+desktopMasterAbout(master)+'</p>';
    }else if(activeDesktopMasterTab==='Услуги'){
      target.innerHTML='<section class="std-master-page-block"><h3>Услуги</h3>'+(items.length?items.map(({cat,item})=>'<div class="std-master-page-service"><strong>'+item[0]+'</strong><span>'+cat+'</span></div>').join(''):'<p class="std-master-page-empty">Пока нет данных об услугах.</p>')+'</section>';
    }else if(activeDesktopMasterTab==='Портфолио'){
      target.innerHTML='<section class="std-master-page-block"><h3>Портфолио</h3>'+(works.length?'<div class="std-master-page-works">'+works.map((src,i)=>'<button class="std-master-page-work" type="button" data-master-work="'+i+'"><img src="'+src+'" alt="'+master.name+'" loading="lazy"></button>').join('')+'</div>':'<p class="std-master-page-empty">Пока нет фото.</p>')+'</section>';
      target.querySelectorAll('[data-master-work]').forEach(btn=>btn.onclick=()=>{
        const list=works.map(src=>({src,alt:master.name}));
        openDesktopViewer(list,Number(btn.dataset.masterWork)||0,'gallery');
      });
    }else{
      target.innerHTML='<section class="std-master-page-block"><h3>Отзывы</h3><p class="std-master-page-empty">Пока нет отзывов.</p></section>';
    }
  }
  function paintDesktopMaster(master){
    masterPageContent.innerHTML='<div class="std-master-profile"><div class="std-master-avatar">'+TEAM_AVATAR+'</div><h2>'+master.name+'</h2><p>'+master.role+'</p><div class="std-master-profile-rating"><b>—</b> · Рейтинг не указан</div><div class="std-master-profile-cats">'+(master.cats||[]).map(cat=>'<span>'+cat+'</span>').join('')+'</div></div><div class="std-master-tabs">'+['Профиль','Услуги','Портфолио','Отзывы'].map(tab=>'<button type="button" data-master-tab="'+tab+'" class="'+(tab===activeDesktopMasterTab?'active':'')+'">'+tab+'</button>').join('')+'</div><div class="std-master-tab-content"></div>';
    masterPageContent.querySelectorAll('[data-master-tab]').forEach(btn=>btn.onclick=()=>{
      activeDesktopMasterTab=btn.dataset.masterTab;
      masterPageContent.querySelectorAll('[data-master-tab]').forEach(x=>x.classList.toggle('active',x===btn));
      paintDesktopMasterTab();
    });
    paintDesktopMasterTab();
  }
  function openDesktopMaster(master){
    activeDesktopMaster=master;
    activeDesktopMasterTab='Профиль';
    paintDesktopMaster(master);
    masterOverlay.classList.add('open');
    masterOverlay.scrollTop=0;
    document.body.style.overflow='hidden';
  }
  function closeDesktopMaster(){
    masterOverlay.classList.remove('open');
    activeDesktopMaster=null;
    if(!bookOverlay.classList.contains('open')&&!gallery.classList.contains('open')&&!galleryBrowser.classList.contains('open'))document.body.style.overflow='';
  }
  document.querySelectorAll('[data-desktop-master]').forEach(btn=>btn.addEventListener('click',()=>{
    const master=TEAM_MASTERS.find(item=>item.id===btn.dataset.desktopMaster);
    if(master)openDesktopMaster(master);
  }));
  masterPageClose.addEventListener('click',closeDesktopMaster);
  masterOverlay.addEventListener('click',e=>{if(e.target===masterOverlay)closeDesktopMaster()});
  masterPageBook.addEventListener('click',()=>{closeDesktopMaster();openDesktopBooking()});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&masterOverlay.classList.contains('open'))closeDesktopMaster()});

  const DESKTOP_LANG_STORAGE='salon-template-language';
  const DESKTOP_I18N_ROWS=[
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
    ["Свернуть описание","Փակել նկարագրությունը","Show less"],
    ["5 000–10 000 ֏","5 000–10 000 ֏","5 000–10 000 ֏"],
    ["15 000 ₽","15 000 ₽","15 000 ₽"],
    ["от 6 000 ₽","from 6 000 ₽","from 6 000 ₽"],
    ['Услуги','Ծառայություններ','Services'],['Наши работы','Մեր աշխատանքները','Our work'],['О нас','Մեր մասին','About us'],
    ['Отзывы','Կարծիքներ','Reviews'],['Контакты','Կոնտակտներ','Contacts'],['Салон красоты','Գեղեցկության սրահ','Beauty salon'],
    ['Ваша красота. Ваша уверенность.','Ձեր գեղեցկությունը։ Ձեր վստահությունը։','Your beauty. Your confidence.'],
    ['Салон красоты в самом сердце Города.','Գեղեցկության սրահ Քաղաքի սրտում։','A beauty salon in the heart of City.'],['Листайте вниз','Սահեցրեք ներքև','Scroll down'],['Город,','Քաղաք,','City,'],['Адрес салона','Սրահի հասցե','Адрес салона'],
    ['Записаться','Ամրագրել','Book now'],['Записаться →','Ամրագրել →','Book now →'],['Записаться онлайн','Ամրագրել առցանց','Book online'],['Смотреть работы','Դիտել աշխատանքները','View our work'],
    ['Портфолио','Պորտֆոլիո','Portfolio'],['Вдохновляйтесь реальными результатами наших мастеров и выбирайте свой идеальный образ.','Ոգեշնչվեք մեր մասնագետների իրական աշխատանքներով և ընտրեք ձեր կերպարը։','Explore real results from our specialists and choose your look.'],['Открыть галерею','Բացել պատկերասրահը','Open gallery'],
    ['Открыть галерею','Բացել պատկերասրահը','Open gallery'],['Колесо или двойной клик — увеличить','Մեծացնելու համար օգտագործեք անիվը կամ կրկնակի սեղմումը','Use the wheel or double-click to zoom'],['Галерея','Պատկերասրահ','Gallery'],
    ['Ногти','Եղունգներ','Nails'],['Волосы','Մազեր','Hair'],['Брови и ресницы','Հոնքեր և թարթիչներ','Brows and Lashes'],
    ['Косметология','Կոսմետոլոգիա','Cosmetology'],['Эпиляция','Էպիլյացիա','Hair Removal'],['Макияж','Դիմահարդարում','Makeup'],
    ['Массаж','Մերսում','Massage'],['Другое','Այլ','Other'],['Все','Բոլորը','All'],
    ['Услуги и цены','Ծառայություններ և գներ','Services & prices'],['Выберите услугу','Ընտրեք ծառայությունը','Choose a service'],
    ['Все услуги собраны по направлениям. Выберите подходящую процедуру — запись откроется сразу, без лишних шагов.','Աջ կողմում ընտրեք ուղղությունը, ապա անհրաժեշտ ծառայությունը։ Դրանից հետո կբացվի սրահի հետ կապվելու հարմար տարբերակը։','Choose a category on the right, then select a service. You can then contact the salon in the way that suits you.'],
    ['Как записаться','Ինչպես ամրագրվել','How to book'],['Быстрая запись','Արագ ամրագրում','Quick booking'],['Записаться','Ամրագրել','Book'],['Категория','Բաժին','Category'],['Услуга','Ծառայություն','Service'],['Связь с салоном','Կապ սրահի հետ','Contact the salon'],
    ['Выберите направление и нужную процедуру. Запись открывается в отдельной плашке, а все услуги собраны в одной понятной структуре.','Ընտրեք ուղղությունն ու անհրաժեշտ ծառայությունը։ Բոլոր ծառայությունները հավաքված են մեկ պարզ կառուցվածքում։','Choose a category and service. Everything is organized in one clear structure.'],['Выберите направление и нужную процедуру. Нажмите на услугу, чтобы выбрать удобный способ записи.','Ընտրեք ուղղությունն ու անհրաժեշտ ծառայությունը։ Սեղմեք ծառայության վրա՝ ամրագրման հարմար տարբերակ ընտրելու համար։','Choose a category and service. Select a service to choose a convenient booking method.'],
    ['Свернуть','Փակել ցանկը','Show less'],['Свернуть услуги','Փակել ծառայությունները','Collapse services'],['Открыть ещё','Բացել ևս','Show'],['О салоне','Սրահի մասին','About the salon'],
    ['SALON NAME — салон красоты в городе.','SALON NAME — գեղեցկության սրահ Քաղաքում։','SALON NAME — a beauty salon in City.'],
    ['В основе нашей работы — профессиональный подход, внимание к деталям и уважение к индивидуальности каждого гостя. Мы создаём комфортное пространство, где качество и забота остаются главным приоритетом.','Մեր աշխատանքի հիմքում մասնագիտական մոտեցումն է, ուշադրությունը մանրուքներին և հարգանքը յուրաքանչյուր հյուրի անհատականության նկատմամբ։ Մենք ստեղծում ենք հարմարավետ միջավայր, որտեղ որակն ու հոգատարությունը մնում են գլխավոր առաջնահերթությունները։','Our work is built on professionalism, attention to detail, and respect for every guest’s individuality. We create a comfortable space where quality and care remain our highest priorities.'],
    ['Несколько направлений в одном салоне','Մի քանի ուղղություն մեկ սրահում','Several services in one salon'],
    ['Комфортная атмосфера','Հարմարավետ մթնոլորտ','Comfortable atmosphere'],['Индивидуальный подход','Անհատական մոտեցում','Personal approach'],
    ['Наша команда','Մեր թիմը','Our Team'],['Наша команда','Մեր թիմը','Our Team'],
    ['Нажмите на мастера, чтобы открыть отдельную страницу специалиста.','Ընտրեք մասնագետին՝ նրա էջը բացելու համար։','Select a specialist to open their profile.'],
    ['Нажмите на мастера, чтобы открыть страницу специалиста.','Ընտրեք մասնագետին՝ նրա էջը բացելու համար։','Choose a specialist to open their profile.'],
    ['Информация о мастерах будет добавлена.','Մասնագետների մասին տեղեկությունը կավելացվի։','Specialist information will be added.'],
    ['Nail-мастер','Մատնահարդարման վարպետ','Nail specialist'],['Парикмахер','Վարսահարդար','Hair stylist'],['Косметолог','Կոսմետոլոգ','Cosmetologist'],
    ['Brow & Lash-мастер','Հոնքերի և թարթիչների վարպետ','Brow & lash specialist'],
    ['Маникюр · педикюр','Մատնահարդարում · ոտնահարդարում','Manicure · pedicure'],['Волосы · укладки','Մազեր · հարդարում','Hair · styling'],
    ['Что говорят о нас','Ինչ են ասում մեր մասին','What clients say about us'],['Отзывы клиентов','Հաճախորդների կարծիքներ','Client reviews'],['Подробнее →','Ավելին →','Read more →'],['рейтинг салона','սրահի վարկանիշ','salon rating'],
    ['Смотреть все отзывы →','Դիտել բոլոր կարծիքները →','View all reviews →'],['Ждём вас','Սպասում ենք ձեզ','We look forward to seeing you'],['Город, Адрес салона','Քաղաք, Սրահի հասցե','City, salon address'],
    ['Открыть карту','Բացել քարտեզը','Open map'],
    ['Нажмите, чтобы позвонить','Սեղմեք զանգահարելու համար','Click to call'],['Написать в салон','Գրել սրահին','Message the salon'],
    ['График работы','Աշխատանքային ժամեր','Opening hours'],['Уточняется','Կավելացվի','To be added'],
    ['Цифровой офис для салонов красоты','Թվային գրասենյակ գեղեցկության սրահների համար','Digital office for beauty salons'],['Создано в','Ստեղծված է','Created in'],['Позвонить','Զանգահարել','Call'],['Построить маршрут','Կառուցել երթուղի','Get directions'],['Всё необходимое для комфортного визита','Ամեն ինչ հարմարավետ այցի համար','Everything for a comfortable visit'],['Салон красоты в городе','Գեղեցկության սրահ Քաղաքում','Beauty salon in City'],['Здесь можно спокойно выбрать нужные процедуры и доверить уход мастерам разных направлений. Мы ценим аккуратную работу, комфорт и внимательное отношение к каждому гостю.','Այստեղ կարող եք հանգիստ ընտրել անհրաժեշտ ծառայությունները և վստահել խնամքը տարբեր ուղղությունների մասնագետներին։ Մենք կարևորում ենք ճշգրիտ աշխատանքը, հարմարավետությունն ու յուրաքանչյուր հյուրի նկատմամբ ուշադիր վերաբերմունքը։','Choose the services you need and trust your care to specialists across different beauty fields. We value precise work, comfort, and attentive service for every guest.'],['Волосы, маникюр, брови и ресницы, эпиляция.','Մազեր, մատնահարդարում, հոնքեր և թարթիչներ, էպիլյացիա։','Hair, manicure, brows and lashes, hair removal.'],['Спокойная атмосфера и внимание к каждому гостю.','Հանգիստ մթնոլորտ և ուշադրություն յուրաքանչյուր հյուրի նկատմամբ։','A calm atmosphere and personal attention.'],['Контакты будут добавлены при заполнении шаблона.','Կոնտակտները կավելացվեն ձևանմուշը լրացնելիս։','Contact details will be added when the template is completed.'],['Разные направления','Տարբեր ուղղություններ','Different services'],['Комфорт','Հարմարավետություն','Comfort'],['Прямая запись','Ուղիղ ամրագրում','Direct booking'],
    ['Фотографии работ салона.','Սրահի աշխատանքների լուսանկարները։','Photos of the salon’s work.'],
    ['Запись','Ամրագրում','Booking'],['Как вам удобнее записаться?','Ինչպե՞ս է ձեզ հարմար ամրագրել։','How would you like to book?'],
    ['Выберите удобный способ связи.','Ընտրեք ձեզ հարմար կապի տարբերակը։','Choose the most convenient way to contact us.'],
    ['Телефон','Հեռախոս','Phone'],['Открыть','Բացել','Open'],['Профиль','Պրոֆիլ','Profile'],['О мастере','Մասնագետի մասին','About the specialist'],
    ['Пока нет данных об услугах.','Ծառայությունների մասին տվյալներ դեռ չկան։','No service information yet.'],
    ['Пока нет фото.','Լուսանկարներ դեռ չկան։','No photos yet.'],['Пока нет отзывов.','Կարծիքներ դեռ չկան։','No reviews yet.'],
    ['Маникюр и педикюр. Аккуратная работа и внимание к деталям.','Մատնահարդարում և ոտնահարդարում։ Կոկիկ աշխատանք և ուշադրություն մանրուքներին։','Manicure and pedicure with careful attention to detail.'],
    ['Стрижки, окрашивание, укладки и уход за волосами.','Սանրվածք, ներկում, հարդարում և մազերի խնամք։','Haircuts, coloring, styling and hair care.'],
    ['Косметология и профессиональный уход за кожей.','Կոսմետոլոգիա և մասնագիտական մաշկի խնամք։','Cosmetology and professional skin care.'],
    ['Брови и ресницы — форма, ламинирование и уход.','Հոնքեր և թարթիչներ՝ ձևավորում, լամինացիա և խնամք։','Brows and lashes — shaping, lamination and care.'],
    ['Педикюр','Ոտնահարդարում','Pedicure'],['Наращивание ногтей','Եղունգների երկարացում','Nail extensions'],
    ['Маникюр + покрытие гель-лак','Մատնահարդարում + գել-լաք','Manicure + gel polish'],['Маникюр + покрытие лак','Մատնահարդարում + լաք','Manicure + nail polish'],
    ['Парафинотерапия для рук','Ձեռքերի պարաֆինաթերապիա','Paraffin hand treatment'],['Маникюр','Մատնահարդարում','Manicure'],
    ['Свадебные прически','Հարսանեկան սանրվածքներ','Bridal hairstyles'],['Укладка волос','Մազերի հարդարում','Hair styling'],
    ['Стрижка волос','Մազերի կտրում','Haircut'],['Окрашивание волос','Մազերի ներկում','Hair coloring'],['Уход за волосами','Մազերի խնամք','Hair care'],
    ['Спа-процедура для волос','ՍՊԱ խնամք մազերի համար','Hair spa treatment'],['Косы','Հյուսքեր','Braids'],['Наращивание волос','Մազերի երկարացում','Hair extensions'],
    ['Процедуры для бровей','Հոնքերի խնամքի ծառայություններ','Brow treatments'],['Тридинг бровей','Հոնքերի թրիդինգ','Brow threading'],
    ['Коррекция формы бровей','Հոնքերի ձևի շտկում','Brow shaping'],['Ламинирование бровей','Հոնքերի լամինացիա','Brow lamination'],
    ['Ламинирование ресниц','Թարթիչների լամինացիա','Lash lamination'],['Наращивание ресниц','Թարթիչների երկարացում','Eyelash extensions'],
    ['Карбокси-терапия','Կարբոքսիթերապիա','Carboxytherapy'],['Ультразвуковая чистка лица','Դեմքի ուլտրաձայնային մաքրում','Ultrasonic facial cleansing'],
    ['Удаление волос нитью','Մազահեռացում թելով','Threading hair removal'],['Шугаринг','Շուգարինգ','Sugaring'],
    ['Электроэпиляция игловая','Ասեղային էլեկտրոէպիլյացիա','Needle electrolysis'],['Восковая эпиляция','Մոմային էպիլյացիա','Waxing'],
    ['Прокалывание ушей','Ականջների ծակում','Ear piercing'],
    ['Открыто','Բաց է','Open'],['Закрыто','Փակ է','Closed'],['Уточняется','Կավելացվի','To be added'],['Уточняется','Կավելացվի','To be added'],
    ['График работы','Աշխատանքային ժամեր','Opening hours'],['График работы','Աշխատանքային ժամեր','Opening hours']
  ];
  const desktopLangIndex={ru:0,hy:1,en:2,uz:2,tg:2};
  const desktopDirect={};
  if(window.TANEM_SITE_DATA?.mode==='production')DESKTOP_I18N_ROWS.push(...(window.TANEM_SITE_I18N_ROWS||[]));
  DESKTOP_I18N_ROWS.forEach(row=>desktopDirect[row[0]]=row);

  function desktopDetectLanguage(){
    try{
      const saved=localStorage.getItem(DESKTOP_LANG_STORAGE);
      if(REGION.locales.includes(saved))return saved;
    }catch(_){}
    return REGION.locales.includes('en')?'en':REGION.fallback;
  }
  let currentDesktopLang=desktopDetectLanguage();

  function desktopDynamicTranslation(source,lang){
    const genericService=source.match(/^Услуга (\d+)$/);
    if(genericService)return lang==='hy'?'Ծառայություն '+genericService[1]:lang==='en'?'Service '+genericService[1]:source;
    let m=source.match(/^Показать ещё (\d+) (?:услугу|услуги|услуг)$/);
    if(m)return lang==='hy'?'Ցույց տալ ևս '+m[1]+' ծառայություն':lang==='en'?'Show '+m[1]+' more services':source;
    m=source.match(/^Открыть ещё (\d+) (?:услугу|услуги|услуг)$/);
    if(m)return lang==='hy'?'Բացել ևս '+m[1]+' ծառայություն':lang==='en'?'Show '+m[1]+' more services':source;
    m=source.match(/^Все категории · (\d+) позиций$/);
    if(m)return lang==='hy'?'Բոլոր բաժինները · '+m[1]+' ծառայություն':lang==='en'?'All categories · '+m[1]+' services':source;
    m=source.match(/^(.+) · (\d+) (?:услугу|услуги|услуг)$/);
    if(m){
      const row=desktopDirect[m[1]],cat=row?row[desktopLangIndex[lang]]:m[1];
      return lang==='hy'?cat+' · '+m[2]+' ծառայություն':lang==='en'?cat+' · '+m[2]+' services':source;
    }
    return null;
  }
  function desktopTrText(source,lang=currentDesktopLang){
    const row=desktopDirect[source];
    if(source==='Наша команда')return REGION.teamHeading(lang);
    const special=REGION.ui(source,lang,row?.[2]);
    if(special!==null)return special;
    if(row)return row[desktopLangIndex[lang]];
    const dyn=desktopDynamicTranslation(source,lang);
    return dyn===null?source:dyn;
  }
  function desktopCanTranslate(source){return !!desktopDirect[source]||desktopDynamicTranslation(source,'ru')!==null||!!REGION.ui(source,'uz')||!!REGION.ui(source,'tg')}
  function desktopSkipText(node){
    const el=node.parentElement;
    if(!el)return true;
    if(el.closest('.std-lang-switch,.std-review-text'))return true;
    return /^(SCRIPT|STYLE|NOSCRIPT)$/.test(el.tagName);
  }
  function translateDesktopTree(scope,lang=currentDesktopLang){
    if(!scope)return;
    const walker=document.createTreeWalker(scope,NodeFilter.SHOW_TEXT);
    const nodes=[];
    while(walker.nextNode())nodes.push(walker.currentNode);
    nodes.forEach(node=>{
      if(desktopSkipText(node))return;
      const raw=node.nodeValue||'',trimmed=raw.trim();
      if(!trimmed)return;
      let canonical=node.__desktopI18nCanonical;
      if(!canonical&&desktopCanTranslate(trimmed)){
        canonical=trimmed;
        node.__desktopI18nCanonical=canonical;
      }
      if(!canonical)return;
      const leading=(raw.match(/^\s*/)||[''])[0],trailing=(raw.match(/\s*$/)||[''])[0];
      node.nodeValue=leading+desktopTrText(canonical,lang)+trailing;
    });
  }
  function updateDesktopLangSwitcher(){
    root.querySelectorAll('.std-lang-switch [data-desktop-lang]').forEach(btn=>{
      const active=btn.dataset.desktopLang===currentDesktopLang;
      btn.classList.toggle('active',active);
      btn.setAttribute('aria-pressed',active?'true':'false');
    });
  }
  function applyDesktopLanguage(){
    // Recreate canonical Russian nodes after the Armenian team-role exception.
    root.querySelectorAll('#salonDesktopTeam [data-team-ru-source]').forEach(el=>{
      el.textContent=el.dataset.teamRuSource;
      delete el.dataset.teamRuSource;
    });
    translateDesktopTree(root,currentDesktopLang);
    root.querySelectorAll('[data-demo-title]').forEach(btn=>btn.setAttribute('aria-label',desktopTrText('Записаться',currentDesktopLang)+': '+desktopTrText(btn.dataset.demoTitle,currentDesktopLang)));
    updateDesktopLangSwitcher();
    document.documentElement.lang=currentDesktopLang;
    document.documentElement.dir='ltr';
    document.body.dataset.brLang=currentDesktopLang;
    window.dispatchEvent(new CustomEvent('salon-template:languagechange',{detail:{lang:currentDesktopLang}}));

    if(currentDesktopLang==='hy'&&SITE.mode==='template'){
      // Headings and explanatory text use their ordinary HY translation; only specialties remain in English.
      const teamEnglish={
        nails:{name:'Nail Master',role:'Manicure · Pedicure',cat:'Nails'},
        hair:{name:'Hairdresser',role:'Hair · Styling',cat:'Hair'},
        cosmetology:{name:'Cosmetologist',role:'Cosmetology',cat:'Cosmetology'},
        brows:{name:'Brow & Lash Master',role:'Brows · Lashes',cat:'Brows & Lashes'}
      };
      root.querySelectorAll('#salonDesktopTeam [data-desktop-master]').forEach(card=>{
        const data=teamEnglish[card.dataset.desktopMaster];
        if(!data)return;
        const name=card.querySelector('.std-master-name'),role=card.querySelector('.std-master-role'),cat=card.querySelector('.std-master-cat');
        [[name,data.name],[role,data.role],[cat,data.cat]].forEach(([el,translated])=>{
          if(!el)return;
          el.dataset.teamRuSource=el.firstChild?.__desktopI18nCanonical||el.textContent;
          el.textContent=translated;
        });
      });
    }

    const titles={ru:'SALON NAME — Город',hy:'SALON NAME — Քաղաք',en:'SALON NAME — City'};
    const productionSite=window.TANEM_SITE_DATA?.mode==='production'?window.TANEM_SITE_DATA:null;
    if(productionSite){
      const localized=(value)=>typeof value==='string'?value:(value?.[currentDesktopLang]||value?.ru||'');
      const name=localized(productionSite.salon?.name),city=localized(productionSite.salon?.city);
      document.title=name+(city?' — '+city:'');
    }else document.title=titles[currentDesktopLang]||titles.hy;
  }
  root.querySelectorAll('.std-lang-switch [data-desktop-lang]').forEach(btn=>btn.addEventListener('click',()=>{
    currentDesktopLang=btn.dataset.desktopLang;
    try{localStorage.setItem(DESKTOP_LANG_STORAGE,currentDesktopLang)}catch(_){}
    applyDesktopLanguage();
  }));
  const desktopLangObserver=new MutationObserver(records=>{
    records.forEach(record=>record.addedNodes.forEach(node=>{
      if(node.nodeType===Node.TEXT_NODE)translateDesktopTree(node.parentElement,currentDesktopLang);
      else if(node.nodeType===Node.ELEMENT_NODE)translateDesktopTree(node,currentDesktopLang);
    }));
  });
  desktopLangObserver.observe(root,{childList:true,subtree:true});
  applyDesktopLanguage();
  desktopServiceLanguageReady=true;

  const revealSections=[...root.querySelectorAll('.std-portfolio,.mct-prices,.mct-about,.std-reviews,.std-contact')];
  revealSections.forEach(el=>el.classList.add('std-section-reveal'));
  if('IntersectionObserver' in window){
    const revealObserver=new IntersectionObserver(entries=>{
      entries.forEach(entry=>{
        if(entry.isIntersecting){
          entry.target.classList.add('in-view','is-visible');
          if(entry.target.id==='salonDesktopAbout')entry.target.querySelector('#salonDesktopTeam')?.classList.add('in-view','is-visible');
          revealObserver.unobserve(entry.target);
        }
      });
    },{threshold:.09,rootMargin:'0px 0px -5% 0px'});
    revealSections.forEach(el=>revealObserver.observe(el));
  }else{
    revealSections.forEach(el=>{
      el.classList.add('in-view','is-visible');
      if(el.id==='salonDesktopAbout')el.querySelector('#salonDesktopTeam')?.classList.add('in-view','is-visible');
    });
  }

  function updateStatus(){
    const main=document.getElementById('stdStatusMain'),sub=document.getElementById('stdStatusSub');
    if(main){main.textContent='График';main.className='std-status-main';main.style.color=''}
    if(sub)sub.textContent='Уточняется';
    const stickyStatus=document.getElementById('stdStickyServiceStatus'),stickyStatusSub=document.getElementById('stdStickyServiceStatusSub'),stickyCard=document.getElementById('stdStickyServiceCard');
    if(stickyStatus)stickyStatus.textContent='График';
    if(stickyStatusSub)stickyStatusSub.textContent='Уточняется';
    if(stickyCard)stickyCard.classList.remove('is-open','is-closed');
    const contactStatus=document.getElementById('stdContactStatus'),contactStatusText=document.getElementById('stdContactStatusText');
    if(contactStatus)contactStatus.classList.remove('open','closed');
    if(contactStatusText)contactStatusText.textContent='График работы';
  }
  updateStatus();
})();
