// ===================================================
// PAGINA ARTISTA
// ===================================================
// Carica i dati dell'artista, i brani piu' ascoltati e
// la discografia. Tutto in un solo caricamento.
// ===================================================

(function () {
  'use strict';

  const U = window.AppUtils;

  let currentArtist = null;

  // ---------------------------------------------------
  // CARICAMENTO
  // ---------------------------------------------------

  function getArtistId() {
    return new URLSearchParams(window.location.search).get('id');
  }

  async function loadArtist(artistId) {
    const container = document.getElementById('artist-details-container');
    if (!container) return;

    U.showSpinner(container);

    const results = await Promise.allSettled([
      U.api.artist(artistId),
      U.api.artistTop(artistId, 5),
      U.api.artistAlbums(artistId)
    ]);

    const artistResult = results[0];
    const topResult = results[1];
    const albumsResult = results[2];

    if (artistResult.status !== 'fulfilled' || !artistResult.value) {
      console.error('Errore dettagli artista:', artistResult.reason);
      U.showError(container, "Errore nel caricamento dell'artista. Riprova più tardi.");
      return;
    }

    currentArtist = artistResult.value;
    renderArtist(currentArtist);
    bindFollowButton(currentArtist);

    if (topResult.status === 'fulfilled') {
      renderTopTracks(topResult.value, currentArtist);
    } else {
      U.showError('#top-tracks-container', 'Impossibile caricare i brani più ascoltati.');
    }

    if (albumsResult.status === 'fulfilled') {
      renderDiscography(albumsResult.value, currentArtist);
    } else {
      U.showError('#discography-container', 'Impossibile caricare la discografia.');
    }
  }

  // ---------------------------------------------------
  // RENDER
  // ---------------------------------------------------

  function renderArtist(artist) {
    const container = document.getElementById('artist-details-container');
    if (!container) return;

    const background = artist.picture_xl || artist.picture_big || artist.picture_medium || '';
    const backgroundStyle = background
      ? ' style="background-image: linear-gradient(rgba(0,0,0,0.35), rgba(0,0,0,0.85)), url(&quot;' +
        String(background).replace(/"/g, '%22') + '&quot;)"'
      : '';

    container.innerHTML =
      '<header class="artist-header"' + backgroundStyle + '>' +
        '<div class="artist-header-content">' +
          (artist.picture_medium
            ? '<img src="' + U.escapeHtml(artist.picture_medium) + '" alt="" class="artist-avatar" loading="lazy">'
            : '') +
          '<div class="artist-titles">' +
            '<p class="artist-label">Artista</p>' +
            '<h1 class="artist-title">' + U.escapeHtml(artist.name) + '</h1>' +
            '<p class="artist-fans mb-0">' + U.formatNumber(artist.nb_fan) + ' ascoltatori mensili</p>' +
          '</div>' +
        '</div>' +
      '</header>' +

      '<div class="artist-actions">' +
        '<button type="button" class="btn btn-success rounded-pill btn-play" id="artist-play-btn">' +
          '<i class="bi bi-play-fill"></i> Play' +
        '</button>' +
        '<button type="button" class="btn btn-outline-light rounded-pill btn-follow" id="artist-follow-btn" aria-pressed="false">' +
          'Segui' +
        '</button>' +
      '</div>' +

      '<section class="popular-tracks">' +
        '<div class="section-heading">' +
          '<h2>Brani popolari</h2>' +
        '</div>' +
        '<div id="top-tracks-container" class="top-tracks"></div>' +
      '</section>' +

      '<section class="discography">' +
        '<div class="section-heading">' +
          '<h2>Discografia</h2>' +
          '<a class="see-more-link" href="' + U.escapeHtml(U.pageUrl('search.html', { search: artist.name })) + '">Vedi altri</a>' +
        '</div>' +
        '<div id="discography-container" class="row g-3"></div>' +
      '</section>' +

      '<footer class="artist-footer">' +
        '<p class="text-white-50 small mb-0">&copy; ' + U.escapeHtml(artist.name) + ' - Tutti i diritti riservati</p>' +
      '</footer>';

    document.title = artist.name + ' - Spotify Clone';
    syncFollowButton(artist);
  }

  function normalizeTrack(track, artist) {
    const album = track.album || {};

    return {
      id: track.id,
      preview: track.preview || '',
      title: track.title || 'Brano senza titolo',
      artist: {
        id: track.artist && track.artist.id ? track.artist.id : artist.id,
        name: track.artist && track.artist.name ? track.artist.name : artist.name
      },
      album: {
        id: album.id || '',
        title: album.title || '',
        cover_small: album.cover_small || album.cover_medium || 'img/cover_c.jpg'
      },
      duration: track.duration || 0
    };
  }

  function renderTopTracks(tracks, artist) {
    const container = document.getElementById('top-tracks-container');
    if (!container) return;

    if (!tracks || !tracks.length) {
      container.innerHTML = '<p class="empty-state">Nessun brano disponibile.</p>';
      return;
    }

    const normalized = tracks.map(function (track) {
      return normalizeTrack(track, artist);
    });

    container.innerHTML = normalized.map(function (track, index) {
      return (
        '<div class="popular-track" role="button" tabindex="0"' +
          ' data-preview-url="' + U.escapeHtml(track.preview) + '"' +
          ' data-track-index="' + index + '"' +
          ' aria-label="Riproduci ' + U.escapeHtml(track.title) + '">' +
          '<div class="popular-track-number">' + (index + 1) + '</div>' +
          '<div class="popular-track-info">' +
            '<img src="' + U.escapeHtml(track.album.cover_small) + '" alt="" class="popular-track-img" loading="lazy">' +
            '<div class="popular-track-text">' +
              '<span class="popular-track-title">' + U.escapeHtml(track.title) + '</span>' +
              '<span class="popular-track-album">' + U.escapeHtml(track.album.title) + '</span>' +
            '</div>' +
          '</div>' +
          '<div class="popular-track-duration">' + U.formatTime(track.duration) + '</div>' +
        '</div>'
      );
    }).join('');

    U.qsa('.popular-track').forEach(function (row) {
      function activate() {
        const index = Number(row.getAttribute('data-track-index'));
        const track = normalized[index];
        if (!track || !track.preview) {
          if (window.AppLayout) window.AppLayout.showToast("Questo brano non ha un'anteprima disponibile");
          return;
        }
        window.musicPlayer.playFrom(normalized, index);
      }

      row.addEventListener('click', activate);
      row.addEventListener('keydown', function (event) {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          activate();
        }
      });
    });

    const playButton = document.getElementById('artist-play-btn');
    if (playButton) {
      playButton.addEventListener('click', function () {
        const firstPlayable = normalized.findIndex(function (track) {
          return !!track.preview;
        });
        if (firstPlayable === -1) {
          if (window.AppLayout) window.AppLayout.showToast("Nessun brano riproducibile disponibile");
          return;
        }
        window.musicPlayer.playFrom(normalized, firstPlayable);
      });
    }
  }

  function renderDiscography(albums, artist) {
    const container = document.getElementById('discography-container');
    if (!container) return;

    if (!albums || !albums.length) {
      container.innerHTML = '<div class="col-12"><p class="empty-state">Nessun album disponibile.</p></div>';
      return;
    }

    const seen = new Set();
    const uniqueAlbums = albums.filter(function (album) {
      if (!album || !album.id) return false;
      const key = String(album.title || album.id);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }).slice(0, 8);

    container.innerHTML = uniqueAlbums.map(function (album) {
      const rawDate = album.release_date ? String(album.release_date) : '';
      const year = rawDate ? rawDate.slice(0, 4) : '';
      const cover = album.cover_medium || album.cover_small || 'img/cover_c.jpg';
      const url = U.pageUrl('album.html', { id: album.id });

      return (
        '<div class="col-6 col-sm-4 col-md-3 col-lg-2">' +
          '<a class="card album-card discography-card" href="' + U.escapeHtml(url) + '">' +
            '<img src="' + U.escapeHtml(cover) + '" class="card-img-top" alt="' + U.escapeHtml(album.title) + '" loading="lazy">' +
            '<div class="card-body p-2">' +
              '<h3 class="card-title text-truncate">' + U.escapeHtml(album.title) + '</h3>' +
              '<p class="card-text text-truncate">' +
                (year ? U.escapeHtml(year) : U.escapeHtml(artist.name)) +
                ' &bull; Album' +
              '</p>' +
            '</div>' +
          '</a>' +
        '</div>'
      );
    }).join('');
  }

  // ---------------------------------------------------
  // AZIONI
  // ---------------------------------------------------

  function syncFollowButton(artist) {
    const button = document.getElementById('artist-follow-btn');
    if (!button) return;

    const following = U.isInList(U.LISTS.followedArtists, artist.id);
    button.textContent = following ? 'Segui già' : 'Segui';
    button.classList.toggle('is-following', following);
    button.setAttribute('aria-pressed', following ? 'true' : 'false');
  }

  function bindFollowButton(artist) {
    const button = document.getElementById('artist-follow-btn');
    if (!button) return;

    button.addEventListener('click', function () {
      const following = U.toggleInList(U.LISTS.followedArtists, artist.id);
      syncFollowButton(artist);
      if (window.AppLayout) {
        window.AppLayout.showToast(following ? 'Ora segui ' + artist.name : 'Non segui più ' + artist.name);
      }
    });
  }

  // ---------------------------------------------------
  // AVVIO
  // ---------------------------------------------------

  function init() {
    const container = document.getElementById('artist-details-container');
    if (!container) return;

    const artistId = getArtistId();
    if (!artistId) {
      U.showError(container, "Nessun artista specificato: torna alla home e scegli un artista.");
      return;
    }

    // Il pulsante "Segui" viene creato dal render e agganciato subito dopo.
    loadArtist(artistId);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.artistPage = {
    getArtist: function () { return currentArtist; }
  };
})();
