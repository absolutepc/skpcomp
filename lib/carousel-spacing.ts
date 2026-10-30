/** Projected horizontal bounds of a card using its own 1000px perspective. */
export function carouselPose(offset:number,width:number,nativeGap:number,gap=10){
 const bounds=(index:number)=>{
  const distance=Math.min(Math.abs(index),3);
  const scale=[1.025,.9,.78,.68][distance];
  const angle=Math.sign(index)*[0,12,22,28][distance];
  const radians=angle*Math.PI/180;
  const half=scale*Math.cos(radians)*width/2;
  const depth=scale*Math.sin(radians)*width/2000;
  return {scale,angle,left:half/(1-depth),right:half/(1+depth)};
 };
 const current=bounds(offset);
 let target=0;
 const direction=Math.sign(offset);
 for(let i=1;i<=Math.abs(offset);i++){
  const previous=bounds((i-1)*direction),next=bounds(i*direction);
  // Keep equal visible gaps between the five large cards.
  const spacing=gap;
  target+=direction*(direction>0?previous.right+spacing+next.left:previous.left+spacing+next.right);
 }
 return {...current,shift:target-offset*(width+nativeGap),center:target};
}
