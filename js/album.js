// ===================================================
// INITIALIZATION AND EVENT LISTENERS
// ===================================================
document.addEventListener('DOMContentLoaded', function() {
  const urlParams = new URLSearchParams(window.location.search);
  const albumId = urlParams.get('id');

  if (albumId) {
    fetchAlbumDetails(albumId);
  } else {
    document.getElementById('album-details-container').innerHTML = `
      <div class="alert alert-danger">
        Nessun ID album specificato nell'URL.
      </div>
    `;
  }

  setupSearch();
});

// ===================================================
// ALBUM DATA FETCHING
// ===================================================

function fetchAlbumDetails(albumId) {
  const apiUrl = `https://striveschool-api.herokuapp.com/api/deezer/album/${albumId}`;

  fetch(apiUrl)
    .then(response => {
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.json();
    })
    .then(data => {
      displayAlbumDetails(data);
    })
    .catch(error => {
      console.error('Error fetching album details:', error);
      document.getElementById('album-details-container').innerHTML = `
        <div class="alert alert-danger">
          Errore nel caricamento dei dettagli dell'album: ${error.message}
        </div>
      `;
    });
}

// ===================================================
// ALBUM UI RENDERING
// ===================================================

function displayAlbumDetails(album) {
  if (!album) {
    console.error("No album data available");
    return;
  }

  const albumDetailsContainer = document.getElementById('album-details-container');

  const releaseDate = new Date(album.release_date);
  const year = releaseDate.getFullYear();

  const totalDurationSeconds = album.tracks.data.reduce((acc, track) => acc + track.duration, 0);
  const totalMinutes = Math.floor(totalDurationSeconds / 60);
  const totalSeconds = totalDurationSeconds % 60;

  albumDetailsContainer.innerHTML = `
    <div class="album-header">
      <img src="${album.cover_medium}" alt="${album.title}" class="album-cover-lg">
      <div class="album-info">
        <div class="album-type">ALBUM</div>
        <h1 class="album-title">${album.title}</h1>
        <div class="album-details">
          <img src="${album.artist.picture_small}" alt="${album.artist.name}" class="rounded-circle me-2" width="24" height="24">
          <span><a href="artist.html?id=${album.artist.id}" class="text-white text-decoration-none">${album.artist.name}</a> • ${year} • ${album.tracks.data.length} brani, ${totalMinutes}:${totalSeconds < 10 ? '0' + totalSeconds : totalSeconds}</span>
        </div>
      </div>
    </div>

    <div class="album-actions p-4">
      <button class="btn btn-success rounded-pill btn-play" id="album-play-btn"><i class="bi bi-play-fill"></i> Play</button>
      <button class="btn btn-outline-light rounded-pill btn-save"><i class="bi bi-heart"></i> Salva</button>
      <button class="btn btn-link text-white"><i class="bi bi-three-dots"></i></button>
    </div>

    <div class="track-list">
      <div class="track-list-header">
        <div class="track-number">#</div>
        <div>TITOLO</div>
        <div class="track-duration d-none d-sm-block"><i class="bi bi-clock"></i></div>
      </div>

      ${album.tracks.data.map((track, index) => {
        const minutes = Math.floor(track.duration / 60);
        const seconds = track.duration % 60;
        return `
          <div class="track-list-row" data-preview-url="${track.preview}" data-track-id="${track.id}">
            <div class="track-number">${index + 1}</div>
            <div class="track-title">${track.title}</div>
            <div class="track-artist">${track.artist.name}</div>
            <div class="track-duration d-none d-sm-block">${minutes}:${seconds < 10 ? '0' + seconds : seconds}</div>
          </div>
        `;
      }).join('')}
    </div>

    <div class="album-footer p-4">
      <div class="release-date">
        <p class="text-white-50 small">${releaseDate.toLocaleDateString()}</p>
      </div>
      <div class="copyright">
        <p class="text-white-50 small">${album.copyright}</p>
      </div>
    </div>
  `;

  const albumPlayBtn = document.getElementById('album-play-btn');
  if (albumPlayBtn && window.musicPlayer) {
    albumPlayBtn.addEventListener('click', function() {
      const firstTrack = album.tracks.data[0];
      if (firstTrack && firstTrack.preview) {
        const playlist = album.tracks.data.map(track => {
          return {
            title: track.title,
            preview: track.preview,
            artist: {
              name: track.artist.name,
              id: track.artist.id
            },
            album: {
              cover_small: album.cover_small
            },
            duration: track.duration
          };
        });
        
        window.musicPlayer.setPlaylist(playlist);
        
        const trackInfo = {
          title: firstTrack.title,
          artist: {
            name: firstTrack.artist.name,
            id: firstTrack.artist.id
          },
          album: {
            cover_small: album.cover_small
          },
          duration: firstTrack.duration
        };
        window.musicPlayer.play(firstTrack.preview, trackInfo);

        const icon = this.querySelector('i');
        if (icon && icon.classList.contains('bi-play-fill')) {
          icon.classList.remove('bi-play-fill');
          icon.classList.add('bi-pause-fill');
        }
        
        if (window.musicPlayer) {
          const audioPlayer = document.querySelector('audio');
          if (audioPlayer) {
            audioPlayer.addEventListener('ended', function() {
              window.musicPlayer.playNext();
            });
          }
        }
      }
    });
  }

  document.querySelectorAll('.track-list-row').forEach((row, index) => {
    row.addEventListener('click', function() {
      const trackId = this.dataset.trackId;
      const previewUrl = this.dataset.previewUrl;
      if (previewUrl && window.musicPlayer) {
        const playlist = album.tracks.data.map(track => {
          return {
            title: track.title,
            preview: track.preview,
            artist: {
              name: track.artist.name,
              id: track.artist.id
            },
            album: {
              cover_small: album.cover_small
            },
            duration: track.duration
          };
        });
        
        window.musicPlayer.setPlaylist(playlist);
        
        const track = album.tracks.data[index];
        const trackInfo = {
          title: track.title,
          artist: {
            name: track.artist.name,
            id: track.artist.id
          },
          album: {
            cover_small: album.cover_small
          },
          duration: track.duration
        };
        window.musicPlayer.play(previewUrl, trackInfo);
      }
    });

    row.style.cursor = 'pointer';
  });
}

