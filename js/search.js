
// ===================================================
// INITIALIZATION AND EVENT LISTENERS
// ===================================================
document.addEventListener('DOMContentLoaded', function() {
  document.body.classList.add('search-page-active');
  
  const searchInput = document.getElementById('mobile-search-query');

  if (searchInput) {
    searchInput.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        const query = e.target.value.trim();
        if (query) {
          searchAlbums(query);
        }
      }
    });

    const urlParams = new URLSearchParams(window.location.search);
    const searchQuery = urlParams.get('search');

    if (searchQuery) {
      searchInput.value = searchQuery;
      searchAlbums(searchQuery);
    }
  }

  const categoryCards = document.querySelectorAll('.category-card');
  categoryCards.forEach(card => {
    card.addEventListener('click', function() {
      const categoryName = this.querySelector('span').textContent.trim();
      searchAlbums(categoryName);
    });
  });
});

// ===================================================
// SEARCH API FUNCTION
// ===================================================

function searchAlbums(query) {
  if (!query || query.trim() === '') return;

  const apiUrl = `https://striveschool-api.herokuapp.com/api/deezer/search?q=${encodeURIComponent(query)}`;

  const searchResults = document.getElementById('search-results');
  if (searchResults) {
    searchResults.innerHTML = `
      <div class="text-center mt-4">
        <div class="spinner-border text-light" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
      </div>`;
  }

  fetch(apiUrl)
    .then(response => {
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.json();
    })
    .then(data => {
      displaySearchResults(data.data, query);
    })
    .catch(error => {
      console.error('Error fetching search results:', error);
      if (searchResults) {
        searchResults.innerHTML = `
          <div class="alert alert-danger mt-4">
            Errore nel caricamento dei risultati: ${error.message}
          </div>
        `;
      }
    });
}

// ===================================================
// DISPLAY SEARCH RESULTS
// ===================================================

function displaySearchResults(items, query) {
  const searchResults = document.getElementById('search-results');
  if (!searchResults) {
    console.error('search-results element not found');
    return;
  }

  if (!items || items.length === 0) {
    searchResults.innerHTML = `
      <div class="alert alert-info mt-4">
        Nessun risultato trovato per "${query}". Prova con una ricerca diversa.
      </div>
    `;
    return;
  }

  searchResults.innerHTML = `
    <h2 class="mb-4">Risultati per "${query}"</h2>
    <div class="row" id="results-grid"></div>
  `;

  const resultsGrid = document.getElementById('results-grid');

  const uniqueAlbumIds = new Set();
  const uniqueAlbums = [];

  items.forEach(item => {
    if (item && item.album && item.album.id && !uniqueAlbumIds.has(item.album.id)) {
      uniqueAlbumIds.add(item.album.id);
      uniqueAlbums.push(item);
    }
  });

  uniqueAlbums.slice(0, 20).forEach(item => {
    const albumElement = document.createElement('div');
    albumElement.className = 'col-6 mb-3';
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
    resultsGrid.appendChild(albumElement);
  });

  document.querySelectorAll('.album-card').forEach(card => {
    card.addEventListener('click', function() {
      window.location.href = `album.html?id=${this.dataset.albumId}`;
    });
  });
}
