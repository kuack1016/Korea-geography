// Keep this tab independent of the legacy tabs and the rail extension.
(function(){
 const b=document.querySelector('.nav button[data-tab="notes"]'),p=document.getElementById('notesPanel');
 if(!b||!p)return;
 b.addEventListener('click',()=>{
  document.querySelectorAll('.app > .panel').forEach(el=>el.classList.toggle('hidden',el!==p));
  document.querySelectorAll('.nav button[data-tab]').forEach(el=>el.classList.toggle('active',el===b));
  window.dispatchEvent(new Event('kg-notes-open'));
 });
 document.querySelectorAll('.nav button[data-tab]:not([data-tab="notes"])').forEach(el=>el.addEventListener('click',()=>p.classList.add('hidden')));
})();