// ===================================================
// PLAYER BAR UPDATES
// ===================================================

function updatePlayerBar(track, album) {
  const currentAlbumImg = document.querySelector('.current-album-img');
  const trackNameElement = document.querySelector('.track-name');
  const artistNameElement = document.querySelector('.artist-name');

  if (currentAlbumImg) currentAlbumImg.src = album.cover_small;
  if (trackNameElement) trackNameElement.textContent = track.title;
  if (artistNameElement) {
    artistNameElement.innerHTML = `
      <a href="artist.html?id=${track.artist.id}" class="text-white-50">${track.artist.name}</a>
    `;
  }

  const totalTimeElement = document.querySelector('.total-time');
  if (totalTimeElement && track.duration) {
    const minutes = Math.floor(track.duration / 60);
    const seconds = track.duration % 60;
    totalTimeElement.textContent = `${minutes}:${seconds < 10 ? '0' + seconds : seconds}`;
  }
}

// ===================================================
// SEARCH FUNCTIONALITY
// ===================================================

function setupSearch() {
  const searchLink = document.getElementById('search-link');
  const searchBox = document.getElementById('search-box');
  const searchInput = document.getElementById('search-input');

  const mobileSearchLink = document.getElementById('mobile-search-link');
  const mobileSearchBox = document.getElementById('mobile-search-box');
  const mobileSearchInput = document.getElementById('mobile-search-input');
  const mobileSearchButton = document.getElementById('mobile-search-button');

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
  const albumId = urlParams.get('id');

  if (albumId) {
    fetchAlbumDetails(albumId);
    fetchPlayerBarTrack();
  } else {
    showError("Album ID not found in URL");
  }
});

// ===================================================
// UTILITY FUNCTIONS
// ===================================================

function showError(message) {
    const errorContainer = document.getElementById('error-container');
    if (errorContainer) {
        errorContainer.textContent = message;
    } else {
        console.error('Error container not found:', message);
    }
}