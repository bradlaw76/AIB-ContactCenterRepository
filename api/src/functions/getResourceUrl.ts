/*
=============================================================================
COMPONENT:    GET /api/resource/{id}/url Function
FILE:         api/src/functions/getResourceUrl.ts
VERSION:      1.0.0
AUTHOR:       Fenster / AIB Contact Center Team
LAST UPDATED: 2026-04-21
ENVIRONMENT:  Azure Functions v4 / Azure Static Web Apps

------------------------------------------------------------------------------
OVERVIEW
------------------------------------------------------------------------------
Public HTTP endpoint that generates a short-lived (1 hour) SAS URL for a
specific resource blob in Azure Blob Storage. Used by ResourceDetailPage
to allow inline viewing and downloading of private-container files.

------------------------------------------------------------------------------
ARCHITECTURE
------------------------------------------------------------------------------
- Trigger:      HTTP GET /api/resource/{id}/url
- Auth Level:   Anonymous (SAS URL is time-limited)
- Data Source:  Manifest (GitHub) + Azure Blob Storage SAS generation
- Container:    Private (STORAGE_CONTAINER_NAME env var)
- SAS Duration: 1 hour

------------------------------------------------------------------------------
FEATURES
------------------------------------------------------------------------------
- Looks up resource by id in manifest
- Generates read-only SAS URL with 1-hour expiry
- Returns { url, expiresAt } as ISO8601

------------------------------------------------------------------------------
PREREQUISITES
------------------------------------------------------------------------------
1. Env Var: AZURE_STORAGE_CONNECTION_STRING
2. Env Var: STORAGE_CONTAINER_NAME (default: 'resources')
3. Env Vars for manifest: GITHUB_TOKEN, GITHUB_OWNER, GITHUB_REPO

------------------------------------------------------------------------------
SECURITY MODEL
------------------------------------------------------------------------------
- SAS URL is time-limited (1 hour); read-only permission
- Blob container remains private; no direct public access
- No auth required to call this endpoint (SAS is the access control)

------------------------------------------------------------------------------
KNOWN LIMITATIONS
------------------------------------------------------------------------------
- SAS URL cached by browser — if revocation needed, must delete the blob
- 1-hour expiry hard-coded; adjust TASK if session duration needs change

------------------------------------------------------------------------------
TEST CASES
------------------------------------------------------------------------------
✔ Returns 200 with { url, expiresAt } for valid id
✔ Returns 404 for unknown id
✔ Returns 500 on storage/manifest failure
✔ SAS URL is readable and expires after 1 hour

------------------------------------------------------------------------------
CHANGELOG
------------------------------------------------------------------------------
v1.0.0  2026-04-21  Initial version
=============================================================================
*/

import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import {
  BlobServiceClient,
  BlobSASPermissions,
  generateBlobSASQueryParameters,
  StorageSharedKeyCredential,
  SASProtocol,
} from '@azure/storage-blob';
import { getManifest } from '../manifest.js';

async function getResourceUrlHandler(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  const id = request.params['id'];
  if (!id) {
    return {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Missing resource id' }),
    };
  }

  try {
    const { manifest } = await getManifest();
    const resource = manifest.resources.find((r) => r.id === id);

    if (!resource) {
      return {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Resource not found' }),
      };
    }

    const connectionString = process.env['AZURE_STORAGE_CONNECTION_STRING'];
    if (!connectionString) {
      throw new Error('AZURE_STORAGE_CONNECTION_STRING is not set');
    }

    const containerName = process.env['STORAGE_CONTAINER_NAME'] ?? 'resources';
    const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);

    // Extract account name and key from connection string for SAS generation
    const accountNameMatch = connectionString.match(/AccountName=([^;]+)/);
    const accountKeyMatch = connectionString.match(/AccountKey=([^;]+)/);

    if (!accountNameMatch || !accountKeyMatch) {
      throw new Error('Invalid AZURE_STORAGE_CONNECTION_STRING format');
    }

    const accountName = accountNameMatch[1];
    const accountKey = accountKeyMatch[1];

    const sharedKeyCredential = new StorageSharedKeyCredential(accountName, accountKey);

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1);

    const sasParams = generateBlobSASQueryParameters(
      {
        containerName,
        blobName: resource.blobName,
        permissions: BlobSASPermissions.parse('r'),
        expiresOn: expiresAt,
        protocol: SASProtocol.Https,
      },
      sharedKeyCredential
    );

    const containerClient = blobServiceClient.getContainerClient(containerName);
    const blobClient = containerClient.getBlobClient(resource.blobName);
    const sasUrl = `${blobClient.url}?${sasParams.toString()}`;

    return {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: sasUrl, expiresAt: expiresAt.toISOString() }),
    };
  } catch (err) {
    context.error('getResourceUrl error:', err);
    return {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Failed to generate resource URL' }),
    };
  }
}

app.http('getResourceUrl', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'resource/{id}/url',
  handler: getResourceUrlHandler,
});
