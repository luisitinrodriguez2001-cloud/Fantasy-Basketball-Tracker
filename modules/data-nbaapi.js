const NBA_API = 'https://api.server.nbaapi.com';

function seasonYear(season) {
  if (typeof season === 'string' && season.includes('-')) {
    const [start] = season.split('-');
    const yr = parseInt(start, 10);
    if (!Number.isNaN(yr)) return yr + 1;
  }
  return season;
}

async function fetchEndpoint(endpoint, season, pageSize, sortBy) {
  const year = seasonYear(season);
  const key = `${endpoint}_${year}`;
  if (typeof localStorage !== 'undefined') {
    const cached = localStorage.getItem(key);
    if (cached) return JSON.parse(cached);
  }
  const url = `${NBA_API}/api/${endpoint}?season=${year}&page=1&pageSize=${pageSize}&ascending=false&sortBy=${sortBy}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${endpoint} fetch failed`);
  const json = await res.json();
  const data = json.data ?? json;
  if (typeof localStorage !== 'undefined') {
    try { localStorage.setItem(key, JSON.stringify(data)); } catch (_) {}
  }
  return data;
}

export async function fetchTotals(season, pageSize = 5000) {
  return fetchEndpoint('playertotals', season, pageSize, 'points');
}

export async function fetchAdvanced(season, pageSize = 5000) {
  return fetchEndpoint('playeradvancedstats', season, pageSize, 'win_shares');
}

export function normalizePlayers(totals, advanced) {
  const advByPid = new Map(advanced.map(a => [a.playerId || a.playerName, a]));
  return totals.map(t => {
    const gp = Number(t.games ?? t.GP ?? 0) || 0;
    const safe = n => Number(n ?? 0);
    const id = t.playerId || t.playerName;
    const adv = advByPid.get(id) || {};
    const per_game = {
      PTS: gp ? safe(t.points) / gp : 0,
      REB: gp ? safe(t.total_rb) / gp : 0,
      AST: gp ? safe(t.assists) / gp : 0,
      STL: gp ? safe(t.steals) / gp : 0,
      BLK: gp ? safe(t.blocks) / gp : 0,
      TOV: gp ? safe(t.turnovers) / gp : 0,
      '3PM': gp ? safe(t.three_fg) / gp : 0,
      FGM: gp ? safe(t.fg) / gp : 0,
      FGA: gp ? safe(t.fga) / gp : 0,
      FTM: gp ? safe(t.ft) / gp : 0,
      FTA: gp ? safe(t.fta) / gp : 0,
      MIN: gp ? safe(t.minutes_pg ?? t.minutes_played) : 0,
      GP: gp
    };
    return {
      id,
      name: t.playerName,
      team: t.team,
      positions: Array.isArray(t.positions) ? t.positions : [t.position].filter(Boolean),
      per_game,
      advanced: {
        PER: adv.per,
        TS: adv.tsPercent,
        USG: adv.usagePercent,
        WS: adv.winShares,
        BPM: adv.box,
        VORP: adv.vorp
      },
      season: t.season
    };
  });
}
