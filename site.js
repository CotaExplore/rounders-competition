// Public page — view switching (booking-app style pill nav) and rendering of
// fixtures, scores and standings from data/results.json.

// ── View switching ─────────────────────────────────────────
const VIEWS = ["schedule", "scores", "rules", "safety", "risk"];

function showView(key) {
  if (!VIEWS.includes(key)) key = "schedule";
  document.querySelectorAll("main .view").forEach(v => {
    v.classList.toggle("is-visible", v.id === "view-" + key);
  });
  let label = "";
  document.querySelectorAll(".pill-nav .nav-pill[data-view]").forEach(p => {
    const active = p.dataset.view === key;
    p.classList.toggle("is-active", active);
    if (active) { p.setAttribute("aria-current", "true"); label = p.textContent.trim(); }
    else p.removeAttribute("aria-current");
  });
  const live = document.getElementById("a11y-live");
  if (live && label) live.textContent = "Showing " + label + ".";
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
  const group = fx.a ? TEAMS[fx.a].group : null;
  const played = withScores && isPlayed(r);
  const winA = played && r.a > r.b;
  const winB = played && r.b > r.a;
  const draw = played && r.a === r.b;
  const trophy = '<i class="fa-solid fa-trophy" aria-hidden="true"></i> ';
  return '<div class="fixture' + (played && !draw ? ' has-winner' : '') + '">' +
    '<div class="fx-meta">' + fx.time + ' &middot; ' + fx.venue +
      (group ? ' <span class="tag tag-group tag-group-' + group + '">Group ' + group + '</span>' : '') +
      (draw ? ' <span class="tag">Draw</span>' : '') + '</div>' +
    '<div class="fx-team' + (winA ? ' win' : '') + '"><span>' + (winA ? trophy : '') + nameA + '</span>' +
      (played ? '<span class="score">' + formatScore(r.a) + '</span>' : '') + '</div>' +
    '<div class="fx-team' + (winB ? ' win' : '') + '"><span>' + (winB ? trophy : '') + nameB + '</span>' +
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
    '<th title="Rounders scored">For</th><th title="Rounders conceded">Against</th>' +
    '<th title="For minus Against">Diff</th>' +
    '<th title="Points">Pts</th></tr>';
  rows.forEach((row, i) => {
    const leader = i === 0 && row.p > 0;
    html += '<tr class="' + (leader ? 'standings-leader' : '') + '"><td class="tname">' +
      (leader ? '<i class="fa-solid fa-crown" aria-hidden="true"></i> ' : '') +
      TEAMS[row.team].name +
      (row.tie ? ' <span class="tag">tie-break</span>' : '') + '</td>' +
      '<td>' + row.p + '</td><td>' + row.w + '</td><td>' + row.d + '</td>' +
      '<td>' + row.l + '</td>' +
      '<td>' + formatScore(row.f) + '</td><td>' + formatScore(row.a) + '</td>' +
      '<td>' + formatDiff(row.diff) + '</td><td>' + row.pts + '</td></tr>';
  });
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

    const anyPlayed = Object.values(results).some(isPlayed);
    const emptyNote = document.getElementById('scores-empty');
    if (emptyNote) emptyNote.hidden = anyPlayed;
  });
