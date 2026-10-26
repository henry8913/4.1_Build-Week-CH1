// ===================================================
// PLAYER AUDIO CONDIVISO
// ===================================================
// Play/pausa, precedente/successivo, shuffle, repeat,
// volume, like, coda e recupero automatico delle
// anteprime scadute tramite MusicApi.
// ===================================================

(function () {
  'use strict';

  const U = window.AppUtils;
  const Library = window.AppLibrary;
  const MusicApi = window.MusicApi;

  const STORAGE_KEYS = {
    shuffle: 'shuffle',
    repeat: 'repeat',
    volume: 'volume'
  };

  const DEFAULT_COVER = 'img/cover_c.jpg';

  const audio = new Audio();
  audio.preload = 'none';

  let els = {};
  let playlist = [];
  let currentIndex = -1;
  let currentTrack = null;
  let isPlaying = false;
  let loadedUrl = null;
  let loadToken = 0;
  let recoveryAttempted = false;

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
    const streamUrl = track.streamUrl || track.preview || '';
    const provider = track.provider || inferProvider(streamUrl);

    return {
      id: String(track.id || ''),
      title: track.title || 'Brano sconosciuto',
      artist: {
        id: String(artist.id || ''),
        name: artist.name || 'Artista sconosciuto'
      },
      album: {
        id: String(album.id || ''),
        title: album.title || '',
        cover: album.cover || album.coverSmall || DEFAULT_COVER,
        coverSmall: album.coverSmall || album.cover || DEFAULT_COVER
      },
      duration: Number(track.duration) || 0,
      streamUrl: streamUrl,
      preview: streamUrl,
      provider: provider
    };
  }

  function inferProvider(url) {
    const value = String(url || '');

    if (value.indexOf('audius.co') !== -1 || value.indexOf('app_name=') !== -1) return 'audius';
    if (value.indexOf('dzcdn') !== -1 || value.indexOf('deezer') !== -1) return 'deezer';

    return MusicApi ? MusicApi.getProvider() : '';
  }

  function hasStream(track) {
    return !!track && !!(track.streamUrl || track.preview);
  }

  // ---------------------------------------------------
  // STATO TRA LE PAGINE
  // ---------------------------------------------------

  const PLAYER_STATE_KEY = 'spotifyClone.playerState';
  const STATE_MAX_AGE = 2 * 60 * 60 * 1000;
  let lastStateSave = 0;

  function saveState() {
    if (!currentTrack) return;

    try {
      sessionStorage.setItem(PLAYER_STATE_KEY, JSON.stringify({
        track: currentTrack,
        playlist: playlist,
        index: currentIndex,
        position: audio.currentTime || 0,
        isPlaying: isPlaying,
        updatedAt: Date.now()
      }));
      lastStateSave = Date.now();
    } catch (error) {
      // sessionStorage non disponibile.
    }
  }

  function readState() {
    try {
      const raw = sessionStorage.getItem(PLAYER_STATE_KEY);
      if (!raw) return null;
      const state = JSON.parse(raw);
      if (!state || !state.track || !state.updatedAt) return null;
      if (Date.now() - state.updatedAt > STATE_MAX_AGE) return null;
      return state;
    } catch (error) {
      return null;
    }
  }

  async function restoreState() {
    const state = readState();
    if (!state) return;

    const track = normalizeTrack(state.track);
    if (!track || !hasStream(track)) return;

    currentTrack = track;
    playlist = (state.playlist || []).map(normalizeTrack).filter(hasStream);
    currentIndex = Number(state.index);
    if (!isFinite(currentIndex) || currentIndex < 0 || currentIndex >= playlist.length) {
      currentIndex = 0;
    }

    updateBar(track);
    updateProgressUI();

    try {
      const streamUrl = await MusicApi.resolveStream(track);
      if (!streamUrl) return;

      loadedUrl = streamUrl;
      audio.src = streamUrl;

      const applyPosition = function () {
        const max = isFinite(audio.duration) && audio.duration > 0 ? audio.duration : state.position;
        audio.currentTime = Math.min(Number(state.position) || 0, max || 0);
        updateProgressUI();
      };

      if (audio.readyState >= 1) {
        applyPosition();
      } else {
        audio.addEventListener('loadedmetadata', applyPosition, { once: true });
      }

      if (state.isPlaying) {
        audio.play().catch(function () {
          isPlaying = false;
          updatePlayIcons();
        });
      }
    } catch (error) {
      isPlaying = false;
      updatePlayIcons();
    }
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
      sourceBadge: document.getElementById('source-badge'),

      playBtn: document.querySelector('.play-btn'),
      prevBtn: document.querySelector('.prev-btn'),
      nextBtn: document.querySelector('.next-btn'),
      shuffleBtn: document.querySelector('.shuffle-btn'),
      repeatBtn: document.querySelector('.repeat-btn'),
      addToPlaylistBtn: document.querySelector('.add-to-playlist-btn'),

      progress: document.querySelector('.progress-container .progress'),
      progressBar: document.querySelector('.progress-container .progress-bar'),

      volumeBtn: document.querySelector('.volume-btn'),
      volumeSlider: document.getElementById('volume-slider'),

      mobileCover: document.querySelector('.mobile-album-img'),
      mobileTrackName: document.querySelector('.mobile-track-name'),
      mobileArtistName: document.querySelector('.mobile-artist-name'),
      mobilePlayBtn: document.querySelector('.mobile-play-btn'),
      mobileNextBtn: document.querySelector('.mobile-next-btn'),
      mobileAddBtn: document.querySelector('.mobile-add-btn'),
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

  function updateSourceBadge(track) {
    if (!els.sourceBadge || !MusicApi) return;

    const info = MusicApi.getProviderInfo(track && track.provider);
    els.sourceBadge.textContent = info.badge;
    els.sourceBadge.classList.toggle('is-full', info.supportsFullTracks);
    els.sourceBadge.title = info.label + ' - ' + info.description;
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
      updateSourceBadge(null);
      return;
    }

    setText(els.trackName, track.title);
    setText(els.mobileTrackName, track.title);
    setText(els.totalTime, track.duration ? U.formatTime(track.duration) : '0:00');

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
        image.src = track.album.coverSmall || track.album.cover;
        image.alt = track.album.title ? 'Copertina di ' + track.album.title : '';
      }
    });

    updateLikeIcons();
    updateSourceBadge(track);
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
    const active = currentTrack ? Library.isLiked(currentTrack) : false;

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
      const url = row.getAttribute('data-preview-url');
      const id = row.getAttribute('data-track-id');
      const matchesUrl = !!currentTrack && !!url && url === currentTrack.streamUrl;
      const matchesId = !!currentTrack && !!id && id === String(currentTrack.id) && (!url || url === currentTrack.streamUrl);
      row.classList.toggle('is-playing', !!currentTrack && (matchesUrl || matchesId));
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

    if (els.volumeSlider) {
      els.volumeSlider.value = String(percentage);
      els.volumeSlider.style.setProperty('--volume', percentage + '%');
    }

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

  async function startTrack(track) {
    const token = ++loadToken;
    currentTrack = track;
    recoveryAttempted = false;

    updateBar(track);
    updateProgressUI();
    saveState();

    let streamUrl;
    try {
      streamUrl = await MusicApi.resolveStream(track);
    } catch (error) {
      if (token !== loadToken) return;
      console.warn('Anteprima non disponibile:', error);
      isPlaying = false;
      updatePlayIcons();
      if (window.AppLayout) window.AppLayout.showToast("Anteprima non disponibile per questo brano");
      return;
    }

    if (token !== loadToken) return;
    if (!streamUrl) {
      isPlaying = false;
      updatePlayIcons();
      return;
    }

    if (loadedUrl !== streamUrl) {
      audio.src = streamUrl;
      loadedUrl = streamUrl;
      audio.currentTime = 0;
    }

    try {
      await audio.play();
    } catch (error) {
      if (token !== loadToken) return;
      console.warn('Riproduzione non disponibile:', error);
      isPlaying = false;
      updatePlayIcons();
    }
  }

  function playIndex(index) {
    if (!playlist.length) return;

    const safeIndex = ((index % playlist.length) + playlist.length) % playlist.length;
    const track = playlist[safeIndex];

    if (!hasStream(track)) {
      for (let step = 1; step < playlist.length; step++) {
        const candidate = playlist[(safeIndex + step) % playlist.length];
        if (hasStream(candidate)) {
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

  function playTrack(track) {
    const normalized = normalizeTrack(track);

    if (!normalized || !hasStream(normalized)) {
      if (window.AppLayout) window.AppLayout.showToast("Questo brano non ha un'anteprima disponibile");
      return;
    }

    const existingIndex = playlist.findIndex(function (item) {
      return item.id === normalized.id && normalized.id;
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

    const requested = allTracks[startIndex] || allTracks.find(function (track) {
      return hasStream(track);
    });

    playlist = allTracks.filter(hasStream);

    if (!playlist.length) {
      if (window.AppLayout) window.AppLayout.showToast('Nessun brano riproducibile in questa lista');
      return;
    }

    const index = requested
      ? playlist.findIndex(function (track) {
        return requested.id ? track.id === requested.id : track.streamUrl === requested.streamUrl;
      })
      : 0;

    playIndex(index === -1 ? 0 : index);
  }

  function playTrackList(tracks, startIndex) {
    playFrom(tracks, startIndex || 0);
  }

  function toggle() {
    if (!currentTrack) {
      if (playlist.length) {
        playIndex(0);
      } else if (window.AppLayout) {
        window.AppLayout.showToast('Scegli un brano da riprodurre');
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

  function clear() {
    audio.pause();
    audio.removeAttribute('src');
    loadedUrl = null;
    currentTrack = null;
    playlist = [];
    currentIndex = -1;
    isPlaying = false;

    try {
      sessionStorage.removeItem(PLAYER_STATE_KEY);
    } catch (error) {
      // sessionStorage non disponibile.
    }

    updateBar(null);
    updateProgressUI();
    updatePlayIcons();
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

    const active = Library.toggleLiked(currentTrack);
    updateLikeIcons();

    if (window.AppLayout) {
      window.AppLayout.showToast(active ? 'Aggiunto ai brani che ti piacciono' : 'Rimosso dai brani che ti piacciono');
    }
  }

  function openAddToPlaylist() {
    if (!currentTrack) {
      if (window.AppLayout) window.AppLayout.showToast('Nessun brano in riproduzione');
      return;
    }
    if (window.AppLayout) window.AppLayout.openAddToPlaylist(currentTrack);
  }

  // ---------------------------------------------------
  // MEDIA SESSION
  // ---------------------------------------------------

  function updateMediaSession(track) {
    if (!('mediaSession' in navigator) || typeof window.MediaMetadata !== 'function') return;

    try {
      navigator.mediaSession.metadata = new window.MediaMetadata({
        title: track.title,
        artist: track.artist.name,
        album: track.album.title || '',
        artwork: [{ src: track.album.coverSmall || track.album.cover, sizes: '300x300', type: 'image/jpeg' }]
      });
    } catch (error) {
      // Media Session non disponibile.
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
        // Azione non supportata.
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
      saveState();
    });

    audio.addEventListener('pause', function () {
      isPlaying = false;
      updatePlayIcons();
      saveState();
    });

    audio.addEventListener('timeupdate', function () {
      updateProgressUI();
      if (Date.now() - lastStateSave > 2000) saveState();
    });

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
      if (!currentTrack || recoveryAttempted) {
        isPlaying = false;
        updatePlayIcons();
        if (window.AppLayout) window.AppLayout.showToast('Impossibile riprodurre questo brano');
        return;
      }
      // L'anteprima potrebbe essere scaduta: la richiediamo di nuovo.
      recoveryAttempted = true;
      const trackToRecover = Object.assign({}, currentTrack, { streamUrl: '', preview: '' });

      MusicApi.resolveStream(trackToRecover).then(function (streamUrl) {
        if (!streamUrl) throw new Error('Anteprima non disponibile');
        currentTrack.streamUrl = streamUrl;
        currentTrack.preview = streamUrl;
        loadedUrl = streamUrl;
        audio.src = streamUrl;
        return audio.play();
      }).catch(function () {
        isPlaying = false;
        updatePlayIcons();
        if (window.AppLayout) window.AppLayout.showToast("Anteprima non disponibile per questo brano");
      });
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

    let dragging = false;

    function apply(event) {
      seekToRatio(ratioFromEvent(element, event));
    }

    element.addEventListener('pointerdown', function (event) {
      if (event.button !== undefined && event.button !== 0) return;

      dragging = true;
      element.classList.add('is-dragging');
      if (element.focus) element.focus();

      if (element.setPointerCapture) {
        try { element.setPointerCapture(event.pointerId); } catch (error) {}
      }

      apply(event);
      event.preventDefault();
    });

    element.addEventListener('pointermove', function (event) {
      if (!dragging) return;
      apply(event);
      event.preventDefault();
    });

    function stop(event) {
      if (!dragging) return;
      dragging = false;
      element.classList.remove('is-dragging');

      if (element.releasePointerCapture && event.pointerId !== undefined) {
        try { element.releasePointerCapture(event.pointerId); } catch (error) {}
      }
    }

    element.addEventListener('pointerup', stop);
    element.addEventListener('pointercancel', stop);
    element.addEventListener('lostpointercapture', function () {
      dragging = false;
      element.classList.remove('is-dragging');
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

  function bindVolumeSlider(slider) {
    if (!slider) return;

    slider.addEventListener('input', function () {
      setVolume(Number(slider.value) / 100);
    });

    slider.addEventListener('pointerdown', function () {
      slider.classList.add('is-dragging');
    });

    slider.addEventListener('pointerup', function () {
      slider.classList.remove('is-dragging');
    });

    slider.addEventListener('blur', function () {
      slider.classList.remove('is-dragging');
    });
  }

  function bindUIEvents() {
    if (els.playBtn) els.playBtn.addEventListener('click', toggle);
    if (els.mobilePlayBtn) els.mobilePlayBtn.addEventListener('click', toggle);
    if (els.nextBtn) els.nextBtn.addEventListener('click', playNext);
    if (els.mobileNextBtn) els.mobileNextBtn.addEventListener('click', playNext);
    if (els.mobileAddBtn) els.mobileAddBtn.addEventListener('click', openAddToPlaylist);
    if (els.prevBtn) els.prevBtn.addEventListener('click', playPrevious);
    if (els.shuffleBtn) els.shuffleBtn.addEventListener('click', toggleShuffle);
    if (els.repeatBtn) els.repeatBtn.addEventListener('click', cycleRepeat);
    if (els.volumeBtn) els.volumeBtn.addEventListener('click', toggleMute);
    if (els.addToPlaylistBtn) els.addToPlaylistBtn.addEventListener('click', openAddToPlaylist);

    U.qsa('.like-btn').forEach(function (button) {
      button.addEventListener('click', toggleLike);
    });

    bindProgress(els.progress);
    bindProgress(els.mobileProgress);
    bindVolumeSlider(els.volumeSlider);

    document.addEventListener('keydown', function (event) {
      if (event.code !== 'Space') return;
      const target = event.target;
      if (!target) return;
      if (target.closest('input, textarea, button, a, [role="link"], [role="slider"], [contenteditable="true"]')) return;
      event.preventDefault();
      toggle();
    });

    document.addEventListener('library:changed', function (event) {
      if (!event.detail || event.detail.key === Library.KEYS.liked) updateLikeIcons();
    });
  }

  // ---------------------------------------------------
  // INIZIALIZZAZIONE
  // ---------------------------------------------------

  function init() {
    cacheElements();

    if (!hasPlayerBar()) {
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
    restoreState();

    window.addEventListener('pagehide', saveState);
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) saveState();
    });
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
    play: function (url, trackInfo) {
      playTrack(Object.assign({}, trackInfo || {}, { streamUrl: url, preview: url }));
    },
    playTrack: playTrack,
    playFrom: playFrom,
    playTrackList: playTrackList,
    toggle: toggle,
    pause: pause,
    clear: clear,
    isPlaying: function () { return isPlaying; },
    setPlaylist: function (tracks) {
      playlist = (tracks || []).map(normalizeTrack).filter(hasStream);
    },
    getPlaylist: function () { return playlist.slice(); },
    playNext: playNext,
    playPrevious: playPrevious,
    getCurrentTrack: function () { return currentTrack ? currentTrack.streamUrl : null; },
    getCurrentTrackInfo: function () { return currentTrack; },
    isLiked: function () { return currentTrack ? Library.isLiked(currentTrack) : false; },
    toggleLike: toggleLike,
    setVolume: setVolume,
    seekToRatio: seekToRatio,
    openAddToPlaylist: openAddToPlaylist
  };
})();
