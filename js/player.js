// ===================================================
// PLAYER AUDIO CONDIVISO
// ===================================================
// Un solo player per tutte le pagine: play/pausa,
// brano successivo/precedente, shuffle, repeat, volume,
// like persistente e mini player mobile.
// ===================================================

(function () {
  'use strict';

  const U = window.AppUtils;
  const STORAGE_KEYS = {
    shuffle: 'shuffle',
    repeat: 'repeat',
    volume: 'volume'
  };

  const audio = new Audio();
  audio.preload = 'none';

  let els = {};
  let playlist = [];
  let currentIndex = -1;
  let currentTrack = null;
  let isPlaying = false;
  let loadedUrl = null;

  let shuffle = U.storage.get(STORAGE_KEYS.shuffle, false) === true;
  let repeat = U.storage.get(STORAGE_KEYS.repeat, 'off');
  let volume = Number(U.storage.get(STORAGE_KEYS.volume, 0.7));
  let lastVolume = volume > 0 ? volume : 0.7;

  if (!['off', 'all', 'one'].includes(repeat)) repeat = 'off';
  if (!isFinite(volume) || volume < 0 || volume > 1) volume = 0.7;

  audio.volume = volume;

  // ---------------------------------------------------
  // DATI
  // ---------------------------------------------------

  function normalizeTrack(track) {
    if (!track) return null;

    const artist = track.artist || {};
    const album = track.album || {};

    return {
      id: track.id !== undefined && track.id !== null ? track.id : (track.preview || track.title || ''),
      preview: track.preview || '',
      title: track.title || 'Brano sconosciuto',
      artist: {
        id: artist.id !== undefined && artist.id !== null ? String(artist.id) : '',
        name: artist.name || 'Artista sconosciuto'
      },
      album: {
        id: album.id !== undefined && album.id !== null ? album.id : '',
        title: album.title || '',
        cover_small: album.cover_small || album.cover_medium || 'img/cover_c.jpg'
      },
      duration: Number(track.duration) || 0
    };
  }

  function trackKey(track) {
    if (!track) return '';
    return String(track.id || track.preview || track.title || '');
  }

  // ---------------------------------------------------
  // RIFERIMENTI DOM
  // ---------------------------------------------------

  function cacheElements() {
    els = {
      bar: document.getElementById('player-bar'),

      cover: document.querySelector('.current-album-img'),
      trackName: document.querySelector('.track-name'),
      artistName: document.querySelector('.artist-name'),
      totalTime: document.querySelector('.total-time'),
      currentTime: document.querySelector('.current-time'),

      playBtn: document.querySelector('.play-btn'),
      prevBtn: document.querySelector('.prev-btn'),
      nextBtn: document.querySelector('.next-btn'),
      shuffleBtn: document.querySelector('.shuffle-btn'),
      repeatBtn: document.querySelector('.repeat-btn'),

      progress: document.querySelector('.progress-container .progress'),
      progressBar: document.querySelector('.progress-container .progress-bar'),

      volumeBtn: document.querySelector('.volume-btn'),
      volumeContainer: document.querySelector('.volume-container'),
      volumeBar: document.querySelector('.volume-container .progress-bar'),

      mobileCover: document.querySelector('.mobile-album-img'),
      mobileTrackName: document.querySelector('.mobile-track-name'),
      mobileArtistName: document.querySelector('.mobile-artist-name'),
      mobilePlayBtn: document.querySelector('.mobile-play-btn'),
      mobileNextBtn: document.querySelector('.mobile-next-btn'),
      mobileProgress: document.querySelector('.mobile-progress'),
      mobileProgressBar: document.querySelector('.mobile-progress-bar')
    };
  }

  function hasPlayerBar() {
    return !!els.bar;
  }

  // ---------------------------------------------------
  // INTERFACCIA
  // ---------------------------------------------------

  function setText(element, text) {
    if (element) element.textContent = text;
  }

  function updateBar(track) {
    if (!hasPlayerBar()) return;

    if (!track) {
      setText(els.trackName, 'Nessun brano');
      setText(els.artistName, 'Seleziona un brano');
      setText(els.mobileTrackName, 'Nessun brano');
      setText(els.mobileArtistName, 'Seleziona un brano');
      setText(els.totalTime, '0:00');
      updateLikeIcons();
      return;
    }

    setText(els.trackName, track.title);
    setText(els.mobileTrackName, track.title);
    setText(els.totalTime, track.duration ? U.formatTime(track.duration) : '0:00');

    // Nome artista come link sicuro (nessun innerHTML con dati esterni).
    [els.artistName, els.mobileArtistName].forEach(function (container) {
      if (!container) return;
      container.textContent = '';

      if (track.artist.id) {
        const link = document.createElement('a');
        link.href = U.pageUrl('artist.html', { id: track.artist.id });
        link.className = 'text-white-50';
        link.textContent = track.artist.name;
        container.appendChild(link);
      } else {
        container.textContent = track.artist.name;
      }
    });

    [els.cover, els.mobileCover].forEach(function (image) {
      if (image) {
        image.src = track.album.cover_small;
        image.alt = track.album.title ? 'Copertina di ' + track.album.title : '';
      }
    });

    updateLikeIcons();
    updateMediaSession(track);
    highlightRows();
  }

  function updatePlayIcons() {
    const shouldShowPlay = !isPlaying;

    U.qsa('.play-btn i').forEach(function (icon) {
      icon.classList.toggle('bi-play-circle-fill', shouldShowPlay);
      icon.classList.toggle('bi-pause-circle-fill', !shouldShowPlay);
    });

    U.qsa('.mobile-play-btn i').forEach(function (icon) {
      icon.classList.toggle('bi-play-fill', shouldShowPlay);
      icon.classList.toggle('bi-pause-fill', !shouldShowPlay);
    });

    if (els.playBtn) els.playBtn.setAttribute('aria-label', shouldShowPlay ? 'Riproduci' : 'Metti in pausa');
    if (els.mobilePlayBtn) els.mobilePlayBtn.setAttribute('aria-label', shouldShowPlay ? 'Riproduci' : 'Metti in pausa');
  }

  function updateShuffleIcon() {
    if (els.shuffleBtn) {
      els.shuffleBtn.classList.toggle('is-active', shuffle);
      els.shuffleBtn.setAttribute('aria-pressed', shuffle ? 'true' : 'false');
    }
  }

  function updateRepeatIcon() {
    if (!els.repeatBtn) return;

    const icon = els.repeatBtn.querySelector('i');
    if (icon) {
      icon.classList.toggle('bi-repeat', repeat !== 'one');
      icon.classList.toggle('bi-repeat-1', repeat === 'one');
    }

    els.repeatBtn.classList.toggle('is-active', repeat !== 'off');
    els.repeatBtn.setAttribute('aria-pressed', repeat !== 'off' ? 'true' : 'false');
    els.repeatBtn.setAttribute(
      'aria-label',
      repeat === 'one' ? 'Ripeti il brano' : (repeat === 'all' ? 'Ripeti la playlist' : 'Ripetizione disattivata')
    );
  }

  function updateLikeIcons() {
    const active = currentTrack ? U.isInList(U.LISTS.likedTracks, trackKey(currentTrack)) : false;

    U.qsa('.like-btn').forEach(function (button) {
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', active ? 'true' : 'false');
      const icon = button.querySelector('i');
      if (icon) {
        icon.classList.toggle('bi-heart', !active);
        icon.classList.toggle('bi-heart-fill', active);
      }
    });
  }

  function highlightRows() {
    U.qsa('[data-preview-url]').forEach(function (row) {
      row.classList.toggle('is-playing', !!currentTrack && row.getAttribute('data-preview-url') === currentTrack.preview);
    });
  }

  function updateProgressUI() {
    const duration = isFinite(audio.duration) && audio.duration > 0 ? audio.duration : 0;
    const ratio = duration ? Math.min(1, audio.currentTime / duration) : 0;
    const percentage = Math.round(ratio * 100);

    if (els.progressBar) els.progressBar.style.width = percentage + '%';
    if (els.mobileProgressBar) els.mobileProgressBar.style.width = percentage + '%';
    setText(els.currentTime, U.formatTime(audio.currentTime));

    if (duration) setText(els.totalTime, U.formatTime(duration));

    if (els.progress) els.progress.setAttribute('aria-valuenow', String(percentage));
    if (els.mobileProgress) els.mobileProgress.setAttribute('aria-valuenow', String(percentage));
  }

  function updateVolumeUI() {
    const percentage = Math.round(volume * 100);
    if (els.volumeBar) els.volumeBar.style.width = percentage + '%';
    if (els.volumeContainer) els.volumeContainer.setAttribute('aria-valuenow', String(percentage));

    if (els.volumeBtn) {
      const icon = els.volumeBtn.querySelector('i');
      if (icon) {
        icon.classList.toggle('bi-volume-mute-fill', volume === 0);
        icon.classList.toggle('bi-volume-down-fill', volume > 0 && volume < 0.5);
        icon.classList.toggle('bi-volume-up-fill', volume >= 0.5);
      }
      els.volumeBtn.setAttribute('aria-label', volume === 0 ? 'Attiva audio' : 'Disattiva audio');
    }
  }

  // ---------------------------------------------------
  // RIPRODUZIONE
  // ---------------------------------------------------

  function playIndex(index) {
    if (!playlist.length) return;

    const safeIndex = ((index % playlist.length) + playlist.length) % playlist.length;
    const track = playlist[safeIndex];

    if (!track || !track.preview) {
      // Salta i brani senza anteprima, senza rischiare un loop infinito.
      for (let step = 1; step < playlist.length; step++) {
        const candidate = playlist[(safeIndex + step) % playlist.length];
        if (candidate && candidate.preview) {
          playIndex(safeIndex + step);
          return;
        }
      }
      if (window.AppLayout) window.AppLayout.showToast('Nessun brano riproducibile in questa lista');
      return;
    }

    currentIndex = safeIndex;
    startTrack(track);
  }

  function startTrack(track) {
    currentTrack = track;

    if (loadedUrl !== track.preview) {
      audio.src = track.preview;
      loadedUrl = track.preview;
      audio.currentTime = 0;
    }

    updateBar(track);
    updateProgressUI();

    const promise = audio.play();
    if (promise && typeof promise.catch === 'function') {
      promise.catch(function (error) {
        console.warn('Riproduzione non disponibile:', error);
        isPlaying = false;
        updatePlayIcons();
      });
    }
  }

  function playTrack(track) {
    const normalized = normalizeTrack(track);

    if (!normalized || !normalized.preview) {
      if (window.AppLayout) window.AppLayout.showToast("Questo brano non ha un'anteprima disponibile");
      return;
    }

    const existingIndex = playlist.findIndex(function (item) {
      return item.preview === normalized.preview;
    });

    if (existingIndex !== -1) {
      playlist[existingIndex] = normalized;
      currentIndex = existingIndex;
    } else {
      playlist = [normalized];
      currentIndex = 0;
    }

    startTrack(playlist[currentIndex]);
  }

  function playFrom(tracks, startIndex) {
    const allTracks = (tracks || []).map(normalizeTrack).filter(Boolean);

    // Individuiamo il brano scelto prima di scartare quelli senza anteprima,
    // cosi' gli indici restano corretti anche con tracce non riproducibili.
    const requested = allTracks[startIndex] || allTracks.find(function (track) {
      return track.preview;
    });

    playlist = allTracks.filter(function (track) {
      return track.preview;
    });

    if (!playlist.length) {
      if (window.AppLayout) window.AppLayout.showToast("Nessun brano riproducibile in questa lista");
      return;
    }

    const index = requested
      ? playlist.findIndex(function (track) { return track.preview === requested.preview; })
      : 0;

    playIndex(index === -1 ? 0 : index);
  }

  function toggle() {
    if (!currentTrack) {
      if (playlist.length) {
        playIndex(0);
      } else {
        if (window.AppLayout) window.AppLayout.showToast('Scegli un brano da riprodurre');
      }
      return;
    }

    if (audio.paused) {
      audio.play().catch(function (error) {
        console.warn('Riproduzione non disponibile:', error);
      });
    } else {
      audio.pause();
    }
  }

  function pause() {
    audio.pause();
  }

  function playNext() {
    if (!playlist.length) return;

    if (shuffle && playlist.length > 1) {
      let next = currentIndex;
      while (next === currentIndex) {
        next = Math.floor(Math.random() * playlist.length);
      }
      playIndex(next);
      return;
    }

    playIndex(currentIndex + 1);
  }

  function playPrevious() {
    if (!playlist.length) return;

    if (audio.currentTime > 3) {
      audio.currentTime = 0;
      return;
    }

    if (shuffle && playlist.length > 1) {
      let previous = currentIndex;
      while (previous === currentIndex) {
        previous = Math.floor(Math.random() * playlist.length);
      }
      playIndex(previous);
      return;
    }

    playIndex(currentIndex - 1);
  }

  function seekToRatio(ratio) {
    if (!loadedUrl || !isFinite(audio.duration) || audio.duration <= 0) return;
    const safeRatio = Math.max(0, Math.min(1, ratio));
    audio.currentTime = safeRatio * audio.duration;
    updateProgressUI();
  }

  function seekBySeconds(seconds) {
    if (!loadedUrl || !isFinite(audio.duration) || audio.duration <= 0) return;
    audio.currentTime = Math.max(0, Math.min(audio.duration, audio.currentTime + seconds));
    updateProgressUI();
  }

  function setVolume(value) {
    const safeValue = Math.max(0, Math.min(1, value));
    volume = safeValue;
    audio.volume = safeValue;
    if (safeValue > 0) lastVolume = safeValue;
    U.storage.set(STORAGE_KEYS.volume, safeValue);
    updateVolumeUI();
  }

  function toggleMute() {
    if (volume > 0) {
      lastVolume = volume;
      setVolume(0);
    } else {
      setVolume(lastVolume || 0.7);
    }
  }

  function toggleShuffle() {
    shuffle = !shuffle;
    U.storage.set(STORAGE_KEYS.shuffle, shuffle);
    updateShuffleIcon();
    if (window.AppLayout) {
      window.AppLayout.showToast(shuffle ? 'Riproduzione casuale attiva' : 'Riproduzione casuale disattivata');
    }
  }

  function cycleRepeat() {
    const modes = ['off', 'all', 'one'];
    const nextIndex = (modes.indexOf(repeat) + 1) % modes.length;
    repeat = modes[nextIndex];
    U.storage.set(STORAGE_KEYS.repeat, repeat);
    updateRepeatIcon();
    if (window.AppLayout) {
      window.AppLayout.showToast(
        repeat === 'one' ? 'Ripeti il brano' : (repeat === 'all' ? 'Ripeti la playlist' : 'Ripetizione disattivata')
      );
    }
  }

  function toggleLike() {
    if (!currentTrack) {
      if (window.AppLayout) window.AppLayout.showToast('Nessun brano in riproduzione');
      return;
    }

    const active = U.toggleInList(U.LISTS.likedTracks, trackKey(currentTrack));
    updateLikeIcons();

    if (window.AppLayout) {
      window.AppLayout.showToast(active ? 'Aggiunto ai brani che ti piacciono' : 'Rimosso dai brani che ti piacciono');
    }
  }

  // ---------------------------------------------------
  // MEDIA SESSION (lock screen / tasti multimediali)
  // ---------------------------------------------------

  function updateMediaSession(track) {
    if (!('mediaSession' in navigator) || typeof window.MediaMetadata !== 'function') return;

    try {
      navigator.mediaSession.metadata = new window.MediaMetadata({
        title: track.title,
        artist: track.artist.name,
        album: track.album.title || '',
        artwork: [{ src: track.album.cover_small, sizes: '300x300', type: 'image/jpeg' }]
      });
    } catch (error) {
      // Media Session non disponibile: nessun problema.
    }
  }

  function initMediaSession() {
    if (!('mediaSession' in navigator)) return;

    const actions = {
      play: function () { toggle(); },
      pause: function () { pause(); },
      previoustrack: function () { playPrevious(); },
      nexttrack: function () { playNext(); },
      seekto: function (details) {
        if (isFinite(audio.duration) && details.seekTime !== undefined) {
          audio.currentTime = details.seekTime;
        }
      }
    };

    Object.keys(actions).forEach(function (action) {
      try {
        navigator.mediaSession.setActionHandler(action, actions[action]);
      } catch (error) {
        // Azione non supportata dal browser.
      }
    });
  }

  // ---------------------------------------------------
  // EVENTI AUDIO
  // ---------------------------------------------------

  function bindAudioEvents() {
    audio.addEventListener('play', function () {
      isPlaying = true;
      updatePlayIcons();
    });

    audio.addEventListener('pause', function () {
      isPlaying = false;
      updatePlayIcons();
    });

    audio.addEventListener('timeupdate', updateProgressUI);

    audio.addEventListener('loadedmetadata', function () {
      updateProgressUI();
    });

    audio.addEventListener('ended', function () {
      if (repeat === 'one') {
        audio.currentTime = 0;
        audio.play().catch(function () {});
        return;
      }

      if (shuffle) {
        playNext();
        return;
      }

      if (currentIndex >= playlist.length - 1) {
        if (repeat === 'all') {
          playIndex(0);
        } else {
          isPlaying = false;
          updatePlayIcons();
          audio.currentTime = 0;
          updateProgressUI();
        }
        return;
      }

      playNext();
    });

    audio.addEventListener('error', function () {
      isPlaying = false;
      updatePlayIcons();
      if (window.AppLayout) window.AppLayout.showToast("Impossibile riprodurre questo brano");
    });
  }

  // ---------------------------------------------------
  // EVENTI UI
  // ---------------------------------------------------

  function ratioFromEvent(element, event) {
    const rect = element.getBoundingClientRect();
    if (!rect.width) return 0;
    return (event.clientX - rect.left) / rect.width;
  }

  function bindProgress(element) {
    if (!element) return;

    element.addEventListener('click', function (event) {
      seekToRatio(ratioFromEvent(element, event));
    });

    element.addEventListener('keydown', function (event) {
      if (event.key === 'ArrowRight') {
        event.preventDefault();
        seekBySeconds(5);
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault();
        seekBySeconds(-5);
      }
    });
  }

  function bindVolume(element) {
    if (!element) return;

    element.addEventListener('click', function (event) {
      setVolume(ratioFromEvent(element, event));
    });

    element.addEventListener('keydown', function (event) {
      if (event.key === 'ArrowRight' || event.key === 'ArrowUp') {
        event.preventDefault();
        setVolume(volume + 0.05);
      } else if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') {
        event.preventDefault();
        setVolume(volume - 0.05);
      }
    });
  }

  function bindUIEvents() {
    if (els.playBtn) els.playBtn.addEventListener('click', toggle);
    if (els.mobilePlayBtn) els.mobilePlayBtn.addEventListener('click', toggle);
    if (els.nextBtn) els.nextBtn.addEventListener('click', playNext);
    if (els.mobileNextBtn) els.mobileNextBtn.addEventListener('click', playNext);
    if (els.prevBtn) els.prevBtn.addEventListener('click', playPrevious);
    if (els.shuffleBtn) els.shuffleBtn.addEventListener('click', toggleShuffle);
    if (els.repeatBtn) els.repeatBtn.addEventListener('click', cycleRepeat);
    if (els.volumeBtn) els.volumeBtn.addEventListener('click', toggleMute);

    U.qsa('.like-btn').forEach(function (button) {
      button.addEventListener('click', toggleLike);
    });

    bindProgress(els.progress);
    bindProgress(els.mobileProgress);
    bindVolume(els.volumeContainer);

    // Spazio = play/pausa, tranne quando si sta scrivendo
    // o si sta interagendo con un elemento gia' attivabile.
    document.addEventListener('keydown', function (event) {
      if (event.code !== 'Space') return;
      const target = event.target;
      if (!target) return;
      if (target.closest('input, textarea, button, a, [role="link"], [role="slider"], [contenteditable="true"]')) return;
      event.preventDefault();
      toggle();
    });
  }

  // ---------------------------------------------------
  // INIZIALIZZAZIONE
  // ---------------------------------------------------

  function init() {
    cacheElements();

    if (!hasPlayerBar()) {
      // Pagine senza player bar: l'audio resta comunque utilizzabile.
      bindAudioEvents();
      return;
    }

    bindAudioEvents();
    bindUIEvents();
    initMediaSession();

    updatePlayIcons();
    updateShuffleIcon();
    updateRepeatIcon();
    updateVolumeUI();
    updateProgressUI();
    updateBar(null);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // ---------------------------------------------------
  // API PUBBLICA
  // ---------------------------------------------------

  window.musicPlayer = {
    play: function (previewUrl, trackInfo) {
      playTrack(Object.assign({}, trackInfo || {}, { preview: previewUrl }));
    },
    playTrack: playTrack,
    playFrom: playFrom,
    toggle: toggle,
    pause: pause,
    isPlaying: function () { return isPlaying; },
    setPlaylist: function (tracks) {
      playlist = (tracks || []).map(normalizeTrack).filter(function (track) {
        return track && track.preview;
      });
    },
    getPlaylist: function () { return playlist.slice(); },
    playNext: playNext,
    playPrevious: playPrevious,
    getCurrentTrack: function () { return currentTrack ? currentTrack.preview : null; },
    getCurrentTrackInfo: function () { return currentTrack; },
    isLiked: function () {
      return currentTrack ? U.isInList(U.LISTS.likedTracks, trackKey(currentTrack)) : false;
    },
    toggleLike: toggleLike,
    setVolume: setVolume,
    seekToRatio: seekToRatio
  };
})();
