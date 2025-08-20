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
let teamNames = Array.from({ length: teamCount }, (_, i) => `Team ${i + 1}`);
let rosters = Array.from({ length: teamCount }, () => []);

if (isBrowser) {
  document.addEventListener("DOMContentLoaded", () => {
    initTabs();
    renderWeightInputs();
    document.getElementById("apply").addEventListener("click", applySettings);
    document.getElementById('team-names').value = teamNames.join(', ');
    renderRosters();
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
  const namesInput = document.getElementById('team-names').value.trim();
  teamNames = namesInput ? namesInput.split(',').map(n => n.trim()).filter(Boolean) : [];
  while (teamNames.length < teamCount) teamNames.push(`Team ${teamNames.length + 1}`);
  teamNames = teamNames.slice(0, teamCount);
  document.getElementById('team-names').value = teamNames.join(', ');
  document.querySelectorAll('#weights input').forEach(input => {
    const val = parseFloat(input.value);
    weights[input.dataset.cat] = Number.isFinite(val) ? val : 0;
  });
  teamBudgets = Array(teamCount).fill(budgetPerTeam);
  spent = 0;
  rosters = Array.from({ length: teamCount }, () => []);
  if (season !== oldSeason) {
    loadPlayers();
  } else {
    players.forEach(p => { p.fppg = calcFPPG(p); });
    populateFilters();
    renderProjections();
    renderDraft();
    renderRosters();
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
      populateFilters();
      renderProjections();
      renderDraft();
      renderRosters();
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
          populateFilters();
          renderProjections();
          renderDraft();
          renderRosters();
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

function populateFilters() {
  if (!isBrowser) return;
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
  document.getElementById('filter-name').oninput = renderProjections;
  teamSelect.onchange = renderProjections;
  posSelect.onchange = renderProjections;
}

function renderProjections() {
  if (!isBrowser) return;
  const tbody = document.querySelector('#projections-table tbody');
  tbody.innerHTML = '';
  const nameFilter = document.getElementById('filter-name').value.toLowerCase();
  const teamFilter = document.getElementById('filter-team').value;
  const posFilter = document.getElementById('filter-pos').value;
  players
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

function computeValues() {
  computeValuesFor(players, undrafted, teamCount, budgetPerTeam, spent, teamBudgets);
}

function computeValuesFor(list, undraftedSet, tCount, bPerTeam, spentTotal, budgets) {
  const remaining = list.filter(p => undraftedSet.has(p.name));
  if (remaining.length === 0) return { replacement: 0, totalPAR: 0, budgetLeft: 0 };
  const sorted = remaining.map(p => p.fppg).sort((a, b) => b - a);
  const index = Math.min(129, sorted.length - 1);
  const replacement = sorted[index];
  remaining.forEach(p => { p.par = Math.max(0, p.fppg - replacement); });
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
  if (!isBrowser) return;
  const tbody = document.querySelector('#draft-table tbody');
  tbody.innerHTML = '';
  players.filter(p => undrafted.has(p.name)).forEach(p => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${p.name}</td><td>${p.fppg.toFixed(1)}</td>` +
      `<td>${p.par ? p.par.toFixed(1) : '0'}</td>` +
      `<td>${p.value ? p.value.toFixed(1) : '0'}</td>`;
    const teamTd = document.createElement('td');
    const select = document.createElement('select');
    teamNames.forEach((name, idx) => {
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
      if (price > teamBudgets[teamIndex]) {
        alert('Bid exceeds team budget');
        return;
      }
      teamBudgets[teamIndex] -= price;
      spent += price;
      undrafted.delete(p.name);
      rosters[teamIndex].push({ player: p, price });
      renderDraft();
      renderRosters();
    });
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
    li.textContent = `${teamNames[i]}: $${b.toFixed(1)}`;
    list.appendChild(li);
  });
  budgetDiv.appendChild(list);
}

function renderRosters() {
  if (!isBrowser) return;
  const container = document.getElementById('roster-list');
  container.innerHTML = '';
  rosters.forEach((team, i) => {
    const div = document.createElement('div');
    div.className = 'team-roster';
    const h3 = document.createElement('h3');
    h3.textContent = teamNames[i];
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

if (typeof module !== 'undefined') {
  module.exports = { calcFPPG, computeValuesFor };
}
