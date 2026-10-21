import {getApps,initializeApp,getApp} from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js';
import {getAuth,onAuthStateChanged} from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js';
import {getFirestore,collection,doc,onSnapshot,addDoc,updateDoc,deleteDoc,serverTimestamp} from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js';
const config={apiKey:'AIzaSyBqZhLxZTx3UissdLtPdhve460ip8fVHro',authDomain:'korea-geography.firebaseapp.com',projectId:'korea-geography',appId:'1:344199187741:web:1c9a655659e604a2dce5f4'};
const el=id=>document.getElementById(id);
const app=getApps().length?getApp():initializeApp(config),auth=getAuth(app),db=getFirestore(app);
const list=el('notesList'),state=el('notesStatus'),editor=el('notesEditor'),add=el('notesAdd');
let notes=[],user=null,member=null,memberUnsub=null,editing=null,busy=false,editorImages=[];
const canEdit=()=>!!user&&member?.active===true&&['admin','editor'].includes(member.role);
const toDate=v=>v?.toDate?.()?.toLocaleDateString('ko-KR')||'';
const getTime=v=>v?.seconds||0;
const tags=v=>String(v||'').split(',').map(x=>x.trim()).filter(Boolean).slice(0,12);
function elem(tag,text,cls){const x=document.createElement(tag);if(text!=null)x.textContent=text;if(cls)x.className=cls;return x}
// Images are compressed and saved within each Firestore note. No Storage bucket is required.
const MAX_IMAGES=3,MAX_IMAGE_CHARS=220000,MAX_TOTAL_IMAGE_CHARS=660000;
const imageSection=document.createElement('div');imageSection.className='notes-image-editor';
imageSection.innerHTML='<label style="display:block;margin-bottom:8px;font-weight:600">첨부 이미지 (최대 3장)</label><input id="notesImageInput" type="file" accept="image/*" multiple style="max-width:100%"><p class="small">사진은 자동으로 압축됩니다. 이미지를 선택한 후 노트를 저장해 주세요.</p><div id="notesImagePreview" style="display:flex;flex-wrap:wrap;gap:12px;margin-top:12px"></div>';
const editorActions=editor.querySelector('.notes-editor-actions');editor.insertBefore(imageSection,editorActions);
const imageInput=el('notesImageInput'),imagePreview=el('notesImagePreview');
function renderImages(){imagePreview.replaceChildren();editorImages.forEach((src,i)=>{const wrap=elem('div',null,'notes-image-thumb');wrap.style.cssText='position:relative;width:150px';const img=elem('img');img.src=src;img.alt='첨부 이미지 '+(i+1);img.style.cssText='display:block;width:100%;max-height:160px;object-fit:contain;border-radius:8px;border:1px solid #d9e1ee';const remove=elem('button','이미지 삭제');remove.type='button';remove.style.cssText='margin-top:6px;font-size:12px';remove.addEventListener('click',()=>{editorImages.splice(i,1);renderImages()});wrap.append(img,remove);imagePreview.append(wrap)});}
function compressImage(file){return new Promise((resolve,reject)=>{if(!file.type.startsWith('image/')){reject(Error('이미지 파일만 첨부할 수 있습니다.'));return}const reader=new FileReader();reader.onerror=()=>reject(Error('이미지를 읽을 수 없습니다.'));reader.onload=()=>{const image=new Image();image.onerror=()=>reject(Error('지원되지 않는 이미지 형식입니다.'));image.onload=()=>{try{const canvas=document.createElement('canvas'),ctx=canvas.getContext('2d');if(!ctx)throw Error('이미지를 처리할 수 없습니다.');let scale=Math.min(1,1200/Math.max(image.width,image.height));for(let i=0;i<9;i++){canvas.width=Math.max(1,Math.round(image.width*scale));canvas.height=Math.max(1,Math.round(image.height*scale));ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(image,0,0,canvas.width,canvas.height);const data=canvas.toDataURL('image/jpeg',Math.max(.38,.78-i*.055));if(data.length<=MAX_IMAGE_CHARS){resolve(data);return}scale*=.76}reject(Error('이미지가 너무 커서 압축하지 못했습니다.'))}catch(e){reject(e)}};image.src=reader.result};reader.readAsDataURL(file)})}
imageInput.addEventListener('change',async()=>{const files=[...imageInput.files];imageInput.value='';if(!files.length)return;const message=el('notesEditorMessage');if(files.length+editorImages.length>MAX_IMAGES){message.textContent='이미지는 노트당 최대 3장까지 첨부할 수 있습니다.';return}message.textContent='이미지를 처리하고 있습니다…';try{const converted=await Promise.all(files.map(compressImage));if([...editorImages,...converted].join('').length>MAX_TOTAL_IMAGE_CHARS)throw Error('첨부 이미지의 총 용량이 너무 큽니다.');editorImages.push(...converted);renderImages();message.textContent='이미지가 추가되었습니다. 저장 버튼을 눌러 반영해 주세요.'}catch(e){message.textContent=e.message}});
function resetEditor(){editing=null;editorImages=[];renderImages();editor.reset();editor.hidden=true;el('notesEditorMessage').textContent='';el('notesDelete').hidden=true}
function openEditor(item){if(!canEdit())return;editing=item?.id||null;editorImages=[...(item?.images||[])];renderImages();editor.hidden=false;el('notesEditorTitle').textContent=item?'노트 수정':'새 노트';el('notesTitle').value=item?.title||'';el('notesGroup').value=item?.category||'';el('notesTags').value=(item?.tags||[]).join(', ');el('notesBody').value=item?.body||'';el('notesDelete').hidden=!item;el('notesEditorMessage').textContent='';editor.scrollIntoView({block:'start',behavior:'smooth'});el('notesTitle').focus()}
function noteStatus(s){state.textContent=s}
async function removeNote(item){
 if(!canEdit()||busy||!item?.id)return;
 if(!confirm('「'+item.title+'」 노트를 삭제하시겠습니까?\n삭제한 노트는 복구할 수 없습니다.'))return;
 busy=true;noteStatus('노트를 삭제하는 중입니다.');
 try{await deleteDoc(doc(db,'peripheralNotes',item.id));if(editing===item.id)resetEditor();noteStatus('노트가 삭제되었습니다.')}
 catch(e){noteStatus('삭제 실패: '+(e.code||e.message))}
 finally{busy=false}
}
function render(){
 add.hidden=!canEdit();list.replaceChildren();
 const allCats=[...new Set(notes.map(x=>x.category).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'ko'));
 const sel=el('notesCategory'),keep=sel.value;sel.replaceChildren(new Option('전체 분류',''));el('notesGroups').replaceChildren();
 for(const cat of allCats){sel.add(new Option(cat,cat));const op=elem('option');op.value=cat;el('notesGroups').append(op)}
 sel.value=allCats.includes(keep)?keep:'';
 const q=el('notesSearch').value.trim().toLocaleLowerCase(),cat=sel.value;
 const rows=notes.filter(n=>(!cat||n.category===cat)&&(!q||[n.title,n.body,n.category,n.nickname,n.createdByNickname,...(n.tags||[])].join(' ').toLocaleLowerCase().includes(q)));
 rows.sort(el('notesSort').value==='title'?(a,b)=>a.title.localeCompare(b.title,'ko'):(a,b)=>getTime(b.updatedAt)-getTime(a.updatedAt));
 if(!rows.length){list.append(elem('div',notes.length?'검색 결과가 없습니다.':'아직 등록된 노트가 없습니다.','placeholder'));return}
 for(const item of rows){
  const box=elem('details',null,'card notes-item'),sum=elem('summary');
  sum.append(elem('div',item.category||'미분류','notes-meta'),elem('h3',item.title));
  const creator=item.createdByNickname||item.nickname||'작성자 정보 없음';
  const modified=item.nickname||creator;
  const info=elem('div',null,'notes-meta');
  info.textContent='작성: '+creator+(item.createdAt?' · '+(toDate(item.createdAt)||'확인 중'):'')+
    ' | 최근 수정: '+modified+' · '+(toDate(item.updatedAt)||'확인 중');
  sum.append(info);box.append(sum);
  box.append(elem('div',item.body,'notes-text'));
  if(Array.isArray(item.images)&&item.images.length){const gallery=elem('div',null,'notes-images');gallery.style.cssText='display:flex;flex-wrap:wrap;gap:10px;margin:12px 0';item.images.forEach((src,i)=>{if(typeof src!=='string'||!src.startsWith('data:image/'))return;const a=elem('a');a.href=src;a.target='_blank';a.rel='noopener';const img=elem('img');img.src=src;img.alt=item.title+' 이미지 '+(i+1);img.loading='lazy';img.style.cssText='max-width:100%;width:auto;max-height:320px;border-radius:8px;border:1px solid #d9e1ee';a.append(img);gallery.append(a)});box.append(gallery)}
  const tagrow=elem('div',null,'notes-tags');
  for(const t of item.tags||[])tagrow.append(elem('span','#'+t,'notes-tag'));
  box.append(tagrow);
  if(canEdit()){
   const actions=elem('div',null,'notes-item-actions');
   const edit=elem('button','수정'),del=elem('button','삭제');
   edit.type=del.type='button';
   edit.addEventListener('click',()=>openEditor(item));
   del.addEventListener('click',()=>removeNote(item));
   actions.append(edit,del);box.append(actions);
  }
  list.append(box);
 }
}
function refresh(){render();if(!canEdit())resetEditor()}
add.addEventListener('click',()=>openEditor(null));
el('notesCancel').addEventListener('click',resetEditor);
el('notesSearch').addEventListener('input',render);
el('notesSort').addEventListener('change',render);
el('notesCategory').addEventListener('change',render);
editor.addEventListener('submit',async ev=>{
 ev.preventDefault();if(!canEdit()||busy)return;
 const title=el('notesTitle').value.trim(),body=el('notesBody').value.trim(),category=el('notesGroup').value.trim()||'미분류',taglist=[...new Set(tags(el('notesTags').value))];
 if(editorImages.join('').length>MAX_TOTAL_IMAGE_CHARS){el('notesEditorMessage').textContent='첨부 이미지의 용량이 너무 큽니다.';return}
 if(!title||!body){el('notesEditorMessage').textContent='제목과 본문을 입력해 주세요.';return}
 busy=true;el('notesSave').disabled=true;el('notesEditorMessage').textContent='저장 중입니다…';
 try{
  const nickname=member.nickname||user.displayName||'편집자';
  const data={title,body,category,tags:taglist,images:editorImages.slice(),updatedAt:serverTimestamp(),updatedBy:user.uid,nickname};
  if(editing)await updateDoc(doc(db,'peripheralNotes',editing),data);
  else await addDoc(collection(db,'peripheralNotes'),{...data,createdAt:serverTimestamp(),createdBy:user.uid,createdByNickname:nickname});
  resetEditor();noteStatus('저장되었습니다. 다른 사용자에게도 동기화됩니다.');
 }catch(e){el('notesEditorMessage').textContent='저장 실패: '+(e.code||e.message)+' · Firestore 보안 규칙을 확인해 주세요.'}
 finally{busy=false;el('notesSave').disabled=false}
});
el('notesDelete').addEventListener('click',()=>{
 const item=notes.find(n=>n.id===editing);
 if(item)removeNote(item);
});
onSnapshot(collection(db,'peripheralNotes'),snap=>{
 notes=snap.docs.map(d=>({id:d.id,...d.data()}));
 noteStatus('총 '+notes.length+'개 노트 · '+(canEdit()?'편집 가능':'읽기 전용'));render();
},err=>noteStatus('노트를 불러오지 못했습니다: '+(err.code||err.message)+' · Firestore 규칙을 확인해 주세요.'));
onAuthStateChanged(auth,next=>{
 user=next;member=null;if(memberUnsub){memberUnsub();memberUnsub=null}refresh();if(!user)return;
 memberUnsub=onSnapshot(doc(db,'members',user.uid),snap=>{
  member=snap.exists()?snap.data():null;refresh();
  noteStatus('총 '+notes.length+'개 노트 · '+(canEdit()?'편집 가능':'읽기 전용'));
 },err=>noteStatus('편집 권한 확인 실패: '+(err.code||err.message)));
});
