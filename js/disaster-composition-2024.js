(function(){
'use strict';
const regions=[
["서울",218700,195310,0,0],["부산",2290816,0,0,0],["대구",1877162,0,0,0],
["인천",502939,784554,18343,0],["광주",56473,0,0,0],["대전",15899750,0,0,0],
["울산",6326,0,877,0],["세종",1603184,0,0,0],["경기",25019549,392137361,61097,0],
["강원",1993309,9350276,0,0],["충북",30646385,27747052,0,0],
["충남",190611845,16647130,24434,0],["전북",64981326,6342210,0,945965],
["전남",35420127,60946,0,0],["경북",35904755,475669,0,0],
["경남",16914779,435488,1591,0],["제주",0,0,0,0]
];
const disasters=["호우","대설","태풍","지진"];
const disasterColors=["#3979eb","#87abf3","#bdd2f8","#dce7fc"];
const regionColors=["#2669e4","#397bea","#518af0","#6699f1","#7ca8f3","#8db5f4","#a0c2f6","#b0ccf8","#c0d7fa","#d0e1fb","#2c65ba","#4580c6","#6096d1","#78a9df","#98bfe8","#b7d4f1","#dce9fa"];
const root=document.getElementById("climateRankingPanel");
const tabs=root&&root.querySelector(".climate-view-tabs");
if(!root||!tabs||document.getElementById("disasterCompositionView"))return;
const btn=document.createElement("button");btn.id="climateDisasterViewBtn";btn.type="button";btn.textContent="자연재해";tabs.appendChild(btn);
const panel=document.createElement("section");panel.id="disasterCompositionView";panel.className="card hidden";
panel.innerHTML='<h2>자연재해 피해액 구성</h2><div class="small">2024년 재해연보 · 피해액 기준 100% 누적 막대그래프</div><div class="disaster-switch"><button type="button" class="active" data-dmode="disaster" aria-pressed="true">재해별 구성</button><button type="button" data-dmode="region" aria-pressed="false">지역별 구성</button></div><div class="disaster-legend" id="disasterLegend"></div><div class="disaster-rows" id="disasterRows"></div><div class="disaster-detail" id="disasterDetail" aria-live="polite">막대의 구간을 누르면 피해액과 구성비를 볼 수 있습니다.</div><div class="disaster-note">각 막대의 합계를 100%로 표시합니다. 피해액이 0원인 지역은 구성비를 계산하지 않습니다. 출처: 행정안전부 「2024 재해연보」 4-2.10 시도별·연도별·원인별 피해현황 (원자료 단위: 천 원).</div>';
root.appendChild(panel);
const style=document.createElement("style");style.id="disasterCompositionStyle";style.textContent="\n#disasterCompositionView{padding:clamp(16px,3vw,28px);margin-top:12px}\n#disasterCompositionView h2{margin:0 0 10px;font-size:clamp(20px,4.5vw,26px)}\n#disasterCompositionView .small{color:#768296;font-size:13px}\n.disaster-switch{display:flex;border:1px solid #dae0e9;border-radius:15px;padding:5px;gap:5px;margin:20px 0 17px}\n.disaster-switch button{flex:1;border:0;border-radius:12px;padding:12px 6px;background:transparent;color:#78859b;font-size:14px;font-weight:700;cursor:pointer}\n.disaster-switch button.active{background:#e8f0fe;color:#2765be}\n.disaster-legend{display:flex;flex-wrap:wrap;gap:9px 14px;margin-bottom:22px}\n.disaster-legend button{display:inline-flex;align-items:center;gap:6px;border:0;background:transparent;color:#657182;font-size:12px;padding:0;cursor:pointer}\n.disaster-swatch{display:inline-block;width:12px;height:12px;border-radius:3px}\n.disaster-rows{display:grid;gap:13px}\n.disaster-row{display:grid;grid-template-columns:42px minmax(0,1fr);align-items:center;gap:7px}\n.disaster-row-name{font-weight:750;font-size:14px;color:#1d2637}\n.disaster-bar{display:flex;height:34px;overflow:hidden;border-radius:5px;background:#eef2f7;width:100%;min-width:0;gap:0!important}\n.disaster-segment{display:flex;align-items:center;justify-content:center;min-width:0;position:relative;padding:0!important;margin:0!important;border:0!important;border-right:1px solid #ffffff50!important;border-radius:0!important;box-shadow:none!important;outline-offset:-2px;color:#101827;font-size:clamp(9px,1.2vw,12px);font-weight:750;cursor:pointer;white-space:nowrap;overflow:hidden;line-height:1!important;appearance:none;-webkit-appearance:none}\n.disaster-segment:first-child{color:#101827}\n.disaster-segment:focus-visible,.disaster-legend button:focus-visible{outline:2px solid #1d4fd5;outline-offset:-2px;z-index:1}\n.disaster-row-total{text-align:right;color:#748095;font-size:11px;white-space:nowrap}\n.disaster-no-data{display:flex;align-items:center;justify-content:center;height:34px;width:100%;color:#8190a1;background:#f0f4fa;border-radius:7px;font-size:12px}\n.disaster-detail{margin-top:20px;border-radius:12px;background:#f5f7fb;padding:14px 15px;font-size:13px;line-height:1.65;color:#536174}\n.disaster-detail strong{display:block;color:#243247;font-size:15px;margin-bottom:2px}\n.disaster-note{margin-top:13px;color:#7c8797;font-size:11px;line-height:1.6}\n@media(max-width:540px){.disaster-row{grid-template-columns:36px minmax(0,1fr);gap:5px}.disaster-rows{gap:13px}.disaster-bar,.disaster-no-data{height:30px}.disaster-segment{font-size:9px}.disaster-legend{gap:8px}}\n";document.head.appendChild(style);
const legend=panel.querySelector("#disasterLegend"),rows=panel.querySelector("#disasterRows"),detail=panel.querySelector("#disasterDetail");
let mode="disaster";
const sum=arr=>arr.reduce((a,b)=>a+b,0);
const money=v=>v>=100000?(v/100000).toLocaleString("ko-KR",{maximumFractionDigits:2})+"억 원":v>=10000?(v/10000).toLocaleString("ko-KR",{maximumFractionDigits:2})+"천만 원":(v*1000).toLocaleString("ko-KR")+"원";
function detailShow(main,category,value,total){
 detail.replaceChildren();
 const strong=document.createElement("strong");strong.textContent=main+" · "+category;
 const desc=document.createElement("div");desc.textContent=money(value)+" · "+(value*100/total).toLocaleString("ko-KR",{maximumFractionDigits:3})+"% · 원자료 "+value.toLocaleString("ko-KR")+"천 원";
 detail.append(strong,desc);
}
function draw(){
 const byDisaster=mode==="disaster";
 const names=byDisaster?regions.map(r=>r[0]):disasters;
 const colors=byDisaster?regionColors:disasterColors;
 const collection=byDisaster?disasters.map((n,i)=>({name:n,values:regions.map(r=>r[i+1])})):regions.map(r=>({name:r[0],values:r.slice(1)}));
 legend.replaceChildren();rows.replaceChildren();
 names.forEach((name,i)=>{
  const b=document.createElement("button");b.type="button";
  const sw=document.createElement("i");sw.className="disaster-swatch";sw.style.background=colors[i];
  const tx=document.createElement("span");tx.textContent=name;b.append(sw,tx);
  b.addEventListener("click",()=>{const row=collection.find(r=>r.values[i]>0);if(row)detailShow(row.name,name,row.values[i],sum(row.values));});
  legend.appendChild(b);
 });
 collection.forEach(row=>{
  const line=document.createElement("div");line.className="disaster-row";
  const name=document.createElement("span");name.className="disaster-row-name";name.textContent=row.name;
  const bar=document.createElement("div");bar.className="disaster-bar";
  
  const total=sum(row.values);
  if(total===0){const empty=document.createElement("div");empty.className="disaster-no-data";empty.textContent="피해 집계 없음";bar.appendChild(empty);}
  else row.values.forEach((value,i)=>{
   if(value===0)return;
   const percent=value*100/total;
   const seg=document.createElement("button");seg.type="button";seg.className="disaster-segment";
   seg.style.background=colors[i];seg.style.flex=String(value)+" 1 0%";
   if(percent>=8)seg.textContent=percent.toFixed(1)+"%";
   seg.title=row.name+" · "+names[i]+": "+money(value)+" ("+percent.toFixed(2)+"%)";
   seg.setAttribute("aria-label",seg.title);
   seg.addEventListener("click",()=>detailShow(row.name,names[i],value,total));
   bar.appendChild(seg);
  });
  line.append(name,bar);rows.appendChild(line);
 });
 detail.textContent="막대의 구간을 누르면 피해액과 구성비를 볼 수 있습니다.";
}
panel.querySelectorAll("[data-dmode]").forEach(b=>b.addEventListener("click",()=>{
 mode=b.dataset.dmode;
 panel.querySelectorAll("[data-dmode]").forEach(x=>{const on=x===b;x.classList.toggle("active",on);x.setAttribute("aria-pressed",String(on));});
 draw();
}));
btn.addEventListener("click",()=>{
 ["climateMapView","climateRankView","climateQuizView"].forEach(id=>document.getElementById(id)?.classList.add("hidden"));
 tabs.querySelectorAll("button").forEach(b=>b.classList.toggle("active",b===btn));panel.classList.remove("hidden");
});
tabs.querySelectorAll("button").forEach(b=>{if(b!==btn)b.addEventListener("click",()=>{panel.classList.add("hidden");btn.classList.remove("active");});});
draw();
})();