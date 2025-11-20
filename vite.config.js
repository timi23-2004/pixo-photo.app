import { VitePWA } from 'vite-plugin-pwa'

export default {
  base: '/',
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: "Image Viewer",
        short_name: "Viewer",
        icons: [
          {
            src: "/icon-192.png",
            sizes: "192x192",
            type: "image/png"
          },
          {
            src: "/icon-512.png",
            sizes: "512x512",
            type: "image/png"
          }
        ],
        start_url: "/",
        display: "standalone",
      }
    })
  ]
}
