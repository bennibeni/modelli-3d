# Modelli 3D

App autonoma React/Next.js estratta da `Next14/src/app/rxx/R01`.
Usa JavaScript (JSX), CSS semplice e three.js senza React Three Fiber.

- L'elenco dei modelli è in `src/components/modelli/models.js`. Solo
  `model.glb` è nell'app; i modelli `remote: true` stanno su Vercel Blob
  (`NEXT_PUBLIC_MODELS_URL`, caricati con `npm run upload-models`) e in locale
  in `public/models/`, esclusi da git e dai deploy. Non togliere quelle regole
  da `.gitignore`/`.vercelignore`: due file superano i 100 MB.
- La tendina va dal più leggero al più pesante (ordine calcolato dalla
  dimensione indicata), e il primo si apre all'avvio.
- Si scarica solo il modello scelto (`fetchModel` in `loadModel.js`); cambiando
  scelta il download in corso si interrompe e il modello precedente viene
  liberato con `disposeModel`.
- La scena (`ModelViewer.jsx`) è imperativa: i pulsanti chiamano i metodi in
  `viewerRef`. Non mettere in stato React i fotogrammi delle animazioni.
- `legSpread.js` funziona solo sui modelli con le ossa `Castell_Thigh_L/R`,
  `Castell_Knee_L/R` e `Castell_Hips`; altrimenti i controlli non compaiono.
- `movementPreview.js` amplifica la clip `Respiro_di_prova` rispetto alla posa
  iniziale; le altre clip restano invariate.
- Non introdurre dipendenze dal progetto Next14.
- Conservare il footer con link `https://links-page-bennibeni.vercel.app/`.
- Leggere i documenti pertinenti in `node_modules/next/dist/docs/` prima di
  modificare routing, layout o configurazione Next.js.
- Eseguire `npm run check` dopo modifiche sostanziali.
