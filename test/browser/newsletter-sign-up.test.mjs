// Run against `pnpm dev`: node --test test/browser/newsletter-sign-up.test.mjs
// Set PLAYWRIGHT_CHANNEL=chrome to use a locally installed Chrome browser.
import assert from 'node:assert/strict'
import { mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import { after, before, test } from 'node:test'
import { chromium } from 'playwright-core'

const baseUrl = process.env.TEST_BASE_URL ?? 'http://localhost:3000'
const screenshotDir = process.env.SCREENSHOT_DIR
  ? join(process.env.SCREENSHOT_DIR, 'newsletter-sign-up')
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
  await page.goto(`${baseUrl}/newsletter-sign-up`)
  await page.waitForFunction(
    () => document.querySelector('#__nuxt')?.__vue_app__?.$nuxt?.isHydrating === false,
  )
  await page.evaluate(() => document.fonts.ready)
  await page
    .locator('main img')
    .evaluateAll((images) => Promise.all(images.map((image) => image.decode())))
  await page
    .locator('.signup-card')
    .evaluate((element) =>
      Promise.all(element.getAnimations().map((animation) => animation.finished)),
    )
  return page
}

async function assertNoOverflow(page) {
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false)
}

async function screenshot(page, name) {
  if (screenshotDir) await page.screenshot({ path: `${screenshotDir}/${name}.png`, fullPage: true })
}

async function assertFocused(locator) {
  await locator
    .page()
    .waitForFunction(
      (element) => document.activeElement === element,
      await locator.elementHandle(),
      { timeout: 5000 },
    )
  assert.equal(await locator.evaluate((element) => document.activeElement === element), true)
}

