import { fppg } from '../scoring.js';

self.onmessage = e => {
  const { players = [], weights = {} } = e.data || {};
  const results = players.map(p => {
    const per = {
      PTS: p.pts,
      REB: p.reb,
      AST: p.ast,
      STL: p.stl,
      BLK: p.blk,
      TOV: p.tov,
      '3PM': p.threepm,
      FGM: p.fgm,
      FGA: p.fga,
      FTM: p.ftm,
      FTA: p.fta
    };
    return { id: p.id, fppg: fppg(per, weights) };
  });
  postMessage({ results });
};
