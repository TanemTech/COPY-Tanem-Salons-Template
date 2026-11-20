'use strict';

const fs=require('node:fs');
const path=require('node:path');

const templateImages=new Set(['favicon-source.png','logo-placeholder.svg','media-placeholder.svg']);
const imageExtensions=new Set(['.webp','.jpg','.jpeg','.png','.avif','.gif','.svg','.heic','.heif']);

function isFile(file){
  try{return fs.lstatSync(file).isFile()}catch(error){
    if(error.code==='ENOENT'||error.code==='ENOTDIR')return false;
    throw error;
  }
}

function listImages(dir){
  try{
    if(!fs.lstatSync(dir).isDirectory())return [];
    return fs.readdirSync(dir,{withFileTypes:true})
      .filter(entry=>entry.isFile()&&imageExtensions.has(path.extname(entry.name).toLowerCase()))
      .map(entry=>entry.name)
      .sort((a,b)=>a.localeCompare(b,'en',{numeric:true})||(a<b?-1:a>b?1:0));
  }catch(error){
    if(error.code==='ENOENT'||error.code==='ENOTDIR')return [];
    throw error;
  }
}

function metadataPath(value){
  const src=typeof value==='string'?value:value?.file??value?.src??value?.path;
  if(typeof src!=='string')return null;
  const normalized=src.trim().replaceAll('\\','/').replace(/^\.\//,'');
  // Look up names only inside the selected snapshot. Never open a path from JSON.
  const local=normalized.replace(/^assets\//,'');
  return local&&local!=='.'&&local!=='..'&&!local.includes('/')&&imageExtensions.has(path.extname(local).toLowerCase())?local:null;
}

function inventory(root,location='auto'){
  if(!['auto','root','intake/yandex'].includes(location))throw new Error('Input must be auto, root, or intake/yandex');
  const rootJson=path.join(root,'business.json');
  const intakeJson=path.join(root,'intake/yandex/business.json');
  const choices=[['root',rootJson],['intake/yandex',intakeJson]].filter(([,file])=>isFile(file));
  const source=location==='auto'?choices[0]:choices.find(([kind])=>kind===location);
  if(!source)throw new Error('No business.json in the selected source');
  const [kind,json]=source;
  let data;
  try{data=JSON.parse(fs.readFileSync(json,'utf8').replace(/^\uFEFF/,''))}catch(error){
    throw new Error('Cannot read business.json: '+error.message);
  }
  if(!data||typeof data!=='object'||Array.isArray(data))throw new Error('business.json must contain an object');

  const sourceDir=path.dirname(json);
  const assetsDir=path.join(sourceDir,'assets');
  const hasAssets=fs.existsSync(assetsDir)&&fs.lstatSync(assetsDir).isDirectory();
  const imageDir=hasAssets?assetsDir:sourceDir;
  const images=listImages(imageDir).filter(name=>!templateImages.has(name.toLowerCase()));
  const present=new Set(images);
  const relative=file=>path.relative(root,file).split(path.sep).join('/');
  const fullPath=name=>relative(path.join(imageDir,name));
  const metadata=new Map();
  function add(value,role,categories=[]){
    const name=metadataPath(value);
    if(!name)return;
    const row=metadata.get(name)||{roles:new Set(),categories:new Set()};
    if(role)row.roles.add(role);
    for(const category of Array.isArray(categories)?categories:[]){
      if(typeof category==='string'&&category.trim())row.categories.add(category.trim());
    }
    metadata.set(name,row);
  }
  const site=data.site_images??{};
  const gallery=Array.isArray(site.gallery)?site.gallery:[];
  add(site.hero,'hero');
  add(site.profile,'about');
  add(site.logo,'logo');
  gallery.forEach(photo=>add(photo,'gallery'));
  if(Array.isArray(site.team))site.team.forEach(photo=>add(photo,'team'));
  if(Array.isArray(data.photos))data.photos.forEach(photo=>add(photo,photo?.role==='profile'?'about':photo?.role,photo?.categories));

  const photos=images.map(name=>{
    const row=metadata.get(name);
    return {file:fullPath(name),roles:[...(row?.roles??[])],categories:[...(row?.categories??[])]};
  });
  const namedGallery=[...metadata].filter(([,row])=>row.roles.has('gallery')).map(([name])=>name);
  const alternate=choices.find(([candidate])=>candidate!==kind);
  return {
    input:relative(json),
    alternateInput:alternate?relative(alternate[1]):null,
    imageDir:relative(imageDir)||'.',
    requestedPhotoLimit:Number.isInteger(data.requested_photo_limit)?data.requested_photo_limit:null,
    gallery:{listed:namedGallery.length,found:namedGallery.filter(name=>present.has(name)).length},
    missing:[...metadata.keys()].filter(name=>!present.has(name)).map(fullPath),
    unlisted:photos.filter(photo=>!metadata.has(path.basename(photo.file))).map(photo=>photo.file),
    photos
  };
}

if(require.main===module){
  try{
    const [root='.',location='auto']=process.argv.slice(2);
    process.stdout.write(JSON.stringify(inventory(path.resolve(root),location),null,2)+'\n');
  }catch(error){
    console.error(error.message);
    process.exitCode=1;
  }
}

module.exports={inventory};
