// Competition data — teams, fixtures, standings. Source: Team Guide.

const TEAMS = {
  "roch-a": { name: "2nd Rochdale A", short: "2nd Rochdale A", group: "A" },
  "bel-a":  { name: "82nd Belfast A", short: "82nd Belfast A", group: "A" },
  "don-a":  { name: "6th Doncaster A", short: "6th Doncaster A", group: "A" },
  "don-b":  { name: "6th Doncaster B", short: "6th Doncaster B", group: "A" },
  "misc":   { name: "Rochdale/Belfast Misc", short: "Rochdale/Belfast Misc", group: "B" },
  "bel-b":  { name: "82nd Belfast B", short: "82nd Belfast B", group: "B" },
  "bel-c":  { name: "82nd Belfast C", short: "82nd Belfast C", group: "B" },
  "don-c":  { name: "6th Doncaster C", short: "6th Doncaster C", group: "B" }
};

const FIXTURES = [
  { id: "w1", day: "Wednesday", time: "20:00 to 20:30", venue: "Sports Barn", a: "misc",   b: "don-c" },
  { id: "w2", day: "Wednesday", time: "20:00 to 20:30", venue: "Outside",     a: "roch-a", b: "bel-a" },
  { id: "w3", day: "Wednesday", time: "20:40 to 21:10", venue: "Sports Barn", a: "roch-a", b: "don-a" },
  { id: "w4", day: "Wednesday", time: "20:40 to 21:10", venue: "Outside",     a: "misc",   b: "bel-c" },
  { id: "w5", day: "Wednesday", time: "21:20 to 21:50", venue: "Sports Barn", a: "roch-a", b: "don-b" },
  { id: "w6", day: "Wednesday", time: "22:00 to 22:30", venue: "Sports Barn", a: "misc",   b: "bel-b" },
  { id: "t1", day: "Thursday",  time: "11:00 to 11:30", venue: "Sports Barn", a: "bel-b",  b: "bel-c" },
  { id: "t2", day: "Thursday",  time: "11:00 to 11:30", venue: "Outside",     a: "bel-a",  b: "don-a" },
  { id: "t3", day: "Thursday",  time: "11:40 to 12:10", venue: "Sports Barn", a: "bel-a",  b: "don-b" },
  { id: "t4", day: "Thursday",  time: "11:40 to 12:10", venue: "Outside",     a: "bel-b",  b: "don-c" },
  { id: "t5", day: "Thursday",  time: "12:20 to 12:50", venue: "Sports Barn", a: "bel-c",  b: "don-c" },
  { id: "t6", day: "Thursday",  time: "12:20 to 12:50", venue: "Outside",     a: "don-a",  b: "don-b" }
];

const FINAL = { id: "final", day: "Thursday", time: "20:00 to 20:30", venue: "Sports Barn" };

// "3½" style display for scores in halves; null/blank stays blank.
function formatScore(n) {
  if (n === null || n === undefined || n === "") return "";
  const whole = Math.floor(n);
  const half = n - whole >= 0.5;
  if (whole === 0 && half) return "½";
  return half ? whole + "½" : String(whole);
}

function isPlayed(r) {
  return r && typeof r.a === "number" && typeof r.b === "number";
}

// Win 3, draw 1, loss 0. Level on points: rounders difference, then total
// rounders scored, then a short tie-break (flagged, not computed).
function computeStandings(group, results) {
  const rows = {};
  for (const id in TEAMS) {
    if (TEAMS[id].group === group) {
      rows[id] = { team: id, p: 0, w: 0, d: 0, l: 0, f: 0, a: 0, pts: 0 };
    }
  }
  for (const fx of FIXTURES) {
    if (TEAMS[fx.a].group !== group) continue;
    const r = results[fx.id];
    if (!isPlayed(r)) continue;
    const ra = rows[fx.a], rb = rows[fx.b];
    ra.p++; rb.p++;
    ra.f += r.a; ra.a += r.b;
    rb.f += r.b; rb.a += r.a;
    if (r.a > r.b)      { ra.w++; rb.l++; ra.pts += 3; }
    else if (r.b > r.a) { rb.w++; ra.l++; rb.pts += 3; }
    else                { ra.d++; rb.d++; ra.pts++; rb.pts++; }
  }
  const list = Object.values(rows);
  list.forEach(r => { r.diff = r.f - r.a; });
  list.sort((x, y) => y.pts - x.pts || y.diff - x.diff || y.f - x.f ||
    TEAMS[x.team].name.localeCompare(TEAMS[y.team].name));
  // Flag teams still level after all tie-breaks — a short tie-break decides.
  for (let i = 0; i < list.length - 1; i++) {
    const a = list[i], b = list[i + 1];
    if (a.pts === b.pts && a.diff === b.diff && a.f === b.f && (a.p || b.p)) {
      a.tie = b.tie = true;
    }
  }
  return list;
}

if (typeof module !== "undefined") {
  module.exports = { TEAMS, FIXTURES, FINAL, formatScore, isPlayed, computeStandings };
}
