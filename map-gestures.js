
(function(){
'use strict';
// Preserve the original SVG coordinates and existing map selection listeners.
// SVG viewBox manipulation keeps the rest of the document at exactly the same size.
const ids=['quizMapSvg','studySvg','climateMapSvg','industryMapSvg','industryProvinceMapSvg'];
const quiz=document.querySelector('.main > .map svg');
if(quiz&&!quiz.id)quiz.id='quizMapSvg';
// The quiz uses the same pan/zoom gesture engine as study mode; its original region picker remains active on taps.
function bind(svg){
 if(!svg||svg.dataset.mapGestureBound)return;
 svg.dataset.mapGestureBound='1';
 const base=svg.viewBox.baseVal;
 const original={x:base.x,y:base.y,w:base.width||720,h:base.height||900};
 let view={...original},initial=null,moved=false,gestureWasDrag=false;
 const touches=new Map();
 const bound=(v)=>{
  const minW=original.w/8,maxW=original.w*1.15;
  v.w=Math.max(minW,Math.min(maxW,v.w));
  v.h=v.w*original.h/original.w;
  // Leave a small margin beyond the base map for comfortable dragging.
  v.x=Math.max(original.x-v.w*.65,Math.min(original.x+original.w-v.w*.35,v.x));
  v.y=Math.max(original.y-v.h*.65,Math.min(original.y+original.h-v.h*.35,v.y));
  return v;
 };
 function render(){svg.setAttribute('viewBox',`${view.x} ${view.y} ${view.w} ${view.h}`)}
 // Restore the default map viewport on reload, including Safari back-forward cache restoration.
 window.addEventListener('pageshow',()=>{view={...original};initial=null;moved=false;gestureWasDrag=false;touches.clear();render();});
 function coords(e){
  const r=svg.getBoundingClientRect();
  return{x:(e.clientX-r.left)/r.width,y:(e.clientY-r.top)/r.height};
 }
 function center(){
  const a=[...touches.values()];
  if(a.length===1)return a[0];
  return{x:(a[0].x+a[1].x)/2,y:(a[0].y+a[1].y)/2};
 }
 function dist(){
  const a=[...touches.values()];
  return a.length>1?Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y):0;
 }
 function snapshot(){
  if(!touches.size){initial=null;return}
  initial={center:center(),dist:dist(),view:{...view}};
 }
 svg.addEventListener('pointerdown',e=>{
  if(e.pointerType==='mouse'&&e.button!==0)return;
  touches.set(e.pointerId,coords(e));
  try{svg.setPointerCapture(e.pointerId)}catch(_){}
  snapshot();moved=false;gestureWasDrag=false;
  if(e.pointerType==='touch')e.preventDefault();
 },{passive:false});
 svg.addEventListener('pointermove',e=>{
  if(!touches.has(e.pointerId)||!initial)return;
  touches.set(e.pointerId,coords(e));
  const c=center(),v=initial.view;
  const rect=svg.getBoundingClientRect();
  const travel=Math.hypot((c.x-initial.center.x)*rect.width,(c.y-initial.center.y)*rect.height);
  // Ignore touch jitter; only intentional drags/pinches suppress map selection.
  if(touches.size>1 || travel>9) { moved=true; gestureWasDrag=true; }
  if(!moved)return;
  let w=v.w,h=v.h;
  if(touches.size>1&&initial.dist>0){
   w=v.w*initial.dist/Math.max(.001,dist());h=w*original.h/original.w;
  }
  view=bound({
   x:v.x+initial.center.x*v.w-c.x*w,
   y:v.y+initial.center.y*v.h-c.y*h,w,h
  });
  render();e.preventDefault();
 },{passive:false});
 function up(e){
  if(!touches.has(e.pointerId))return;
  touches.delete(e.pointerId);snapshot();
  if(!touches.size) moved=false;
 }
 svg.addEventListener('pointerup',e=>{
  if(gestureWasDrag&&touches.has(e.pointerId)){e.stopImmediatePropagation();e.preventDefault()}
 },true);
 svg.addEventListener('pointerup',up);
 svg.addEventListener('pointercancel',up);
 svg.addEventListener('lostpointercapture',up);
 // Suppress accidental region selections at the end of a drag, but preserve normal taps.
 svg.addEventListener('click',e=>{if(gestureWasDrag){e.stopImmediatePropagation();e.preventDefault();gestureWasDrag=false;moved=false}},true);
 svg.addEventListener('wheel',e=>{
  const c=coords(e),scale=Math.exp(e.deltaY*.0015);
  const w=view.w*scale,h=view.h*scale;
  view=bound({x:view.x+c.x*(view.w-w),y:view.y+c.y*(view.h-h),w,h});
  render();e.preventDefault();
 },{passive:false});
 svg.addEventListener('dblclick',e=>{
  const c=coords(e),w=view.w/1.5,h=view.h/1.5;
  view=bound({x:view.x+c.x*(view.w-w),y:view.y+c.y*(view.h-h),w,h});
  render();e.preventDefault();
 });
}
ids.forEach(id=>bind(document.getElementById(id)));
})();
