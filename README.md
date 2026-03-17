# CV – Eldar Dedic

Un portfolio interattivo ispirato a Windows 95, caratterizzato da una scena 3D introduttiva in cui un computer funge da portale d’ingresso verso il curriculum.

Il modello 3D è stato realizzato da zero utilizzando Blender ed esportato in formato GLB. L’estetica si ispira a videogiochi low-poly come Half-Life e Crow Country

Anche il wallpaper del desktop è stato progettato da zero in pixel art con Aseprite ed esportato in formato PNG, contribuendo a rafforzare la coerenza visiva del progetto.

Dal punto di vista tecnico, il progetto integra Three.js per la gestione della scena 3D e GSAP per le animazioni, con l’obiettivo di sperimentare l’interazione utente in un ambiente dinamico.

L’obiettivo principale è mettere in pratica le competenze di modellazione 3D acquisite con Blender, combinandole con tecnologie web per creare un’esperienza interattiva e narrativa.

---

## Dimostrazione

> Clicca sullo schermo del computer 3D per avviare il "boot" → esplora il desktop Windows 95 → apri con doppio click le icone per le finestre CV e GitHub.

---

## Struttura del progetto

```
/
├── index.html              # Markup principale (scena 3D + desktop Win95)
├── main.js                 # Scena Three.js, caricamento GLB, animazioni camera
├── desktop.js              # UI desktop: finestre, taskbar, icone, start menu
├── style.css               # Stile Windows 95 + layout CV
└── assets/
    ├── computer.glb        # Modello 3D del computer vintage
    ├── Beach_resize.png    # Wallpaper del desktop
    └── Eldar_Dedic_cv_dev.pdf  # CV scaricabile
```

---

## Funzionalità

### Scena 3D
- Modello 3D caricato via **Three.js** con `GLTFLoader`
- Controlli orbitali (`OrbitControls`): rotazione, zoom, damping
- Animazioni del modello riprodotte in loop tramite `AnimationMixer`
- **Raycasting** sul mesh `Monitor`: al click sullo schermo si avvia la transizione
- Animazione camera con **GSAP** (`power2.inOut`) che si avvicina allo schermo
- Schermata BIOS con barra di avanzamento prima del boot del desktop

### Desktop Windows 95
- **Icone trascinabili** liberamente all'interno del desktop
- **Finestre** con drag, minimize, maximize/restore, close
- **Taskbar** con orologio in tempo reale e pulsanti delle app aperte
- **Start menu** con pulsante Log Out che riporta alla scena 3D
- **Menu File** nella finestra CV con download diretto del PDF
- Doppio click sulle icone per aprire le finestre
- Gestione z-index per portare in primo piano la finestra attiva

---

## Avvio del progetto

Il progetto è **statico** e non richiede build. È sufficiente servirlo con un server HTTP locale (il caricamento del GLB richiede `http://`, non `file://`):

```bash
# Con Python
python3 -m http.server 8080

# Con Node.js (npx)
npx serve .

# Con VS Code
# Usare l'estensione "Live Server"
```

Poi aprire [http://localhost:8080](http://localhost:8080) nel browser.

---

## Tecnologie

| Tecnologia | Utilizzo |
|---|---|
| [Three.js](https://threejs.org/) `v0.160` | Scena 3D, caricamento GLB, raycasting |
| [GSAP](https://gsap.com/) `v3.12` | Animazioni camera e barra BIOS |
| [98.css](https://jdan.github.io/98.css/) | Stile Windows 98/95 nativo |
| HTML / CSS / JS vanilla | UI desktop, finestre, drag & drop |

Nessun bundler, nessuna dipendenza da installare — tutto via **CDN** e **import map**.

---

## Assets richiesti

Assicurarsi di avere nella cartella `assets/` i seguenti file prima di avviare:

| File | Descrizione |
|---|---|
| `computer.glb` | Modello 3D del computer (mesh `Monitor` richiesta per il raycasting) |
| `Beach_resize.png` | Wallpaper del desktop |
| `Eldar_Dedic_cv_dev.pdf` | CV da rendere scaricabile |

---

## Personalizzazione

### Orientamento del modello 3D
In `main.js`, subito dopo il caricamento del GLB, la rotazione del modello è configurabile:
```js
gltf.scene.rotation.y = -Math.PI / 2; // 90° a destra per avere lo schermo frontale
```
Valori alternativi: `Math.PI` (180°) · `Math.PI / 2` (90° a sinistra)

### Contenuto del CV
Tutto il testo del curriculum è inline in `index.html` nella sezione `#cvWindow`. Modificare direttamente l'HTML per aggiornare esperienze, skills e contatti.

### Wallpaper
Sostituire `assets/Beach_resize.png` con qualsiasi immagine e aggiornare il riferimento in `style.css`:
```css
background: url('./assets/Beach_resize.png') center / cover no-repeat;
```

---

## Autore

**Eldar Dedic** — Junior Python Developer  
[eldardedic@proton.me](mailto:eldardedic@proton.me)  
[github.com/breama-oss](https://github.com/breama-oss)