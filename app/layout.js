import './globals.css'
import Script from 'next/script'

export const metadata = {
  title: 'ArchPortal — Portal para despachos de arquitectura',
  description: 'Avances, costos, planos y soporte inteligente en un solo lugar.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>
        {children}
        <Script
          src="https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js"
          strategy="afterInteractive"
        />
      </body>
    </html>
  )
}
