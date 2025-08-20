export function fppg(perGame, w) {
  if (!perGame) return 0;
  const get = k => Number(perGame[k] ?? 0);
  return (
    get('PTS') * (w.PTS ?? 0) + get('REB') * (w.REB ?? 0) + get('AST') * (w.AST ?? 0) +
    get('STL') * (w.STL ?? 0) + get('BLK') * (w.BLK ?? 0) + get('TOV') * (w.TOV ?? 0) +
    get('3PM') * (w['3PM'] ?? 0) + get('FGM') * (w.FGM ?? 0) + get('FGA') * (w.FGA ?? 0) +
    get('FTM') * (w.FTM ?? 0) + get('FTA') * (w.FTA ?? 0)
  );
}
