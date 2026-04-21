import fs from 'node:fs'
import { pathToFileURL } from 'node:url'

const REQUIRED_ROOT_KEYS = ['version', 'generatedAt', 'resources', 'categories']

export function validateManifestShape(manifest) {
  if (!manifest || typeof manifest !== 'object' || Array.isArray(manifest)) {
    throw new Error('Manifest must be a JSON object')
  }

  const missingKeys = REQUIRED_ROOT_KEYS.filter((key) => !(key in manifest))
  if (missingKeys.length > 0) {
    throw new Error(`Manifest missing required root keys: ${missingKeys.join(', ')}`)
  }

  if (!Array.isArray(manifest.resources)) {
    throw new Error('Manifest resources must be an array')
  }

  if (!Array.isArray(manifest.categories)) {
    throw new Error('Manifest categories must be an array')
  }
}

function compareStringsCaseInsensitive(a, b) {
  return a.localeCompare(b, undefined, { sensitivity: 'base' })
}

function compareResourceUploadDateDescThenTitleAsc(left, right) {
  const leftTime = Date.parse(left.uploadDate)
  const rightTime = Date.parse(right.uploadDate)
  const leftValue = Number.isNaN(leftTime) ? Number.NEGATIVE_INFINITY : leftTime
  const rightValue = Number.isNaN(rightTime) ? Number.NEGATIVE_INFINITY : rightTime

  if (rightValue !== leftValue) {
    return rightValue - leftValue
  }

  return compareStringsCaseInsensitive(String(left.title ?? ''), String(right.title ?? ''))
}

export function normalizeManifest(manifest) {
  validateManifestShape(manifest)

  return {
    ...manifest,
    categories: [...manifest.categories].sort((a, b) =>
      compareStringsCaseInsensitive(String(a?.name ?? ''), String(b?.name ?? ''))
    ),
    resources: [...manifest.resources].sort(compareResourceUploadDateDescThenTitleAsc),
  }
}

export function formatManifest(manifest) {
  return `${JSON.stringify(manifest, null, 2)}\n`
}

export function normalizeManifestFile(filePath = 'content-index.json') {
  const raw = fs.readFileSync(filePath, 'utf8')
  const parsed = JSON.parse(raw)
  const normalized = normalizeManifest(parsed)
  const formatted = formatManifest(normalized)
  fs.writeFileSync(filePath, formatted, 'utf8')
}

const entryScriptUrl = process.argv[1] ? pathToFileURL(process.argv[1]).href : ''

if (import.meta.url === entryScriptUrl) {
  try {
    normalizeManifestFile(process.argv[2])
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown manifest normalization error'
    console.error(`[normalize-manifest] ${message}`)
    process.exitCode = 1
  }
}
