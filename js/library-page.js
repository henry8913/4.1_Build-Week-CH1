// ===================================================
// LA TUA LIBRERIA
// ===================================================

(function () {
  'use strict';

  const U = window.AppUtils;
  const Library = window.AppLibrary;

  function gradientFor(name) {
    let hash = 0;
    const text = String(name || '');
    for (let index = 0; index < text.length; index++) {
      hash = (hash * 31 + text.charCodeAt(index)) % 360;
    }
    return 'linear-gradient(135deg, hsl(' + hash + ' 55% 30%), hsl(' + ((hash + 42) % 360) + ' 62% 48%))';
  }

  function playlistCard(playlist) {
    const count = (playlist.tracks || []).length;

    return (
      '<a class="library-card" href="' + U.escapeHtml(U.pageUrl('playlist.html', { id: playlist.id })) + '">' +
        '<div class="library-card-cover placeholder" style="background:' + gradientFor(playlist.name) + '">' +
          '<i class="bi bi-music-note-beamed"></i>' +
        '</div>' +
        '<h3 class="library-card-title">' + U.escapeHtml(playlist.name) + '</h3>' +
        '<p class="library-card-subtitle">Playlist &bull; ' + count + (count === 1 ? ' brano' : ' brani') + '</p>' +
      '</a>'
    );
  }

  function albumCard(album) {
    return (
      '<a class="library-card" href="' + U.escapeHtml(U.pageUrl('album.html', { id: album.id })) + '">' +
        '<img class="library-card-cover" src="' + U.escapeHtml(album.cover) + '" alt="' + U.escapeHtml(album.title) + '" loading="lazy">' +
        '<h3 class="library-card-title">' + U.escapeHtml(album.title) + '</h3>' +
        '<p class="library-card-subtitle">Album &bull; ' + U.escapeHtml(album.artist.name) + '</p>' +
      '</a>'
    );
  }

  function artistCard(artist) {
    return (
      '<a class="library-card" href="' + U.escapeHtml(U.pageUrl('artist.html', { id: artist.id })) + '">' +
        (artist.picture
          ? '<img class="library-card-cover round" src="' + U.escapeHtml(artist.picture) + '" alt="' + U.escapeHtml(artist.name) + '" loading="lazy">'
          : '<div class="library-card-cover round placeholder"><i class="bi bi-person-fill"></i></div>') +
        '<h3 class="library-card-title">' + U.escapeHtml(artist.name) + '</h3>' +
        '<p class="library-card-subtitle">Artista</p>' +
      '</a>'
    );
  }

  function render() {
    const container = document.getElementById('library-container');
    if (!container) return;

    const liked = Library.getLikedTracks();
    const playlists = Library.getPlaylists();
    const providerId = window.MusicApi ? window.MusicApi.getProvider() : 'deezer';
    const albums = Library.getSavedAlbums().filter(function (album) {
      return (album.provider || 'deezer') === providerId;
    });
    const artists = Library.getFollowedArtists().filter(function (artist) {
      return (artist.provider || 'deezer') === providerId;
    });
    const provider = window.MusicApi ? window.MusicApi.getProviderInfo().label : 'Deezer';

    container.innerHTML =
      '<div class="library-page">' +
        '<header class="library-header">' +
          '<h1>La tua libreria</h1>' +
          '<div class="library-header-actions">' +
            '<button type="button" class="btn btn-outline-light library-provider" id="library-provider">' +
              '<i class="bi bi-sliders"></i> Sorgente: ' + U.escapeHtml(provider) +
            '</button>' +
            '<button type="button" class="btn btn-outline-light library-create" id="library-create-playlist">' +
              '<i class="bi bi-plus-lg"></i> Crea playlist' +
            '</button>' +
          '</div>' +
        '</header>' +

        '<a class="liked-banner" href="liked.html">' +
          '<span class="liked-banner-icon"><i class="bi bi-heart-fill"></i></span>' +
          '<span class="liked-banner-text">' +
            '<h2>Brani che ti piacciono</h2>' +
            '<p>Playlist &bull; ' + liked.length + (liked.length === 1 ? ' brano' : ' brani') + '</p>' +
          '</span>' +
        '</a>' +

        '<section class="library-section">' +
          '<div class="section-heading"><h2>Le tue playlist</h2></div>' +
          (playlists.length
            ? '<div class="library-grid">' + playlists.map(playlistCard).join('') + '</div>'
            : '<div class="library-empty">Non hai ancora creato playlist. Usa "Crea playlist" per iniziare.</div>') +
        '</section>' +

        '<section class="library-section">' +
          '<div class="section-heading"><h2>Album salvati</h2></div>' +
          (albums.length
            ? '<div class="library-grid">' + albums.map(albumCard).join('') + '</div>'
            : '<div class="library-empty">Salva un album dalla sua pagina per ritrovarlo qui.</div>') +
        '</section>' +

        '<section class="library-section">' +
          '<div class="section-heading"><h2>Artisti seguiti</h2></div>' +
          (artists.length
            ? '<div class="library-grid">' + artists.map(artistCard).join('') + '</div>'
            : '<div class="library-empty">Segui un artista dalla sua pagina per ritrovarlo qui.</div>') +
        '</section>' +

        '<section class="library-section" id="episodes">' +
          '<div class="section-heading"><h2>I tuoi episodi</h2></div>' +
          '<div class="library-empty">' +
            '<i class="bi bi-bookmark"></i> Gli episodi dei podcast arriveranno con un provider dedicato.' +
          '</div>' +
        '</section>' +
      '</div>';

    const createButton = document.getElementById('library-create-playlist');
    if (createButton) {
      createButton.addEventListener('click', function () {
        if (window.AppLayout) window.AppLayout.openCreatePlaylist(null);
      });
    }

    const providerButton = document.getElementById('library-provider');
    if (providerButton) {
      providerButton.addEventListener('click', function () {
        if (window.AppLayout) window.AppLayout.openProviderSettings();
      });
    }

    if (window.location.hash === '#episodes') {
      const episodes = document.getElementById('episodes');
      if (episodes) {
        setTimeout(function () {
          episodes.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
      }
    }
  }

  document.addEventListener('DOMContentLoaded', render);
  document.addEventListener('library:changed', render);

  if (document.readyState !== 'loading') render();
})();
