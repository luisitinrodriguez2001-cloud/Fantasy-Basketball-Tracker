export function overallReplacement(undrafted, startersTotal) {
  const sorted = [...undrafted].sort((a,b)=>b.fppg - a.fppg);
  const idx = Math.min(sorted.length - 1, startersTotal);
  return sorted[idx]?.fppg ?? 0;
}
