<script setup lang="ts">
import {
  generatePassword,
  passwordCategories,
  passwordSettingsError,
  passwordStrength,
  type PasswordCategory,
} from '~/utils/password-generator'

definePageMeta({ layout: 'challenge' })
await useChallengePage()

const length = ref(10)
const selectedCategories = ref<PasswordCategory[]>([])
const password = ref('')
const strength = ref<ReturnType<typeof passwordStrength>>(null)
const { copy, copied: clipboardCopied, isSupported } = useClipboard({ source: password })
const generation = ref(0)
const copiedGeneration = ref(-1)
const copied = computed(() => clipboardCopied.value && copiedGeneration.value === generation.value)
const copying = ref(false)
const actionError = ref('')
const settingsError = computed(() => passwordSettingsError(length.value, selectedCategories.value))

function generate() {
  if (settingsError.value) return

  try {
    const nextPassword = generatePassword(length.value, selectedCategories.value)
    generation.value++
    password.value = nextPassword
    strength.value = passwordStrength(length.value, selectedCategories.value)
    actionError.value = ''
  } catch {
    actionError.value =
      'Unable to generate a secure password. Please try again in a secure browser.'
  }
}

async function copyPassword() {
  if (!password.value || copying.value) return

  const currentGeneration = generation.value
  copying.value = true
  actionError.value = ''

  try {
    if (!isSupported.value) throw new Error('Clipboard unavailable')

    await copy()

    if (currentGeneration === generation.value) copiedGeneration.value = currentGeneration
  } catch {
    if (currentGeneration === generation.value) {
      actionError.value = 'Could not copy the password. Please select and copy it manually.'
    }
  } finally {
    copying.value = false
  }
}
</script>

<template>
  <main id="password-generator-app" class="min-h-dvh text-gray-200">
    <section class="generator" aria-labelledby="generator-title">
      <h1 id="generator-title" class="generator-title text-center text-gray-600">
        Password Generator
      </h1>

      <div class="password-display bg-gray-800">
        <output
          id="generated-password"
          class="password-value"
          :class="{ 'password-placeholder': !password }"
          aria-label="Generated password"
          >{{ password || 'P4$5W0rD!' }}</output
        >

        <div class="copy-actions">
          <span class="copied text-green-200" role="status">{{ copied ? 'COPIED' : '' }}</span>

          <button
            type="button"
            class="copy-button"
            aria-label="Copy password"
            :disabled="!password || copying"
            @click="copyPassword"
          >
            <span class="copy-icon">
              <img src="/img/password-generator-app/icon-copy.svg" alt="" width="21" height="24" />
            </span>
          </button>
        </div>
      </div>

      <form class="settings bg-gray-800" @submit.prevent="generate">
        <div class="length-control">
          <div class="length-label">
            <label for="password-length">Character Length</label>
            <output for="password-length" class="length-value text-green-200">{{ length }}</output>
          </div>

          <input
            id="password-length"
            v-model.number="length"
            class="length-slider"
            type="range"
            min="0"
            max="20"
            step="1"
            :style="{ '--progress': `${(length / 20) * 100}%` }"
            aria-describedby="settings-help"
          />
        </div>

        <fieldset class="category-options" aria-describedby="settings-help">
          <legend class="sr-only">Character categories</legend>
          <label v-for="category in passwordCategories" :key="category.id" class="category-option">
            <span class="checkbox-control">
              <input
                v-model="selectedCategories"
                type="checkbox"
                :value="category.id"
                class="category-checkbox"
              />
              <NuxtImg
                src="/img/password-generator-app/icon-check.svg"
                class="check-icon"
                alt=""
                width="14"
                height="12"
              />
            </span>
            {{ category.label }}
          </label>
        </fieldset>

        <div class="generate-controls">
          <div class="strength bg-(--color-gray-850)" aria-live="polite" aria-atomic="true">
            <span class="text-gray-600">STRENGTH</span>
            <div class="strength-result">
              <span class="strength-label">{{ strength?.label }}</span>

              <div class="strength-bars" aria-hidden="true">
                <span
                  v-for="bar in 4"
                  :key="bar"
                  class="strength-bar"
                  :style="
                    strength && bar <= strength.level
                      ? { backgroundColor: strength.color, borderColor: strength.color }
                      : undefined
                  "
                />
              </div>
            </div>
            <span v-if="!strength" class="sr-only">No password generated</span>
          </div>

          <button
            type="submit"
            class="generate-button bg-green-200 text-gray-800 enabled:hover:bg-transparent enabled:hover:text-green-200"
            :disabled="Boolean(settingsError)"
            aria-describedby="settings-help"
            :title="settingsError || undefined"
          >
            GENERATE
            <span class="generate-arrow" aria-hidden="true" />
          </button>
        </div>
        <p
          id="settings-help"
          :class="
            settingsError && (length > 0 || selectedCategories.length) ? 'settings-hint' : 'sr-only'
          "
        >
          {{ settingsError }}
        </p>

        <p v-if="actionError" class="action-error text-red-500" role="alert">{{ actionError }}</p>
      </form>
    </section>
  </main>
