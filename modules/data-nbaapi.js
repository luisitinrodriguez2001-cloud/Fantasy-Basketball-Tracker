const NBA_API = 'https://api.server.nbaapi.com';

export async function fetchTotals(season, pageSize = 5000) {
  const url = `${NBA_API}/api/playertotals?season=${season}&page=1&pageSize=${pageSize}&ascending=false&sortBy=points`;
  const res = await fetch(url); if (!res.ok) throw new Error('Totals fetch failed');
  const json = await res.json(); return json.data ?? json; // supports array fallback
}

export async function fetchAdvanced(season, pageSize = 5000) {
  const url = `${NBA_API}/api/playeradvancedstats?season=${season}&page=1&pageSize=${pageSize}&ascending=false&sortBy=win_shares`;
  const res = await fetch(url); if (!res.ok) throw new Error('Advanced fetch failed');
  const json = await res.json(); return json.data ?? json;
}

export function normalizePlayers(totals, advanced) {
  const advByPid = new Map(advanced.map(a => [a.playerId || a.playerName, a]));
  return totals.map(t => {
    const gp = Number(t.games ?? t.GP ?? 0) || 0;
    const safe = (n) => Number(n ?? 0);
    const id = t.playerId || t.playerName; // prefer stable id if present
    const a = advByPid.get(id) || {};
    const per_game = {
      PTS: gp ? safe(t.points) / gp : 0,
      REB: gp ? safe(t.total_rb) / gp : 0,
      AST: gp ? safe(t.assists) / gp : 0,
      STL: gp ? safe(t.steals) / gp : 0,
      BLK: gp ? safe(t.blocks) / gp : 0,
      3PM: gp ? safe(t.three_fg) / gp : 0,
      FGM: gp ? safe(t.fg) / gp : 0,
      FGA: gp ? safe(t.fga) / gp : 0,
      FTM: gp ? safe(t.ft) / gp : 0,
      FTA: gp ? safe(t.fta) / gp : 0,
      MIN: gp ? safe(t.minutes_pg ?? t.minutes_played) : 0,
      GP: gp
    };
    return {
      id, name: t.playerName, team: t.team, positions: [], // fill if available
      per_game,
      advanced: { PER: a.per, TS: a.tsPercent, USG: a.usagePercent, WS: a.winShares, BPM: a.box, VORP: a.vorp },
      season: t.season
    };
  });
}
