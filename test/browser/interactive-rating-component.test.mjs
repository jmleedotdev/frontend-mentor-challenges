// Run against pnpm dev: PLAYWRIGHT_CHANNEL=chrome node --test test/browser/interactive-rating-component.test.mjs
import assert from 'node:assert/strict'
import { mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import { after, before, test } from 'node:test'
import { chromium } from 'playwright-core'

const baseUrl = process.env.TEST_BASE_URL ?? 'http://localhost:3000'
const screenshotDir = process.env.SCREENSHOT_DIR
  ? join(process.env.SCREENSHOT_DIR, 'interactive-rating-component')
  : undefined
let browser

before(async () => {
  browser = await chromium.launch({ headless: true, channel: process.env.PLAYWRIGHT_CHANNEL })
  if (screenshotDir) await mkdir(screenshotDir, { recursive: true })
})
after(async () => browser?.close())

async function visit(viewport, reducedMotion = 'no-preference') {
  const page = await browser.newPage({ viewport, reducedMotion })
  await page.goto(`${baseUrl}/interactive-rating-component`)
  await ready(page)
  return page
}

async function ready(page) {
  await page.waitForFunction(
    () => document.querySelector('#__nuxt')?.__vue_app__?.$nuxt?.isHydrating === false,
  )
  await page.evaluate(() => document.fonts.ready)
  await page
    .locator('.rating-card')
    .evaluate((card) => Promise.all(card.getAnimations().map((animation) => animation.finished)))
  await page
    .locator('main img')
    .evaluateAll((images) => Promise.all(images.map((image) => image.decode())))
}

async function screenshot(page, name) {
  if (screenshotDir)
    await page.screenshot({ path: join(screenshotDir, `${name}.png`), fullPage: true })
}

function near(actual, expected, label) {
  assert(Math.abs(actual - expected) < 1, `${label}: expected ${expected}, got ${actual}`)
}

for (const [width, height] of [
  [375, 667],
  [768, 800],
  [1440, 800],
]) {
  test(`rating and thank-you layouts, assets and interactions at ${width}px`, async () => {
    const page = await visit({ width, height })
    try {
      const mobile = width < 768
      assert.equal(
        await page.locator('main').evaluate((el) => getComputedStyle(el).animationName),
        'none',
      )
      const card = await page.locator('.rating-card').boundingBox()
      near(card.width, mobile ? 327 : 412, 'card width')
      near(card.height, mobile ? 360 : 416, 'card height')
      near(card.x + card.width / 2, width / 2, 'horizontal center')
      near(card.y + card.height / 2, height / 2, 'vertical center')
      assert.equal(await page.locator('input:checked').count(), 0)
      assert.equal(
        await page.getByRole('button', { name: 'SUBMIT', exact: true }).isDisabled(),
        false,
      )
      assert.equal(
        await page.locator('.rating-card').evaluate((el) => getComputedStyle(el).animationName),
        'fade-in-up',
      )
      assert.equal(
        await page.locator('.rating-card').evaluate((el) => getComputedStyle(el).animationDuration),
        '1s',
      )
      const star = await page.locator('.star-image img').boundingBox()
      near(star.width, mobile ? (17 * 5) / 6 : 17, 'star width')
      near(star.height, mobile ? (16 * 5) / 6 : 16, 'star height')
      await screenshot(page, `${width}-rating`)

      for (const asset of ['icon-star.svg', 'illustration-thank-you.svg']) {
        const response = await page.request.get(
          `${baseUrl}/img/interactive-rating-component/${asset}`,
        )
        assert.equal(response.status(), 200)
        assert((await response.body()).length > 0)
      }

      await page.locator('.rating-option').nth(1).click()
      await page.locator('.rating-option').nth(3).click()
      assert.equal(await page.locator('input:checked').count(), 1)
      assert.equal(
        await page.getByRole('radio', { name: '4 out of 5', exact: true }).isChecked(),
        true,
      )
      await page.mouse.move(0, 0)
      assert.equal(
        await page
          .locator('.rating-option')
          .nth(3)
          .locator('span')
          .evaluate((el) => getComputedStyle(el).backgroundColor),
        'rgb(255, 255, 255)',
      )
      await screenshot(page, `${width}-selected`)

      const option = page.locator('.rating-option').nth(2).locator('span')
      await option.hover()
      const hoverColor = await option.evaluate((el) => getComputedStyle(el).backgroundColor)
      assert.notEqual(hoverColor, 'rgb(255, 255, 255)')
      assert.equal(
        hoverColor,
        await page.locator('.submit-button').evaluate((el) => getComputedStyle(el).backgroundColor),
      )
      const submit = page.getByRole('button', { name: 'SUBMIT', exact: true })
      await submit.hover()
      assert.equal(
        await submit.evaluate((el) => getComputedStyle(el).backgroundColor),
        'rgb(255, 255, 255)',
      )
      await screenshot(page, `${width}-hover`)

      await submit.click()
      await page.getByRole('heading', { name: 'Thank you!', exact: true }).waitFor()
      await page
        .locator('main img')
        .evaluateAll((images) => Promise.all(images.map((image) => image.decode())))
      assert.equal(await page.locator('.rating-summary').innerText(), 'You selected 4 out of 5')
      assert.equal(await page.locator('main form').count(), 0)
      assert.equal(new URL(page.url()).pathname, '/interactive-rating-component')
      assert.equal(await page.evaluate(() => document.activeElement?.id), 'thank-you-title')
      assert.equal(
        await page.locator('.rating-card').evaluate((el) => el.getAnimations().length),
        0,
      )
      assert.deepEqual(await page.locator('.rating-card').boundingBox(), card)
      const illustration = await page.locator('.thank-you-image img').boundingBox()
      near(illustration.width, mobile ? 144 : 162, 'illustration width')
      near(illustration.height, mobile ? 96 : 108, 'illustration height')
      await screenshot(page, `${width}-thank-you`)
      assert.equal(
        await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
        false,
      )

      await page.reload()
      await ready(page)
      assert.equal(await page.locator('input:checked').count(), 0)
      assert.equal(await page.getByRole('heading', { name: 'How did we do?' }).count(), 1)
    } finally {
      await page.close()
    }
  })
}

test('keyboard selection, validation focus and reduced motion', async () => {
  const page = await visit({ width: 375, height: 667 }, 'reduce')
  try {
    assert.equal(
      await page.locator('.rating-card').evaluate((el) => getComputedStyle(el).animationName),
      'none',
    )
    await page.getByRole('button', { name: 'SUBMIT', exact: true }).focus()
    await page.keyboard.press('Enter')
    assert.equal(await page.getByRole('alert').innerText(), 'Please select a rating')
    assert.equal(await page.evaluate(() => document.activeElement?.id), 'rating-1')
    const option = page.locator('.rating-option').first().locator('span')
    assert.equal(await option.evaluate((el) => getComputedStyle(el).outlineStyle), 'solid')
    assert.equal(await option.evaluate((el) => getComputedStyle(el).outlineWidth), '2px')
    await screenshot(page, 'validation-keyboard-focus')
    await page.keyboard.press('Space')
    assert.equal(
      await page.getByRole('radio', { name: '1 out of 5', exact: true }).isChecked(),
      true,
    )
    assert.equal(await page.getByRole('alert').count(), 0)
    await page.keyboard.press('ArrowRight')
    assert.equal(
      await page.getByRole('radio', { name: '2 out of 5', exact: true }).isChecked(),
      true,
    )
    await page.keyboard.press('Tab')
    assert.equal(await page.evaluate(() => document.activeElement?.textContent.trim()), 'SUBMIT')
    await page.keyboard.press('Enter')
    await page.getByRole('heading', { name: 'Thank you!' }).waitFor()
    assert.equal(await page.locator('.rating-summary').innerText(), 'You selected 2 out of 5')
    assert.equal(await page.evaluate(() => document.activeElement?.id), 'thank-you-title')
  } finally {
    await page.close()
  }
})

test('narrow, intermediate, short and zoomed layouts remain usable', async () => {
  const page = await visit({ width: 320, height: 568 }, 'reduce')
  try {
    for (const width of [320, 360, 600, 767, 768, 900, 1440]) {
      await page.setViewportSize({ width, height: 400 })
      assert.equal(
        await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
        false,
      )
      const card = await page.locator('.rating-card').boundingBox()
      const first = await page.locator('.rating-value').first().boundingBox()
      const last = await page.locator('.rating-value').last().boundingBox()
      assert(first.x >= card.x && last.x + last.width <= card.x + card.width)
      await page.getByRole('button', { name: 'SUBMIT', exact: true }).scrollIntoViewIfNeeded()
      const submit = await page.locator('.submit-button').boundingBox()
      assert(submit.y >= 0 && submit.y + submit.height <= 401)
    }
    await page.setViewportSize({ width: 320, height: 568 })
    await page.addStyleTag({ content: 'html { font-size: 200%; }' })
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
      false,
    )
    await page.locator('.rating-option').last().click()
    await page.getByRole('button', { name: 'SUBMIT', exact: true }).click()
    await page.getByRole('heading', { name: 'Thank you!' }).waitFor()
    assert.equal(await page.locator('.rating-summary').innerText(), 'You selected 5 out of 5')
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
      false,
    )
  } finally {
    await page.close()
  }
})
