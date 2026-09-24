# Frontend Mentor Challenges

My solutions to [Frontend Mentor](https://www.frontendmentor.io) challenges, built with Nuxt 4, TypeScript and Tailwind CSS 4.

## Scripts

```bash
pnpm install
pnpm dev          # http://localhost:3000
pnpm test         # vitest (filter logic + data/page consistency)
pnpm typecheck
pnpm lint
pnpm format
pnpm build
```

## Adding a challenge

1. **Data**: add an entry at the top of `server/utils/challenges.ts` (array order = gallery order). The `slug` is Frontend Mentor's challenge slug.
2. **Page**: create `app/pages/<slug>/index.vue` (add sub-routes next to it if the challenge has several pages):

   ```vue
   <script setup lang="ts">
   definePageMeta({ layout: 'challenge' })

   await useChallengePage()
   </script>

   <template>
     <main id="qr-code-component" class="min-h-dvh bg-(--background) text-(--text)">…</main>
   </template>

   <style scoped>
   #qr-code-component {
     --background: hsl(…);
     --text: hsl(…);
     font-family: 'Some Google Font', sans-serif;
   }
   </style>
   ```

3. **Components**: put them in `app/components/<slug>/`. `Card.vue` there is used as `<SlugCard />`, e.g. `<QrCodeComponentCard />`.
4. **Images**: put them in `public/images/<slug>/`, including `thumbnail.webp` for the gallery card, and render them with `<NuxtImg src="/images/<slug>/…" />`.

`pnpm test` fails if a challenge entry has no page, or a page folder has no entry.

### Challenge styling rules

- Design tokens are CSS variables on the page root (`#<slug>`), used through Tailwind's variable syntax: `bg-(--token)`, `text-(--token)`, `border-(--token)/50`. Child components inherit them.
- Styles loaded by a challenge stay loaded after client-side navigation, so never style `html`/`body` or bare elements globally. Scope everything under `#<slug>`, and have the root fill the page itself (`min-h-dvh` + background).
- Fonts are self-hosted automatically by `@nuxt/fonts` from the `font-family` you declare.
- Challenges are light by default. For a challenge whose design has a theme toggle, switch the variable values under `#<slug>[data-theme='dark']` instead of using Tailwind's `dark:` variant.
- Teleported content (modals, toasts) leaves the root element and loses the tokens, so teleport into the root instead of `body`.
- If a challenge needs an API key, proxy it through `server/api/<slug>/…` and read the key from `runtimeConfig` so it never reaches the browser.

## Deployment (Vercel)

Nuxt detects Vercel automatically. The gallery (`/`) is server-rendered so that `?q=` / `?difficulty=` render correctly on first load. Challenge pages are prerendered at build time.

Set `NUXT_PUBLIC_SITE_URL` (e.g. `https://your-site.vercel.app`) in the Vercel project's environment variables, available at build time, so `og:image` URLs are absolute.
