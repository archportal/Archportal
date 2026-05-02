// app/sitemap.js
// Auto-generado por Next.js — Google y Bing lo encuentran en /sitemap.xml

export default function sitemap() {
  const base = 'https://archportal.net'
  return [
    {
      url: base,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${base}/?lang=en`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
  ]
}
