// Run against pnpm dev: PLAYWRIGHT_CHANNEL=chrome node --test test/browser/frontend-quiz-app.test.mjs
import assert from 'node:assert/strict'
import { mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import { after, before, test } from 'node:test'
import { chromium } from 'playwright-core'

const baseUrl = process.env.TEST_BASE_URL ?? 'http://localhost:3000'
const screenshotDir = process.env.SCREENSHOT_DIR
  ? join(process.env.SCREENSHOT_DIR, 'frontend-quiz-app')
  : undefined
const themeKey = 'app-color-mode'
let browser

before(async () => {
  browser = await chromium.launch({ headless: true, channel: process.env.PLAYWRIGHT_CHANNEL })
  if (screenshotDir) await mkdir(screenshotDir, { recursive: true })
})
after(async () => {
  await browser?.close()
})

async function visit(page) {
  await page.goto(`${baseUrl}/frontend-quiz-app`)
  await page.waitForFunction(
    () => document.querySelector('#__nuxt')?.__vue_app__?.$nuxt?.isHydrating === false,
  )
  await page.evaluate(() => document.fonts.ready)
}

async function visitFromGallery(page) {
  // Ignore prerendered data so the client fetch can use the test's API fixture.
  await page.route('**/frontend-quiz-app/_payload.json*', (route) =>
    route.fulfill({ contentType: 'application/json', body: 'null' }),
  )
  await page.goto(baseUrl)
  await page.waitForFunction(
    () => document.querySelector('#__nuxt')?.__vue_app__?.$nuxt?.isHydrating === false,
  )
  // A client-side visit lets the route mock intercept useLazyFetch rather than server-side fetching.
  await page.evaluate(() =>
    document.querySelector('#__nuxt').__vue_app__.$nuxt.$router.push('/frontend-quiz-app'),
  )
  await page.locator('button.subject-card').first().waitFor()
  await page.evaluate(() => document.fonts.ready)
}

async function screenshot(page, name) {
  await page
    .locator('main img')
    .evaluateAll((images) => Promise.all(images.map((img) => img.decode())))
  await page.locator('main').evaluate(async (el) => {
    const image = new Image()
    image.src = getComputedStyle(el).backgroundImage.slice(5, -2)
    await image.decode()
  })
  await page.mouse.move(0, 0)
  if (screenshotDir)
    await page.screenshot({ path: join(screenshotDir, `${name}.png`), fullPage: true })
}

async function background(page) {
  return page.locator('main').evaluate((el) => getComputedStyle(el).backgroundColor)
}

async function assertThemeIconAlignment(page, expectedSize) {
  const track = await page.locator('.toggle-track').boundingBox()
  const trackCenter = track.y + track.height / 2
  const icons = page.locator('.theme-icon img:visible')
  assert.equal(await icons.count(), 2)
  for (const icon of await icons.all()) {
    const box = await icon.boundingBox()
    assert(Math.abs(box.width - expectedSize) < 0.1)
    assert(Math.abs(box.height - expectedSize) < 0.1)
    const offset = box.y + box.height / 2 - trackCenter
    assert(Math.abs(offset) < 0.5, `${await icon.getAttribute('src')} vertical offset: ${offset}px`)
  }
}

for (const [width, height, x, y, cardWidth, cardHeight, iconSize, pattern] of [
  [375, 812, 24, 269, 327, 72, 32, 'mobile'],
  [768, 1024, 64, 375, 640, 88, 40, 'tablet'],
  [1440, 960, 733, 224, 564, 104, 40, 'desktop'],
]) {
  test(`start menu geometry and both themes at ${width}px`, async () => {
    const page = await browser.newPage({ viewport: { width, height }, colorScheme: 'light' })
    const errors = []
    page.on('pageerror', (error) => errors.push(error.message))
    page.on('console', (message) => {
      if (/hydration/i.test(message.text())) errors.push(message.text())
    })
    try {
      await visit(page)
      assert.match(await page.title(), /Frontend Quiz/i)
      assert.equal(
        await page.getByRole('heading', { level: 1 }).innerText(),
        'Welcome to the\nFrontend Quiz!',
      )
      assert.deepEqual(await page.locator('.subject-card').allTextContents(), [
        'HTML',
        'CSS',
        'JavaScript',
        'Accessibility',
      ])
      const cards = page.locator('.subject-card')
      const first = await cards.first().boundingBox()
      for (const [actual, expected] of [
        [first.x, x],
        [first.y, y],
        [first.width, cardWidth],
        [first.height, cardHeight],
      ])
        assert(Math.abs(actual - expected) < 1, `geometry: ${actual} vs ${expected}`)
      assert.equal(await background(page), 'rgb(244, 246, 250)')
      assert.match(
        await page.locator('main').evaluate((el) => getComputedStyle(el).backgroundImage),
        new RegExp(`pattern-background-${pattern}-light.svg`),
      )
      for (const img of await page.locator('.subject-icon img').all()) {
        assert(await img.evaluate((el) => el.complete && el.naturalWidth === 40))
        const box = await img.boundingBox()
        assert(Math.abs(box.width - iconSize) < 0.1)
        assert(Math.abs(box.height - iconSize) < 0.1)
      }
      const toggle = page.getByRole('switch', { name: 'Dark mode' })
      assert.equal(await toggle.getAttribute('aria-checked'), 'false')
      await assertThemeIconAlignment(page, width < 768 ? 16 : 24)
      await screenshot(page, `${width}-light`)
      await toggle.click()
      assert.equal(await toggle.getAttribute('aria-checked'), 'true')
      assert.equal(await background(page), 'rgb(49, 62, 81)')
      assert.equal(
        await cards.first().evaluate((el) => getComputedStyle(el).backgroundColor),
        'rgb(59, 77, 102)',
      )
      assert.deepEqual(await cards.first().boundingBox(), first)
      assert.match(
        await page.locator('main').evaluate((el) => getComputedStyle(el).backgroundImage),
        new RegExp(`pattern-background-${pattern}-dark.svg`),
      )
      await assertThemeIconAlignment(page, width < 768 ? 16 : 24)
      await screenshot(page, `${width}-dark`)
      assert.equal(await page.evaluate((key) => localStorage.getItem(key), themeKey), 'dark')
      await page.reload()
      await page.waitForFunction(() => document.querySelector('main')?.dataset.theme === 'dark')
      assert.equal(await background(page), 'rgb(49, 62, 81)')
      assert.deepEqual(errors, [])
    } finally {
      await page.close()
    }
  })
}

test('saved dark mode is styled before Nuxt hydrates even with a light OS preference', async () => {
  const page = await browser.newPage({ colorScheme: 'light' })
  try {
    await page.addInitScript((key) => localStorage.setItem(key, 'dark'), themeKey)
    // Keep the inline color-mode bootstrap, but prevent the Nuxt app from hydrating.
    await page.route('**/*', (route) => {
      if (route.request().resourceType() === 'script') return route.abort()
      return route.continue()
    })
    await page.goto(`${baseUrl}/frontend-quiz-app`, { waitUntil: 'load' })
    assert.equal(
      await page.evaluate(() => Boolean(document.querySelector('#__nuxt')?.__vue_app__)),
      false,
    )
    assert.equal(
      await page.locator('html').evaluate((el) => el.classList.contains('app-dark')),
      true,
    )
    assert.equal(await background(page), 'rgb(49, 62, 81)')
  } finally {
    await page.close()
  }
})

test('defaults to light regardless of system preference, persists keyboard toggles and stays page-local', async () => {
  const page = await browser.newPage({ colorScheme: 'dark' })
  try {
    await visit(page)
    const toggle = page.getByRole('switch', { name: 'Dark mode' })
    assert.equal(await toggle.getAttribute('aria-checked'), 'false')
    assert.equal(await page.locator('main').getAttribute('data-theme'), 'light')
    assert.equal(await background(page), 'rgb(244, 246, 250)')
    assert.equal(await page.evaluate((key) => localStorage.getItem(key), themeKey), 'light')
    await page.emulateMedia({ colorScheme: 'light' })
    assert.equal(await toggle.getAttribute('aria-checked'), 'false')
    await toggle.focus()
    await page.keyboard.press('Space')
    assert.equal(await toggle.getAttribute('aria-checked'), 'true')
    await page.emulateMedia({ colorScheme: 'dark' })
    await page.emulateMedia({ colorScheme: 'light' })
    assert.equal(await background(page), 'rgb(49, 62, 81)')
    await page.reload()
    await page.waitForFunction(() => document.querySelector('main')?.dataset.theme === 'dark')
    await toggle.focus()
    await page.keyboard.press('Enter')
    assert.equal(await toggle.getAttribute('aria-checked'), 'false')
    assert.equal(await page.evaluate((key) => localStorage.getItem(key), themeKey), 'light')
    await page.emulateMedia({ colorScheme: 'dark' })
    await page.reload()
    await page.waitForFunction(() => document.querySelector('main')?.dataset.theme === 'light')
    assert.equal(await background(page), 'rgb(244, 246, 250)')
    assert.equal(await page.locator('.subjects button').count(), 4)
    await page.getByRole('link', { name: 'All challenges' }).click()
    await page.waitForURL(`${baseUrl}/`)
    await page.locator('#frontend-quiz-app').waitFor({ state: 'detached' })
    assert.equal(await page.locator('#frontend-quiz-app').count(), 0)
    assert.equal(await page.locator('html').getAttribute('data-theme'), null)
  } finally {
    await page.close()
  }
})

test('theme preferences stay reactive across tabs and clearing storage restores light mode', async () => {
  const context = await browser.newContext({ colorScheme: 'light' })
  try {
    const first = await context.newPage()
    const second = await context.newPage()
    await visit(first)
    await visit(second)
    await first.getByRole('switch', { name: 'Dark mode' }).click()
    await second.waitForFunction(() => document.querySelector('main')?.dataset.theme === 'dark')
    assert.equal(await background(second), 'rgb(49, 62, 81)')

    await second.getByRole('switch', { name: 'Dark mode' }).click()
    await first.waitForFunction(() => document.querySelector('main')?.dataset.theme === 'light')
    assert.equal(await background(first), 'rgb(244, 246, 250)')

    await first.getByRole('switch', { name: 'Dark mode' }).click()
    await second.waitForFunction(() => document.querySelector('main')?.dataset.theme === 'dark')
    await first.emulateMedia({ colorScheme: 'dark' })
    await second.evaluate((key) => localStorage.removeItem(key), themeKey)
    await first.waitForFunction(
      () =>
        document.querySelector('main')?.dataset.theme === 'light' &&
        document.querySelector('[role="switch"]')?.getAttribute('aria-checked') === 'false',
    )
    assert.equal(await first.getByRole('switch').getAttribute('aria-checked'), 'false')
    assert.equal(await background(first), 'rgb(244, 246, 250)')
    assert.equal(await first.evaluate((key) => localStorage.getItem(key), themeKey), 'light')
  } finally {
    await context.close()
  }
})

test('unavailable or invalid storage does not break the menu or switch', async () => {
  for (const [blocked, colorScheme] of [
    [false, 'dark'],
    [false, 'light'],
    [true, 'dark'],
    [true, 'light'],
  ]) {
    const page = await browser.newPage({ colorScheme })
    try {
      await page.addInitScript(
        ({ blocked, key }) => {
          if (blocked) {
            // Deny this feature's storage without blocking Nuxt devtools' own initialization.
            for (const method of ['getItem', 'setItem']) {
              const original = Storage.prototype[method]
              Storage.prototype[method] = function (itemKey, ...args) {
                if (itemKey === key) throw new DOMException('Storage is blocked', 'SecurityError')
                return original.call(this, itemKey, ...args)
              }
            }
          } else localStorage.setItem(key, 'invalid')
        },
        { blocked, key: themeKey },
      )
      await visit(page)
      const toggle = page.getByRole('switch', { name: 'Dark mode' })
      assert.equal(await toggle.getAttribute('aria-checked'), 'false')
      assert.equal(await page.locator('main').getAttribute('data-theme'), 'light')
      assert.equal(await background(page), 'rgb(244, 246, 250)')
      await toggle.click()
      assert.equal(await toggle.getAttribute('aria-checked'), 'true')
      assert.equal(await background(page), 'rgb(49, 62, 81)')
      await toggle.click()
      assert.equal(await toggle.getAttribute('aria-checked'), 'false')
      assert.equal(await background(page), 'rgb(244, 246, 250)')
    } finally {
      await page.close()
    }
  }
})

const designQuestion = {
  question:
    'Which of these color contrast ratios defines the minimum WCAG 2.1 Level AA requirement for normal text?',
  options: ['4.5 : 1', '3 : 1', '2.5 : 1', '5 : 1'],
  answer: '4.5 : 1',
}

async function chooseAnswer(page, answer) {
  await page
    .locator('.answer-option')
    .filter({
      has: page.getByRole('radio', { name: answer, exact: true }),
    })
    .click()
}

async function mockDesignQuiz(page) {
  await page.route('**/api/frontend-quizes', (route) =>
    route.fulfill({
      json: {
        success: true,
        data: [
          {
            title: 'Accessibility',
            icon: '/img/frontend-quiz-app/icon-accessibility.svg',
            questions: Array.from({ length: 10 }, () => designQuestion),
          },
        ],
      },
    }),
  )
}

for (const [width, height, x, y, cardWidth, cardHeight] of [
  [375, 812, 24, 317, 327, 72],
  [768, 1024, 64, 424.6, 640, 88],
  [1440, 960, 733, 224, 564, 104],
]) {
  test(`question layout, selections and feedback in both themes at ${width}px`, async () => {
    const page = await browser.newPage({ viewport: { width, height }, colorScheme: 'light' })
    const errors = []
    page.on('pageerror', (error) => errors.push(error.message))
    try {
      await mockDesignQuiz(page)
      await visitFromGallery(page)
      await page.getByRole('button', { name: 'Accessibility', exact: true }).click()
      assert.equal(
        await page.getByRole('heading', { level: 1 }).innerText(),
        designQuestion.question,
      )
      for (let index = 0; index < 5; index++) {
        await chooseAnswer(page, '4.5 : 1')
        await page.getByRole('button', { name: 'Submit Answer' }).click()
        await page.getByRole('button', { name: 'Next Question' }).click()
      }
      await page.evaluate(() => scrollTo(0, 0))
      assert.equal(await page.locator('.question-count').innerText(), 'Question 6 of 10')
      assert.equal(await page.getByRole('progressbar').getAttribute('aria-valuenow'), '6')
      const first = await page.locator('.answer-option').first().boundingBox()
      for (const [actual, expected] of [
        [first.x, x],
        [first.y, y],
        [first.width, cardWidth],
        [first.height, cardHeight],
      ])
        assert(Math.abs(actual - expected) < 1, `question geometry: ${actual} vs ${expected}`)
      assert.equal(await page.getByRole('button', { name: 'Submit Answer' }).isDisabled(), true)
      await screenshot(page, `${width}-question-light`)
      await page.locator('.answer-option').nth(1).hover()
      assert.equal(
        await page
          .locator('.answer-letter')
          .nth(1)
          .evaluate((el) => getComputedStyle(el).backgroundColor),
        'rgb(167, 41, 245)',
      )
      assert.equal(
        await page
          .locator('.answer-letter')
          .nth(1)
          .evaluate((el) => getComputedStyle(el).color),
        'rgb(255, 255, 255)',
      )
      assert.equal(
        await page
          .locator('.answer-option')
          .nth(1)
          .evaluate((el) => getComputedStyle(el).getPropertyValue('--option-accent').trim()),
        '#a729f5',
      )
      assert.equal(await page.locator('input:checked').count(), 0)
      assert.equal(await page.getByRole('button', { name: 'Submit Answer' }).isDisabled(), true)
      await page.getByRole('switch').click()
      assert.equal(await background(page), 'rgb(49, 62, 81)')
      assert.equal(
        await page
          .locator('.answer-option')
          .first()
          .evaluate((el) => getComputedStyle(el).backgroundColor),
        'rgb(59, 77, 102)',
      )
      await screenshot(page, `${width}-question-dark`)
      await chooseAnswer(page, '4.5 : 1')
      assert.equal(await page.locator('.answer-option--selected').count(), 1)
      assert.equal(await page.locator('.answer-feedback').count(), 0)
      await page.evaluate(() => scrollTo(0, 0))
      await screenshot(page, `${width}-selected-dark`)
      await page.getByRole('switch').click()
      await screenshot(page, `${width}-selected-light`)
      await page.getByRole('button', { name: 'Submit Answer' }).click()
      assert.equal(await page.locator('.answer-option--correct').count(), 1)
      assert.equal(await page.locator('input:disabled').count(), 4)
      assert.equal(await page.locator('.answer-form [role="status"]').innerText(), 'Correct!')
      await page.evaluate(() => scrollTo(0, 0))
      await screenshot(page, `${width}-correct-light`)
      await page.getByRole('switch').click()
      await screenshot(page, `${width}-correct-dark`)
      await page.getByRole('button', { name: 'Next Question' }).click()
      await chooseAnswer(page, '2.5 : 1')
      await page.getByRole('button', { name: 'Submit Answer' }).click()
      assert.equal(await page.locator('.answer-option--incorrect').count(), 1)
      assert.equal(await page.getByAltText('Correct answer', { exact: true }).count(), 1)
      assert.equal(await page.getByAltText('Incorrect answer', { exact: true }).count(), 1)
      assert.equal(
        await page.locator('.answer-form [role="status"]').innerText(),
        `Incorrect. The correct answer is ${designQuestion.answer}.`,
      )
      await page.evaluate(() => scrollTo(0, 0))
      await screenshot(page, `${width}-incorrect-dark`)
      await page.getByRole('switch').click()
      await screenshot(page, `${width}-incorrect-light`)
      assert.deepEqual(errors, [])
    } finally {
      await page.close()
    }
  })
}

async function finishDesignQuiz(page, correctAnswers = 8) {
  await mockDesignQuiz(page)
  await visitFromGallery(page)
  await page.getByRole('button', { name: 'Accessibility', exact: true }).click()
  for (let index = 0; index < 10; index++) {
    await chooseAnswer(page, index < correctAnswers ? '4.5 : 1' : '3 : 1')
    await page.getByRole('button', { name: 'Submit Answer' }).click()
    await page.getByRole('button', { name: index === 9 ? 'See results' : 'Next Question' }).click()
  }
}

for (const [
  width,
  height,
  headingX,
  headingY,
  headingWidth,
  headingHeight,
  cardX,
  cardY,
  cardWidth,
  cardHeight,
  buttonY,
  buttonHeight,
] of [
  [375, 812, 24, 104, 327, 88, 24, 232, 327, 242, 490, 56],
  [768, 1024, 64, 145, 640, 136, 64, 345, 640, 388, 765, 92],
  [1440, 960, 140, 224, 465, 136, 733, 224, 564, 388, 644, 92],
]) {
  test(`results layout, score and restart in both themes at ${width}px`, async () => {
    const page = await browser.newPage({ viewport: { width, height }, colorScheme: 'light' })
    const errors = []
    page.on('pageerror', (error) => errors.push(error.message))
    try {
      await finishDesignQuiz(page)
      const heading = page.getByRole('heading', { level: 1 })
      assert.equal((await heading.innerText()).replace(/\s+/g, ' '), 'Quiz completed You scored...')
      assert.equal(await heading.evaluate((el) => document.activeElement === el), true)
      assert.match(await page.locator('.score').ariaSnapshot(), /Your score: 8 out of 10/)
      await page.waitForFunction(() => document.querySelector('.score-value')?.textContent === '8')
      assert.equal(await page.locator('.score-value').innerText(), '8')
      assert.equal(await page.locator('.score-total').innerText(), 'out of 10')
      assert.equal(await page.locator('.score-card .subject-label').innerText(), 'Accessibility')
      assert.equal(await page.getByRole('radio').count(), 0)
      await page.evaluate(() => scrollTo(0, 0))
      for (const [locator, expected] of [
        [heading, [headingX, headingY, headingWidth, headingHeight]],
        [page.locator('.score-card'), [cardX, cardY, cardWidth, cardHeight]],
        [
          page.getByRole('button', { name: 'Play Again' }),
          [cardX, buttonY, cardWidth, buttonHeight],
        ],
      ]) {
        const box = await locator.boundingBox()
        for (const [index, property] of ['x', 'y', 'width', 'height'].entries())
          assert(
            Math.abs(box[property] - expected[index]) < 1,
            `results ${property}: ${box[property]} vs ${expected[index]}`,
          )
      }
      assert.equal(
        await page.locator('.score-card').evaluate((el) => getComputedStyle(el).backgroundColor),
        'rgb(255, 255, 255)',
      )
      await screenshot(page, `${width}-results-light`)
      await page.getByRole('switch').click()
      assert.equal(await background(page), 'rgb(49, 62, 81)')
      assert.equal(
        await page.locator('.score-card').evaluate((el) => getComputedStyle(el).backgroundColor),
        'rgb(59, 77, 102)',
      )
      assert.equal(
        await page.locator('.score-value').evaluate((el) => getComputedStyle(el).color),
        'rgb(255, 255, 255)',
      )
      assert.equal(
        await page.locator('.score-total').evaluate((el) => getComputedStyle(el).color),
        'rgb(171, 193, 225)',
      )
      assert.equal(await page.locator('.score-value').innerText(), '8')
      await screenshot(page, `${width}-results-dark`)
      await heading.focus()
      await page.keyboard.press('Tab')
      assert.equal(await page.locator(':focus').innerText(), 'Play Again')
      await page.keyboard.press('Enter')
      assert.equal(await page.locator('.results-view').count(), 0)
      assert.equal(await page.locator(':focus').getAttribute('id'), 'quiz-title')
      assert.equal(await background(page), 'rgb(49, 62, 81)')
      await page.getByRole('button', { name: 'Accessibility', exact: true }).click()
      assert.equal(await page.locator('.question-count').innerText(), 'Question 1 of 10')
      assert.equal(await page.getByRole('button', { name: 'Submit Answer' }).isDisabled(), true)
      assert.deepEqual(errors, [])
    } finally {
      await page.close()
    }
  })
}

test('score counts up in whole numbers without replaying on a theme change', async () => {
  const page = await browser.newPage({ colorScheme: 'light', reducedMotion: 'no-preference' })
  try {
    await page.addInitScript(() => {
      window.scoreSamples = []
      new MutationObserver(() => {
        const score = document.querySelector('.score-value')
        if (!score) return
        const value = Number(score.textContent)
        if (window.scoreSamples.at(-1) !== value) window.scoreSamples.push(value)
      }).observe(document, { subtree: true, childList: true, characterData: true })
    })
    await finishDesignQuiz(page)
    assert.match(await page.locator('.score').ariaSnapshot(), /Your score: 8 out of 10/)
    const cardBefore = await page.locator('.score-card').boundingBox()
    await page.waitForFunction(
      () => Number(document.querySelector('.score-value')?.textContent) >= 2,
    )
    await page.getByRole('switch').click()
    await page.waitForFunction(() => document.querySelector('.score-value')?.textContent === '8')
    const samples = await page.evaluate(() => window.scoreSamples)
    assert.equal(samples[0], 0)
    assert.equal(samples.at(-1), 8)
    assert(samples.some((value) => value > 0 && value < 8))
    assert(
      samples.every(
        (value, index) => Number.isInteger(value) && (index === 0 || value > samples[index - 1]),
      ),
    )
    assert.deepEqual(await page.locator('.score-card').boundingBox(), cardBefore)
    assert.equal(await background(page), 'rgb(49, 62, 81)')
  } finally {
    await page.close()
  }
})

test('reduced motion shows the final score immediately and a zero score stays static', async () => {
  for (const [reducedMotion, score] of [
    ['reduce', 8],
    ['no-preference', 0],
  ]) {
    const page = await browser.newPage({ reducedMotion })
    try {
      await finishDesignQuiz(page, score)
      assert.equal(await page.locator('.score-value').innerText(), String(score))
      assert.match(
        await page.locator('.score').ariaSnapshot(),
        new RegExp(`Your score: ${score} out of 10`),
      )
      await page.getByRole('switch').click()
      assert.equal(await page.locator('.score-value').innerText(), String(score))
    } finally {
      await page.close()
    }
  }
})

test('results remain scrollable without overflow at intermediate widths and short heights', async () => {
  const page = await browser.newPage({ colorScheme: 'light' })
  try {
    await finishDesignQuiz(page)
    for (const colorScheme of ['light', 'dark']) {
      await page.emulateMedia({ colorScheme })
      for (const width of [320, 375, 600, 767, 768, 900, 1024, 1199, 1200, 1280, 1440, 1920]) {
        await page.setViewportSize({ width, height: 568 })
        assert.equal(
          await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
          false,
        )
        const button = page.getByRole('button', { name: 'Play Again' })
        await button.scrollIntoViewIfNeeded()
        const box = await button.boundingBox()
        assert(box.y >= 0 && box.y + box.height <= 568)
      }
    }
  } finally {
    await page.close()
  }
})

test('real API quiz works with the keyboard, scores once and restarts without persisting progress', async () => {
  const page = await browser.newPage({ colorScheme: 'light' })
  try {
    await visit(page)
    const response = await page.request.get(`${baseUrl}/api/frontend-quizes`)
    const quiz = (await response.json()).data.find((subject) => subject.title === 'HTML')
    await page.getByRole('button', { name: 'HTML', exact: true }).focus()
    await page.keyboard.press('Enter')
    for (const [index, question] of quiz.questions.entries()) {
      assert.equal(await page.getByRole('heading', { level: 1 }).innerText(), question.question)
      assert.equal(await page.getByRole('button', { name: 'Submit Answer' }).isDisabled(), true)
      await page.getByRole('radio').first().focus()
      await page.keyboard.press('Space')
      await page.keyboard.press('ArrowDown')
      assert.equal(await page.getByRole('radio').nth(1).isChecked(), true)
      await page.getByRole('radio', { name: question.answer, exact: true }).focus()
      await page.keyboard.press('Space')
      await page.keyboard.press('Tab')
      await page.keyboard.press('Enter')
      assert.equal(await page.locator('.answer-form [role="status"]').innerText(), 'Correct!')
      assert.equal(
        await page.locator(':focus').innerText(),
        index === 9 ? 'See results' : 'Next Question',
      )
      await page.keyboard.press('Enter')
    }
    assert.equal(
      (await page.getByRole('heading', { level: 1 }).innerText()).replace(/\s+/g, ' '),
      'Quiz completed You scored...',
    )
    assert.equal(await page.locator(':focus').evaluate((el) => el.tagName), 'H1')
    assert.match(await page.locator('.score').ariaSnapshot(), /Your score: 10 out of 10/)
    await page.waitForFunction(() => document.querySelector('.score-value')?.textContent === '10')
    assert.equal(await page.locator('.score-value').innerText(), '10')
    assert.equal(await page.locator('.score-total').innerText(), 'out of 10')
    await page.getByRole('switch').click()
    await page.getByRole('button', { name: 'Play Again' }).click()
    assert.equal(await page.locator(':focus').getAttribute('id'), 'quiz-title')
    await page.getByRole('button', { name: 'CSS', exact: true }).click()
    assert.equal(await page.locator('.question-count').innerText(), 'Question 1 of 10')
    await page.reload()
    await page.getByRole('button', { name: 'HTML', exact: true }).waitFor()
    await page.waitForFunction(() => document.querySelector('main')?.dataset.theme === 'dark')
    assert.equal(await page.locator('.questions-view').count(), 0)
    assert.equal(await background(page), 'rgb(49, 62, 81)')
  } finally {
    await page.close()
  }
})

test('questions and long answers remain scrollable without overflow at intermediate widths', async () => {
  const page = await browser.newPage()
  try {
    await page.route('**/api/frontend-quizes', (route) =>
      route.fulfill({
        json: {
          success: true,
          data: [
            {
              title: 'HTML',
              icon: '/img/frontend-quiz-app/icon-html.svg',
              questions: [
                {
                  question: 'Which HTML element is used for the largest heading?',
                  options: [
                    '<heading>',
                    '<h1>',
                    'A much longer multiline answer that must wrap within the available card width at every breakpoint.',
                    'UnbrokenText'.repeat(20),
                  ],
                  answer: '<h1>',
                },
              ],
            },
          ],
        },
      }),
    )
    await visitFromGallery(page)
    await page.getByRole('button', { name: 'HTML', exact: true }).click()
    await chooseAnswer(page, '<h1>')
    await page.getByRole('button', { name: 'Submit Answer' }).click()
    for (const width of [320, 375, 600, 767, 768, 900, 1024, 1199, 1200, 1280, 1440, 1920]) {
      await page.setViewportSize({ width, height: 568 })
      assert.equal(
        await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
        false,
      )
      await page.getByRole('button', { name: 'See results' }).scrollIntoViewIfNeeded()
      const last = await page.getByRole('button', { name: 'See results' }).boundingBox()
      assert(last.y >= 0 && last.y + last.height <= 568)
    }
  } finally {
    await page.close()
  }
})

test('intermediate widths, zoom-sized viewport and short screens remain scrollable without overflow', async () => {
  const page = await browser.newPage()
  try {
    await visit(page)
    for (const width of [320, 375, 600, 767, 768, 900, 1024, 1199, 1200, 1440, 1920]) {
      await page.setViewportSize({ width, height: 568 })
      assert.equal(
        await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
        false,
      )
      await page.locator('.subject-card').last().scrollIntoViewIfNeeded()
      const last = await page.locator('.subject-card').last().boundingBox()
      assert(last.y >= 0 && last.y + last.height <= 568)
    }
  } finally {
    await page.close()
  }
})
