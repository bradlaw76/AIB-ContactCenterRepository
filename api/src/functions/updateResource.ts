/*
=============================================================================
COMPONENT:    PUT /api/resource/{id} Function
FILE:         api/src/functions/updateResource.ts
VERSION:      1.0.0
AUTHOR:       Fenster / AIB Contact Center Team
LAST UPDATED: 2026-04-21
ENVIRONMENT:  Azure Functions v4 / Azure Static Web Apps

------------------------------------------------------------------------------
OVERVIEW
------------------------------------------------------------------------------
Authenticated HTTP endpoint allowing a content manager to update the
metadata (title, description, category, featured) of a resource they own.
Patches the manifest entry and commits the change to GitHub.

------------------------------------------------------------------------------
ARCHITECTURE
------------------------------------------------------------------------------
- Trigger:      HTTP PUT /api/resource/{id}
- Auth Level:   Anonymous (SWA handles Entra auth; server validates role)
- Role Gate:    requireContentManager() — x-ms-client-principal header
- Ownership:    uploadedBy must match current user's userDetails
- Manifest:     Updated via GitHub API commit

------------------------------------------------------------------------------
FEATURES
------------------------------------------------------------------------------
- Role enforcement: content-manager required
- Ownership check: only the original uploader can edit
- Partial patch: only provided fields are updated
- Manifest commit with descriptive message

------------------------------------------------------------------------------
PREREQUISITES
------------------------------------------------------------------------------
1. Env Var: GITHUB_TOKEN
2. Env Var: GITHUB_OWNER
3. Env Var: GITHUB_REPO

------------------------------------------------------------------------------
SECURITY MODEL
------------------------------------------------------------------------------
- Auth Token:     x-ms-client-principal from SWA
- Role Gate:      'content-manager' required
- Ownership Gate: uploadedBy === principal.userDetails

------------------------------------------------------------------------------
KNOWN LIMITATIONS
------------------------------------------------------------------------------
- File binary cannot be replaced via this endpoint (upload only creates new)
- SHA conflict possible if two managers edit concurrently (rare in v1)

------------------------------------------------------------------------------
TEST CASES
------------------------------------------------------------------------------
✔ Returns 401 without auth
✔ Returns 403 for non-content-manager
✔ Returns 404 for unknown id
✔ Returns 403 when editing another user's resource
✔ Returns 200 with updated resource on success
✔ Manifest reflects updated fields after commit

------------------------------------------------------------------------------
CHANGELOG
------------------------------------------------------------------------------
v1.0.0  2026-04-21  Initial version
=============================================================================
*/

import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { requireContentManager } from '../auth.js';
import { getManifest, updateManifest } from '../manifest.js';
import { UploadMetadata } from '../types.js';

async function updateResourceHandler(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  let principal;
  try {
    principal = requireContentManager(request);
  } catch (err) {
    const e = err as Error & { statusCode?: number };
    return {
      status: e.statusCode ?? 401,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: e.message }),
    };
  }

  const id = request.params['id'];
  if (!id) {
    return {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Missing resource id' }),
    };
  }

  try {
    const body = (await request.json()) as Partial<UploadMetadata>;
    const { manifest, sha } = await getManifest();

    const index = manifest.resources.findIndex((r) => r.id === id);
    if (index === -1) {
      return {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Resource not found' }),
      };
    }

    const resource = manifest.resources[index];

    if (resource.uploadedBy !== principal.userDetails) {
      return {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'You do not own this resource' }),
      };
    }

    // Patch fields
    if (body.title !== undefined) resource.title = body.title;
    if (body.description !== undefined) resource.description = body.description;
    if (body.category !== undefined) resource.category = body.category;
    if (body.featured !== undefined) resource.featured = body.featured;

    manifest.resources[index] = resource;
    manifest.generatedAt = new Date().toISOString();

    await updateManifest(manifest, sha, `feat: update resource metadata "${resource.title}" (${id})`);

    return {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(resource),
    };
  } catch (err) {
    context.error('updateResource error:', err);
    return {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Failed to update resource' }),
    };
  }
}

app.http('updateResource', {
  methods: ['PUT'],
  authLevel: 'anonymous',
  route: 'resource/{id}',
  handler: updateResourceHandler,
});
