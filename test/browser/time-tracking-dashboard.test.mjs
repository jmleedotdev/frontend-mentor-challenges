// Run against pnpm dev: PLAYWRIGHT_CHANNEL=chrome node --test test/browser/time-tracking-dashboard.test.mjs
import assert from 'node:assert/strict'
import { mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import { after, before, test } from 'node:test'
import { chromium } from 'playwright-core'

const baseUrl = process.env.TEST_BASE_URL ?? 'http://localhost:3000'
const screenshotDir = process.env.SCREENSHOT_DIR
  ? join(process.env.SCREENSHOT_DIR, 'time-tracking-dashboard')
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
  await page.goto(`${baseUrl}/time-tracking-dashboard`)
  await page.waitForFunction(
    () => document.querySelector('#__nuxt')?.__vue_app__?.$nuxt?.isHydrating === false,
  )
  await page.evaluate(() => document.fonts.ready)
  await page.locator('.time-card').last().waitFor()
  await page
    .locator('main img')
    .evaluateAll((images) => Promise.all(images.map((image) => image.decode())))
  return page
}

async function assertCurrentHours(page, values) {
  await page.waitForFunction(
    (expected) =>
      JSON.stringify(
        Array.from(
          document.querySelectorAll('.current-hours [aria-hidden]'),
          (el) => el.textContent,
        ),
      ) === JSON.stringify(expected),
    values,
  )
  assert.deepEqual(await page.locator('.current-hours [aria-hidden]').allTextContents(), values)
}

const titles = ['Work', 'Play', 'Study', 'Exercise', 'Social', 'Self Care']
for (const [width, height, dashboardWidth, cardHeight, columns] of [
  [375, 1469, 327, 160, 1],
  [768, 1024, 612, 213, 3],
  [1440, 1024, 1116, 244, 3],
]) {
  test(`layout, API values, assets, hover and keyboard interaction at ${width}px`, async () => {
    const page = await visit({ width, height })
    try {
      assert.equal(await page.locator('.time-card').count(), 6)
      assert.deepEqual(await page.locator('.card-header h2').allTextContents(), titles)
      await assertCurrentHours(page, ['5hrs', '1hr', '0hr', '1hr', '1hr', '0hr'])
      assert.equal(
        await page.getByRole('button', { name: 'Daily' }).getAttribute('aria-pressed'),
        'true',
      )
      const dashboard = await page.locator('.dashboard').boundingBox()
      assert(Math.abs(dashboard.width - dashboardWidth) < 1)
      const cardBounds = await page.locator('.time-card').first().boundingBox()
      assert(Math.abs(cardBounds.height - cardHeight) < 1)
      assert.equal(
        await page
          .locator('.time-cards')
          .evaluate((element) => getComputedStyle(element).gridTemplateColumns.split(' ').length),
        columns,
      )
      assert(Math.abs(dashboard.y + dashboard.height / 2 - height / 2) < 1)
      assert.equal(
        await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
        false,
      )
      const images = await page.locator('main img').evaluateAll((elements) =>
        elements.map((image) => ({
          loaded: image.complete && image.naturalWidth > 0,
          width: image.getBoundingClientRect().width,
          height: image.getBoundingClientRect().height,
          src: image.getAttribute('src'),
        })),
      )
      assert.equal(images.length, 13)
      assert(images.every((image) => image.loaded && image.width > 0 && image.height > 0))
      for (const [i, title] of titles.entries()) {
        const icon = images[i * 2 + 1]
        assert(icon.src.endsWith(`icon-${title.toLowerCase().replaceAll(' ', '-')}.svg`))
        const [naturalWidth, naturalHeight] = [
          [79, 79],
          [76, 77],
          [79, 79],
          [81, 55],
          [75, 100],
          [67, 67],
        ][i]
        const scale = width === 768 ? 0.737 : 1
        assert(Math.abs(icon.width - naturalWidth * scale) < 1)
        assert(Math.abs(icon.height - naturalHeight * scale) < 1)
        assert(Math.abs(images[i * 2 + 2].width - 21 * scale) < 1)
      }
      assert.equal(images[0].width, width >= 1200 ? 84 : 70)
      const surface = page.locator('.card-content').first()
      assert.equal(
        await surface.evaluate((element) => getComputedStyle(element).backgroundColor),
        'rgb(28, 31, 74)',
      )
      await surface.hover()
      assert.equal(
        await surface.evaluate((element) => getComputedStyle(element).backgroundColor),
        'rgb(51, 57, 122)',
      )
      const weekly = page.getByRole('button', { name: 'Weekly' })
      await weekly.hover()
      assert.equal(
        await weekly.evaluate((element) => getComputedStyle(element).color),
        'rgb(255, 255, 255)',
      )
      await weekly.focus()
      await page.keyboard.press('Enter')
      await assertCurrentHours(page, ['32hrs', '10hrs', '4hrs', '4hrs', '5hrs', '2hrs'])
      assert.equal(await page.locator('.previous-hours').nth(1).textContent(), 'Last Week - 8hrs')
      await weekly.evaluate((element) => element.blur())
      await page.mouse.move(0, 0)
      if (screenshotDir)
        await page.screenshot({ path: join(screenshotDir, `${width}-weekly.png`), fullPage: true })
      await page.getByRole('button', { name: 'Monthly' }).click()
      await assertCurrentHours(page, ['103hrs', '23hrs', '13hrs', '11hrs', '21hrs', '7hrs'])
      assert.equal(
        await page.locator('.previous-hours').first().textContent(),
        'Last Month - 128hrs',
      )
      assert.equal(
        await page
          .locator('.card-stats')
          .evaluateAll((elements) =>
            elements.every((element) => element.scrollWidth <= element.clientWidth),
          ),
        true,
      )
      await page.setViewportSize({ width: width === 375 ? 1440 : 375, height: 1024 })
      assert.equal(
        await page.getByRole('button', { name: 'Monthly' }).getAttribute('aria-pressed'),
        'true',
      )
      await page.reload()
      await page.locator('.time-card').last().waitFor()
      assert.equal(
        await page.getByRole('button', { name: 'Daily' }).getAttribute('aria-pressed'),
        'true',
      )
    } finally {
      await page.close()
    }
  })
}

