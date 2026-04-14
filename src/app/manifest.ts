import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'GTR-Pickelball',
    short_name: 'Pickelball',
    description: 'La plateforme de ligue ultime pour le Pickleball.',
    start_url: '/',
    display: 'standalone',
    background_color: '#0a0a0c',
    theme_color: '#c0ff2d',
    icons: [
      {
        src: '/favicon.ico',
        sizes: 'any',
        type: 'image/x-icon',
      },
      // Note: In a real production apps, we would add 192x192 and 512x512 icons here.
      // For now, we use the standard favicon to enable the PWA manifest detection.
    ],
  }
}
