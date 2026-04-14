import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'GTR-Pickelball',
    short_name: 'GTR-Pickelball',
    description: 'La plateforme de ligue ultime pour le Pickleball.',
    start_url: '/',
    display: 'standalone',
    background_color: '#0a0a0c',
    theme_color: '#c0ff2d',
    icons: [
      {
        src: '/logo.png',
        sizes: '192x192 512x512',
        type: 'image/png',
      },
    ],
  }
}
