(function () {
  const button = document.querySelector('.nav button[data-tab="notes"]');
  const panel = document.getElementById('notesPanel');
  if (!button || !panel) return;
  const app = document.querySelector('.app');
  if (app && panel.parentElement !== app) app.appendChild(panel);
  button.addEventListener('click', () => {
    document.querySelectorAll('.app > .panel').forEach(p => p.classList.toggle('hidden', p !== panel));
    document.querySelectorAll('.nav button[data-tab]').forEach(b => b.classList.toggle('active', b === button));
  });
  document.querySelectorAll('.nav button[data-tab]:not([data-tab="notes"])').forEach(b => b.addEventListener('click', () => panel.classList.add('hidden')));
})();
