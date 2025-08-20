export function playoffBadgesFor(player, teamDatesMap) {
  const team = player.team, dates = new Set(teamDatesMap[team] ?? []);
  const inRange = (d,s,e) => (d >= s && d <= e);
  const count = (s,e) => (teamDatesMap[team] ?? []).filter(d => inRange(d,s,e)).length;
  const P1 = count('2026-03-02','2026-03-15');
  const P2 = count('2026-03-16','2026-03-29');
  const noFinalWeekend = !dates.has('2026-03-28') && !dates.has('2026-03-29');
  return { P1, P2, noFinalWeekend };
}
