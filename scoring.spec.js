import { fppg } from './modules/scoring.js';

const weights = { PTS:1, REB:1, AST:2, STL:4, BLK:4, TOV:-2, '3PM':1, FGM:2, FGA:-1, FTM:1, FTA:-1 };
const per = { PTS:1, FGM:1, FGA:1 };
const val = fppg(per, weights);
if (val !== 2) {
  throw new Error(`fppg failed expected 2 got ${val}`);
}
console.log('scoring.spec passed');
