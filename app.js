import { initState, state, applySettingsFromDOM } from './modules/state.js';
import { initTabs } from './modules/router.js';
import { renderWeightInputs, populateFilters } from './modules/ui.js';
import { renderProjections } from './modules/table.js';
import { renderDraft, renderRosters } from './modules/draft.js';
import { loadPlayers } from './modules/data-nbaapi.js';
import { calcFPPG } from './modules/scoring.js';

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
