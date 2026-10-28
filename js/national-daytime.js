(()=>{'use strict';
const root=document.getElementById('studyPanel'),modes=document.getElementById('studyModes');
const original=root?.querySelector('.study-layout'),inner=document.getElementById('innerCityPanel');
if(!root||!modes||!original||!Array.isArray(window.KG_DAYTIME_2020)||window.KG_DAYTIME_2020.length!==161)return;
const innerTab=document.getElementById('innerCityTab');
const tab=document.createElement('button');tab.type='button';tab.dataset.smode='daytime';tab.textContent='주간인구지수';
modes.insertBefore(tab,innerTab);
const colors=[['200 이상',200,'#3974f6'],['150~200 미만',150,'#5b8bf7'],['125~150 미만',125,'#81a6f9'],['110~125 미만',110,'#a6c1fb'],['100~110 미만',100,'#bfd3fc'],['90~100 미만',90,'#d5e2fd'],['90 미만',-Infinity,'#eaf1ff']];
const shade=v=>colors.find(x=>v>=x[1])?.[2]||'#fff';
const panel=document.createElement('div');panel.id='nationalDaytimePanel';panel.className='study-layout';panel.hidden=true;
panel.innerHTML='<section class="card study-map national-daytime-map"><svg id="nationalDaytimeSvg" viewBox="0 0 720 900" aria-label="전국 시군구 주간인구지수 지도"><g id="nationalDaytimeShapes"></g></svg><div class="small national-daytime-caption">2020년 인구총조사 · 시군 단위 · 지역을 눌러 선택하세요.</div><div class="national-daytime-legend"><strong>주간인구지수</strong><span>2020년 기준</span><div class="national-daytime-legend-grid">'+colors.map(c=>'<div><i style="background:'+c[2]+'"></i>'+c[0]+'</div>').join('')+'</div></div></section><aside class="card study-info national-daytime-info"><div class="small">선택한 지역</div><div id="nationalDaytimeName" class="study-name">지도를 눌러보세요</div><div id="nationalDaytimeProvince" class="study-province"></div><div class="study-notes-card"><div class="national-daytime-stat"><span>주간인구지수</span><b id="nationalDaytimeIndex">—</b></div><div class="national-daytime-stat"><span>주간인구</span><b id="nationalDaytimeDay">—</b></div><div class="national-daytime-stat"><span>상주인구</span><b id="nationalDaytimeResident">—</b></div></div></aside>';
original.insertAdjacentElement('beforebegin',panel);
const g=panel.querySelector('#nationalDaytimeShapes'),svg=panel.querySelector('svg');
const data=window.KG_DAYTIME_2020,fmt=n=>n.toLocaleString('ko-KR')+'명';
function choose(i){
 const r=window.KG_DAYTIME_REGIONS?.[i],d=data[i];if(!r||!d)return;
 g.querySelectorAll('.national-daytime-region.selected').forEach(p=>p.classList.remove('selected'));
 g.querySelector('[data-daytime-id="r'+i+'"]')?.classList.add('selected');
 panel.querySelector('#nationalDaytimeName').textContent=r.name;
 panel.querySelector('#nationalDaytimeProvince').textContent=r.province;
 panel.querySelector('#nationalDaytimeIndex').textContent=(d[1]/d[0]*100).toFixed(1);
 panel.querySelector('#nationalDaytimeDay').textContent=fmt(d[1]);
 panel.querySelector('#nationalDaytimeResident').textContent=fmt(d[0]);
}
function populate(){
 const source=document.getElementById('studyMapg');if(!source)return;
 g.replaceChildren();let total=0;
 source.querySelectorAll('path').forEach(path=>{
  const match=path.id.match(/^study_r(\d+)$/);if(!match)return;
  const i=Number(match[1]),d=data[i];if(!d)return;
  const p=path.cloneNode(true);
  p.removeAttribute('style');p.removeAttribute('id');p.removeAttribute('class');
  p.classList.add('national-daytime-region');
  p.dataset.daytimeId='r'+i;
  p.setAttribute('fill',shade(Math.round(d[1]/d[0]*1000)/10));
  p.style.setProperty('fill',shade(Math.round(d[1]/d[0]*1000)/10),'important');
  p.setAttribute('stroke','#64748b');
  p.setAttribute('stroke-width','0.8');
  p.setAttribute('vector-effect','non-scaling-stroke');
  p.setAttribute('fill-rule','evenodd');
  p.addEventListener('click',()=>choose(i));
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
