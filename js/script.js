
document.addEventListener('DOMContentLoaded', function() {
  fetchFeaturedAlbum();
  fetchRecentlyPlayed();
  fetchAlbums('rock');
  fetchTrendingMusic();
  fetchPlayerBarTrack(); 

  setupSearch();

  document.addEventListener('click', function(e) {
    if (e.target.closest('.play-hover')) {
      e.preventDefault();
      const albumElement = e.target.closest('.album-card');
      if (albumElement && albumElement.dataset.albumId) {
        loadAlbumDetails(albumElement.dataset.albumId);
      }
    }

    if (e.target.closest('.recent-card')) {
      e.preventDefault();
      const recentCard = e.target.closest('.recent-card');
      if (recentCard && recentCard.dataset.albumId) {
        loadAlbumDetails(recentCard.dataset.albumId);
      }
    }
  });
});

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
        performSearch(searchInput.value.trim());
      }
    });
  }

  if (mobileSearchLink && mobileSearchBox && mobileSearchInput && mobileSearchButton) {
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
        const query = mobileSearchInput.value.trim();
        if (query && window.innerWidth < 992) {
          window.location.href = `search.html?search=${encodeURIComponent(query)}`;
        } else {
          performSearch(query);
        }
      }
    });

    mobileSearchButton.addEventListener('click', function() {
      const query = mobileSearchInput.value.trim();
      if (query && window.innerWidth < 992) {
        window.location.href = `search.html?search=${encodeURIComponent(query)}`;
      } else {
        performSearch(query);
      }
    });
  }

  function performSearch(query) {
    if (query) {
      if (window.location.pathname.includes('index.html') || window.location.pathname === '/' || window.location.pathname === '') {
        const contentArea = document.getElementById('content-area');
        if (contentArea) {
          let searchResultsHTML = `
            <div class="row mb-4">
              <div class="col-12">
                <h2 class="text-white">Risultati per "${query}"</h2>
              </div>
            </div>
            <div class="row" id="search-results">
              
            </div>
          `;

          contentArea.innerHTML = searchResultsHTML;

          searchAlbumsInContent(query);

          if (searchBox) searchBox.style.display = 'none';
          if (mobileSearchBox) mobileSearchBox.style.display = 'none';
        }
      } else {
        window.location.href = `index.html?search=${encodeURIComponent(query)}`;
      }
    }
  }

  const urlParams = new URLSearchParams(window.location.search);
  const searchQuery = urlParams.get('search');
  if (searchQuery) {
    if (searchInput) searchInput.value = searchQuery;
    if (mobileSearchInput) mobileSearchInput.value = searchQuery;

    const contentArea = document.getElementById('content-area');
    if (contentArea) {
      let searchResultsHTML = `
        <div class="row mb-4">
          <div class="col-12">
            <h2 class="text-white">Risultati per "${searchQuery}"</h2>
          </div>
        </div>
        <div class="row" id="search-results">
          
        </div>
      `;

      contentArea.innerHTML = searchResultsHTML;

      searchAlbumsInContent(searchQuery);
    }
  }
}

// ===================================================
// DATA FETCHING FUNCTIONS
// ===================================================

