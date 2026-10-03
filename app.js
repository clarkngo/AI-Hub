const ARROW_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17L17 7M7 7h10v10"/></svg>';

function renderCard(project) {
  const a = document.createElement('a');
  a.className = 'card' + (project.featured ? ' featured' : '');
  a.style.setProperty('--card-accent', project.accent);
  a.href = project.url;
  a.target = '_blank';
  a.rel = 'noopener';
  if (project.tags) a.dataset.tags = project.tags.join(' ');
  a.dataset.search = normalize([project.title, project.description, (project.tags || []).join(' ')].join(' '));

  a.innerHTML = `
    <div class="card-icon">
      <svg viewBox="0 0 24 24" fill="none" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${project.icon}</svg>
    </div>
    <div class="card-body">
      ${project.badge ? `<span class="badge">${project.badge}</span>` : ''}
      <h3 class="card-title">${project.title}</h3>
      <p class="card-text">${project.description}</p>
      <span class="card-link">${project.linkText || 'Visit project'} ${ARROW_ICON}</span>
    </div>
  `;
  return a;
}

function renderSection(section) {
  const frag = document.createDocumentFragment();
  const sectionTitle = section.title ? normalize(section.title) : '';

  if (section.title) {
    const h2 = document.createElement('h2');
    h2.className = 'section-title';
    h2.textContent = section.title;
    frag.appendChild(h2);
  }

  const grid = document.createElement('div');
  grid.className = 'grid';
  section.projects.forEach((project) => {
    const card = renderCard(project);
    if (sectionTitle) card.dataset.search += ' ' + sectionTitle;
    grid.appendChild(card);
  });
  frag.appendChild(grid);

  return frag;
}

function injectStructuredData(data) {
  const items = [];
  let position = 1;
  data.sections.forEach((section) => {
    section.projects.forEach((project) => {
      items.push({
        '@type': 'ListItem',
        position: position++,
        item: {
          '@type': 'CreativeWork',
          name: project.title,
          description: project.description,
          url: project.url,
        },
      });
    });
  });

  const ld = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'AI Hub — Curated AI Projects',
    itemListElement: items,
  };

  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.textContent = JSON.stringify(ld);
  document.head.appendChild(script);
}

function currentTheme() {
  const attr = document.documentElement.getAttribute('data-theme');
  if (attr === 'light' || attr === 'dark') return attr;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

const SUN_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>';
const MOON_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>';

function initThemeToggle() {
  const btn = document.getElementById('theme-toggle');
  if (!btn) return;

  function paint(theme) {
    btn.innerHTML = theme === 'dark' ? SUN_ICON : MOON_ICON;
    btn.setAttribute('aria-label', theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme');
  }

  paint(currentTheme());

  btn.addEventListener('click', () => {
    const next = currentTheme() === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    try {
      localStorage.setItem('theme', next);
    } catch (e) {
      /* localStorage unavailable — theme just won't persist */
    }
    paint(next);
  });
}

// Lowercase and strip accents/non-breaking hyphens so "ai-unplugged" matches "AI‑Unplugged".
function normalize(text) {
  return text
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\u2010-\u2015]/g, '-')
    .toLowerCase();
}

function initSearch() {
  const input = document.getElementById('search-input');
  const clear = document.getElementById('search-clear');
  const kbd = document.getElementById('search-kbd');
  const status = document.getElementById('search-status');
  const app = document.getElementById('app');
  if (!input) return;

  const isMac = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
  kbd.innerHTML = `<kbd>/</kbd><kbd>${isMac ? '⌘' : 'Ctrl'} K</kbd>`;

  function apply() {
    const terms = normalize(input.value).trim().split(/\s+/).filter(Boolean);
    const cards = app.querySelectorAll('.card');
    let matches = 0;

    cards.forEach((card) => {
      const hit = terms.every((t) => card.dataset.search.includes(t));
      card.hidden = !hit;
      if (hit) matches++;
    });

    // Hide any section whose grid has no visible cards, along with its heading.
    app.querySelectorAll('.grid').forEach((grid) => {
      const empty = !grid.querySelector('.card:not([hidden])');
      grid.hidden = empty;
      const heading = grid.previousElementSibling;
      if (heading && heading.classList.contains('section-title')) heading.hidden = empty;
    });

    clear.hidden = !input.value;
    kbd.hidden = !!input.value;
    if (!terms.length) status.textContent = '';
    else if (!matches) status.textContent = `No projects match “${input.value.trim()}”.`;
    else status.textContent = `${matches} of ${cards.length} project${cards.length === 1 ? '' : 's'}`;

    const url = new URL(window.location.href);
    if (terms.length) url.searchParams.set('q', input.value.trim());
    else url.searchParams.delete('q');
    history.replaceState(null, '', url);
  }

  function reset() {
    input.value = '';
    apply();
  }

  input.addEventListener('input', apply);

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (input.value) reset();
      else input.blur();
      e.preventDefault();
    } else if (e.key === 'Enter') {
      const first = app.querySelector('.card:not([hidden])');
      if (first && input.value.trim()) first.click();
    } else if (e.key === 'ArrowDown') {
      const first = app.querySelector('.card:not([hidden])');
      if (first) {
        first.focus();
        e.preventDefault();
      }
    }
  });

  clear.addEventListener('click', () => {
    reset();
    input.focus();
  });

  document.addEventListener('keydown', (e) => {
    const target = e.target;
    const typing = target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName);

    if ((e.metaKey || e.ctrlKey) && !e.altKey && !e.shiftKey && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      input.focus();
      input.select();
    } else if (e.key === '/' && !typing && !e.metaKey && !e.ctrlKey && !e.altKey) {
      e.preventDefault();
      input.focus();
      input.select();
    }
  });

  const initial = new URLSearchParams(window.location.search).get('q');
  if (initial) input.value = initial;
  return apply;
}

async function init() {
  initThemeToggle();
  const applySearch = initSearch();

  const app = document.getElementById('app');
  try {
    const res = await fetch('projects.json', { cache: 'no-store' });
    const data = await res.json();
    data.sections.forEach((section) => app.appendChild(renderSection(section)));
    injectStructuredData(data);
    if (applySearch) applySearch();
  } catch (err) {
    app.innerHTML = '<p class="load-error">Couldn\'t load the project list. Try refreshing.</p>';
    console.error('Failed to load projects.json', err);
  }
}

init();
