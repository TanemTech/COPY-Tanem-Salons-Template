// Regression guard for the approved TANEM services template.
// Run from repository root: node tests/check-template-regression.cjs
function verifyTemplate(){
  const fs=require("node:fs"),assert=require("node:assert/strict"),cp=require("node:child_process");
  const {retiredClasses,retiredIds,selectorUsesRetiredHook,atRuleUsesRetiredHook}=require("../scripts/style-cleanup-config.cjs");
  const baseline="79ea1c63864627b634528c6c6f39c997226f85c4";
  const paths=["desktop.js","mobile.js"];
  const runtimeSource=["index.html","desktop.js","mobile.js","site-runtime.js","site-regions.js"].map(name=>fs.readFileSync(name,"utf8")).join("\n");
  for(const hook of [...retiredClasses,...retiredIds])assert(!runtimeSource.includes(hook),"Retired style hook is active again: "+hook);
  function styles(src){
    const rx=/\.textContent\s*=\s*(String\.raw)?([`"])/g;let m,res=[];
    while((m=rx.exec(src))){
      const q=m[2],start=rx.lastIndex;let i=start,escaped=false;
      for(;i<src.length;i++){const c=src[i];if(escaped){escaped=false;continue}if(c==="\\"){escaped=true;continue}if(c===q)break}
      assert(i<src.length,"Unterminated CSS literal");
      const literal=src.slice(start,i);let css=null;
      if(m[1]||q==="`")css=literal;
      else try{css=JSON.parse('"'+literal+'"')}catch{}
      if(css&&css.length>100&&/^\s*(?:@media|#|\.|:root)/.test(css))res.push(css);
      rx.lastIndex=i+1;
    }
    return res;
  }
  function effectiveRules(css){
    function selectors(header){
      const result=[];let start=0,round=0,square=0,quote="";
      for(let i=0;i<header.length;i++){
        const char=header[i];
        if(quote){if(char==="\\")i++;else if(char===quote)quote="";continue}
        if(char==='"'||char==="'"){quote=char;continue}
        if(char==="(")round++;else if(char===")")round--;
        else if(char==="[")square++;else if(char==="]")square--;
        else if(char===","&&round===0&&square===0){result.push(header.slice(start,i).trim());start=i+1}
      }
      result.push(header.slice(start).trim());
      return result.filter(Boolean);
    }
    const stack=[],result=new Map();let last=0;
    for(let i=0;i<css.length;i++){
      if(css[i]==="{"){
        const header=css.slice(last,i).replace(/\/\*[\s\S]*?\*\//g,"").trim();
        if(stack.length)stack[stack.length-1].nested=true;
        stack.push({header,parents:stack.map(x=>x.header),open:i,nested:false});last=i+1;
      }else if(css[i]==="}"){
        const r=stack.pop();assert(r,"Unbalanced CSS }");
        if(!r.nested)for(const header of selectors(r.header))for(const d of css.slice(r.open+1,i).split(";").map(x=>x.trim()).filter(Boolean)){
          const sep=d.indexOf(":");if(sep>=0)result.set(JSON.stringify([r.parents,header,d.slice(0,sep).trim()]),d.slice(sep+1).trim());
        }
        last=i+1;
      }
    }
    assert.equal(stack.length,0,"Unbalanced CSS {");
    return [...result.entries()].sort((a,b)=>a[0].localeCompare(b[0]));
  }
  for(const name of paths){
    const current=fs.readFileSync(name,"utf8");
    const original=cp.execFileSync("git",["show",baseline+":"+name],{encoding:"utf8",maxBuffer:2000000});
    cp.execFileSync(process.execPath,["--check",name]);
    const oldCSS=styles(original);
    const extractedPath=name==="desktop.js"?"desktop.css":"mobile.css";
    const external=fs.existsSync(extractedPath)?fs.readFileSync(extractedPath,"utf8"):null;
    const mobileFinal=name==="mobile.js"&&fs.existsSync("mobile-overrides.css")?fs.readFileSync("mobile-overrides.css","utf8"):null;
    const newCSS=external?(mobileFinal?[external,mobileFinal]:[external]):styles(current);
    assert(newCSS.length>0,name+": no stylesheets found");
    // Compare the final cascade over *all* stylesheets. Earlier duplicate declarations may
    // be removed when a later stylesheet guarantees precisely the same final property.
    // Each stylesheet must still be present in its original position.
    const allDeclarations=blocks=>{
      const cascade=new Map();
      for(const block of blocks)for(const [key,value] of effectiveRules(block))cascade.set(key,value);
      return [...cascade.entries()].sort((a,b)=>a[0].localeCompare(b[0]));
    };
    // Preserve all frozen service card/price CSS. The owner has explicitly
    // approved Esmeralda-style naturally sized, scrollable MOBILE CATEGORY
    // tabs, so only those category-rail selectors may differ from baseline.
    // Service card titles, time/price rails and the desktop cascade remain
    // protected by the comparison below.
    const keepFrozenDeclaration=([key])=>{
      const [parents,selector,property]=JSON.parse(key);
      // Explicitly retired hooks belonged to markup removed before the factory
      // release. All still-reachable selectors remain byte-for-byte protected.
      if(selectorUsesRetiredHook(selector)||parents.some(atRuleUsesRetiredHook))return false;
      if(selector.includes(".is-compact"))return false;
      // 03.10.2026 owner-approved deltas. Keep the exception surface limited
      // to the exact UI families changed in the new salon contract.
      if(name==="mobile.js"){
        const approvedMobile=[
          /^#salon-mobile #tn13Top \.tn22-(?:top|brand|brand img|title|title\.is-single-line|sub)$/,
          /^#salon-mobile #tn13Gallery(?:\.(?:open|closing))?(?:$| \.tn22-gallery-(?:tabs-wrap|tabs|tab|tabs::-[\w-]+|rail-hint|rail-hint\.visible|rail-hint\.left|rail-hint\.right))/,
          /^#salon-mobile \.tn22-(?:view-gallery|view-gallery:active|viewer-count|navbtn)$/,
          /^#salon-mobile #tn13Services(?:$| \.tn31-(?:cats|cat|cats\.is-two|cats\.is-two \.tn31-cat|service-row|service-row\.tn31-service-demo|service-side|service-more-wrap))/,
          /^#salon-mobile #tn13Team \.tn22-master-card\.is-placeholder$/,
          /^#salon-mobile #tn13Visit \.tn22-visit-actions\.is-single$/
        ];
        if(approvedMobile.some(rx=>rx.test(selector)))return false;
      }
      if(name==="desktop.js"){
        const approvedDesktop=[
          /^#salon-desktop-v1 \.std-(?:header-brand-main|view-gallery|gallery-count)$/,
          /^#salonDesktopServices \.mct-tab$/,
          /^#salonDesktopServices \.dct-service-card:not\(\.has-variants\) \.dct-service-card-title$/,
          /^#salonDesktopServices \.dct-service-card:not\(\.has-variants\) \.dct-service-side-rail$/,
          /^#salonDesktopServices \.dct-service-(?:card-meta>b\.is-price|card-variant-meta>b\.is-price)$/,
          /^#salonDesktopTeam \.std-master\.is-placeholder$/,
          /^#salonDesktopContacts \.std-contact-actions\.is-single$/
        ];
        if(approvedDesktop.some(rx=>rx.test(selector)))return false;
      }
      if(name==="mobile.js"&&/^#salon-mobile #tn13Services \.tn31-cat(?:s)?(?:::[\w-]+)?$/.test(selector))return false;
      if(property==="font-weight"&&selector.includes("#salonDesktopServices .dct-service-card:not(.has-variants) .dct-service-card-title"))return false;
      if(property==="font-weight"&&selector.includes("#salon-mobile #tn13Services .tn31-service-name"))return false;
      return true;
    };
    const currentAllDeclarations=allDeclarations(newCSS);
    assert(!currentAllDeclarations.some(([key])=>{
      const [parents,selector]=JSON.parse(key);
      return selectorUsesRetiredHook(selector)||parents.some(atRuleUsesRetiredHook);
    }),name+": retired CSS hook was reintroduced");
    const currentDeclarations=currentAllDeclarations.filter(keepFrozenDeclaration);
    const baselineDeclarations=allDeclarations(oldCSS).filter(keepFrozenDeclaration);
    assert.deepEqual(currentDeclarations,baselineDeclarations,name+": approved CSS cascade differs from baseline outside intentional category and title-weight changes");
    const boundaries=name==="desktop.js"?["function templateServiceCard(item){","function currentTemplateServiceState()"]:["function servicePriceMarkup(price){","function serviceWord(n){"];
    const code=s=>{
      const a=s.indexOf(boundaries[0]),b=s.indexOf(boundaries[1],a+boundaries[0].length);
      assert(a>=0&&b>a,name+": approved service markup not found");
      return s.slice(a,b);
    };
    assert.equal(code(current),code(original),name+": approved service markup or logic changed");
    console.log(name+": JS syntax, approved services and "+oldCSS.length+" stylesheets retain the approved combined cascade");
  }
  const index=fs.readFileSync("index.html","utf8");
  assert(index.includes("desktop.js")&&index.includes("mobile.js"),"Both device bundles must still load");
  cp.execFileSync(process.execPath,["scripts/prune-dead-css.cjs","--check"],{stdio:"inherit"});
  console.log("PASS: All static baseline and service-contract checks");
}
verifyTemplate();
