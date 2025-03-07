// ===================================================
// INITIALIZATION
// ===================================================
document.addEventListener('DOMContentLoaded', function() {
  if (document.querySelector('.track-name').textContent === 'Track Name') {
    fetchPlayerBarTrack();
  }

  // Play/Pause Button Functionality
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

  // Like Button Functionality
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

// ===================================================
// AUDIO PLAYER AND PLAYLIST MANAGEMENT
// ===================================================
document.addEventListener('DOMContentLoaded', function() {
  if (document.querySelector('.track-name').textContent === 'Track Name') {
    fetchPlayerBarTrack();
  }

  // Audio player
  let audioPlayer = new Audio();
  let isPlaying = false;
  let currentTrack = null;
  let playlistTracks = [];
  let currentTrackIndex = -1;

  window.musicPlayer = {
    play: function(trackPreviewUrl, trackInfo) {
      if (currentTrack === trackPreviewUrl && isPlaying) {
        this.pause();
        return;
      }

      if (currentTrack !== trackPreviewUrl) {
        audioPlayer.src = trackPreviewUrl;
        currentTrack = trackPreviewUrl;

        if (trackInfo) {
          updatePlayerBar(trackInfo);
        }

        if (playlistTracks.length > 0) {
          const index = playlistTracks.findIndex(track => track.preview === trackPreviewUrl);
          if (index !== -1) {
            currentTrackIndex = index;
          }
        }
      }

      audioPlayer.play();
      isPlaying = true;
      updatePlayButton(true);
    },

    pause: function() {
      audioPlayer.pause();
      isPlaying = false;
      updatePlayButton(false);
    },

    isPlaying: function() {
      return isPlaying;
    },

    getCurrentTrack: function() {
      return currentTrack;
    },

    setPlaylist: function(tracks) {
      playlistTracks = tracks;
    },

    getPlaylist: function() {
      return playlistTracks;
    },

    playNext: function() {
      if (playlistTracks.length === 0) return;

      if (currentTrackIndex < playlistTracks.length - 1) {
        currentTrackIndex++;
      } else {
        currentTrackIndex = 0;
      }

      const nextTrack = playlistTracks[currentTrackIndex];
      if (nextTrack && nextTrack.preview) {
        this.play(nextTrack.preview, {
          title: nextTrack.title,
          artist: nextTrack.artist,
          album: nextTrack.album,
          duration: nextTrack.duration
        });
      }
    },

    playPrevious: function() {
      if (playlistTracks.length === 0) return;

      if (audioPlayer.currentTime > 3) {
        audioPlayer.currentTime = 0;
        return;
      }

      if (currentTrackIndex > 0) {
        currentTrackIndex--;
      } else {
        currentTrackIndex = playlistTracks.length - 1;
      }

      const prevTrack = playlistTracks[currentTrackIndex];
      if (prevTrack && prevTrack.preview) {
        this.play(prevTrack.preview, {
          title: prevTrack.title,
          artist: prevTrack.artist,
          album: prevTrack.album,
          duration: prevTrack.duration
        });
      }
    }
  };

  // Event Listeners for Play/Pause, Previous, and Next Buttons
  const playBtn = document.querySelector('.play-btn');
  if (playBtn) {
    playBtn.addEventListener('click', function() {
      if (currentTrack) {
        if (isPlaying) {
          window.musicPlayer.pause();
        } else {
          window.musicPlayer.play(currentTrack);
        }
      }
    });
  }

  const prevBtn = document.querySelector('.bi-skip-backward-fill').parentElement;
  const nextBtn = document.querySelector('.bi-skip-forward-fill').parentElement;

  if (prevBtn) {
    prevBtn.addEventListener('click', function() {
      window.musicPlayer.playPrevious();
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', function() {
      window.musicPlayer.playNext();
    });
  }

  // Time Update Event Listener
  audioPlayer.addEventListener('timeupdate', function() {
    const currentTimeElement = document.querySelector('.current-time');
    const progressBar = document.querySelector('.progress-bar');

    if (currentTimeElement) {
      const currentMinutes = Math.floor(audioPlayer.currentTime / 60);
      const currentSeconds = Math.floor(audioPlayer.currentTime % 60);
      currentTimeElement.textContent = `${currentMinutes}:${currentSeconds < 10 ? '0' + currentSeconds : currentSeconds}`;
    }

    if (progressBar) {
      const percentage = (audioPlayer.currentTime / audioPlayer.duration) * 100;
      progressBar.style.width = `${percentage}%`;
    }
  });

  // Track Ended Event Listener
  audioPlayer.addEventListener('ended', function() {
    if (playlistTracks.length > 0) {
      window.musicPlayer.playNext();
    } else {
      isPlaying = false;
      updatePlayButton(false);
    }
  });

  // Progress Bar Click Event Listener
  const progressContainer = document.querySelector('.progress');
  if (progressContainer) {
    progressContainer.addEventListener('click', function(e) {
      if (currentTrack && audioPlayer.duration) {
        const progressWidth = this.clientWidth;
        const clickX = e.offsetX;
        const seekTime = (clickX / progressWidth) * audioPlayer.duration;
        audioPlayer.currentTime = seekTime;
      }
    });
  }

  // Like Button Functionality (duplicate, remove one)

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
// PLAY BUTTON UI UPDATE
// ===================================================

function updatePlayButton(isPlaying) {
  const playBtns = document.querySelectorAll('.play-btn i');
  playBtns.forEach(icon => {
    if (isPlaying) {
      icon.classList.remove('bi-play-circle-fill');
      icon.classList.add('bi-pause-circle-fill');
    } else {
      icon.classList.remove('bi-pause-circle-fill');
      icon.classList.add('bi-play-circle-fill');
    }
  });

  const playBtnsSquare = document.querySelectorAll('.btn-play i.bi-play-fill');
  playBtnsSquare.forEach(icon => {
    if (isPlaying) {
      icon.classList.remove('bi-play-fill');
      icon.classList.add('bi-pause-fill');
    } else {
      icon.classList.remove('bi-pause-fill');
      icon.classList.add('bi-play-fill');
    }
  });
}


// ===================================================
// PLAYER BAR DATA FETCHING (Duplicate, remove one)
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
// PLAYER BAR UI UPDATE (Duplicate, remove one)
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