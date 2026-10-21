<script setup lang="ts">
import NewsletterSignUpButton from '~/components/newsletter-sign-up/Button.vue'

defineProps<{ email: string }>()

const emit = defineEmits<{ close: [] }>()
const dialog = useTemplateRef<HTMLDialogElement>('dialog')
const dismissButton = useTemplateRef<InstanceType<typeof NewsletterSignUpButton>>('dismissButton')
let previousOverflow = ''

function dismiss() {
  dialog.value?.close()
}

onMounted(() => {
  previousOverflow = document.documentElement.style.overflow
  document.documentElement.style.overflow = 'hidden' // disables background scrolling
  dialog.value?.showModal()
  dismissButton.value?.focus()
})

onBeforeUnmount(() => {
  dialog.value?.close()
  document.documentElement.style.overflow = previousOverflow
})
</script>

<template>
  <dialog
    ref="dialog"
    class="success-modal"
    aria-labelledby="newsletter-success-title"
    aria-describedby="newsletter-success-description"
    aria-modal="true"
    @cancel.prevent="dismiss"
    @close="emit('close')"
    @keydown.tab.prevent="dismissButton?.focus()"
  >
    <div class="success-layout">
      <div class="success-message">
        <img src="/img/newsletter-sign-up/icon-success.svg" alt="" width="64" height="64" />

        <h2 id="newsletter-success-title" class="success-title">Thanks for subscribing!</h2>

        <p id="newsletter-success-description" class="success-description">
          A confirmation email has been sent to <strong>{{ email }}</strong
          >. Please open it and click the button inside to confirm your subscription.
        </p>
      </div>

      <NewsletterSignUpButton ref="dismissButton" @click="dismiss">
        Dismiss message
      </NewsletterSignUpButton>
    </div>
  </dialog>
</template>

<style scoped>
.success-modal {
  position: fixed;
  inset: 0;
  width: 100%;
  max-width: none;
  height: 100dvh;
  max-height: none;
  margin: 0;
  padding: 0;
  border: 0;
  background: white;
  color: var(--color-blue-800);
}

.success-modal::backdrop {
  background: hsl(235 18% 26% / 80%);
}

.success-layout {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 40px;
  min-height: 100%;
  padding: 149px 24px 70px;
}

.success-message {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 32px;
}

.success-message img {
  flex-shrink: 0;
}

.success-title {
  font-size: 2.5rem; /* 40px */
  line-height: 1;
  font-weight: 700;
  letter-spacing: 0;
}

.success-description {
  font-size: 1rem; /* 16px */
  line-height: 1.5;
  letter-spacing: 0;
}

.success-message strong {
  font-weight: 700;
  overflow-wrap: anywhere;
}

@media (min-width: 48rem) {
  .success-title {
    font-size: 3.5rem; /* 56px */
  }

  .success-modal {
    width: 504px;
    max-width: calc(100% - 48px);
    height: fit-content;
    max-height: calc(100dvh - 48px);
    margin: auto;
    border-radius: 36px;
    box-shadow: 0 15px 30px rgb(0 0 0 / 25%);
  }

  .success-layout {
    justify-content: center;
    gap: 32px;
    min-height: 520px;
    padding: 60px 64px;
  }
}

@media (max-width: 47.999rem) and (max-height: 650px) {
  .success-layout {
    padding-top: 48px;
    padding-bottom: 32px;
  }
}
</style>
