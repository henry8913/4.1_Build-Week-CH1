// ===================================================
// PAGINA CERCA
// ===================================================
// Ricerca con debounce e categorie sfogliabili.
// Le categorie mantengono le immagini originali.
// ===================================================

(function () {
  'use strict';

  const U = window.AppUtils;
  const MusicApi = window.MusicApi;

  const CATEGORIES = [
    {
      name: 'Podcast',
      query: 'podcast',
      cssClass: 'podcast',
      image: 'https://i.pinimg.com/736x/de/6d/9d/de6d9d40ad5f4ca6b519fd29000775c6.jpg'
    },
    {
      name: 'Create per te',
      query: 'new music',
      cssClass: 'create',
      image: 'https://i.pinimg.com/736x/c1/90/3b/c1903b54b02b86b0062fdd247c0e1ed6.jpg'
    },
    {
      name: 'Nuove uscite',
      query: 'new releases',
      cssClass: 'nuove-uscite',
      image: 'https://i.pinimg.com/736x/ae/18/d6/ae18d636caad14a8824fdc93622cfedf.jpg'
    },
    {
      name: 'Pop',
      query: 'pop',
      cssClass: 'pop',
      image: 'https://i.pinimg.com/736x/56/14/68/561468b31eed008ad5c03bd776dc3380.jpg'
    },
    {
      name: 'Hip Hop',
      query: 'hip hop',
      cssClass: 'hip-hop',
      image: 'https://i.pinimg.com/736x/2d/26/c2/2d26c2d50ae2b4eaeaadc7706896ebe4.jpg'
    },
    {
      name: 'Dance/ Elettronica',
      query: 'dance',
      cssClass: 'dance',
      image: 'https://i.pinimg.com/736x/57/1a/84/571a840678559f8159d8508a390d34b7.jpg'
    },
    {
      name: 'Latina',
      query: 'latin',
      cssClass: 'latina',
      image: 'https://i.pinimg.com/736x/f0/9e/41/f09e4125c0f9f86bf47d1db81dd75caa.jpg'
    },
    {
      name: 'Classifiche',
      query: 'top hits',
      cssClass: 'classifiche',
      image: 'https://i.pinimg.com/736x/54/38/03/543803e5d6c93e60bc9449a4955b47f0.jpg'
    }
  ];

  let activeResults = [];
  let lastQuery = '';

  function renderCategories() {
    const container = document.getElementById('search-categories');
    if (!container) return;

    container.innerHTML = CATEGORIES.map(function (category) {
      return (
        '<button type="button" class="category-card ' + category.cssClass + '" data-query="' + U.escapeHtml(category.query) + '">' +
          '<span>' + U.escapeHtml(category.name) + '</span>' +
          '<img src="' + U.escapeHtml(category.image) + '" alt="" loading="lazy">' +
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

    MusicApi.search(query)
      .then(function (tracks) {
        if (lastQuery !== query) return;
        renderResults(tracks, query);
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

  function renderResults(tracks, query) {
    const container = document.getElementById('search-results');
    if (!container) return;

    const seen = new Set();
    const items = (tracks || []).filter(function (track) {
      if (!track || !track.album || !track.album.id) return false;
      const key = String(track.album.id);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    activeResults = items;
    document.title = query + ' - Cerca - Spotify Clone';

    if (!items.length) {
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
        items.slice(0, 24).map(function (track) {
          const cover = track.album.cover || track.album.coverSmall;
          const title = track.album.title || track.title;

          return (
            '<div class="col-6 col-sm-4 col-md-3 col-lg-2">' +
              '<div class="card album-card" role="link" tabindex="0"' +
                ' data-album-id="' + U.escapeHtml(track.album.id) + '"' +
                ' data-track-id="' + U.escapeHtml(track.id) + '"' +
                ' data-album-title="' + U.escapeHtml(track.album.title) + '"' +
                ' data-artist-id="' + U.escapeHtml(track.artist.id) + '"' +
                ' data-artist-name="' + U.escapeHtml(track.artist.name) + '"' +
                ' data-title="' + U.escapeHtml(track.title) + '"' +
                ' data-cover="' + U.escapeHtml(track.album.coverSmall) + '"' +
                ' data-preview-url="' + U.escapeHtml(track.streamUrl) + '"' +
                ' data-duration="' + U.escapeHtml(track.duration) + '"' +
                ' data-album-url="' + U.escapeHtml(U.pageUrl('album.html', { id: track.album.id })) + '">' +
                '<img src="' + U.escapeHtml(cover) + '" class="card-img-top" alt="' + U.escapeHtml(title) + '" loading="lazy">' +
                '<span class="play-hover" role="button" tabindex="-1" aria-label="Riproduci ' + U.escapeHtml(track.title) + '">' +
                  '<i class="bi bi-play-fill"></i>' +
                '</span>' +
                '<div class="card-body p-2">' +
                  '<h3 class="card-title text-truncate">' + U.escapeHtml(title) + '</h3>' +
                  '<p class="card-text text-truncate">' + U.escapeHtml(track.artist.name) + '</p>' +
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
      id: card.getAttribute('data-track-id') || '',
      streamUrl: card.getAttribute('data-preview-url') || '',
      preview: card.getAttribute('data-preview-url') || '',
      title: card.getAttribute('data-title') || '',
      artist: {
        id: card.getAttribute('data-artist-id') || '',
        name: card.getAttribute('data-artist-name') || ''
      },
      album: {
        id: card.getAttribute('data-album-id') || '',
        title: card.getAttribute('data-album-title') || '',
        cover: card.getAttribute('data-cover') || '',
        coverSmall: card.getAttribute('data-cover') || ''
      },
      duration: Number(card.getAttribute('data-duration')) || 30
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
        const cards = U.qsa('.album-card', container).filter(function (element) {
          return element.getAttribute('data-preview-url');
        });
        if (!cards.length) {
          if (window.AppLayout) window.AppLayout.showToast('Nessun brano con anteprima in questi risultati');
          return;
        }
        const index = cards.indexOf(card);
        window.musicPlayer.playFrom(cards.map(trackFromCard), index === -1 ? 0 : index);
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
