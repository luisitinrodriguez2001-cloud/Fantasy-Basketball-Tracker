import { computeValues } from './modules/valuations.js';

const players = [
  {id:'1', fppg:15, eligible:['PG'], drafted:false, scarce:false, canFit:()=>true},
  {id:'2', fppg:10, eligible:['PG'], drafted:false, scarce:false, canFit:()=>true}
];
const settings = {teams:1, budget:100};
const market = { teamStates:[{budget:100, slotsOpen:1, canFit:()=>true}] };
const replacement = {overall:5, byPos:{PG:5}};
const vals = computeValues(players, settings, market, replacement);
const p1 = vals.find(v=>v.id==='1');
const p2 = vals.find(v=>v.id==='2');
if (Math.abs(p1.baseDollar-66.6667) > 0.1) throw new Error('base$ calc failed');
if (Math.abs(p2.nowDollar-33.3333) > 0.1) throw new Error('$Now calc failed');
console.log('valuations.spec passed');
