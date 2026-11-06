import { createHash, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";

// Basic Auth come in Moderna. Nessun matcher: pagina, file statici e
// public/models/model.glb richiedono tutti la password. I modelli su Vercel
// Blob stanno su un altro dominio e non passano di qui.
function equal(value, expected) {
  const digest = (text) => createHash("sha256").update(text).digest();
  return timingSafeEqual(digest(value), digest(expected));
}

export function proxy(request) {
  const password = process.env.SITE_AUTH_PASSWORD;
  if (!password) {
    // Su Vercel una password mancante blocca il sito; in locale resta libero.
    if (process.env.VERCEL === "1") {
      return new Response("Accesso non configurato.", {
        status: 503,
        headers: { "Cache-Control": "private, no-store" },
      });
    }
    return NextResponse.next();
  }

  const header = request.headers.get("authorization") ?? "";
  const match = /^Basic ([A-Za-z0-9+/]+={0,2})$/i.exec(header);
  if (match) {
    const decoded = Buffer.from(match[1], "base64").toString("utf8");
    const separator = decoded.indexOf(":");
    if (separator >= 0) {
      const userMatches = equal(
        decoded.slice(0, separator),
        process.env.SITE_AUTH_USER || "torre",
      );
      const passwordMatches = equal(decoded.slice(separator + 1), password);
      if (userMatches && passwordMatches) {
        const response = NextResponse.next();
        response.headers.set("Cache-Control", "private, no-store");
        return response;
      }
    }
  }

  return new Response("Credenziali richieste.", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="Modelli 3D", charset="UTF-8"',
      "Cache-Control": "private, no-store",
    },
  });
}
