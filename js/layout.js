// ===================================================
// LAYOUT CONDIVISO
// ===================================================
// Inietta sidebar, header, colonna amici e player bar
// in tutte le pagine, cosi' il markup e' in un solo posto.
// ===================================================

(function () {
  'use strict';

  const PLAYLISTS = [
    'early stage emily syndrome (sett-ott 2022)',
    'Be The Young',
    '"..." cit. Kimiko (lug-ago 2022)',
    'saggio vibes',
    'main character energy (mag-giu 2022)',
    'that fucking mood',
    'VEE, CARLOTTA E GIACOMO VANNO A BOSIO',
    'landing page (mar-apr 2022)',
    '2021 lol',
    'honey and glass (nov-dic 2021)',
    '(Revenge) Training Arc',
    'Lidia e Emily',
    'minecraft e nintendo switch (sep-oct 2021)',
    'Culo 2021',
    'Frah Quintale Mix',
    'Francesco Guccini Mix'
  ];

  const FRIENDS = [
    {
      name: 'Charlie Hookham',
      status: 'In ascolto - Your Autumn',
      extra: 'LESSERAFIM',
      time: '4 ore',
      avatar: 'https://images.pexels.com/photos/1987301/pexels-photo-1987301.jpeg?auto=compress&cs=tinysrgb&w=120&h=120&dpr=2'
    },
    {
      name: 'Juliet Huffaker',
      status: 'Ascolto da Kil Julio LaRive',
      extra: 'Asleep by Kil',
      time: '8 min',
      avatar: 'https://images.pexels.com/photos/388517/pexels-photo-388517.jpeg?auto=compress&cs=tinysrgb&w=120&h=120&dpr=2'
    },
    {
      name: 'Victoria Traverso',
      status: 'Now Rings - Dripping Wolf',
      extra: 'Town Bazaars (remix)',
      time: '3 giorni',
      avatar: 'https://images.pexels.com/photos/821414/pexels-photo-821414.jpeg?auto=compress&cs=tinysrgb&w=120&h=120&dpr=2'
    }
  ];

  // ---------------------------------------------------
  // TEMPLATE
  // ---------------------------------------------------

  function sidebarTemplate() {
    const playlists = PLAYLISTS.map(function (name) {
      return '<li class="nav-item"><a class="nav-link playlist-item" href="#" data-soon="Le playlist personali arriveranno presto">' +
        window.AppUtils.escapeHtml(name) + '</a></li>';
    }).join('');

    return (
      '<aside class="sidebar" id="app-sidebar" aria-label="Navigazione principale">' +
        '<div class="sidebar-content">' +
          '<div class="sidebar-top">' +
            '<a class="logo" href="index.html" aria-label="Home">' +
              '<i class="bi bi-spotify"></i><span>Spotify</span>' +
            '</a>' +
            '<button type="button" class="btn btn-link text-white sidebar-close d-lg-none" aria-label="Chiudi menu">' +
              '<i class="bi bi-x-lg"></i>' +
            '</button>' +
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
              '<a class="nav-link" href="#" data-soon="La tua libreria arriverà presto"><i class="bi bi-collection"></i> La tua libreria</a>' +
            '</li>' +
            '<li class="nav-item">' +
              '<a class="nav-link" href="#" data-soon="La creazione di playlist arriverà presto"><i class="bi bi-plus-square"></i> Crea playlist</a>' +
            '</li>' +
            '<li class="nav-item">' +
              '<a class="nav-link" href="#" data-soon="I brani che ti piacciono arriveranno presto"><i class="bi bi-heart-fill"></i> Brani che ti piacciono</a>' +
            '</li>' +
            '<li class="nav-item">' +
              '<a class="nav-link" href="#" data-soon="Gli episodi arriveranno presto"><i class="bi bi-bookmark-fill"></i> I tuoi episodi</a>' +
            '</li>' +
          '</ul>' +

          '<div class="sidebar-divider"></div>' +
          '<p class="sidebar-heading">Le tue playlist</p>' +
          '<ul class="nav flex-column playlist-list">' + playlists + '</ul>' +
        '</div>' +
      '</aside>'
    );
  }

  function headerTemplate() {
    return (
      '<header class="main-header">' +
        '<div class="header-left">' +
          '<button type="button" class="btn btn-dark btn-circle d-lg-none" id="sidebar-toggle" aria-label="Apri menu">' +
            '<i class="bi bi-list"></i>' +
          '</button>' +
          '<div class="nav-controls d-none d-lg-flex">' +
            '<button type="button" class="btn btn-dark btn-circle" id="history-back" aria-label="Indietro">' +
              '<i class="bi bi-chevron-left"></i>' +
            '</button>' +
            '<button type="button" class="btn btn-dark btn-circle" id="history-forward" aria-label="Avanti">' +
              '<i class="bi bi-chevron-right"></i>' +
            '</button>' +
          '</div>' +
        '</div>' +

        '<div class="header-right">' +
          '<button type="button" class="btn btn-dark btn-circle d-lg-none" id="mobile-search-shortcut" aria-label="Cerca">' +
            '<i class="bi bi-search"></i>' +
          '</button>' +
          '<div class="user-profile-container" role="button" tabindex="0" data-soon="Il profilo utente arriverà presto">' +
            '<span class="user-avatar user-initials" aria-hidden="true">LN</span>' +
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
            '<img src="' + window.AppUtils.escapeHtml(friend.avatar) + '" alt="" class="friend-avatar" loading="lazy">' +
            '<div class="ms-2 friend-text">' +
              '<p class="friend-name m-0 text-white">' + window.AppUtils.escapeHtml(friend.name) + '</p>' +
              '<p class="friend-status m-0 text-white-50 small">' + window.AppUtils.escapeHtml(friend.status) + '</p>' +
              '<p class="friend-extra m-0 text-white-50 small">' +
                '<i class="bi bi-music-note-beamed me-1"></i>' + window.AppUtils.escapeHtml(friend.extra) +
              '</p>' +
            '</div>' +
            '<div class="ms-auto text-white-50 small friend-time">' + window.AppUtils.escapeHtml(friend.time) + '</div>' +
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
          '<a class="mobile-nav-item" href="#" data-soon="La tua libreria arriverà presto">' +
            '<i class="bi bi-collection"></i><span>La tua libreria</span>' +
          '</a>' +
        '</nav>' +
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

    if (!document.querySelector('.sidebar-backdrop')) {
      const backdrop = document.createElement('div');
      backdrop.className = 'sidebar-backdrop';
      backdrop.setAttribute('aria-hidden', 'true');
      document.body.appendChild(backdrop);
    }

    if (!document.querySelector('.app-toast')) {
      const toast = document.createElement('div');
      toast.className = 'app-toast';
      toast.setAttribute('role', 'status');
      toast.setAttribute('aria-live', 'polite');
      document.body.appendChild(toast);
    }
  }

  // ---------------------------------------------------
  // COMPORTAMENTI GLOBALI
  // ---------------------------------------------------

  function setActiveNavigation() {
    const page = document.body.getAttribute('data-page') || 'home';
    window.AppUtils.qsa('[data-nav]').forEach(function (link) {
      const isActive = link.getAttribute('data-nav') === page;
      link.classList.toggle('active', isActive);
      if (isActive) {
        link.setAttribute('aria-current', 'page');
      } else {
        link.removeAttribute('aria-current');
      }
    });
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

  function closeSidebar() {
    const sidebar = document.querySelector('.sidebar');
    const backdrop = document.querySelector('.sidebar-backdrop');
    if (sidebar) sidebar.classList.remove('show');
    if (backdrop) backdrop.classList.remove('show');
    document.body.classList.remove('sidebar-open');
  }

  function openSidebar() {
    const sidebar = document.querySelector('.sidebar');
    const backdrop = document.querySelector('.sidebar-backdrop');
    if (sidebar) sidebar.classList.add('show');
    if (backdrop) backdrop.classList.add('show');
    document.body.classList.add('sidebar-open');
  }

  function initSidebar() {
    const toggle = document.getElementById('sidebar-toggle');
    const close = document.querySelector('.sidebar-close');
    const backdrop = document.querySelector('.sidebar-backdrop');

    if (toggle) {
      toggle.addEventListener('click', function () {
        const sidebar = document.querySelector('.sidebar');
        if (sidebar && sidebar.classList.contains('show')) {
          closeSidebar();
        } else {
          openSidebar();
        }
      });
    }

    if (close) close.addEventListener('click', closeSidebar);
    if (backdrop) backdrop.addEventListener('click', closeSidebar);

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') closeSidebar();
    });

    window.AppUtils.qsa('.sidebar a').forEach(function (link) {
      link.addEventListener('click', closeSidebar);
    });
  }

  function initSearch() {
    const input = document.getElementById('sidebar-search-input');
    if (!input) return;

    input.addEventListener('keydown', function (event) {
      if (event.key !== 'Enter') return;
      const query = input.value.trim();
      if (!query) return;
      window.location.href = window.AppUtils.pageUrl('search.html', { search: query });
    });
  }

  function initNavigation() {
    const back = document.getElementById('history-back');
    const forward = document.getElementById('history-forward');
    const mobileSearch = document.getElementById('mobile-search-shortcut');

    if (back) back.addEventListener('click', function () { window.history.back(); });
    if (forward) forward.addEventListener('click', function () { window.history.forward(); });
    if (mobileSearch) {
      mobileSearch.addEventListener('click', function () {
        window.location.href = 'search.html';
      });
    }
  }

  function initSoonLinks() {
    document.addEventListener('click', function (event) {
      const trigger = event.target.closest('[data-soon]');
      if (!trigger) return;
      event.preventDefault();
      showToast(trigger.getAttribute('data-soon'));
    });
  }

  mountLayout();
  setActiveNavigation();
  initSidebar();
  initSearch();
  initNavigation();
  initSoonLinks();

  window.AppLayout = {
    closeSidebar: closeSidebar,
    openSidebar: openSidebar,
    setActiveNavigation: setActiveNavigation,
    showToast: showToast
  };
})();
