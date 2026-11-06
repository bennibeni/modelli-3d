import { describe, expect, it } from "vitest";
import {
  CATALOG,
  buildModels,
  megabytes,
  modelUrl,
  sortBySize,
} from "./models";

const BLOB = "https://abc.public.blob.vercel-storage.com/models";

describe("elenco dei modelli", () => {
  it("legge le dimensioni con la virgola decimale", () => {
    expect(megabytes({ size: "8,6 MB" })).toBe(8.6);
    expect(megabytes({ size: "523,8 MB" })).toBe(523.8);
  });

  it("va dal più leggero al più pesante", () => {
    const sizes = buildModels().map(megabytes);
    expect(sizes).toEqual([...sizes].sort((a, b) => a - b));
    expect(buildModels()[0].label).toBe("Modello originale");
  });

  it("non modifica l'elenco di partenza", () => {
    const list = [{ size: "2 MB" }, { size: "1 MB" }];
    sortBySize(list);
    expect(list[0].size).toBe("2 MB");
  });

  it("ha file unici", () => {
    const files = CATALOG.map((item) => item.file);
    expect(new Set(files).size).toBe(files.length);
    files.forEach((file) => expect(file).toMatch(/^[\w-]+\.glb$/));
  });

  it("tiene nell'app solo il modello originale", () => {
    const local = CATALOG.filter((item) => !item.remote);
    expect(local.map((item) => item.file)).toEqual(["model.glb"]);
  });

  it("senza indirizzo Blob legge tutto da public/models", () => {
    buildModels().forEach((item) =>
      expect(item.url).toBe(`/models/${item.file}`),
    );
  });

  it("con l'indirizzo Blob legge da lì solo i modelli remoti", () => {
    const models = buildModels(`${BLOB}/`);
    for (const item of models) {
      expect(item.url).toBe(
        item.remote ? `${BLOB}/${item.file}` : `/models/${item.file}`,
      );
    }
    expect(modelUrl({ file: "model.glb" }, BLOB)).toBe("/models/model.glb");
  });
});
