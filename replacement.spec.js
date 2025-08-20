import { overallReplacement } from './modules/replacement.js';

const players = Array.from({length:5}, (_,i)=>({fppg:5-i}));
const repl = overallReplacement(players,2);
if (repl !== 3) {
  throw new Error(`overallReplacement expected 3 got ${repl}`);
}
console.log('replacement.spec passed');
