# Modelli 3D

App React con Next.js App Router, estratta dalla pagina R01 di Next14.
Un visualizzatore three.js per modelli GLB con texture incorporate: si sceglie
il modello dalla tendina, lo si ruota, ingrandisce e guarda a tutto schermo.
Sui modelli con scheletro si possono provare il movimento di prova e
l'apertura delle gambe.

## Avvio

Richiede Node.js 22.12 o successivo e npm. In locale non richiede chiavi API né file `.env`.

```powershell
cd "C:\Users\torre\Desktop\I miei progetti\Modelli 3D"
npm ci
npm run dev
```

Apri l'indirizzo indicato nel terminale (normalmente `http://localhost:3000`).
Per usare un'altra porta: `npm run dev -- --port 3113`.

## Comandi

| Comando                 | Azione                                    |
| ----------------------- | ----------------------------------------- |
| `npm run dev`           | Server di sviluppo                        |
| `npm run build`         | Build di produzione                       |
| `npm start`             | Avvia la build di produzione              |
| `npm test`              | Test dell'elenco dei modelli              |
| `npm run test:watch`    | Test durante lo sviluppo                  |
| `npm run lint`          | Controlla JavaScript e React              |
| `npm run lint:a11y`     | Include le regole di accessibilità        |
| `npm run format`        | Applica Prettier                          |
| `npm run format:check`  | Verifica la formattazione                 |
| `npm run check`         | Formattazione, accessibilità, test, build |
| `npm run upload-models` | Carica i modelli remoti su Vercel Blob    |

## Come si usa

- **Modello**: la tendina elenca i modelli dal più leggero al più pesante.
  All'avvio si apre il «Modello originale» (8,6 MB); viene scaricato solo il
  modello scelto, con la percentuale di avanzamento.
- **Vista**: trascina per ruotare, rotella per lo zoom, tasto destro per
  spostare; oppure i pulsanti Ripristina vista, Ruota, Avvicina, Allontana e
  Rotazione automatica. «Tutto schermo» ingrandisce la sezione.
- **Prova movimento**: compare se il modello ha un'animazione; la clip
  `Respiro_di_prova` è amplificata perché si veda bene.
- **Apertura gambe** (0–180°): compare sui modelli con le ossa `Castell_*`;
  il bacino si abbassa mentre le gambe si aprono.

## Struttura

- `src/app/`: pagina, layout, metadati, icona e stili globali con il footer.
- `src/components/modelli/`:
  - `ModelViewer.jsx`, `ModelViewer.css`: visualizzatore e controlli.
  - `models.js`: elenco dei modelli e ordinamento per dimensione (testato).
  - `loadModel.js`: download con avanzamento e liberazione della memoria.
  - `legSpread.js`: apertura delle gambe sullo scheletro `Castell_*`.
  - `movementPreview.js`: amplificazione del movimento di prova.
- `public/models/`: `model.glb` (nell'app) e, solo in locale, gli altri cinque.
- `src/proxy.js`: accesso con password (Basic Auth), con i test.
- `scripts/upload-models.mjs`: caricamento dei modelli remoti su Vercel Blob.

## Modelli su Vercel Blob

Nell'app (e su GitHub) resta solo `public/models/model.glb`. Gli altri cinque
modelli, segnati `remote: true` in `models.js`, stanno su
[Vercel Blob](https://vercel.com/docs/vercel-blob): due superano il limite di
100 MB per file di GitHub e del piano Hobby di Vercel.

- **In locale** i cinque file restano in `public/models/` (sono esclusi da git
  con `.gitignore` e dai deploy con `.vercelignore`). Senza
  `NEXT_PUBLIC_MODELS_URL` l'app li legge da lì e non consuma traffico Blob.
- **Online** la variabile `NEXT_PUBLIC_MODELS_URL` (es.
  `https://xxxx.public.blob.vercel-storage.com/models`) fa scaricare i modelli
  remoti da Blob. Si legge al momento della build: dopo averla cambiata serve
  un nuovo deploy.

### Primo caricamento

1. Su Vercel: **Storage → Create Database → Blob**, accesso **Public**, e
   collega lo store al progetto.
2. Copia `.env.example` in `.env.local` e incolla il valore di
   `BLOB_READ_WRITE_TOKEN` dalla pagina dello store.
3. `npm run upload-models`: carica i cinque file in `models/` sullo store
   (salta quelli già presenti con la stessa dimensione; `-- --force` li
   ricarica) e stampa l'indirizzo della cartella.
4. Nel progetto Vercel, **Settings → Environment Variables**: aggiungi
   `NEXT_PUBLIC_MODELS_URL` con quell'indirizzo, poi fai un nuovo deploy.

Con il piano Hobby Blob è gratuito entro 1 GB di spazio (i cinque modelli ne
occupano 831 MB) e 10 GB di traffico al mese; oltre, Vercel avvisa ma non
addebita nulla.

## Accesso con password

Come in Moderna, `src/proxy.js` protegge con Basic Auth tutte le richieste al
sito: pagina, file statici e `model.glb`. Su Vercel, in **Settings →
Environment Variables**, imposta `SITE_AUTH_USER` (predefinito `torre`) e
`SITE_AUTH_PASSWORD` per Production e Preview, poi fai un nuovo deploy. Non
usare il prefisso `NEXT_PUBLIC_` e non mettere le credenziali nel repository.

- Su Vercel, senza password il sito risponde 503 (accesso non configurato).
- In locale, senza password l'accesso resta libero; per provarla imposta le
  stesse variabili in `.env.local` e riavvia il server.
- I modelli su Blob sono pubblici: la password protegge il sito, non i file
  sullo store, che restano scaricabili da chi ne conosce l'indirizzo esatto.
- La protezione vale dai nuovi deploy: quelli precedenti vanno rimossi o
  protetti nelle impostazioni Vercel.

Il footer **All projects** rimanda all'[indice degli altri progetti](https://links-page-bennibeni.vercel.app/),
come negli altri progetti recenti.
