export function initTabs() {
  document.querySelectorAll('nav button').forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.tab;
      document.querySelectorAll('.tab').forEach(s => s.hidden = true);
      document.getElementById(tab).hidden = false;
    });
  });
}
