import { normalizeFixtureJSON } from './schedule.js';

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

// Fetch player totals from the API and convert them to per-game stats
export async function fetchPlayers(season, pageSize = 5000) {
  const totals = await fetchTotals(season, pageSize);
  return totals.map(t => {
    const val = (...keys) => {
      for (const k of keys) {
        if (t[k] !== undefined && t[k] !== null) return Number(t[k]);
      }
      return 0;
    };
    const gp = val('games', 'GP', 'gp', 'Games');
    const per_game = {
      PTS: gp ? val('points', 'PTS', 'pts') / gp : 0,
      REB: gp ? val('total_rb', 'REB', 'rebounds', 'reb') / gp : 0,
      AST: gp ? val('assists', 'AST', 'ast') / gp : 0,
      STL: gp ? val('steals', 'STL', 'stl') / gp : 0,
      BLK: gp ? val('blocks', 'BLK', 'blk') / gp : 0,
      TOV: gp ? val('turnovers', 'TOV', 'tov') / gp : 0,
      '3PM': gp ? val('three_fg', '3PM', 'threepm') / gp : 0,
      FGM: gp ? val('fg', 'FGM') / gp : 0,
      FGA: gp ? val('fga', 'FGA') / gp : 0,
      FTM: gp ? val('ft', 'FTM') / gp : 0,
      FTA: gp ? val('fta', 'FTA') / gp : 0,
      MIN: gp ? val('minutes_pg', 'minutes_played', 'MIN') : 0,
      GP: gp
    };
    return {
      id: t.playerId || t.playerName,
      name: t.playerName,
      team: t.team,
      pos: t.position || '',
      per_game,
      season: t.season
    };
  });
}

export async function fetchSchedule(season, pageSize = 5000) {
  try {
    const raw = await fetchEndpoint('schedule', season, pageSize, 'date');
    return normalizeFixtureJSON(raw);
  } catch (_) {
    return [];
  }
}
