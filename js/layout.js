// ===================================================
// LAYOUT CONDIVISO
// ===================================================
// Sidebar, header, colonna amici, player bar e dialoghi
// condivisi. Su mobile la navigazione resta in basso,
// come nel progetto originale.
// ===================================================

(function () {
  'use strict';

  const U = window.AppUtils;
  const Library = window.AppLibrary;

  const FRIENDS = [
    {
      name: 'Charlie Hookham',
      status: 'In ascolto - Your Autumn',
      extra: 'LESSERAFIM',
      time: '4 ore',
      avatar: 'img/friends/charlie.jpg'
    },
    {
      name: 'Juliet Huffaker',
      status: 'Ascolto da Kil Julio LaRive',
      extra: 'Asleep by Kil',
      time: '8 min',
      avatar: 'img/friends/juliet.jpg'
    },
    {
      name: 'Victoria Traverso',
      status: 'Now Rings - Dripping Wolf',
      extra: 'Town Bazaars (remix)',
      time: '3 giorni',
      avatar: 'img/friends/victoria.jpg'
    }
  ];

  let pendingTrackForPlaylist = null;
  let pendingConfirm = null;

  // ---------------------------------------------------
  // TEMPLATE
  // ---------------------------------------------------

  function sidebarTemplate() {
    return (
      '<aside class="sidebar" id="app-sidebar" aria-label="Navigazione principale">' +
        '<div class="sidebar-content">' +
          '<div class="sidebar-top">' +
            '<a class="logo" href="index.html" aria-label="Home">' +
              '<i class="bi bi-spotify"></i><span>Spotify</span>' +
            '</a>' +
          '</div>' +

          '<ul class="nav flex-column sidebar-nav">' +
            '<li class="nav-item">' +
              '<a class="nav-link" data-nav="home" href="index.html"><i class="bi bi-house-door-fill"></i> Home</a>' +
            '</li>' +
            '<li class="nav-item">' +
              '<a class="nav-link" data-nav="search" href="search.html"><i class="bi bi-search"></i> Cerca</a>' +
            '</li>' +
            '<li class="nav-item sidebar-search">' +
              '<label class="visually-hidden" for="sidebar-search-input">Cerca nel catalogo</label>' +
              '<input type="search" id="sidebar-search-input" class="form-control form-control-sm" placeholder="Cosa vuoi ascoltare?">' +
            '</li>' +
            '<li class="nav-item">' +
              '<a class="nav-link" data-nav="library" href="library.html"><i class="bi bi-collection"></i> La tua libreria</a>' +
            '</li>' +
            '<li class="nav-item">' +
              '<button type="button" class="nav-link nav-button" id="create-playlist-link">' +
                '<i class="bi bi-plus-square"></i> Crea playlist' +
              '</button>' +
            '</li>' +
            '<li class="nav-item">' +
              '<a class="nav-link" data-nav="liked" href="liked.html"><i class="bi bi-heart-fill"></i> Brani che ti piacciono</a>' +
            '</li>' +
            '<li class="nav-item">' +
              '<a class="nav-link" href="library.html#episodes"><i class="bi bi-bookmark-fill"></i> I tuoi episodi</a>' +
            '</li>' +
          '</ul>' +

          '<div class="sidebar-divider"></div>' +
          '<div class="sidebar-heading-row">' +
            '<p class="sidebar-heading">Le tue playlist</p>' +
            '<button type="button" class="sidebar-add" id="create-playlist-link-2" aria-label="Crea una playlist">' +
              '<i class="bi bi-plus-lg"></i>' +
            '</button>' +
          '</div>' +
          '<ul class="nav flex-column playlist-list" id="sidebar-playlists"></ul>' +
        '</div>' +
      '</aside>'
    );
  }

  function headerTemplate() {
    return (
      '<header class="main-header">' +
        '<div class="header-left">' +
          '<div class="nav-controls">' +
            '<button type="button" class="btn btn-dark btn-circle" id="history-back" aria-label="Indietro">' +
              '<i class="bi bi-chevron-left"></i>' +
            '</button>' +
            '<button type="button" class="btn btn-dark btn-circle" id="history-forward" aria-label="Avanti">' +
              '<i class="bi bi-chevron-right"></i>' +
            '</button>' +
          '</div>' +
        '</div>' +

        '<div class="header-right">' +
          '<div class="user-profile-container" role="button" tabindex="0" data-soon="Il profilo utente arriverà presto">' +
            '<img src="img/friends/lidia.jpg" alt="" class="user-avatar">' +
            '<span class="user-name">Lidia Nautilus</span>' +
            '<i class="bi bi-caret-down-fill"></i>' +
          '</div>' +
        '</div>' +
      '</header>'
    );
  }

  function friendsTemplate() {
    const items = FRIENDS.map(function (friend) {
      return (
        '<div class="friend-activity p-2 mb-3">' +
          '<div class="d-flex align-items-start">' +
            '<img src="' + U.escapeHtml(friend.avatar) + '" alt="" class="friend-avatar" loading="lazy">' +
            '<div class="ms-2 friend-text">' +
              '<p class="friend-name m-0 text-white">' + U.escapeHtml(friend.name) + '</p>' +
              '<p class="friend-status m-0 text-white-50 small">' + U.escapeHtml(friend.status) + '</p>' +
              '<p class="friend-extra m-0 text-white-50 small">' +
                '<i class="bi bi-music-note-beamed me-1"></i>' + U.escapeHtml(friend.extra) +
              '</p>' +
            '</div>' +
            '<div class="ms-auto text-white-50 small friend-time">' + U.escapeHtml(friend.time) + '</div>' +
          '</div>' +
        '</div>'
      );
    }).join('');

    return (
      '<aside class="friends-sidebar" aria-label="Attività amici">' +
        '<div class="friends-header p-3">' +
          '<h2 class="friends-title m-0">Attività amici</h2>' +
          '<div class="d-flex gap-2">' +
            '<button type="button" class="btn btn-sm btn-dark" aria-label="Aggiungi amici" data-soon="Gli amici arriveranno presto">' +
              '<i class="bi bi-person-plus"></i>' +
            '</button>' +
            '<button type="button" class="btn btn-sm btn-dark" aria-label="Chiudi pannello" data-soon="Pannello amici">' +
              '<i class="bi bi-x-lg"></i>' +
            '</button>' +
          '</div>' +
        '</div>' +
        '<div class="friends-list p-2">' + items + '</div>' +
      '</aside>'
    );
  }

  function playerTemplate() {
    return (
      '<div class="player-bar" id="player-bar">' +
        '<div class="container-fluid d-none d-lg-block player-desktop">' +
          '<div class="row align-items-center g-0">' +
            '<div class="col-md-3">' +
              '<div class="now-playing">' +
                '<img src="img/cover_c.jpg" alt="" class="current-album-img">' +
                '<div class="track-info ms-2">' +
                  '<div class="track-name">Nessun brano</div>' +
                  '<div class="artist-name">Seleziona un brano</div>' +
                '</div>' +
                '<button type="button" class="btn btn-link text-white ms-2 like-btn" aria-label="Salva brano nei preferiti" aria-pressed="false">' +
                  '<i class="bi bi-heart"></i>' +
                '</button>' +
                '<button type="button" class="btn btn-link text-white add-to-playlist-btn" aria-label="Aggiungi a una playlist">' +
                  '<i class="bi bi-plus-circle"></i>' +
                '</button>' +
              '</div>' +
            '</div>' +

            '<div class="col-md-6">' +
              '<div class="player-controls text-center">' +
                '<div class="control-buttons">' +
                  '<button type="button" class="btn btn-link text-white shuffle-btn" aria-label="Riproduzione casuale" aria-pressed="false">' +
                    '<i class="bi bi-shuffle"></i>' +
                  '</button>' +
                  '<button type="button" class="btn btn-link text-white prev-btn" aria-label="Brano precedente">' +
                    '<i class="bi bi-skip-backward-fill"></i>' +
                  '</button>' +
                  '<button type="button" class="btn btn-link text-white play-btn" aria-label="Riproduci">' +
                    '<i class="bi bi-play-circle-fill"></i>' +
                  '</button>' +
                  '<button type="button" class="btn btn-link text-white next-btn" aria-label="Brano successivo">' +
                    '<i class="bi bi-skip-forward-fill"></i>' +
                  '</button>' +
                  '<button type="button" class="btn btn-link text-white repeat-btn" aria-label="Ripetizione disattivata" aria-pressed="false">' +
                    '<i class="bi bi-repeat"></i>' +
                  '</button>' +
                '</div>' +
                '<div class="progress-container">' +
                  '<div class="current-time">0:00</div>' +
                  '<div class="progress flex-grow-1 mx-2" role="slider" tabindex="0" aria-label="Avanzamento brano" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0">' +
                    '<div class="progress-bar" role="progressbar" style="width: 0%"></div>' +
                  '</div>' +
                  '<div class="total-time">0:00</div>' +
                '</div>' +
              '</div>' +
            '</div>' +

            '<div class="col-md-3">' +
              '<div class="volume-controls">' +
                '<button type="button" class="btn btn-link text-white volume-btn" aria-label="Disattiva audio">' +
                  '<i class="bi bi-volume-up-fill"></i>' +
                '</button>' +
                '<div class="progress volume-container mx-2" role="slider" tabindex="0" aria-label="Volume" aria-valuemin="0" aria-valuemax="100" aria-valuenow="70">' +
                  '<div class="progress-bar" role="progressbar" style="width: 70%"></div>' +
                '</div>' +
              '</div>' +
            '</div>' +
          '</div>' +
        '</div>' +

        '<div class="mobile-player d-lg-none">' +
          '<div class="mobile-progress" role="slider" tabindex="0" aria-label="Avanzamento brano" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0">' +
            '<div class="mobile-progress-bar" style="width: 0%"></div>' +
          '</div>' +
          '<div class="mobile-player-row">' +
            '<img src="img/cover_c.jpg" alt="" class="mobile-album-img">' +
            '<div class="mobile-track-info">' +
              '<div class="mobile-track-name">Nessun brano</div>' +
              '<div class="mobile-artist-name">Seleziona un brano</div>' +
            '</div>' +
            '<button type="button" class="btn btn-link text-white mobile-add-btn" aria-label="Aggiungi a una playlist">' +
              '<i class="bi bi-plus-circle"></i>' +
            '</button>' +
            '<button type="button" class="btn btn-link text-white like-btn mobile-like-btn" aria-label="Salva brano nei preferiti" aria-pressed="false">' +
              '<i class="bi bi-heart"></i>' +
            '</button>' +
            '<button type="button" class="btn btn-link text-white mobile-play-btn" aria-label="Riproduci">' +
              '<i class="bi bi-play-fill"></i>' +
            '</button>' +
            '<button type="button" class="btn btn-link text-white mobile-next-btn" aria-label="Brano successivo">' +
              '<i class="bi bi-skip-forward-fill"></i>' +
            '</button>' +
          '</div>' +
        '</div>' +

        '<nav class="mobile-nav d-lg-none" aria-label="Navigazione mobile">' +
          '<a class="mobile-nav-item" data-nav="home" href="index.html">' +
            '<i class="bi bi-house-door-fill"></i><span>Home</span>' +
          '</a>' +
          '<a class="mobile-nav-item" data-nav="search" href="search.html">' +
            '<i class="bi bi-search"></i><span>Cerca</span>' +
          '</a>' +
          '<a class="mobile-nav-item" data-nav="library" href="library.html">' +
            '<i class="bi bi-collection"></i><span>La tua libreria</span>' +
          '</a>' +
        '</nav>' +
      '</div>'
    );
  }

  function modalsTemplate() {
    return (
      '<div class="app-modal" id="create-playlist-modal" aria-hidden="true">' +
        '<div class="app-modal-backdrop" data-close-modal></div>' +
        '<div class="app-modal-panel" role="dialog" aria-modal="true" aria-labelledby="create-playlist-title">' +
          '<div class="app-modal-header">' +
            '<h2 id="create-playlist-title">Crea playlist</h2>' +
            '<button type="button" class="btn btn-link text-white" data-close-modal aria-label="Chiudi">' +
              '<i class="bi bi-x-lg"></i>' +
            '</button>' +
          '</div>' +
          '<form id="create-playlist-form">' +
            '<label for="create-playlist-name" class="form-label small text-white-50">Nome della playlist</label>' +
            '<input id="create-playlist-name" class="form-control" maxlength="80" required placeholder="La mia playlist" autocomplete="off">' +
            '<div class="app-modal-actions">' +
              '<button type="button" class="btn btn-dark" data-close-modal>Annulla</button>' +
              '<button type="submit" class="btn btn-success">Crea</button>' +
            '</div>' +
          '</form>' +
        '</div>' +
      '</div>' +

      '<div class="app-modal" id="add-to-playlist-modal" aria-hidden="true">' +
        '<div class="app-modal-backdrop" data-close-modal></div>' +
        '<div class="app-modal-panel" role="dialog" aria-modal="true" aria-labelledby="add-to-playlist-title">' +
          '<div class="app-modal-header">' +
            '<h2 id="add-to-playlist-title">Aggiungi a playlist</h2>' +
            '<button type="button" class="btn btn-link text-white" data-close-modal aria-label="Chiudi">' +
              '<i class="bi bi-x-lg"></i>' +
            '</button>' +
          '</div>' +
          '<p class="app-modal-subtitle" id="add-to-playlist-track"></p>' +
          '<div class="add-playlist-list" id="add-playlist-list"></div>' +
          '<button type="button" class="btn btn-outline-light w-100 mt-3" id="add-new-playlist">' +
            '<i class="bi bi-plus-lg"></i> Crea nuova playlist' +
          '</button>' +
        '</div>' +
      '</div>' +

      '<div class="app-modal" id="confirm-modal" aria-hidden="true">' +
        '<div class="app-modal-backdrop" data-close-modal></div>' +
        '<div class="app-modal-panel app-modal-small" role="dialog" aria-modal="true" aria-labelledby="confirm-title">' +
          '<div class="app-modal-header">' +
            '<h2 id="confirm-title">Confermi?</h2>' +
            '<button type="button" class="btn btn-link text-white" data-close-modal aria-label="Chiudi">' +
              '<i class="bi bi-x-lg"></i>' +
            '</button>' +
          '</div>' +
          '<p class="app-modal-subtitle" id="confirm-message"></p>' +
          '<div class="app-modal-actions">' +
            '<button type="button" class="btn btn-dark" data-close-modal>Annulla</button>' +
            '<button type="button" class="btn btn-danger" id="confirm-accept">Elimina</button>' +
          '</div>' +
        '</div>' +
      '</div>'
    );
  }

  // ---------------------------------------------------
  // MOUNT
  // ---------------------------------------------------

  function mount(id, html) {
    const placeholder = document.getElementById(id);
    if (!placeholder) return;
    placeholder.outerHTML = html;
  }

  function mountLayout() {
    mount('app-sidebar', sidebarTemplate());
    mount('app-header', headerTemplate());
    mount('app-friends', friendsTemplate());
    mount('app-player', playerTemplate());

    if (!document.querySelector('.app-toast')) {
      const toast = document.createElement('div');
      toast.className = 'app-toast';
      toast.setAttribute('role', 'status');
      toast.setAttribute('aria-live', 'polite');
      document.body.appendChild(toast);
    }

    document.body.insertAdjacentHTML('beforeend', modalsTemplate());
  }

  // ---------------------------------------------------
  // NAVIGAZIONE E PLAYLIST
  // ---------------------------------------------------

  function setActiveNavigation() {
    const page = document.body.getAttribute('data-page') || 'home';
    U.qsa('[data-nav]').forEach(function (link) {
      const isActive = link.getAttribute('data-nav') === page ||
        (page === 'playlist' && link.getAttribute('data-nav') === 'library');
      link.classList.toggle('active', isActive);
      if (isActive) {
        link.setAttribute('aria-current', 'page');
      } else {
        link.removeAttribute('aria-current');
      }
    });
  }

  function renderPlaylistNav() {
    const container = document.getElementById('sidebar-playlists');
    if (!container) return;

    const playlists = Library.getPlaylists();
    const currentPlaylistId = new URLSearchParams(window.location.search).get('id');
    const onPlaylistPage = pageIsPlaylist();

    container.innerHTML = playlists.map(function (playlist) {
      const count = (playlist.tracks || []).length;
      const isActive = onPlaylistPage && String(currentPlaylistId) === String(playlist.id);

      return (
        '<li class="nav-item">' +
          '<a class="nav-link playlist-item' + (isActive ? ' active' : '') + '"' +
            ' href="' + U.escapeHtml(U.pageUrl('playlist.html', { id: playlist.id })) + '"' +
            (isActive ? ' aria-current="page"' : '') + '>' +
            '<i class="bi ' + (count ? 'bi-music-note-beamed' : 'bi-music-note-list') + ' playlist-icon"></i>' +
            '<span class="playlist-name">' + U.escapeHtml(playlist.name) + '</span>' +
          '</a>' +
        '</li>'
      );
    }).join('') || '<li class="sidebar-empty">Nessuna playlist</li>';
  }

  function pageIsPlaylist() {
    return document.body.getAttribute('data-page') === 'playlist';
  }

  let toastTimer = null;

  function showToast(message) {
    const toast = document.querySelector('.app-toast');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      toast.classList.remove('show');
    }, 2600);
  }

  function initSearch() {
    const input = document.getElementById('sidebar-search-input');
    if (!input) return;

    input.addEventListener('keydown', function (event) {
      if (event.key !== 'Enter') return;
      const query = input.value.trim();
      if (!query) return;
      window.location.href = U.pageUrl('search.html', { search: query });
    });
  }

  function initNavigation() {
    const back = document.getElementById('history-back');
    const forward = document.getElementById('history-forward');

    if (back) back.addEventListener('click', function () { window.history.back(); });
    if (forward) forward.addEventListener('click', function () { window.history.forward(); });
  }

  function initSoonLinks() {
    document.addEventListener('click', function (event) {
      const trigger = event.target.closest('[data-soon]');
      if (!trigger) return;
      event.preventDefault();
      showToast(trigger.getAttribute('data-soon'));
    });
  }

  // ---------------------------------------------------
  // MODALI
  // ---------------------------------------------------

  function openModal(modal) {
    if (!modal) return;
    modal.classList.add('show');
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');

    const focusable = modal.querySelector('input, button');
    if (focusable) {
      setTimeout(function () { focusable.focus(); }, 60);
    }
  }

  function closeModal(modal) {
    if (!modal) return;
    modal.classList.remove('show');
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-open');
  }

  function closeAllModals() {
    pendingConfirm = null;
    U.qsa('.app-modal').forEach(closeModal);
  }

  function openCreatePlaylist(track) {
    pendingTrackForPlaylist = track || null;
    const modal = document.getElementById('create-playlist-modal');
    const input = document.getElementById('create-playlist-name');
    if (input) input.value = '';
    openModal(modal);
  }

  function openAddToPlaylist(track) {    if (!track) {
      showToast('Nessun brano in riproduzione');
      return;
    }

    pendingTrackForPlaylist = track;

    const modal = document.getElementById('add-to-playlist-modal');
    const label = document.getElementById('add-to-playlist-track');
    const list = document.getElementById('add-playlist-list');
    const playlists = Library.getPlaylists();

    if (label) {
      label.textContent = track.title + ' - ' + track.artist.name;
    }

    if (list) {
      list.innerHTML = playlists.map(function (playlist) {
        const contains = Library.getPlaylistsContaining(track).some(function (item) {
          return String(item.id) === String(playlist.id);
        });

        return (
          '<button type="button" class="add-playlist-item" data-playlist-id="' + U.escapeHtml(playlist.id) + '">' +
            '<span class="add-playlist-name">' + U.escapeHtml(playlist.name) + '</span>' +
            '<span class="add-playlist-meta">' +
              (contains ? '<i class="bi bi-check-lg"></i> Già presente' : (playlist.tracks || []).length + ' brani') +
            '</span>' +
          '</button>'
        );
      }).join('') || '<p class="text-white-50 small mb-0">Non hai ancora playlist. Creane una!</p>';
    }

    openModal(modal);
  }

  function openConfirm(message, onAccept, label) {
    const modal = document.getElementById('confirm-modal');
    const text = document.getElementById('confirm-message');
    const accept = document.getElementById('confirm-accept');
    if (text) text.textContent = message;
    if (accept) accept.textContent = label || 'Elimina';
    pendingConfirm = typeof onAccept === 'function' ? onAccept : null;
    openModal(modal);
  }

  function initModals() {
    const confirmAccept = document.getElementById('confirm-accept');
    if (confirmAccept) {
      confirmAccept.addEventListener('click', function () {
        const action = pendingConfirm;
        pendingConfirm = null;
        closeAllModals();
        if (action) action();
      });
    }

    // Apertura / chiusura.
    document.addEventListener('click', function (event) {
      if (event.target.closest('[data-close-modal]')) {
        closeAllModals();
        return;
      }

      const createTrigger = event.target.closest('#create-playlist-link, #create-playlist-link-2');
      if (createTrigger) {
        event.preventDefault();
        openCreatePlaylist(null);
        return;
      }

      if (event.target.closest('#add-new-playlist')) {
        event.preventDefault();
        const track = pendingTrackForPlaylist;
        closeAllModals();
        openCreatePlaylist(track);
      }
    });

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') closeAllModals();
    });

    // Form creazione playlist.
    const form = document.getElementById('create-playlist-form');
    if (form) {
      form.addEventListener('submit', function (event) {
        event.preventDefault();
        const input = document.getElementById('create-playlist-name');
        const playlist = Library.createPlaylist(input ? input.value : '');

        if (!playlist) {
          showToast('Inserisci un nome per la playlist');
          if (input) input.focus();
          return;
        }

        if (pendingTrackForPlaylist) {
          Library.addTrackToPlaylist(playlist.id, pendingTrackForPlaylist);
        }

        pendingTrackForPlaylist = null;
        closeAllModals();
        renderPlaylistNav();
        showToast('Playlist "' + playlist.name + '" creata');
      });
    }

    // Aggiunta a una playlist esistente.
    const addList = document.getElementById('add-playlist-list');
    if (addList) {
      addList.addEventListener('click', function (event) {
        const button = event.target.closest('[data-playlist-id]');
        if (!button || !pendingTrackForPlaylist) return;

        const playlistId = button.getAttribute('data-playlist-id');
        const added = Library.addTrackToPlaylist(playlistId, pendingTrackForPlaylist);
        const playlist = Library.getPlaylist(playlistId);

        if (added) {
          showToast('Aggiunto a "' + (playlist ? playlist.name : 'playlist') + '"');
          renderPlaylistNav();
          closeAllModals();
        } else {
          showToast('Il brano è già in questa playlist');
        }
      });
    }
  }

  // ---------------------------------------------------
  // AVVIO
  // ---------------------------------------------------

  mountLayout();
  setActiveNavigation();
  renderPlaylistNav();
  initSearch();
  initNavigation();
  initSoonLinks();
  initModals();

  document.addEventListener('library:changed', function (event) {
    if (!event.detail || event.detail.key === Library.KEYS.playlists) renderPlaylistNav();
  });

  window.AppLayout = {
    setActiveNavigation: setActiveNavigation,
    showToast: showToast,
    openCreatePlaylist: openCreatePlaylist,
    openAddToPlaylist: openAddToPlaylist,
    confirm: openConfirm,
    closeAllModals: closeAllModals
  };
})();
