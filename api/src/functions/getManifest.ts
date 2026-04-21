/*
=============================================================================
COMPONENT:    GET /api/manifest Function
FILE:         api/src/functions/getManifest.ts
VERSION:      1.0.0
AUTHOR:       Fenster / AIB Contact Center Team
LAST UPDATED: 2026-04-21
ENVIRONMENT:  Azure Functions v4 / Azure Static Web Apps

------------------------------------------------------------------------------
OVERVIEW
------------------------------------------------------------------------------
Public HTTP endpoint that returns the content-index.json manifest from
GitHub. Used by the React SPA on app mount to populate ManifestContext.
Adds a 60-second public cache header to reduce GitHub API calls.

------------------------------------------------------------------------------
ARCHITECTURE
------------------------------------------------------------------------------
- Trigger:      HTTP GET /api/manifest
- Auth Level:   Anonymous (public read)
- Data Source:  content-index.json via GitHub API (getManifest helper)
- Caching:      Cache-Control: public, max-age=60

------------------------------------------------------------------------------
FEATURES
------------------------------------------------------------------------------
- Returns full manifest JSON
- 60-second CDN/browser cache
- 500 error with safe message on failure

------------------------------------------------------------------------------
PREREQUISITES
------------------------------------------------------------------------------
1. Env Var: GITHUB_TOKEN
2. Env Var: GITHUB_OWNER
3. Env Var: GITHUB_REPO

------------------------------------------------------------------------------
SECURITY MODEL
------------------------------------------------------------------------------
- No auth required (public read endpoint)
- No sensitive data exposed — manifest is intentionally public metadata

------------------------------------------------------------------------------
KNOWN LIMITATIONS
------------------------------------------------------------------------------
- Cache is client/CDN only; no server-side caching in v1

------------------------------------------------------------------------------
TEST CASES
------------------------------------------------------------------------------
✔ Returns 200 with manifest JSON on success
✔ Returns 500 with { error } on GitHub API failure
✔ Response includes Content-Type: application/json
✔ Response includes Cache-Control: public, max-age=60

------------------------------------------------------------------------------
CHANGELOG
------------------------------------------------------------------------------
v1.0.0  2026-04-21  Initial version
=============================================================================
*/

import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { getManifest } from '../manifest.js';

export async function getManifestHandler(
  _request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  try {
    const { manifest } = await getManifest();
    return {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=60',
      },
      body: JSON.stringify(manifest),
    };
  } catch (err) {
    context.error('getManifest error:', err);
    return {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Failed to load manifest' }),
    };
  }
}

app.http('getManifest', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'manifest',
  handler: getManifestHandler,
});
