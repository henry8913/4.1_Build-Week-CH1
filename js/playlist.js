// ===================================================
// PAGINA PLAYLIST
// ===================================================

(function () {
  'use strict';

  const U = window.AppUtils;
  const Library = window.AppLibrary;

  let playlistId = '';

  function trackRowMarkup(track, index) {
    return (
      '<div class="collection-track" role="button" tabindex="0"' +
        ' data-track-id="' + U.escapeHtml(track.id) + '"' +
        ' data-preview-url="' + U.escapeHtml(track.streamUrl) + '"' +
        ' data-track-index="' + index + '"' +
        ' aria-label="Riproduci ' + U.escapeHtml(track.title) + '">' +
        '<div class="collection-track-number">' + (index + 1) + '</div>' +
        '<div class="collection-track-main">' +
          '<img src="' + U.escapeHtml(track.album.coverSmall || track.album.cover) + '" alt="" class="collection-track-img" loading="lazy">' +
          '<div class="collection-track-text">' +
            '<span class="collection-track-title">' + U.escapeHtml(track.title) + '</span>' +
            '<span class="collection-track-artist">' + U.escapeHtml(track.artist.name) + '</span>' +
          '</div>' +
        '</div>' +
        '<div class="collection-track-album">' + U.escapeHtml(track.album.title) + '</div>' +
        '<div class="collection-track-time">' + U.formatTime(track.duration) + '</div>' +
        '<button type="button" class="collection-track-action" data-remove-track="' + U.escapeHtml(track.id) + '"' +
          ' aria-label="Rimuovi ' + U.escapeHtml(track.title) + ' dalla playlist">' +
          '<i class="bi bi-x-lg"></i>' +
        '</button>' +
      '</div>'
    );
  }

  function render() {
    const container = document.getElementById('collection-container');
    if (!container) return;

    const playlist = Library.getPlaylist(playlistId);

    if (!playlist) {
      container.innerHTML =
        '<div class="collection-page">' +
          '<div class="collection-empty m-4">' +
            '<i class="bi bi-music-note-list"></i>' +
            '<p class="mb-3">Playlist non trovata.</p>' +
            '<a class="btn btn-success rounded-pill px-4" href="library.html">Torna alla libreria</a>' +
          '</div>' +
        '</div>';
      return;
    }

    document.title = playlist.name + ' - Spotify Clone';

    const tracks = Array.isArray(playlist.tracks) ? playlist.tracks : [];
    const totalMinutes = tracks.length ? Math.round(Library.durationOfTracks(tracks) / 60) : 0;

    container.innerHTML =
      '<section class="collection-hero playlist-hero">' +
        '<div class="collection-header">' +
          '<div class="collection-cover playlist"><i class="bi bi-music-note-beamed" aria-hidden="true"></i></div>' +
          '<div class="collection-meta">' +
            '<span class="collection-type">Playlist</span>' +
            '<h1 class="collection-title">' + U.escapeHtml(playlist.name) + '</h1>' +
            '<p class="collection-subtitle">Lidia Nautilus &bull; ' + tracks.length +
              (tracks.length === 1 ? ' brano' : ' brani') +
              (totalMinutes ? ' &bull; circa ' + totalMinutes + ' min' : '') +
            '</p>' +
          '</div>' +
        '</div>' +
      '</section>' +

      '<section class="collection-actions">' +
        '<button type="button" class="btn btn-success btn-play" id="playlist-play"' + (tracks.length ? '' : ' disabled') + '>' +
          '<i class="bi bi-play-fill"></i> Play' +
        '</button>' +
        '<button type="button" class="btn btn-outline-light" id="playlist-delete">' +
          '<i class="bi bi-trash3"></i> Elimina playlist' +
        '</button>' +
      '</section>' +

      (tracks.length
        ? '<div class="collection-list">' +
            '<div class="collection-list-header">' +
              '<div>#</div>' +
              '<div>TITOLO</div>' +
              '<div class="collection-track-album">ALBUM</div>' +
              '<div class="collection-track-time"><i class="bi bi-clock" aria-hidden="true"></i></div>' +
              '<div></div>' +
            '</div>' +
            tracks.map(trackRowMarkup).join('') +
          '</div>'
        : '<div class="collection-list"><div class="collection-empty">' +
            '<i class="bi bi-plus-circle"></i>' +
            '<p class="mb-1">Questa playlist è ancora vuota.</p>' +
            '<p class="small mb-3">Aggiungi brani con il pulsante + nel player o nelle tracce di un album.</p>' +
            '<a class="btn btn-success rounded-pill px-4" href="index.html">Scopri musica</a>' +
          '</div></div>');

    bind(playlist, tracks);
  }

  function bind(playlist, tracks) {
    const playButton = document.getElementById('playlist-play');
    if (playButton) {
      playButton.addEventListener('click', function () {
        if (tracks.length) window.musicPlayer.playFrom(tracks, 0);
      });
    }

    const deleteButton = document.getElementById('playlist-delete');
    if (deleteButton) {
      deleteButton.addEventListener('click', function () {
        if (!window.AppLayout) return;

        window.AppLayout.confirm(
          'Eliminare la playlist "' + playlist.name + '"? Questa azione non può essere annullata.',
          function () {
            Library.deletePlaylist(playlist.id);
            window.AppLayout.showToast('Playlist eliminata');
            window.location.href = 'library.html';
          }
        );
      });
    }

    U.qsa('.collection-track').forEach(function (row) {
      function activate() {
        const index = Number(row.getAttribute('data-track-index'));
        const track = tracks[index];
        if (!track) return;
        if (!track.streamUrl) {
          if (window.AppLayout) window.AppLayout.showToast("Anteprima non disponibile per questo brano");
          return;
        }
        window.musicPlayer.playFrom(tracks, index);
      }

      row.addEventListener('click', function (event) {
        if (event.target.closest('[data-remove-track]')) return;
        activate();
      });

      row.addEventListener('keydown', function (event) {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          activate();
        }
      });
    });

    U.qsa('[data-remove-track]').forEach(function (button) {
      button.addEventListener('click', function (event) {
        event.preventDefault();
        event.stopPropagation();

        const trackId = button.getAttribute('data-remove-track');
        const track = tracks.find(function (item) {
          return String(item.id) === String(trackId);
        });

        if (!track) return;
        Library.removeTrackFromPlaylist(playlist.id, track);
        if (window.AppLayout) window.AppLayout.showToast('Brano rimosso dalla playlist');
      });
    });
  }

  function init() {
    playlistId = new URLSearchParams(window.location.search).get('id') || '';
    render();
  }

  document.addEventListener('DOMContentLoaded', init);
  document.addEventListener('library:changed', function (event) {
    if (!event.detail || event.detail.key === Library.KEYS.playlists) render();
  });

  if (document.readyState !== 'loading') init();
})();
