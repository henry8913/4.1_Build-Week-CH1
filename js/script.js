document.addEventListener('DOMContentLoaded', function() {
  // Carica album e artisti diversi per le varie sezioni
  fetchFeaturedAlbum();
  fetchRecentlyPlayed();
  fetchAlbums('rock');
  fetchTrendingMusic();
  fetchPlayerBarTrack(); // Carica un brano casuale nella playerbar
  
  // Setup per la funzionalità di ricerca
  setupSearch();
  
  // Add click event for play buttons and recently played cards
  document.addEventListener('click', function(e) {
    // Per i bottoni play negli album
    if (e.target.closest('.play-hover')) {
      e.preventDefault();
      const albumElement = e.target.closest('.album-card');
      if (albumElement && albumElement.dataset.albumId) {
        loadAlbumDetails(albumElement.dataset.albumId);
      }
    }

    // Per le card nella sezione "Buonasera"
    if (e.target.closest('.recent-card')) {
      e.preventDefault();
      const recentCard = e.target.closest('.recent-card');
      if (recentCard && recentCard.dataset.albumId) {
        loadAlbumDetails(recentCard.dataset.albumId);
      }
    }
  });
});

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
          // Se siamo in homepage, aggiorna l'UI con i risultati
          if (window.location.pathname.includes('index.html') || window.location.pathname === '/' || window.location.pathname === '') {
            // Rimuovi l'album in evidenza
            const contentArea = document.getElementById('content-area');
            if (contentArea) {
              // Crea una nuova struttura per i risultati di ricerca
              let searchResultsHTML = `
                <div class="row mb-4">
                  <div class="col-12">
                    <h2 class="text-white">Risultati per "${query}"</h2>
                  </div>
                </div>
                <div class="row" id="search-results">
                  <!-- I risultati verranno caricati qui -->
                </div>
              `;
              
              // Sostituisci tutto il contenuto con la nuova struttura
              contentArea.innerHTML = searchResultsHTML;
              
              // Esegui la ricerca
              searchAlbumsInContent(query);
            }
          } else {
            // Se siamo in altre pagine, redirect alla homepage con parametro di ricerca
            window.location.href = `index.html?search=${encodeURIComponent(query)}`;
          }
        }
      }
    });
    
    // Controlla se c'è un parametro di ricerca nell'URL (per quando si viene reindirizzati)
    const urlParams = new URLSearchParams(window.location.search);
    const searchQuery = urlParams.get('search');
    if (searchQuery) {
      searchInput.value = searchQuery;
      searchBox.style.display = 'block';
      
      // Rimuovi l'album in evidenza e mostra i risultati di ricerca
      const contentArea = document.getElementById('content-area');
      if (contentArea) {
        // Crea una nuova struttura per i risultati di ricerca
        let searchResultsHTML = `
          <div class="row mb-4">
            <div class="col-12">
              <h2 class="text-white">Risultati per "${searchQuery}"</h2>
            </div>
          </div>
          <div class="row" id="search-results">
            <!-- I risultati verranno caricati qui -->
          </div>
        `;
        
        // Sostituisci tutto il contenuto con la nuova struttura
        contentArea.innerHTML = searchResultsHTML;
        
        // Esegui la ricerca
        searchAlbumsInContent(searchQuery);
      }
    }
  }
}

// Fetch recently played (Buonasera section)
function fetchRecentlyPlayed() {
  // Array di artisti diversi per la sezione "Buonasera"
  const artists = ['eminem', 'taylor swift', 'ed sheeran', 'billie eilish', 'coldplay', 'daft punk'];

  // Sceglie un artista casuale dall'array
  const randomArtist = artists[Math.floor(Math.random() * artists.length)];
  const apiUrl = `https://striveschool-api.herokuapp.com/api/deezer/search?q=${randomArtist}&limit=6`;

  fetch(apiUrl)
    .then(response => {
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.json();
    })
    .then(data => {
      displayRecentlyPlayed(data.data);
    })
    .catch(error => {
      console.error('Error fetching recently played:', error);
      const recentCards = document.querySelectorAll('.recent-card .card-body');
      recentCards.forEach(card => {
        card.innerHTML = `
          <div class="alert alert-danger">
            Errore nel caricamento: ${error.message}
          </div>
        `;
      });
    });
}

