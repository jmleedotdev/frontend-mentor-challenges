import { existsSync, readdirSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { challenges } from '../../server/utils/challenges'

const pagesDir = new URL('../../app/pages/', import.meta.url)
const slugs = challenges.map((challenge) => challenge.slug)

describe('challenge data ↔ pages', () => {
  it('has unique slugs', () => expect(new Set(slugs).size).toBe(slugs.length))

  it.each(slugs)('has a page for "%s"', (slug) =>
    expect(existsSync(new URL(`${slug}/index.vue`, pagesDir))).toBe(true),
  )

  it('has a data entry for every challenge page folder', () => {
    const pageFolders = readdirSync(pagesDir, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
    expect(pageFolders.filter((folder) => !slugs.includes(folder))).toEqual([])
  })
})
