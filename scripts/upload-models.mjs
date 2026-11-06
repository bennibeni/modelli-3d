// Carica su Vercel Blob i modelli segnati «remote» in models.js, leggendoli
// da public/models. Uso (una volta, dalla cartella del progetto):
//
//   npm run upload-models            salta i file già caricati con la stessa dimensione
//   npm run upload-models -- --force li ricarica tutti
//
// Credenziali in .env.local, scritte da `npx vercel env pull`: BLOB_STORE_ID e
// VERCEL_OIDC_TOKEN (stores collegati di recente) oppure BLOB_READ_WRITE_TOKEN.
import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import path from "node:path";
import { BlobNotFoundError, head, put } from "@vercel/blob";
import { CATALOG, sortBySize } from "../src/components/modelli/models.js";

const FOLDER = "models";
const SOURCE = path.join(process.cwd(), "public", "models");
const force = process.argv.includes("--force");

const env = process.env;
if (
  !env.BLOB_READ_WRITE_TOKEN &&
  !(env.BLOB_STORE_ID && env.VERCEL_OIDC_TOKEN)
) {
  console.error(
    "Mancano le credenziali di Blob. Esegui prima:\n" +
      "  npx vercel link\n" +
      "  npx vercel env pull .env.local\n" +
      "(lo store deve essere collegato al progetto anche per Development)",
  );
  process.exit(1);
}

const mb = (bytes) => `${(bytes / 1e6).toFixed(1).replace(".", ",")} MB`;
let base = "";

// Dal più leggero: i file piccoli arrivano subito, la Guerriera per ultima.
for (const item of sortBySize(CATALOG.filter((entry) => entry.remote))) {
  const file = path.join(SOURCE, item.file);
  const pathname = `${FOLDER}/${item.file}`;
  let size;
  try {
    ({ size } = await stat(file));
  } catch {
    console.error(`✗ ${item.file}: non trovato in public/models`);
    process.exitCode = 1;
    continue;
  }

  if (!force) {
    try {
      const existing = await head(pathname);
      if (existing.size === size) {
        console.log(`= ${item.file}: già su Blob (${mb(size)})`);
        base ||= existing.url.slice(0, existing.url.lastIndexOf("/"));
        continue;
      }
    } catch (error) {
      if (!(error instanceof BlobNotFoundError)) throw error;
    }
  }

  const started = Date.now();
  let last = -1;
  const show = (loaded) => {
    const seconds = Math.round((Date.now() - started) / 1000);
    process.stdout.write(
      `\r↑ ${item.file}: ${mb(loaded)} di ${mb(size)} · ${seconds} s   `,
    );
  };
  show(0);
  const timer = setInterval(() => show(Math.max(last, 0)), 5000);
  const blob = await put(pathname, createReadStream(file), {
    access: "public",
    addRandomSuffix: false,
    allowOverwrite: true,
    multipart: true,
    contentType: "model/gltf-binary",
    cacheControlMaxAge: 60 * 60 * 24 * 365,
    onUploadProgress: ({ loaded }) => {
      last = loaded;
      show(loaded);
    },
  }).finally(() => clearInterval(timer));
  console.log(`\r✓ ${item.file}: caricato (${mb(size)})      `);
  base ||= blob.url.slice(0, blob.url.lastIndexOf("/"));
}

if (base) {
  console.log("\nIndirizzo da mettere in NEXT_PUBLIC_MODELS_URL su Vercel:");
  console.log(base);
}
