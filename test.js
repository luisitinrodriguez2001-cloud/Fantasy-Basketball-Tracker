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

// Test computeValuesFor
const players = [
  { name: 'A', fppg: 10 },
  { name: 'B', fppg: 5 },
];
const undrafted = new Set(['A', 'B']);
const budgets = [100, 100];
computeValuesFor(players, undrafted, 2, 100, 0, budgets);
if (Math.round(players[0].value) !== 200 || Math.round(players[1].value) !== 0) {
  throw new Error('computeValuesFor did not allocate budget correctly');
}

console.log('All tests passed');
