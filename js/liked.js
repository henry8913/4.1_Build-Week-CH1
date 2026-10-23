// ===================================================
// BRANI CHE TI PIACCIONO
// ===================================================

(function () {
  'use strict';

  const U = window.AppUtils;
  const Library = window.AppLibrary;

  function trackRowMarkup(track, index) {
    const liked = Library.isLiked(track);

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
        '<button type="button" class="collection-track-action' + (liked ? ' is-liked' : '') + '"' +
          ' data-remove-track="' + U.escapeHtml(track.id) + '" aria-label="Rimuovi dai brani che ti piacciono">' +
          '<i class="bi ' + (liked ? 'bi-heart-fill' : 'bi-heart') + '"></i>' +
        '</button>' +
      '</div>'
    );
  }

  function render() {
    const container = document.getElementById('collection-container');
    if (!container) return;

    const tracks = Library.getLikedTracks();
    const totalMinutes = tracks.length ? Math.round(Library.likedDuration() / 60) : 0;

    container.innerHTML =
      '<section class="collection-hero liked-hero">' +
        '<div class="collection-header">' +
          '<div class="collection-cover liked"><i class="bi bi-heart-fill" aria-hidden="true"></i></div>' +
          '<div class="collection-meta">' +
            '<span class="collection-type">Playlist</span>' +
            '<h1 class="collection-title">Brani che ti piacciono</h1>' +
            '<p class="collection-subtitle">Lidia Nautilus &bull; ' + tracks.length +
              (tracks.length === 1 ? ' brano' : ' brani') +
              (totalMinutes ? ' &bull; circa ' + totalMinutes + ' min' : '') +
            '</p>' +
          '</div>' +
        '</div>' +
      '</section>' +

      '<section class="collection-actions">' +
        '<button type="button" class="btn btn-success btn-play" id="liked-play"' + (tracks.length ? '' : ' disabled') + '>' +
          '<i class="bi bi-play-fill"></i> Play' +
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
            '<i class="bi bi-heart"></i>' +
            '<p class="mb-1">Non hai ancora salvato nessun brano.</p>' +
            '<p class="small mb-3">Tocca il cuore nel player o nelle tracce per aggiungerli qui.</p>' +
            '<a class="btn btn-success rounded-pill px-4" href="index.html">Scopri musica</a>' +
          '</div></div>');

    bind(tracks);
  }

  function bind(tracks) {
    const playButton = document.getElementById('liked-play');
    if (playButton) {
      playButton.addEventListener('click', function () {
        if (tracks.length) window.musicPlayer.playFrom(tracks, 0);
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
        Library.toggleLiked(track);

        if (window.AppLayout) window.AppLayout.showToast('Rimosso dai brani che ti piacciono');
      });
    });
  }

  document.addEventListener('DOMContentLoaded', render);
  document.addEventListener('library:changed', function (event) {
    if (!event.detail || event.detail.key === Library.KEYS.liked) render();
  });

  if (document.readyState !== 'loading') render();
})();
