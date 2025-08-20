export function tierPlayers(players) {
  if (!Array.isArray(players) || players.length === 0) return new Map();
  const sorted = [...players].sort((a, b) => b.fppg - a.fppg);
  const n = sorted.length;
  const result = new Map();
  sorted.forEach((p, i) => {
    const pct = (i + 1) / n;
    let tier = 5;
    if (pct <= 0.2) tier = 1;
    else if (pct <= 0.4) tier = 2;
    else if (pct <= 0.6) tier = 3;
    else if (pct <= 0.8) tier = 4;
    result.set(p.id, tier);
  });
  return result;
}
