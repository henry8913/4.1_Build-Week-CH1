// ===================================================
// ADATTATORE API MUSICALE
// ===================================================
// Due provider intercambiabili:
//   - deezer: catalogo mainstream, anteprime da 30 sec
//   - audius: brani completi, catalogo indipendente
//
// Le pagine ricevono sempre lo stesso modello normalizzato:
//   Track  { id, title, artist, album, duration, streamUrl, provider }
//   Album  { id, title, cover, artist, year, tracks, ... }
//   Artist { id, name, fans, picture, ... }
// ===================================================

(function () {
  'use strict';

  const DEFAULT_COVER = 'img/cover_c.jpg';
  const STORAGE_KEY = 'provider';
  const DEFAULT_PROVIDER = 'audius';
  const REQUEST_TIMEOUT = 12000;

  // ---------------------------------------------------
  // RICHIESTE
  // ---------------------------------------------------

  async function requestJson(url) {
    const controller = new AbortController();
    const timeoutId = setTimeout(function () {
      controller.abort();
    }, REQUEST_TIMEOUT);

    try {
      const response = await fetch(url, { signal: controller.signal });
      if (!response.ok) {
        throw new Error('Richiesta non riuscita (' + response.status + ')');
      }
      return await response.json();
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error('Il servizio musicale non ha risposto in tempo');
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  // ---------------------------------------------------
  // DEEZER
  // ---------------------------------------------------

  const deezer = {
    id: 'deezer',
    label: 'Deezer',
    description: 'Catalogo mainstream, anteprime da 30 secondi',
    supportsFullTracks: false,
    badge: 'Anteprima 30s',
    baseUrl: 'https://striveschool-api.herokuapp.com/api/deezer',

    request: function (path) {
      return requestJson(this.baseUrl + path);
    },

    normalizeTrack: function (raw, context) {
      if (!raw) return null;

      const albumRaw = raw.album || (context && context.album) || {};
      const artistRaw = raw.artist || (context && context.artist) || albumRaw.artist || {};
      const streamUrl = raw.streamUrl || raw.preview || '';

      return {
        id: raw.id !== undefined && raw.id !== null ? String(raw.id) : '',
        title: raw.title || raw.title_short || 'Brano sconosciuto',
        artist: {
          id: artistRaw.id !== undefined && artistRaw.id !== null ? String(artistRaw.id) : '',
          name: artistRaw.name || 'Artista sconosciuto'
        },
        album: {
          id: albumRaw.id !== undefined && albumRaw.id !== null ? String(albumRaw.id) : '',
          title: albumRaw.title || '',
          cover: deezerCover(albumRaw),
          coverSmall: deezerSmallCover(albumRaw)
        },
        duration: Number(raw.duration) || 0,
        streamUrl: streamUrl,
        preview: streamUrl,
        provider: 'deezer'
      };
    },

    normalizeAlbum: function (raw, fallbackArtist) {
      if (!raw) return null;

      const artist = raw.artist || fallbackArtist || {};
      const rawTracks = raw.tracks && Array.isArray(raw.tracks.data) ? raw.tracks.data : [];
      const tracks = rawTracks.map(function (track) {
        return deezer.normalizeTrack(track, { album: raw, artist: artist });
      });

      return {
        id: raw.id !== undefined && raw.id !== null ? String(raw.id) : '',
        title: raw.title || 'Album senza titolo',
        cover: deezerCover(raw),
        coverSmall: deezerSmallCover(raw),
        artist: {
          id: artist.id !== undefined && artist.id !== null ? String(artist.id) : '',
          name: artist.name || 'Artista sconosciuto'
        },
        artistPicture: artist.picture_small || artist.picture_medium || '',
        year: raw.release_date ? String(raw.release_date).slice(0, 4) : '',
        releaseDate: raw.release_date || '',
        copyright: raw.copyright || '',
        nbTracks: raw.nb_tracks || tracks.length,
        duration: raw.duration || tracks.reduce(function (total, track) {
          return total + track.duration;
        }, 0),
        recordType: raw.record_type || 'album',
        tracks: tracks
      };
    },

    normalizeArtist: function (raw) {
      if (!raw) return null;

      return {
        id: raw.id !== undefined && raw.id !== null ? String(raw.id) : '',
        name: raw.name || 'Artista sconosciuto',
        fans: Number(raw.nb_fan) || 0,
        albums: Number(raw.nb_album) || 0,
        picture: raw.picture_xl || raw.picture_big || raw.picture_medium || '',
        pictureMedium: raw.picture_medium || raw.picture_big || '',
        pictureSmall: raw.picture_small || raw.picture_medium || ''
      };
    },

    search: async function (query, limit) {
      const params = new URLSearchParams({ q: query });
      if (limit) params.set('limit', limit);
      const data = await this.request('/search?' + params.toString());
      return (data.data || []).map(function (item) {
        return deezer.normalizeTrack(item);
      });
    },

    getAlbum: async function (albumId) {
      const data = await this.request('/album/' + encodeURIComponent(albumId));
      return deezer.normalizeAlbum(data);
    },

    getArtist: async function (artistId) {
      const data = await this.request('/artist/' + encodeURIComponent(artistId));
      return deezer.normalizeArtist(data);
    },

    getArtistTop: async function (artistId, limit) {
      const data = await this.request('/artist/' + encodeURIComponent(artistId) + '/top?limit=' + (limit || 5));
      return (data.data || []).map(function (track) {
        return deezer.normalizeTrack(track);
      });
    },

    getArtistAlbums: async function (artistId) {
      const data = await this.request('/artist/' + encodeURIComponent(artistId) + '/albums');
      return (data.data || []).map(function (album) {
        return deezer.normalizeAlbum(album);
      });
    },

    getTrack: async function (trackId) {
      const data = await this.request('/track/' + encodeURIComponent(trackId));
      return deezer.normalizeTrack(data);
    },

    isStreamExpired: function (url) {
      if (!url) return true;
      const match = /[?&]exp=(\d+)/.exec(url);
      if (!match) return false;
      return Number(match[1]) * 1000 <= Date.now() + 60000;
    },

    resolveStream: async function (track) {
      if (!track) throw new Error('Brano non valido');
      if (track.streamUrl && !deezer.isStreamExpired(track.streamUrl)) return track.streamUrl;
      if (!track.id) throw new Error('Brano senza anteprima disponibile');

      const fresh = await deezer.getTrack(track.id);
      if (!fresh || !fresh.streamUrl) throw new Error('Anteprima non disponibile');

      track.streamUrl = fresh.streamUrl;
      track.preview = fresh.streamUrl;
      track.duration = fresh.duration || track.duration;
      return fresh.streamUrl;
    }
  };

  function deezerCover(object) {
    if (!object) return DEFAULT_COVER;
    return object.cover_big || object.cover_medium || object.cover_small ||
      object.cover || object.picture_big || object.picture_medium || DEFAULT_COVER;
  }

  function deezerSmallCover(object) {
    if (!object) return DEFAULT_COVER;
    return object.cover_small || object.cover_medium || object.cover ||
      object.cover_big || DEFAULT_COVER;
  }

  // ---------------------------------------------------
  // AUDIUS
  // ---------------------------------------------------

  const audius = {
    id: 'audius',
    label: 'Audius',
    description: 'Brani completi, catalogo indipendente',
    supportsFullTracks: true,
    badge: 'Brano completo',
    appName: 'BuildWeekCH1',
    baseUrl: 'https://api.audius.co/v1',

    request: function (path) {
      const separator = path.indexOf('?') === -1 ? '?' : '&';
      return requestJson(this.baseUrl + path + separator + 'app_name=' + encodeURIComponent(this.appName));
    },

    streamUrl: function (trackId) {
      return this.baseUrl + '/tracks/' + encodeURIComponent(trackId) +
        '/stream?app_name=' + encodeURIComponent(this.appName);
    },

    artwork: function (object, preferred) {
      if (!object) return DEFAULT_COVER;
      const artwork = object.artwork || object.profile_picture || object.cover_art_sizes || null;
      if (!artwork) return DEFAULT_COVER;
      if (typeof artwork === 'string') return artwork || DEFAULT_COVER;

      if (preferred && artwork[preferred]) return artwork[preferred];
      return artwork['480x480'] || artwork['1000x1000'] || artwork['150x150'] || DEFAULT_COVER;
    },

    normalizeTrack: function (raw) {
      if (!raw) return null;

      const user = raw.user || {};
      const cover = audius.artwork(raw, '480x480');
      const streamUrl = audius.streamUrl(raw.id);
      const albumId = 'track:' + raw.id;

      return {
        id: String(raw.id || ''),
        title: raw.title || 'Brano sconosciuto',
        artist: {
          id: user.id !== undefined && user.id !== null ? String(user.id) : '',
          name: user.name || user.handle || 'Artista sconosciuto'
        },
        album: {
          id: albumId,
          title: raw.title || '',
          cover: cover,
          coverSmall: audius.artwork(raw, '150x150')
        },
        duration: Number(raw.duration) || 0,
        streamUrl: streamUrl,
        preview: streamUrl,
        provider: 'audius',
        playCount: Number(raw.play_count) || 0
      };
    },

    normalizePlaylist: function (raw, fallbackArtist) {
      if (!raw) return null;

      const user = raw.user || fallbackArtist || {};
      const cover = audius.artwork(raw, '480x480');
      const date = raw.release_date || raw.created_at || '';

      return {
        id: String(raw.id || ''),
        title: raw.playlist_name || raw.title || 'Playlist senza titolo',
        cover: cover,
        coverSmall: audius.artwork(raw, '150x150'),
        artist: {
          id: user.id !== undefined && user.id !== null ? String(user.id) : '',
          name: user.name || user.handle || 'Artista sconosciuto'
        },
        artistPicture: audius.artwork(user, '480x480'),
        year: date ? String(date).slice(0, 4) : '',
        releaseDate: date,
        copyright: '',
        nbTracks: Number(raw.track_count) || 0,
        duration: 0,
        recordType: raw.is_album ? 'album' : 'playlist',
        tracks: []
      };
    },

    normalizeArtist: function (raw) {
      if (!raw) return null;

      return {
        id: String(raw.id || ''),
        name: raw.name || raw.handle || 'Artista sconosciuto',
        fans: Number(raw.follower_count) || 0,
        albums: Number(raw.album_count) || 0,
        picture: audius.artwork(raw, '1000x1000'),
        pictureMedium: audius.artwork(raw, '480x480'),
        pictureSmall: audius.artwork(raw, '150x150')
      };
    },

    playableTracks: function (items) {
      return (items || []).filter(function (track) {
        return track && track.is_streamable !== false && track.is_delete !== true;
      });
    },

    search: async function (query, limit) {
      const data = await audius.request(
        '/tracks/search?query=' + encodeURIComponent(query) +
        (limit ? '&limit=' + limit : '')
      );

      return audius.playableTracks(data.data).map(function (track) {
        return audius.normalizeTrack(track);
      });
    },

    getAlbum: async function (albumId) {
      if (String(albumId).indexOf('track:') === 0) {
        const track = await audius.getTrack(String(albumId).slice(6));
        if (!track) throw new Error('Brano non trovato');

        return {
          id: albumId,
          title: track.title,
          cover: track.album.cover,
          coverSmall: track.album.coverSmall,
          artist: track.artist,
          artistPicture: '',
          year: '',
          releaseDate: '',
          copyright: '',
          nbTracks: 1,
          duration: track.duration,
          recordType: 'single',
          tracks: [track]
        };
      }

      const meta = await audius.request('/playlists/' + encodeURIComponent(albumId));
      const raw = Array.isArray(meta.data) ? meta.data[0] : meta.data;
      if (!raw) throw new Error('Album non trovato');

      const tracksData = await audius.request('/playlists/' + encodeURIComponent(albumId) + '/tracks');
      const tracks = audius.playableTracks(tracksData.data).map(function (track) {
        return audius.normalizeTrack(track);
      });

      const album = audius.normalizePlaylist(raw);
      album.tracks = tracks;
      album.nbTracks = tracks.length || album.nbTracks;
      album.duration = tracks.reduce(function (total, track) {
        return total + track.duration;
      }, 0);

      return album;
    },

    getArtist: async function (artistId) {
      const data = await audius.request('/users/' + encodeURIComponent(artistId));
      const raw = Array.isArray(data.data) ? data.data[0] : data.data;
      return audius.normalizeArtist(raw);
    },

    getArtistTop: async function (artistId, limit) {
      const data = await audius.request('/users/' + encodeURIComponent(artistId) + '/tracks?limit=25');
      const tracks = audius.playableTracks(data.data).map(function (track) {
        return audius.normalizeTrack(track);
      });

      tracks.sort(function (a, b) {
        return b.playCount - a.playCount;
      });

      return tracks.slice(0, limit || 5);
    },

    getArtistAlbums: async function (artistId) {
      const results = await Promise.allSettled([
        audius.request('/users/' + encodeURIComponent(artistId) + '/albums'),
        audius.request('/users/' + encodeURIComponent(artistId) + '/playlists')
      ]);

      const items = [];
      results.forEach(function (result) {
        if (result.status === 'fulfilled' && result.value && Array.isArray(result.value.data)) {
          items.push.apply(items, result.value.data);
        }
      });

      const seen = new Set();
      return items.map(function (raw) {
        return audius.normalizePlaylist(raw);
      }).filter(function (album) {
        if (!album || !album.id || seen.has(album.id)) return false;
        seen.add(album.id);
        return true;
      });
    },

    getTrack: async function (trackId) {
      const data = await audius.request('/tracks/' + encodeURIComponent(trackId));
      const raw = Array.isArray(data.data) ? data.data[0] : data.data;
      return audius.normalizeTrack(raw);
    },

    resolveStream: async function (track) {
      if (!track) throw new Error('Brano non valido');
      if (track.streamUrl) return track.streamUrl;
      if (!track.id) throw new Error('Brano senza stream disponibile');

      track.streamUrl = audius.streamUrl(track.id);
      track.preview = track.streamUrl;
      return track.streamUrl;
    }
  };

  // ---------------------------------------------------
  // SELEZIONE PROVIDER
  // ---------------------------------------------------

  const PROVIDERS = {
    deezer: deezer,
    audius: audius
  };

  function storedProvider() {
    try {
      const stored = localStorage.getItem('spotifyClone.' + STORAGE_KEY);
      return PROVIDERS[stored] ? stored : DEFAULT_PROVIDER;
    } catch (error) {
      return DEFAULT_PROVIDER;
    }
  }

  function initialProvider() {
    try {
      const fromUrl = new URLSearchParams(window.location.search).get('provider');
      if (fromUrl && PROVIDERS[fromUrl]) {
        localStorage.setItem('spotifyClone.' + STORAGE_KEY, fromUrl);
        return fromUrl;
      }
    } catch (error) {
      // URL non disponibile.
    }
    return storedProvider();
  }

  let currentProvider = initialProvider();

  function active() {
    return PROVIDERS[currentProvider];
  }

  function providerFor(track) {
    if (track && track.provider && PROVIDERS[track.provider]) {
      return PROVIDERS[track.provider];
    }
    return active();
  }

  function setProvider(providerId) {
    if (!PROVIDERS[providerId]) return false;

    currentProvider = providerId;
    try {
      localStorage.setItem('spotifyClone.' + STORAGE_KEY, providerId);
    } catch (error) {
      // Storage non disponibile.
    }
    return true;
  }

  function getProviderInfo(providerId) {
    const provider = PROVIDERS[providerId || currentProvider] || active();
    return {
      id: provider.id,
      label: provider.label,
      description: provider.description,
      supportsFullTracks: provider.supportsFullTracks,
      badge: provider.badge
    };
  }

  // ---------------------------------------------------
  // API PUBBLICA
  // ---------------------------------------------------

  const api = {
    search: function (query, limit) {
      return active().search(query, limit);
    },
    getAlbum: function (albumId) {
      return active().getAlbum(albumId);
    },
    getArtist: function (artistId) {
      return active().getArtist(artistId);
    },
    getArtistTop: function (artistId, limit) {
      return active().getArtistTop(artistId, limit);
    },
    getArtistAlbums: function (artistId) {
      return active().getArtistAlbums(artistId);
    },
    getTrack: function (trackId) {
      return active().getTrack(trackId);
    },
    resolveStream: function (track) {
      return providerFor(track).resolveStream(track);
    },
    getProvider: function () {
      return currentProvider;
    },
    getProviderInfo: getProviderInfo,
    setProvider: setProvider,
    listProviders: function () {
      return Object.keys(PROVIDERS).map(function (id) {
        return getProviderInfo(id);
      });
    },
    isFullTracks: function () {
      return active().supportsFullTracks;
    }
  };

  Object.defineProperty(api, 'config', {
    get: function () {
      return getProviderInfo();
    }
  });

  window.MusicApi = api;
})();
