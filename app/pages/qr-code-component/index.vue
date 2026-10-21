<script setup lang="ts">
definePageMeta({ layout: 'challenge' })
await useChallengePage()
</script>

<template>
  <main id="qr-code-component" class="flex min-h-dvh items-center justify-center bg-slate-300">
    <article
      class="w-80 rounded-[20px] bg-white p-4 pb-10 text-center motion-safe:animate-fade-in-up"
    >
      <NuxtImg
        src="/img/qr-code-component/image-qr-code.png"
        alt="Frontend Mentor website QR code"
        width="288"
        height="288"
        class="rounded-[10px]"
      />

      <h1 class="text-preset-1 mt-6 px-4 text-slate-900">
        Improve your front-end skills by building projects
      </h1>

      <p class="text-preset-2 mt-4 px-4 text-slate-500">
        Scan the QR code to visit Frontend Mentor and take your coding skills to the next level
      </p>
    </article>
  </main>
</template>

<style scoped>
#qr-code-component {
  font-family: 'Outfit', sans-serif;
  --color-slate-300: hsl(212, 45%, 89%);
  --color-slate-500: hsl(216, 15%, 48%);
  --color-slate-900: hsl(218, 44%, 22%);
}

.text-preset-1 {
  font-size: 22px;
  font-weight: 700;
  line-height: 1.2;
  letter-spacing: 0px;
}

.text-preset-2 {
  font-size: 15px;
  font-weight: 400;
  line-height: 1.4;
  letter-spacing: 0.2px;
}
</style>
