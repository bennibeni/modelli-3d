// Carica su Vercel Blob i modelli segnati «remote» in models.js, leggendoli
// da public/models. Uso (una volta, dalla cartella del progetto):
//
//   npm run upload-models            salta i file già caricati con la stessa dimensione
//   npm run upload-models -- --force li ricarica tutti
//
// Serve BLOB_READ_WRITE_TOKEN in .env.local (vedi .env.example e README).
import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import path from "node:path";
import { BlobNotFoundError, head, put } from "@vercel/blob";
import { CATALOG } from "../src/components/modelli/models.js";

const FOLDER = "models";
const SOURCE = path.join(process.cwd(), "public", "models");
const force = process.argv.includes("--force");

if (!process.env.BLOB_READ_WRITE_TOKEN) {
  console.error(
    "Manca BLOB_READ_WRITE_TOKEN: copialo dallo store Blob su Vercel in .env.local.",
  );
  process.exit(1);
}

const mb = (bytes) => `${(bytes / 1e6).toFixed(1).replace(".", ",")} MB`;
let base = "";

for (const item of CATALOG.filter((entry) => entry.remote)) {
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

  let last = -1;
  const blob = await put(pathname, createReadStream(file), {
    access: "public",
    addRandomSuffix: false,
    allowOverwrite: true,
    multipart: true,
    contentType: "model/gltf-binary",
    cacheControlMaxAge: 60 * 60 * 24 * 365,
    onUploadProgress: ({ percentage }) => {
      const step = Math.floor(percentage / 10) * 10;
      if (step > last) {
        last = step;
        process.stdout.write(`\r↑ ${item.file}: ${step}%   `);
      }
    },
  });
  console.log(`\r✓ ${item.file}: caricato (${mb(size)})      `);
  base ||= blob.url.slice(0, blob.url.lastIndexOf("/"));
}

if (base) {
  console.log("\nIndirizzo da mettere in NEXT_PUBLIC_MODELS_URL su Vercel:");
  console.log(base);
}
