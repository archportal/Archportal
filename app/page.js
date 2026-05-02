// app/page.js
// Server Component minimalista — la metadata vive en layout.js y el JSX en HomeClient.
// NO marcar 'use client' aquí. Esto es lo que permite que Google y Open Graph
// vean el HTML correctamente.

import HomeClient from '@/components/landing/HomeClient'

export default function Page() {
  return <HomeClient />
}
