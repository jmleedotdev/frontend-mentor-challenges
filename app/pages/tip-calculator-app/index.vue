<script setup lang="ts">
definePageMeta({ layout: 'challenge' })
await useChallengePage()

const bill = ref<number | ''>('')
const people = ref<number | ''>('')
const customTip = ref<number | ''>('')
const selectedTip = ref<number | null>(null)
const tipOptions = [5, 10, 15, 25, 50]

const billError = computed(() => (bill.value !== '' && bill.value < 0 ? "Can't be negative" : ''))
const customTipError = computed(() =>
  customTip.value !== '' && customTip.value < 0 ? "Can't be negative" : '',
)
const peopleError = computed(() => {
  if (people.value === '') return ''
  if (people.value === 0) return "Can't be zero"
  if (!Number.isInteger(people.value) || people.value < 1) {
    return 'Use a whole number'
  }

  return ''
})
const results = computed(() => {
  const amount = bill.value === '' ? 0 : bill.value
  const percentage = selectedTip.value ?? (customTip.value === '' ? 0 : customTip.value)

  if (
    people.value === '' ||
    peopleError.value ||
    !Number.isFinite(amount) ||
    amount < 0 ||
    !Number.isFinite(percentage) ||
    percentage < 0
  ) {
    return { tip: '0.00', total: '0.00' }
  }

  const count = people.value
  const tip = (amount * (percentage / 100)) / count
  const total = amount / count + tip

  if (!Number.isFinite(tip) || !Number.isFinite(total)) {
    return { tip: '0.00', total: '0.00' }
  }

  return {
    tip: floorCurrency(tip),
    total: floorCurrency(total),
  }
})
const isEmpty = computed(
  () =>
    bill.value === '' &&
    people.value === '' &&
    customTip.value === '' &&
    selectedTip.value === null,
)

function floorCurrency(value: number) {
  const cents = value * 100
  // Correct floating-point noise at exact cents (e.g. 1.13 * 100 = 112.99999999999999).
  return (Math.floor(cents + Number.EPSILON * Math.abs(cents)) / 100).toFixed(2)
}

function limitBillPrecision(event: Event) {
  const input = event.currentTarget as HTMLInputElement
  let limited = input.value

  if (/e/i.test(limited)) {
    const value = input.valueAsNumber
    // Limit the monetary value, not the scientific notation's mantissa.
    if (Number.isFinite(value * 100)) {
      limited = `${value < 0 ? '-' : ''}${floorCurrency(Math.abs(value))}`
    }
  } else {
    limited = limited.replace(/(\.\d{2})\d+/, '$1')
  }

  if (limited !== input.value) {
    input.value = limited
    bill.value = input.valueAsNumber
  }
}

function formatBill(event: FocusEvent) {
  const input = event.currentTarget as HTMLInputElement

  input.value = bill.value === '' ? '' : bill.value.toFixed(2)
}

function selectTip(tip: number) {
  selectedTip.value = tip
  customTip.value = ''
}

function reset() {
  bill.value = ''
  people.value = ''
  customTip.value = ''
  selectedTip.value = null
}
</script>

