
const config={apiKey:"AIzaSyBqZhLxZTx3UissdLtPdhve460ip8fVHro",authDomain:"korea-geography.firebaseapp.com",projectId:"korea-geography",appId:"1:344199187741:web:1c9a655659e604a2dce5f4"};
const el=id=>document.getElementById(id);
const status=el('kgAuthStatus'),login=el('kgSignIn'),logout=el('kgSignOut'),uidLabel=el('kgUid');
const coreInfo=el('kgCoreInfo'),coreMsg=el('kgCoreMessage');
const base={};for(const [id,n] of Object.entries(ATLAS_NOTES))base[id]=[...(n.core||[])];
let doc,collection,query,where,limit,onSnapshot,runTransaction,serverTimestamp,setDoc,updateDoc;
let auth,db,me=null,member=null,current=null,overridesReady=false,unsubMember=null,unsubHistory=null,unsubMembers=null,historyCache=[];
const cleanText=v=>String(v||'').trim();
const validCore=arr=>Array.isArray(arr)&&arr.length<=40&&arr.every(x=>typeof x==='string'&&x.length>0&&x.length<=160);
function canEdit(){return !!me&&!!member&&member.active===true&&['admin','editor'].includes(member.role)}
function isAdmin(){return canEdit()&&member.role==='admin'}
function reflect(){el('kgCoreEdit').hidden=!canEdit();el('kgAdminPanel').hidden=!isAdmin();if(!canEdit())el('kgCoreEditor').hidden=true;
 coreInfo.textContent=!overridesReady?'서버 동기화 연결 중 · 기존 자료를 보여줍니다.':canEdit()?'승인된 편집자 · 저장한 개념은 도감·지도학습·다음 핵심개념 퀴즈에 공유됩니다.':'읽기 전용 · 기존 자료 및 공동 편집 개념을 볼 수 있습니다.';
 if(me)status.textContent=(member?.nickname||me.displayName||'Google 사용자')+' · 로그인됨 ('+(isAdmin()?'관리자':canEdit()?'편집자':'읽기 전용')+')';
 if(current)el('kgCoreEdit').hidden=!canEdit();window.dispatchEvent(new Event('kg-city-auth-changed'));}
function setCurrent(id){current=id;el('kgCoreEditor').hidden=true;coreMsg.textContent='';historyCache=[];el('kgCoreHistory').textContent='기록을 불러오는 중…';reflect();if(unsubHistory){unsubHistory();unsubHistory=null;}if(!db||!id)return;
 unsubHistory=onSnapshot(query(collection(db,'conceptHistory'),where('regionId','==',id),limit(100)),snap=>{
 historyCache=snap.docs.map(d=>d.data()).sort((a,b)=>(b.at?.seconds||0)-(a.at?.seconds||0)).slice(0,15);
 const out=el('kgCoreHistory');out.replaceChildren();if(!historyCache.length){out.textContent='아직 편집 기록이 없습니다.';return;}
 for(const h of historyCache){const item=document.createElement('div');item.className='kg-history-item';const who=document.createElement('b');who.textContent=h.nickname||'편집자';const time=document.createElement('span');time.textContent=' · '+(h.at?.toDate?.()?.toLocaleString('ko-KR')||'시간 확인 중')+' · '+(h.action||'수정');const change=document.createElement('div');change.className='kg-history-change';change.textContent='이전: '+(h.before||[]).join(' / ')+'\n변경: '+(h.after||[]).join(' / ');item.append(who,time,change);out.append(item);}
 },err=>{el('kgCoreHistory').textContent='기록을 불러오지 못했습니다: '+err.code});
}
window.KGCore={selectRegion:setCurrent,openStudy(id){
 const panel=el('studyNotesPanel'); if(!panel||!id)return;
 panel.appendChild(el('kgCoreCard'));setCurrent(id);
 if(canEdit()){el('kgCoreInput').value=(ATLAS_NOTES[id]?.core||[]).join('\n');el('kgCoreEditor').hidden=false;}
 else coreMsg.textContent='현재 계정에 편집 권한이 없습니다. 상단 권한 표시를 확인해 주세요.';
 }};
