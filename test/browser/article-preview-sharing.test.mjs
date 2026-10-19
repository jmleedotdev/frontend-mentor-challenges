// Run against `pnpm dev`: node --test test/browser/article-preview-sharing.test.mjs
import assert from 'node:assert/strict'
import { mkdir } from 'node:fs/promises'
import { after, before, test } from 'node:test'
import { chromium } from 'playwright-core'

const baseUrl = process.env.TEST_BASE_URL ?? 'http://localhost:3000'
const screenshotDir = process.env.SCREENSHOT_DIR
let browser

before(async () => {
  browser = await chromium.launch({ headless: true })
  if (screenshotDir) await mkdir(screenshotDir, { recursive: true })
})

after(async () => {
  await browser?.close()
})

async function visit(viewport) {
  const page = await browser.newPage({ viewport })
  await page.goto(`${baseUrl}/article-preview-component`)
  await page.waitForFunction(
    () => document.querySelector('#__nuxt')?.__vue_app__?.$nuxt?.isHydrating === false,
  )
  await page.evaluate(() => document.fonts.ready)
  await page.locator('main').evaluate(async (main) => {
    await Promise.all(main.getAnimations().map((animation) => animation.finished))
  })
  return page
}

async function assertNoOverflow(page) {
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false)
}

for (const { viewport, cardSize } of [
  { viewport: { width: 375, height: 667 }, cardSize: { width: 327, height: 538 } },
  { viewport: { width: 768, height: 800 }, cardSize: { width: 608, height: 346 } },
  { viewport: { width: 1440, height: 800 }, cardSize: { width: 730, height: 280 } },
]) {
  test(`matches card geometry and sharing states at ${viewport.width}px`, async () => {
    const page = await visit(viewport)
    try {
      const card = page.locator('.preview-card')
      const button = page.getByRole('button', { name: 'Share article', exact: true })
      const panel = page.getByRole('group', { name: 'Share this article' })
      const bounds = await card.boundingBox()
      assert(Math.abs(bounds.width - cardSize.width) < 1)
      assert(Math.abs(bounds.height - cardSize.height) < 1)
      assert(Math.abs(bounds.y + bounds.height / 2 - viewport.height / 2) < 1)
      assert.equal(await button.getAttribute('aria-expanded'), 'false')
      assert.equal(await panel.isVisible(), false)
      assert.equal(
        await page
          .locator('article img')
          .evaluateAll((images) =>
            images.every((image) => image.complete && image.naturalWidth > 0),
          ),
        true,
      )
      if (screenshotDir) {
        await page.screenshot({ path: `${screenshotDir}/${viewport.width}-default.png` })
      }

      await button.focus()
      await page.keyboard.press('Enter')
      assert.equal(await button.getAttribute('aria-expanded'), 'true')
      assert.equal(await panel.isVisible(), true)
      const panelBounds = await panel.boundingBox()
      if (viewport.width < 768) {
        assert.equal(panelBounds.width, bounds.width)
        assert(Math.abs(panelBounds.y + panelBounds.height - bounds.y - bounds.height) < 1)
        assert.equal(
          await page.locator('.author').evaluate((element) => getComputedStyle(element).visibility),
          'hidden',
        )
      } else {
        assert.equal(panelBounds.width, 248)
        assert(panelBounds.y + panelBounds.height < (await button.boundingBox()).y)
      }
      const activeBounds = await card.boundingBox()
      assert.deepEqual(activeBounds, bounds)
      if (screenshotDir) {
        await page.screenshot({ path: `${screenshotDir}/${viewport.width}-active.png` })
      }
      await assertNoOverflow(page)

      await page.keyboard.press('Tab')
      assert.equal(
        await page.evaluate(() => document.activeElement.getAttribute('aria-label')),
        'Visit Facebook (opens in a new tab)',
      )
      await page.keyboard.press('Escape')
      assert.equal(await panel.isVisible(), false)
      assert.equal(await button.evaluate((element) => element === document.activeElement), true)
      await page.keyboard.press('Space')
      assert.equal(await panel.isVisible(), true)
      await page.locator('h1').click()
      assert.equal(await panel.isVisible(), false)
      await button.click()
      await button.click()
      assert.equal(await panel.isVisible(), false)
    } finally {
      await page.close()
    }
  })
}

test('stays within the viewport between breakpoints and when resized while sharing', async () => {
  const page = await visit({ width: 320, height: 568 })
  try {
    const button = page.getByRole('button', { name: 'Share article', exact: true })
    await button.click()
    for (const width of [320, 375, 600, 767, 768, 900, 1023, 1024]) {
      await page.setViewportSize({ width, height: 800 })
      await assertNoOverflow(page)
      const panel = await page.getByRole('group', { name: 'Share this article' }).boundingBox()
      assert(panel.x >= 0 && panel.x + panel.width <= width)
      assert.equal(await button.getAttribute('aria-expanded'), 'true')
    }
  } finally {
    await page.close()
  }
})
