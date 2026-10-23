// ===================================================
// PAGINA ALBUM
// ===================================================
// Header, azioni, tracklist e footer di un album.
// ===================================================

(function () {
  'use strict';

  const U = window.AppUtils;
  const MusicApi = window.MusicApi;
  const Library = window.AppLibrary;

  let currentAlbum = null;

  function getAlbumId() {
    return new URLSearchParams(window.location.search).get('id');
  }

  function loadAlbum(albumId) {
    const container = document.getElementById('album-details-container');
    if (!container) return;

    U.showSpinner(container);

    MusicApi.getAlbum(albumId)
      .then(function (album) {
        if (!album || !album.id) throw new Error('Album non trovato');
        currentAlbum = album;
        renderAlbum(album);
      })
      .catch(function (error) {
        console.error('Errore dettagli album:', error);
        U.showError(container, 'Errore nel caricamento dell\'album: ' + error.message);
      });
  }

  // ---------------------------------------------------
  // TRACKLIST
  // ---------------------------------------------------

  function trackRowMarkup(track, index) {
    return (
      '<div class="track-list-row" role="button" tabindex="0"' +
        ' data-preview-url="' + U.escapeHtml(track.streamUrl) + '"' +
        ' data-track-id="' + U.escapeHtml(track.id) + '"' +
        ' data-track-index="' + index + '"' +
        ' aria-label="Riproduci ' + U.escapeHtml(track.title) + '">' +
        '<div class="track-number">' + (index + 1) + '</div>' +
        '<div class="track-main">' +
          '<span class="track-title">' + U.escapeHtml(track.title) + '</span>' +
          '<span class="track-artist">' + U.escapeHtml(track.artist.name) + '</span>' +
        '</div>' +
        '<button type="button" class="track-add" data-track-index="' + index + '" aria-label="Aggiungi ' + U.escapeHtml(track.title) + ' a una playlist">' +
          '<i class="bi bi-plus-circle"></i>' +
        '</button>' +
        '<div class="track-duration">' + U.formatTime(track.duration) + '</div>' +
      '</div>'
    );
  }

  // ---------------------------------------------------
  // RENDER
  // ---------------------------------------------------

  function renderAlbum(album) {
    const container = document.getElementById('album-details-container');
    if (!container) return;

    const tracks = album.tracks || [];
    const totalSeconds = Library.durationOfTracks(tracks);
    const totalDuration = totalSeconds ? Math.round(totalSeconds / 60) + ' min' : '';
    const year = album.year || '';

    const metaParts = [];
    if (album.artist.id) {
      metaParts.push(
        '<a href="' + U.escapeHtml(U.pageUrl('artist.html', { id: album.artist.id })) + '" class="text-white text-decoration-none album-artist-link">' +
          U.escapeHtml(album.artist.name) +
        '</a>'
      );
    } else {
      metaParts.push(U.escapeHtml(album.artist.name));
    }
    if (year) metaParts.push(U.escapeHtml(year));
    metaParts.push(tracks.length + (tracks.length === 1 ? ' brano' : ' brani'));
    if (totalDuration) metaParts.push(totalDuration);

    container.innerHTML =
      '<div class="album-header">' +
        '<img src="' + U.escapeHtml(album.cover) + '" alt="Copertina di ' + U.escapeHtml(album.title) + '" class="album-cover-lg">' +
        '<div class="album-info">' +
          '<div class="album-type">ALBUM</div>' +
          '<h1 class="album-title">' + U.escapeHtml(album.title) + '</h1>' +
          '<div class="album-details">' +
            (album.artistPicture
              ? '<img src="' + U.escapeHtml(album.artistPicture) + '" alt="" class="album-artist-img" loading="lazy">'
              : '') +
            '<span>' + metaParts.join(' <span class="meta-dot">&bull;</span> ') + '</span>' +
          '</div>' +
        '</div>' +
      '</div>' +

      '<div class="album-actions">' +
        '<button type="button" class="btn btn-success rounded-pill btn-play" id="album-play-btn"' +
          (tracks.length ? '' : ' disabled') + '>' +
          '<i class="bi bi-play-fill"></i> Play' +
        '</button>' +
        '<button type="button" class="btn btn-outline-light rounded-pill btn-save" id="album-save-btn" aria-pressed="false">' +
          '<i class="bi bi-heart"></i> Salva' +
        '</button>' +
      '</div>' +

      '<div class="track-list">' +
        '<div class="track-list-header">' +
          '<div class="track-number">#</div>' +
          '<div>TITOLO</div>' +
          '<div class="track-add-spacer"></div>' +
          '<div class="track-duration"><i class="bi bi-clock" aria-hidden="true"></i></div>' +
        '</div>' +
        (tracks.length
          ? tracks.map(trackRowMarkup).join('')
          : '<p class="empty-state p-3">Nessun brano disponibile per questo album.</p>') +
      '</div>' +

      '<div class="album-footer">' +
        (album.releaseDate
          ? '<p class="text-white-50 small mb-1">' + U.escapeHtml(new Date(album.releaseDate).toLocaleDateString('it-IT')) + '</p>'
          : '') +
        (album.copyright
          ? '<p class="text-white-50 small mb-0">' + U.escapeHtml(album.copyright) + '</p>'
          : '') +
      '</div>';

    document.title = album.title + ' - Spotify Clone';
    bindAlbumEvents(album, tracks);
    syncSaveButton(album);
  }

  // ---------------------------------------------------
  // AZIONI
  // ---------------------------------------------------

  function syncSaveButton(album) {
    const button = document.getElementById('album-save-btn');
    if (!button) return;

    const saved = Library.isAlbumSaved(album.id);

    button.classList.toggle('is-saved', saved);
    button.setAttribute('aria-pressed', saved ? 'true' : 'false');
    button.innerHTML = '<i class="bi ' + (saved ? 'bi-check-lg' : 'bi-heart') + '"></i> ' + (saved ? 'Salvato' : 'Salva');
  }

  function bindAlbumEvents(album, tracks) {
    const playButton = document.getElementById('album-play-btn');
    if (playButton) {
      playButton.addEventListener('click', function () {
        window.musicPlayer.playFrom(tracks, 0);
      });
    }

    const saveButton = document.getElementById('album-save-btn');
    if (saveButton) {
      saveButton.addEventListener('click', function () {
        const saved = Library.toggleAlbum(album);
        syncSaveButton(album);
        if (window.AppLayout) {
          window.AppLayout.showToast(saved ? 'Album salvato nella tua libreria' : 'Album rimosso dalla tua libreria');
        }
      });
    }

    U.qsa('.track-list-row').forEach(function (row) {
      function activate() {
        const index = Number(row.getAttribute('data-track-index'));
        const track = tracks[index];
        if (!track || !track.streamUrl) {
          if (window.AppLayout) window.AppLayout.showToast("Questo brano non ha un'anteprima disponibile");
          return;
        }
        window.musicPlayer.playFrom(tracks, index);
      }

      row.addEventListener('click', function (event) {
        if (event.target.closest('.track-add')) return;
        activate();
      });

      row.addEventListener('keydown', function (event) {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          activate();
        }
      });
    });

    U.qsa('.track-add').forEach(function (button) {
      button.addEventListener('click', function (event) {
        event.preventDefault();
        event.stopPropagation();
        const index = Number(button.getAttribute('data-track-index'));
        const track = tracks[index];
        if (track && window.AppLayout) {
          window.AppLayout.openAddToPlaylist(track);
        }
      });
    });
  }

  // ---------------------------------------------------
  // AVVIO
  // ---------------------------------------------------

  function init() {
    const container = document.getElementById('album-details-container');
    if (!container) return;

    const albumId = getAlbumId();
    if (!albumId) {
      U.showError(container, 'Nessun album specificato: torna alla home e scegli un album.');
      return;
    }

    loadAlbum(albumId);
    document.addEventListener('library:changed', function (event) {
      if (currentAlbum && (!event.detail || event.detail.key === Library.KEYS.albums)) {
        syncSaveButton(currentAlbum);
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.albumPage = {
    getAlbum: function () { return currentAlbum; }
  };
})();
