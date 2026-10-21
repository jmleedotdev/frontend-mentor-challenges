import { readdirSync } from 'node:fs'
import tailwindcss from '@tailwindcss/vite'
import { SITE_NAME } from './shared/utils/site'

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

  modules: [
    '@nuxt/eslint',
    '@nuxt/fonts',
    '@nuxt/image',
    '@nuxt/test-utils',
    '@nuxt/icon',
    'motion-v/nuxt',
  ],

  css: ['~/assets/css/main.css'],

  app: {
    head: {
      title: SITE_NAME,
      htmlAttrs: { lang: 'en' },
      link: [
        { rel: 'icon', href: '/favicon.ico', sizes: '32x32' },
        { rel: 'icon', href: '/favicon.svg', type: 'image/svg+xml' },
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
    families: [
      { name: 'Figtree', weights: [500, 800] },
      { name: 'Poppins', weights: [200, 400, 600] },
      { name: 'Montserrat', weights: [500, 700] },
      { name: 'Fraunces', weights: [700] },
      { name: 'Young Serif', weights: [400] },
      { name: 'Outfit', weights: [400, 600, 700] },
      { name: 'Inter', weights: [400, 600, 700] },
      { name: 'Barlow Semi Condensed', weights: [500, 600] },
      { name: 'Red Hat Display', weights: [500, 900] },
      { name: 'Manrope', weights: [500, 700] },
      { name: 'Roboto', weights: [400, 700] },
    ],
  },
})
