(()=>{'use strict';
const root=document.getElementById('rankingPanel'),head=document.querySelector('#popCompareHead .pop-compare-switch');
const study=document.getElementById('studyMapg');
if(!root||!head||!study||typeof BANK==='undefined'||typeof POP2024==='undefined'||typeof AGE2024==='undefined')return;
const button=document.createElement('button');button.id='popMapViewBtn';button.type='button';button.textContent='인구 지도';head.prepend(button);
const wrap=document.createElement('div');wrap.id='popMapView';wrap.className='hidden';
wrap.innerHTML='<div class="climate-map-layout pop-map-layout"><section class="card climate-map-card"><div class="climate-map-tools"><select id="popMapMetric" aria-label="인구 지도 지표"><option value="population">총인구</option><option value="sex">성비</option><option value="youth">유소년층 비율</option><option value="adult">청장년층 비율</option><option value="old">노년층 비율</option><option value="daytime">주간인구지수</option></select></div><svg id="popMapSvg" viewBox="0 0 720 900" aria-label="전국 시군 인구 단계구분도"><g id="popMapShapes"></g></svg></section><aside class="card climate-map-info"><div class="small" id="popMapSource">2024년 12월 주민등록인구</div><h3 id="popMapTitle">총인구</h3><div class="climate-legend-box" id="popMapLegend"></div><div id="popMapSelected" class="small">지도에서 지역을 선택하세요.</div><div class="small" style="margin-top:14px">7단계 범례 · 회색은 자료가 없는 지역입니다. 지도 확대·이동을 지원합니다.</div></aside></div>';
root.append(wrap);
const style=document.createElement('style');style.textContent=`
#popMapView{margin-top:12px}#popMapView.hidden{display:none!important}
#popMapView #popMapSvg{width:100%;height:min(72vh,780px);min-height:480px;display:block;touch-action:none!important;-webkit-user-select:none;user-select:none}
#popMapShapes path{cursor:pointer;vector-effect:non-scaling-stroke;stroke:#fff!important;stroke-width:.55!important;stroke-linejoin:round;fill-rule:evenodd}
#popMapShapes path:focus{outline:none}#popMapView .climate-map-info{align-self:start}
#popMapView .pop-map-value{font-size:27px;font-weight:950;margin:10px 0 4px}
#popMapView .pop-map-details{font-size:12px;color:var(--muted);line-height:1.7}
@media(max-width:760px){#popMapView .climate-map-layout{grid-template-columns:1fr}#popMapView #popMapSvg{height:62vh;min-height:440px}}
`;document.head.append(style);
const sel=document.getElementById('popMapMetric'),g=document.getElementById('popMapShapes'),svg=document.getElementById('popMapSvg');
const metrics={
population:{title:'총인구',unit:'명',get:(r)=>Number(POP2024[r.id]?.total)},
sex:{title:'성비',unit:'',get:r=>{const p=POP2024[r.id];return p?.female>0?p.male/p.female*100:null}},
youth:{title:'유소년층 비율',unit:'%',get:r=>{const p=POP2024[r.id],a=AGE2024[r.id];return p?.total>0&&a?100*a.youth/p.total:null}},
adult:{title:'청장년층 비율',unit:'%',get:r=>{const p=POP2024[r.id],a=AGE2024[r.id];return p?.total>0&&a?100*a.adult/p.total:null}},
old:{title:'노년층 비율',unit:'%',get:r=>{const p=POP2024[r.id],a=AGE2024[r.id];return p?.total>0&&a?100*a.old/p.total:null}},
daytime:{title:'주간인구지수',unit:'',get:r=>{const d=window.KG_DAYTIME_2020?.[Number(r.id.slice(1))];return d&&d[0]>0?100*d[1]/d[0]:null}}
};
const palette=['#bc4d52','#de806d','#f0b7a0','#e4e9e9','#8eb7dc','#5485c8','#2857a2'];
const dayPalette=palette; // Same climate-temperature colors; retain 2020 daytime thresholds.
const dayCuts=[90,95,100,105,110,115];
let selected=null,initialized=false,view=[0,0,720,900],points=new Map(),lastDist=null;
const valid=n=>Number.isFinite(n)&&n>=0;
const fmt=(v,key)=>key==='population'?Math.round(v).toLocaleString('ko-KR'):v.toFixed(1);
const colorFor=(v,cuts,colors)=>{let i=0;while(i<cuts.length&&v>=cuts[i])i++;return colors[i]};
function build(){
 if(initialized)return;initialized=true;
 const source=study.querySelectorAll('path');
 source.forEach(p=>{const m=p.id.match(/^study_r(\d+)$/);if(!m)return;const item=p.cloneNode(false);item.removeAttribute('id');item.removeAttribute('style');item.removeAttribute('class');item.dataset.region='r'+m[1];item.setAttribute('fill-rule','evenodd');item.addEventListener('click',()=>{selected=item.dataset.region;paint()});g.append(item)});
}
function paint(){
 build();
 const key=sel.value,cfg=metrics[key],values=BANK.map(r=>cfg.get(r)).filter(valid).sort((a,b)=>a-b);
 // Quantile boundaries prevent large cities from flattening the visual contrast of smaller regions.
 const cuts=key==='daytime'?dayCuts:Array.from({length:6},(_,i)=>values[Math.min(values.length-1,Math.floor(values.length*(i+1)/7))]);
 const colors=key==='daytime'?dayPalette:palette;
 const row=new Map(BANK.map(r=>[r.id,r]));
 g.querySelectorAll('[data-region]').forEach(p=>{
 const r=row.get(p.dataset.region),v=r?cfg.get(r):null;
 let c=valid(v)?colorFor(v,cuts,colors):'#e5e7eb';
 if(p.dataset.region===selected){const rgb=[1,3,5].map(x=>parseInt(c.slice(x,x+2),16));c='#'+rgb.map(n=>Math.round(n*.62+255*.38).toString(16).padStart(2,'0')).join('')}
 p.style.setProperty('fill',c,'important');
 });
 document.getElementById('popMapSource').textContent=key==='daytime'?'2020년 인구총조사':'2024년 12월 주민등록인구';
 document.getElementById('popMapTitle').textContent=cfg.title;
 const label=(v)=>fmt(v,key)+(cfg.unit?' '+cfg.unit:'');
 const bound=(n)=>key==='population'?Math.round(n).toLocaleString('ko-KR'):n.toFixed(1);
 document.getElementById('popMapLegend').innerHTML=colors.map((color,i)=>{
 const bottom=i===0?null:cuts[i-1],top=i===6?null:cuts[i];
 const txt=bottom===null?bound(top)+' 미만':top===null?bound(bottom)+' 이상':bound(bottom)+' ~ '+bound(top)+' 미만';
 return '<div class="climate-legend-row"><span class="climate-swatch" style="background:'+color+'"></span><span>'+txt+(cfg.unit?' '+cfg.unit:'')+'</span></div>'
 }).join('')+'<div class="climate-legend-row"><span class="climate-swatch" style="background:#e5e7eb"></span><span>자료 없음</span></div>';
 const r=row.get(selected),v=r?cfg.get(r):null;
 let details='';
 if(key==='daytime'&&r){const d=window.KG_DAYTIME_2020?.[Number(r.id.slice(1))];if(d&&d[0]>0)details='<div class="pop-map-details">주간인구 '+Math.round(d[1]).toLocaleString('ko-KR')+'명 · 상주인구 '+Math.round(d[0]).toLocaleString('ko-KR')+'명</div>'}
 document.getElementById('popMapSelected').innerHTML=r?'<hr style="border:0;border-top:1px solid #d4dce8;margin:14px 0"><b>'+r.display+'</b><div class="pop-map-value">'+(valid(v)?label(v):'자료 없음')+'</div>'+details:'지도에서 지역을 선택하세요.';
}
sel.addEventListener('change',paint);
function openMap(){
 for(const id of ['popRankViewBtn','popCompositionViewBtn','popHistoryViewBtn'])document.getElementById(id)?.classList.remove('active');
 button.classList.add('active');
 for(const id of ['popExistingRanking','popCompositionView','popHistoryCompare'])document.getElementById(id)?.classList.add('hidden');
 wrap.classList.remove('hidden');paint();
}
button.addEventListener('click',openMap);
for(const id of ['popRankViewBtn','popCompositionViewBtn','popHistoryViewBtn'])document.getElementById(id)?.addEventListener('click',()=>{button.classList.remove('active');wrap.classList.add('hidden')});
function coord(e){const r=svg.getBoundingClientRect();return [(e.clientX-r.left)/r.width,(e.clientY-r.top)/r.height]}
function draw(){svg.setAttribute('viewBox',view.join(' '))}
svg.addEventListener('wheel',e=>{e.preventDefault();const [x,y]=coord(e),factor=Math.exp(e.deltaY*.0015),w=Math.max(90,Math.min(720,view[2]*factor)),h=w*900/720;view=[view[0]+x*(view[2]-w),view[1]+y*(view[3]-h),w,h];draw()},{passive:false});
svg.addEventListener('pointerdown',e=>{points.set(e.pointerId,coord(e));try{svg.setPointerCapture(e.pointerId)}catch(_){}});
svg.addEventListener('pointermove',e=>{if(!points.has(e.pointerId))return;const prev=points.get(e.pointerId),next=coord(e);points.set(e.pointerId,next);if(points.size===1){view[0]-=(next[0]-prev[0])*view[2];view[1]-=(next[1]-prev[1])*view[3];draw()}else if(points.size===2){const a=[...points.values()],dist=Math.hypot(a[0][0]-a[1][0],a[0][1]-a[1][1]);if(lastDist){const w=Math.max(90,Math.min(720,view[2]*lastDist/dist)),h=w*900/720;view[0]+=(view[2]-w)/2;view[1]+=(view[3]-h)/2;view[2]=w;view[3]=h;draw()}lastDist=dist}});
for(const event of ['pointerup','pointercancel','lostpointercapture'])svg.addEventListener(event,e=>{points.delete(e.pointerId);lastDist=null});
svg.addEventListener('dblclick',()=>{view=[0,0,720,900];draw()});
})();