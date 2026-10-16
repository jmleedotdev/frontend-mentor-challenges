// Run against `pnpm dev`: node --test test/browser/meet-landing-page-reveals.test.mjs
import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { chromium } from 'playwright-core'

const url = `${process.env.TEST_BASE_URL ?? 'http://localhost:3000'}/meet-landing-page`
const revealTargets =
  '.section-number, .photo-grid img, .features p, #smarter-meetings, .footer-copy > *'
let browser

before(async () => {
  browser = await chromium.launch({ headless: true })
})

after(async () => {
  await browser?.close()
})

async function visit(options = {}, hash = '') {
  const page = await browser.newPage({ viewport: { width: 375, height: 812 }, ...options })
  await page.goto(url + hash)
  if (options.javaScriptEnabled !== false) {
    await page.waitForFunction(
      () => document.querySelector('#__nuxt')?.__vue_app__?.$nuxt?.isHydrating === false,
    )
    await nextPaint(page)
  }
  return page
}

async function nextPaint(page) {
  await page.evaluate(
    () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))),
  )
}

async function opacity(page, selector) {
  return page
    .locator(selector)
    .evaluateAll((elements) => elements.map((element) => getComputedStyle(element).opacity))
}

async function expectVisible(page, selector) {
  await page.waitForFunction(
    (selector) =>
      [...document.querySelectorAll(selector)].every(
        (element) => getComputedStyle(element).opacity === '1',
      ),
    selector,
  )
  assert((await opacity(page, selector)).every((value) => value === '1'))
}

for (const viewport of [
  { width: 375, height: 812 },
  { width: 768, height: 1024 },
  { width: 1440, height: 900 },
]) {
  test(`reveals once without hiding initially visible content at ${viewport.width}px`, async () => {
    const page = await visit({ viewport })
    try {
      await expectVisible(page, '#meet-title')
      const groups = await page
        .locator('.section-number, .photo-grid, .features > div:last-child, .footer-copy')
        .evaluateAll((groups) =>
          groups.map((group) => ({
            top: group.getBoundingClientRect().top,
            opacity: (group.matches('.section-number')
              ? [group]
              : group.matches('.photo-grid')
                ? [...group.querySelectorAll('img')]
                : group.matches('.footer-copy')
                  ? [...group.children]
                  : [...group.querySelectorAll('p, h2')]
            ).map((element) => getComputedStyle(element).opacity),
          })),
        )
      assert.equal(groups.length, 5)
      assert.equal(await page.locator(revealTargets).count(), 12)
      for (const group of groups) {
        assert(group.opacity.every((value) => value === (group.top < viewport.height ? '1' : '0')))
      }
      assert.equal(await page.evaluate(() => document.body.scrollWidth > innerWidth), false)

      for (const selector of ['.photo-grid', '#smarter-meetings', '#meet-footer-title']) {
        await page.locator(selector).scrollIntoViewIfNeeded()
        await expectVisible(page, selector === '.photo-grid' ? '.photo-grid img' : selector)
      }
      assert.deepEqual(await opacity(page, 'footer picture img'), ['0.1'])
      await page.evaluate(() => window.scrollTo(0, 0))
      await page.locator('.photo-grid').scrollIntoViewIfNeeded()
      assert.deepEqual(await opacity(page, '.photo-grid img'), ['1', '1', '1', '1'])
      assert.equal(
        await page
          .locator('.photo-grid img')
          .evaluateAll((elements) => elements.flatMap((element) => element.getAnimations()).length),
        0,
      )
    } finally {
      await page.close()
    }
  })
}

for (const options of [{ reducedMotion: 'reduce' }, { javaScriptEnabled: false }]) {
  test(`content stays readable with ${JSON.stringify(options)}`, async () => {
    const page = await visit(options)
    try {
      assert.equal(await page.locator(revealTargets).count(), 12)
      await expectVisible(page, revealTargets)
    } finally {
      await page.close()
    }
  })
}

for (const id of ['smarter-meetings', 'meet-footer-title']) {
  test(`direct navigation to #${id} bypasses the reveal`, async () => {
    const page = await visit({}, `#${id}`)
    try {
      assert.deepEqual(await opacity(page, `#${id}`), ['1'])
    } finally {
      await page.close()
    }
  })
}

test('keyboard focus never lands inside an invisible footer', async () => {
  const page = await visit()
  try {
    await page.locator('footer button').focus()
    await nextPaint(page)
    assert.deepEqual(await opacity(page, '#meet-footer-title'), ['1'])
    assert.equal(
      await page
        .locator('footer button')
        .evaluate((element) => getComputedStyle(element.parentElement).opacity),
      '1',
    )
  } finally {
    await page.close()
  }
})

test('enabling reduced motion during a reveal leaves no intermediate opacity behind', async () => {
  const page = await visit()
  try {
    await page.locator('.photo-grid').scrollIntoViewIfNeeded()
    await page.waitForFunction(
      () => document.querySelector('.photo-grid img').getAnimations().length > 0,
    )
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await nextPaint(page)
    assert((await opacity(page, revealTargets)).every((value) => value === '1'))
    // A queued Motion render used to restore the interrupted value on the following frame.
    await nextPaint(page)
    assert((await opacity(page, revealTargets)).every((value) => value === '1'))
  } finally {
    await page.close()
  }
})
