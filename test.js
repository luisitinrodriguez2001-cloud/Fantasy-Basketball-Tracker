const { calcFPPG, computeValuesFor } = require('./script.js');

const weights = {
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
  tov: -2,
};

// Test calcFPPG
const player = { pts: 1, fgm: 1, fga: 1 };
const fppg = calcFPPG(player, weights);
if (fppg !== 2) {
  throw new Error(`calcFPPG failed, expected 2 got ${fppg}`);
}

// Test computeValuesFor replacement logic
const players = Array.from({ length: 140 }, (_, i) => ({ name: String(i), fppg: 140 - i }));
const undrafted = new Set(players.map(p => p.name));
const budgets = [100, 100];
const { replacement } = computeValuesFor(players, undrafted, 2, 100, 0, budgets);
if (replacement !== players[129].fppg) {
  throw new Error('Replacement player calculation failed');
}
if (players[0].par !== players[0].fppg - replacement) {
  throw new Error('PAR not calculated correctly');
}
if (players[130].value !== 0) {
  throw new Error('Replacement players should have zero value');
}

console.log('All tests passed');
