// ===================================================
// ADATTATORE API MUSICALE
// ===================================================
// Tutte le chiamate al servizio musicale passano da qui.
// Le pagine ricevono sempre lo stesso modello normalizzato
// (Track / Album / Artist), quindi per cambiare provider
// basta riscrivere questo file.
//
// Modello Track:
//   { id, title, artist:{id,name}, album:{id,title,cover,coverSmall},
//     duration, streamUrl, preview, provider }
//
// streamUrl e' l'URL riproducibile. Oggi contiene l'anteprima
// Deezer; con un provider che espone i brani completi basta
// restituire qui l'URL completo.
// ===================================================

(function () {
  'use strict';

  const DEFAULT_COVER = 'img/cover_c.jpg';

  const config = {
    provider: 'deezer',
    baseUrl: 'https://striveschool-api.herokuapp.com/api/deezer',
    supportsFullTracks: false,
    requestTimeout: 12000
  };

  // ---------------------------------------------------
  // RICHIESTE
  // ---------------------------------------------------

  async function request(path) {
    const controller = new AbortController();
    const timeoutId = setTimeout(function () {
      controller.abort();
    }, config.requestTimeout);

    try {
      const response = await fetch(config.baseUrl + path, { signal: controller.signal });
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
  // NORMALIZZAZIONE
  // ---------------------------------------------------

  function coverOf(object) {
    if (!object) return DEFAULT_COVER;
    return object.cover_big || object.cover_medium || object.cover_small ||
      object.cover || object.picture_big || object.picture_medium || DEFAULT_COVER;
  }

  function smallCoverOf(object) {
    if (!object) return DEFAULT_COVER;
    return object.cover_small || object.cover_medium || object.cover ||
      object.cover_big || DEFAULT_COVER;
  }

  function normalizeTrack(raw, context) {
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
        cover: coverOf(albumRaw),
        coverSmall: smallCoverOf(albumRaw)
      },
      duration: Number(raw.duration) || 0,
      streamUrl: streamUrl,
      preview: streamUrl,
      provider: config.provider
    };
  }

  function normalizeAlbum(raw, fallbackArtist) {
    if (!raw) return null;

    const artist = raw.artist || fallbackArtist || {};
    const rawTracks = raw.tracks && Array.isArray(raw.tracks.data) ? raw.tracks.data : [];

    const tracks = rawTracks.map(function (track) {
      return normalizeTrack(track, { album: raw, artist: artist });
    });

    return {
      id: raw.id !== undefined && raw.id !== null ? String(raw.id) : '',
      title: raw.title || 'Album senza titolo',
      cover: coverOf(raw),
      coverSmall: smallCoverOf(raw),
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
  }

  function normalizeArtist(raw) {
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
  }

  // ---------------------------------------------------
  // CATALOGO
  // ---------------------------------------------------

  async function search(query, limit) {
    const params = new URLSearchParams({ q: query });
    if (limit) params.set('limit', limit);
    const data = await request('/search?' + params.toString());
    return (data.data || []).map(function (item) {
      return normalizeTrack(item);
    });
  }

  async function getAlbum(albumId) {
    const data = await request('/album/' + encodeURIComponent(albumId));
    return normalizeAlbum(data);
  }

  async function getArtist(artistId) {
    const data = await request('/artist/' + encodeURIComponent(artistId));
    return normalizeArtist(data);
  }

  async function getArtistTop(artistId, limit) {
    const data = await request('/artist/' + encodeURIComponent(artistId) + '/top?limit=' + (limit || 5));
    return (data.data || []).map(function (track) {
      return normalizeTrack(track);
    });
  }

  async function getArtistAlbums(artistId) {
    const data = await request('/artist/' + encodeURIComponent(artistId) + '/albums');
    return (data.data || []).map(function (album) {
      return normalizeAlbum(album);
    });
  }

  // Scarica i dati aggiornati di un brano (usato per rinnovare
  // le anteprime scadute dei brani salvati nei preferiti).
  async function getTrack(trackId) {
    const data = await request('/track/' + encodeURIComponent(trackId));
    return normalizeTrack(data);
  }

  function isStreamExpired(url) {
    if (!url) return true;
    const match = /[?&]exp=(\d+)/.exec(url);
    if (!match) return false;
    return Number(match[1]) * 1000 <= Date.now() + 60000;
  }

  // Restituisce un URL riproducibile e aggiornato per il brano.
  async function resolveStream(track) {
    if (!track) throw new Error('Brano non valido');
    if (track.streamUrl && !isStreamExpired(track.streamUrl)) return track.streamUrl;

    if (!track.id) throw new Error('Brano senza anteprima disponibile');

    const fresh = await getTrack(track.id);
    if (!fresh || !fresh.streamUrl) throw new Error('Anteprima non disponibile');

    track.streamUrl = fresh.streamUrl;
    track.preview = fresh.streamUrl;
    track.duration = fresh.duration || track.duration;
    return fresh.streamUrl;
  }

  window.MusicApi = {
    config: config,
    normalizeTrack: normalizeTrack,
    normalizeAlbum: normalizeAlbum,
    normalizeArtist: normalizeArtist,
    search: search,
    getAlbum: getAlbum,
    getArtist: getArtist,
    getArtistTop: getArtistTop,
    getArtistAlbums: getArtistAlbums,
    getTrack: getTrack,
    resolveStream: resolveStream,
    isStreamExpired: isStreamExpired
  };
})();
