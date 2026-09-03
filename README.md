# AI Hub

A curated, single-page directory of my AI projects — agents, prompt engineering,
embodied AI, evals, and security — grouped into Featured, Build & Create, Agents &
Research, and Evaluation & Safety.

Live at: **https://clarkngo.github.io/AI-Hub/**

## What's in it

- [`index.html`](index.html) — page shell: hero, theme toggle, SEO meta, `<main id="app">`.
- [`projects.json`](projects.json) — every project card as data: title, url, description, accent color, icon, tags, section.
- [`app.js`](app.js) — renders the cards from `projects.json` and generates the page's JSON-LD structured data from the same source, so SEO metadata can't drift out of sync with what's actually on the page.
- [`scripts/check-links.mjs`](scripts/check-links.mjs) — zero-dependency Node script that checks every project URL.
- [`.github/workflows/check-links.yml`](.github/workflows/check-links.yml) — runs the checker weekly and on every push to `projects.json`, opening a GitHub issue if a link breaks and closing it once the link recovers.
- `favicon.svg`, `og-image.svg` / `og-image.png`, `robots.txt`, `sitemap.xml` — sharing and search metadata.

No build step, no framework, no backend — plain HTML/CSS/JS, and `fetch()` for the data file.

## Adding a project

Open [`projects.json`](projects.json), find the section it belongs in (or add a new
section object), and add an entry:

```json
{
  "title": "Project Name",
  "url": "https://clarkngo.github.io/project-name/",
  "description": "One sentence on what it is and why it's worth a click.",
  "accent": "#0891b2",
  "icon": "<path d=\"...\"/>",
  "tags": ["tag-one", "tag-two"]
}
```

`icon` is the inner markup of a 24×24 stroke-style SVG (see existing entries for the
pattern). `linkText` and `badge` are optional per-card overrides; `featured: true`
renders a card full-width at the top of its section. No HTML or JS changes needed —
the page, the JSON-LD structured data, and the weekly link checker all pick it up
automatically.

## Deploying it

### GitHub Pages

1. In the repo, go to **Settings → Pages**.
2. Under **Build and deployment**, set **Source** to `Deploy from a branch`.
3. Set **Branch** to `main` and the folder to `/ (root)`.
4. Save. The site publishes at `https://<your-username>.github.io/AI-Hub/`.

### Running it locally

`app.js` loads `projects.json` via `fetch()`, which needs an HTTP origin —
opening `index.html` directly as a `file://` URL won't load the cards. Serve it
with any static file server instead:

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

### Checking links manually

```bash
node scripts/check-links.mjs
```

Exits non-zero if any project URL is unreachable — the same check the scheduled
GitHub Action runs.

## License

[MIT](LICENSE).
