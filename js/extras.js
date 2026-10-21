
// Keeps all original region/quiz functions as the source of truth.
window.addEventListener('kg-core-changed',()=>{
 if(atlasSelected && !document.getElementById('atlasDetail').classList.contains('hidden')){
   // Preserve position on real-time updates; do not call showAtlasDetail (which scrolls).
   const y=window.scrollY;
   showAtlasDetail(atlasSelected);
   window.scrollTo(0,y);
 }
 if(selectedStudy && typeof renderStudyNotes === 'function')renderStudyNotes(selectedStudy);
 // A currently running core quiz keeps its existing questions. New games use fresh notes.
});
