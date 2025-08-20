import { state } from './state.js';

export function renderProjections() {
  const tbody = document.querySelector('#projections-table tbody');
  if (!tbody) return;
  tbody.innerHTML = '';
  const nameFilter = document.getElementById('filter-name').value.toLowerCase();
  const teamFilter = document.getElementById('filter-team').value;
  const posFilter = document.getElementById('filter-pos').value;
  state.players
    .filter(p =>
      p.name.toLowerCase().includes(nameFilter) &&
      (!teamFilter || p.team === teamFilter) &&
      (!posFilter || p.pos === posFilter)
    )
    .forEach(p => {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${p.name}</td><td>${p.team}</td><td>${p.pos}</td>` +
        `<td>${p.pts}</td><td>${p.reb}</td><td>${p.ast}</td>` +
        `<td>${p.stl}</td><td>${p.blk}</td><td>${p.tov}</td>` +
        `<td>${p.fppg.toFixed(1)}</td>`;
      tbody.appendChild(tr);
    });
}
