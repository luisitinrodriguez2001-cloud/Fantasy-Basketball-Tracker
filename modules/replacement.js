// Calculate the replacement level for the entire player pool. `startersTotal`
// represents the number of players that will be started across the league
// (teams * starters per roster slot summed over all slots).
export function overallReplacement(undrafted, startersTotal) {
  if (!Array.isArray(undrafted) || undrafted.length === 0) return 0;
  const sorted = [...undrafted].sort((a, b) => b.fppg - a.fppg);
  const idx = Math.min(sorted.length - 1, startersTotal);
  return sorted[idx]?.fppg ?? 0;
}

// Determine the replacement level for each individual position. `settings`
// should contain the league `teams` count and a `slots` (or `starters`) map
// describing how many starters each team has at every position. The replacement
// for a position is the Nth best undrafted player eligible at that position,
// where N = teams * starters for that position.
export function perPositionReplacement(undrafted, settings) {
  const teams = settings?.teams ?? 0;
  const slotMap = settings?.slots || settings?.starters || settings?.roster || {};
  const result = {};
  Object.keys(slotMap).forEach(pos => {
    const need = teams * (slotMap[pos] ?? 0);
    const pool = undrafted.filter(p => Array.isArray(p.eligible) && p.eligible.includes(pos));
    if (pool.length === 0) {
      result[pos] = 0;
      return;
    }
    const sorted = pool.sort((a, b) => b.fppg - a.fppg);
    const idx = Math.min(sorted.length - 1, need);
    result[pos] = sorted[idx]?.fppg ?? 0;
  });
  return result;
}

// Compute both overall and per-position replacement levels. Useful for modules
// that require both pieces of information. The per-position replacements are
// calculated first and the overall replacement is derived from the league
// settings.
export function hybridReplacement(undrafted, settings) {
  const slotMap = settings?.slots || settings?.starters || settings?.roster || {};
  const teams = settings?.teams ?? 0;
  const startersTotal = Object.keys(slotMap)
    .reduce((s, k) => s + teams * (slotMap[k] ?? 0), 0);
  const overall = overallReplacement(undrafted, startersTotal);
  const byPos = perPositionReplacement(undrafted, settings);
  return { overall, byPos };
}
