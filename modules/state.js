import { defaultWeights } from './design-system.js';

export const state = {
  players: [],
  undrafted: new Set(),
  teamCount: 10,
  budgetPerTeam: 200,
  season: 2025,
  teamBudgets: [],
  spent: 0,
  teamNames: [],
  rosters: [],
  weights: { ...defaultWeights }
};

export function initState() {
  state.teamBudgets = Array(state.teamCount).fill(state.budgetPerTeam);
  state.teamNames = Array.from({ length: state.teamCount }, (_, i) => `Team ${i + 1}`);
  state.rosters = Array.from({ length: state.teamCount }, () => []);
}

export function applySettingsFromDOM() {
  const t = parseInt(document.getElementById('teams').value, 10);
  const b = parseFloat(document.getElementById('budget').value);
  const s = parseInt(document.getElementById('season').value, 10);
  state.teamCount = Number.isInteger(t) && t > 0 ? t : state.teamCount;
  state.budgetPerTeam = Number.isFinite(b) && b > 0 ? b : state.budgetPerTeam;
  const oldSeason = state.season;
  state.season = Number.isInteger(s) ? s : state.season;
  const namesInput = document.getElementById('team-names').value.trim();
  let names = namesInput ? namesInput.split(',').map(n => n.trim()).filter(Boolean) : [];
  while (names.length < state.teamCount) names.push(`Team ${names.length + 1}`);
  state.teamNames = names.slice(0, state.teamCount);
  document.getElementById('team-names').value = state.teamNames.join(', ');
  document.querySelectorAll('#weights input').forEach(input => {
    const val = parseFloat(input.value);
    state.weights[input.dataset.cat] = Number.isFinite(val) ? val : 0;
  });
  state.teamBudgets = Array(state.teamCount).fill(state.budgetPerTeam);
  state.spent = 0;
  state.rosters = Array.from({ length: state.teamCount }, () => []);
  return oldSeason !== state.season;
}
