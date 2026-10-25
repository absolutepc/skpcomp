// Exercise the real dev server: multipart uploads used to hit Vinext's 1 MiB
// server-action limit before reaching the media route. Run from the repo root.
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
const origin='http://127.0.0.1:5184';
const child=spawn(process.execPath,['scripts/run-framework.mjs','dev','--port','5184'],{stdio:['ignore','pipe','pipe']});
let logs='';
child.stdout.on('data',data=>{logs+=data});
child.stderr.on('data',data=>{logs+=data});
try{
 let ready=false;
 for(let attempt=0;attempt<120;attempt++){
  if(child.exitCode!==null)throw Error('Dev server exited: '+logs);
  try{await fetch(origin+'/api/media');ready=true;break}catch{}
  await new Promise(resolve=>setTimeout(resolve,500));
 }
 assert(ready,'Dev server failed to start: '+logs);
 for(const size of [512*1024,2*1024*1024,8*1024*1024,8*1024*1024+1]){
  // Signature-valid transport fixture; image decoding is tested by test-gallery.
  const bytes=new Uint8Array(size);bytes.set([137,80,78,71,13,10,26,10]);
  const form=new FormData();
  form.append('productId','upload-regression');
  form.append('file',new Blob([bytes],{type:'image/png'}),'skp-product-image.png');
  const response=await fetch(origin+'/api/media',{method:'POST',headers:{Origin:origin},body:form});
  const result=await response.json();
  if(size>8*1024*1024){assert.equal(response.status,400);assert(result.error);continue}
  assert.equal(response.status,201,JSON.stringify(result));
  assert.equal(result.size,size);
  const saved=await fetch(origin+result.url);
  assert.equal(saved.status,200);
  assert.equal(saved.headers.get('content-type'),'image/png');
  assert.deepEqual(new Uint8Array(await saved.arrayBuffer()),bytes);
 }
 console.log('Media integration: 512 KiB, 2 MiB and 8 MiB uploads/readback passed; oversized file rejected.');
}catch(error){console.error(logs);throw error}
finally{child.kill('SIGTERM')}
