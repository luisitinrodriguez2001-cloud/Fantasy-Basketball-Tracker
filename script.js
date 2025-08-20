const isBrowser = typeof window !== 'undefined';

const categories = {
  pts: "Points",
  threepm: "3PM",
  fga: "FGA",
  fgm: "FGM",
  fta: "FTA",
  ftm: "FTM",
  reb: "REB",
  ast: "AST",
  stl: "STL",
  blk: "BLK",
  tov: "TOV"
};

let weights = {
  pts: 1,
  threepm: 1,
  fga: -1,
  fgm: 2,
  fta: -1,
  ftm: 1,
  reb: 1,
  ast: 2,
  stl: 4,
  blk: 4,
  tov: -2
};

let players = [];
let undrafted = new Set();
let teamCount = 10;
let budgetPerTeam = 200;
let season = 2025;
let teamBudgets = Array(teamCount).fill(budgetPerTeam);
let spent = 0;

if (isBrowser) {
  document.addEventListener("DOMContentLoaded", () => {
    initTabs();
    renderWeightInputs();
    document.getElementById("apply").addEventListener("click", applySettings);
    loadPlayers();
  });
}

function initTabs() {
  document.querySelectorAll('nav button').forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.tab;
      document.querySelectorAll('.tab').forEach(s => s.hidden = true);
      document.getElementById(tab).hidden = false;
    });
  });
}

