/*
=============================================================================
COMPONENT:    Manifest GitHub Helper
FILE:         api/src/manifest.ts
VERSION:      1.0.0
AUTHOR:       Fenster / AIB Contact Center Team
LAST UPDATED: 2026-04-21
ENVIRONMENT:  Azure Functions v4 / Node.js

------------------------------------------------------------------------------
OVERVIEW
------------------------------------------------------------------------------
Reads and writes the content-index.json manifest stored in the GitHub
repository using the Octokit REST API. Returns the manifest object and
the file SHA needed for optimistic-lock updates.

------------------------------------------------------------------------------
ARCHITECTURE
------------------------------------------------------------------------------
- Data Source:    GitHub repo file: content-index.json
- Auth Model:     GITHUB_TOKEN personal access token (env var)
- Repo Config:    GITHUB_OWNER, GITHUB_REPO env vars
- Used By:        getManifest, uploadResource, updateResource, deleteResource

------------------------------------------------------------------------------
FEATURES
------------------------------------------------------------------------------
- getManifest:    Fetches and decodes content-index.json from GitHub
- updateManifest: Commits updated manifest back to GitHub with SHA lock

------------------------------------------------------------------------------
PREREQUISITES
------------------------------------------------------------------------------
1. Env Var: GITHUB_TOKEN — PAT with repo:contents read/write
2. Env Var: GITHUB_OWNER — repository owner (e.g., bradlaw76)
3. Env Var: GITHUB_REPO  — repository name

------------------------------------------------------------------------------
SECURITY MODEL
------------------------------------------------------------------------------
- Auth Token:     GITHUB_TOKEN from process.env — never hardcoded
- SHA Lock:       Prevents overwrite conflicts via GitHub's SHA optimistic lock

------------------------------------------------------------------------------
KNOWN LIMITATIONS
------------------------------------------------------------------------------
- No retry logic on concurrent writes; last-write-wins if SHA expires between
  read and write in a race condition (acceptable for v1 low-traffic scenario)

------------------------------------------------------------------------------
CHANGELOG
------------------------------------------------------------------------------
v1.0.0  2026-04-21  Initial version
=============================================================================
*/

import { Octokit } from '@octokit/rest';
import { Manifest } from './types.js';

interface ManifestResult {
  manifest: Manifest;
  sha: string;
}

function getOctokit(): Octokit {
  const token = process.env['GITHUB_TOKEN'];
  if (!token) throw new Error('GITHUB_TOKEN environment variable is not set');
  return new Octokit({ auth: token });
}

function getRepoConfig(): { owner: string; repo: string } {
  const owner = process.env['GITHUB_OWNER'];
  const repo = process.env['GITHUB_REPO'];
  if (!owner || !repo) {
    throw new Error('GITHUB_OWNER and GITHUB_REPO environment variables are required');
  }
  return { owner, repo };
}

export async function getManifest(): Promise<ManifestResult> {
  const octokit = getOctokit();
  const { owner, repo } = getRepoConfig();

  const response = await octokit.repos.getContent({
    owner,
    repo,
    path: 'content-index.json',
  });

  const file = response.data;
  if (Array.isArray(file) || file.type !== 'file') {
    throw new Error('content-index.json is not a file');
  }

  const content = Buffer.from(file.content, 'base64').toString('utf-8');
  const manifest = JSON.parse(content) as Manifest;

  return { manifest, sha: file.sha };
}

export async function updateManifest(
  manifest: Manifest,
  sha: string,
  message: string
): Promise<void> {
  const octokit = getOctokit();
  const { owner, repo } = getRepoConfig();

  const content = Buffer.from(JSON.stringify(manifest, null, 2), 'utf-8').toString('base64');

  await octokit.repos.createOrUpdateFileContents({
    owner,
    repo,
    path: 'content-index.json',
    message,
    content,
    sha,
  });
}
