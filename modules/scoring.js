export function fppg(perGame, w) {
  if (!perGame) return 0;
  const get = k => Number(perGame[k] ?? 0);
  const weight = k => Number(w[k] ?? w[k.toLowerCase()] ?? 0);
  return (
    get('PTS') * weight('PTS') + get('REB') * weight('REB') + get('AST') * weight('AST') +
    get('STL') * weight('STL') + get('BLK') * weight('BLK') + get('TOV') * weight('TOV') +
    get('3PM') * weight('3PM') + get('FGM') * weight('FGM') + get('FGA') * weight('FGA') +
    get('FTM') * weight('FTM') + get('FTA') * weight('FTA')
  );
}
