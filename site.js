// Public page — renders fixtures, scores and standings from data/results.json.

function fixtureCard(fx, r) {
  const played = isPlayed(r);
  const winA = played && r.a > r.b;
  const winB = played && r.b > r.a;
  const draw = played && r.a === r.b;
  const nameA = fx.a ? TEAMS[fx.a].short : "Group A Winner";
  const nameB = fx.b ? TEAMS[fx.b].short : "Group B Winner";
  return '<div class="fixture">' +
    '<div class="fx-meta">' + fx.time + ' &middot; ' + fx.venue +
      (draw ? ' <span class="tag">Draw</span>' : '') + '</div>' +
    '<div class="fx-team' + (winA ? ' win' : '') + '"><span>' + nameA +
      '</span><span class="score">' + (played ? formatScore(r.a) : '') + '</span></div>' +
    '<div class="fx-team' + (winB ? ' win' : '') + '"><span>' + nameB +
      '</span><span class="score">' + (played ? formatScore(r.b) : '') + '</span></div>' +
    '</div>';
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
  const anyTie = rows.some(r => r.tie);
  if (anyTie) {
    el.insertAdjacentHTML('afterend',
      '<p class="note">Teams marked tie-break are still level after rounders difference ' +
      'and total rounders scored — a short tie-break decides the group position.</p>');
  }
}

fetch('data/results.json?t=' + Date.now())
  .then(resp => resp.json())
  .catch(() => ({}))
  .then(results => {
    document.getElementById('fixtures-wednesday').innerHTML =
      FIXTURES.filter(f => f.day === 'Wednesday').map(f => fixtureCard(f, results[f.id])).join('');
    document.getElementById('fixtures-thursday').innerHTML =
      FIXTURES.filter(f => f.day === 'Thursday').map(f => fixtureCard(f, results[f.id])).join('');

    const finalFx = { time: FINAL.time, venue: FINAL.venue, a: null, b: null };
    document.getElementById('fixtures-final').innerHTML = fixtureCard(finalFx, results.final);

    const fr = results.final;
    if (isPlayed(fr)) {
      document.getElementById('final-teams').textContent =
        'Group A Winner ' + formatScore(fr.a) + ' v ' + formatScore(fr.b) + ' Group B Winner';
    }

    standingsTable(document.getElementById('standings-a'), 'A', results);
    standingsTable(document.getElementById('standings-b'), 'B', results);
  });
