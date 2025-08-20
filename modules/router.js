export function initTabs() {
  function showTab(tab) {
    if (!tab) return;
    document.querySelectorAll('.tab').forEach(section => {
      section.hidden = true;
    });
    const active = document.getElementById(tab);
    if (active) active.hidden = false;

    document.querySelectorAll('nav button').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tab);
    });
  }

  document.querySelectorAll('nav button').forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.tab;
      // update hash so tab can be bookmarked or restored on reload
      window.location.hash = tab;
      showTab(tab);
    });
  });

  window.addEventListener('hashchange', () => {
    showTab(window.location.hash.substring(1));
  });

  // show initial tab based on hash or default to settings
  showTab(window.location.hash.substring(1) || 'settings');
}
