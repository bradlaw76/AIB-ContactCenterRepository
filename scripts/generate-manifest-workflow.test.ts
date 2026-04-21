/* @vitest-environment node */

import { describe, expect, it } from 'vitest'
import fs from 'node:fs'

const workflowPath = '.github/workflows/normalize-content-manifest.yml'
const workflowText = fs.readFileSync(workflowPath, 'utf8')

describe('normalize-content-manifest workflow static checks', () => {
  it('has expected trigger paths', () => {
    expect(workflowText).toContain('pull_request:')
    expect(workflowText).toContain('push:')
    expect(workflowText).toContain("- 'content-index.json'")
    expect(workflowText).toContain("- 'content/**'")
    expect(workflowText).toContain('workflow_dispatch:')
  })

  it('uses check-only behavior in pull_request mode and fails when file is dirty', () => {
    expect(workflowText).toContain("if: github.event_name == 'pull_request'")
    expect(workflowText).toContain('Fail PR if manifest is not normalized')
    expect(workflowText).toContain('git --no-pager diff -- content-index.json')
    expect(workflowText).toContain('exit 1')
  })

  it('uses push mode commit only when needed', () => {
    expect(workflowText).toContain("if: github.event_name == 'push' && github.ref_name == github.event.repository.default_branch")
    expect(workflowText).toContain('if git diff --quiet -- content-index.json; then')
    expect(workflowText).toContain("github.actor != 'github-actions[bot]'")
    expect(workflowText).toContain('git commit -m "chore: normalize content manifest"')
    expect(workflowText).toContain('git push')
  })
})
