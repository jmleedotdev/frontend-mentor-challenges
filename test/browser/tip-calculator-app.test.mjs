// Run against pnpm dev: PLAYWRIGHT_CHANNEL=chrome node --test test/browser/tip-calculator-app.test.mjs
import assert from 'node:assert/strict'
import { mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import { after, before, test } from 'node:test'
import { chromium } from 'playwright-core'

const baseUrl = process.env.TEST_BASE_URL ?? 'http://localhost:3000'
const screenshotDir = process.env.SCREENSHOT_DIR
  ? join(process.env.SCREENSHOT_DIR, 'tip-calculator-app')
  : undefined
let browser

before(async () => {
  browser = await chromium.launch({ headless: true, channel: process.env.PLAYWRIGHT_CHANNEL })
  if (screenshotDir) await mkdir(screenshotDir, { recursive: true })
})
after(async () => {
  await browser?.close()
})

async function visit(viewport) {
  const page = await browser.newPage({ viewport })
  await page.goto(`${baseUrl}/tip-calculator-app`)
  await page.waitForFunction(
    () => document.querySelector('#__nuxt')?.__vue_app__?.$nuxt?.isHydrating === false,
  )
  await page.evaluate(() => document.fonts.ready)
  await page
    .locator('main img')
    .evaluateAll((images) => Promise.all(images.map((image) => image.decode())))
  return page
}

async function screenshot(page, name) {
  if (screenshotDir) await page.screenshot({ path: `${screenshotDir}/${name}.png`, fullPage: true })
}

for (const [width, height, cardWidth, cardHeight, cardY, columns] of [
  [375, 933, 375, 789, 144, 2],
  [768, 1024, 608, 800, 144, 3],
  [1440, 1024, 920, 481, 304, 3],
]) {
  test(`layout, local SVGs, calculations, errors, hover and reset at ${width}px`, async () => {
    const page = await visit({ width, height })
    try {
      const card = await page.locator('.calculator').boundingBox()
      assert(Math.abs(card.width - cardWidth) < 1)
      assert(Math.abs(card.height - cardHeight) < 1)
      assert(Math.abs(card.y - cardY) < 1)
      assert.equal(
        await page
          .locator('.tip-options')
          .evaluate((el) => getComputedStyle(el).gridTemplateColumns.split(' ').length),
        columns,
      )
      assert.equal(
        await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
        false,
      )
      assert.deepEqual(
        await page.locator('main img').evaluateAll((images) =>
          images.map((image) => ({
            src: image.getAttribute('src'),
            loaded: image.complete && image.naturalWidth > 0,
            width: image.width,
            height: image.height,
          })),
        ),
        [
          { src: '/img/tip-calculator-app/logo.svg', loaded: true, width: 87, height: 54 },
          { src: '/img/tip-calculator-app/icon-dollar.svg', loaded: true, width: 11, height: 17 },
          { src: '/img/tip-calculator-app/icon-person.svg', loaded: true, width: 13, height: 16 },
        ],
      )
      assert.equal(await page.getByRole('button', { name: 'RESET' }).isDisabled(), true)
      assert.equal(await page.locator('#tip-amount').innerText(), '$0.00')
      await screenshot(page, `${width}-empty`)

      await page.getByLabel('Bill', { exact: true }).fill('142.55')
      await page.getByLabel('Number of People').fill('5')
      await page.getByRole('button', { name: '15%', exact: true }).click()
      assert.equal(await page.locator('#tip-amount').innerText(), '$4.27')
      assert.equal(await page.locator('#total-amount').innerText(), '$32.78')
      await page.mouse.move(0, 0)
      assert.equal(
        await page
          .getByRole('button', { name: '15%', exact: true })
          .evaluate((el) => getComputedStyle(el).backgroundColor),
        'rgb(38, 194, 174)',
      )
      await screenshot(page, `${width}-populated`)

      const ten = page.getByRole('button', { name: '10%', exact: true })
      await ten.hover()
      assert.equal(
        await ten.evaluate((el) => getComputedStyle(el).backgroundColor),
        'rgb(159, 232, 223)',
      )
      const reset = page.getByRole('button', { name: 'RESET' })
      await reset.hover()
      assert.equal(
        await reset.evaluate((el) => getComputedStyle(el).backgroundColor),
        'rgb(159, 232, 223)',
      )
      await page.getByLabel('Bill', { exact: true }).focus()
      assert.equal(
        await page.locator('#bill').evaluate((el) => getComputedStyle(el).outlineColor),
        'rgb(38, 194, 174)',
      )
      await page.getByLabel('Number of People').fill('0')
      assert.equal(await page.getByRole('alert').innerText(), "Can't be zero")
      assert.equal(await page.locator('#people').getAttribute('aria-invalid'), 'true')
      assert.equal(
        await page.locator('#people').evaluate((el) => getComputedStyle(el).outlineColor),
        'rgb(225, 112, 82)',
      )
      assert.equal(await page.locator('#tip-amount').innerText(), '$0.00')
      assert.equal(await page.locator('#total-amount').innerText(), '$0.00')
      await screenshot(page, `${width}-error`)
      await page.getByLabel('Number of People').fill('2')
      await page.getByLabel('Custom tip percentage').fill('125.5')
      assert.equal(await page.locator('[aria-pressed="true"]').count(), 0)
      assert.equal(await page.locator('#tip-amount').innerText(), '$89.45')
      assert.equal(await page.locator('#total-amount').innerText(), '$160.72')
      await page.getByLabel('Custom tip percentage').fill('-5')
      assert.equal(await page.locator('#custom-tip-error').innerText(), "Can't be negative")
      const tipLegend = await page.locator('.tip-selection legend').boundingBox()
      const tipError = await page.locator('#custom-tip-error').boundingBox()
      assert(Math.abs(tipError.y - tipLegend.y) < 1)
      assert(Math.abs(tipError.x + tipError.width - tipLegend.x - tipLegend.width) < 1)
      assert.equal(await page.locator('#custom-tip').getAttribute('aria-invalid'), 'true')
      assert.equal(
        await page.locator('#custom-tip').getAttribute('aria-describedby'),
        'custom-tip-error',
      )
      await ten.focus()
      await page.keyboard.press('Enter')
      assert.equal(await page.locator('#custom-tip-error').count(), 0)
      assert.equal(await page.locator('#custom-tip').getAttribute('aria-invalid'), 'false')
      assert.equal(await page.locator('#custom-tip').getAttribute('aria-describedby'), null)
      assert.equal(await ten.getAttribute('aria-pressed'), 'true')
      assert.equal(await page.getByLabel('Custom tip percentage').inputValue(), '')
      await reset.click()
      assert.equal(await reset.isDisabled(), true)
      assert.deepEqual(
        await page.locator('input').evaluateAll((inputs) => inputs.map((el) => el.value)),
        ['', '', ''],
      )
      assert.equal(await page.getByRole('alert').count(), 0)
      assert.equal(await page.locator('#total-amount').innerText(), '$0.00')
    } finally {
      await page.close()
    }
  })
}

test('bill preserves two decimals on blur and limits typed and pasted fractional digits', async () => {
  const page = await visit({ width: 375, height: 933 })
  try {
    const bill = page.getByLabel('Bill', { exact: true })
    const people = page.getByLabel('Number of People')
    const reset = page.getByRole('button', { name: 'RESET' })
    for (const [value, formatted] of [
      ['100', '100.00'],
      ['100.1', '100.10'],
      ['100.10', '100.10'],
      ['0', '0.00'],
    ]) {
      await bill.fill(value)
      await bill.blur()
      assert.equal(await bill.inputValue(), formatted)
      await people.fill('2')
      assert.equal(await bill.inputValue(), formatted)
    }

    await bill.fill('')
    await bill.pressSequentially('100.1234')
    assert.equal(await bill.inputValue(), '100.12')
    await bill.press('Backspace')
    assert.equal(await bill.inputValue(), '100.1')
    await bill.pressSequentially('09')
    assert.equal(await bill.inputValue(), '100.10')
    await bill.blur()
    assert.equal(await bill.inputValue(), '100.10')
    // fill dispatches input with the complete value, as pasting does.
    await bill.fill('100.1299')
    assert.equal(await bill.inputValue(), '100.12')
    await people.fill('1')
    await page.getByLabel('Custom tip percentage').fill('100')
    assert.equal(await page.locator('#tip-amount').innerText(), '$100.12')
    assert.equal(await page.locator('#total-amount').innerText(), '$200.24')
    await reset.click()
    assert.equal(await bill.inputValue(), '')
    assert.equal(await reset.isDisabled(), true)
    await bill.focus()
    await bill.blur()
    assert.equal(await bill.inputValue(), '')
  } finally {
    await page.close()
  }
})

test('scientific-notation bills preserve their value and truncate actual fractional cents', async () => {
  const page = await visit({ width: 375, height: 933 })
  try {
    const bill = page.getByLabel('Bill', { exact: true })
    await page.getByLabel('Number of People').fill('1')
    await page.getByLabel('Custom tip percentage').fill('100')

    for (const [value, formatted, total] of [
      ['1.234e2', '123.40', '$246.80'],
      ['1.23456E+2', '123.45', '$246.90'],
      ['1.139e-1', '0.11', '$0.22'],
      ['1.239e-2', '0.01', '$0.02'],
      ['2.9e-1', '0.29', '$0.58'],
      ['1e-3', '0.00', '$0.00'],
      ['0e2', '0.00', '$0.00'],
    ]) {
      await bill.fill(value)
      assert.equal(await page.locator('#tip-amount').innerText(), `$${formatted}`, value)
      assert.equal(await page.locator('#total-amount').innerText(), total, value)
      await bill.blur()
      assert.equal(await bill.inputValue(), formatted, value)
      await page.getByLabel('Number of People').fill('2')
      assert.equal(await bill.inputValue(), formatted, value)
      await page.getByLabel('Number of People').fill('1')
    }
  } finally {
    await page.close()
  }
})

test('no horizontal overflow between breakpoints, with validation or large results', async () => {
  const page = await visit({ width: 320, height: 568 })
  try {
    for (const width of [320, 375, 600, 767, 768, 900, 1023, 1024, 1440]) {
      await page.setViewportSize({ width, height: 568 })
      await page.getByLabel('Bill', { exact: true }).fill('-100')
      assert.equal(await page.locator('#bill-error').innerText(), "Can't be negative")
      assert.equal(await page.locator('#bill').getAttribute('aria-invalid'), 'true')
      assert.equal(await page.locator('#bill').getAttribute('aria-describedby'), 'bill-error')
      await page.getByLabel('Number of People').fill('0')
      await page.getByLabel('Custom tip percentage').fill('-5')
      assert.equal(await page.locator('#custom-tip-error').innerText(), "Can't be negative")
      assert.equal(
        await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
        false,
      )
      await page.getByLabel('Bill', { exact: true }).fill('999999999')
      assert.equal(await page.locator('#bill-error').count(), 0)
      assert.equal(await page.locator('#bill').getAttribute('aria-invalid'), 'false')
      assert.equal(await page.locator('#bill').getAttribute('aria-describedby'), null)
      await page.getByLabel('Number of People').fill('1')
      await page.getByLabel('Custom tip percentage').fill('125.5')
      assert.equal(await page.locator('#custom-tip-error').count(), 0)
      assert.equal(
        await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
        false,
      )
      await page.getByRole('button', { name: 'RESET' }).scrollIntoViewIfNeeded()
      const bounds = await page.getByRole('button', { name: 'RESET' }).boundingBox()
      // Chromium rounds scrolling to whole pixels while layout retains subpixel positions.
      assert(bounds.y >= -1 && bounds.y + bounds.height <= 569)
    }
  } finally {
    await page.close()
  }
})
