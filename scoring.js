// Organiser scoring — edits data/results.json and commits it back to the repo
// via the GitHub contents API. The token stays in the page; nothing is stored.

const OWNER = "cotaexplore";
const REPO = "rounders-competition";
const DATA_PATH = "data/results.json";
const API_URL = "https://api.github.com/repos/" + OWNER + "/" + REPO + "/contents/" + DATA_PATH;

const statusEl = document.getElementById("status");
const saveBtn = document.getElementById("save");

function scoreRow(fx) {
  const nameA = fx.a ? TEAMS[fx.a].short : "Group A Winner";
  const nameB = fx.b ? TEAMS[fx.b].short : "Group B Winner";
  return '<div class="fixture score-entry" data-id="' + fx.id + '">' +
    '<div class="fx-meta">' + fx.time + ' &middot; ' + fx.venue + '</div>' +
    '<div class="fx-team"><span>' + nameA + '</span>' +
      '<input type="number" min="0" step="0.5" inputmode="decimal" data-side="a"></div>' +
    '<div class="fx-team"><span>' + nameB + '</span>' +
      '<input type="number" min="0" step="0.5" inputmode="decimal" data-side="b"></div>' +
    '</div>';
}

document.getElementById("score-wednesday").innerHTML =
  FIXTURES.filter(f => f.day === "Wednesday").map(scoreRow).join("");
document.getElementById("score-thursday").innerHTML =
  FIXTURES.filter(f => f.day === "Thursday").map(scoreRow).join("");
document.getElementById("score-final").innerHTML =
  scoreRow({ id: "final", time: FINAL.time, venue: FINAL.venue, a: null, b: null });

function input(id, side) {
  return document.querySelector('[data-id="' + id + '"] [data-side="' + side + '"]');
}

// Prefill from the published results file.
fetch("data/results.json?t=" + Date.now())
  .then(resp => resp.json())
  .then(results => {
    for (const id in results) {
      const r = results[id];
      if (!r) continue;
      if (typeof r.a === "number") input(id, "a").value = r.a;
      if (typeof r.b === "number") input(id, "b").value = r.b;
    }
    statusEl.textContent = "Scores loaded. Edit and save.";
    saveBtn.disabled = false;
  })
  .catch(() => {
    statusEl.textContent = "Could not load current scores.";
    saveBtn.disabled = false;
  });

function readScores() {
  const results = {};
  const ids = FIXTURES.map(f => f.id).concat(["final"]);
  for (const id of ids) {
    const rawA = input(id, "a").value.trim();
    const rawB = input(id, "b").value.trim();
    if (rawA === "" && rawB === "") { results[id] = { a: null, b: null }; continue; }
    if (rawA === "" || rawB === "") {
      throw new Error("Enter both scores for " + id + " (or leave both blank).");
    }
    const a = Number(rawA), b = Number(rawB);
    for (const n of [a, b]) {
      if (!isFinite(n) || n < 0 || (n * 2) % 1 !== 0) {
        throw new Error("Scores must be in halves (0, 0.5, 1, 1.5 …).");
      }
    }
    results[id] = { a: a, b: b };
  }
  return results;
}

saveBtn.addEventListener("click", async () => {
  const token = document.getElementById("token").value.trim();
  if (!token) { statusEl.textContent = "Paste a GitHub token first."; return; }

  let results;
  try { results = readScores(); }
  catch (e) { statusEl.textContent = e.message; return; }

  saveBtn.disabled = true;
  statusEl.textContent = "Saving…";
  const headers = {
    "Authorization": "Bearer " + token,
    "Accept": "application/vnd.github+json"
  };
  try {
    const getResp = await fetch(API_URL, { headers });
    if (!getResp.ok) throw new Error("Could not read repository (check the token).");
    const sha = (await getResp.json()).sha;

    const body = {
      message: "Update scores",
      content: btoa(JSON.stringify(results, null, 2) + "\n"),
      sha: sha
    };
    const putResp = await fetch(API_URL, {
      method: "PUT", headers, body: JSON.stringify(body)
    });
    if (!putResp.ok) throw new Error("Save failed (" + putResp.status + "). Try again.");
    statusEl.textContent = "Saved. Public page updates on its next load (about a minute).";
  } catch (e) {
    statusEl.textContent = e.message;
  } finally {
    saveBtn.disabled = false;
  }
});
