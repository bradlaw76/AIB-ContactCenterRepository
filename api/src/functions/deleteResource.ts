/*
=============================================================================
COMPONENT:    DELETE /api/resource/{id} Function
FILE:         api/src/functions/deleteResource.ts
VERSION:      1.0.0
AUTHOR:       Fenster / AIB Contact Center Team
LAST UPDATED: 2026-04-21
ENVIRONMENT:  Azure Functions v4 / Azure Static Web Apps

------------------------------------------------------------------------------
OVERVIEW
------------------------------------------------------------------------------
Authenticated HTTP endpoint for content managers to delete a resource they
own. Removes the blob from Azure Blob Storage and removes the manifest entry,
then commits the updated manifest to GitHub.

------------------------------------------------------------------------------
ARCHITECTURE
------------------------------------------------------------------------------
- Trigger:      HTTP DELETE /api/resource/{id}
- Auth Level:   Anonymous (SWA handles Entra auth; server validates role)
- Role Gate:    requireContentManager() — x-ms-client-principal header
- Ownership:    uploadedBy must match current user's userDetails
- Data:         Deletes blob from storage + removes manifest entry
- Manifest:     Committed back to GitHub

------------------------------------------------------------------------------
FEATURES
------------------------------------------------------------------------------
- Role enforcement: content-manager required
- Ownership check: only original uploader can delete
- Hard deletes blob from private Azure Storage container
- Removes resource from manifest and commits

------------------------------------------------------------------------------
PREREQUISITES
------------------------------------------------------------------------------
1. Env Var: AZURE_STORAGE_CONNECTION_STRING
2. Env Var: STORAGE_CONTAINER_NAME (default: 'resources')
3. Env Var: GITHUB_TOKEN
4. Env Var: GITHUB_OWNER
5. Env Var: GITHUB_REPO

------------------------------------------------------------------------------
SECURITY MODEL
------------------------------------------------------------------------------
- Auth Token:     x-ms-client-principal from SWA
- Role Gate:      'content-manager' required
- Ownership Gate: uploadedBy === principal.userDetails

------------------------------------------------------------------------------
KNOWN LIMITATIONS
------------------------------------------------------------------------------
- Blob deletion is permanent; no soft-delete or recycle bin in v1
- If blob delete succeeds but manifest commit fails, blob is orphaned
  (acceptable risk for v1; retryable manually)

------------------------------------------------------------------------------
TEST CASES
------------------------------------------------------------------------------
✔ Returns 401 without auth
✔ Returns 403 for non-content-manager
✔ Returns 404 for unknown id
✔ Returns 403 when deleting another user's resource
✔ Returns 204 on successful delete
✔ Blob no longer accessible after delete
✔ Manifest no longer contains deleted resource

------------------------------------------------------------------------------
CHANGELOG
------------------------------------------------------------------------------
v1.0.0  2026-04-21  Initial version
=============================================================================
*/

import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { BlobServiceClient } from '@azure/storage-blob';
import { requireContentManager } from '../auth.js';
import { getManifest, updateManifest } from '../manifest.js';

async function deleteResourceHandler(
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

    // Delete blob from Azure Storage
    const connectionString = process.env['AZURE_STORAGE_CONNECTION_STRING'];
    if (!connectionString) throw new Error('AZURE_STORAGE_CONNECTION_STRING is not set');

    const containerName = process.env['STORAGE_CONTAINER_NAME'] ?? 'resources';
    const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
    const containerClient = blobServiceClient.getContainerClient(containerName);
    const blobClient = containerClient.getBlobClient(resource.blobName);

    await blobClient.deleteIfExists();

    // Remove from manifest
    manifest.resources.splice(index, 1);
    manifest.generatedAt = new Date().toISOString();

    await updateManifest(
      manifest,
      sha,
      `feat: remove resource "${resource.title}" (${id})`
    );

    return { status: 204 };
  } catch (err) {
    context.error('deleteResource error:', err);
    return {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Failed to delete resource' }),
    };
  }
}

app.http('deleteResource', {
  methods: ['DELETE'],
  authLevel: 'anonymous',
  route: 'resource/{id}',
  handler: deleteResourceHandler,
});
