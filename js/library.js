// ===================================================
// LIBRERIA LOCALE
// ===================================================
// Gestisce brani che ti piacciono, album salvati,
// artisti seguiti e playlist. Tutto in localStorage,
// con un evento "library:changed" per aggiornare la UI.
// ===================================================

(function () {
  'use strict';

  const U = window.AppUtils;

  const KEYS = {
    liked: 'likedTracks',
    albums: 'savedAlbums',
    artists: 'followedArtists',
    playlists: 'playlists'
  };

  const SEED_PLAYLISTS = [
    'early stage emily syndrome (sett-ott 2022)',
    'Be The Young',
    '"..." cit. Kimiko (lug-ago 2022)',
    'saggio vibes🌹📱🌸',
    'main character energy (mag-giu 2022)',
    'that fucking mood 🔪☠️',
    'VEE, CARLOTTA E GIACOMO VANNO A BOSIO',
    'An Emily Winchester kind of mood 🔪🔥',
    'landing page (mar-apr 2022)',
    '2021 lol',
    'cosa cazzo vuol dire questa affermazione (gen-feb...)',
    'honey and glass (nov-dic 2021)',
    '(Revenge) Training Arc 🏋️',
    'Lidia 🧡 Emily',
    'minecraft e nintendo switch (sep-oct 2021)',
    "silvano d'orba? I hardly know her (lug - ago 2021)",
    'Culo 2021',
    'Frah Quintale Mix',
    'Francesco Guccini Mix'
  ];

  // ---------------------------------------------------
  // BASE
  // ---------------------------------------------------

  function read(key, fallback) {
    const value = U.storage.get(key, fallback);
    return Array.isArray(value) ? value : fallback;
  }

  function write(key, value) {
    U.storage.set(key, value);
    document.dispatchEvent(new CustomEvent('library:changed', { detail: { key: key } }));
  }

  function trackKey(track) {
    if (!track) return '';
    return String(track.id || track.streamUrl || track.preview || track.title || '');
  }

  function cleanTrack(track) {
    if (!track) return null;
    return {
      id: String(track.id || ''),
      title: track.title || 'Brano sconosciuto',
      artist: {
        id: String((track.artist && track.artist.id) || ''),
        name: (track.artist && track.artist.name) || 'Artista sconosciuto'
      },
      album: {
        id: String((track.album && track.album.id) || ''),
        title: (track.album && track.album.title) || '',
        cover: (track.album && (track.album.cover || track.album.coverSmall)) || 'img/cover_c.jpg',
        coverSmall: (track.album && (track.album.coverSmall || track.album.cover)) || 'img/cover_c.jpg'
      },
      duration: Number(track.duration) || 0,
      streamUrl: track.streamUrl || track.preview || '',
      preview: track.streamUrl || track.preview || '',
      provider: track.provider || 'deezer'
    };
  }

  function cleanAlbum(album) {
    if (!album) return null;
    return {
      id: String(album.id || ''),
      title: album.title || 'Album senza titolo',
      cover: album.cover || album.coverSmall || 'img/cover_c.jpg',
      coverSmall: album.coverSmall || album.cover || 'img/cover_c.jpg',
      artist: {
        id: String((album.artist && album.artist.id) || ''),
        name: (album.artist && album.artist.name) || 'Artista sconosciuto'
      },
      year: album.year || '',
      nbTracks: album.nbTracks || 0
    };
  }

  function cleanArtist(artist) {
    if (!artist) return null;
    return {
      id: String(artist.id || ''),
      name: artist.name || 'Artista sconosciuto',
      picture: artist.picture || artist.pictureMedium || '',
      pictureSmall: artist.pictureSmall || artist.pictureMedium || '',
      fans: artist.fans || 0
    };
  }

  function durationOfTracks(tracks) {
    return tracks.reduce(function (total, track) {
      return total + (Number(track.duration) || 0);
    }, 0);
  }

  // ---------------------------------------------------
  // BRANI CHE TI PIACCIONO
  // ---------------------------------------------------

  function getLikedTracks() {
    return read(KEYS.liked, []).filter(function (track) {
      return track && typeof track === 'object';
    });
  }

  function isLiked(track) {
    const key = trackKey(track);
    return getLikedTracks().some(function (item) {
      return trackKey(item) === key;
    });
  }

  function toggleLiked(track) {
    const cleaned = cleanTrack(track);
    if (!cleaned || !trackKey(cleaned)) return false;

    const list = getLikedTracks();
    const position = list.findIndex(function (item) {
      return trackKey(item) === trackKey(cleaned);
    });

    let active;
    if (position === -1) {
      cleaned.addedAt = Date.now();
      list.unshift(cleaned);
      active = true;
    } else {
      list.splice(position, 1);
      active = false;
    }

    write(KEYS.liked, list);
    return active;
  }

  function removeLiked(track) {
    const key = trackKey(track);
    write(KEYS.liked, getLikedTracks().filter(function (item) {
      return trackKey(item) !== key;
    }));
  }

  function likedDuration() {
    return durationOfTracks(getLikedTracks());
  }

  // ---------------------------------------------------
  // ALBUM SALVATI
  // ---------------------------------------------------

  function getSavedAlbums() {
    return read(KEYS.albums, []).filter(function (album) {
      return album && typeof album === 'object';
    });
  }

  function isAlbumSaved(albumOrId) {
    const id = String(typeof albumOrId === 'object' ? albumOrId.id : albumOrId);
    return getSavedAlbums().some(function (album) {
      return String(album.id) === id;
    });
  }

  function toggleAlbum(album) {
    const cleaned = cleanAlbum(album);
    if (!cleaned || !cleaned.id) return false;

    const list = getSavedAlbums();
    const position = list.findIndex(function (item) {
      return String(item.id) === cleaned.id;
    });

    let active;
    if (position === -1) {
      cleaned.addedAt = Date.now();
      list.unshift(cleaned);
      active = true;
    } else {
      list.splice(position, 1);
      active = false;
    }

    write(KEYS.albums, list);
    return active;
  }

  // ---------------------------------------------------
  // ARTISTI SEGUITI
  // ---------------------------------------------------

  function getFollowedArtists() {
    return read(KEYS.artists, []).filter(function (artist) {
      return artist && typeof artist === 'object';
    });
  }

  function isArtistFollowed(artistOrId) {
    const id = String(typeof artistOrId === 'object' ? artistOrId.id : artistOrId);
    return getFollowedArtists().some(function (artist) {
      return String(artist.id) === id;
    });
  }

  function toggleArtist(artist) {
    const cleaned = cleanArtist(artist);
    if (!cleaned || !cleaned.id) return false;

    const list = getFollowedArtists();
    const position = list.findIndex(function (item) {
      return String(item.id) === cleaned.id;
    });

    let active;
    if (position === -1) {
      cleaned.addedAt = Date.now();
      list.unshift(cleaned);
      active = true;
    } else {
      list.splice(position, 1);
      active = false;
    }

    write(KEYS.artists, list);
    return active;
  }

  // ---------------------------------------------------
  // PLAYLIST
  // ---------------------------------------------------

  function seedPlaylists() {
    const existing = U.storage.get(KEYS.playlists, null);
    if (Array.isArray(existing)) return existing;

    const seeded = SEED_PLAYLISTS.map(function (name, index) {
      return {
        id: 'seed-' + (index + 1),
        name: name,
        tracks: [],
        createdAt: Date.now() + index
      };
    });

    U.storage.set(KEYS.playlists, seeded);
    return seeded;
  }

  function getPlaylists() {
    return seedPlaylists().filter(function (playlist) {
      return playlist && playlist.id && playlist.name;
    });
  }

  function getPlaylist(id) {
    return getPlaylists().find(function (playlist) {
      return String(playlist.id) === String(id);
    }) || null;
  }

  function createPlaylist(name) {
    const cleanName = String(name || '').trim();
    if (!cleanName) return null;

    const playlist = {
      id: 'pl-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 7),
      name: cleanName.slice(0, 80),
      tracks: [],
      createdAt: Date.now()
    };

    write(KEYS.playlists, [playlist].concat(getPlaylists()));
    return playlist;
  }

  function renamePlaylist(id, name) {
    const cleanName = String(name || '').trim();
    if (!cleanName) return false;

    const list = getPlaylists().map(function (playlist) {
      if (String(playlist.id) !== String(id)) return playlist;
      return Object.assign({}, playlist, { name: cleanName.slice(0, 80) });
    });

    write(KEYS.playlists, list);
    return true;
  }

  function deletePlaylist(id) {
    write(KEYS.playlists, getPlaylists().filter(function (playlist) {
      return String(playlist.id) !== String(id);
    }));
  }

  function addTrackToPlaylist(playlistId, track) {
    const cleaned = cleanTrack(track);
    if (!cleaned || !trackKey(cleaned)) return false;

    let added = false;
    const list = getPlaylists().map(function (playlist) {
      if (String(playlist.id) !== String(playlistId)) return playlist;

      const tracks = Array.isArray(playlist.tracks) ? playlist.tracks : [];
      if (tracks.some(function (item) { return trackKey(item) === trackKey(cleaned); })) {
        return playlist;
      }

      added = true;
      return Object.assign({}, playlist, { tracks: tracks.concat(cleaned) });
    });

    if (added) write(KEYS.playlists, list);
    return added;
  }

  function removeTrackFromPlaylist(playlistId, track) {
    const key = trackKey(track);

    const list = getPlaylists().map(function (playlist) {
      if (String(playlist.id) !== String(playlistId)) return playlist;

      return Object.assign({}, playlist, {
        tracks: (playlist.tracks || []).filter(function (item) {
          return trackKey(item) !== key;
        })
      });
    });

    write(KEYS.playlists, list);
  }

  function getPlaylistsContaining(track) {
    const key = trackKey(track);
    return getPlaylists().filter(function (playlist) {
      return (playlist.tracks || []).some(function (item) {
        return trackKey(item) === key;
      });
    });
  }

  window.AppLibrary = {
    KEYS: KEYS,
    trackKey: trackKey,
    durationOfTracks: durationOfTracks,

    getLikedTracks: getLikedTracks,
    isLiked: isLiked,
    toggleLiked: toggleLiked,
    removeLiked: removeLiked,
    likedDuration: likedDuration,

    getSavedAlbums: getSavedAlbums,
    isAlbumSaved: isAlbumSaved,
    toggleAlbum: toggleAlbum,

    getFollowedArtists: getFollowedArtists,
    isArtistFollowed: isArtistFollowed,
    toggleArtist: toggleArtist,

    getPlaylists: getPlaylists,
    getPlaylist: getPlaylist,
    createPlaylist: createPlaylist,
    renamePlaylist: renamePlaylist,
    deletePlaylist: deletePlaylist,
    addTrackToPlaylist: addTrackToPlaylist,
    removeTrackFromPlaylist: removeTrackFromPlaylist,
    getPlaylistsContaining: getPlaylistsContaining
  };
})();
