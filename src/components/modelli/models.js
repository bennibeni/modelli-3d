// Elenco dei modelli. Il «Modello originale» sta nell'app (public/models); gli
// altri, troppo grandi per GitHub, stanno su Vercel Blob. La variabile
// NEXT_PUBLIC_MODELS_URL contiene l'indirizzo della cartella su Blob
// (es. https://xxxx.public.blob.vercel-storage.com/models). Se manca, anche i
// modelli remoti si leggono da public/models: comodo in locale, dove i file ci
// sono già, e non consuma il traffico gratuito di Blob.
//
// La dimensione serve sia all'etichetta della tendina sia all'ordine: prima il
// modello nell'app, che si apre all'avvio, poi i remoti dal più leggero.
export const CATALOG = [
  {
    file: "female-warrior-rigged.glb",
    label: "Guerriera con scheletro",
    size: "75,6 MB",
    remote: true,
  },
  {
    file: "sigma-girl-reconstructed-rigged.glb",
    label: "Sigma Girl ricostruita, senza abiti",
    size: "7,6 MB",
    remote: true,
  },
  {
    file: "sigma-girl-rigged.glb",
    label: "Sigma Girl con scheletro",
    size: "15,7 MB",
    remote: true,
  },
  { file: "model.glb", label: "Modello originale", size: "8,6 MB" },
  {
    file: "forest-goddess-static.glb",
    label: "Forest Goddess (statico)",
    size: "41,0 MB",
    remote: true,
  },
  {
    file: "sigma-girl-v2-static.glb",
    label: "Sigma Girl 2 (statico)",
    size: "14,0 MB",
    remote: true,
  },
  {
    file: "cute-girl-static.glb",
    label: "Cute Girl (statico)",
    size: "18,1 MB",
    remote: true,
  },
  {
    file: "the-girl-static.glb",
    label: "The Girl (statico)",
    size: "15,5 MB",
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

// Il modello nell'app viene per primo (si apre all'avvio senza toccare Blob),
// poi i remoti dal più leggero al più pesante.
export function buildModels(remoteBase) {
  const local = CATALOG.filter((item) => !item.remote);
  const remote = sortBySize(CATALOG.filter((item) => item.remote));
  return [...local, ...remote].map((item) => ({
    ...item,
    url: modelUrl(item, remoteBase),
  }));
}

// Next sostituisce process.env.NEXT_PUBLIC_* al momento della build.
export const MODELS = buildModels(process.env.NEXT_PUBLIC_MODELS_URL);
