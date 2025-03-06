
document.addEventListener('DOMContentLoaded', function() {
  if (document.querySelector('.track-name').textContent === 'Track Name') {
    fetchPlayerBarTrack();
  }

  const playBtn = document.querySelector('.play-btn');
  if (playBtn) {
    playBtn.addEventListener('click', function() {
      const icon = this.querySelector('i');
      if (icon.classList.contains('bi-play-circle-fill')) {
        icon.classList.remove('bi-play-circle-fill');
        icon.classList.add('bi-pause-circle-fill');
      } else {
        icon.classList.remove('bi-pause-circle-fill');
        icon.classList.add('bi-play-circle-fill');
      }
    });
  }

  const likeBtn = document.querySelector('.now-playing .btn-link');
  if (likeBtn) {
    likeBtn.addEventListener('click', function() {
      const icon = this.querySelector('i');
      if (icon.classList.contains('bi-heart')) {
        icon.classList.remove('bi-heart');
        icon.classList.add('bi-heart-fill');
        icon.style.color = '#1DB954';
      } else {
        icon.classList.remove('bi-heart-fill');
        icon.classList.add('bi-heart');
        icon.style.color = '';
      }
    });
  }
});

// ===================================================
// PLAYER BAR DATA FETCHING
// ===================================================

function fetchPlayerBarTrack() {
  const currentArtistName = document.querySelector('.artist-name')?.textContent;
  if (currentArtistName && currentArtistName !== "Artist Name") {
    return;
  }

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

// ===================================================
// PLAYER BAR UI UPDATE
// ===================================================

function updatePlayerBar(track) {
  const currentAlbumImg = document.querySelector('.current-album-img');
  const trackNameElement = document.querySelector('.track-name');
  const artistNameElement = document.querySelector('.artist-name');

  if (track && track.artist && track.album) {
    if (currentAlbumImg) currentAlbumImg.src = track.album.cover_small || track.picture_small || 'img/cover_c.jpg';
    if (trackNameElement) trackNameElement.textContent = track.title || "Brani popolari";
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
  } else if (track && track.name) {
    if (currentAlbumImg) currentAlbumImg.src = track.picture_small || 'img/cover_c.jpg';
    if (trackNameElement) trackNameElement.textContent = "Brani popolari";
    if (artistNameElement) {
      artistNameElement.innerHTML = `
        <a href="artist.html?id=${track.id}" class="text-white-50">${track.name}</a>
      `;
    }
  }
}