<template>
  <main
    id="tip-calculator-app"
    class="flex min-h-dvh flex-col items-center bg-gray-200 text-gray-500"
  >
    <h1 class="brand">
      <img
        src="/img/tip-calculator-app/logo.svg"
        alt="Splitter tip calculator"
        width="87"
        height="54"
      />
    </h1>

    <form class="calculator" novalidate @submit.prevent @reset.prevent="reset">
      <div class="calculator-inputs">
        <div class="field">
          <div class="field-label text-preset-5">
            <label for="bill">Bill</label>
            <span v-if="billError" id="bill-error" class="field-error" role="alert">
              {{ billError }}
            </span>
          </div>

          <div class="icon-input">
            <img src="/img/tip-calculator-app/icon-dollar.svg" alt="" width="11" height="17" />

            <input
              id="bill"
              v-model="bill"
              class="text-preset-3"
              type="number"
              inputmode="decimal"
              min="0"
              step="0.01"
              placeholder="0"
              :aria-invalid="Boolean(billError)"
              :aria-describedby="billError ? 'bill-error' : undefined"
              @input="limitBillPrecision"
              @blur="formatBill"
            />
          </div>
        </div>

        <fieldset class="tip-selection">
          <legend class="text-preset-5">
            <span class="field-label">
              <span>Select Tip %</span>
              <span v-if="customTipError" id="custom-tip-error" class="field-error" role="alert">
                {{ customTipError }}
              </span>
            </span>
          </legend>

          <div class="tip-options">
            <button
              v-for="tip in tipOptions"
              :key="tip"
              type="button"
              class="tip-button text-preset-3"
              :aria-pressed="selectedTip === tip"
              @click="selectTip(tip)"
            >
              {{ tip }}%
            </button>

            <input
              id="custom-tip"
              v-model="customTip"
              class="custom-tip text-preset-3"
              aria-label="Custom tip percentage"
              type="number"
              inputmode="decimal"
              min="0"
              step="any"
              placeholder="Custom"
              :aria-invalid="Boolean(customTipError)"
              :aria-describedby="customTipError ? 'custom-tip-error' : undefined"
              @input="selectedTip = null"
            />
          </div>
        </fieldset>

        <div class="field">
          <div class="field-label text-preset-5">
            <label for="people">Number of People</label>

            <span v-if="peopleError" id="people-error" class="field-error" role="alert">
              {{ peopleError }}
            </span>
          </div>

          <div class="icon-input">
            <img src="/img/tip-calculator-app/icon-person.svg" alt="" width="13" height="16" />
            <input
              id="people"
              v-model="people"
              class="text-preset-3"
              type="number"
              inputmode="numeric"
              min="1"
              step="1"
              placeholder="0"
              :aria-invalid="Boolean(peopleError)"
              :aria-describedby="peopleError ? 'people-error' : undefined"
            />
          </div>
        </div>
      </div>

      <section class="results" aria-label="Calculated amounts per person">
        <div class="results-content">
          <dl class="result-details" aria-live="polite" aria-atomic="true">
            <div class="result-row">
              <dt class="text-preset-5">Tip Amount <span class="text-preset-6">/ person</span></dt>
              <dd id="tip-amount" class="result-amount">${{ results.tip }}</dd>
            </div>

            <div class="result-row">
              <dt class="text-preset-5">Total <span class="text-preset-6">/ person</span></dt>
              <dd id="total-amount" class="result-amount">${{ results.total }}</dd>
            </div>
          </dl>

          <button class="reset-button text-preset-4" type="reset" :disabled="isEmpty">RESET</button>
        </div>
      </section>
    </form>
  </main>
</template>

<style scoped>
#tip-calculator-app {
  --color-green-900: hsl(183, 100%, 15%);
  --color-green-400: #26c2ae;
  --color-green-200: #9fe8df;
  --color-gray-50: hsl(189, 47%, 97%);
  --color-gray-200: hsl(185, 41%, 84%);
  --color-gray-400: hsl(184, 14%, 56%);
  --color-gray-500: hsl(186, 14%, 43%);
  --color-gray-550: #547878;
  --color-orange-400: #e17052;
  gap: 40px;
  padding-top: 50px;
  font-family: 'Space Mono', monospace;
  font-weight: 700;
}

.brand,
.brand img {
  display: block;
}

.calculator {
  display: grid;
  width: 100%;
  gap: 32px;
  padding: 34px 24px;
  border-radius: 25px 25px 0 0;
  background: white;
  box-shadow: 0 32px 43px rgb(79 166 175 / 20%);
}