// Display recently played items in the "Buonasera" section
function displayRecentlyPlayed(items) {
  const recentCards = document.querySelectorAll('.recent-card .card-body');

  // Display up to 6 items (assuming we have 6 cards in the UI)
  const itemsToShow = Math.min(items.length, recentCards.length);

  for (let i = 0; i < itemsToShow; i++) {
    const item = items[i];
    if(item && item.album && item.album.cover_small && item.title && item.artist && item.artist.name){
        recentCards[i].innerHTML = `
          <img src="${item.album.cover_small}" class="recent-album-img" alt="${item.album.title}">
          <div class="ms-3 overflow-hidden">
            <span class="d-block text-truncate fw-bold">${item.title}</span>
            <span class="d-block text-truncate small text-white-50">${item.artist.name}</span>
          </div>
        `;
        // Add dataset attributes for click handling
        recentCards[i].closest('.recent-card').dataset.albumId = item.album.id;
    } else {
        console.error("Missing data in recently played item:", item);
        recentCards[i].innerHTML = "<p>Data not available</p>";
    }
  }
}

// Fetch albums from API for "Altro di ciò che ti piace" section
function fetchAlbums(query) {
  const apiUrl = `https://striveschool-api.herokuapp.com/api/deezer/search?q=${query}`;

  fetch(apiUrl)
    .then(response => {
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.json();
    })
    .then(data => {
      displayAlbums(data.data);
    })
    .catch(error => {
      console.error('Error fetching albums:', error);
      const albumListElement = document.getElementById('album-list');
      if (albumListElement) {
        albumListElement.innerHTML = `
          <div class="col-12">
            <div class="alert alert-danger">
              Errore nel caricamento degli album: ${error.message}
            </div>
          </div>
        `;
      }
    });
}

// Fetch trending music for "In tendenza" section
function fetchTrendingMusic() {
  // Array di generi diversi per la sezione "In tendenza"
  const genres = ['pop', 'rap', 'electronic', 'indie', 'metal'];

  // Sceglie un genere casuale dall'array
  const randomGenre = genres[Math.floor(Math.random() * genres.length)];
  const apiUrl = `https://striveschool-api.herokuapp.com/api/deezer/search?q=${randomGenre}&limit=5`;

  fetch(apiUrl)
    .then(response => {
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.json();
    })
    .then(data => {
      displayTrendingMusic(data.data);
    })
    .catch(error => {
      console.error('Error fetching trending music:', error);
      const trendingContainer = document.getElementById('trending-container');
      if (trendingContainer) {
        trendingContainer.innerHTML = `
          <div class="col-12">
            <div class="alert alert-danger">
              Errore nel caricamento dei brani in tendenza: ${error.message}
            </div>
          </div>
        `;
      }
    });
}


// Display trending music in the "In tendenza" section
function displayTrendingMusic(items) {
  const trendingCards = document.querySelectorAll('.album-card');

  // Mostra fino a 5 items (assumendo che ci siano almeno 5 cards nell'UI)
  const itemsToShow = Math.min(items.length, trendingCards.length);

  for (let i = 0; i < itemsToShow; i++) {
    const item = items[i];
    const card = trendingCards[i];
    if(item && item.album && item.album.cover_medium && item.artist && item.artist.name && card){
        const imgElement = card.querySelector('.card-img-top');
        const titleElement = card.querySelector('.card-title');
        const textElement = card.querySelector('.card-text');

        if (imgElement) imgElement.src = item.album.cover_medium;
        if (imgElement) imgElement.alt = item.album.title;
        if (titleElement) titleElement.textContent = item.album.title;
        if (textElement) textElement.innerHTML = `
          <a href="artist.html?id=${item.artist.id}" class="text-light text-decoration-none">${item.artist.name}</a>
        `;

        card.dataset.albumId = item.album.id;
    } else {
        console.error("Missing data in trending music item:", item);
        if(card) card.innerHTML = "<p>Data not available</p>";
    }
  }
}

// Fetch featured album for the top section
function fetchFeaturedAlbum() {
  // Array di artisti famosi per selezionare un album in evidenza casuale
  const featuredArtists = ['Fedez', 'Salmo', 'Dua Lipa', 'The Weeknd', 'Adele', 'Drake', 'Bruno Mars', 'Lady Gaga'];
  
  // Sceglie un artista casuale dall'array
  const randomArtist = featuredArtists[Math.floor(Math.random() * featuredArtists.length)];
  const apiUrl = `https://striveschool-api.herokuapp.com/api/deezer/search?q=${randomArtist}&limit=1`;
  
  fetch(apiUrl)
    .then(response => {
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.json();
    })
    .then(data => {
      if (data.data && data.data.length > 0) {
        displayFeaturedAlbum(data.data[0]);
      } else {
        throw new Error('No featured album data available');
      }
    })
    .catch(error => {
      console.error('Error fetching featured album:', error);
      const featuredAlbumElement = document.getElementById('featured-album');
      if (featuredAlbumElement) {
        featuredAlbumElement.innerHTML = `
          <div class="alert alert-danger">
            Errore nel caricamento dell'album in evidenza: ${error.message}
          </div>
        `;
      }
    });
}

