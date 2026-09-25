import { readdirSync } from 'node:fs'
import tailwindcss from '@tailwindcss/vite'

// Every folder in app/pages is a challenge; prerender them (the gallery `/` stays server-rendered).
const challengeRoutes = readdirSync(new URL('./app/pages', import.meta.url), {
  withFileTypes: true,
})
  .filter((entry) => entry.isDirectory())
  .map((entry) => `/${entry.name}`)

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  modules: ['@nuxt/eslint', '@nuxt/fonts', '@nuxt/image', '@nuxt/test-utils', '@nuxt/icon'],

  css: ['~/assets/css/main.css'],

  app: {
    head: {
      title: 'Frontend Mentor Challenges',
      htmlAttrs: { lang: 'en' },
      link: [
        { rel: 'icon', href: '/favicon.ico' },
        { rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png' },
      ],
    },
  },

  runtimeConfig: {
    public: {
      siteUrl: '',
    },
  },

  nitro: {
    prerender: {
      routes: challengeRoutes,
    },
  },

  vite: {
    plugins: [tailwindcss()],
  },

  image: {
    densities: [1, 2],
    vercel: {
      formats: ['image/avif', 'image/webp'],
    },
  },

  fonts: {
    families: [{ name: 'Figtree', weights: ['500 800'] }],
  },
})