.calculator-inputs {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 32px;
  margin-inline: 8px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.icon-input {
  position: relative;
}

.icon-input img {
  position: absolute;
  z-index: 1;
  top: 50%;
  left: 17px;
  pointer-events: none;
  transform: translateY(-50%);
}

input {
  width: 100%;
  min-width: 0;
  height: 48px;
  padding: 6px 17px;
  border: 0;
  border-radius: 5px;
  outline: none;
  background: var(--color-gray-50);
  color: var(--color-green-900);
  text-align: right;
  appearance: textfield;
}

.icon-input input {
  padding-left: 40px;
}

input::-webkit-inner-spin-button,
input::-webkit-outer-spin-button {
  margin: 0;
  appearance: none;
}

input::placeholder {
  color: var(--color-green-900);
  opacity: 0.35;
}

input:focus {
  outline: 2px solid var(--color-green-400);
  outline-offset: -2px;
}

input[aria-invalid='true'] {
  outline: 2px solid var(--color-orange-400);
  outline-offset: -2px;
}

.tip-selection {
  min-width: 0;
}

.tip-selection legend {
  width: 100%;
  margin-bottom: 8px;
}

.tip-options {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

button {
  height: 48px;
  border-radius: 5px;
  cursor: pointer;
}

.tip-button {
  background: var(--color-green-900);
  color: white;
}

.tip-button[aria-pressed='true'],
.reset-button {
  background: var(--color-green-400);
  color: var(--color-green-900);
}

.custom-tip {
  padding-inline: 12px;
}

.custom-tip::placeholder {
  color: var(--color-gray-550);
  text-align: center;
  opacity: 1;
}

.field-label {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 0 8px;
}

.field-error {
  color: var(--color-orange-400);
}

.tip-selection .field-error {
  margin-left: auto;
}

.results {
  display: flex;
  min-width: 0;
  min-height: 257px;
  align-items: center;
  justify-content: center;
  padding: 24px 23px;
  border-radius: 15px;
  background: var(--color-green-900);
}

.results-content {
  display: flex;
  width: 100%;
  min-width: 0;
  flex-direction: column;
  gap: 32px;
}

.result-details {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.result-row {
  display: flex;
  min-width: 0;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.result-row dt {
  flex-shrink: 0;
  color: white;
}

.result-row dt span {
  display: block;
  color: var(--color-gray-400);
}

.result-amount {
  min-width: 0;
  overflow-wrap: anywhere;
  color: var(--color-green-400);
  font-size: 2rem;
  line-height: 47px;
  letter-spacing: -0.67px;
  text-align: right;
}

.reset-button {
  width: 100%;
}

.reset-button:disabled {
  cursor: default;
  opacity: 0.25;
}

button:focus-visible {
  outline: 3px solid var(--color-green-400);
  outline-offset: 3px;
}

.reset-button:focus-visible {
  outline-color: var(--color-green-200);
}

@media (hover: hover) {
  .tip-button:hover,
  .reset-button:hover:not(:disabled) {
    background: var(--color-green-200);
    color: var(--color-green-900);
  }
}

@media (min-width: 48rem) {
  #tip-calculator-app {
    padding-bottom: 80px;
  }

  .calculator {
    width: 608px;
    gap: 40px;
    padding: 54px 75.5px;
    border-radius: 25px;
  }

  .calculator-inputs {
    gap: 24px;
    margin: 0;
  }

  .tip-options {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .results {
    min-height: 300px;
    padding: 24px 47.5px;
  }

  .results-content {
    gap: 16px;
  }

  .result-details {
    gap: 8px;
  }

  .result-amount {
    font-size: 3rem;
    line-height: 71px;
    letter-spacing: -1px;
  }
}

@media (min-width: 64rem) {
  #tip-calculator-app {
    gap: 87px;
    padding-top: clamp(50px, 15.918vh, 163px);
  }

  .calculator {
    width: 920px;
    grid-template-columns: minmax(0, 379fr) minmax(0, 413fr);
    align-items: center;
    gap: 48px;
    padding: 32px 40px;
  }

  .calculator-inputs {
    gap: 40px;
  }

  .results {
    min-height: 417px;
    padding: 24px 40px;
  }

  .results-content {
    gap: 128px;
  }

  .result-details {
    gap: 24px;
  }
}

.text-preset-3,
.text-preset-4,
.text-preset-5,
.text-preset-6 {
  letter-spacing: 0;
}

.text-preset-3 {
  font-size: 1.5rem;
  line-height: 36px;
}

.text-preset-4 {
  font-size: 1.25rem;
  line-height: 30px;
}

.text-preset-5 {
  font-size: 1rem;
  line-height: 24px;
}

.text-preset-6 {
  font-size: 0.8125rem;
  line-height: 19px;
}
</style>
