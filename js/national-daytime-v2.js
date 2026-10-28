(()=>{'use strict';
const root=document.getElementById('studyPanel'),modes=document.getElementById('studyModes');
const original=root?.querySelector('.study-layout'),inner=document.getElementById('innerCityPanel');
if(!root||!modes||!original||!Array.isArray(window.KG_DAYTIME_2020)||window.KG_DAYTIME_2020.length!==161)return;
const innerTab=document.getElementById('innerCityTab');
const tab=document.createElement('button');tab.type='button';tab.dataset.smode='daytime';tab.textContent='주간인구지수';
modes.insertBefore(tab,innerTab);
const colors=[['115 이상',115,'#2456d3'],['110~115 미만',110,'#4478ee'],['105~110 미만',105,'#77a1f6'],['100~105 미만',100,'#aec8fc'],['95~100 미만',95,'#dce7fc'],['90~95 미만',90,'#edf3fd'],['90 미만',-Infinity,'#fafcff']];
const shade=v=>colors.find(x=>v>=x[1])?.[2]||'#fff';
const panel=document.createElement('div');panel.id='nationalDaytimePanel';panel.className='study-layout';panel.hidden=true;
panel.innerHTML='<section class="card study-map national-daytime-map"><svg id="nationalDaytimeSvg" viewBox="0 0 720 900" aria-label="전국 시군구 주간인구지수 지도"><g id="nationalDaytimeShapes"></g></svg><div class="small national-daytime-caption">2020년 인구총조사 · 시군 단위 · 지역을 눌러 선택하세요.</div><div class="national-daytime-legend"><strong>주간인구지수</strong><span>2020년 기준</span><div class="national-daytime-legend-grid">'+colors.map(c=>'<div><i style="background:'+c[2]+'"></i>'+c[0]+'</div>').join('')+'</div></div></section><aside class="card study-info national-daytime-info"><div class="small">선택한 지역</div><div id="nationalDaytimeName" class="study-name">지도를 눌러보세요</div><div id="nationalDaytimeProvince" class="study-province"></div><div class="study-notes-card"><div class="national-daytime-stat"><span>주간인구지수</span><b id="nationalDaytimeIndex">—</b></div><div class="national-daytime-stat"><span>주간인구</span><b id="nationalDaytimeDay">—</b></div><div class="national-daytime-stat"><span>상주인구</span><b id="nationalDaytimeResident">—</b></div></div></aside>';
original.insertAdjacentElement('beforebegin',panel);
const g=panel.querySelector('#nationalDaytimeShapes'),svg=panel.querySelector('svg');
const data=window.KG_DAYTIME_2020,fmt=n=>n.toLocaleString('ko-KR')+'명';
function choose(i){
 const r=window.KG_DAYTIME_REGIONS?.[i],d=data[i];if(!r||!d)return;
 // Change the actual path fill, not element opacity/filter/class (avoids iOS SVG rectangle compositing).
 g.querySelectorAll('[data-daytime-selected="true"]').forEach(p=>{
   p.style.setProperty('fill',p.dataset.originalFill,'important');
   p.removeAttribute('data-daytime-selected');
 });
 const target=g.querySelector('[data-daytime-id="r'+i+'"]');
 if(target){
   const hex=target.dataset.originalFill;
   const c=[1,3,5].map(pos=>parseInt(hex.slice(pos,pos+2),16));
   const mixed='#'+c.map(x=>Math.round(x*.58+255*.42).toString(16).padStart(2,'0')).join('');
   target.style.setProperty('fill',mixed,'important');
   target.dataset.daytimeSelected='true';
 }
 panel.querySelector('#nationalDaytimeName').textContent=r.name;
 panel.querySelector('#nationalDaytimeProvince').textContent=r.province;
 panel.querySelector('#nationalDaytimeIndex').textContent=(d[1]/d[0]*100).toFixed(1);
 panel.querySelector('#nationalDaytimeDay').textContent=fmt(d[1]);
 panel.querySelector('#nationalDaytimeResident').textContent=fmt(d[0]);
}
function populate(){
 const source=document.getElementById('studyMapg');if(!source)return;
 g.replaceChildren();let total=0;
 // Use the actual computed boundary style of the normal study map,
 // rather than maintaining a separate approximation that drifts over time.
 const reference=source.querySelector('path');
 const baseline=reference?getComputedStyle(reference):null;
 const copiedStroke=['stroke','stroke-width','stroke-opacity','stroke-linejoin','stroke-linecap','vector-effect','paint-order','filter'];
 source.querySelectorAll('path').forEach(path=>{
  const match=path.id.match(/^study_r(\d+)$/);if(!match)return;
  const i=Number(match[1]),d=data[i];if(!d)return;
  const p=path.cloneNode(false);
  p.removeAttribute('style');p.removeAttribute('id');p.removeAttribute('class');
  p.classList.add('national-daytime-region');
  p.dataset.daytimeId='r'+i;
  p.setAttribute('fill',shade(d[1]/d[0]*100));
  p.dataset.originalFill=shade(d[1]/d[0]*100);
  p.style.setProperty('--daytime-color',shade(d[1]/d[0]*100),'important');
  p.style.setProperty('fill',shade(d[1]/d[0]*100),'important');
  if(baseline)for(const key of copiedStroke){
    const value=baseline.getPropertyValue(key);
    if(value)p.style.setProperty(key,value,'important');
  }
  p.setAttribute('fill-rule','evenodd');
  p.addEventListener('click',()=>choose(i));
  p.addEventListener('pointerdown',e=>e.preventDefault(),{passive:false});
  g.appendChild(p);total++;
 });
 if(!total)panel.querySelector('.national-daytime-caption').textContent='지도 경계를 불러오지 못했습니다.';
}
let active=false;
function toggle(on){
 active=on;if(on){root.classList.remove('inner-city-active');if(inner)inner.hidden=true;}root.classList.toggle('national-daytime-active',on);
 panel.hidden=!on;tab.classList.toggle('active',on);
 if(on){
  original.style.setProperty('display','none','important');
  modes.querySelectorAll('button').forEach(b=>{if(b!==tab)b.classList.remove('active')});
  document.getElementById('studyModeNote').textContent='2020년 전국 시군별 주간인구지수를 표시합니다.';
  for(const id of ['citySubModes','cityLegend','heritageLegend']){const x=document.getElementById(id);if(x)x.style.display='none'}
  populate();
 }else if(!root.classList.contains('inner-city-active'))original.style.removeProperty('display');
}
modes.querySelectorAll('button').forEach(b=>{if(b!==tab)b.addEventListener('click',()=>toggle(false))});
tab.addEventListener('click',()=>toggle(true));
/* mirror the main map gestures without mutating its viewport */
const base=[0,0,720,900];let view=[...base],pointers=new Map(),gesture=null;
function draw(){svg.setAttribute('viewBox',view.join(' '))}
function coord(ev){const r=svg.getBoundingClientRect();return[(ev.clientX-r.left)/r.width,(ev.clientY-r.top)/r.height]}
svg.addEventListener('wheel',e=>{e.preventDefault();const [x,y]=coord(e),factor=Math.exp(e.deltaY*.0015),w=Math.max(90,Math.min(720,view[2]*factor)),h=w*900/720;view=[view[0]+x*(view[2]-w),view[1]+y*(view[3]-h),w,h];draw()},{passive:false});
svg.addEventListener('pointerdown',e=>{pointers.set(e.pointerId,coord(e));gesture=null});
svg.addEventListener('pointermove',e=>{if(!pointers.has(e.pointerId))return;const prev=pointers.get(e.pointerId),next=coord(e);pointers.set(e.pointerId,next);if(pointers.size===1){view[0]-=(next[0]-prev[0])*view[2];view[1]-=(next[1]-prev[1])*view[3];draw()}else if(pointers.size===2){const a=[...pointers.values()];const dx=a[0][0]-a[1][0],dy=a[0][1]-a[1][1],dist=Math.hypot(dx,dy);if(gesture){const factor=gesture/dist,w=Math.max(90,Math.min(720,view[2]*factor)),h=w*900/720;view[0]+=(view[2]-w)/2;view[1]+=(view[3]-h)/2;view[2]=w;view[3]=h;draw()}gesture=dist}});
for(const e of ['pointerup','pointercancel'])svg.addEventListener(e,ev=>{pointers.delete(ev.pointerId);gesture=null});
svg.addEventListener('dblclick',()=>{view=[...base];draw()});
})();
