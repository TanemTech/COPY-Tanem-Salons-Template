'use strict';

const fs=require('node:fs');
const path=require('node:path');
const {selectorUsesRetiredHook,atRuleUsesRetiredHook}=require('./style-cleanup-config.cjs');

const files=['desktop.css','mobile.css','mobile-overrides.css','salon-palette.css'];

function matchingBrace(source,open){
  let depth=1,quote='',comment=false;
  for(let i=open+1;i<source.length;i++){
    const char=source[i],next=source[i+1];
    if(comment){if(char==='*'&&next==='/'){comment=false;i++}continue}
    if(quote){if(char==='\\'){i++;continue}if(char===quote)quote='';continue}
    if(char==='/'&&next==='*'){comment=true;i++;continue}
    if(char==='"'||char==="'"){quote=char;continue}
    if(char==='{')depth++;
    else if(char==='}'&&--depth===0)return i;
  }
  throw new Error('Unbalanced CSS block');
}

function nextOpenBrace(source,start){
  let quote='',comment=false,round=0,square=0;
  for(let i=start;i<source.length;i++){
    const char=source[i],next=source[i+1];
    if(comment){if(char==='*'&&next==='/'){comment=false;i++}continue}
    if(quote){if(char==='\\'){i++;continue}if(char===quote)quote='';continue}
    if(char==='/'&&next==='*'){comment=true;i++;continue}
    if(char==='"'||char==="'"){quote=char;continue}
    if(char==='(')round++;else if(char===')')round--;
    else if(char==='[')square++;else if(char===']')square--;
    else if(char==='{'&&round===0&&square===0)return i;
  }
  return -1;
}

function splitLeadingTrivia(segment){
  let i=0;
  while(i<segment.length){
    if(/\s/.test(segment[i])){i++;continue}
    if(segment[i]==='/'&&segment[i+1]==='*'){
      const end=segment.indexOf('*/',i+2);
      if(end<0)break;
      i=end+2;
      continue;
    }
    break;
  }
  return [segment.slice(0,i),segment.slice(i).trim()];
}

function splitSelectors(header){
  const parts=[];let start=0,quote='',round=0,square=0;
  for(let i=0;i<header.length;i++){
    const char=header[i];
    if(quote){if(char==='\\'){i++;continue}if(char===quote)quote='';continue}
    if(char==='"'||char==="'"){quote=char;continue}
    if(char==='(')round++;else if(char===')')round--;
    else if(char==='[')square++;else if(char===']')square--;
    else if(char===','&&round===0&&square===0){parts.push(header.slice(start,i).trim());start=i+1}
  }
  parts.push(header.slice(start).trim());
  return parts.filter(Boolean);
}

function pruneContainer(source){
  let cursor=0,result='';
  while(cursor<source.length){
    const open=nextOpenBrace(source,cursor);
    if(open<0){result+=source.slice(cursor);break}
    const close=matchingBrace(source,open);
    const [leading,header]=splitLeadingTrivia(source.slice(cursor,open));
    const body=source.slice(open+1,close);
    if(!header){result+=source.slice(cursor,close+1);cursor=close+1;continue}
    if(/^@(media|supports|container|layer|document)\b/i.test(header)){
      const prunedBody=pruneContainer(body);
      if(prunedBody.replace(/\s|\/\*[\s\S]*?\*\//g,''))result+=leading+header+'{'+prunedBody+'}';
    }else if(atRuleUsesRetiredHook(header)){
      // The selector that referenced this animation was retired with its old UI.
    }else if(/^@/i.test(header)){
      result+=leading+header+'{'+body+'}';
    }else{
      const selectors=splitSelectors(header).filter(selector=>!selectorUsesRetiredHook(selector));
      if(selectors.length)result+=leading+selectors.join(',')+'{'+body+'}';
    }
    cursor=close+1;
  }
  return result;
}

let changed=false;
for(const relative of files){
  const filename=path.resolve(relative);
  const before=fs.readFileSync(filename,'utf8');
  const after=pruneContainer(before);
  if(after!==before){
    changed=true;
    if(process.argv.includes('--check')){
      console.error(`${relative}: retired selectors remain`);
    }else{
      fs.writeFileSync(filename,after);
      console.log(`${relative}: ${Buffer.byteLength(before)} -> ${Buffer.byteLength(after)} bytes`);
    }
  }else console.log(`${relative}: clean`);
}

if(process.argv.includes('--check')&&changed)process.exitCode=1;
