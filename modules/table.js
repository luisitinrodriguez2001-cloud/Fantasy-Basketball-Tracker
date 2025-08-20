import { state } from './state.js';
import { buildTeamIndex } from './schedule.js';
import { playoffBadgesFor } from './flags.js';

const rowHeight = 32;
let sortKey = 'fppg';
let sortDir = -1; // descending
const hiddenCols = new Set();

const columns = [
  { key: 'expand', label: '', sortable: false },
  { key: 'name', label: 'Player', sortable: true },
  { key: 'team', label: 'Team', sortable: true },
  { key: 'pos', label: 'Pos', sortable: true },
  { key: 'gms', label: 'Gms(Week)', sortable: true },
  { key: 'p1p2', label: 'P1/P2', sortable: false },
  { key: 'final', label: 'Final Wk', sortable: false },
  { key: 'pts', label: 'PTS', sortable: true },
  { key: 'reb', label: 'REB', sortable: true },
  { key: 'ast', label: 'AST', sortable: true },
  { key: 'stl', label: 'STL', sortable: true },
  { key: 'blk', label: 'BLK', sortable: true },
  { key: 'tov', label: 'TOV', sortable: true },
  { key: 'fppg', label: 'FPPG', sortable: true }
];

export function initProjectionsTable() {
  const table = document.getElementById('projections-table');
  const theadRow = table.querySelector('thead tr');
  theadRow.innerHTML = columns
    .map(c => `<th data-col="${c.key}">${c.label}</th>`)
    .join('');
  theadRow.querySelectorAll('th').forEach(th => {
    const key = th.dataset.col;
    const col = columns.find(c => c.key === key);
    if (col.sortable) {
      th.style.cursor = 'pointer';
      th.addEventListener('click', () => {
        if (sortKey === key) sortDir *= -1;
        else { sortKey = key; sortDir = 1; }
        renderProjections();
      });
    }
  });

  const toggleBox = document.getElementById('column-toggles');
  if (toggleBox) {
    toggleBox.innerHTML = '';
    columns.filter(c => c.key !== 'expand').forEach(col => {
      const lbl = document.createElement('label');
      lbl.innerHTML = `<input type="checkbox" data-col="${col.key}" checked> ${col.label}`;
      lbl.querySelector('input').addEventListener('change', e => {
        toggleColumn(e.target.dataset.col, e.target.checked);
      });
      toggleBox.appendChild(lbl);
    });
  }

  const container = document.getElementById('projections-container');
  if (container) {
    container.addEventListener('scroll', () => renderProjections());
  }
}

function toggleColumn(key, show) {
  if (show) hiddenCols.delete(key); else hiddenCols.add(key);
  document.querySelectorAll(`[data-col="${key}"]`).forEach(el => {
    el.style.display = show ? '' : 'none';
  });
}

function ensureTeamIndex() {
  if (!state.teamDatesMap) {
    const sched = state.schedule || [];
    state.teamDatesMap = buildTeamIndex(sched);
  }
  return state.teamDatesMap;
}

function gamesThisWeek(player) {
  const teamMap = ensureTeamIndex();
  const dates = teamMap[player.team] || [];
  // Placeholder: count of all games for now
  return dates.length;
}

function renderSparkline(canvas, values) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width, h = canvas.height;
  ctx.clearRect(0, 0, w, h);
  if (!values.length) return;
  const max = Math.max(...values), min = Math.min(...values);
  const range = max - min || 1;
  ctx.beginPath();
  values.forEach((v, i) => {
    const x = (i / (values.length - 1)) * w;
    const y = h - ((v - min) / range) * h;
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  });
  ctx.strokeStyle = '#3498db';
  ctx.stroke();
}

export function renderProjections() {
  const container = document.getElementById('projections-container');
  const tbody = document.querySelector('#projections-table tbody');
  if (!container || !tbody) return;

  const nameFilter = document.getElementById('filter-name').value.toLowerCase();
  const teamFilter = document.getElementById('filter-team').value;
  const posFilter = document.getElementById('filter-pos').value;

  let rows = state.players.filter(p =>
    p.name.toLowerCase().includes(nameFilter) &&
    (!teamFilter || p.team === teamFilter) &&
    (!posFilter || p.pos === posFilter)
  );

  rows.sort((a, b) => {
    const valA = a[sortKey] ?? 0;
    const valB = b[sortKey] ?? 0;
    if (valA < valB) return -1 * sortDir;
    if (valA > valB) return 1 * sortDir;
    return 0;
  });

  const start = Math.floor(container.scrollTop / rowHeight);
  const visible = Math.ceil(container.clientHeight / rowHeight) + 5;
  const slice = rows.slice(start, start + visible);
  tbody.style.transform = `translateY(${start * rowHeight}px)`;
  tbody.innerHTML = '';

  const teamDatesMap = ensureTeamIndex();

  slice.forEach(p => {
    const flags = playoffBadgesFor(p, teamDatesMap);
    const gms = gamesThisWeek(p);
    const tr = document.createElement('tr');
    tr.innerHTML =
      `<td data-col="expand"><button class="expander">+</button></td>` +
      `<td data-col="name">${p.name}</td>` +
      `<td data-col="team">${p.team}</td>` +
      `<td data-col="pos">${p.pos}</td>` +
      `<td data-col="gms">${gms}</td>` +
      `<td data-col="p1p2">${flags.P1}/${flags.P2}</td>` +
      `<td data-col="final">${flags.noFinalWeekend ? 'No' : 'Yes'}</td>` +
      `<td data-col="pts">${p.pts}</td>` +
      `<td data-col="reb">${p.reb}</td>` +
      `<td data-col="ast">${p.ast}</td>` +
      `<td data-col="stl">${p.stl}</td>` +
      `<td data-col="blk">${p.blk}</td>` +
      `<td data-col="tov">${p.tov}</td>` +
      `<td data-col="fppg">${p.fppg.toFixed(1)}</td>`;
    tbody.appendChild(tr);

    const expand = document.createElement('tr');
    expand.className = 'expand-row hidden';
    expand.innerHTML = `<td colspan="${columns.length}"><canvas class="sparkline" width="100" height="30"></canvas> ` +
      `<span class="fppg-explain">FPPG combines player stats using your league scoring weights.</span></td>`;
    tbody.appendChild(expand);

    tr.querySelector('.expander').addEventListener('click', () => {
      const hidden = expand.classList.toggle('hidden');
      tr.querySelector('.expander').textContent = hidden ? '+' : '-';
      if (!hidden) {
        const spark = expand.querySelector('.sparkline');
        renderSparkline(spark, p.valueHistory || [p.fppg]);
      }
    });
  });

  hiddenCols.forEach(key => toggleColumn(key, false));
}

