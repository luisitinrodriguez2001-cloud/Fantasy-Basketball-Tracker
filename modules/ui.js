import { categories } from './design-system.js';
import { state } from './state.js';

export function renderWeightInputs() {
  const container = document.getElementById('weights');
  container.innerHTML = '';
  Object.entries(state.weights).forEach(([key, val]) => {
    const label = document.createElement('label');
    label.textContent = `${categories[key]}: `;
    const input = document.createElement('input');
    input.type = 'number';
    input.step = '0.1';
    input.value = val;
    input.dataset.cat = key;
    label.appendChild(input);
    container.appendChild(label);
  });
}

export function populateFilters(players, onChange) {
  const teamSelect = document.getElementById('filter-team');
  const posSelect = document.getElementById('filter-pos');
  const teams = Array.from(new Set(players.map(p => p.team))).sort();
  const positions = Array.from(new Set(players.map(p => p.pos))).sort();
  teamSelect.innerHTML = '<option value="">All Teams</option>';
  teams.forEach(t => {
    const opt = document.createElement('option');
    opt.value = t;
    opt.textContent = t;
    teamSelect.appendChild(opt);
  });
  posSelect.innerHTML = '<option value="">All Positions</option>';
  positions.forEach(pos => {
    const opt = document.createElement('option');
    opt.value = pos;
    opt.textContent = pos;
    posSelect.appendChild(opt);
  });
  document.getElementById('filter-name').oninput = onChange;
  teamSelect.onchange = onChange;
  posSelect.onchange = onChange;
}
