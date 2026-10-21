// ===================================================
// PAGINA CERCA
// ===================================================
// Ricerca con debounce, categorie sfogliabili e
// risultati riproducibili. Funziona su desktop e mobile.
// ===================================================

(function () {
  'use strict';

  const U = window.AppUtils;

  const CATEGORIES = [
    { name: 'Podcast', query: 'podcast', icon: 'bi-mic-fill', cssClass: 'cat-podcast' },
    { name: 'Create per te', query: 'new music', icon: 'bi-stars', cssClass: 'cat-create' },
    { name: 'Nuove uscite', query: 'new releases', icon: 'bi-calendar-plus-fill', cssClass: 'cat-new' },
    { name: 'Pop', query: 'pop', icon: 'bi-star-fill', cssClass: 'cat-pop' },
    { name: 'Hip Hop', query: 'hip hop', icon: 'bi-music-note-beamed', cssClass: 'cat-hiphop' },
    { name: 'Dance / Elettronica', query: 'dance', icon: 'bi-lightning-charge-fill', cssClass: 'cat-dance' },
    { name: 'Latina', query: 'latin', icon: 'bi-suit-spade-fill', cssClass: 'cat-latina' },
    { name: 'Classifiche', query: 'top hits', icon: 'bi-bar-chart-fill', cssClass: 'cat-charts' }
  ];

  let activeResults = [];
  let lastQuery = '';

  // ---------------------------------------------------
  // CATEGORIE
  // ---------------------------------------------------

  function renderCategories() {
    const container = document.getElementById('search-categories');
    if (!container) return;

    container.innerHTML = CATEGORIES.map(function (category) {
      return (
        '<button type="button" class="category-card ' + category.cssClass + '" data-query="' + U.escapeHtml(category.query) + '">' +
          '<span>' + U.escapeHtml(category.name) + '</span>' +
          '<i class="bi ' + category.icon + '" aria-hidden="true"></i>' +
        '</button>'
      );
    }).join('');

    U.qsa('.category-card', container).forEach(function (card) {
      card.addEventListener('click', function () {
        const query = card.getAttribute('data-query');
        const input = document.getElementById('search-input');
        if (input) input.value = query;
        performSearch(query, true);
        const main = document.getElementById('main-content');
        if (main) main.scrollTo({ top: 0, behavior: 'smooth' });
      });
    });
  }

  // ---------------------------------------------------
  // RICERCA
  // ---------------------------------------------------

  function clearResults() {
    const container = document.getElementById('search-results');
    if (container) container.innerHTML = '';
    activeResults = [];
    lastQuery = '';
    document.title = 'Cerca - Spotify Clone';
    updateUrl('');
  }

  function updateUrl(query) {
    if (!window.history || !window.history.replaceState) return;

    const url = query
      ? U.pageUrl(window.location.pathname, { search: query })
      : window.location.pathname;

    window.history.replaceState({ query: query }, '', url);
  }

  function performSearch(rawQuery, updateHistory) {
    const query = String(rawQuery || '').trim();
    if (!query) {
      clearResults();
      return;
    }

    if (query === lastQuery && activeResults.length) return;

    lastQuery = query;
    const container = document.getElementById('search-results');
    if (!container) return;

    U.showSpinner(container);

    if (updateHistory !== false) updateUrl(query);

    U.api.search(query)
      .then(function (items) {
        if (lastQuery !== query) return; // risposta vecchia: la ignoriamo
        renderResults(items, query);
      })
      .catch(function (error) {
        console.error('Errore ricerca:', error);
        if (lastQuery !== query) return;
        U.showError(container, 'Errore nella ricerca: ' + error.message);
      });
  }

  // ---------------------------------------------------
  // RISULTATI
  // ---------------------------------------------------

  function renderResults(items, query) {
    const container = document.getElementById('search-results');
    if (!container) return;

    const seen = new Set();
    const albums = (items || []).filter(function (item) {
      if (!item || !item.album || !item.album.id || !item.artist) return false;
      const key = String(item.album.id);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    activeResults = albums;

    document.title = query + ' - Cerca - Spotify Clone';

    if (!albums.length) {
      container.innerHTML =
        '<h2 class="search-results-title">Risultati per "' + U.escapeHtml(query) + '"</h2>' +
        '<div class="empty-state">' +
          '<i class="bi bi-search"></i>' +
          '<p class="mb-1">Nessun risultato per "' + U.escapeHtml(query) + '".</p>' +
          '<p class="small text-white-50 mb-0">Prova con un altro titolo, artista o genere.</p>' +
        '</div>';
      return;
    }

    container.innerHTML =
      '<h2 class="search-results-title">Risultati per "' + U.escapeHtml(query) + '"</h2>' +
      '<div class="row g-3" id="results-grid">' +
        albums.slice(0, 24).map(function (item) {
          const album = item.album;
          const cover = album.cover_medium || album.cover_small || 'img/cover_c.jpg';
          const title = album.title || 'Album senza titolo';
          const artistName = item.artist.name || 'Artista sconosciuto';

          return (
            '<div class="col-6 col-sm-4 col-md-3 col-lg-2">' +
              '<div class="card album-card" role="link" tabindex="0"' +
                ' data-album-id="' + U.escapeHtml(album.id) + '"' +
                ' data-track-id="' + U.escapeHtml(item.id !== undefined && item.id !== null ? item.id : '') + '"' +
                ' data-album-title="' + U.escapeHtml(title) + '"' +
                ' data-artist-id="' + U.escapeHtml(item.artist.id) + '"' +
                ' data-artist-name="' + U.escapeHtml(artistName) + '"' +
                ' data-title="' + U.escapeHtml(item.title || title) + '"' +
                ' data-cover="' + U.escapeHtml(cover) + '"' +
                ' data-preview-url="' + U.escapeHtml(item.preview || '') + '"' +
                ' data-album-url="' + U.escapeHtml(U.pageUrl('album.html', { id: album.id })) + '">' +
                '<img src="' + U.escapeHtml(cover) + '" class="card-img-top" alt="' + U.escapeHtml(title) + '" loading="lazy">' +
                '<span class="play-hover" role="button" tabindex="-1" aria-label="Riproduci ' + U.escapeHtml(item.title || title) + '">' +
                  '<i class="bi bi-play-fill"></i>' +
                '</span>' +
                '<div class="card-body p-2">' +
                  '<h3 class="card-title text-truncate">' + U.escapeHtml(title) + '</h3>' +
                  '<p class="card-text text-truncate">' + U.escapeHtml(artistName) + '</p>' +
                '</div>' +
              '</div>' +
            '</div>'
          );
        }).join('') +
      '</div>';
  }

  // ---------------------------------------------------
  // EVENTI
  // ---------------------------------------------------

  function trackFromCard(card) {
    return {
      preview: card.getAttribute('data-preview-url') || '',
      title: card.getAttribute('data-title') || '',
      id: card.getAttribute('data-track-id') || '',
      artist: {
        id: card.getAttribute('data-artist-id') || '',
        name: card.getAttribute('data-artist-name') || ''
      },
      album: {
        id: card.getAttribute('data-album-id') || '',
        title: card.getAttribute('data-album-title') || '',
        cover_small: card.getAttribute('data-cover') || ''
      },
      duration: 30
    };
  }

  function bindResultEvents() {
    const container = document.getElementById('search-results');
    if (!container) return;

    container.addEventListener('click', function (event) {
      const hover = event.target.closest('.play-hover');
      const card = event.target.closest('.album-card');

      if (hover && card) {
        event.preventDefault();
        const cards = U.qsa('.album-card[data-preview-url]', container);
        const playable = cards.filter(function (element) {
          return element.getAttribute('data-preview-url');
        });
        if (!playable.length) {
          if (window.AppLayout) window.AppLayout.showToast("Nessun brano con anteprima in questi risultati");
          return;
        }
        const index = playable.indexOf(card);
        window.musicPlayer.playFrom(playable.map(trackFromCard), index === -1 ? 0 : index);
        return;
      }

      if (card) {
        const url = card.getAttribute('data-album-url');
        if (url) window.location.href = url;
      }
    });

    container.addEventListener('keydown', function (event) {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      const card = event.target.closest('.album-card');
      if (!card) return;
      event.preventDefault();
      const url = card.getAttribute('data-album-url');
      if (url) window.location.href = url;
    });
  }

  // ---------------------------------------------------
  // AVVIO
  // ---------------------------------------------------

  function init() {
    const input = document.getElementById('search-input');
    if (!input) return;

    renderCategories();
    bindResultEvents();

    const debouncedSearch = U.debounce(function () {
      const query = input.value.trim();
      if (query.length >= 2) {
        performSearch(query, true);
      } else if (!query) {
        clearResults();
      }
    }, 450);

    input.addEventListener('input', debouncedSearch);

    input.addEventListener('keydown', function (event) {
      if (event.key !== 'Enter') return;
      event.preventDefault();
      performSearch(input.value, true);
    });

    const query = new URLSearchParams(window.location.search).get('search');
    if (query) {
      input.value = query;
      const sidebarInput = document.getElementById('sidebar-search-input');
      if (sidebarInput) sidebarInput.value = query;
      performSearch(query, false);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
