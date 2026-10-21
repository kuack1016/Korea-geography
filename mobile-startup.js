
(function(){
  'use strict';
  function recover(){
    if(!matchMedia('(max-width:760px)').matches)return;
    const panels=[...document.querySelectorAll('.app > .panel')];
    // A previous page session may leave no visible panel after browser restoration.
    if(panels.length && panels.every(p=>p.classList.contains('hidden'))){
      const quiz=document.getElementById('quizPanel');
      if(quiz)quiz.classList.remove('hidden');
      document.querySelectorAll('.nav button[data-tab]').forEach(b=>b.classList.toggle('active',b.dataset.tab==='quiz'));
    }
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',recover,{once:true});else recover();
  window.addEventListener('pageshow',recover);
})();
