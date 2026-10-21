
(function(){
'use strict';
const $=id=>document.getElementById(id),NS='http://www.w3.org/2000/svg';
const DATA={
 gyeongbu:{name:'경부선',color:'#3974F6',stops:['서울','대전','대구','경주','울산','부산']},
 jungang:{name:'중앙선',color:'#18A078',stops:['춘천','원주','제천','안동','대구','부산']},
 jungbu:{name:'중부선',color:'#E76F51',stops:['하남','이천','음성','진천','청주']},
 seoulyangyang:{name:'서울양양선',color:'#E99A22',stops:['서울','춘천','홍천','인제','양양']},
 yeongdong:{name:'영동선',color:'#06A6D8',stops:['인천','원주','평창','강릉']},
 gyeongin:{name:'경인선',color:'#D95B9A',stops:['서울','인천']},
 seohaean:{name:'서해안선',color:'#B1BE29',stops:['서울','당진','서산','보령','서천','군산','무안','목포']},
 honam:{name:'호남선',color:'#A05DD7',stops:['논산','익산','전주','광주','순천']}
};
const names={'서울':'서울특별시','대전':'대전광역시','대구':'대구광역시','울산':'울산광역시','부산':'부산광역시','광주':'광주광역시','인천':'인천광역시'};
const stations={'아산':'천안아산역','청주':'오송역','서울':'서울역','대전':'대전역','대구':'동대구역','경주':'경주역','울산':'울산역','부산':'부산역','원주':'만종역','단양':'단양역','안동':'안동역','영천':'영천역','횡성':'횡성역','평창':'평창역','강릉':'강릉역','동해':'동해역','익산':'익산역','전주':'전주역','남원':'남원역','여수':'여수엑스포역','정읍':'정읍역','광주':'광주송정역','목포':'목포역'};
// Multi-island administrative regions need a mainland/urban-core marker rather than
// the center of the entire bounding box (which can fall far out at sea).
// Coordinates use the same 720 × 900 viewBox as the embedded city/county map.
const overrides={
 '인천':{x:207,y:376}, // mainland Incheon, immediately west of Bucheon/Seoul
 '여수':{x:290,y:698}  // urban Yeosu, south of Suncheon
};
const rail=$('railRoadContent'),svg=$('roadSvg'),world=$('roadWorld'),lines=$('roadLines'),stopsLayer=$('roadStops'),vehicle=$('roadVehicle');
if(!rail||!svg)return;
const base=$('roadBase'),src=$('mapg');
if(src){src.querySelectorAll('path[data-id]').forEach(p=>{const clone=p.cloneNode(false);clone.removeAttribute('id');base.appendChild(clone)})}
const centers={};
if(src){src.querySelectorAll('path[data-id]').forEach(p=>{try{const b=p.getBBox();centers[p.dataset.id]={x:b.x+b.width/2,y:b.y+b.height/2}}catch(e){}})}
const bank=typeof BANK!=='undefined'?BANK:[];
function point(name){
 const key=names[name]||name;
 const b=bank.find(x=>x.name===key||x.name===key+'시'||x.name===key+'군');
 const pt=b&&centers[b.id];
 return overrides[name]||pt||{x:350,y:450};
}
const aliases={};
let index=0,playing=false,raf=0,zoom=1,pan={x:0,y:0},trainPoint=null;
const el=(tag,attrs={},txt)=>{const e=document.createElementNS(NS,tag);Object.entries(attrs).forEach(([k,v])=>e.setAttribute(k,v));if(txt!==undefined)e.textContent=txt;return e};
const route=()=>DATA[$('roadRoute').value],mode=()=>$('roadMode').value;
function camera(p,instant=false){
 if(!$('roadFollow').checked||!p)return;
 const targetZoom=3.1;zoom=targetZoom;
 pan={x:360-p.x*zoom,y:450-p.y*zoom};
 world.setAttribute('transform',`translate(${pan.x} ${pan.y}) scale(${zoom})`);
}
function transform(){world.setAttribute('transform',`translate(${pan.x} ${pan.y}) scale(${zoom})`)}
function fit(){
 zoom=1;pan={x:0,y:0};transform();
}
function draw(t){
 const r=route(),ps=r.stops.map(point);
 lines.replaceChildren();stopsLayer.replaceChildren();vehicle.replaceChildren();
 const overview=mode()==='study'&&$('roadOverview').checked;
 const segments=[];
 if(overview){
  const shared=new Map();
  Object.values(DATA).forEach(rr=>rr.stops.forEach((name,j)=>{
    if(!j)return;
    const a=rr.stops[j-1],b=name,key=[a,b].sort().join('|');
    if(!shared.has(key))shared.set(key,{a,b,routes:[]});
    shared.get(key).routes.push(rr);
  }));
  shared.forEach(seg=>{
    const a=point(seg.a),b=point(seg.b),multi=seg.routes.length>1;
    const path=el('path',{d:`M${a.x} ${a.y} L${b.x} ${b.y}`});
    path.style.setProperty('stroke',multi?'#64748b':seg.routes[0].color,'important');
    path.style.setProperty('stroke-width','3.6','important');
    path.style.opacity='.88';lines.appendChild(path);
  });
  const unique=new Set(Object.values(DATA).flatMap(rr=>rr.stops));
  unique.forEach(name=>{const p=point(name);stopsLayer.appendChild(el('circle',{cx:p.x,cy:p.y,r:3.7,stroke:'#64748b'}));});
 }
 for(let j=1;j<=index;j++)segments.push([ps[j-1],ps[j]]);
 if(t&&t.from&&t.to)segments.push([t.from,{x:t.from.x+(t.to.x-t.from.x)*t.frac,y:t.from.y+(t.to.y-t.from.y)*t.frac}]);
 segments.forEach(([a,b])=>{
  const path=el('path',{d:`M${a.x} ${a.y} L${b.x} ${b.y}`});
  path.style.setProperty('stroke',r.color,'important');
  path.style.setProperty('stroke-width',overview?'3.6':'4.5','important');
  lines.appendChild(path);
 });
 for(let j=0;j<=index;j++){
   const p=ps[j];stopsLayer.appendChild(el('circle',{cx:p.x,cy:p.y,r:5,stroke:r.color}));
   stopsLayer.appendChild(el('text',{x:p.x+9,y:p.y-9},r.stops[j]));
 }
 const p=t?{x:t.from.x+(t.to.x-t.from.x)*t.frac,y:t.from.y+(t.to.y-t.from.y)*t.frac}:ps[index];
 trainPoint=p;
 const g=el('g',{transform:`translate(${p.x} ${p.y})`});
 g.appendChild(el('circle',{r:13,fill:'#fff',stroke:r.color,'stroke-width':2}));
 g.appendChild(el('rect',{x:-9,y:-5,width:18,height:11,rx:3,fill:r.color}));
 g.appendChild(el('rect',{x:-5,y:-3,width:10,height:5,rx:1.5,fill:'#fff'}));
 g.appendChild(el('circle',{cx:-5,cy:7,r:2.4,fill:'#263447'}));
 g.appendChild(el('circle',{cx:5,cy:7,r:2.4,fill:'#263447'}));
 vehicle.appendChild(g);
 if(overview){transform()}else if($('roadFollow').checked)camera(p);else transform();
}
function info(){
 const r=route(),current=r.stops[index],next=r.stops[index+1],study=mode()==='study';
 $('roadOverviewLabel').style.display=study?'inline-flex':'none';
 const legend=$('roadLegend');
 legend.replaceChildren();
 const shown=study&&$('roadOverview').checked?Object.values(DATA):[r];
 shown.forEach(rr=>{const item=document.createElement('span');item.className='rail-legend-item';
 const sw=document.createElement('i');sw.style.background=rr.color;item.append(sw,document.createTextNode(rr.name));legend.append(item)});
 if(study&&$('roadOverview').checked){const item=document.createElement('span');item.className='rail-legend-item';const sw=document.createElement('i');sw.style.background='#64748b';item.append(sw,document.createTextNode('공통 구간'));legend.append(item)}
 
 $('roadCurrent').textContent=current;
 $('roadStation').textContent='경유 지역: '+(names[current]||current);
 $('roadRouteTitle').textContent=r.name;
 $('roadRouteTitle').style.color=r.color;
 $('roadMapProgress').textContent=(index+1)+' / '+r.stops.length;
 $('roadPrompt').textContent=next?(study?'다음 지역: '+next+' · 따라 입력하세요':'다음 경유 지역은 어디일까요?'):'노선 완주!';
 $('roadInput').placeholder=study&&next?next+' 입력':'시·군 이름 입력';
 $('roadInput').disabled=!next||playing;
 $('roadSubmit').disabled=!next||playing;
 $('roadVisited').replaceChildren(...r.stops.slice(0,index+1).map(n=>{const span=document.createElement('span');span.textContent=n;return span}));
}
function moveNext(){
 if(playing||index>=route().stops.length-1)return;
 playing=true;info();
 const from=point(route().stops[index]),to=point(route().stops[index+1]),start=performance.now();
 const duration=1600;
 function tick(now){
   const u=Math.min(1,(now-start)/duration),smooth=u*u*(3-2*u);
   draw({from,to,frac:smooth});
   if(u<1){raf=requestAnimationFrame(tick)}else{
     index++;playing=false;draw();info();
     $('roadFeedback').textContent=index===route().stops.length-1?'완주! 전체 주요 경유 지역을 통과했습니다.':'도착! 다음 지역을 입력하세요.';
     $('roadInput').focus();
   }
 }
 raf=requestAnimationFrame(tick);
}
function reset(){
 cancelAnimationFrame(raf);playing=false;index=0;
 $('roadInput').value='';$('roadFeedback').textContent=mode()==='quiz'?'다음 경유 지역을 맞혀 차량을 움직여 보세요.':'표시된 다음 지역 이름을 입력해 보세요.';
 if(mode()==='study'&&$('roadOverview').checked){fit()}else if(!$('roadFollow').checked){fit()}
 draw();info();
}
$('roadForm').addEventListener('submit',e=>{
 e.preventDefault();if(playing)return;
 const r=route(),next=r.stops[index+1];if(!next)return;
 const v=$('roadInput').value.trim().replace(/\s+/g,'');
 const accepted=aliases[next]||[next,next+'시',next+'군',names[next]];
 if(!accepted.filter(Boolean).some(x=>x.replace(/\s+/g,'')===v)){
   $('roadFeedback').textContent='다시 시도해 보세요. 현재 위치에서 이동하지 않습니다.';
   $('roadInput').select();return;
 }
 $('roadFeedback').textContent='정답! '+next+'(으)로 이동 중…';
 $('roadInput').value='';moveNext();
});
$('roadRoute').addEventListener('change',reset);$('roadMode').addEventListener('change',()=>{
 $('roadOverview').checked=false;reset();
});
$('roadOverview').addEventListener('change',()=>{
 if($('roadOverview').checked){$('roadFollow').checked=false;fit();}
 draw();info();
});
$('roadRestart').addEventListener('click',reset);
$('roadFollow').addEventListener('change',()=>{if($('roadFollow').checked)camera(trainPoint);else fit()});
$('roadZoomIn').addEventListener('click',()=>{zoom=Math.min(5,zoom*1.25);pan={x:360-trainPoint.x*zoom,y:450-trainPoint.y*zoom};transform();$('roadFollow').checked=false});
$('roadZoomOut').addEventListener('click',()=>{zoom=Math.max(.7,zoom/1.25);pan={x:360-trainPoint.x*zoom,y:450-trainPoint.y*zoom};transform();$('roadFollow').checked=false});
$('roadFit').addEventListener('click',()=>{$('roadFollow').checked=false;fit()});

// v6.3.3: iPad/Safari touch pinch-zoom and drag-pan for railway map.
const railPointers=new Map();
let gestureStart=null;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function svgPoint(evt){
 const rect=svg.getBoundingClientRect();
 return {x:(evt.clientX-rect.left)*720/rect.width,y:(evt.clientY-rect.top)*900/rect.height};
}
function pointerMid(){
 const a=[...railPointers.values()];
 if(a.length===1)return {x:a[0].x,y:a[0].y};
 return {x:(a[0].x+a[1].x)/2,y:(a[0].y+a[1].y)/2};
}
function pointerDistance(){
 const a=[...railPointers.values()];
 return a.length>=2?Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y):0;
}
function gestureSnapshot(){
 if(!railPointers.size){gestureStart=null;return}
 const mid=pointerMid();
 gestureStart={mid,dist:pointerDistance(),zoom,pan:{...pan}};
}
svg.addEventListener('pointerdown',e=>{
 if(e.pointerType==='mouse'&&e.button!==0)return;
 const p=svgPoint(e);railPointers.set(e.pointerId,p);
 try{svg.setPointerCapture(e.pointerId)}catch(_){}
 $('roadFollow').checked=false;
 gestureSnapshot();
 e.preventDefault();
},{passive:false});
svg.addEventListener('pointermove',e=>{
 if(!railPointers.has(e.pointerId))return;
 railPointers.set(e.pointerId,svgPoint(e));
 if(!gestureStart)return;
 const mid=pointerMid();
 if(railPointers.size>=2&&gestureStart.dist>0){
  const z=clamp(gestureStart.zoom*pointerDistance()/gestureStart.dist,.65,7);
  const worldX=(gestureStart.mid.x-gestureStart.pan.x)/gestureStart.zoom;
  const worldY=(gestureStart.mid.y-gestureStart.pan.y)/gestureStart.zoom;
  zoom=z;
  pan={x:mid.x-worldX*z,y:mid.y-worldY*z};
 }else{
  pan={x:gestureStart.pan.x+mid.x-gestureStart.mid.x,y:gestureStart.pan.y+mid.y-gestureStart.mid.y};
 }
 transform();e.preventDefault();
},{passive:false});
function releasePointer(e){if(railPointers.delete(e.pointerId))gestureSnapshot()}
svg.addEventListener('pointerup',releasePointer);
svg.addEventListener('pointercancel',releasePointer);
svg.addEventListener('lostpointercapture',releasePointer);
svg.addEventListener('wheel',e=>{
 const p=svgPoint(e),z=clamp(zoom*Math.exp(-e.deltaY*.0015),.65,7);
 const wx=(p.x-pan.x)/zoom,wy=(p.y-pan.y)/zoom;
 zoom=z;pan={x:p.x-wx*z,y:p.y-wy*z};
 $('roadFollow').checked=false;transform();e.preventDefault();
},{passive:false});

$('railSubRoad').addEventListener('click',reset);
reset();
})();
