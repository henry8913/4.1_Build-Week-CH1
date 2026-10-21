// ===================================================
// UTILITA' CONDIVISE
// ===================================================
// Funzioni usate da tutte le pagine: escaping HTML,
// chiamate API, formattazione e piccola persistenza.
// ===================================================

(function () {
  'use strict';

  const API_BASE = 'https://striveschool-api.herokuapp.com/api/deezer';
  const REQUEST_TIMEOUT = 12000;

  // ---------------------------------------------------
  // HTML
  // ---------------------------------------------------

  // Converte qualsiasi valore in testo sicuro da inserire
  // dentro innerHTML o dentro un attributo.
  function escapeHtml(value) {
    return String(value === null || value === undefined ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // Costruisce un link sicuro verso una pagina interna.
  function pageUrl(page, params) {
    const search = new URLSearchParams();
    Object.keys(params || {}).forEach(function (key) {
      const value = params[key];
      if (value !== undefined && value !== null && value !== '') {
        search.set(key, value);
      }
    });
    const query = search.toString();
    return query ? page + '?' + query : page;
  }

  // ---------------------------------------------------
  // TESTO E TEMPO
  // ---------------------------------------------------

  function formatTime(totalSeconds) {
    const seconds = Number(totalSeconds);
    if (!isFinite(seconds) || seconds < 0) return '0:00';

    const rounded = Math.floor(seconds);
    const minutes = Math.floor(rounded / 60);
    const rest = rounded % 60;
    return minutes + ':' + (rest < 10 ? '0' + rest : rest);
  }

  function formatNumber(number) {
    const value = Number(number);
    if (!isFinite(value)) return '0';
    return value.toLocaleString('it-IT');
  }

  function truncate(text, maxLength) {
    const value = String(text || '');
    if (value.length <= maxLength) return value;
    return value.slice(0, maxLength).trim() + '...';
  }

  // ---------------------------------------------------
  // API DEEZER (tramite proxy striveschool)
  // ---------------------------------------------------

  async function apiGet(path) {
    const controller = new AbortController();
    const timeoutId = setTimeout(function () {
      controller.abort();
    }, REQUEST_TIMEOUT);

    try {
      const response = await fetch(API_BASE + path, { signal: controller.signal });
      if (!response.ok) {
        throw new Error('Richiesta non riuscita (' + response.status + ')');
      }
      return await response.json();
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error('Il servizio musicale non ha risposto in tempo');
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  const api = {
    base: API_BASE,

    search: function (query, limit) {
      const params = new URLSearchParams({ q: query });
      if (limit) params.set('limit', limit);
      return apiGet('/search?' + params.toString()).then(function (data) {
        return data.data || [];
      });
    },

    album: function (albumId) {
      return apiGet('/album/' + encodeURIComponent(albumId));
    },

    artist: function (artistId) {
      return apiGet('/artist/' + encodeURIComponent(artistId));
    },

    artistTop: function (artistId, limit) {
      return apiGet('/artist/' + encodeURIComponent(artistId) + '/top?limit=' + (limit || 5)).then(function (data) {
        return data.data || [];
      });
    },

    artistAlbums: function (artistId) {
      return apiGet('/artist/' + encodeURIComponent(artistId) + '/albums').then(function (data) {
        return data.data || [];
      });
    }
  };

  // ---------------------------------------------------
  // PERSISTENZA LOCALE
  // ---------------------------------------------------

  const STORAGE_PREFIX = 'spotifyClone.';

  const storage = {
    get: function (key, fallback) {
      try {
        const raw = localStorage.getItem(STORAGE_PREFIX + key);
        if (raw === null) return fallback;
        return JSON.parse(raw);
      } catch (error) {
        return fallback;
      }
    },

    set: function (key, value) {
      try {
        localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
      } catch (error) {
        // localStorage puo' essere disabilitato: non blocchiamo l'app.
      }
    }
  };

  // Piccole liste salvate (album salvati, artisti seguiti, brani preferiti).
  const LISTS = {
    savedAlbums: 'savedAlbums',
    followedArtists: 'followedArtists',
    likedTracks: 'likedTracks'
  };

  function readList(listName) {
    const value = storage.get(listName, []);
    return Array.isArray(value) ? value : [];
  }

  function isInList(listName, id) {
    if (id === undefined || id === null || id === '') return false;
    return readList(listName).some(function (item) {
      return String(item) === String(id);
    });
  }

  function toggleInList(listName, id) {
    if (id === undefined || id === null || id === '') return false;

    const list = readList(listName);
    const position = list.findIndex(function (item) {
      return String(item) === String(id);
    });

    let active;
    if (position === -1) {
      list.push(String(id));
      active = true;
    } else {
      list.splice(position, 1);
      active = false;
    }

    storage.set(listName, list);
    return active;
  }

  // ---------------------------------------------------
  // DOM E VARIE
  // ---------------------------------------------------

  function qs(selector, root) {
    return (root || document).querySelector(selector);
  }

  function qsa(selector, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(selector));
  }

  function debounce(fn, wait) {
    let timer = null;
    return function () {
      const args = arguments;
      const context = this;
      clearTimeout(timer);
      timer = setTimeout(function () {
        fn.apply(context, args);
      }, wait);
    };
  }

  // ---------------------------------------------------
  // MESSAGGI DI ERRORE
  // ---------------------------------------------------

  function showError(container, message) {
    const element = typeof container === 'string' ? document.querySelector(container) : container;
    if (!element) return;
    element.innerHTML =
      '<div class="alert alert-danger app-alert" role="alert">' +
      '<i class="bi bi-exclamation-triangle-fill me-2"></i>' +
      escapeHtml(message) +
      '</div>';
  }

  function showSpinner(container) {
    const element = typeof container === 'string' ? document.querySelector(container) : container;
    if (!element) return;
    element.innerHTML =
      '<div class="d-flex justify-content-center py-4">' +
      '<div class="spinner-border text-light" role="status">' +
      '<span class="visually-hidden">Caricamento...</span>' +
      '</div></div>';
  }

  window.AppUtils = {
    API_BASE: API_BASE,
    LISTS: LISTS,
    api: api,
    apiGet: apiGet,
    debounce: debounce,
    escapeHtml: escapeHtml,
    formatNumber: formatNumber,
    formatTime: formatTime,
    isInList: isInList,
    pageUrl: pageUrl,
    qs: qs,
    qsa: qsa,
    showError: showError,
    showSpinner: showSpinner,
    storage: storage,
    toggleInList: toggleInList,
    truncate: truncate
  };
})();
