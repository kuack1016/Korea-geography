// Separate Firestore collection; shares existing Firebase application and the same member permissions.
import {getApps,initializeApp,getApp} from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js';
import {getAuth,onAuthStateChanged} from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js';
import {getFirestore,collection,doc,onSnapshot,addDoc,updateDoc,deleteDoc,getDoc,serverTimestamp} from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js';
const config={apiKey:'AIzaSyBqZhLxZTx3UissdLtPdhve460ip8fVHro',authDomain:'korea-geography.firebaseapp.com',projectId:'korea-geography',appId:'1:344199187741:web:1c9a655659e604a2dce5f4'};
const el=id=>document.getElementById(id);
const app=getApps().length?getApp():initializeApp(config),auth=getAuth(app),db=getFirestore(app);
const list=el('notesList'),state=el('notesStatus'),editor=el('notesEditor'),add=el('notesAdd');
let notes=[],user=null,member=null,memberUnsub=null,editing=null,busy=false;
const canEdit=()=>!!user&&member?.active===true&&['admin','editor'].includes(member.role);
const toDate=v=>v?.toDate?.()?.toLocaleDateString('ko-KR')||'';
const getTime=v=>v?.seconds||0;
const tags=v=>String(v||'').split(',').map(x=>x.trim()).filter(Boolean).slice(0,12);
function elem(tag,text,cls){const x=document.createElement(tag);if(text!=null)x.textContent=text;if(cls)x.className=cls;return x}
function resetEditor(){editing=null;editor.reset();editor.hidden=true;el('notesEditorMessage').textContent='';el('notesDelete').hidden=true}
function openEditor(item){if(!canEdit())return;editing=item?.id||null;editor.hidden=false;el('notesEditorTitle').textContent=item?'노트 수정':'새 노트';el('notesTitle').value=item?.title||'';el('notesGroup').value=item?.category||'';el('notesTags').value=(item?.tags||[]).join(', ');el('notesBody').value=item?.body||'';el('notesDelete').hidden=!item;el('notesEditorMessage').textContent='';editor.scrollIntoView({block:'start',behavior:'smooth'});el('notesTitle').focus()}
function render(){
 add.hidden=!canEdit();list.replaceChildren();
 const allCats=[...new Set(notes.map(x=>x.category).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'ko'));
 const sel=el('notesCategory'),keep=sel.value;sel.replaceChildren(new Option('전체 분류',''));el('notesGroups').replaceChildren();
 for(const cat of allCats){sel.add(new Option(cat,cat));const op=elem('option');op.value=cat;el('notesGroups').append(op)}sel.value=allCats.includes(keep)?keep:'';
 const q=el('notesSearch').value.trim().toLocaleLowerCase(),cat=sel.value;
 const rows=notes.filter(n=>(!cat||n.category===cat)&&(!q||[n.title,n.body,n.category,...(n.tags||[])].join(' ').toLocaleLowerCase().includes(q)));
 rows.sort(el('notesSort').value==='title'?(a,b)=>a.title.localeCompare(b.title,'ko'):(a,b)=>getTime(b.updatedAt)-getTime(a.updatedAt));
 if(!rows.length){list.append(elem('div',notes.length?'검색 결과가 없어.':'아직 등록된 노트가 없어.','placeholder'));return}
 for(const item of rows){const box=elem('details',null,'card notes-item');const sum=elem('summary');sum.append(elem('div',item.category||'미분류','notes-meta'),elem('h3',item.title),elem('div','최근 수정 '+(toDate(item.updatedAt)||'확인 중'),'notes-meta'));box.append(sum);
 box.append(elem('div',item.body,'notes-text'));const tagrow=elem('div',null,'notes-tags');for(const t of item.tags||[])tagrow.append(elem('span','#'+t,'notes-tag'));box.append(tagrow);
 if(canEdit()){const actions=elem('div',null,'notes-item-actions'),btn=elem('button','수정');btn.type='button';btn.addEventListener('click',()=>openEditor(item));actions.append(btn);box.append(actions)}
 list.append(box)}
}
function noteStatus(s){state.textContent=s}
function refresh(){render();if(!canEdit())resetEditor()}
add.addEventListener('click',()=>openEditor(null));el('notesCancel').addEventListener('click',resetEditor);
el('notesSearch').addEventListener('input',render);el('notesSort').addEventListener('change',render);
el('notesCategory').addEventListener('change',()=>{const cat=el('notesCategory').value;render();el('notesCategory').value=cat; // render uses the previous selected value
});
editor.addEventListener('submit',async ev=>{ev.preventDefault();if(!canEdit()||busy)return;
 const title=el('notesTitle').value.trim(),body=el('notesBody').value.trim(),category=el('notesGroup').value.trim()||'미분류',taglist=[...new Set(tags(el('notesTags').value))];
 if(!title||!body)return;
 busy=true;el('notesSave').disabled=true;el('notesEditorMessage').textContent='저장 중…';
 try{const data={title,body,category,tags:taglist,updatedAt:serverTimestamp(),updatedBy:user.uid,nickname:member.nickname||user.displayName||'편집자'};
 if(editing)await updateDoc(doc(db,'peripheralNotes',editing),data);else await addDoc(collection(db,'peripheralNotes'),{...data,createdAt:serverTimestamp(),createdBy:user.uid});
 resetEditor();noteStatus('저장 완료 · 다른 사용자에게도 동기화돼.');
 }catch(e){el('notesEditorMessage').textContent='저장 실패: '+(e.code||e.message)+' · Firestore 보안 규칙 확인'}finally{busy=false;el('notesSave').disabled=false}
});
el('notesDelete').addEventListener('click',async()=>{if(!canEdit()||!editing||busy||!confirm('이 노트를 삭제할까? 삭제 후 복구할 수 없어.'))return;busy=true;
 try{await deleteDoc(doc(db,'peripheralNotes',editing));resetEditor();noteStatus('노트를 삭제했어.')}catch(e){el('notesEditorMessage').textContent='삭제 실패: '+(e.code||e.message)}finally{busy=false}
});
onSnapshot(collection(db,'peripheralNotes'),snap=>{notes=snap.docs.map(d=>({id:d.id,...d.data()}));noteStatus('총 '+notes.length+'개 노트 · '+(canEdit()?'편집 가능':'읽기 전용'));render()},err=>noteStatus('노트를 불러오지 못했어: '+(err.code||err.message)+' · Firestore 규칙 확인'));
onAuthStateChanged(auth,next=>{user=next;member=null;if(memberUnsub){memberUnsub();memberUnsub=null}refresh();if(!user)return;
 memberUnsub=onSnapshot(doc(db,'members',user.uid),snap=>{member=snap.exists()?snap.data():null;refresh();noteStatus('총 '+notes.length+'개 노트 · '+(canEdit()?'편집 가능':'읽기 전용'))},err=>noteStatus('편집 권한 확인 실패: '+(err.code||err.message)));
});
