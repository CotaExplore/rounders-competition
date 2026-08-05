# Rounders Competition

Static website for a one-off Boys' Brigade rounders competition, hosted on GitHub Pages.

- **Public site:** fixtures, scores, standings, rules, safeguarding, first aid and risk assessments, plus the downloadable Team Guide PDF.
- **Scoring:** the organiser opens `scoring.html`, pastes a GitHub personal access token (kept in memory only), enters scores in halves and saves. Saving commits `data/results.json` back to this repository; the public page shows the new scores on its next load.
- Standings are computed in the browser: win 3, draw 1, loss 0; tie-break by rounders difference, then total rounders scored, then a short tie-break.
- The site stores team results only — no individual names anywhere.

No build step, no backend, no dependencies.
