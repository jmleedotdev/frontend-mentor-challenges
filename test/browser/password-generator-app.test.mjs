// Run against pnpm dev: PLAYWRIGHT_CHANNEL=chrome node --test test/browser/password-generator-app.test.mjs
import assert from 'node:assert/strict'
import { mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import { after, before, test } from 'node:test'
import { chromium } from 'playwright-core'

const baseUrl = process.env.TEST_BASE_URL ?? 'http://localhost:3000'
const screenshotDir = process.env.SCREENSHOT_DIR
  ? join(process.env.SCREENSHOT_DIR, 'password-generator-app')
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
  const page = await browser.newPage({
    viewport,
    permissions: ['clipboard-read', 'clipboard-write'],
  })
  await page.goto(`${baseUrl}/password-generator-app`)
  await page.waitForFunction(
    () => document.querySelector('#__nuxt')?.__vue_app__?.$nuxt?.isHydrating === false,
  )
  await page.evaluate(() => document.fonts.ready)
  await page
    .locator('main img')
    .evaluateAll((images) => Promise.all(images.map((image) => image.decode())))
  return page
}

async function setLength(page, value) {
  await page.getByLabel('Character Length', { exact: true }).evaluate((input, length) => {
    input.value = String(length)
    input.dispatchEvent(new Event('input', { bubbles: true }))
  }, value)
}

async function screenshot(page, name) {
  if (screenshotDir) await page.screenshot({ path: `${screenshotDir}/${name}.png`, fullPage: true })
}

for (const [width, height, cardWidth, settingsHeight, titleY] of [
  [375, 667, 343, 423, 64],
  [768, 1024, 540, 528, 133],
  [1440, 1024, 540, 528, 133],
]) {
  test(`layout, assets, generation, clipboard and hover at ${width}px`, async () => {
    const page = await visit({ width, height })
    try {
      const generator = await page.locator('.generator').boundingBox()
      const settings = await page.locator('.settings').boundingBox()
      assert(Math.abs(generator.width - cardWidth) < 1)
      assert(Math.abs(generator.y - titleY) < 1)
      assert(Math.abs(settings.height - settingsHeight) < 1, `settings height: ${settings.height}`)
      assert.equal(
        await page.getByRole('button', { name: 'GENERATE', exact: true }).isDisabled(),
        true,
      )
      assert.equal(await page.locator('#password-length').inputValue(), '0')
      assert.equal(await page.locator('input:checked').count(), 0)
      assert.equal(await page.locator('.strength-label').innerText(), '')
      await screenshot(page, `${width}-empty`)

      for (const asset of ['icon-copy.svg', 'icon-check.svg', 'icon-arrow-right.svg']) {
        const response = await page.request.get(`${baseUrl}/img/password-generator-app/${asset}`)
        assert.equal(response.status(), 200)
        assert((await response.body()).length > 0)
      }
      const copySize = await page.locator('.copy-icon img').boundingBox()
      assert(Math.abs(copySize.width - (width < 768 ? 17.5 : 21)) < 0.1)
      assert(Math.abs(copySize.height - (width < 768 ? 20 : 24)) < 0.1)
      assert(
        await page
          .locator('.generate-arrow')
          .evaluate((el) => getComputedStyle(el).maskImage.includes('icon-arrow-right.svg')),
      )

      await setLength(page, 10)
      await page.getByLabel('Include Uppercase Letters', { exact: true }).check()
      await page.getByLabel('Include Lowercase Letters', { exact: true }).check()
      await page.getByLabel('Include Numbers', { exact: true }).check()
      const generate = page.getByRole('button', { name: 'GENERATE', exact: true })
      await generate.click()
      await page.mouse.move(0, 0)
      const password = await page.locator('#generated-password').innerText()
      assert.equal(password.length, 10)
      assert.match(password, /^[a-zA-Z0-9]+$/)
      assert.match(password, /[A-Z]/)
      assert.match(password, /[a-z]/)
      assert.match(password, /[0-9]/)
      assert.equal(await page.locator('.strength-label').innerText(), 'MEDIUM')
      assert.equal(await page.locator('.check-icon:visible').count(), 3)
      const checkSize = await page.locator('.check-icon:visible').first().boundingBox()
      assert.deepEqual([checkSize.width, checkSize.height], [14, 12])
      assert.equal(
        await page
          .locator('.check-icon:visible')
          .first()
          .evaluate((el) => getComputedStyle(el).position),
        'relative',
      )
      assert.notEqual(
        await page.locator('.strength').evaluate((el) => getComputedStyle(el).backgroundColor),
        'rgba(0, 0, 0, 0)',
      )
      await screenshot(page, `${width}-generated`)

      await page.getByRole('button', { name: 'Copy password', exact: true }).click()
      await page.getByRole('status').filter({ hasText: 'COPIED' }).waitFor()
      assert.equal(await page.evaluate(() => navigator.clipboard.readText()), password)
      const copied = await page.locator('.copied').boundingBox()
      const icon = await page.locator('.copy-icon').boundingBox()
      assert(copied.x + copied.width < icon.x)
      await screenshot(page, `${width}-copied`)
      await page.waitForFunction(() => document.querySelector('.copied')?.textContent === '')
      await page.getByRole('button', { name: 'Copy password', exact: true }).click()
      await page.getByRole('status').filter({ hasText: 'COPIED' }).waitFor()
      await setLength(page, 20)
      assert.equal(await page.locator('#generated-password').innerText(), password)
      assert.equal(await page.locator('.strength-label').innerText(), 'MEDIUM')
      assert.equal(await page.locator('.copied').innerText(), 'COPIED')
      await generate.click()
      assert.equal(await page.locator('.copied').innerText(), '')
      assert.equal((await page.locator('#generated-password').innerText()).length, 20)
      assert.equal(await page.locator('.strength-label').innerText(), 'STRONG')

      const before = await generate.boundingBox()
      await generate.hover()
      const styles = await generate.evaluate((el) => {
        const style = getComputedStyle(el)
        return { background: style.backgroundColor, color: style.color, border: style.borderColor }
      })
      assert.equal(styles.background, 'rgba(0, 0, 0, 0)')
      assert.equal(styles.color, styles.border)
      assert.deepEqual(await generate.boundingBox(), before)
      assert.equal(
        await page
          .locator('.generate-arrow')
          .evaluate((el) => getComputedStyle(el).backgroundColor),
        styles.color,
      )
      await screenshot(page, `${width}-hover`)
      assert.equal(
        await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
        false,
      )
    } finally {
      await page.close()
    }
  })
}

