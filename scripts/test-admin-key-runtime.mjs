import assert from 'node:assert/strict';
import QRCode from 'qrcode';
import {decodeQrPixels} from '../lib/admin-key-decoder.ts';
import {trustedQrDestination} from '../lib/admin-key-qr.ts';
const origin='https://skpcomp.vercel.app';
const token='a'.repeat(64);
const url=origin+'/admin/qr/approve?request='+token;
const matrix=QRCode.create(url,{errorCorrectionLevel:'M'}).modules;
for(const inverted of [false,true])for(const rotated of [false,true]){
 const scale=5,margin=4,size=(matrix.size+margin*2)*scale;
 const rgba=new Uint8ClampedArray(size*size*4);
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){
  const row=Math.floor(y/scale)-margin,col=Math.floor(x/scale)-margin;
  const dark=row>=0&&row<matrix.size&&col>=0&&col<matrix.size&&matrix.get(row,col);
  const value=Boolean(dark)!==inverted?0:255;
  const offset=(rotated?x*size+(size-1-y):y*size+x)*4;
  rgba.set([value,value,value,255],offset);
 }
 assert.equal(decodeQrPixels(rgba,size,size),url);
}
assert.equal(decodeQrPixels(new Uint8ClampedArray(100*100*4).fill(255),100,100),null);
assert.equal(trustedQrDestination(url,origin),'/admin-key/approve?request='+token);
for(const invalid of [url+'#x',url+'&request='+token,url+'&desktopSecret='+token,url.replace('https:','http:'),url.replace('skpcomp.vercel.app','evil.example'),url.replace('/admin/qr/approve','/admin-key/approve'),'javascript:alert(1)',url.replace(token,'A'.repeat(64))])assert.equal(trustedQrDestination(invalid,origin),null,invalid);
console.log('QR pixel decoding: normal/inverted/rotated, blank frame and hostile URL tests passed.');
