import { state } from './state.js';
import { computeValues } from './valuations.js';
import { hybridReplacement } from './replacement.js';
import { tierPlayers } from './tiers.js';

let calcWorker;
export function setCalcWorker(w) {
  calcWorker = w;
}

function buildSettings() {
  return { teams: state.teamCount, budget: state.budgetPerTeam, slots: state.rosterSettings || {} };
}

const DEFAULT_SLOTS = 13;
function buildMarket() {
  const totalSlots = state.rosterSettings?.total ?? DEFAULT_SLOTS;
  return {
    teamStates: state.teamBudgets.map((budget, i) => ({
      budget,
      slotsOpen: Math.max(0, totalSlots - state.rosters[i].length),
      canFit: () => true
    }))
  };
}

function recompute() {
  const players = state.players.map(p => ({
    id: p.id,
    fppg: p.fppg,
    eligible: [p.pos],
    drafted: !state.undrafted.has(p.name),
    scarce: p.scarce || false,
    canFit: () => true
  }));
  const settings = buildSettings();
  const market = buildMarket();
  const replacement = hybridReplacement(players.filter(p => !p.drafted), settings);
  const values = computeValues(players, settings, market, replacement);
  const tierMap = tierPlayers(players.filter(p => !p.drafted));
  values.forEach(v => {
    const pl = state.players.find(sp => sp.id === v.id);
    if (pl) {
      pl.par = v.par;
      pl.baseDollar = v.baseDollar;
      pl.nowDollar = v.nowDollar;
      pl.rec = v.recommended;
      pl.tier = tierMap.get(v.id) || 0;
    }
  });
}

export function draftPlayer(player, teamIndex, price) {
  if (price > state.teamBudgets[teamIndex]) return;
  state.teamBudgets[teamIndex] -= price;
  state.spent += price;
  state.undrafted.delete(player.name);
  state.rosters[teamIndex].push({ player, price });
  if (calcWorker) {
    calcWorker.postMessage({ players: state.players, weights: state.weights });
  }
  recompute();
  renderDraft();
  renderRosters();
}

export function renderDraft() {
  recompute();
  const tbody = document.querySelector('#draft-table tbody');
  if (!tbody) return;
  tbody.innerHTML = '';
  state.players.filter(p => state.undrafted.has(p.name)).forEach(p => {
    const tr = document.createElement('tr');
    tr.innerHTML =
      `<td>${p.name}</td><td>${p.fppg.toFixed(1)}</td>` +
      `<td>${(p.par ?? 0).toFixed(1)}</td>` +
      `<td>${(p.nowDollar ?? 0).toFixed(1)}</td>` +
      `<td>${(p.rec ?? 0).toFixed(1)}</td>` +
      `<td>${p.tier ?? ''}</td>`;
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
    priceInput.value = (p.rec ?? 0).toFixed(1);
    priceTd.appendChild(priceInput);
    tr.appendChild(priceTd);
    const td = document.createElement('td');
    const btn = document.createElement('button');
    btn.textContent = 'Draft';
    btn.addEventListener('click', () => {
      const teamIndex = parseInt(select.value, 10);
      const price = parseFloat(priceInput.value);
      if (!Number.isFinite(price) || price <= 0) return;
      draftPlayer(p, teamIndex, price);
    });
    td.appendChild(btn);
    tr.appendChild(td);
    tbody.appendChild(tr);
  });
  const budgetDiv = document.getElementById('budget-info');
  if (budgetDiv) {
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