test('keyboard controls, every strength tier and intermediate widths remain usable', async () => {
  const page = await visit({ width: 320, height: 568 })
  try {
    await page.getByLabel('Character Length', { exact: true }).focus()
    await page.keyboard.press('ArrowRight')
    assert.equal(await page.locator('#password-length').inputValue(), '1')
    const numbers = page.getByLabel('Include Numbers', { exact: true })
    await numbers.focus()
    await page.keyboard.press('Space')
    assert.equal(await numbers.isChecked(), true)
    const generate = page.getByRole('button', { name: 'GENERATE', exact: true })
    for (const width of [320, 375, 600, 767, 768, 900, 1024, 1440]) {
      await page.setViewportSize({ width, height: 568 })
      for (const [length, strength] of [
        [8, 'TOO WEAK!'],
        [9, 'WEAK'],
        [12, 'MEDIUM'],
        [20, 'STRONG'],
      ]) {
        await setLength(page, length)
        await generate.focus()
        await page.keyboard.press('Enter')
        assert.equal(await page.locator('.strength-label').innerText(), strength)
        assert.equal(
          await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
          false,
        )
        const row = await page.locator('.strength').boundingBox()
        const result = await page.locator('.strength-result').boundingBox()
        assert(result.x + result.width <= row.x + row.width)
      }
      await generate.scrollIntoViewIfNeeded()
      const bounds = await generate.boundingBox()
      assert(bounds.y >= -1 && bounds.y + bounds.height <= 569)
    }
  } finally {
    await page.close()
  }
})
