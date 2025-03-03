document.addEventListener('DOMContentLoaded', function() {
  // Ottieni l'ID dell'album dall'URL
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

  // Setup per la funzionalità di ricerca
  setupSearch();
});

// Fetch album details from API
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

// Display album details in the UI
function displayAlbumDetails(album) {
  if (!album) {
    console.error("No album data available");
    return;
  }

  const albumDetailsContainer = document.getElementById('album-details-container');

  // Format the release date
  const releaseDate = new Date(album.release_date);
  const year = releaseDate.getFullYear();

  // Calculate total duration
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
      <button class="btn btn-success rounded-pill btn-play"><i class="bi bi-play-fill"></i> Play</button>
      <button class="btn btn-outline-light rounded-pill btn-save"><i class="bi bi-heart"></i> Salva</button>
      <button class="btn btn-link text-white"><i class="bi bi-three-dots"></i></button>
    </div>

    <div class="track-list">
      <div class="track-list-header">
        <div class="track-number">#</div>
        <div>TITOLO</div>
        <div class="track-duration"><i class="bi bi-clock"></i></div>
      </div>

      ${album.tracks.data.map((track, index) => {
        const minutes = Math.floor(track.duration / 60);
        const seconds = track.duration % 60;
        return `
          <div class="track-list-row">
            <div class="track-number">${index + 1}</div>
            <div class="track-title">${track.title}</div>
            <div class="track-artist">${track.artist.name}</div>
            <div class="track-duration">${minutes}:${seconds < 10 ? '0' + seconds : seconds}</div>
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

  // Update the player bar with the first track info
  if (album.tracks && album.tracks.data && album.tracks.data.length > 0) {
    updatePlayerBar(album.tracks.data[0], album);
  }
}

// Update the player bar with track information
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

// Setup della funzionalità di ricerca
function setupSearch() {
  const searchLink = document.getElementById('search-link');
  const searchBox = document.getElementById('search-box');
  const searchInput = document.getElementById('search-input');

  if (searchLink && searchBox && searchInput) {
    // Mostra/nascondi il campo di ricerca quando si clicca su "Cerca"
    searchLink.addEventListener('click', function(e) {
      e.preventDefault();
      if (searchBox.style.display === 'none' || searchBox.style.display === '') {
        searchBox.style.display = 'block';
        searchInput.focus();
      } else {
        searchBox.style.display = 'none';
      }
    });

    // Esegui la ricerca quando l'utente preme Invio nel campo di ricerca
    searchInput.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        const query = e.target.value.trim();
        if (query) {
          // Redirect alla homepage con parametro di ricerca
          window.location.href = `index.html?search=${encodeURIComponent(query)}`;
        }
      }
    });
  }
}

// Load player bar with a track when album page loads
document.addEventListener('DOMContentLoaded', function() {
  // Get album ID from URL
  const urlParams = new URLSearchParams(window.location.search);
  const albumId = urlParams.get('id');

  if (albumId) {
    fetchAlbumDetails(albumId);
    // Also load a random track in the player bar
    fetchPlayerBarTrack();
  } else {
    showError("Album ID not found in URL");
  }
});

// Fetch a random track for the player bar
function fetchPlayerBarTrack() {
  const popularArtists = ['Kendrick Lamar', 'Arctic Monkeys', 'Doja Cat', 'Post Malone', 'Mahmood', 'Maneskin'];
  const randomArtist = popularArtists[Math.floor(Math.random() * popularArtists.length)];
  const apiUrl = `https://striveschool-api.herokuapp.com/api/deezer/search?q=${randomArtist}&limit=1`;

  fetch(apiUrl)
    .then(response => {
      if (!response.ok) throw new Error('Network response was not ok');
      return response.json();
    })
    .then(data => {
      if (data.data && data.data.length > 0) {
        updatePlayerBar(data.data[0]);
      }
    })
    .catch(error => console.error('Error fetching track for player bar:', error));
}

//This function was already present in the original code.
function showError(message) {
    const errorContainer = document.getElementById('error-container');
    if (errorContainer) {
        errorContainer.textContent = message;
    } else {
        console.error('Error container not found:', message);
    }
}