export function computeValues(players, settings, market, replacement) {
  const getRepl = p => {
    const perPos = Math.min(...p.eligible.map(pos => replacement.byPos[pos] ?? replacement.overall));
    return Math.max(perPos, replacement.overall);
  };
  const undrafted = players.filter(p => !p.drafted);
  const par = undrafted.map(p => ({ id:p.id, val: Math.max(0, p.fppg - getRepl(p)), p }));
  const sumPAR = par.reduce((s,x)=>s+x.val,0);
  const totalBudget = settings.teams * settings.budget;
  const base$ = new Map(par.map(x => [x.id, sumPAR>0 ? (x.val/sumPAR)*totalBudget : 0]));

  const teamMaxBid = t => Math.max(0, t.budget - (t.slotsOpen - 1));
  const active = market.teamStates.filter(t => t.slotsOpen > 0);
  const effectivePool = active.reduce((s,t)=>s+teamMaxBid(t),0);

  const sumRem = par.reduce((s,x)=>s+x.val,0);
  const now$ = new Map(par.map(x => [x.id, sumRem>0 ? (x.val/sumRem)*effectivePool : 0]));

  const maxCompetitorBidFor = p => {
    const feas = market.teamStates.filter(t => t.slotsOpen>0 && p.canFit(t));
    return feas.length ? Math.max(...feas.map(teamMaxBid)) : 0;
  };

  // Scarcity multiplier & spend-curve normalization
  const scarcityAdj = new Map();
  par.forEach(x => {
    const mult = x.p.scarce ? 1.07 : 1.00;
    scarcityAdj.set(x.id, (now$.get(x.id) ?? 0) * mult);
  });
  const sumScarcity = Array.from(scarcityAdj.values()).reduce((s,v)=>s+v,0);
  const scale = sumScarcity > 0 ? effectivePool / sumScarcity : 0;

  const rec$ = new Map();
  scarcityAdj.forEach((val, id) => {
    rec$.set(id, val * scale);
  });

  return undrafted.map(p => {
    const rec = Math.min(rec$.get(p.id) ?? 0, maxCompetitorBidFor(p));
    return {
      id: p.id,
      par: par.find(x=>x.id===p.id)?.val ?? 0,
      baseDollar: base$.get(p.id) ?? 0,
      nowDollar: now$.get(p.id) ?? 0,
      recommended: rec
    };
  });
}
