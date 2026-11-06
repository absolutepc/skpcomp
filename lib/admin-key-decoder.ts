import jsQR from '../vendor/jsqr-1.4.0.js';

/** Local CPU decoding works in Safari without BarcodeDetector or image uploads. */
export function decodeQrPixels(data:Uint8ClampedArray,width:number,height:number):string|null{
 return jsQR(data,width,height,{inversionAttempts:'attemptBoth'})?.data||null;
}

export function createQrVideoDecoder(){
 const canvas=document.createElement('canvas');
 const context=canvas.getContext('2d',{willReadFrequently:true});
 if(!context)throw new Error('Canvas unavailable');
 return (video:HTMLVideoElement):string|null=>{
  if(!video.videoWidth||!video.videoHeight)return null;
  // Bound CPU and memory on phones, preserving aspect ratio and the whole frame.
  const scale=Math.min(1,960/Math.max(video.videoWidth,video.videoHeight));
  const width=Math.max(1,Math.round(video.videoWidth*scale));
  const height=Math.max(1,Math.round(video.videoHeight*scale));
  if(canvas.width!==width)canvas.width=width;
  if(canvas.height!==height)canvas.height=height;
  context.drawImage(video,0,0,width,height);
  return decodeQrPixels(context.getImageData(0,0,width,height).data,width,height);
 };
}
