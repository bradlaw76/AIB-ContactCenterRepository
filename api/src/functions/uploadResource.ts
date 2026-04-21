/*
=============================================================================
COMPONENT:    POST /api/upload Function
FILE:         api/src/functions/uploadResource.ts
VERSION:      1.0.0
AUTHOR:       Fenster / AIB Contact Center Team
LAST UPDATED: 2026-04-21
ENVIRONMENT:  Azure Functions v4 / Azure Static Web Apps

------------------------------------------------------------------------------
OVERVIEW
------------------------------------------------------------------------------
Authenticated HTTP endpoint for content managers to upload a new resource
file and its metadata. Validates file type and size, stores the binary in
Azure Blob Storage, then appends a new entry to the content-index.json
manifest via the GitHub API.

------------------------------------------------------------------------------
ARCHITECTURE
------------------------------------------------------------------------------
- Trigger:      HTTP POST /api/upload
- Auth Level:   Anonymous (SWA handles Entra auth; server validates role)
- Role Gate:    requireContentManager() — x-ms-client-principal header
- Payload:      multipart/form-data: file (binary) + metadata (JSON string)
- Storage:      Azure Blob Storage private container
- Manifest:     Updated via GitHub API commit

------------------------------------------------------------------------------
FEATURES
------------------------------------------------------------------------------
- Role enforcement: content-manager required
- File type validation: pdf, docx, pptx, xlsx, mp4, webm, jpg, jpeg, png, gif, svg
- File size validation: max 100 MB
- UUID blob name generation
- Manifest append + GitHub commit

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
- Auth Token:     x-ms-client-principal from SWA — not forgeable by client
- Role Gate:      'content-manager' role required
- File Validation: MIME type checked by extension (server-side)
- No user-controlled blob paths (UUID generated server-side)

------------------------------------------------------------------------------
KNOWN LIMITATIONS
------------------------------------------------------------------------------
- Multipart parsing uses formData() from Azure Functions v4 HttpRequest
- Very large files (close to 100 MB) may hit Azure Functions request timeout
  (default 5 min, configurable in host.json)
- Concurrent uploads may cause manifest SHA conflicts (rare in v1)

------------------------------------------------------------------------------
TEST CASES
------------------------------------------------------------------------------
✔ Returns 401 without auth header
✔ Returns 403 for authenticated non-content-manager
✔ Returns 400 for invalid file type
✔ Returns 400 for file exceeding 100 MB
✔ Returns 201 with { id, resourceUrl } on success
✔ Blob appears in storage container after upload
✔ Manifest contains new resource entry after upload

------------------------------------------------------------------------------
CHANGELOG
------------------------------------------------------------------------------
v1.0.0  2026-04-21  Initial version
=============================================================================
*/

import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { BlobServiceClient } from '@azure/storage-blob';
import { v4 as uuidv4 } from 'uuid';
import { requireContentManager } from '../auth.js';
import { getManifest, updateManifest } from '../manifest.js';
import { Resource, UploadMetadata } from '../types.js';

const ALLOWED_EXTENSIONS = new Set([
  'pdf', 'docx', 'pptx', 'xlsx',
  'mp4', 'webm',
  'jpg', 'jpeg', 'png', 'gif', 'svg',
]);

const MAX_FILE_SIZE = 104857600; // 100 MB

const EXT_TO_TYPE: Record<string, Resource['type']> = {
  pdf: 'document', docx: 'document', pptx: 'document', xlsx: 'document',
  mp4: 'video', webm: 'video',
  jpg: 'image', jpeg: 'image', png: 'image', gif: 'image', svg: 'image',
};

const EXT_CONTENT_TYPE: Record<string, string> = {
  pdf: 'application/pdf',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  mp4: 'video/mp4',
  webm: 'video/webm',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  svg: 'image/svg+xml',
};

async function uploadResourceHandler(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  // Auth gate
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

  try {
    const formData = await request.formData();
    const fileField = formData.get('file');
    const metadataField = formData.get('metadata');

    if (!fileField || typeof fileField === 'string') {
      return {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Missing file field in form data' }),
      };
    }

    if (!metadataField || typeof metadataField !== 'string') {
      return {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Missing metadata field in form data' }),
      };
    }

    const file = fileField as File;
    const metadata = JSON.parse(metadataField) as UploadMetadata;

    // Extract extension
    const originalName = file.name;
    const dotIndex = originalName.lastIndexOf('.');
    if (dotIndex === -1) {
      return {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'File has no extension' }),
      };
    }
    const ext = originalName.slice(dotIndex + 1).toLowerCase();

    // Validate file type
    if (!ALLOWED_EXTENSIONS.has(ext)) {
      return {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: `File type .${ext} is not allowed` }),
      };
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'File exceeds 100 MB limit' }),
      };
    }

    // Upload to Azure Blob Storage
    const connectionString = process.env['AZURE_STORAGE_CONNECTION_STRING'];
    if (!connectionString) throw new Error('AZURE_STORAGE_CONNECTION_STRING is not set');

    const containerName = process.env['STORAGE_CONTAINER_NAME'] ?? 'resources';
    const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
    const containerClient = blobServiceClient.getContainerClient(containerName);

    const resourceId = uuidv4();
    const blobName = `${resourceId}.${ext}`;
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);

    const fileBuffer = await file.arrayBuffer();
    await blockBlobClient.uploadData(fileBuffer, {
      blobHTTPHeaders: { blobContentType: EXT_CONTENT_TYPE[ext] ?? 'application/octet-stream' },
    });

    // Update manifest
    const { manifest, sha } = await getManifest();

    const newResource: Resource = {
      id: resourceId,
      title: metadata.title,
      description: metadata.description,
      category: metadata.category,
      type: EXT_TO_TYPE[ext] ?? 'document',
      fileExt: ext,
      blobName,
      fileSize: file.size,
      uploadDate: new Date().toISOString(),
      uploadedBy: principal.userDetails,
      featured: metadata.featured ?? false,
    };

    manifest.resources.push(newResource);
    manifest.generatedAt = new Date().toISOString();

    await updateManifest(
      manifest,
      sha,
      `feat: add resource "${metadata.title}" (${resourceId})`
    );

    return {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: resourceId, resourceUrl: blockBlobClient.url }),
    };
  } catch (err) {
    context.error('uploadResource error:', err);
    return {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Upload failed' }),
    };
  }
}

app.http('uploadResource', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'upload',
  handler: uploadResourceHandler,
});
