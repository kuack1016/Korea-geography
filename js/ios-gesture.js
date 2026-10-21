
(function(){
'use strict';
// iPad Safari supports native document zoom even when SVG pointer handlers exist.
// Cancel only touches that originate in a map; preserve ordinary page gestures elsewhere.
const targets=[...document.querySelectorAll('#quizMapSvg, #studySvg, #climateMapSvg, #industryMapSvg, #industryProvinceMapSvg, #railSvg, #roadSvg')];
const active=new Set();
for(const svg of targets){
 svg.style.touchAction='none';
 svg.addEventListener('touchstart',function(e){
  for(const t of e.changedTouches)active.add(t.identifier);
  if(e.cancelable)e.preventDefault();
 },{passive:false});
 svg.addEventListener('touchmove',function(e){
  if(e.cancelable)e.preventDefault();
 },{passive:false});
 const end=e=>{for(const t of e.changedTouches)active.delete(t.identifier)};
 svg.addEventListener('touchend',end,{passive:false});
 svg.addEventListener('touchcancel',end,{passive:false});
 svg.addEventListener('gesturestart',e=>{if(e.cancelable)e.preventDefault()},{passive:false});
 svg.addEventListener('gesturechange',e=>{if(e.cancelable)e.preventDefault()},{passive:false});
}
// Safari may dispatch gesturestart to document rather than to the SVG.
for(const type of ['gesturestart','gesturechange','gestureend']){
 document.addEventListener(type,e=>{
  if(active.size||targets.some(svg=>svg.contains(e.target))){if(e.cancelable)e.preventDefault()}
 },{capture:true,passive:false});
}
})();