function fetchRecentlyPlayed() {
  const artists = ['eminem', 'taylor swift', 'ed sheeran', 'billie eilish', 'coldplay', 'daft punk', 'bruno mars', 'lady gaga', 'drake', 'dua lipa', 'the weeknd', 'rihanna', 'justin bieber', 'post malone', 'shawn mendes', 'ariana grande', 'khalid', 'halsey', 'j balvin', 'bts', 'lizzo', 'imagine dragons', 'nicki minaj', 'selena gomez', 'marshmello', 'tones and i', 'kacey musgraves', 'zayn', 'sia', 'harry styles', 'fetty wap', 'travis scott', 'future', 'the chain smokers', 'paramore', 'j cole', 'macklemore', 'clean bandit', 'alessia cara', 'fedez', 'salmo', 'charlie puth', 'meghan trainor', 'bebe rexha', 'brandi carlile', 'chris stapleton', 'sheryl crow', 'lil nas x', 'maroon 5', 'one republic'];

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

function fetchTrendingMusic() {
  const genres = ['pop', 'rap', 'electronic', 'indie', 'metal', 'rock', 'jazz', 'classical', 'blues', 'reggae', 'country', 'hip-hop', 'alternative', 'folk', 'punk', 'soul', 'R&B', 'disco', 'grunge', 'latin', 'synthwave'];

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

function fetchFeaturedAlbum() {
  const featuredArtists = ['Fedez', 'Salmo', 'Dua Lipa', 'The Weeknd', 'Adele', 'Drake', 'Bruno Mars', 'Lady Gaga', 'Billie Eilish', 'Post Malone', 'Ed Sheeran', 'Tones and I', 'Sia', 'Shawn Mendes', 'Camila Cabello', 'Khalid', 'Charlie Puth', 'J Balvin', 'BTS', 'Taylor Swift', 'Maroon 5', 'Hozier', 'Katy Perry', 'Lizzo', 'Imagine Dragons', 'John Legend', 'Nicki Minaj', 'Ariana Grande', 'Travis Scott', 'Sam Smith', 'Lil Nas X', 'Marshmello', 'Miley Cyrus', 'Rihanna', 'Harry Styles', 'Pink', 'The Chainsmokers', 'J. Cole', 'Future', 'The Killers', 'Paramore', 'Snoop Dogg', 'Dr. Dre', 'Brandi Carlile', 'Chris Stapleton', 'Sheryl Crow', 'Demi Lovato', 'JoJo'];

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

// ===================================================
// DISPLAY FUNCTIONS
// ===================================================

function displayRecentlyPlayed(items) {
  const recentCards = document.querySelectorAll('.recent-card .card-body');

  const itemsToShow = Math.min(items.length, recentCards.length);

  for (let i = 0; i < itemsToShow; i++) {
    const item = items[i];
    if (item && item.album && item.album.cover_small && item.title && item.artist && item.artist.name) {
      recentCards[i].innerHTML = `
          <img src="${item.album.cover_small}" class="recent-album-img" alt="${item.album.title}">
          <div class="ms-3 overflow-hidden">
            <span class="d-block text-truncate fw-bold">${item.title}</span>
            <span class="d-block text-truncate small text-white-50">${item.artist.name}</span>
          </div>
        `;
      recentCards[i].closest('.recent-card').dataset.albumId = item.album.id;
    } else {
      console.error("Missing data in recently played item:", item);
      recentCards[i].innerHTML = "<p>Data not available</p>";
    }
  }
}

function displayTrendingMusic(items) {
  const trendingCards = document.querySelectorAll('.album-card');

  const itemsToShow = Math.min(items.length, trendingCards.length);

  for (let i = 0; i < itemsToShow; i++) {
    const item = items[i];
    const card = trendingCards[i];
    if (item && item.album && item.album.cover_medium && item.artist && item.artist.name && card) {
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
      if (card) card.innerHTML = "<p>Data not available</p>";
    }
  }
}

function displayFeaturedAlbum(item) {
  if (!item || !item.album || !item.artist) {
    console.error("Missing data in featured album item:", item);
    return;
  }

  const featuredAlbumImg = document.getElementById('featured-album-img');
  const featuredAlbumTitle = document.getElementById('featured-album-title');
  const featuredAlbumArtist = document.getElementById('featured-album-artist');
  const featuredAlbumDescription = document.getElementById('featured-album-description');

  if (featuredAlbumImg) {
    if (window.innerWidth <= 768) {
      featuredAlbumImg.src = item.album.cover_medium || item.album.cover_small;
    } else {
      featuredAlbumImg.src = item.album.cover_big || item.album.cover_medium;
    }
  }

  if (featuredAlbumTitle) {
    if (window.innerWidth <= 768 && (item.title || item.album.title).length > 30) {
      featuredAlbumTitle.textContent = (item.title || item.album.title).substring(0, 30) + '...';
    } else {
      featuredAlbumTitle.textContent = item.title || item.album.title;
    }
  }

  if (featuredAlbumArtist) {
    featuredAlbumArtist.innerHTML = `
      <a href="artist.html?id=${item.artist.id}" class="text-light text-decoration-none">${item.artist.name}</a>
    `;
  }

  if (featuredAlbumDescription) {
    featuredAlbumDescription.textContent = `Ascolta il nuovo singolo di ${item.artist.name}!`;
  }

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

function displayAlbums(albums) {
  const albumListElement = document.getElementById('album-list');
  if (!albumListElement) {
    console.error('album-list element not found');
    return;
  }

  albumListElement.innerHTML = '';

  const uniqueAlbumIds = new Set();
  const uniqueAlbums = [];

  albums.forEach(item => {
    if (item && item.album && item.album.id && item.artist && item.artist.id && !uniqueAlbumIds.has(item.album.id)) {
      uniqueAlbumIds.add(item.album.id);
      uniqueAlbums.push(item);
    } else {
      console.error("Missing data in album item:", item);
    }
  });

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

// ===================================================
// NAVIGATION FUNCTIONS
// ===================================================

function loadArtistDetails(artistId) {
  console.log('Loading artist details for ID:', artistId);
}

function loadAlbumDetails(albumId) {
  window.location.href = `album.html?id=${albumId}`;
}

function loadArtistDetails(artistId) {
  window.location.href = `artist.html?id=${artistId}`;
}

// ===================================================
// SEARCH RESULT FUNCTIONS
// ===================================================

function searchAlbums(query) {
  if (query && query.trim() !== '') {
    fetchAlbums(query);
  }
}

document.addEventListener('DOMContentLoaded', function() {
  const searchInput = document.querySelector('.search-input');
  if (searchInput) {
    searchInput.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        searchAlbums(e.target.value);
      }
    });
  }
});

function searchAlbumsInContent(query) {
  if (!query || query.trim() === '') return;

  const apiUrl = `https://striveschool-api.herokuapp.com/api/deezer/search?q=${encodeURIComponent(query)}`;

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

function displaySearchResults(items) {
  const searchResults = document.getElementById('search-results');
  if (!searchResults) {
    console.error('search-results element not found');
    return;
  }

  searchResults.innerHTML = '';

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

  const uniqueAlbumIds = new Set();
  const uniqueAlbums = [];

  items.forEach(item => {
    if (item && item.album && item.album.id && !uniqueAlbumIds.has(item.album.id)) {
      uniqueAlbumIds.add(item.album.id);
      uniqueAlbums.push(item);
    }
  });

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
