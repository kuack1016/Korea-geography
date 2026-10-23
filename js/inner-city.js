(()=>{'use strict';
const root=document.getElementById('studyPanel'),modes=document.getElementById('studyModes');
if(!root||!modes)return;
const original=root.querySelector('.study-layout'),note=document.getElementById('studyModeNote');
const tab=document.getElementById('innerCityTab');if(!tab)return;
const panel=document.createElement('div');panel.id='innerCityPanel';panel.className='study-layout';panel.hidden=true;
panel.innerHTML=`<section class="card study-map inner-city-map-card"><div class="inner-city-toolbar"><div class="mode-tabs" id="innerCityChoices"><button type="button" data-city="서울" class="active">서울</button><button type="button" data-city="부산">부산</button><button type="button" data-city="대구">대구</button></div></div><svg id="innerCitySvg" viewBox="0 0 720 510" role="group" aria-label="구·군 행정구역 경계"><defs><filter id="cityDistrictEdge" x="-3%" y="-3%" width="106%" height="106%"><feMorphology in="SourceAlpha" operator="dilate" radius="0.65" result="expanded"/><feComposite in="expanded" in2="SourceAlpha" operator="out" result="edge"/><feFlood flood-color="#9aa9bd" result="edgeColor"/><feComposite in="edgeColor" in2="edge" operator="in" result="stroke"/><feMerge><feMergeNode in="SourceGraphic"/><feMergeNode in="stroke"/></feMerge></filter></defs><g id="innerCityShapes"></g></svg><div class="small inner-city-credit">시·군·구 경계 지도</div></section><aside class="card study-info"><div class="small">선택한 자치구·군</div><div class="study-name" id="innerCityName">지도를 눌러보세요</div><div class="study-province" id="innerCityProvince">서울특별시</div><div id="innerCityStatus" class="small" aria-live="polite"></div><div class="study-notes-card"><b>핵심개념</b><p class="small" id="innerCityConceptHint">구·군을 선택하면 핵심개념을 작성할 수 있습니다.</p><textarea id="innerCityConceptInput" rows="7" placeholder="핵심개념을 한 줄에 하나씩 입력하세요." disabled></textarea><div class="inner-city-concept-actions"><button type="button" id="innerCityConceptSave" disabled>저장</button><span id="innerCityConceptMessage" class="small" aria-live="polite"></span></div><p class="small">이 기기의 브라우저에 저장됩니다.</p></div></aside>`;
original.insertAdjacentElement('beforebegin',panel);
const svg=panel.querySelector('svg'),g=panel.querySelector('#innerCityShapes'),status=panel.querySelector('#innerCityStatus'),name=panel.querySelector('#innerCityName'),province=panel.querySelector('#innerCityProvince');
const cities={서울:{prefix:'11',label:'서울특별시',count:25,names:'종로구 중구 용산구 성동구 광진구 동대문구 중랑구 성북구 강북구 도봉구 노원구 은평구 서대문구 마포구 양천구 강서구 구로구 금천구 영등포구 동작구 관악구 서초구 강남구 송파구 강동구'.split(' ')},부산:{prefix:'26',label:'부산광역시',count:16,names:'중구 서구 동구 영도구 부산진구 동래구 남구 북구 해운대구 사하구 금정구 강서구 연제구 수영구 사상구 기장군'.split(' ')},대구:{prefix:'27',label:'대구광역시',count:9,names:'중구 동구 서구 남구 북구 수성구 달서구 달성군 군위군'.split(' ')}};
let city='서울',features=null,selected=null,request=null,selectedDistrict=null;
const conceptInput=panel.querySelector('#innerCityConceptInput'),conceptSave=panel.querySelector('#innerCityConceptSave'),conceptMessage=panel.querySelector('#innerCityConceptMessage');
function conceptKey(){return 'kg-inner-city-concept-v1:'+city+':'+selectedDistrict}
function showConcept(label){selectedDistrict=label;conceptInput.disabled=false;conceptSave.disabled=false;conceptMessage.textContent='';try{conceptInput.value=localStorage.getItem(conceptKey())||''}catch(_){conceptInput.value='';conceptMessage.textContent='이 브라우저에서 저장소를 사용할 수 없습니다.'}}
conceptSave.addEventListener('click',()=>{if(!selectedDistrict)return;try{localStorage.setItem(conceptKey(),conceptInput.value);conceptMessage.textContent='이 브라우저에 저장했습니다.'}catch(_){conceptMessage.textContent='저장하지 못했습니다.'}});
function resetConcept(){selectedDistrict=null;conceptInput.value='';conceptInput.disabled=true;conceptSave.disabled=true;conceptMessage.textContent=''}
function points(geometry){const out=[];function visit(x){if(!Array.isArray(x))return;if(typeof x[0]==='number'&&typeof x[1]==='number'){out.push(x);return}x.forEach(visit)}visit(geometry.coordinates);return out}
function geomPath(geometry,project){const polys=geometry.type==='Polygon'?[geometry.coordinates]:geometry.coordinates;return polys.map(poly=>poly.map(r=>r.map((p,i)=>(i?'L':'M')+project(p).map(n=>n.toFixed(2)).join(',')).join('')+'Z').join('')).join('')}
function regionName(f){return String((f.properties||{}).SIG_KOR_NM||'').trim()}
function render(){
 if(!features)return;
 const cfg=cities[city];resetView();selected=null;resetConcept();name.textContent='지도를 눌러보세요';province.textContent=cfg.label;g.replaceChildren();
 const present=features.filter(f=>String((f.properties||{}).SIG_CD||'').startsWith(cfg.prefix)&&cfg.names.includes(regionName(f)));
 if(present.length!==cfg.count){status.textContent='경계 자료 확인 필요: '+present.length+'/'+cfg.count+'개 구·군';console.warn('City district count mismatch',city,present.map(regionName));}
 if(!present.length)return;
 let minx=Infinity,maxx=-Infinity,miny=Infinity,maxy=-Infinity;
 for(const f of present)for(const p of points(f.geometry)){minx=Math.min(minx,p[0]);maxx=Math.max(maxx,p[0]);miny=Math.min(miny,p[1]);maxy=Math.max(maxy,p[1]);}
 if(!Number.isFinite(minx)||maxx===minx||maxy===miny){status.textContent='경계 좌표 오류';return}
 const w=650,h=450,scale=Math.min(w/(maxx-minx),h/(maxy-miny)),left=(720-(maxx-minx)*scale)/2,top=(510-(maxy-miny)*scale)/2;
 const project=p=>[left+(p[0]-minx)*scale,top+(maxy-p[1])*scale];
 for(const f of present){
  const label=regionName(f),path=document.createElementNS('http://www.w3.org/2000/svg','path');
  path.setAttribute('class','inner-city-region');path.setAttribute('d',geomPath(f.geometry,project));path.setAttribute('fill-rule','evenodd');
  path.setAttribute('role','button');path.setAttribute('tabindex','0');path.setAttribute('aria-label',label);
  const pick=()=>{if(selected)selected.classList.remove('selected');selected=path;path.classList.add('selected');name.textContent=label;province.textContent=cfg.label;showConcept(label)};
  path.addEventListener('click',pick);path.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();pick()}});
  g.appendChild(path);
 }
 if(present.length===cfg.count)status.textContent=present.length+'개 구·군 · 지도를 눌러 선택하세요.';
}
// Independent SVG viewport gestures: only the map zooms, never the page or the information card.
const originalView={x:0,y:0,w:720,h:510};let view={...originalView},start=null,dragged=false,suppressClick=false;
const pointers=new Map();
function drawView(){svg.setAttribute('viewBox',[view.x,view.y,view.w,view.h].join(' '))}
function clampView(v){v.w=Math.max(90,Math.min(720,v.w));v.h=v.w*510/720;v.x=Math.max(-v.w*.4,Math.min(720-v.w*.6,v.x));v.y=Math.max(-v.h*.4,Math.min(510-v.h*.6,v.y));return v}
function relative(e){const r=svg.getBoundingClientRect();return{x:(e.clientX-r.left)/r.width,y:(e.clientY-r.top)/r.height}}
function gesture(){const a=[...pointers.values()];const center=a.length===1?a[0]:{x:(a[0].x+a[1].x)/2,y:(a[0].y+a[1].y)/2};return{center,dist:a.length>1?Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y):0,view:{...view}}}
function zoomAt(p,factor){const w=view.w*factor,h=view.h*factor;view=clampView({x:view.x+p.x*(view.w-w),y:view.y+p.y*(view.h-h),w,h});drawView()}
svg.addEventListener('pointerdown',e=>{if(e.pointerType==='mouse'&&e.button!==0)return;pointers.set(e.pointerId,relative(e));try{svg.setPointerCapture(e.pointerId)}catch(_){}start=gesture();dragged=false;if(e.pointerType==='touch')e.preventDefault()},{passive:false});
svg.addEventListener('pointermove',e=>{if(!pointers.has(e.pointerId)||!start)return;pointers.set(e.pointerId,relative(e));const now=gesture(),rect=svg.getBoundingClientRect(),distance=Math.hypot((now.center.x-start.center.x)*rect.width,(now.center.y-start.center.y)*rect.height);if(pointers.size>1||distance>8)dragged=true;if(!dragged)return;const factor=pointers.size>1&&start.dist>0?start.dist/Math.max(.001,now.dist):1;const w=start.view.w*factor,h=start.view.h*factor;view=clampView({x:start.view.x+start.center.x*start.view.w-now.center.x*w,y:start.view.y+start.center.y*start.view.h-now.center.y*h,w,h});drawView();e.preventDefault()},{passive:false});
function pointerEnd(e){if(!pointers.has(e.pointerId))return;if(dragged)suppressClick=true;pointers.delete(e.pointerId);start=pointers.size?gesture():null;if(!pointers.size)dragged=false}
svg.addEventListener('pointerup',pointerEnd);svg.addEventListener('pointercancel',pointerEnd);svg.addEventListener('lostpointercapture',pointerEnd);
svg.addEventListener('click',e=>{if(suppressClick){e.preventDefault();e.stopImmediatePropagation();suppressClick=false}},true);
svg.addEventListener('wheel',e=>{zoomAt(relative(e),Math.exp(e.deltaY*.0015));e.preventDefault()},{passive:false});
svg.addEventListener('dblclick',e=>{zoomAt(relative(e),1/1.7);e.preventDefault()});
function resetView(){view={...originalView};drawView()}
async function load(){
 if(features){render();return}if(request)return request;
 status.textContent='시·군·구 경계 자료를 불러오는 중…';
 request=(async()=>{try{
  const response=await fetch('https://raw.githubusercontent.com/KnellBalm/kr-admin-geojson/main/sig.geojson');
  if(!response.ok)throw Error('HTTP '+response.status);
  const json=await response.json();if(!Array.isArray(json.features))throw Error('Invalid GeoJSON');
  features=json.features;render();
 }catch(err){status.textContent='구·군 경계 자료 로딩 실패. 다시 시도해 주세요.';console.error('city district boundary',err)}
 finally{request=null}})();return request;
}
function activate(on){root.classList.toggle('inner-city-active',on);original.style.setProperty('display',on?'none':'grid','important');panel.hidden=!on;tab.classList.toggle('active',on);const memory=document.getElementById('memoryToggle');if(memory)memory.style.visibility=on?'hidden':'';if(on){original.setAttribute('aria-hidden','true');modes.querySelectorAll('button').forEach(x=>{if(x!==tab)x.classList.remove('active')});['citySubModes','cityLegend','heritageLegend'].forEach(id=>{const e=document.getElementById(id);if(e)e.style.display='none'});note.textContent='서울·부산·대구의 구·군 경계를 선택해 학습합니다.';load()}else{original.removeAttribute('aria-hidden')}}
tab.addEventListener('click',()=>activate(true));
modes.querySelectorAll('button').forEach(btn=>{if(btn!==tab)btn.addEventListener('click',()=>activate(false))});
panel.querySelectorAll('[data-city]').forEach(btn=>btn.addEventListener('click',()=>{city=btn.dataset.city;panel.querySelectorAll('[data-city]').forEach(x=>x.classList.toggle('active',x===btn));if(features)render();else load()}));
})();