el('kgCoreEdit').onclick=()=>{if(!canEdit()||!current)return;el('kgCoreInput').value=(ATLAS_NOTES[current]?.core||[]).join('\n');el('kgCoreEditor').hidden=false;coreMsg.textContent='';};
el('kgCoreCancel').onclick=()=>el('kgCoreEditor').hidden=true;
let saveBusy=false;
el('kgCoreSave').onclick=async()=>{
 if(!canEdit()||!current||saveBusy)return;
 const id=current,arr=el('kgCoreInput').value.split(/\r?\n/).map(cleanText).filter(Boolean);
 if(!validCore(arr)){coreMsg.textContent='최대 40개 개념, 개념별 160자 이내로 입력해 줘.';return;}
 if(new Set(arr).size!==arr.length){coreMsg.textContent='동일한 핵심개념이 중복되어 있어.';return;}
 saveBusy=true;el('kgCoreSave').disabled=true;coreMsg.textContent='저장 중…';
 try{
  const ref=doc(db,'concepts',id),logref=doc(collection(db,'conceptHistory'));
  await runTransaction(db,async tx=>{
   const snap=await tx.get(ref);const before=snap.exists()?snap.data().core:(base[id]||[]);
   if(!validCore(before))throw Error('기존 데이터 형식 오류');
   if(JSON.stringify(before)===JSON.stringify(arr))throw Error('변경 내용이 없어.');
   const removed=before.filter(x=>!arr.includes(x)),added=arr.filter(x=>!before.includes(x));
   const action=removed.length&&!added.length?'삭제':added.length&&!removed.length?'추가':'수정';
   tx.set(ref,{core:arr,logId:logref.id,updatedAt:serverTimestamp(),updatedBy:me.uid,nickname:member.nickname||me.displayName||'편집자'});
   tx.set(logref,{regionId:id,before,after:arr,action,uid:me.uid,nickname:member.nickname||me.displayName||'편집자',at:serverTimestamp()});
  });coreMsg.textContent='저장했어. 다른 사용자에게도 반영돼.';el('kgCoreEditor').hidden=true;
 }catch(err){coreMsg.textContent='저장 실패: '+(err.code||err.message)}finally{saveBusy=false;el('kgCoreSave').disabled=false;}
};
let initializeDone=false;
try{
 const [{initializeApp},{getAuth,GoogleAuthProvider,signInWithPopup,signInWithRedirect,getRedirectResult,onAuthStateChanged,signOut},{getFirestore,getDoc,doc:docFn,collection:collectionFn,query:queryFn,where:whereFn,limit:limitFn,onSnapshot:onSnapshotFn,runTransaction:runTransactionFn,serverTimestamp:serverTimestampFn,setDoc:setDocFn,updateDoc:updateDocFn}]=await Promise.all([
 import('https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js'),import('https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js'),import('https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js')]);
 ({doc,collection,query,where,limit,onSnapshot,runTransaction,serverTimestamp,setDoc,updateDoc}={doc:docFn,collection:collectionFn,query:queryFn,where:whereFn,limit:limitFn,onSnapshot:onSnapshotFn,runTransaction:runTransactionFn,serverTimestamp:serverTimestampFn,setDoc:setDocFn,updateDoc:updateDocFn});
 const app=initializeApp(config);auth=getAuth(app);db=getFirestore(app);initializeDone=true;
 window.KGCityConcepts={
  canEdit:()=>canEdit(),
  subscribe(city,district,callback){
   const key='city_'+city+'_'+district;
   return onSnapshot(doc(db,'concepts',key),snap=>callback({core:snap.exists()&&Array.isArray(snap.data().core)?snap.data().core:[],canEdit:canEdit()}),err=>callback({error:err.code||err.message,canEdit:canEdit()}));
  },
  subscribeHistory(city,district,callback){
   const key='city_'+city+'_'+district;
   return onSnapshot(query(collection(db,'conceptHistory'),where('regionId','==',key),limit(100)),snap=>{
    const rows=snap.docs.map(d=>d.data()).sort((a,b)=>(b.at?.seconds||0)-(a.at?.seconds||0)).slice(0,15);
    callback({rows});
   },err=>callback({error:err.code||err.message}));
  },
  async save(city,district,lines){
   if(!canEdit())throw Error('편집 권한이 없습니다. 관리자 또는 승인된 편집자로 로그인해 주세요.');
   const core=lines.map(cleanText).filter(Boolean);
   if(!validCore(core))throw Error('최대 40개, 항목당 160자 이내로 입력해 주세요.');
   const id='city_'+city+'_'+district,ref=doc(db,'concepts',id),logref=doc(collection(db,'conceptHistory'));
   await runTransaction(db,async tx=>{
    const snap=await tx.get(ref),before=snap.exists()&&Array.isArray(snap.data().core)?snap.data().core:[];
    tx.set(ref,{core,city,district,updatedAt:serverTimestamp(),updatedBy:me.uid,nickname:member.nickname||me.displayName||'편집자'});
    tx.set(logref,{regionId:id,city,district,before,after:core,uid:me.uid,nickname:member.nickname||me.displayName||'편집자',at:serverTimestamp()});
   });
  }
 };
 window.dispatchEvent(new Event('kg-city-firebase-ready'));
 window.KGClimateCloud={uid:null,load:async()=>{if(!auth.currentUser)return null;const snap=await getDoc(doc(db,'climateFavorites',auth.currentUser.uid));return snap.exists()?snap.data():null;},save:async data=>{if(!auth.currentUser)throw Error('로그인 필요');await setDoc(doc(db,'climateFavorites',auth.currentUser.uid),data,{merge:true});}};
 login.onclick=async()=>{login.disabled=true;status.textContent='Google 로그인 진행 중…';try{await signInWithPopup(auth,new GoogleAuthProvider())}catch(e){if(['auth/popup-blocked','auth/operation-not-supported-in-this-environment'].includes(e.code)){try{await signInWithRedirect(auth,new GoogleAuthProvider())}catch(re){status.textContent='로그인 실패: '+(re.code||re.message)}}else status.textContent='로그인 실패: '+(e.code||e.message)}finally{login.disabled=false}};
 logout.onclick=()=>signOut(auth).catch(e=>status.textContent='로그아웃 실패: '+e.code);
 onSnapshot(collection(db,'concepts'),snap=>{
  // A missing document means original HTML notes; an existing empty array means intentionally removed all concepts.
  for(const [id,items] of Object.entries(base)){if(!ATLAS_NOTES[id])ATLAS_NOTES[id]={};ATLAS_NOTES[id].core=[...items];}
  snap.forEach(d=>{if(!/^r\d+$/.test(d.id)||!BANK.some(x=>x.id===d.id))return;const arr=d.data().core;if(validCore(arr)){if(!ATLAS_NOTES[d.id])ATLAS_NOTES[d.id]={};ATLAS_NOTES[d.id].core=[...arr];}});
  overridesReady=true;reflect();window.dispatchEvent(new Event('kg-core-changed'));
 },e=>{coreInfo.textContent='공동 자료 동기화 실패: '+e.code+' · 기존 학습 자료만 사용 중';});
 function watchMembers(){if(unsubMembers)unsubMembers();unsubMembers=null;if(!isAdmin())return;
  unsubMembers=onSnapshot(collection(db,'members'),snap=>{const list=el('kgMemberList');list.replaceChildren();snap.forEach(d=>{const m=d.data(),row=document.createElement('div');row.className='kg-member-line';const label=document.createElement('span');label.textContent=(m.nickname||'사용자')+' · '+m.role+' · '+(m.active?'활성':'비활성')+' · '+d.id;row.append(label);if(d.id!==me.uid){const btn=document.createElement('button');btn.textContent=m.active?'권한 중지':'다시 승인';btn.onclick=async()=>{if(!confirm('이 사용자의 권한을 변경할까?'))return;try{await updateDoc(doc(db,'members',d.id),{active:!m.active})}catch(e){el('kgAdminMessage').textContent=e.code||e.message}};row.append(btn)}list.append(row);});},e=>el('kgAdminMessage').textContent=e.code||e.message);
 }
 el('kgFriendApprove').onclick=async()=>{if(!isAdmin())return;const uid=cleanText(el('kgFriendUid').value),nickname=cleanText(el('kgFriendNick').value);if(!/^[a-zA-Z0-9]{20,128}$/.test(uid)||!nickname||nickname.length>32){el('kgAdminMessage').textContent='정확한 UID와 1~32자 닉네임을 입력해 줘.';return;}if(uid===me.uid){el('kgAdminMessage').textContent='관리자 계정은 변경할 수 없어.';return;}try{await setDoc(doc(db,'members',uid),{role:'editor',active:true,nickname});el('kgAdminMessage').textContent=nickname+' 편집 권한을 승인했어.';el('kgFriendUid').value='';el('kgFriendNick').value='';}catch(e){el('kgAdminMessage').textContent='승인 실패: '+(e.code||e.message)}};
 onAuthStateChanged(auth,user=>{
  window.KGClimateCloud.uid=user?.uid||null;window.dispatchEvent(new CustomEvent('kg-climate-auth',{detail:{uid:user?.uid||null}}));
  me=user;member=null;if(unsubMember)unsubMember();unsubMember=null;if(unsubMembers)unsubMembers();unsubMembers=null;
  login.hidden=!!user;logout.hidden=!user;uidLabel.hidden=!user;uidLabel.textContent=user?'UID: '+user.uid:'';
  if(!user){status.textContent='로그인하지 않음 · 학습 기능 이용 가능';reflect();return;}
  status.textContent='편집 권한 확인 중…';
  let received=false;
  const myRef=doc(db,'members',user.uid);
  unsubMember=onSnapshot(myRef,snap=>{if(auth.currentUser?.uid!==user.uid)return;received=true;member=snap.exists()?snap.data():null;reflect();watchMembers();},e=>{if(auth.currentUser?.uid!==user.uid)return;received=true;member=null;reflect();status.textContent='권한 확인 실패: '+(e.code||e.message)+' · Firestore 규칙의 members 자기 문서 읽기 확인';});
  // Retry a direct member read if a snapshot listener is delayed (e.g. iPad Safari networking).
  getDoc(myRef).then(snap=>{if(received||auth.currentUser?.uid!==user.uid)return;member=snap.exists()?snap.data():null;reflect();watchMembers();}).catch(e=>{if(received||auth.currentUser?.uid!==user.uid)return;reflect();status.textContent='권한 확인 실패: '+(e.code||e.message)+' · Firestore 규칙의 members 자기 문서 읽기 확인';});
  setTimeout(()=>{if(!received&&auth.currentUser?.uid===user.uid&&!member)status.textContent='권한 확인 지연 · 네트워크/Firestore 규칙 확인 필요 (새로고침 후 재시도)';},8000);
 },e=>status.textContent='로그인 확인 실패: '+e.code);
 getRedirectResult(auth).catch(e=>status.textContent='로그인 결과 오류: '+e.code);
}catch(e){status.textContent='Firebase 초기화 실패: '+(e.code||e.message);coreInfo.textContent='기존 학습 자료는 계속 이용할 수 있어.';login.hidden=false;}
