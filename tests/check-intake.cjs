'use strict';

const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const {inventory}=require('../scripts/check-intake.cjs');

const root=fs.mkdtempSync(path.join(os.tmpdir(),'tanem-intake-'));
try{
  const write=(relative,content='image fixture')=>{
    const file=path.join(root,relative);
    fs.mkdirSync(path.dirname(file),{recursive:true});
    fs.writeFileSync(file,content);
  };
  write('business.json',JSON.stringify({
    requested_photo_limit:80,
    site_images:{hero:'assets/Hero.webp',gallery:['assets/Gallery-01.webp','assets/Gallery-02.webp','assets/Gallery-04.webp']},
    photos:[{file:'Gallery-04.webp',role:'gallery',categories:['Ногти']}]
  }));
  write('assets/Hero.webp');
  write('assets/Gallery-01.webp');
  write('assets/Gallery-04.webp');
  write('assets/Работы.webp');
  write('gallery-02.webp');
  write('intake/yandex/business.json',JSON.stringify({site_images:{gallery:['assets/Gallery-10.webp']}}));
  write('intake/yandex/assets/Gallery-10.webp');
  const report=inventory(root);
  assert.deepEqual(report.gallery,{listed:3,found:2});
  assert.equal(report.requestedPhotoLimit,80);
  assert.deepEqual(report.missing,['assets/Gallery-02.webp']);
  assert.deepEqual(report.unlisted,['assets/Работы.webp']);
  assert.deepEqual(report.photos.find(photo=>photo.file==='assets/Gallery-04.webp').categories,['Ногти']);
  assert.equal(report.alternateInput,'intake/yandex/business.json');
  assert.deepEqual(inventory(root,'intake/yandex').gallery,{listed:1,found:1});
}finally{
  fs.rmSync(root,{recursive:true,force:true});
}
console.log('PASS: intake uses the actual assets, reports skipped files, and isolates competing exports');
