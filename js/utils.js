// ===================================================
// UTILITA' CONDIVISE
// ===================================================
// Funzioni generiche usate da tutte le pagine:
// escaping HTML, formattazione, storage e piccoli helper.
// Le chiamate musicali stanno in music-api.js, la
// libreria locale in library.js.
// ===================================================

(function () {
  'use strict';

  // ---------------------------------------------------
  // HTML
  // ---------------------------------------------------

  function escapeHtml(value) {
    return String(value === null || value === undefined ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

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
  // MESSAGGI
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
    debounce: debounce,
    escapeHtml: escapeHtml,
    formatNumber: formatNumber,
    formatTime: formatTime,
    pageUrl: pageUrl,
    qs: qs,
    qsa: qsa,
    showError: showError,
    showSpinner: showSpinner,
    storage: storage,
    truncate: truncate
  };
})();
