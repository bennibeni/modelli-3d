// Elenco dei modelli. Il «Modello originale» sta nell'app (public/models); gli
// altri, troppo grandi per GitHub, stanno su Vercel Blob. La variabile
// NEXT_PUBLIC_MODELS_URL contiene l'indirizzo della cartella su Blob
// (es. https://xxxx.public.blob.vercel-storage.com/models). Se manca, anche i
// modelli remoti si leggono da public/models: comodo in locale, dove i file ci
// sono già, e non consuma il traffico gratuito di Blob.
//
// La dimensione serve sia all'etichetta della tendina sia all'ordine: dal più
// leggero al più pesante, e il primo è quello che si apre all'avvio.
export const CATALOG = [
  {
    file: "female-warrior-rigged.glb",
    label: "Guerriera con scheletro",
    size: "523,8 MB",
    remote: true,
  },
  {
    file: "sigma-girl-reconstructed-rigged.glb",
    label: "Sigma Girl ricostruita, senza abiti",
    size: "36,5 MB",
    remote: true,
  },
  {
    file: "sigma-girl-rigged.glb",
    label: "Sigma Girl con scheletro",
    size: "72,5 MB",
    remote: true,
  },
  { file: "model.glb", label: "Modello originale", size: "8,6 MB" },
  {
    file: "forest-goddess-static.glb",
    label: "Forest Goddess (statico)",
    size: "120,8 MB",
    remote: true,
  },
  {
    file: "the-girl-static.glb",
    label: "The Girl (statico)",
    size: "77,3 MB",
    remote: true,
  },
];

// "8,6 MB" → 8.6
export function megabytes(item) {
  return Number.parseFloat(item.size.replace(",", "."));
}

export function sortBySize(list) {
  return [...list].sort((a, b) => megabytes(a) - megabytes(b));
}

// Indirizzo da cui scaricare il modello.
export function modelUrl(item, remoteBase) {
  const base =
    item.remote && remoteBase ? remoteBase.replace(/\/+$/, "") : "/models";
  return `${base}/${item.file}`;
}

export function buildModels(remoteBase) {
  return sortBySize(CATALOG).map((item) => ({
    ...item,
    url: modelUrl(item, remoteBase),
  }));
}

// Next sostituisce process.env.NEXT_PUBLIC_* al momento della build.
export const MODELS = buildModels(process.env.NEXT_PUBLIC_MODELS_URL);
