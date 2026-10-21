<h1 align="center">
    <img src="https://readme-typing-svg.herokuapp.com/?font=Iosevka&size=24&color=1DB954&center=true&vCenter=true&width=1200&height=60&lines=🎵+Spotify+Clone+|+La+tua+musica%2C+ovunque+tu+sia+🎧&loop=false" alt="🎵 Spotify Clone | La tua musica, ovunque tu sia 🎧">
</h1>

Un'elegante replica dell'interfaccia di Spotify che permette di cercare artisti, visualizzare album e riprodurre anteprime di brani utilizzando l'API di Deezer.

![Spotify Clone](img/cover_d.jpg)

**👉 [Visualizza la versione live del progetto](https://4-1-build-week-ch-1.vercel.app/)**

## 📋 Descrizione

Questo progetto è un clone di Spotify che replica l'esperienza utente dell'app originale. È interamente client-side, senza framework applicativi né build step: HTML, CSS e JavaScript vanilla con Bootstrap per il layout. I dati arrivano dall'API di Deezer tramite il proxy didattico di Strive School.

## 🚀 Tecnologie Utilizzate

- **HTML5**: struttura semantica delle pagine
- **CSS3**: stile, layout a griglia e media query
- **JavaScript (ES6+)**: logica di interazione, chiamate API e player audio
- **Bootstrap 5**: griglia, componenti e utilità responsive
- **Bootstrap Icons**: set di icone
- **Fetch API + AbortController**: richieste asincrone con timeout
- **localStorage**: persistenza di like, album salvati, artisti seguiti, volume, shuffle e repeat
- **Media Session API**: controlli multimediali da lock screen e tasti del dispositivo

## ⚙️ Caratteristiche

- Ricerca di album, artisti e generi con debounce, sia su desktop sia su mobile
- Riproduzione di anteprime audio con player condiviso tra tutte le pagine
- Play/pausa, brano successivo e precedente, seek sulla barra di avanzamento
- Shuffle e repeat (off / playlist / singolo brano) realmente funzionanti
- Controllo del volume con mute e memoria dell'ultimo livello
- Like dei brani e salvataggio di album e artisti, persistiti nel browser
- Pagina artista con brani più ascoltati e discografia
- Pagina album con tracklist completa, durata totale e copyright
- Mini player e navigazione inferiore su mobile, con sidebar a scomparsa
- Salto automatico al brano successivo e gestione dei brani senza anteprima
- Layout responsive con breakpoint a 1200, 992, 768 e 576 px
- Messaggi di errore e stati di caricamento espliciti

## 🛠️ Installazione

```bash
# Clona il repository
git clone https://github.com/henry8913/4.1_Build-Week-CH1.git

# Entra nella cartella
cd 4.1_Build-Week-CH1

# Avvia un server locale (consigliato: il progetto usa fetch)
python3 -m http.server 8000
```

Poi apri [http://localhost:8000](http://localhost:8000) nel browser. In alternativa puoi usare l'estensione Live Server di VS Code.

## 🖥️ Utilizzo

- **Home**: album in evidenza, ascolti recenti, selezione di album e brani in tendenza
- **Pagina Artista**: brani popolari e discografia, con pulsante "Segui"
- **Pagina Album**: tracklist, pulsante Play e salvataggio dell'album
- **Cerca**: ricerca libera, categorie sfogliabili e risultati riproducibili
- **Player**: barra fissa su desktop, mini player su mobile

## 📸 Screenshot

![Spotify Clone Mobile](img/screenshot.png)

## 💻 Struttura del Progetto

```
4.1_Build-Week-CH1/
├── css/
│   ├── style.css       # Stili globali, layout e responsive
│   ├── player.css      # Player desktop e mini player mobile
│   ├── album.css       # Pagina album
│   ├── artist.css      # Pagina artista
│   └── search.css      # Pagina di ricerca
├── js/
│   ├── utils.js        # Utility condivise (escaping, API, storage)
│   ├── layout.js       # Sidebar, header, colonna amici e player
│   ├── player.js       # Motore audio e controlli
│   ├── script.js       # Home
│   ├── album.js        # Pagina album
│   ├── artist.js       # Pagina artista
│   └── search.js       # Pagina di ricerca
├── img/                # Immagini e risorse
├── index.html          # Homepage
├── album.html          # Pagina album
├── artist.html         # Pagina artista
├── search.html         # Pagina di ricerca
└── README.md
```

### Note tecniche

- `js/layout.js` inietta sidebar, header, colonna amici e player bar in tutte le pagine, così il markup condiviso esiste in un solo posto.
- `js/utils.js` centralizza escaping HTML, chiamate API, formattazione e persistenza.
- Tutti i dati provenienti dall'API e le query utente vengono escapati prima di essere inseriti nel DOM.
- L'anteprima audio fornita da Deezer dura circa 30 secondi: è una limitazione del servizio, non del player.

### Limiti noti

- L'API è raggiunta tramite un proxy non ufficiale (`striveschool-api.herokuapp.com`), senza SLA: se il servizio non risponde, le sezioni mostrano un errore.
- Le playlist personali, la libreria e il profilo utente sono ancora segnaposto.
- Non sono presenti test automatici né pipeline CI.

## 🤝 Contributi

Le contribuzioni sono sempre benvenute! Apri una **issue** o invia un **pull request** per suggerire modifiche.

### 👨‍💻 Contributori

- [PaolaTaralloo](https://github.com/PaolaTaralloo)
- [SPIRIDION](https://github.com/SPIRIDION)
- [majoralpaca984](https://github.com/majoralpaca984)
- [henry8913](https://github.com/henry8913)
- [SilkySmooth91](https://github.com/SilkySmooth91)

---

## 👤 Autori

Progetto demo creato da [Team 1 - 4.1 Build Week CH1](https://4-1-build-week-ch-1.vercel.app/) per scopi didattici.

## 📝 Licenza

Questo progetto è distribuito sotto licenza [MIT](LICENSE.txt). Vedi il file `LICENSE.txt` per ulteriori dettagli.
