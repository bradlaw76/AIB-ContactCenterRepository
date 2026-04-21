/* @vitest-environment node */

import { describe, expect, it } from 'vitest'
import path from 'node:path'
import os from 'node:os'
import fs from 'node:fs'
import { spawnSync } from 'node:child_process'
import {
  normalizeManifest,
  formatManifest,
  normalizeManifestFile,
} from './normalize-manifest.mjs'

describe('normalize-manifest script', () => {
  it('sorts categories alphabetically case-insensitive', () => {
    const normalized = normalizeManifest({
      version: '1.0',
      generatedAt: '2026-04-21T00:00:00.000Z',
      resources: [],
      categories: [
        { name: 'zeta', order: 10 },
        { name: 'Alpha', order: 20 },
        { name: 'beta', order: 30 },
      ],
    })

    expect(normalized.categories.map((item: { name: string }) => item.name)).toEqual([
      'Alpha',
      'beta',
      'zeta',
    ])
  })

  it('sorts resources by uploadDate desc then title asc', () => {
    const normalized = normalizeManifest({
      version: '1.0',
      generatedAt: '2026-04-21T00:00:00.000Z',
      categories: [],
      resources: [
        { id: '3', title: 'Zulu', uploadDate: '2026-04-20T00:00:00.000Z' },
        { id: '2', title: 'Alpha', uploadDate: '2026-04-21T00:00:00.000Z' },
        { id: '1', title: 'beta', uploadDate: '2026-04-21T00:00:00.000Z' },
      ],
    })

    expect(normalized.resources.map((item: { id: string }) => item.id)).toEqual(['2', '1', '3'])
  })

  it('preserves required keys and writes formatted output', () => {
    const manifest = {
      version: '1.0',
      generatedAt: '2026-04-21T00:00:00.000Z',
      resources: [{ id: '1', title: 'A', uploadDate: '2026-04-21T00:00:00.000Z' }],
      categories: [{ name: 'Training', order: 1 }],
      extra: { note: 'keep me' },
    }

    const normalized = normalizeManifest(manifest)
    const serialized = formatManifest(normalized)
    const parsed = JSON.parse(serialized)

    expect(parsed).toHaveProperty('version')
    expect(parsed).toHaveProperty('generatedAt')
    expect(parsed).toHaveProperty('resources')
    expect(parsed).toHaveProperty('categories')
    expect(parsed).toHaveProperty('extra')
    expect(serialized.endsWith('\n')).toBe(true)
    expect(serialized).toContain('\n  "version": "1.0"')
    expect(serialized).toContain('\n  "resources": [')
  })

  it('exits with failure on invalid shape missing required root keys', () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'normalize-manifest-invalid-'))
    const manifestPath = path.join(tempDir, 'content-index.json')
    fs.writeFileSync(manifestPath, JSON.stringify({ resources: [], categories: [] }), 'utf8')

    const result = spawnSync('node', [path.resolve('scripts/normalize-manifest.mjs'), manifestPath], {
      encoding: 'utf8',
    })

    expect(result.status).not.toBe(0)
    expect(result.stderr).toContain('missing required root keys')
  })

  it('normalizes an on-disk file in place', () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'normalize-manifest-valid-'))
    const manifestPath = path.join(tempDir, 'content-index.json')

    fs.writeFileSync(
      manifestPath,
      JSON.stringify(
        {
          version: '1.0',
          generatedAt: '2026-04-21T00:00:00.000Z',
          resources: [
            { id: 'z', title: 'Zulu', uploadDate: '2026-04-20T00:00:00.000Z' },
            { id: 'a', title: 'Alpha', uploadDate: '2026-04-20T00:00:00.000Z' },
          ],
          categories: [
            { name: 'zeta', order: 2 },
            { name: 'Alpha', order: 1 },
          ],
        },
        null,
        2
      ),
      'utf8'
    )

    normalizeManifestFile(manifestPath)

    const updated = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
    expect(updated.categories.map((item: { name: string }) => item.name)).toEqual(['Alpha', 'zeta'])
    expect(updated.resources.map((item: { id: string }) => item.id)).toEqual(['a', 'z'])
  })
})
