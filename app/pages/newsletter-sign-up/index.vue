<script setup lang="ts">
import NewsletterSignUpButton from '~/components/newsletter-sign-up/Button.vue'

definePageMeta({ layout: 'challenge' })
await useChallengePage()

const email = ref('')
const hasError = ref(false)
const submittedEmail = ref('')
const isSuccessOpen = ref(false)
const emailInput = useTemplateRef<HTMLInputElement>('emailInput')
const subscribeButton =
  useTemplateRef<InstanceType<typeof NewsletterSignUpButton>>('subscribeButton')
const benefits = [
  'Product discovery and building what matters',
  'Measuring to ensure updates are a success',
  'And much more!',
]

function isEmailValid() {
  const input = emailInput.value
  return Boolean(input && input.value.trim() && input.validity.valid)
}

function clearCorrectedError() {
  if (hasError.value && isEmailValid()) hasError.value = false
}

function subscribe() {
  if (!isEmailValid()) {
    hasError.value = true
    emailInput.value?.focus()
    return
  }

  submittedEmail.value = email.value.trim()
  email.value = ''
  hasError.value = false
  isSuccessOpen.value = true
}

async function closeSuccess() {
  isSuccessOpen.value = false
  await nextTick()
  subscribeButton.value?.focus()
}
</script>

<template>
  <main id="newsletter-sign-up" class="min-h-dvh bg-blue-700 text-blue-800">
    <article class="signup-card" aria-labelledby="signup-title">
      <picture class="signup-illustration">
        <source
          media="(min-width: 64rem)"
          srcset="/img/newsletter-sign-up/illustration-sign-up-desktop.svg"
          width="400"
          height="593"
        />
        <source
          media="(min-width: 48rem)"
          srcset="/img/newsletter-sign-up/illustration-sign-up-tablet.svg"
          width="528"
          height="360"
        />
        <img
          src="/img/newsletter-sign-up/illustration-sign-up-mobile.svg"
          alt=""
          width="375"
          height="284"
        />
      </picture>

      <div class="signup-content">
        <div class="signup-description">
          <h1 id="signup-title" class="text-preset-1">Stay updated!</h1>

          <p class="text-preset-2">Join 60,000+ product managers receiving monthly updates on:</p>

          <ul class="benefits text-preset-2">
            <li v-for="benefit in benefits" :key="benefit">
              <img src="/img/newsletter-sign-up/icon-list.svg" alt="" width="21" height="21" />
              <span>{{ benefit }}</span>
            </li>
          </ul>
        </div>

        <form class="signup-form" novalidate @submit.prevent="subscribe">
          <div class="email-field">
            <div class="field-label text-preset-3">
              <label for="newsletter-email">Email address</label>
              <span v-if="hasError" id="newsletter-email-error" class="email-error" role="alert">
                Valid email required
              </span>
            </div>

            <input
              id="newsletter-email"
              ref="emailInput"
              v-model="email"
              class="text-preset-2"
              type="email"
              name="email"
              autocomplete="email"
              placeholder="email@company.com"
              required
              :aria-invalid="hasError"
              :aria-describedby="hasError ? 'newsletter-email-error' : undefined"
              @input="clearCorrectedError"
            />
          </div>

          <NewsletterSignUpButton ref="subscribeButton" type="submit">
            Subscribe to monthly newsletter
          </NewsletterSignUpButton>
        </form>
      </div>
    </article>

    <NewsletterSignUpSuccessModal
      v-if="isSuccessOpen"
      :email="submittedEmail"
      @close="closeSuccess"
    />
  </main>
</template>

<style scoped>
#newsletter-sign-up {
  font-family: 'Roboto', sans-serif;
  --color-red-500: hsl(4, 100%, 67%);
  --color-red-100: hsl(3, 100%, 95%);
  --color-blue-800: hsl(234, 29%, 20%);
  --color-blue-700: hsl(235, 18%, 26%);
  --color-gray-500: hsl(0, 0%, 58%);
  --color-red-gradient: linear-gradient(hsl(15, 100%, 61%), hsl(346, 100%, 66%));
  --color-red-shadow: hsl(4 100% 67% / 50%);
}

.signup-card {
  width: 100%;
  background: white;
}

.signup-illustration {
  display: block;
  overflow: hidden;
  border-radius: 0 0 16px 16px;
}

.signup-illustration img {
  display: block;
  width: 100%;
  height: auto;
}

.signup-content {
  padding: 40px 24px 44px;
}

.signup-description {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.benefits {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.benefits li {
  display: flex;
  align-items: flex-start;
  gap: 16px;
}

.benefits img {
  flex-shrink: 0;
}

.signup-form {
  display: flex;
  flex-direction: column;
  gap: 24px;
  margin-top: 40px;
}

.email-field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.field-label {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 0 8px;
}

.email-error {
  color: var(--color-red-500);
}

input {
  width: 100%;
  height: 56px;
  padding: 16px 24px;
  border: 1px solid var(--color-gray-500);
  border-radius: 8px;
  background: white;
  color: var(--color-blue-800);
}

input::placeholder {
  color: var(--color-gray-500);
  opacity: 1;
}

input:focus {
  border-color: var(--color-blue-800);
  outline: 1px solid var(--color-blue-800);
}

input[aria-invalid='true'] {
  border-color: var(--color-red-500);
  background: var(--color-red-100);
  color: var(--color-red-500);
}

input[aria-invalid='true']:focus {
  outline-color: var(--color-red-500);
}

.text-preset-1,
.text-preset-2,
.text-preset-3 {
  letter-spacing: 0;
}

.text-preset-1 {
  font-size: 2.5rem; /* 40px */
  line-height: 1;
  font-weight: 700;
}

.text-preset-2,
.text-preset-3 {
  line-height: 1.5;
}

.text-preset-2 {
  font-size: 1rem; /* 16px */
}

.text-preset-3 {
  font-size: 0.75rem; /* 12px */
  font-weight: 700;
}

@media (min-width: 48rem) {
  #newsletter-sign-up {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 40px;
  }

  .signup-card {
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 40px;
    width: 608px;
    min-height: 878px;
    padding: 40px;
    border-radius: 36px;
    box-shadow: 0 15px 30px rgb(0 0 0 / 25%);
  }

  .signup-illustration {
    flex-shrink: 0;
    border-radius: 16px;
  }

  .signup-content {
    padding: 0;
  }

  .benefits {
    max-width: 376px;
  }

  .benefits li {
    align-items: center;
  }

  .signup-form {
    gap: 16px;
    margin-top: 24px;
  }

  .text-preset-1 {
    font-size: 3.5rem;
  }
}

@media (min-width: 64rem) {
  .signup-card {
    flex-direction: row-reverse;
    align-items: center;
    gap: 64px;
    width: 904px;
    min-height: 641px;
    padding: 24px 32px;
  }

  .signup-illustration {
    width: 400px;
  }

  .signup-content {
    flex: 1;
    min-width: 0;
  }

  .signup-description {
    gap: 32px;
  }

  .signup-form {
    gap: 24px;
    margin-top: 32px;
  }
}

@media (min-width: 48rem) and (prefers-reduced-motion: no-preference) {
  article {
    animation: fade-in 1s ease-out;
  }
}

@keyframes fade-in {
  0% {
    opacity: 0;
    transform: translateY(20px);
  }

  100% {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
