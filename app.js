const ARROW_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17L17 7M7 7h10v10"/></svg>';

function renderCard(project) {
  const a = document.createElement('a');
  a.className = 'card' + (project.featured ? ' featured' : '');
  a.style.setProperty('--card-accent', project.accent);
  a.href = project.url;
  a.target = '_blank';
  a.rel = 'noopener';
  if (project.tags) a.dataset.tags = project.tags.join(' ');

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

  if (section.title) {
    const h2 = document.createElement('h2');
    h2.className = 'section-title';
    h2.textContent = section.title;
    frag.appendChild(h2);
  }

  const grid = document.createElement('div');
  grid.className = 'grid';
  section.projects.forEach((project) => grid.appendChild(renderCard(project)));
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

async function init() {
  initThemeToggle();

  const app = document.getElementById('app');
  try {
    const res = await fetch('projects.json', { cache: 'no-store' });
    const data = await res.json();
    data.sections.forEach((section) => app.appendChild(renderSection(section)));
    injectStructuredData(data);
  } catch (err) {
    app.innerHTML = '<p class="load-error">Couldn\'t load the project list. Try refreshing.</p>';
    console.error('Failed to load projects.json', err);
  }
}

init();
