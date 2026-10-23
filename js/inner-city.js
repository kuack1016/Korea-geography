(()=>{'use strict';
const root=document.getElementById('studyPanel'),modes=document.getElementById('studyModes');
if(!root||!modes)return;
const original=root.querySelector('.study-layout'),note=document.getElementById('studyModeNote');
const tab=document.getElementById('innerCityTab');if(!tab)return;
const panel=document.createElement('div');panel.id='innerCityPanel';panel.className='study-layout';panel.hidden=true;
panel.innerHTML=`<section class="card study-map inner-city-map-card"><div class="inner-city-toolbar"><div class="mode-tabs" id="innerCityChoices"><button type="button" data-city="서울" class="active">서울</button><button type="button" data-city="부산">부산</button><button type="button" data-city="대구">대구</button></div></div><svg id="innerCitySvg" viewBox="0 0 720 510" role="group" aria-label="구·군 행정구역 경계"><g id="innerCityShapes"></g></svg><div class="small inner-city-credit">자료: 국가공간정보포털 시군구 경계 · 2023년 7월 자료 (대구 군위군 포함)</div></section><aside class="card study-info"><div class="small">선택한 자치구·군</div><div class="study-name" id="innerCityName">지도를 눌러보세요</div><div class="study-province" id="innerCityProvince">서울특별시</div><div id="innerCityStatus" class="small" aria-live="polite"></div><div class="study-notes-card"><b>도시 내부 구조</b><p class="small">구·군 단위 위치를 학습합니다. 주간 인구 지수 등은 추후 별도로 추가됩니다.</p></div></aside>`;
original.insertAdjacentElement('beforebegin',panel);
const svg=panel.querySelector('svg'),g=panel.querySelector('#innerCityShapes'),status=panel.querySelector('#innerCityStatus'),name=panel.querySelector('#innerCityName'),province=panel.querySelector('#innerCityProvince');
const cities={서울:{prefix:'11',label:'서울특별시',count:25},부산:{prefix:'26',label:'부산광역시',count:16},대구:{prefix:'27',label:'대구광역시',count:9}};
let city='서울',features=null,selected=null,request=null;
function points(geometry){const out=[];function visit(x){if(!Array.isArray(x))return;if(typeof x[0]==='number'&&typeof x[1]==='number'){out.push(x);return}x.forEach(visit)}visit(geometry.coordinates);return out}
function geomPath(geometry,project){const polys=geometry.type==='Polygon'?[geometry.coordinates]:geometry.coordinates;return polys.map(poly=>poly.map(r=>r.map((p,i)=>(i?'L':'M')+project(p).map(n=>n.toFixed(2)).join(',')).join('')+'Z').join('')).join('')}
function render(){if(!features)return;const cfg=cities[city];selected=null;name.textContent='지도를 눌러보세요';province.textContent=cfg.label;g.replaceChildren();
const districts=features.filter(f=>String(f.properties?.SIG_CD||'').startsWith(cfg.prefix));
if(districts.length!==cfg.count){status.textContent='구·군 데이터 검증 실패: '+districts.length+'개 (예상 '+cfg.count+'개).';return}
const all=districts.flatMap(f=>points(f.geometry));const minx=Math.min(...all.map(p=>p[0])),maxx=Math.max(...all.map(p=>p[0])),miny=Math.min(...all.map(p=>p[1])),maxy=Math.max(...all.map(p=>p[1]));
const w=690,h=480,scale=Math.min(w/(maxx-minx),h/(maxy-miny)),left=(720-(maxx-minx)*scale)/2,top=(510-(maxy-miny)*scale)/2;
const project=p=>[left+(p[0]-minx)*scale,top+(maxy-p[1])*scale];
for(const f of districts){const label=f.properties.SIG_KOR_NM;const p=document.createElementNS('http://www.w3.org/2000/svg','path');p.setAttribute('d',geomPath(f.geometry,project));p.setAttribute('fill-rule','evenodd');p.setAttribute('class','inner-city-region');p.setAttribute('role','button');p.setAttribute('tabindex','0');p.setAttribute('aria-label',label);p.setAttribute('vector-effect','non-scaling-stroke');const pick=()=>{if(selected)selected.classList.remove('selected');selected=p;p.classList.add('selected');name.textContent=label;province.textContent=cfg.label};p.addEventListener('click',pick);p.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();pick()}});g.appendChild(p)}
status.textContent=districts.length+'개 구·군 · 구역을 눌러 선택하세요.';
}
async function load(){if(features){render();return}if(request)return request;status.textContent='시군구 경계를 불러오는 중…';request=(async()=>{try{const response=await fetch('https://raw.githubusercontent.com/KnellBalm/kr-admin-geojson/main/sig.geojson');if(!response.ok)throw Error('HTTP '+response.status);const json=await response.json();if(!Array.isArray(json.features))throw Error('Invalid GeoJSON');features=json.features;render()}catch(err){status.textContent='경계 자료 로딩 실패. 탭을 다시 눌러 재시도해 주세요.';console.error('district boundary',err)}finally{request=null}})();return request}
function activate(on){root.classList.toggle('inner-city-active',on);panel.hidden=!on;tab.classList.toggle('active',on);const memory=document.getElementById('memoryToggle');if(memory)memory.style.visibility=on?'hidden':'';if(on){modes.querySelectorAll('button').forEach(x=>{if(x!==tab)x.classList.remove('active')});['citySubModes','cityLegend','heritageLegend'].forEach(id=>{const e=document.getElementById(id);if(e)e.style.display='none'});note.textContent='서울·부산·대구의 구·군 경계를 선택해 학습합니다.';load()}}
tab.addEventListener('click',()=>activate(true));
modes.querySelectorAll('button').forEach(btn=>{if(btn!==tab)btn.addEventListener('click',()=>activate(false))});
panel.querySelectorAll('[data-city]').forEach(btn=>btn.addEventListener('click',()=>{city=btn.dataset.city;panel.querySelectorAll('[data-city]').forEach(x=>x.classList.toggle('active',x===btn));if(features)render();else load()}));
})();