test('counts through intermediate values and skips subsequent animations with reduced motion', async () => {
  const page = await visit({ width: 1440, height: 1024 })
  try {
    await assertCurrentHours(page, ['5hrs', '1hr', '0hr', '1hr', '1hr', '0hr'])
    const intermediate = await page.evaluate(async () => {
      Array.from(document.querySelectorAll('.timeframes button'))
        .find((button) => button.textContent === 'Monthly')
        .click()
      await new Promise(requestAnimationFrame)
      await new Promise(requestAnimationFrame)
      return {
        visual: document.querySelector('.current-hours [aria-hidden]').textContent,
        accessible: document.querySelector('.current-hours .sr-only').textContent,
        previous: document.querySelector('.previous-hours').textContent,
      }
    })
    assert(Number.parseInt(intermediate.visual) >= 5)
    assert(Number.parseInt(intermediate.visual) < 103)
    assert.equal(intermediate.accessible, '103hrs')
    assert.equal(intermediate.previous, 'Last Month - 128hrs')

    await page.emulateMedia({ reducedMotion: 'reduce' })
    await assertCurrentHours(page, ['103hrs', '23hrs', '13hrs', '11hrs', '21hrs', '7hrs'])
    await page.getByRole('button', { name: 'Daily' }).click()
    assert.deepEqual(await page.locator('.current-hours [aria-hidden]').allTextContents(), [
      '5hrs',
      '1hr',
      '0hr',
      '1hr',
      '1hr',
      '0hr',
    ])

    await page.reload()
    await page.waitForFunction(
      () => document.querySelector('#__nuxt')?.__vue_app__?.$nuxt?.isHydrating === false,
    )
    assert.deepEqual(await page.locator('.current-hours [aria-hidden]').allTextContents(), [
      '5hrs',
      '1hr',
      '0hr',
      '1hr',
      '1hr',
      '0hr',
    ])
  } finally {
    await page.close()
  }
})

test('narrow mobile and intermediate widths do not overflow', async () => {
  const page = await visit({ width: 320, height: 700 })
  try {
    for (const width of [320, 600, 1024, 1199, 1200]) {
      await page.setViewportSize({ width, height: 1024 })
      assert.equal(
        await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
        false,
      )
      assert.equal(await page.locator('.time-card').count(), 6)
    }
  } finally {
    await page.close()
  }
})
