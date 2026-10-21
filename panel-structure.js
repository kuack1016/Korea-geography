
(function(){
  const app=document.querySelector('.app');
  if(!app)return;
  // Preserve existing elements, listeners, IDs and content; only repair parentage.
  ['railPanel','studyPanel','atlasPanel','rankingPanel','climateRankingPanel','industryPanel'].forEach(id=>{
    const panel=document.getElementById(id);
    if(panel&&panel.parentElement!==app)app.appendChild(panel);
  });
})();