// Display featured album in the top section
function displayFeaturedAlbum(item) {
  if (!item || !item.album || !item.artist) {
    console.error("Missing data in featured album item:", item);
    return;
  }
  
  // Recupera gli elementi necessari
  const featuredAlbumImg = document.getElementById('featured-album-img');
  const featuredAlbumTitle = document.getElementById('featured-album-title');
  const featuredAlbumArtist = document.getElementById('featured-album-artist');
  const featuredAlbumDescription = document.getElementById('featured-album-description');
  
  // Aggiorna il contenuto con i dati dell'API
  if (featuredAlbumImg) featuredAlbumImg.src = item.album.cover_big || item.album.cover_medium || item.album.cover_small;
  if (featuredAlbumTitle) featuredAlbumTitle.textContent = item.title || item.album.title;
  
  // Crea un link all'artista
  if (featuredAlbumArtist) {
    featuredAlbumArtist.innerHTML = `
      <a href="artist.html?id=${item.artist.id}" class="text-light text-decoration-none">${item.artist.name}</a>
    `;
  }
  
  // Aggiorna la descrizione
  if (featuredAlbumDescription) {
    featuredAlbumDescription.textContent = `Ascolta il nuovo singolo di ${item.artist.name}!`;
  }
  
  // Aggiorna lo sfondo con un effetto gradiente sopra la copertina dell'album
  const featuredAlbumBg = document.querySelector('.featured-album-bg');
  if (featuredAlbumBg) {
    featuredAlbumBg.style.backgroundImage = `
      linear-gradient(0deg, rgba(18, 18, 18, 1) 0%, rgba(18, 18, 18, 0.8) 50%, rgba(18, 18, 18, 0.4) 100%),
      url(${item.album.cover_big || item.album.cover_medium})
    `;
    featuredAlbumBg.style.backgroundSize = 'cover';
    featuredAlbumBg.style.backgroundPosition = 'center';
  }
}

// Display albums in the UI for "Altro di ciò che ti piace" section
function displayAlbums(albums) {
  const albumListElement = document.getElementById('album-list');
  if (!albumListElement) {
    console.error('album-list element not found');
    return;
  }

  albumListElement.innerHTML = '';

  // Create a Set to track unique album IDs
  const uniqueAlbumIds = new Set();
  const uniqueAlbums = [];

  // Filter out duplicate albums
  albums.forEach(item => {
    if (item && item.album && item.album.id && item.artist && item.artist.id && !uniqueAlbumIds.has(item.album.id)) {
      uniqueAlbumIds.add(item.album.id);
      uniqueAlbums.push(item);
    } else {
        console.error("Missing data in album item:",item);
    }
  });

  // Display up to 12 unique albums
  uniqueAlbums.slice(0, 12).forEach(item => {
    const albumElement = document.createElement('div');
    albumElement.className = 'col-6 col-sm-4 col-md-3 col-lg-2';
    albumElement.innerHTML = `
      <div class="card album-card position-relative" data-album-id="${item.album.id}">
        <img src="${item.album.cover_medium}" class="card-img-top" alt="${item.album.title}">
        <div class="play-hover">
          <i class="bi bi-play-fill"></i>
        </div>
        <div class="card-body p-2">
          <h5 class="card-title text-truncate">${item.album.title}</h5>
          <p class="card-text text-truncate">
            <a href="artist.html?id=${item.artist.id}" class="text-light text-decoration-none">${item.artist.name}</a>
          </p>
        </div>
      </div>
    `;
    albumListElement.appendChild(albumElement);
  });
}

// Load artist details
function loadArtistDetails(artistId) {
  // This would fetch artist details and display artist page
  console.log('Loading artist details for ID:', artistId);
  // Implement this function for the artist page
}

// Load album details - redirect to album.html page
function loadAlbumDetails(albumId) {
  window.location.href = `album.html?id=${albumId}`;
}

// Load artist details - redirect to artist.html page
function loadArtistDetails(artistId) {
  window.location.href = `artist.html?id=${artistId}`;
}

// Function to search for albums
function searchAlbums(query) {
  if (query && query.trim() !== '') {
    fetchAlbums(query);
  }
}

// Add this to implement search functionality later
document.addEventListener('DOMContentLoaded', function() {
  // Add search functionality when you create a search input
  const searchInput = document.querySelector('.search-input');
  if (searchInput) {
    searchInput.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        searchAlbums(e.target.value);
      }
    });
  }
});

