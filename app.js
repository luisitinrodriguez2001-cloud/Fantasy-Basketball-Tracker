import { initState, state, applySettingsFromDOM, memoFPPG, setCachedFPPG } from './modules/state.js';
import { initTabs } from './modules/router.js';
import { renderWeightInputs, populateFilters } from './modules/ui.js';
import { renderProjections } from './modules/table.js';
import { renderDraft, renderRosters } from './modules/draft.js';
import { fetchTotals, fetchAdvanced, normalizePlayers } from './modules/data-nbaapi.js';

async function loadPlayers(season, weights) {
  const [totals, advanced] = await Promise.all([
    fetchTotals(season),
    fetchAdvanced(season)
  ]);
  const merged = normalizePlayers(totals, advanced);
  return merged.map(p => {
    const per = p.per_game;
    const player = {
      id: p.id,
      season: p.season,
      name: p.name,
      team: p.team,
      pos: (p.positions && p.positions[0]) || '',
      pts: per.PTS,
      reb: per.REB,
      ast: per.AST,
      stl: per.STL,
      blk: per.BLK,
      tov: per.TOV,
      threepm: per['3PM'],
      fgm: per.FGM,
      fga: per.FGA,
      ftm: per.FTM,
      fta: per.FTA
    };
    player.fppg = memoFPPG(player, weights);
    return player;
  });
}

if (typeof window !== 'undefined') {
  document.addEventListener('DOMContentLoaded', async () => {
    initState();
    initTabs();
    renderWeightInputs();
    document.getElementById('team-names').value = state.teamNames.join(', ');
    renderRosters();
    state.players = await loadPlayers(state.season, state.weights);
    state.undrafted = new Set(state.players.map(p => p.name));
    populateFilters(state.players, renderProjections);
    renderProjections();
    renderDraft();

    const worker = new Worker(new URL('./modules/workers/calc.worker.js', import.meta.url), { type: 'module' });

    let weightTimer;
    function scheduleWeights() {
      clearTimeout(weightTimer);
      weightTimer = setTimeout(() => {
        worker.postMessage({ players: state.players, weights: state.weights });
      }, 150);
    }

    worker.onmessage = e => {
      const { results = [] } = e.data || {};
      results.forEach(r => {
        const player = state.players.find(p => p.id === r.id);
        if (player) {
          player.fppg = r.fppg;
          setCachedFPPG(player.id, player.season, state.weights, r.fppg);
        }
      });
      renderProjections();
      renderDraft();
    };

    document.querySelectorAll('#weights input').forEach(input => {
      input.addEventListener('input', () => {
        const val = parseFloat(input.value);
        state.weights[input.dataset.cat] = Number.isFinite(val) ? val : 0;
        scheduleWeights();
      });
    });

    document.getElementById('apply').addEventListener('click', async () => {
      const seasonChanged = applySettingsFromDOM();
      if (seasonChanged) {
        state.players = await loadPlayers(state.season, state.weights);
        state.undrafted = new Set(state.players.map(p => p.name));
      }
      populateFilters(state.players, renderProjections);
      renderProjections();
      renderDraft();
      renderRosters();
      scheduleWeights();
    });
  });
}
