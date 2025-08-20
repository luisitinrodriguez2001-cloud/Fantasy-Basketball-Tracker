import { defaultWeights } from './design-system.js';
import { fppg } from './scoring.js';

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
  weights: { ...defaultWeights },
  fppgCache: new Map()
};

function weightKey(weights) {
  return Object.keys(weights)
    .sort()
    .map(k => `${k}:${weights[k]}`)
    .join('|');
}

function cacheKey(id, season, weights) {
  return `${id}|${season}|${weightKey(weights)}`;
}

export function getCachedFPPG(id, season, weights) {
  return state.fppgCache.get(cacheKey(id, season, weights));
}

export function setCachedFPPG(id, season, weights, val) {
  state.fppgCache.set(cacheKey(id, season, weights), val);
}

export function memoFPPG(player, weights) {
  const cached = getCachedFPPG(player.id, player.season, weights);
  if (cached !== undefined) return cached;
  const per = {
    PTS: player.pts,
    REB: player.reb,
    AST: player.ast,
    STL: player.stl,
    BLK: player.blk,
    TOV: player.tov,
    '3PM': player.threepm,
    FGM: player.fgm,
    FGA: player.fga,
    FTM: player.ftm,
    FTA: player.fta
  };
  const val = fppg(per, weights);
  setCachedFPPG(player.id, player.season, weights, val);
  return val;
}

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
