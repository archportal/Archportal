// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://9e1bf5503f5d39260b48118ea9ce3c9f@o4511202627878912.ingest.us.sentry.io/4511202630893568",

  // Solo enviar errores en producción, no durante desarrollo local
  enabled: process.env.NODE_ENV === "production",

  // Ambiente
  environment: process.env.NODE_ENV,

  // Muestreo de performance (10%)
  tracesSampleRate: 0.1,

  // Enable sending user PII (Personally Identifiable Information)
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/configuration/options/#sendDefaultPii
  sendDefaultPii: true,

  // Ignora errores de red transitorios y errores no accionables
  ignoreErrors: [
    "ECONNRESET",
    "ECONNREFUSED",
    "ETIMEDOUT",
    "EPIPE",
    "socket hang up",
    "Client network socket disconnected",
  ],
});
