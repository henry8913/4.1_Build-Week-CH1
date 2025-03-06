
document.addEventListener('DOMContentLoaded', function() {
  const urlParams = new URLSearchParams(window.location.search);
  const artistId = urlParams.get('id');

  if (artistId) {
    fetchArtistDetails(artistId);
  } else {
    showError('ID artista non specificato nell\'URL');
  }

  setupSearch();
  setupMobileSearch();
});

// ===================================================
// ARTIST DATA FETCHING
// ===================================================

function fetchArtistDetails(artistId) {
  const apiUrl = `https://striveschool-api.herokuapp.com/api/deezer/artist/${artistId}`;

  fetch(apiUrl)
    .then(response => {
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.json();
    })
    .then(data => {
      displayArtistDetails(data);
      fetchArtistTopTracks(artistId);
      fetchArtistAlbums(artistId);
    })
    .catch(error => {
      console.error('Error fetching artist details:', error);
      document.getElementById('artist-details-container').innerHTML = `
        <div class="alert alert-danger">
          Errore nel caricamento dei dettagli dell'artista: ${error.message}
        </div>
      `;
    });
}

function fetchArtistTopTracks(artistId) {
  const apiUrl = `https://striveschool-api.herokuapp.com/api/deezer/artist/${artistId}/top?limit=5`;

  fetch(apiUrl)
    .then(response => {
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.json();
    })
    .then(data => {
      displayArtistTopTracks(data.data);
    })
    .catch(error => {
      console.error('Error fetching artist top tracks:', error);
      document.getElementById('top-tracks-container').innerHTML = `
        <div class="alert alert-danger">
          Errore nel caricamento dei brani più popolari: ${error.message}
        </div>
      `;
    });
}

function fetchArtistAlbums(artistId) {
  const apiUrl = `https://striveschool-api.herokuapp.com/api/deezer/artist/${artistId}/albums`;

  fetch(apiUrl)
    .then(response => {
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.json();
    })
    .then(data => {
      displayArtistAlbums(data.data);
    })
    .catch(error => {
      console.error('Error fetching artist albums:', error);
      document.getElementById('discography-container').innerHTML = `
        <div class="alert alert-danger">
          Errore nel caricamento della discografia: ${error.message}
        </div>
      `;
    });
}

// ===================================================
// ARTIST UI RENDERING
// ===================================================

function displayArtistDetails(artist) {
  const artistDetailsContainer = document.getElementById('artist-details-container');

  artistDetailsContainer.innerHTML = `
    <div class="artist-header" style="background: linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.8)), url(${artist.picture_xl}) no-repeat center center; background-size: cover; padding: 200px 32px 32px 32px;">
      <div class="d-flex align-items-center">
        <img src="${artist.picture_medium}" alt="${artist.name}" class="rounded-circle me-3" width="80" height="80">
        <div>
          <h1 class="display-4 fw-bold">${artist.name}</h1>
          <p class="mb-0">${artist.nb_fan.toLocaleString()} ascoltatori mensili</p>
        </div>
      </div>
    </div>

    <div class="artist-actions p-4">
      <button class="btn btn-success rounded-pill btn-play me-2"><i class="bi bi-play-fill"></i> Play</button>
      <button class="btn btn-outline-light rounded-pill btn-follow me-2">Segui</button>
      <button class="btn btn-link text-white"><i class="bi bi-three-dots"></i></button>
    </div>

    <div class="popular-tracks mt-4">
      <h3 class="mb-4">Brani popolari</h3>
      <div id="top-tracks-container">
        <div class="d-flex justify-content-center">
          <div class="spinner-border text-light" role="status">
            <span class="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    </div>

    <div class="discography mt-5">
      <div class="d-flex justify-content-between align-items-center mb-4">
        <h3>Discografia</h3>
        <a href="#" class="see-more-link">Mostra altro</a>
      </div>
      <div id="discography-container" class="row">
        <div class="d-flex justify-content-center">
          <div class="spinner-border text-light" role="status">
            <span class="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    </div>

    <div class="artist-footer p-4 mt-5">
      <p class="text-white-50 small">© ${artist.name} - Tutti i diritti riservati</p>
    </div>
  `;

  updatePlayerBar(artist);
}

function displayArtistTopTracks(tracks) {
  const topTracksContainer = document.getElementById('top-tracks-container');

  if (!tracks || tracks.length === 0) {
    topTracksContainer.innerHTML = `<p>Nessun brano disponibile.</p>`;
    return;
  }

  let tracksHTML = '';

  tracks.forEach((track, index) => {
    const minutes = Math.floor(track.duration / 60);
    const seconds = track.duration % 60;

    tracksHTML += `
      <div class="popular-track">
        <div class="popular-track-number">${index + 1}</div>
        <div class="popular-track-info">
          <img src="${track.album.cover_small}" alt="${track.album.title}" class="popular-track-img">
          <div>
            <div class="popular-track-title">${track.title}</div>
          </div>
        </div>
        <div class="popular-track-streams d-none d-md-block">${Math.floor(Math.random() * 1000000).toLocaleString()} riproduzioni</div>
        <div class="popular-track-duration">${minutes}:${seconds < 10 ? '0' + seconds : seconds}</div>
      </div>
    `;
  });

  topTracksContainer.innerHTML = tracksHTML;
}

