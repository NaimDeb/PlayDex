# PWA Setup Guide for PlayDex

This guide will help you transform PlayDex into a Progressive Web App (PWA).

## Prerequisites

Your app is already prepared with:
- ✅ `manifest.json` in `/public` directory
- ✅ Next.js 15 App Router structure
- ✅ Responsive design with Tailwind CSS
- ✅ Service Worker configuration ready

## Step 1: Install next-pwa

```bash
npm install @ducanh2912/next-pwa
```

## Step 2: Update next.config.ts

Replace your `next.config.ts` with:

```typescript
import type { NextConfig } from "next";
import withPWA from "@ducanh2912/next-pwa";

const nextConfig: NextConfig = {
  // Your existing Next.js config
};

export default withPWA({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  skipWaiting: true,
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/fonts\.(?:gstatic|googleapis)\.com\/.*/i,
      handler: "CacheFirst",
      options: {
        cacheName: "google-fonts",
        expiration: {
          maxEntries: 4,
          maxAgeSeconds: 365 * 24 * 60 * 60, // 1 year
        },
      },
    },
    {
      urlPattern: /^https:\/\/images\.igdb\.com\/.*/i,
      handler: "CacheFirst",
      options: {
        cacheName: "igdb-images",
        expiration: {
          maxEntries: 64,
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
        },
      },
    },
    {
      urlPattern: /\.(?:eot|otf|ttc|ttf|woff|woff2|font.css)$/i,
      handler: "StaleWhileRevalidate",
      options: {
        cacheName: "static-font-assets",
        expiration: {
          maxEntries: 4,
          maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
        },
      },
    },
    {
      urlPattern: /\.(?:jpg|jpeg|gif|png|svg|ico|webp)$/i,
      handler: "StaleWhileRevalidate",
      options: {
        cacheName: "static-image-assets",
        expiration: {
          maxEntries: 64,
          maxAgeSeconds: 24 * 60 * 60, // 24 hours
        },
      },
    },
    {
      urlPattern: /\/_next\/image\?url=.+$/i,
      handler: "StaleWhileRevalidate",
      options: {
        cacheName: "next-image",
        expiration: {
          maxEntries: 64,
          maxAgeSeconds: 24 * 60 * 60, // 24 hours
        },
      },
    },
    {
      urlPattern: /\.(?:mp3|wav|ogg)$/i,
      handler: "CacheFirst",
      options: {
        rangeRequests: true,
        cacheName: "static-audio-assets",
        expiration: {
          maxEntries: 32,
          maxAgeSeconds: 24 * 60 * 60, // 24 hours
        },
      },
    },
    {
      urlPattern: /\.(?:mp4)$/i,
      handler: "CacheFirst",
      options: {
        rangeRequests: true,
        cacheName: "static-video-assets",
        expiration: {
          maxEntries: 32,
          maxAgeSeconds: 24 * 60 * 60, // 24 hours
        },
      },
    },
  ],
})(nextConfig);
```

## Step 3: Update layout.tsx Meta Tags

Add PWA meta tags to your `app/layout.tsx`:

```tsx
export const metadata: Metadata = {
  title: "PlayDex - Ne rate plus aucun patch !",
  description: "PlayDex vous permet de suivre les mises à jour de vos jeux préférés.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "PlayDex",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    title: "PlayDex - Ne rate plus aucun patch !",
    description: "Suivez les mises à jour de vos jeux préférés avec PlayDex",
    type: "website",
    locale: "fr_FR",
  },
  icons: {
    icon: "/logo.webp",
    apple: "/logo.webp",
  },
};
```

## Step 4: Add PWA Meta Tags to HTML Head

In your `app/layout.tsx`, inside the `<html>` tag:

```tsx
<html lang="fr">
  <head>
    <meta name="application-name" content="PlayDex" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="default" />
    <meta name="apple-mobile-web-app-title" content="PlayDex" />
    <meta name="format-detection" content="telephone=no" />
    <meta name="mobile-web-app-capable" content="yes" />
    <meta name="theme-color" content="#4D40FF" />
  </head>
  <body>...</body>
</html>
```

## Step 5: Create App Icons

You need to create proper PWA icons. Use a tool like [PWA Asset Generator](https://github.com/elegantapp/pwa-asset-generator):

```bash
npx pwa-asset-generator public/logo.webp public/icons \
  --background "#1A1A1A" \
  --favicon \
  --manifest public/manifest.json \
  --type png
```

Or manually create icons in these sizes:
- 72x72, 96x96, 128x128, 144x144, 152x152, 192x192, 384x384, 512x512

## Step 6: Test Your PWA

1. **Development**: Run `npm run dev` and open DevTools > Application > Manifest
2. **Production**: Build and test with:
   ```bash
   npm run build
   npm run start
   ```
3. **Lighthouse**: Run Lighthouse audit in Chrome DevTools
4. **Install**: Click "Install" button in browser address bar

## PWA Features Checklist

- [x] Manifest.json configured
- [x] Icons prepared
- [ ] Install @ducanh2912/next-pwa
- [ ] Update next.config.ts
- [ ] Add meta tags to layout.tsx
- [ ] Generate proper icon sizes
- [x] Service worker caching strategy defined
- [ ] Test offline functionality
- [ ] Test install prompt
- [ ] Lighthouse PWA score > 90

## Offline Support

The service worker is configured to cache:
- **Fonts**: Google Fonts (CacheFirst, 1 year)
- **Images**: IGDB game covers (CacheFirst, 30 days)
- **Assets**: Static images, fonts (StaleWhileRevalidate)
- **Next.js Images**: Optimized images (StaleWhileRevalidate, 24h)

## Troubleshooting

### Service Worker Not Registering
- Check browser DevTools > Application > Service Workers
- Ensure HTTPS is enabled (localhost is OK for development)
- Clear cache and hard reload (Ctrl+Shift+R)

### Manifest Not Found
- Verify `/public/manifest.json` exists
- Check Network tab in DevTools
- Ensure manifest link in HTML head

### Icons Not Showing
- Verify icon paths in manifest.json
- Icons must be in `/public` directory
- Use PNG format for best compatibility

## Resources

- [next-pwa Documentation](https://github.com/DuCanhGH/next-pwa)
- [PWA Checklist](https://web.dev/pwa-checklist/)
- [Workbox Documentation](https://developer.chrome.com/docs/workbox/)