</template>

<style scoped>
#password-generator-app {
  font-family: 'JetBrains Mono', monospace;
  --color-gray-200: hsl(252, 11%, 91%);
  --color-gray-600: hsl(251, 9%, 53%);
  --color-gray-700: hsl(248, 5%, 34%);
  --color-gray-800: hsl(248, 10%, 15%);
  --color-gray-850: hsl(248, 15%, 11%);
  --color-gray-900: hsl(248, 17%, 9%);
  --color-gray-950: hsl(255, 22%, 4%);
  --color-green-200: hsl(127, 100%, 82%);
  --color-yellow-300: hsl(42, 91%, 68%);
  --color-orange-400: hsl(13, 95%, 66%);
  --color-red-500: hsl(0, 91%, 63%);
  --color-gray-gradient: linear-gradient(to right, hsl(248, 17%, 9%), hsl(255, 22%, 4%));
  padding: 64px 16px;
  background: var(--color-gray-gradient);
  font-weight: 700;
}

.generator {
  width: 100%;
  max-width: 540px;
  margin-inline: auto;
}

.generator-title {
  margin-bottom: 16px;
  font-size: 1rem;
  line-height: 20px;
}

.password-display {
  display: flex;
  min-width: 0;
  height: 64px;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
  padding-inline: 16px;
}

.password-value {
  min-width: 0;
  overflow-x: auto;
  font-size: 1.5rem;
  line-height: 32px;
  white-space: nowrap;
  scrollbar-width: none;
}

.password-placeholder {
  opacity: 0.25;
}

.copy-actions {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  gap: 8px;
}

.copied {
  font-size: 0.875rem;
  line-height: 20px;
}

.copied:empty {
  display: none;
}

.copy-button {
  display: grid;
  min-width: 28px;
  min-height: 44px;
  place-items: center;
  cursor: pointer;
}

.copy-icon {
  display: grid;
  width: 17.5px;
  height: 20px;
  place-items: center;
}

.copy-icon img {
  max-width: none;
  transform: scale(0.833333);
}

.copy-button:disabled {
  cursor: default;
}

.settings {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 32px;
  padding: 16px;
  font-size: 1rem;
  line-height: 20px;
}

