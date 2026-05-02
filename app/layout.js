// app/layout.js
import './globals.css'
import Script from 'next/script'
import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'

const siteUrl = 'https://archportal.net'

export const metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'ArchPortal — Portal de gestión para arquitectos y constructores',
    template: '%s · ArchPortal',
  },
  description:
    'Tus clientes consultan avances, costos y fotos de obra cuando quieren. Tú trabajas tranquilo. SaaS de gestión de proyectos para despachos de arquitectura y construcción en México.',
  keywords: [
    'portal arquitectos',
    'software gestión de obra',
    'plataforma para despachos de arquitectura',
    'control de obra',
    'SaaS construcción México',
    'bitácora de obra digital',
  ],
  authors: [{ name: 'Luis Castañeda' }],
  creator: 'ArchPortal',
  publisher: 'ArchPortal',
  alternates: {
    canonical: siteUrl,
    languages: {
      'es-MX': siteUrl,
      'en-US': siteUrl + '?lang=en',
    },
  },
  openGraph: {
    type: 'website',
    locale: 'es_MX',
    url: siteUrl,
    siteName: 'ArchPortal',
    title: 'ArchPortal — Portal de gestión para arquitectos',
    description:
      'Tus clientes consultan avances, costos y fotos de obra cuando quieren. Tú trabajas tranquilo.',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'ArchPortal — Portal de gestión para arquitectos y constructores',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ArchPortal',
    description: 'Portal de gestión para despachos de arquitectura',
    images: ['/og-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large' },
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-icon.png',
  },
}

export const viewport = {
  themeColor: '#0C0C0C',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }) {
  return (
    <html lang="es-MX">
      <head>
        {/* JSON-LD para SEO estructurado */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'SoftwareApplication',
              name: 'ArchPortal',
              applicationCategory: 'BusinessApplication',
              operatingSystem: 'Web',
              offers: {
                '@type': 'Offer',
                price: '840',
                priceCurrency: 'MXN',
              },
              description:
                'Portal SaaS de gestión de proyectos para despachos de arquitectura y construcción.',
              url: siteUrl,
              author: { '@type': 'Person', name: 'Luis Castañeda' },
            }),
          }}
        />
      </head>
      <body>
        {children}
        <Analytics />
        <SpeedInsights />
        {/* EmailJS SDK — necesario porque emailjs.js depende de window.emailjs */}
        <Script
          src="https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js"
          strategy="afterInteractive"
        />
      </body>
    </html>
  )
}
