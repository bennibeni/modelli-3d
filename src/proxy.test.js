import { afterEach, expect, it, vi } from "vitest";
import { proxy } from "./proxy";

afterEach(() => vi.unstubAllEnvs());

const request = (path, credentials) =>
  new Request(`https://modelli.example${path}`, {
    headers: credentials
      ? {
          authorization: `Basic ${Buffer.from(credentials).toString("base64")}`,
        }
      : {},
  });

it.each(["/", "/models/model.glb", "/icon.svg", "/_next/static/test.js"])(
  "protegge %s e permette solo credenziali corrette",
  (path) => {
    vi.stubEnv("SITE_AUTH_USER", "test");
    vi.stubEnv("SITE_AUTH_PASSWORD", "password:con:due-punti");
    expect(proxy(request(path)).status).toBe(401);
    expect(proxy(request(path, "test:errata")).status).toBe(401);
    const allowed = proxy(request(path, "test:password:con:due-punti"));
    expect(allowed.headers.get("x-middleware-next")).toBe("1");
    expect(allowed.headers.get("cache-control")).toBe("private, no-store");
  },
);

it("chiede le credenziali al browser", () => {
  vi.stubEnv("SITE_AUTH_PASSWORD", "secret");
  expect(proxy(request("/")).headers.get("www-authenticate")).toContain(
    "Basic",
  );
});

it("blocca Vercel senza password e consente lo sviluppo locale", () => {
  vi.stubEnv("SITE_AUTH_PASSWORD", "");
  vi.stubEnv("VERCEL", "1");
  expect(proxy(request("/")).status).toBe(503);
  vi.stubEnv("VERCEL", "");
  expect(proxy(request("/")).headers.get("x-middleware-next")).toBe("1");
});

it("usa torre come utente predefinito e rifiuta header malformati", () => {
  vi.stubEnv("SITE_AUTH_PASSWORD", "secret");
  vi.stubEnv("SITE_AUTH_USER", "");
  expect(proxy(request("/", "torre:secret")).status).not.toBe(401);
  expect(proxy(request("/", "altro:secret")).status).toBe(401);
  for (const authorization of ["Basic !!!", "Bearer token", "Basic dGVzdA=="]) {
    const response = proxy(
      new Request("https://modelli.example", { headers: { authorization } }),
    );
    expect(response.status).toBe(401);
  }
});
