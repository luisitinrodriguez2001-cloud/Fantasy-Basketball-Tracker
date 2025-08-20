const TEAM_MAP = { "Boston Celtics":"BOS", "New York Knicks":"NYK" };
export function normalizeFixtureJSON(arr) {
  const mapTeam = name => TEAM_MAP[name] ?? name;
  return arr.map(g => ({
    date: (g.Date || g.date || '').slice(0,10),
    tipoffUTC: g.DateUTC || g.KickoffUTC || null,
    home: mapTeam(g.HomeTeam || g.Home || g.home),
    away: mapTeam(g.AwayTeam || g.Away || g.away),
    isTBC: /TBD|TBC/i.test(g.HomeTeam ?? '') || /TBD|TBC/i.test(g.AwayTeam ?? '')
  })).filter(g => g.date && g.home && g.away);
}
export function buildTeamIndex(games) {
  const idx = {};
  for (const g of games) { (idx[g.home] ??= new Set()).add(g.date); (idx[g.away] ??= new Set()).add(g.date); }
  return Object.fromEntries(Object.entries(idx).map(([k,v]) => [k, [...v].sort()]));
}