// Fetch a random track for the player bar
function fetchPlayerBarTrack() {
  // Array di artisti popolari per selezionare un brano casuale per la player bar
  const popularArtists = ['Kendrick Lamar', 'Arctic Monkeys', 'Doja Cat', 'Post Malone', 'Mahmood', 'Maneskin', 'Blanco', 'Elisa'];
  
  // Sceglie un artista casuale dall'array
  const randomArtist = popularArtists[Math.floor(Math.random() * popularArtists.length)];
  const apiUrl = `https://striveschool-api.herokuapp.com/api/deezer/search?q=${randomArtist}&limit=1`;
  
  fetch(apiUrl)
    .then(response => {
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.json();
    })
    .then(data => {
      if (data.data && data.data.length > 0) {
        updatePlayerBar(data.data[0]);
      } else {
        throw new Error('No track data available for player bar');
      }
    })
    .catch(error => {
      console.error('Error fetching track for player bar:', error);
    });
}

// Update the player bar with track information
function updatePlayerBar(track) {
  if (!track || !track.album || !track.artist) {
    console.error("Missing data in track item:", track);
    return;
  }
  
  // Recupera gli elementi del player bar
  const currentAlbumImg = document.querySelector('.current-album-img');
  const trackNameElement = document.querySelector('.track-name');
  const artistNameElement = document.querySelector('.artist-name');
  
  // Aggiorna con i dati dell'API
  if (currentAlbumImg) currentAlbumImg.src = track.album.cover_small || 'https://via.placeholder.com/56';
  if (trackNameElement) trackNameElement.textContent = track.title;
  if (artistNameElement) {
    artistNameElement.innerHTML = `
      <a href="artist.html?id=${track.artist.id}" class="text-white-50">${track.artist.name}</a>
    `;
  }
  
  // Aggiorna anche il tempo totale (opzionale, se disponibile nell'API)
  const totalTimeElement = document.querySelector('.total-time');
  if (totalTimeElement && track.duration) {
    const minutes = Math.floor(track.duration / 60);
    const seconds = track.duration % 60;
    totalTimeElement.textContent = `${minutes}:${seconds < 10 ? '0' + seconds : seconds}`;
  }
}


// Function to search for albums and display in content area
function searchAlbumsInContent(query) {
  if (!query || query.trim() === '') return;
  
  const apiUrl = `https://striveschool-api.herokuapp.com/api/deezer/search?q=${encodeURIComponent(query)}`;
  
  // Mostra un indicatore di caricamento
  const searchResults = document.getElementById('search-results');
  if (searchResults) {
    searchResults.innerHTML = `<div class="col-12 text-center"><div class="spinner-border text-light" role="status"><span class="visually-hidden">Loading...</span></div></div>`;
  }
  
  fetch(apiUrl)
    .then(response => {
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.json();
    })
    .then(data => {
      displaySearchResults(data.data);
    })
    .catch(error => {
      console.error('Error fetching search results:', error);
      if (searchResults) {
        searchResults.innerHTML = `
          <div class="col-12">
            <div class="alert alert-danger">
              Errore nel caricamento dei risultati: ${error.message}
            </div>
          </div>
        `;
      }
    });
}

// Display search results in the UI
function displaySearchResults(items) {
  const searchResults = document.getElementById('search-results');
  if (!searchResults) {
    console.error('search-results element not found');
    return;
  }
  
  // Svuota il contenitore
  searchResults.innerHTML = '';
  
  // Se non ci sono risultati
  if (!items || items.length === 0) {
    searchResults.innerHTML = `
      <div class="col-12">
        <div class="alert alert-info">
          Nessun risultato trovato. Prova con una ricerca diversa.
        </div>
      </div>
    `;
    return;
  }
  
  // Create a Set to track unique album IDs
  const uniqueAlbumIds = new Set();
  const uniqueAlbums = [];
  
  // Filter out duplicate albums
  items.forEach(item => {
    if (item && item.album && item.album.id && !uniqueAlbumIds.has(item.album.id)) {
      uniqueAlbumIds.add(item.album.id);
      uniqueAlbums.push(item);
    }
  });
  
  // Display up to 24 unique albums
  uniqueAlbums.slice(0, 24).forEach(item => {
    const albumElement = document.createElement('div');
    albumElement.className = 'col-6 col-sm-4 col-md-3 col-lg-2 mb-4';
    albumElement.innerHTML = `
      <div class="card album-card position-relative" data-album-id="${item.album.id}">
        <img src="${item.album.cover_medium}" class="card-img-top" alt="${item.album.title}">
        <div class="play-hover">
          <i class="bi bi-play-fill"></i>
        </div>
        <div class="card-body p-2">
          <h5 class="card-title text-truncate">${item.album.title}</h5>
          <p class="card-text text-truncate">
            <a href="artist.html?id=${item.artist.id}" class="text-light text-decoration-none">${item.artist.name}</a>
          </p>
        </div>
      </div>
    `;
    searchResults.appendChild(albumElement);
  });
}
