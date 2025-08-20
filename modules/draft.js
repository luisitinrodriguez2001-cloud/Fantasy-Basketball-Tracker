import { state } from './state.js';
import { overallReplacement } from './replacement.js';

export function computeValues() {
  const undrafted = state.players.filter(p => state.undrafted.has(p.name));
  if (undrafted.length === 0) return { replacement: 0, totalPAR: 0, budgetLeft: 0 };

  const slots = state.rosterSettings || {};
  const startersTotal = Object.keys(slots)
    .reduce((s, k) => s + state.teamCount * (slots[k] ?? 0), 0);
  const replacement = overallReplacement(undrafted, startersTotal);

  undrafted.forEach(p => { p.par = Math.max(0, p.fppg - replacement); });
  const totalPAR = undrafted.reduce((sum, p) => sum + p.par, 0);
  const budgetLeft = state.teamBudgets.reduce((a, b) => a + b, 0);
  undrafted.forEach(p => {
    p.value = totalPAR > 0 ? budgetLeft * (p.par / totalPAR) : 0;
  });
  return { replacement, totalPAR, budgetLeft };
}

export function renderDraft() {
  computeValues();
  const tbody = document.querySelector('#draft-table tbody');
  if (!tbody) return;
  tbody.innerHTML = '';
  state.players.filter(p => state.undrafted.has(p.name)).forEach(p => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${p.name}</td><td>${p.fppg.toFixed(1)}</td>` +
      `<td>${p.par ? p.par.toFixed(1) : '0'}</td>` +
      `<td>${p.value ? p.value.toFixed(1) : '0'}</td>`;
    const teamTd = document.createElement('td');
    const select = document.createElement('select');
    state.teamNames.forEach((name, idx) => {
      const opt = document.createElement('option');
      opt.value = idx;
      opt.textContent = name;
      select.appendChild(opt);
    });
    teamTd.appendChild(select);
    tr.appendChild(teamTd);
    const priceTd = document.createElement('td');
    const priceInput = document.createElement('input');
    priceInput.type = 'number';
    priceInput.min = '0';
    priceInput.step = '0.1';
    priceInput.value = p.value ? p.value.toFixed(1) : '0';
    priceTd.appendChild(priceInput);
    tr.appendChild(priceTd);
    const td = document.createElement('td');
    const btn = document.createElement('button');
    btn.textContent = 'Draft';
    btn.addEventListener('click', () => {
      const teamIndex = parseInt(select.value, 10);
      const price = parseFloat(priceInput.value);
      if (!Number.isFinite(price) || price <= 0) return;
      if (price > state.teamBudgets[teamIndex]) {
        alert('Bid exceeds team budget');
        return;
      }
      state.teamBudgets[teamIndex] -= price;
      state.spent += price;
      state.undrafted.delete(p.name);
      state.rosters[teamIndex].push({ player: p, price });
      renderDraft();
      renderRosters();
    });
    td.appendChild(btn);
    tr.appendChild(td);
    tbody.appendChild(tr);
  });
  const budgetDiv = document.getElementById('budget-info');
  const total = state.teamBudgets.reduce((a, b) => a + b, 0);
  budgetDiv.innerHTML = `Total remaining budget: $${total.toFixed(1)}`;
  const list = document.createElement('ul');
  state.teamBudgets.forEach((b, i) => {
    const li = document.createElement('li');
    li.textContent = `${state.teamNames[i]}: $${b.toFixed(1)}`;
    list.appendChild(li);
  });
  budgetDiv.appendChild(list);
}

export function renderRosters() {
  const container = document.getElementById('roster-list');
  if (!container) return;
  container.innerHTML = '';
  state.rosters.forEach((team, i) => {
    const div = document.createElement('div');
    div.className = 'team-roster';
    const h3 = document.createElement('h3');
    h3.textContent = state.teamNames[i];
    div.appendChild(h3);
    const ul = document.createElement('ul');
    team.forEach(entry => {
      const li = document.createElement('li');
      li.textContent = `${entry.player.name} - $${entry.price.toFixed(1)}`;
      ul.appendChild(li);
    });
    div.appendChild(ul);
    container.appendChild(div);
  });
}
