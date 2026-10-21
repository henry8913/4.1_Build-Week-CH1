#!/usr/bin/env node
// ===================================================
// CONTROLLI DI BASE
// ===================================================
// Verifica che le pagine referenzino solo file esistenti,
// che non ci siano id duplicati e che il JavaScript
// sia sintatticamente valido.
// ===================================================

'use strict';

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const PAGES = ['index.html', 'album.html', 'artist.html', 'search.html', 'liked.html', 'library.html', 'playlist.html'];

const errors = [];
const checkedFiles = new Set();

function relative(file) {
  return path.relative(ROOT, file);
}

function isLocalReference(reference) {
  return !/^(https?:|mailto:|tel:|data:|javascript:|#|\/\/)/i.test(reference);
}

function normalizeReference(reference) {
  return reference.split('#')[0].split('?')[0];
}

function checkReference(reference, source) {
  if (!isLocalReference(reference)) return;

  const clean = normalizeReference(reference);
  if (!clean) return;

  const target = path.join(ROOT, clean);
  checkedFiles.add(target);

  if (!fs.existsSync(target)) {
    errors.push(relative(source) + ': riferimento mancante -> ' + reference);
  }
}

function checkPage(page) {
  const file = path.join(ROOT, page);
  if (!fs.existsSync(file)) {
    errors.push('Pagina mancante: ' + page);
    return;
  }

  const html = fs.readFileSync(file, 'utf8');

  const referencePattern = /(?:href|src)="([^"]+)"/g;
  let match;
  while ((match = referencePattern.exec(html)) !== null) {
    checkReference(match[1], file);
  }

  const ids = new Map();
  const idPattern = /\sid="([^"]+)"/g;
  while ((match = idPattern.exec(html)) !== null) {
    const id = match[1];
    ids.set(id, (ids.get(id) || 0) + 1);
  }

  ids.forEach(function (count, id) {
    if (count > 1) {
      errors.push(page + ': id duplicato -> #' + id);
    }
  });

  const expectedScripts = ['js/utils.js', 'js/music-api.js', 'js/library.js', 'js/layout.js', 'js/player.js'];
  expectedScripts.forEach(function (script) {
    if (!html.includes('src="' + script + '"')) {
      errors.push(page + ': script condiviso mancante -> ' + script);
    }
  });
}

function checkCss() {
  const cssDir = path.join(ROOT, 'css');
  fs.readdirSync(cssDir).filter(function (file) {
    return file.endsWith('.css');
  }).forEach(function (file) {
    const cssPath = path.join(cssDir, file);
    const css = fs.readFileSync(cssPath, 'utf8');
    const urlPattern = /url\((['"]?)([^'")]+)\1\)/g;
    let match;

    while ((match = urlPattern.exec(css)) !== null) {
      const reference = match[2].trim();
      if (!isLocalReference(reference)) continue;

      const target = path.join(cssDir, reference);
      if (!fs.existsSync(target)) {
        errors.push('css/' + file + ': risorsa mancante -> ' + reference);
      }
    }
  });
}

function checkJavaScript() {
  const jsDir = path.join(ROOT, 'js');
  fs.readdirSync(jsDir).filter(function (file) {
    return file.endsWith('.js');
  }).forEach(function (file) {
    const jsPath = path.join(jsDir, file);
    const source = fs.readFileSync(jsPath, 'utf8');

    try {
      execFileSync(process.execPath, ['--check', jsPath], { stdio: 'pipe' });
    } catch (error) {
      errors.push('js/' + file + ': errore di sintassi');
    }

    // Verifica i percorsi locali a immagini citati nel JavaScript.
    const imagePattern = /['"](img\/[^'"]+)['"]/g;
    let match;
    while ((match = imagePattern.exec(source)) !== null) {
      const reference = match[1];
      if (!fs.existsSync(path.join(ROOT, reference))) {
        errors.push('js/' + file + ': immagine mancante -> ' + reference);
      }
    }
  });
}

PAGES.forEach(checkPage);
checkCss();
checkJavaScript();

if (errors.length) {
  console.error('Controlli falliti (' + errors.length + '):');
  errors.forEach(function (error) {
    console.error('  - ' + error);
  });
  process.exit(1);
}

console.log('Controlli superati: ' + PAGES.length + ' pagine, CSS e JavaScript.');
console.log('File locali verificati: ' + checkedFiles.size + '.');
