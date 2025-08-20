import { initState, state, applySettingsFromDOM } from './modules/state.js';
import { initTabs } from './modules/router.js';
import { renderWeightInputs, populateFilters } from './modules/ui.js';
import { renderProjections } from './modules/table.js';
import { renderDraft, renderRosters } from './modules/draft.js';
import { fetchTotals, fetchAdvanced, normalizePlayers } from './modules/data-nbaapi.js';
import { calcFPPG } from './modules/scoring.js';

async function loadPlayers(season, weights) {
  const [totals, advanced] = await Promise.all([
    fetchTotals(season),
    fetchAdvanced(season)
  ]);
  const merged = normalizePlayers(totals, advanced);
  return merged.map(p => {
    const per = p.per_game;
    const player = {
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
    player.fppg = calcFPPG({
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
    }, weights);
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

    document.getElementById('apply').addEventListener('click', async () => {
      const seasonChanged = applySettingsFromDOM();
      if (seasonChanged) {
        state.players = await loadPlayers(state.season, state.weights);
        state.undrafted = new Set(state.players.map(p => p.name));
      } else {
        state.players.forEach(p => { p.fppg = calcFPPG(p, state.weights); });
      }
      populateFilters(state.players, renderProjections);
      renderProjections();
      renderDraft();
      renderRosters();
    });
  });
}
