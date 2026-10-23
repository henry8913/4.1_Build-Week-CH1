// ===================================================
// HOME
// ===================================================
// Album in evidenza, ascolti recenti, selezione di
// album e brani in tendenza.
// ===================================================

(function () {
  'use strict';

  const U = window.AppUtils;
  const MusicApi = window.MusicApi;

  const RECENT_ARTISTS = ['Eminem', 'Taylor Swift', 'Ed Sheeran', 'Billie Eilish', 'Coldplay', 'Daft Punk', 'Bruno Mars', 'Lady Gaga', 'Drake', 'Dua Lipa', 'The Weeknd', 'Rihanna', 'Post Malone', 'Ariana Grande', 'Harry Styles', 'Travis Scott', 'Paramore', 'J. Cole', 'Salmo', 'Fedez'];

  const FEATURED_ARTISTS = ['Fedez', 'Salmo', 'Dua Lipa', 'The Weeknd', 'Adele', 'Drake', 'Bruno Mars', 'Lady Gaga', 'Billie Eilish', 'Post Malone', 'Ed Sheeran', 'Sia', 'Shawn Mendes', 'Khalid', 'Taylor Swift', 'Maroon 5', 'Imagine Dragons', 'Ariana Grande', 'Sam Smith', 'Miley Cyrus', 'Rihanna', 'Harry Styles', 'Pink', 'The Killers', 'Paramore'];

  const TRENDING_GENRES = ['pop', 'rap', 'electronic', 'indie', 'metal', 'rock', 'jazz', 'blues', 'reggae', 'country', 'hip-hop', 'alternative', 'folk', 'punk', 'soul', 'disco', 'latin', 'synthwave'];

  function randomItem(list) {
    return list[Math.floor(Math.random() * list.length)];
  }

  function uniqueByAlbum(tracks) {
    const seen = new Set();
    return tracks.filter(function (track) {
      if (!track || !track.album || !track.album.id) return false;
      const key = String(track.album.id);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  function uniqueRecent(tracks) {
    const seen = new Set();
    return uniqueByAlbum(tracks).filter(function (track) {
      const key = (track.album.title || '') + '|' + (track.artist.name || '');
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  // ---------------------------------------------------
  // MARKUP
  // ---------------------------------------------------

  function trackDataSet(track) {
    return (
      ' data-album-id="' + U.escapeHtml(track.album.id) + '"' +
      ' data-track-id="' + U.escapeHtml(track.id) + '"' +
      ' data-album-title="' + U.escapeHtml(track.album.title) + '"' +
      ' data-artist-id="' + U.escapeHtml(track.artist.id) + '"' +
      ' data-artist-name="' + U.escapeHtml(track.artist.name) + '"' +
      ' data-title="' + U.escapeHtml(track.title) + '"' +
      ' data-cover="' + U.escapeHtml(track.album.coverSmall || track.album.cover) + '"' +
      ' data-preview-url="' + U.escapeHtml(track.streamUrl) + '"' +
      ' data-duration="' + U.escapeHtml(track.duration) + '"' +
      ' data-album-url="' + U.escapeHtml(U.pageUrl('album.html', { id: track.album.id })) + '"'
    );
  }

  function cardMarkup(track, sizeClass) {
    const cover = track.album.cover || track.album.coverSmall;
    const title = track.album.title || track.title || 'Album senza titolo';

    return (
      '<div class="' + sizeClass + '">' +
        '<div class="card album-card" role="link" tabindex="0"' + trackDataSet(track) + '>' +
          '<img src="' + U.escapeHtml(cover) + '" class="card-img-top" alt="' + U.escapeHtml(title) + '" loading="lazy">' +
          '<span class="play-hover" role="button" tabindex="-1" aria-label="Riproduci ' + U.escapeHtml(track.title) + '">' +
            '<i class="bi bi-play-fill"></i>' +
          '</span>' +
          '<div class="card-body p-2">' +
            '<h3 class="card-title text-truncate">' + U.escapeHtml(title) + '</h3>' +
            '<p class="card-text text-truncate">' +
              '<a href="' + U.escapeHtml(U.pageUrl('artist.html', { id: track.artist.id })) + '" class="text-light text-decoration-none">' +
                U.escapeHtml(track.artist.name) +
              '</a>' +
            '</p>' +
          '</div>' +
        '</div>' +
      '</div>'
    );
  }

  function recentMarkup(track) {
    const cover = track.album.coverSmall || track.album.cover;

    return (
      '<div class="col-12 col-sm-6 col-lg-4">' +
        '<div class="card recent-card" role="link" tabindex="0"' + trackDataSet(track) + '>' +
          '<div class="card-body d-flex align-items-center">' +
            '<img src="' + U.escapeHtml(cover) + '" class="recent-album-img" alt="" loading="lazy">' +
            '<div class="ms-3 overflow-hidden recent-text">' +
              '<span class="d-block text-truncate fw-bold">' + U.escapeHtml(track.title) + '</span>' +
              '<span class="d-block text-truncate small text-white-50">' + U.escapeHtml(track.artist.name) + '</span>' +
            '</div>' +
            '<button type="button" class="btn btn-link text-white recent-play play-hover-static" aria-label="Riproduci ' + U.escapeHtml(track.title) + '">' +
              '<i class="bi bi-play-fill"></i>' +
            '</button>' +
          '</div>' +
        '</div>' +
      '</div>'
    );
  }

  // ---------------------------------------------------
  // RICHIESTE
  // ---------------------------------------------------

  function loadFeaturedAlbum() {
    const container = document.getElementById('featured-album');
    if (!container) return;

    MusicApi.search(randomItem(FEATURED_ARTISTS), 1)
      .then(function (tracks) {
        if (!tracks.length) throw new Error('Nessun album in evidenza disponibile');
        renderFeaturedAlbum(tracks[0]);
      })
      .catch(function (error) {
        console.error('Errore album in evidenza:', error);
        U.showError(container, 'Errore nel caricamento: ' + error.message);
      });
  }

  function loadRecentlyPlayed() {
    const container = document.getElementById('recent-container');
    if (!container) return;

    U.showSpinner(container);

    MusicApi.search(randomItem(RECENT_ARTISTS), 6)
      .then(function (tracks) {
        const items = uniqueRecent(tracks).slice(0, 6);
        if (!items.length) {
          container.innerHTML = '<div class="col-12 empty-state">Nessun ascolto recente disponibile.</div>';
          return;
        }
        container.innerHTML = items.map(recentMarkup).join('');
      })
      .catch(function (error) {
        console.error('Errore ascolti recenti:', error);
        U.showError(container, 'Errore nel caricamento: ' + error.message);
      });
  }

  function loadAlbumList() {
    const container = document.getElementById('album-list');
    if (!container) return;

    U.showSpinner(container);

    MusicApi.search('rock')
      .then(function (tracks) {
        const albums = uniqueByAlbum(tracks).slice(0, 12);
        if (!albums.length) {
          container.innerHTML = '<div class="col-12 empty-state">Nessun album disponibile al momento.</div>';
          return;
        }
        container.innerHTML = albums.map(function (track) {
          return cardMarkup(track, 'col-6 col-sm-4 col-md-3 col-lg-2');
        }).join('');
      })
      .catch(function (error) {
        console.error('Errore lista album:', error);
        U.showError(container, 'Errore nel caricamento: ' + error.message);
      });
  }

  function loadTrending() {
    const container = document.getElementById('trending-container');
    if (!container) return;

    U.showSpinner(container);

    MusicApi.search(randomItem(TRENDING_GENRES), 5)
      .then(function (tracks) {
        const albums = uniqueByAlbum(tracks).slice(0, 5);
        if (!albums.length) {
          container.innerHTML = '<div class="col-12 empty-state">Nessun brano in tendenza al momento.</div>';
          return;
        }
        container.innerHTML = albums.map(function (track) {
          return cardMarkup(track, 'col-6 col-sm-4 col-md-3 col-lg-2');
        }).join('');
      })
      .catch(function (error) {
        console.error('Errore brani in tendenza:', error);
        U.showError(container, 'Errore nel caricamento: ' + error.message);
      });
  }

  // ---------------------------------------------------
  // RENDER
  // ---------------------------------------------------

  function renderFeaturedAlbum(track) {
    const container = document.getElementById('featured-album');
    if (!container) return;

    const cover = track.album.cover || track.album.coverSmall;

    container.dataset.albumId = track.album.id;
    container.dataset.trackId = track.id;
    container.dataset.artistId = track.artist.id;
    container.dataset.albumTitle = track.album.title;
    container.dataset.artistName = track.artist.name;
    container.dataset.title = track.title;
    container.dataset.cover = cover;
    container.dataset.previewUrl = track.streamUrl;
    container.dataset.duration = track.duration;

    const image = document.getElementById('featured-album-img');
    if (image) {
      image.src = cover;
      image.alt = track.album.title || 'Copertina album';
    }

    const title = document.getElementById('featured-album-title');
    if (title) title.textContent = track.title;

    const artistElement = document.getElementById('featured-album-artist');
    if (artistElement) {
      artistElement.textContent = '';
      const link = document.createElement('a');
      link.href = U.pageUrl('artist.html', { id: track.artist.id });
      link.className = 'text-light text-decoration-none';
      link.textContent = track.artist.name;
      artistElement.appendChild(link);
    }

    const description = document.getElementById('featured-album-description');
    if (description) {
      description.textContent = 'Ascolta il nuovo singolo di ' + track.artist.name + '!';
    }

    const background = document.querySelector('.featured-album-bg');
    if (background) {
      background.style.backgroundImage =
        'linear-gradient(0deg, #121212 0%, #121212 38%, rgba(18, 18, 18, 0.78) 62%, rgba(18, 18, 18, 0.35) 100%), url("' +
        String(cover).replace(/"/g, '%22') + '")';
    }

    syncFeaturedSaveButton();
  }

  function featuredTrack() {
    const container = document.getElementById('featured-album');
    if (!container) return null;

    return {
      id: container.dataset.trackId || '',
      streamUrl: container.dataset.previewUrl || '',
      preview: container.dataset.previewUrl || '',
      title: container.dataset.title || '',
      artist: { id: container.dataset.artistId || '', name: container.dataset.artistName || '' },
      album: {
        id: container.dataset.albumId || '',
        title: container.dataset.albumTitle || '',
        cover: container.dataset.cover || '',
        coverSmall: container.dataset.cover || ''
      },
      duration: Number(container.dataset.duration) || 30
    };
  }

  function syncFeaturedSaveButton() {
    const button = document.getElementById('featured-save');
    const container = document.getElementById('featured-album');
    if (!button || !container) return;

    const saved = window.AppLibrary.isAlbumSaved(container.dataset.albumId);
    const icon = button.querySelector('i');

    button.classList.toggle('is-saved', saved);
    button.setAttribute('aria-pressed', saved ? 'true' : 'false');

    if (icon) {
      icon.classList.toggle('bi-check-lg', saved);
      icon.classList.toggle('bi-plus-lg', !saved);
    }

    button.title = saved ? 'Rimuovi dalla libreria' : 'Salva nella libreria';
  }

  // ---------------------------------------------------
  // EVENTI
  // ---------------------------------------------------

  function cardTrack(card) {
    return {
      id: card.dataset.trackId || '',
      streamUrl: card.dataset.previewUrl || '',
      preview: card.dataset.previewUrl || '',
      title: card.dataset.title || '',
      artist: { id: card.dataset.artistId || '', name: card.dataset.artistName || '' },
      album: {
        id: card.dataset.albumId || '',
        title: card.dataset.albumTitle || '',
        cover: card.dataset.cover || '',
        coverSmall: card.dataset.cover || ''
      },
      duration: Number(card.dataset.duration) || 30
    };
  }

  function containerTracks(card) {
    const container = card.closest('.track-container');
    const cards = container
      ? U.qsa('[data-preview-url]', container)
      : [card];

    const playable = cards.filter(function (element) {
      return element.dataset.previewUrl;
    });

    return {
      tracks: playable.map(cardTrack),
      index: playable.indexOf(card)
    };
  }

  function playCard(card) {
    if (!card || !card.dataset.previewUrl) {
      if (card && card.dataset.albumUrl) window.location.href = card.dataset.albumUrl;
      return;
    }

    const selection = containerTracks(card);
    window.musicPlayer.playFrom(selection.tracks, selection.index === -1 ? 0 : selection.index);
  }

  function navigateCard(card) {
    if (card && card.dataset.albumUrl) {
      window.location.href = card.dataset.albumUrl;
    }
  }

  function setGreeting() {
    const element = document.getElementById('greeting');
    if (!element) return;

    const hour = new Date().getHours();
    let greeting = 'Buonasera';
    if (hour < 6) greeting = 'Buonanotte';
    else if (hour < 12) greeting = 'Buongiorno';
    else if (hour < 18) greeting = 'Buon pomeriggio';

    element.textContent = greeting;
  }

  function bindEvents() {
    document.addEventListener('click', function (event) {
      const recentPlay = event.target.closest('.recent-play');
      if (recentPlay) {
        event.preventDefault();
        event.stopPropagation();
        playCard(recentPlay.closest('.recent-card'));
        return;
      }

      const hover = event.target.closest('.play-hover');
      if (hover) {
        event.preventDefault();
        event.stopPropagation();
        playCard(hover.closest('.album-card'));
        return;
      }

      const featuredPlay = event.target.closest('#featured-play');
      if (featuredPlay) {
        event.preventDefault();
        const track = featuredTrack();
        if (track && track.streamUrl) {
          window.musicPlayer.playFrom([track], 0);
        } else if (track && track.album.id) {
          window.location.href = U.pageUrl('album.html', { id: track.album.id });
        }
        return;
      }

      const featuredSave = event.target.closest('#featured-save');
      if (featuredSave) {
        event.preventDefault();
        const container = document.getElementById('featured-album');
        if (!container || !container.dataset.albumId) return;

        const album = {
          id: container.dataset.albumId,
          title: container.dataset.albumTitle,
          cover: container.dataset.cover,
          coverSmall: container.dataset.cover,
          artist: { id: container.dataset.artistId, name: container.dataset.artistName }
        };

        const saved = window.AppLibrary.toggleAlbum(album);
        syncFeaturedSaveButton();
        if (window.AppLayout) {
          window.AppLayout.showToast(saved ? 'Album salvato nella tua libreria' : 'Album rimosso dalla tua libreria');
        }
        return;
      }

      const card = event.target.closest('.album-card, .recent-card');
      if (card) {
        navigateCard(card);
      }
    });

    document.addEventListener('keydown', function (event) {
      if (event.key !== 'Enter' && event.key !== ' ') return;

      const target = event.target;
      if (!target || !target.matches || !target.matches('[role="link"]')) return;

      event.preventDefault();
      navigateCard(target);
    });
  }

  // ---------------------------------------------------
  // AVVIO
  // ---------------------------------------------------

  function init() {
    setGreeting();
    bindEvents();
    loadFeaturedAlbum();
    loadRecentlyPlayed();
    loadAlbumList();
    loadTrending();

    document.addEventListener('library:changed', function (event) {
      if (!event.detail || event.detail.key === window.AppLibrary.KEYS.albums) syncFeaturedSaveButton();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
