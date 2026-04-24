// This file configures the initialization of Sentry on the client.
// The added config here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://9e1bf5503f5d39260b48118ea9ce3c9f@o4511202627878912.ingest.us.sentry.io/4511202630893568",

  // Solo enviar errores en producción, no durante desarrollo local
  enabled: process.env.NODE_ENV === "production",

  // Ambiente (útil para filtrar en el dashboard)
  environment: process.env.NODE_ENV,

  // Muestreo de performance: solo captura el 10% de las transacciones
  // Con 5000 eventos/mes gratis, esto permite mucho más espacio
  tracesSampleRate: 0.1,

  // Enable sending user PII (Personally Identifiable Information)
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/configuration/options/#sendDefaultPii
  sendDefaultPii: true,

  // Ignora errores ruidosos que no son de tu app
  ignoreErrors: [
    // Extensiones de navegador
    /extension\//i,
    /^chrome-extension:\/\//i,
    /^moz-extension:\/\//i,
    /^safari-extension:\/\//i,
    // Errores comunes no accionables
    "ResizeObserver loop limit exceeded",
    "ResizeObserver loop completed with undelivered notifications",
    "Non-Error promise rejection captured",
    "Network request failed",
    "NetworkError",
    "Failed to fetch",
    "Load failed",
    "AbortError",
    // Scripts de terceros
    "top.GLOBALS",
    "Can't find variable: gmo",
    "Script error.",
    // Bots
    /bot|crawler|spider/i,
  ],

  // No enviar errores que vengan de dominios que no son tuyos
  denyUrls: [
    // Extensiones del navegador
    /extensions\//i,
    /^chrome:\/\//i,
    /^chrome-extension:\/\//i,
    /^moz-extension:\/\//i,
    // Scripts externos comunes
    /googletagmanager\.com/i,
    /google-analytics\.com/i,
    /facebook\.net/i,
  ],

  // Filtro final: descarta eventos antes de enviar
  beforeSend(event, hint) {
    // No enviar nada desde localhost (por si enabled no atrapa algún caso)
    if (typeof window !== "undefined" && window.location.hostname === "localhost") {
      return null;
    }
    return event;
  },
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
