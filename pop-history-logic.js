
(function(){
'use strict';
const DATA=JSON.parse(document.getElementById('popHistoryData').textContent);
const YEARS=DATA.years, COLORS=['#3974F6','#A05DD7','#18A078','#E99A22','#D95B9A','#06A6D8','#E76F51','#B1BE29','#D34463','#6656BC','#78624B','#64748B'];
const DASH=['none','8 4','3 4','11 3 2 3'];
const byId=new Map(DATA.municipalities.map(x=>[x.id,x]));
const fmt=n=>Number(n).toLocaleString('ko-KR');
const safe=t=>String(t).replace(/[&<>"']/g,x=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[x]));
let comparison=[],unit='municipality';
const rank=document.getElementById('rankingPanel');
if(rank){
 const box=document.createElement('section');box.className='pop-history-box';box.id='popHistoryCompare';
 box.innerHTML='<h3>인구 추이 비교 · 1970~2025</h3><div class="pop-history-desc">5년 간격 인구총조사 기반 인구 추이입니다. 행정구역 통폐합 및 경계 변경에 따라 실제 인구 변화와 일부 차이가 있을 수 있습니다.</div><div class="pop-history-toggle"><button type="button" class="active" data-phunit="municipality">시·군 161개</button><button type="button" data-phunit="province">시·도</button></div><div class="pop-history-select-row"><select id="popHistoryProvinceSelect" class="pop-history-select" aria-label="시·도 선택"><option value="">시·도를 먼저 선택하세요</option></select><select id="popHistorySelect" class="pop-history-select" aria-label="해당 시·군 선택"><option value="">시·군을 선택해 추가하기</option></select></div><div id="popHistoryTags" class="pop-history-tags"></div><div id="popHistoryChart"></div><div class="pop-history-flag">참고: 행정구역 통폐합 및 경계 변경에 따라 실제 인구 변화와 일부 차이가 있을 수 있습니다.</div><div class="pop-history-source">출처: 통계청 인구총조사 KOSIS CSV · 1970~2025 (5년 간격). 2015년 이후 등록센서스 방식.</div>';
 // ranking screen, not new nav
 document.getElementById('rankingPanel').appendChild(box);box.classList.add('hidden');
 const choose=box.querySelector('#popHistorySelect');
 const provinceFilter=box.querySelector('#popHistoryProvinceSelect');
 const PROVINCE_ORDER=['서울','부산','대구','인천','광주','대전','울산','세종','경기','강원','충북','충남','전북','전남','경북','경남','제주'];
 function currentList(){return unit==='province'?DATA.provinces:DATA.municipalities}
 function choices(){
  if(unit==='province'){
   provinceFilter.style.display='none';choose.style.display='block';
   choose.innerHTML='<option value="">시·도를 선택해 추가하기</option>'+DATA.provinces.slice().sort((a,b)=>a.name.localeCompare(b.name,'ko')).map(x=>'<option value="'+safe(x.id)+'">'+safe(x.name)+'</option>').join('');
   return;
  }
  provinceFilter.style.display='block';
  const codes=[...new Set(DATA.municipalities.map(x=>x.province))];
  const sorted=codes.sort((a,b)=>{const ai=PROVINCE_ORDER.indexOf(a),bi=PROVINCE_ORDER.indexOf(b);return (ai<0?100:ai)-(bi<0?100:bi)||a.localeCompare(b,'ko')});
  const selected=provinceFilter.value;
  provinceFilter.innerHTML='<option value="">시·도 선택</option>'+sorted.map(x=>'<option value="'+safe(x)+'">'+safe(x)+'</option>').join('');
  if(codes.includes(selected))provinceFilter.value=selected;
  const filtered=DATA.municipalities.filter(x=>x.province===provinceFilter.value).sort((a,b)=>a.name.localeCompare(b.name,'ko'));
  choose.disabled=!provinceFilter.value;
  choose.innerHTML='<option value="">'+(provinceFilter.value?'시·군 선택하여 추가':'시·도를 먼저 선택하세요')+'</option>'+filtered.map(x=>'<option value="'+safe(x.id)+'">'+safe(x.name)+'</option>').join('');
 }
 provinceFilter.addEventListener('change',choices);
 function redraw(){const items=comparison.map(id=>currentList().find(x=>x.id===id)).filter(Boolean);box.querySelector('#popHistoryTags').innerHTML=items.map((x,i)=>'<span class="pop-history-tag" style="border-color:'+COLORS[i%COLORS.length]+'">'+safe(x.name)+' <button type="button" data-phremove="'+safe(x.id)+'" aria-label="'+safe(x.name)+' 제거">×</button></span>').join('');draw(box.querySelector('#popHistoryChart'),items,false);}
 choose.addEventListener('change',()=>{if(choose.value&&!comparison.includes(choose.value))comparison.push(choose.value);choose.value='';redraw()});
 box.addEventListener('click',ev=>{const b=ev.target.closest('[data-phunit],[data-phremove]');if(!b)return;if(b.dataset.phremove){comparison=comparison.filter(x=>x!==b.dataset.phremove);redraw();return}unit=b.dataset.phunit;comparison=[];box.querySelectorAll('[data-phunit]').forEach(x=>x.classList.toggle('active',x===b));choices();redraw()});
 choices();redraw();
 const tabRank=document.getElementById('popRankViewBtn'),tabComposition=document.getElementById('popCompositionViewBtn'),tabHistory=document.getElementById('popHistoryViewBtn');
 const composition=document.getElementById('popCompositionView'),existing=document.getElementById('popExistingRanking'),head=document.getElementById('popCompareHead');
 function showTab(mode){
   tabRank.classList.toggle('active',mode==='rank');tabComposition.classList.toggle('active',mode==='composition');tabHistory.classList.toggle('active',mode==='history');
   existing.classList.toggle('hidden',mode!=='rank');composition.classList.toggle('hidden',mode!=='composition');
   box.classList.toggle('hidden',mode!=='history');
   if(mode==='composition'&&typeof tabComposition._oldClick==='function')tabComposition._oldClick();
 }
 tabComposition._oldClick=tabComposition.onclick;
 tabRank.onclick=()=>showTab('rank');tabComposition.onclick=()=>{showTab('composition');};tabHistory.onclick=()=>showTab('history');
 // Existing composition click may update classes; force the final tab state after rendering.
 tabComposition.onclick=()=>{if(tabComposition._oldClick)tabComposition._oldClick();showTab('composition')};
 showTab('rank');
}
function draw(node,items,small){if(!node)return;if(!items.length){node.innerHTML='<div class="pop-history-empty">비교할 지역을 선택하면 그래프가 나타납니다.</div>';return;}
 const W=720,H=small?230:325,L=72,R=15,T=22,B=37,graphW=W-L-R,graphH=H-T-B;
 const vals=items.flatMap(x=>YEARS.map(y=>x.values[y]).filter(n=>Number.isFinite(n))), vmax=Math.max(...vals,1)*1.07;
 const X=y=>L+(y-1970)/55*graphW,Y=v=>T+graphH-v/vmax*graphH;
 let s='<svg class="pop-history-svg" viewBox="0 0 '+W+' '+H+'" role="img" aria-label="인구 추이 꺾은선 그래프">';
 for(let i=0;i<=4;i++){let v=vmax*i/4,y=Y(v);s+='<line x1="'+L+'" y1="'+y+'" x2="'+(W-R)+'" y2="'+y+'" stroke="#e2e8f0"/><text x="'+(L-8)+'" y="'+(y+4)+'" text-anchor="end" fill="#64748b" font-size="11">'+(v>=10000?(v/10000).toFixed(v>=100000?0:1)+'만':Math.round(v))+'</text>'}
 for(const yr of YEARS){const x=X(yr);s+='<text x="'+x+'" y="'+(H-11)+'" text-anchor="middle" fill="#64748b" font-size="'+(small?10:11)+'">'+String(yr).slice(2)+'</text>'}
 items.forEach((obj,i)=>{const color=COLORS[i%COLORS.length],dash=DASH[Math.floor(i/COLORS.length)%DASH.length];let path='',started=false;
 for(const yr of YEARS){const v=obj.values[yr];if(!Number.isFinite(v)){started=false;continue}const x=X(yr),y=Y(v);path+=(started?' L':' M')+x.toFixed(2)+' '+y.toFixed(2);started=true;}
 s+='<path d="'+path+'" style="fill:none!important;stroke:'+color+'!important;stroke-width:2.6!important" stroke-dasharray="'+dash+'" stroke-linejoin="round" stroke-linecap="round"/>';
 for(const yr of YEARS){const v=obj.values[yr];if(!Number.isFinite(v))continue;const meta=obj.review?.[yr],text=obj.name+' '+yr+'년 '+fmt(v)+'명';s+='<circle class="ph-point-visible" cx="'+X(yr)+'" cy="'+Y(v)+'" r="3.2" style="fill:'+color+'!important;stroke:#fff!important;stroke-width:.8!important"/>';
 s+='<circle class="ph-point-hit" cx="'+X(yr)+'" cy="'+Y(v)+'" r="11" tabindex="0" role="button" aria-label="'+safe(text)+' 자세히 보기" data-ph-item="'+i+'" data-ph-year="'+yr+'" fill="transparent" stroke="transparent"><title>'+safe(text)+(meta?' · '+safe(meta.source):'')+'</title></circle>';}
 });s+='</svg>';
 s+='<div class="pop-history-detail" role="status" aria-live="polite">그래프의 점을 누르면 해당 연도의 정확한 인구와 원자료를 확인할 수 있어요.</div>';
 s+='<div class="pop-history-legend">'+items.map((x,i)=>'<span><i style="background:'+COLORS[i%COLORS.length]+'"></i>'+safe(x.name)+(i>=COLORS.length?' ('+(Math.floor(i/COLORS.length)+1)+'형)':'')+'</span>').join('')+'</div>';
 const latest=items.map(x=>{let yrs=YEARS.filter(y=>Number.isFinite(x.values[y]));let a=yrs[0],b=yrs[yrs.length-1];return a&&b?safe(x.name)+': '+a+'년 '+fmt(x.values[a])+'명 → '+b+'년 '+fmt(x.values[b])+'명':''}).filter(Boolean);
 if(small&&latest.length)s+='<div class="pop-history-summary">'+latest.join('<br>')+'</div>';
 if(small&&items.length===1&&items[0].review){
 const x=items[0];let reviewYears=YEARS.filter(y=>x.review[y]);
 s+='<details class="ph-provenance"><summary>연도별 원자료·합산 근거 확인 ('+reviewYears.length+'개 연도)</summary><div class="ph-provenance-body">'+reviewYears.map(y=>'<div><b>'+y+'년 ('+(x.review[y].category==='MERGER_SUM_REVIEW'?'합산 자료':x.review[y].category==='PREDECESSOR_NAME_REVIEW'?'전신 지명 후보':'당시 지명 기준')+')</b>: '+safe(x.review[y].source)+'</div>').join('')+'</div></details>';
 }
 node.innerHTML=s;
 const showPoint=(point)=>{if(!point)return;const item=items[Number(point.dataset.phItem)],yr=point.dataset.phYear;
 if(!item)return;const value=item.values[yr],meta=item.review?.[yr],detail=node.querySelector('.pop-history-detail');
 if(!Number.isFinite(value)||!detail)return;
 const status=meta?.category==='EUP_MERGER_REVIEW'?'과거 읍 인구 합산':meta?.category==='MERGER_SUM_REVIEW'?'과거 시·군 통합 합산':meta?.category==='HISTORICAL_NAME_REVIEW'?'과거 지명 기준 자료':'당시 행정구역 기준 인구';
 detail.innerHTML='<strong>'+safe(item.name)+' · '+yr+'년 · '+fmt(value)+'명</strong><div class="ph-detail-status">'+status+' · 행정구역 변동에 따른 차이 가능</div>'+(meta?.source?'<div class="ph-detail-source">근거: '+safe(meta.source)+'</div>':'<div class="ph-detail-source">출처: 통계청 인구총조사 KOSIS</div>');
 node.querySelectorAll('.ph-point-visible').forEach(p=>p.style.strokeWidth='.8');
 };
 node.querySelector('svg')?.addEventListener('click',e=>showPoint(e.target.closest('.ph-point-hit')));
 node.querySelector('svg')?.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){const point=e.target.closest('.ph-point-hit');if(point){e.preventDefault();showPoint(point)}}});
}
function findSite(name,province){
 const norm=s=>String(s||'').replace(/\s+/g,'').replace(/특별자치도|특별자치시|특별시|광역시/g,'');
 let xs=DATA.municipalities.filter(x=>x.name===name);
 if(xs.length===1)return xs[0];
 if(!xs.length)xs=DATA.municipalities.filter(x=>norm(x.name)===norm(name));
 if(xs.length===1)return xs[0];
 const alias={'경기도':'경기','강원도':'강원','강원특별자치도':'강원','충청북도':'충북','충청남도':'충남','전북특별자치도':'전북','전라북도':'전북','전라남도':'전남','경상북도':'경북','경상남도':'경남','제주특별자치도':'제주'};
 const pr=alias[province]||province;
 return xs.find(x=>pr.includes(x.province)||x.province.includes(pr))||null;
}
function findFromSiteRegion(region){
 if(!region)return null;
 // Both datasets share BANK r0..r160 identifiers: use the exact ID first.
 const id=String(region.id||'');
 const byCode=byId.get(id);
 if(byCode && (!region.name||byCode.name===region.name))return byCode;
 // BANK.display contains the province prefix (e.g. "강원 강릉시"); BANK.name does not.
 const province=region.provinceShort||region.province||'';
 return findSite(region.name||'',province)||findSite(region.display||'',province);
}
function resolveStudyDisplay(){
 const n=document.getElementById('studyName'),p=document.getElementById('studyProvince');
 if(!n)return null;
 const label=n.textContent.trim();
 // Match the rendered label to the canonical BANK record rather than guessing from displayed text.
 const record=(typeof BANK!=='undefined' && Array.isArray(BANK))
   ?BANK.find(r=>r.display===label && (!p?.textContent.trim()||r.province===p.textContent.trim()))
   :null;
 return record?findFromSiteRegion(record):findSite(label,p?.textContent.trim()||'');
}
function renderStudySelected(item){
 const host=document.getElementById('populationPanel');if(!host)return;
 let chart=document.getElementById('popHistoryStudy');
 if(!chart){chart=document.createElement('div');chart.id='popHistoryStudy';chart.className='pop-history-box small-chart';}
 // Keep the graph at the bottom of the population card even after other renderers update it.
 if(chart.parentElement!==host||chart!==host.lastElementChild)host.appendChild(chart);
 if(!item){chart.style.display='none';return;}
 chart.style.display='block';
 chart.innerHTML='<h3>인구 추이 (1970~2025)</h3><div class="pop-history-desc">인구총조사 기반 인구 추이 · 5년 간격</div><div class="ph-inline"></div><div class="pop-history-flag">행정구역 통폐합 및 경계 변경에 따라 실제 인구 변화와 일부 차이가 있을 수 있습니다. 점을 누르면 연도별 출처를 확인할 수 있습니다.</div>';
 draw(chart.querySelector('.ph-inline'),[item],true);
}
function updateStudy(){renderStudySelected(resolveStudyDisplay());}
function updateAtlas(){const detail=document.getElementById('atlasDetail'),n=document.getElementById('atlasDetailName'),p=document.getElementById('atlasDetailProvince');if(!detail||!n)return;let chart=document.getElementById('popHistoryAtlas');if(!chart){chart=document.createElement('div');chart.className='pop-history-box small-chart';chart.id='popHistoryAtlas';detail.insertBefore(chart,detail.querySelector('.atlas-detail-actions'))}const label=n.textContent.trim(),prov=p?.textContent.trim()||'';const atlasRegion=(typeof BANK!=='undefined'&&Array.isArray(BANK))?BANK.find(r=>(r.display===label||r.name===label)&&(!prov||r.province===prov||r.provinceShort===prov)):null;const item=atlasRegion?findFromSiteRegion(atlasRegion):findSite(label,prov);if(!item||detail.classList.contains('hidden')){chart.style.display='none';return}chart.style.display='block';chart.innerHTML='<h3>인구 추이 (1970~2025)</h3><div class="pop-history-desc">인구총조사 기반 인구 추이 · 5년 간격</div><div class="ph-inline"></div><div class="pop-history-flag">행정구역 통폐합 및 경계 변경에 따라 실제 인구 변화와 일부 차이가 있을 수 있습니다.</div>';draw(chart.querySelector('.ph-inline'),[item],true)}
const observer=new MutationObserver(()=>{requestAnimationFrame(()=>{updateStudy();updateAtlas()})});
for(const id of ['studyName','studyProvince','atlasDetailName','atlasDetailProvince','atlasDetail']){const el=document.getElementById(id);if(el)observer.observe(el,{childList:true,characterData:true,subtree:id!=='atlasDetail',attributes:id==='atlasDetail',attributeFilter:id==='atlasDetail'?['class']:undefined})}
window.addEventListener('pop-history-study-select',ev=>{const region=ev.detail?.region;const item=findFromSiteRegion(region);renderStudySelected(item);});
updateStudy();updateAtlas();
})();