function displayArtistAlbums(albums) {
  const discographyContainer = document.getElementById('discography-container');

  if (!albums || albums.length === 0) {
    discographyContainer.innerHTML = `<p>Nessun album disponibile.</p>`;
    return;
  }

  const uniqueAlbums = Array.from(new Map(albums.map(album => [album.title, album])).values());

  let albumsHTML = '';

  uniqueAlbums.slice(0, 6).forEach(album => {
    albumsHTML += `
      <div class="col-6 col-md-4 col-lg-2 mb-4">
        <div class="card album-card" data-album-id="${album.id}">
          <img src="${album.cover_medium}" class="card-img-top" alt="${album.title}">
          <div class="play-hover">
            <i class="bi bi-play-fill"></i>
          </div>
          <div class="card-body p-2">
            <h5 class="card-title text-truncate">${album.title}</h5>
            <p class="card-text text-truncate">${album.release_date.substring(0, 4)}</p>
          </div>
        </div>
      </div>
    `;
  });

  discographyContainer.innerHTML = albumsHTML;

  document.querySelectorAll('.album-card').forEach(card => {
    card.addEventListener('click', function() {
      window.location.href = `album.html?id=${this.dataset.albumId}`;
    });
  });
}

// ===================================================
// PLAYER BAR UPDATES
// ===================================================

function updatePlayerBar(artist) {
  const currentAlbumImg = document.querySelector('.current-album-img');
  const trackNameElement = document.querySelector('.track-name');
  const artistNameElement = document.querySelector('.artist-name');

  if (currentAlbumImg) currentAlbumImg.src = artist.picture_small;
  if (trackNameElement) trackNameElement.textContent = "Brani popolari";
  if (artistNameElement) {
    artistNameElement.innerHTML = `
      <a href="artist.html?id=${artist.id}" class="text-white-50">${artist.name}</a>
    `;
  }
}

// ===================================================
// SEARCH FUNCTIONALITY
// ===================================================

function setupSearch() {
  const searchLink = document.getElementById('search-link');
  const searchBox = document.getElementById('search-box');
  const searchInput = document.getElementById('search-input');

  if (searchLink && searchBox && searchInput) {
    searchLink.addEventListener('click', function(e) {
      e.preventDefault();
      if (searchBox.style.display === 'none' || searchBox.style.display === '') {
        searchBox.style.display = 'block';
        searchInput.focus();
      } else {
        searchBox.style.display = 'none';
      }
    });

    searchInput.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        const query = e.target.value.trim();
        if (query) {
          window.location.href = `index.html?search=${encodeURIComponent(query)}`;
        }
      }
    });
  }
}

function setupMobileSearch() {
  const mobileSearchLink = document.getElementById('mobile-search-link');
  const mobileSearchBox = document.getElementById('mobile-search-box');
  const mobileSearchInput = document.getElementById('mobile-search-input');
  const mobileSearchButton = document.getElementById('mobile-search-button');

  if (mobileSearchLink && mobileSearchBox && mobileSearchInput) {
    if (window.innerWidth < 992) {
      mobileSearchLink.addEventListener('click', function(e) {
        e.preventDefault();
        window.location.href = 'search.html';
      });
    } else {
      mobileSearchLink.addEventListener('click', function(e) {
        e.preventDefault();
        if (mobileSearchBox.style.display === 'none' || mobileSearchBox.style.display === '') {
          mobileSearchBox.style.display = 'block';
          mobileSearchInput.focus();
        } else {
          mobileSearchBox.style.display = 'none';
        }
      });
    }

    mobileSearchInput.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        const query = e.target.value.trim();
        if (query) {
          if (window.innerWidth < 992) {
            window.location.href = `search.html?search=${encodeURIComponent(query)}`;
          } else {
            window.location.href = `index.html?search=${encodeURIComponent(query)}`;
          }
        }
      }
    });

    if (mobileSearchButton) {
      mobileSearchButton.addEventListener('click', function() {
        const query = mobileSearchInput.value.trim();
        if (query) {
          if (window.innerWidth < 992) {
            window.location.href = `search.html?search=${encodeURIComponent(query)}`;
          } else {
            window.location.href = `index.html?search=${encodeURIComponent(query)}`;
          }
        }
      });
    }
  }
}

// ===================================================
// INITIALIZATION
// ===================================================

document.addEventListener('DOMContentLoaded', function() {
  const urlParams = new URLSearchParams(window.location.search);
  const artistId = urlParams.get('id');

  if (artistId) {
    fetchArtistDetails(artistId);
    fetchPlayerBarTrack();
  } else {
    showError("Artist ID not found in URL");
  }
});

// ===================================================
// UTILITY FUNCTIONS
// ===================================================

function updatePageTitle(artistName) {
  document.title = `${artistName} - Spotify Clone`;
}

function formatNumber(num) {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

function showError(message) {
    console.error(message);
}
