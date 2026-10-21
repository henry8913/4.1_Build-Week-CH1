// ===================================================
// PAGINA ALBUM
// ===================================================
// Carica un album da Deezer e mostra header, azioni,
// tracklist e footer. Ogni brano e' riproducibile.
// ===================================================

(function () {
  'use strict';

  const U = window.AppUtils;

  let currentAlbum = null;

  // ---------------------------------------------------
  // DATI
  // ---------------------------------------------------

  function getAlbumId() {
    return new URLSearchParams(window.location.search).get('id');
  }

  function loadAlbum(albumId) {
    const container = document.getElementById('album-details-container');
    if (!container) return;

    U.showSpinner(container);

    U.api.album(albumId)
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

  function albumTracks(album) {
    const tracks = album.tracks && Array.isArray(album.tracks.data) ? album.tracks.data : [];

    return tracks.map(function (track) {
      return {
        id: track.id,
        preview: track.preview || '',
        title: track.title || 'Brano senza titolo',
        artist: {
          id: track.artist && track.artist.id ? track.artist.id : (album.artist ? album.artist.id : ''),
          name: track.artist && track.artist.name ? track.artist.name : (album.artist ? album.artist.name : '')
        },
        album: {
          id: album.id,
          title: album.title,
          cover_small: album.cover_small || album.cover_medium || 'img/cover_c.jpg'
        },
        duration: track.duration || 0
      };
    });
  }

  function trackRowMarkup(track, index, album) {
    const artistName = track.artist && track.artist.name ? track.artist.name : '';
    const preview = track.preview || '';

    return (
      '<div class="track-list-row" role="button" tabindex="0"' +
        ' data-preview-url="' + U.escapeHtml(preview) + '"' +
        ' data-track-index="' + index + '"' +
        ' aria-label="Riproduci ' + U.escapeHtml(track.title) + '">' +
        '<div class="track-number">' + (index + 1) + '</div>' +
        '<div class="track-main">' +
          '<span class="track-title">' + U.escapeHtml(track.title) + '</span>' +
          '<span class="track-artist">' + U.escapeHtml(artistName || (album.artist && album.artist.name) || 'Artista sconosciuto') + '</span>' +
        '</div>' +
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

    const tracks = albumTracks(album);
    const releaseDate = album.release_date ? new Date(album.release_date) : null;
    const validRelease = releaseDate && !isNaN(releaseDate.getTime()) ? releaseDate : null;
    const year = validRelease ? validRelease.getFullYear() : '';
    const cover = album.cover_big || album.cover_medium || album.cover_small || 'img/cover_c.jpg';
    const artist = album.artist || { name: 'Artista sconosciuto', id: '' };
    const totalSeconds = tracks.reduce(function (total, track) {
      return total + (Number(track.duration) || 0);
    }, 0);
    const totalDuration = totalSeconds ? Math.round(totalSeconds / 60) + ' min' : '';

    const metaParts = [];
    if (artist.id) {
      metaParts.push(
        '<a href="' + U.escapeHtml(U.pageUrl('artist.html', { id: artist.id })) + '" class="text-white text-decoration-none album-artist-link">' +
          U.escapeHtml(artist.name) +
        '</a>'
      );
    } else {
      metaParts.push(U.escapeHtml(artist.name));
    }
    if (year) metaParts.push(String(year));
    metaParts.push(tracks.length + (tracks.length === 1 ? ' brano' : ' brani'));
    if (totalDuration) metaParts.push(totalDuration);

    container.innerHTML =
      '<div class="album-header">' +
        '<img src="' + U.escapeHtml(cover) + '" alt="Copertina di ' + U.escapeHtml(album.title) + '" class="album-cover-lg">' +
        '<div class="album-info">' +
          '<div class="album-type">ALBUM</div>' +
          '<h1 class="album-title">' + U.escapeHtml(album.title) + '</h1>' +
          '<div class="album-details">' +
            (artist.picture_small
              ? '<img src="' + U.escapeHtml(artist.picture_small) + '" alt="" class="album-artist-img" loading="lazy">'
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
          '<div class="track-duration"><i class="bi bi-clock" aria-hidden="true"></i></div>' +
        '</div>' +
        (tracks.length
          ? tracks.map(function (track, index) { return trackRowMarkup(track, index, album); }).join('')
          : '<p class="empty-state p-3">Nessun brano disponibile per questo album.</p>') +
      '</div>' +

      '<div class="album-footer">' +
        (validRelease
          ? '<p class="text-white-50 small mb-1">' + U.escapeHtml(validRelease.toLocaleDateString('it-IT')) + '</p>'
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

  function playAlbumFrom(tracks, index) {
    if (!tracks.length) return;
    window.musicPlayer.playFrom(tracks, index || 0);
  }

  function syncSaveButton(album) {
    const button = document.getElementById('album-save-btn');
    if (!button) return;

    const saved = U.isInList(U.LISTS.savedAlbums, album.id);

    button.classList.toggle('is-saved', saved);
    button.setAttribute('aria-pressed', saved ? 'true' : 'false');
    button.innerHTML = '<i class="bi ' + (saved ? 'bi-check-lg' : 'bi-heart') + '"></i> ' + (saved ? 'Salvato' : 'Salva');
  }

  function bindAlbumEvents(album, tracks) {
    const playButton = document.getElementById('album-play-btn');
    if (playButton) {
      playButton.addEventListener('click', function () {
        playAlbumFrom(tracks, 0);
      });
    }

    const saveButton = document.getElementById('album-save-btn');
    if (saveButton) {
      saveButton.addEventListener('click', function () {
        const saved = U.toggleInList(U.LISTS.savedAlbums, album.id);
        syncSaveButton(album);
        if (window.AppLayout) {
          window.AppLayout.showToast(saved ? 'Album salvato nella tua libreria' : 'Album rimosso dalla tua libreria');
        }
      });
    }

    U.qsa('.track-list-row').forEach(function (row) {
      function activate() {
        const index = Number(row.getAttribute('data-track-index'));
        if (!row.getAttribute('data-preview-url')) {
          if (window.AppLayout) window.AppLayout.showToast("Questo brano non ha un'anteprima disponibile");
          return;
        }
        playAlbumFrom(tracks, index);
      }

      row.addEventListener('click', activate);
      row.addEventListener('keydown', function (event) {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          activate();
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
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Esposto per comodita' durante il debug.
  window.albumPage = {
    getAlbum: function () { return currentAlbum; }
  };
})();
