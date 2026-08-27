#!/usr/bin/env node
// Checks every project URL in projects.json and reports which ones are unreachable.
// Exit code 0 = all links healthy, 1 = at least one link is broken.

import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_PATH = path.join(__dirname, '..', 'projects.json');
const TIMEOUT_MS = 15000;

function collectUrls(data) {
  const urls = [];
  for (const section of data.sections) {
    for (const project of section.projects) {
      urls.push({ title: project.title, url: project.url });
    }
  }
  return urls;
}

async function checkUrl({ title, url }) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    let res = await fetch(url, { method: 'HEAD', redirect: 'follow', signal: controller.signal });
    if (res.status === 405 || res.status === 501) {
      res = await fetch(url, { method: 'GET', redirect: 'follow', signal: controller.signal });
    }
    clearTimeout(timer);
    return { title, url, ok: res.ok, status: res.status };
  } catch (err) {
    clearTimeout(timer);
    return { title, url, ok: false, status: null, error: err.message };
  }
}

async function main() {
  const raw = await readFile(DATA_PATH, 'utf8');
  const data = JSON.parse(raw);
  const targets = collectUrls(data);

  const results = await Promise.all(targets.map(checkUrl));
  const broken = results.filter((r) => !r.ok);

  for (const r of results) {
    const status = r.ok ? `OK (${r.status})` : `FAIL (${r.status ?? r.error})`;
    console.log(`${r.ok ? '✓' : '✗'} ${r.title.padEnd(28)} ${status}`);
  }

  if (broken.length > 0) {
    console.log(`\n${broken.length} of ${results.length} links are broken:`);
    for (const r of broken) {
      console.log(`- ${r.title}: ${r.url} — ${r.status ?? r.error}`);
    }
    process.exitCode = 1;
  } else {
    console.log(`\nAll ${results.length} links are healthy.`);
  }
}

main();
