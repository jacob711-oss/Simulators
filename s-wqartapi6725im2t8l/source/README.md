# Source code

The website's pages are built from these files. Edit here, then rebuild.

- `sims/kit/` — shared code used by the ten kit simulators (shell, styles, game loop, worlds, emoji icons, extras), and `build.py`, which builds one simulator: `python3 sims/kit/build.py sims/<name>`
- `sims/<name>/` — each kit simulator: `meta.json` (name, theme, text), `sim.js` (the simulation), `content.js` (challenges, tutorial, demo), `panes.html`, `extra.css`
- `bio/` — Biosphere (built with `python3 build.py` from inside `bio/`)
- `barycenter.html` — Barycenter (wrapped into a page by `tools/build_pub.sh` using `public/index.html`)
- `quasar/index.html` — Quasar AI
- `sports-game/` — Sports (14 sports, built from BOUNDARY 26): `index.html` is the page, `cricket/index.html` is the cricket game, `src/` holds the parts the page is joined from. `publish_all.sh` copies it over the old kit Sports simulator (`sims/sports/` is no longer used for the live page)
- `tools/` — `publish_all.sh` rebuilds everything into the site; `make_hub.py` builds the Our Simulations! page; `seo.py` adds link previews, icons and the sitemap; `shots.cjs` takes preview pictures; `linkcheck.py` checks every link

The build scripts were written for the original build machine's folders, so paths inside them may need changing before they run elsewhere.