for (const { viewport, cardSize, asset, imageSize } of [
  {
    viewport: { width: 375, height: 842 },
    cardSize: { width: 375, height: 842 },
    asset: 'mobile',
    imageSize: { width: 375, height: 284 },
  },
  {
    viewport: { width: 768, height: 1024 },
    cardSize: { width: 608, height: 878 },
    asset: 'tablet',
    imageSize: { width: 528, height: 360 },
  },
  {
    viewport: { width: 1440, height: 1080 },
    cardSize: { width: 904, height: 641 },
    asset: 'desktop',
    imageSize: { width: 400, height: 593 },
  },
]) {
  test(`form, validation and accessible success modal at ${viewport.width}px`, async () => {
    const page = await visit(viewport)
    try {
      const input = page.getByLabel('Email address')
      const subscribe = page.getByRole('button', { name: 'Subscribe to monthly newsletter' })
      assert.equal(
        await page.locator('#newsletter-sign-up').evaluate((element) => {
          const probe = document.createElement('span')
          probe.style.backgroundColor = 'var(--color-blue-700)'
          element.append(probe)
          const matches =
            getComputedStyle(element).backgroundColor === getComputedStyle(probe).backgroundColor
          probe.remove()
          return matches
        }),
        true,
      )
      const bounds = await page.locator('.signup-card').boundingBox()
      assert(Math.abs(bounds.width - cardSize.width) < 1)
      assert(Math.abs(bounds.height - cardSize.height) < 1)
      if (viewport.width >= 768) {
        assert(Math.abs(bounds.y + bounds.height / 2 - viewport.height / 2) < 1)
      }
      const illustration = await page.locator('picture img').evaluate((image) => ({
        loaded: image.complete && image.naturalWidth > 0,
        src: image.currentSrc,
        width: image.width,
        height: image.height,
      }))
      assert(illustration.loaded)
      assert(illustration.src.endsWith(`illustration-sign-up-${asset}.svg`))
      assert.equal(illustration.width, imageSize.width)
      assert.equal(illustration.height, imageSize.height)
      assert.deepEqual(
        await page.locator('.benefits img').evaluateAll((images) =>
          images.map((image) => ({
            loaded: image.complete && image.naturalWidth > 0,
            width: image.width,
            height: image.height,
          })),
        ),
        Array(3).fill({ loaded: true, width: 21, height: 21 }),
      )
      await screenshot(page, `${viewport.width}-default`)
      await assertNoOverflow(page)

      await input.fill('ash#loremcompany.com')
      assert.equal(await page.getByRole('alert').count(), 0)
      await subscribe.click()
      assert.equal(await page.getByRole('alert').innerText(), 'Valid email required')
      assert.equal(await input.getAttribute('aria-invalid'), 'true')
      assert.equal(await page.locator('dialog').count(), 0)
      await assertFocused(input)
      await screenshot(page, `${viewport.width}-error`)
      assert.deepEqual(await page.locator('.signup-card').boundingBox(), bounds)
      await input.fill('ash@loremcompany.com')
      assert.equal(await page.getByRole('alert').count(), 0)

      await subscribe.hover()
      assert.equal(
        await subscribe.evaluate((element) => getComputedStyle(element).transitionDuration),
        '0s',
      )
      assert.notEqual(
        await subscribe.evaluate((element) => getComputedStyle(element).backgroundImage),
        'none',
      )
      assert.equal(
        await subscribe.evaluate((element) => getComputedStyle(element).backgroundImage),
        await subscribe.evaluate((element) => {
          const probe = document.createElement('span')
          probe.style.backgroundImage = 'var(--color-red-gradient)'
          element.append(probe)
          const gradient = getComputedStyle(probe).backgroundImage
          probe.remove()
          return gradient
        }),
      )
      await input.focus()
      await page.keyboard.press('Enter')
      const dialog = page.getByRole('dialog', { name: 'Thanks for subscribing!' })
      await dialog.waitFor()
      await dialog.locator('img').evaluate((image) => image.decode())
      assert.equal(await dialog.locator('strong').innerText(), 'ash@loremcompany.com')
      assert.equal(await input.inputValue(), '')
      const modalBounds = await dialog.boundingBox()
      assert.equal(modalBounds.width, viewport.width < 768 ? viewport.width : 504)
      assert.equal(modalBounds.height, viewport.width < 768 ? viewport.height : 520)
      assert(Math.abs(modalBounds.y + modalBounds.height / 2 - viewport.height / 2) < 1)
      assert.equal(
        await page
          .locator('dialog img')
          .evaluate(
            (image) =>
              image.complete && image.naturalWidth > 0 && image.width === 64 && image.height === 64,
          ),
        true,
      )
      assert.equal(await page.evaluate(() => document.documentElement.style.overflow), 'hidden')
      const dismiss = dialog.getByRole('button', { name: 'Dismiss message' })
      assert.equal(
        await dismiss.evaluate((element) => getComputedStyle(element).transitionDuration),
        '0s',
      )
      await assertFocused(dismiss)
      await page.keyboard.press('Tab')
      await assertFocused(dismiss)
      await page.keyboard.press('Shift+Tab')
      await assertFocused(dismiss)
      await screenshot(page, `${viewport.width}-success`)
      if (viewport.width >= 768) {
        await page.mouse.click(8, 8)
        assert.equal(await dialog.isVisible(), true)
      }
      await page.keyboard.press('Escape')
      await dialog.waitFor({ state: 'detached' })
      await assertFocused(subscribe)
      assert.equal(await page.evaluate(() => document.documentElement.style.overflow), '')

      await input.fill('second@example.com')
      await subscribe.click()
      await dialog.waitFor()
      assert.equal(await dialog.locator('strong').innerText(), 'second@example.com')
      await dialog.getByRole('button', { name: 'Dismiss message' }).click()
      await dialog.waitFor({ state: 'detached' })
      await assertFocused(subscribe)
      await page.reload()
      await page.waitForFunction(
        () => document.querySelector('#__nuxt')?.__vue_app__?.$nuxt?.isHydrating === false,
      )
      assert.equal(await page.locator('dialog').count(), 0)
      assert.equal(await input.inputValue(), '')
    } finally {
      await page.close()
    }
  })
}

test('stays usable between breakpoints, at short heights, and with a long email', async () => {
  const page = await visit({ width: 320, height: 568 })
  try {
    await page.getByLabel('Email address').fill(`${'a'.repeat(64)}@${'b'.repeat(60)}.com`)
    await page.getByRole('button', { name: 'Subscribe to monthly newsletter' }).click()
    const dialog = page.getByRole('dialog')
    for (const width of [320, 375, 600, 767, 768, 900, 1023, 1024, 1440]) {
      await page.setViewportSize({ width, height: 568 })
      await assertNoOverflow(page)
      assert.equal(await dialog.isVisible(), true)
      assert.equal(
        await dialog.evaluate((element) => element.scrollWidth <= element.clientWidth),
        true,
      )
      const dismiss = dialog.getByRole('button', { name: 'Dismiss message' })
      await dismiss.scrollIntoViewIfNeeded()
      const bounds = await dismiss.boundingBox()
      assert(bounds.y >= 0 && bounds.y + bounds.height <= 568)
    }
    await dialog.getByRole('button', { name: 'Dismiss message' }).click()
    for (const width of [320, 375, 600, 767, 768, 900, 1023, 1024, 1440]) {
      await page.setViewportSize({ width, height: 568 })
      await assertNoOverflow(page)
    }
  } finally {
    await page.close()
  }
})