function renderWeightInputs() {
  const container = document.getElementById('weights');
  container.innerHTML = '';
  Object.entries(weights).forEach(([key, val]) => {
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

function applySettings() {
  const t = parseInt(document.getElementById('teams').value, 10);
  const b = parseFloat(document.getElementById('budget').value);
  const s = parseInt(document.getElementById('season').value, 10);
  teamCount = Number.isInteger(t) && t > 0 ? t : teamCount;
  budgetPerTeam = Number.isFinite(b) && b > 0 ? b : budgetPerTeam;
  const oldSeason = season;
  season = Number.isInteger(s) ? s : season;
  document.querySelectorAll('#weights input').forEach(input => {
    const val = parseFloat(input.value);
    weights[input.dataset.cat] = Number.isFinite(val) ? val : 0;
  });
  teamBudgets = Array(teamCount).fill(budgetPerTeam);
  spent = 0;
  if (season !== oldSeason) {
    loadPlayers();
  } else {
    players.forEach(p => { p.fppg = calcFPPG(p); });
    renderProjections();
    renderDraft();
  }
}

function loadPlayers() {
  const apiUrl = `https://api.server.nbaapi.com/api/playertotals?season=${season}&pageSize=1000`;
  fetch(apiUrl)
    .then(r => {
      if (!r.ok) throw new Error('Network response was not ok');
      return r.json();
    })
    .then(data => {
      players = Array.isArray(data.data) ? data.data.map(mapApiPlayer) : [];
      players.forEach(p => { p.fppg = calcFPPG(p); });
      undrafted = new Set(players.map(p => p.name));
      renderProjections();
      renderDraft();
    })
    .catch(err => {
      console.error('Failed to load from API, falling back to players.json', err);
      fetch('players.json')
        .then(r => {
          if (!r.ok) throw new Error('Fallback response was not ok');
          return r.json();
        })
        .then(data => {
          players = Array.isArray(data) ? data : [];
          players.forEach(p => { p.fppg = calcFPPG(p); });
          undrafted = new Set(players.map(p => p.name));
          renderProjections();
          renderDraft();
        })
        .catch(err2 => {
          console.error('Failed to load players.json', err2);
        });
    });
}

function mapApiPlayer(p) {
  const g = p.games || 1;
  return {
    name: p.playerName,
    team: p.team,
    pos: p.position,
    pts: p.points / g,
    threepm: p.threeFg / g,
    fga: p.fieldAttempts / g,
    fgm: p.fieldGoals / g,
    fta: p.ftAttempts / g,
    ftm: p.ft / g,
    reb: p.totalRb / g,
    ast: p.assists / g,
    stl: p.steals / g,
    blk: p.blocks / g,
    tov: p.turnovers / g
  };
}

function calcFPPG(p, w = weights) {
  return (
    (p.pts || 0) * w.pts +
    (p.threepm || 0) * w.threepm +
    (p.fga || 0) * w.fga +
    (p.fgm || 0) * w.fgm +
    (p.fta || 0) * w.fta +
    (p.ftm || 0) * w.ftm +
    (p.reb || 0) * w.reb +
    (p.ast || 0) * w.ast +
    (p.stl || 0) * w.stl +
    (p.blk || 0) * w.blk +
    (p.tov || 0) * w.tov
  );
}

function renderProjections() {
  const tbody = document.querySelector('#projections-table tbody');
  tbody.innerHTML = '';
  players.forEach(p => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${p.name}</td><td>${p.team}</td><td>${p.pos}</td>` +
      `<td>${p.pts}</td><td>${p.reb}</td><td>${p.ast}</td>` +
      `<td>${p.stl}</td><td>${p.blk}</td><td>${p.tov}</td>` +
      `<td>${p.fppg.toFixed(1)}</td>`;
    tbody.appendChild(tr);
  });
}

function computeValues() {
  computeValuesFor(players, undrafted, teamCount, budgetPerTeam, spent, teamBudgets);
}

function computeValuesFor(list, undraftedSet, tCount, bPerTeam, spentTotal, budgets) {
  const remaining = list.filter(p => undraftedSet.has(p.name));
  if (remaining.length === 0) return { replacement: 0, totalPAR: 0, budgetLeft: 0 };
  const replacement = Math.min(...remaining.map(p => p.fppg));
  remaining.forEach(p => { p.par = p.fppg - replacement; });
  const totalPAR = remaining.reduce((sum, p) => sum + Math.max(0, p.par), 0);
  const budgetLeft = budgets ? budgets.reduce((a, b) => a + b, 0)
    : tCount * bPerTeam - spentTotal;
  remaining.forEach(p => {
    p.value = totalPAR > 0 ? budgetLeft * (Math.max(0, p.par) / totalPAR) : 0;
  });
  return { replacement, totalPAR, budgetLeft };
}

function renderDraft() {
  computeValues();
  const tbody = document.querySelector('#draft-table tbody');
  tbody.innerHTML = '';
  players.filter(p => undrafted.has(p.name)).forEach(p => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${p.name}</td><td>${p.fppg.toFixed(1)}</td>` +
      `<td>${p.par ? p.par.toFixed(1) : '0'}</td>` +
      `<td>${p.value ? p.value.toFixed(1) : '0'}</td>`;
    const td = document.createElement('td');
    const btn = document.createElement('button');
    btn.textContent = 'Draft';
    btn.addEventListener('click', () => draftPlayer(p));
    td.appendChild(btn);
    tr.appendChild(td);
    tbody.appendChild(tr);
  });
  const budgetDiv = document.getElementById('budget-info');
  const total = teamBudgets.reduce((a, b) => a + b, 0);
  budgetDiv.innerHTML = `Total remaining budget: $${total.toFixed(1)}`;
  const list = document.createElement('ul');
  teamBudgets.forEach((b, i) => {
    const li = document.createElement('li');
    li.textContent = `Team ${i + 1}: $${b.toFixed(1)}`;
    list.appendChild(li);
  });
  budgetDiv.appendChild(list);
}

function draftPlayer(p) {
  const suggestion = p.value ? p.value.toFixed(1) : '0';
  const teamInput = prompt(`Winning team (1-${teamCount})`);
  const teamIndex = parseInt(teamInput, 10) - 1;
  if (!Number.isInteger(teamIndex) || teamIndex < 0 || teamIndex >= teamCount) {
    alert('Invalid team number');
    return;
  }
  const price = parseFloat(prompt(`Bid price for ${p.name}`, suggestion));
  if (!Number.isFinite(price) || price <= 0) return;
  if (price > teamBudgets[teamIndex]) {
    alert('Bid exceeds team budget');
    return;
  }
  teamBudgets[teamIndex] -= price;
  spent += price;
  undrafted.delete(p.name);
  renderDraft();
}

if (typeof module !== 'undefined') {
  module.exports = { calcFPPG, computeValuesFor };
}
