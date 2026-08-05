// Public page — view switching (booking-app style pill nav) and rendering of
// fixtures, scores and standings from data/results.json.

// ── View switching ─────────────────────────────────────────
const VIEWS = ["schedule", "scores", "rules", "safety", "risk"];

function showView(key) {
  if (!VIEWS.includes(key)) key = "schedule";
  document.querySelectorAll("main .view").forEach(v => {
    v.classList.toggle("is-visible", v.id === "view-" + key);
  });
  document.querySelectorAll(".pill-nav .nav-pill[data-view]").forEach(p => {
    p.classList.toggle("is-active", p.dataset.view === key);
  });
  history.replaceState(null, "", "#" + key);
}

document.querySelectorAll(".pill-nav .nav-pill[data-view]").forEach(p => {
  p.addEventListener("click", () => showView(p.dataset.view));
});

showView((location.hash || "").replace("#", ""));

// ── Rendering ──────────────────────────────────────────────
function fixtureCard(fx, r, withScores) {
  const nameA = fx.a ? TEAMS[fx.a].short : "Group A Winner";
  const nameB = fx.b ? TEAMS[fx.b].short : "Group B Winner";
  const played = withScores && isPlayed(r);
  const winA = played && r.a > r.b;
  const winB = played && r.b > r.a;
  const draw = played && r.a === r.b;
  return '<div class="fixture">' +
    '<div class="fx-meta">' + fx.time + ' &middot; ' + fx.venue +
      (draw ? ' <span class="tag">Draw</span>' : '') + '</div>' +
    '<div class="fx-team' + (winA ? ' win' : '') + '"><span>' + nameA + '</span>' +
      (played ? '<span class="score">' + formatScore(r.a) + '</span>' : '') + '</div>' +
    '<div class="fx-team' + (winB ? ' win' : '') + '"><span>' + nameB + '</span>' +
      (played ? '<span class="score">' + formatScore(r.b) + '</span>' : '') + '</div>' +
    '</div>';
}

function renderDay(elId, day, results, withScores) {
  document.getElementById(elId).innerHTML =
    FIXTURES.filter(f => f.day === day)
      .map(f => fixtureCard(f, results[f.id], withScores)).join('');
}

function renderFinal(elId, results, withScores) {
  const fx = { time: FINAL.time, venue: FINAL.venue, a: null, b: null };
  document.getElementById(elId).innerHTML =
    fixtureCard(fx, results.final, withScores);
}

function formatDiff(n) {
  if (n === 0) return '0';
  return (n > 0 ? '+' : '-') + formatScore(Math.abs(n));
}

function standingsTable(el, group, results) {
  const rows = computeStandings(group, results);
  let html = '<tr><th class="tname">Team</th><th title="Played">P</th>' +
    '<th title="Won">W</th><th title="Drawn">D</th><th title="Lost">L</th>' +
    '<th title="Rounders difference">Diff</th><th title="Rounders scored">For</th>' +
    '<th title="Points">Pts</th></tr>';
  for (const row of rows) {
    html += '<tr><td class="tname">' + TEAMS[row.team].name +
      (row.tie ? ' <span class="tag">tie-break</span>' : '') + '</td>' +
      '<td>' + row.p + '</td><td>' + row.w + '</td><td>' + row.d + '</td>' +
      '<td>' + row.l + '</td><td>' + formatDiff(row.diff) + '</td>' +
      '<td>' + formatScore(row.f) + '</td><td>' + row.pts + '</td></tr>';
  }
  el.innerHTML = html;
}

fetch('data/results.json?t=' + Date.now())
  .then(resp => resp.json())
  .catch(() => ({}))
  .then(results => {
    // Schedule view: who plays whom, when and where — no scores.
    renderDay('sched-wednesday', 'Wednesday', results, false);
    renderDay('sched-thursday', 'Thursday', results, false);
    renderFinal('sched-final', results, false);

    // Live scores view.
    renderDay('scores-wednesday', 'Wednesday', results, true);
    renderDay('scores-thursday', 'Thursday', results, true);
    renderFinal('scores-final', results, true);

    standingsTable(document.getElementById('standings-a'), 'A', results);
    standingsTable(document.getElementById('standings-b'), 'B', results);
  });
