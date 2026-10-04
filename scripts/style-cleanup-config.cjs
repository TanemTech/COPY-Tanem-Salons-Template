'use strict';

// Hooks from designs that were removed before the TANEM factory release.
// None of these classes/ids is created by the current desktop/mobile/runtime
// bundles. Keeping the list explicit lets regression tests continue protecting
// every selector that can still affect the approved interface.
const retiredClasses=new Set([
  'booking-island',
  'std-header-brand-sub','std-hero-kicker','std-logo-sub',
  'std-services-inner','std-services-divider','std-services-left','std-services-right',
  'std-services-title','std-price-wrap','std-price-card','std-price-count',
  'std-price-arrow','std-price-prev','std-price-next','std-price-dots','std-price-dot',
  'std-price-open','std-service-tabs','std-service-tab','std-service-list',
  'std-service-row','std-service-head','std-service-name','std-service-price',
  'std-service-detail','std-service-variants','std-service-variant','std-service-note',
  'std-service-more','std-services-count','std-price-viewer-stage','std-price-viewer-img',
  'std-price-viewer-close','std-price-viewer-nav','std-price-viewer-prev',
  'std-price-viewer-next','std-price-viewer-count','std-about','std-about-inner',
  'std-about-kicker','std-about-grid','std-about-visual','std-about-rating',
  'std-about-rating-star','std-about-copy','std-about-lead','std-about-text',
  'std-about-facts','std-about-fact','std-team-inner','std-team-title',
  'std-team-window','std-team-hint','std-contact-brand-icon','std-contact-brand-mark',
  'std-contact-brand-text','std-services-head-ref','std-price-hidden',
  'std-service-category-ref','std-service-category-heading-ref','std-service-grid-ref',
  'std-service-card-ref','std-service-card-title-ref','std-service-card-bottom-ref',
  'std-master-arrow','std-master-page-grid','std-about-title','std-services-intro',
  'std-service-card-detail-ref','std-service-all-grid','std-service-all-row',
  'std-service-all-title','std-service-all-cat','std-service-all-action',
  'mct-section-kicker','mct-about-head','mct-about-monogram','mct-about-list',
  'dct-about-amenities-head','dct-service-sticky-kicker','dct-services-right-head',
  'dct-service-sticky-benefits',

  'tn13-display','tn13-intro','tn13-intro-inner','tn13-intro-name','tn13-intro-line',
  'tn13-intro-small','tn13-topbar','tn13-brand','tn13-menu-wrap','tn13-menu-btn',
  'tn13-menu','tn13-hero-content','tn13-ticker','tn13-ticker-track','tn13-hero-copy',
  'tn13-visual','tn13-visual-main','tn13-visual-small','tn13-visual-label',
  'tn13-hero-bottom','tn13-hero-actions','tn13-main-cta','tn13-quiet-link',
  'tn13-stats','tn13-stat','tn13-section-head','tn13-section-note','tn13-reveal',
  'tn13-feature','tn13-work-grid','tn13-gallery-btn','tn13-tabs','tn13-tab',
  'tn13-service-list','tn13-service-row','tn13-service-name','tn13-service-action',
  'tn13-more','tn13-team-grid','tn13-master','tn13-master-monogram','tn13-master-arrow',
  'tn13-review-summary','tn13-review-viewport','tn13-review-track','tn13-review-card',
  'tn13-review-stars','tn13-final-copy','tn13-final-actions','tn13-final-cta',
  'tn13-final-secondary-row','tn13-final-secondary','tn13-final-facts','tn13-map',
  'tn13-gallery-head','tn13-back','tn13-gallery-title','tn13-gallery-sub',
  'tn13-gallery-tabs','tn13-gallery-list','tn13-master-hero','tn13-master-big',
  'tn13-master-title','tn13-master-sub','tn13-master-about','tn13-master-services',
  'tn13-master-service','tn13-sheet-cta','tn22-orn','tn22-services','tn22-reviews',
  'tn31-service-book','tn22-team-all','tn50-brand-svg','tn22-team-panel','tn22-handle',
  'tn22-team-list','tn22-team-row','tn22-team-mini','br-review-date','tn23-viewer-label'
]);

const retiredIds=new Set(['tn13Intro']);
const retiredKeyframes=new Set(['tn13Intro','tn13Menu','tn13Ticker','tn13Reviews','tn22Sheet']);

function selectorUsesRetiredHook(selector){
  for(const name of retiredClasses){
    if(new RegExp('\\.'+name.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'(?![\\w-])').test(selector))return true;
  }
  for(const name of retiredIds){
    if(new RegExp('#'+name.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'(?![\\w-])').test(selector))return true;
  }
  return false;
}

function atRuleUsesRetiredHook(rule){
  const match=String(rule).match(/^@(?:-webkit-)?keyframes\s+([\w-]+)/i);
  return !!match&&retiredKeyframes.has(match[1]);
}

module.exports={retiredClasses,retiredIds,retiredKeyframes,selectorUsesRetiredHook,atRuleUsesRetiredHook};