.length-control {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.length-label {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.length-value {
  font-size: 1.5rem;
  line-height: 32px;
}

.length-slider {
  width: 100%;
  height: 28px;
  margin: 0;
  border: 0;
  border-radius: 0;
  background: linear-gradient(
      to right,
      var(--color-green-200) var(--progress),
      var(--color-gray-850) var(--progress)
    )
    center / 100% 8px no-repeat;
  cursor: pointer;
  appearance: none;
}

.length-slider::-webkit-slider-thumb {
  width: 28px;
  height: 28px;
  border: 2px solid var(--color-gray-200);
  border-radius: 50%;
  background: var(--color-gray-200);
  appearance: none;
}

.length-slider::-moz-range-thumb {
  box-sizing: border-box;
  width: 28px;
  height: 28px;
  border: 2px solid var(--color-gray-200);
  border-radius: 50%;
  background: var(--color-gray-200);
}

.length-slider:hover::-webkit-slider-thumb,
.length-slider:focus-visible::-webkit-slider-thumb {
  border-color: var(--color-green-200);
  background: var(--color-gray-850);
}

.length-slider:hover::-moz-range-thumb,
.length-slider:focus-visible::-moz-range-thumb {
  border-color: var(--color-green-200);
  background: var(--color-gray-850);
}

.category-options {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 16px;
  border: 0;
}

.category-option {
  display: flex;
  min-height: 21px;
  align-items: center;
  gap: 16px;
  cursor: pointer;
}

.category-option:last-child {
  min-height: 20px;
}

.checkbox-control {
  position: relative;
  display: grid;
  width: 20px;
  height: 20px;
  flex-shrink: 0;
  place-items: center;
}

.category-checkbox {
  position: absolute;
  inset: 0;
  width: 20px;
  height: 20px;
  margin: 0;
  border: 2px solid var(--color-gray-200);
  border-radius: 0;
  cursor: pointer;
  appearance: none;
}

.category-checkbox:checked {
  border-color: var(--color-green-200);
  background: var(--color-green-200);
}

.category-option:hover .category-checkbox {
  border-color: var(--color-green-200);
}

.check-icon {
  position: relative;
  visibility: hidden;
  pointer-events: none;
}

.category-checkbox:checked + .check-icon {
  visibility: visible;
}

.generate-controls {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.strength {
  display: flex;
  min-height: 56px;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 14px 16px;
}

.strength-result,
.strength-bars {
  display: flex;
  align-items: center;
}

.strength-result {
  gap: 16px;
}

.strength-label {
  font-size: 1.125rem;
  line-height: 24px;
  white-space: nowrap;
}

.strength-bars {
  gap: 8px;
}

.strength-bar {
  width: 10px;
  height: 28px;
  border: 2px solid var(--color-gray-200);
}

.generate-button {
  display: flex;
  width: 100%;
  min-height: 56px;
  align-items: center;
  justify-content: center;
  gap: 16px;
  border: 2px solid var(--color-green-200);
  cursor: pointer;
}

.generate-button:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.generate-arrow {
  width: 12px;
  height: 12px;
  background: currentColor;
  mask: url('/img/password-generator-app/icon-arrow-right.svg') center / contain no-repeat;
}

button:focus-visible,
input:focus-visible {
  outline: 2px solid var(--color-green-200);
  outline-offset: 4px;
}

.copy-button:hover:not(:disabled) img {
  filter: brightness(0) invert(1);
}

.action-error,
.settings-hint {
  font-size: 0.875rem;
  line-height: 20px;
}

@media (max-width: 359px) {
  .strength {
    padding-inline: 10px;
  }

  .strength-result {
    gap: 8px;
  }

  .strength-label {
    font-size: 0.875rem;
  }

  .strength-bars {
    gap: 5px;
  }
}

@media (min-width: 48rem) {
  #password-generator-app {
    padding: clamp(64px, 12.9883vh, 133px) 32px 80px;
  }

  .generator-title {
    margin-bottom: 32px;
    font-size: 1.5rem;
    line-height: 32px;
  }

  .password-display {
    height: 80px;
    margin-bottom: 24px;
    padding-inline: 32px;
  }

  .password-value,
  .length-value {
    font-size: 2rem;
    line-height: 42px;
  }

  .copy-actions {
    gap: 16px;
  }

  .copied {
    font-size: 1.125rem;
    line-height: 24px;
  }

  .copy-icon {
    width: 21px;
    height: 24px;
  }

  .copy-icon img {
    transform: none;
  }

  .settings {
    min-height: 528px;
    padding: 24px 32px;
    font-size: 1.125rem;
    line-height: 24px;
  }

  .length-control {
    gap: 16px;
  }

  .category-option {
    gap: 24px;
  }

  .generate-controls {
    gap: 32px;
  }

  .strength {
    min-height: 72px;
    padding: 20px 32px;
  }

  .strength-label {
    font-size: 1.5rem;
    line-height: 32px;
  }

  .generate-button {
    min-height: 65px;
    gap: 24px;
  }
}

.text-preset-1,
.text-preset-2,
.text-preset-3,
.text-preset-4 {
  font-weight: 700;
  line-height: 0px;
}

.text-preset-1 {
  font-size: 2rem; /* 32px */
  line-height: 42px;
}

.text-preset-2 {
  font-size: 1.5rem; /* 24px */
  line-height: 32px;
}

.text-preset-3 {
  font-size: 1.125rem; /* 18px */
  line-height: 24px;
}

.text-preset-4 {
  font-size: 1rem; /* 16px */
  line-height: 20px;
}
</style>
