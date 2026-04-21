# Fenster — History

## Project Context
- **Project:** AIB Contact Center Resource Portal
- **User:** Bradley Law
- **Stack:** Azure Functions (TypeScript), Azure Blob Storage, GitHub API (@octokit/rest), Azure SWA
- **Dependencies installed:** @azure/functions, @azure/storage-blob, @octokit/rest, uuid
- **Current state:** api/ has package.json and tsconfig.json only — no function handlers implemented
- **Auth:** SWA built-in auth with Microsoft Entra ID; server validates x-ms-client-principal header
- **Branch:** 001-contact-center-portal

## Learnings
## Learnings

### API Foundation (2026-04-21)

**File structure created:**
```
api/src/
	types.ts           — shared interfaces (Resource, Manifest, Category, UploadMetadata, ClientPrincipal)
	auth.ts            — parseClientPrincipal, requireContentManager helpers
	manifest.ts        — getManifest, updateManifest via @octokit/rest
	index.ts           — entry point; imports all function modules
	functions/
		getManifest.ts       — GET /api/manifest (anonymous)
		getResourceUrl.ts    — GET /api/resource/{id}/url (anonymous)
		uploadResource.ts    — POST /api/upload (content-manager role)
		updateResource.ts    — PUT /api/resource/{id} (content-manager role)
		deleteResource.ts    — DELETE /api/resource/{id} (content-manager role)
api/local.settings.json.example  — env var template
content-index.json               — initial empty manifest at repo root
```

**Required environment variables:**
| Variable | Purpose |
|---|---|
| `GITHUB_TOKEN` | PAT with repo contents read/write |
| `GITHUB_OWNER` | GitHub repo owner (bradlaw76) |
| `GITHUB_REPO` | GitHub repo name (AIB-ContactCenterRepository) |
| `AZURE_STORAGE_CONNECTION_STRING` | Storage account connection string |
| `STORAGE_CONTAINER_NAME` | Blob container name (default: `resources`) |
| `AzureWebJobsStorage` | Set to `UseDevelopmentStorage=true` for local dev |
| `FUNCTIONS_WORKER_RUNTIME` | Must be `node` |

**API endpoint paths (for Hockney to write tests):**
- `GET  /api/manifest` — returns full manifest JSON; Cache-Control 60s
- `GET  /api/resource/{id}/url` — returns `{ url, expiresAt }` SAS URL (1 hr)
- `POST /api/upload` — multipart: `file` (binary) + `metadata` (JSON string)
- `PUT  /api/resource/{id}` — body: `Partial<UploadMetadata>` JSON
- `DELETE /api/resource/{id}` — no body; returns 204

**Auth flow:**
- SWA injects `x-ms-client-principal` header (base64 JSON) after Entra login
- `parseClientPrincipal` decodes it; `requireContentManager` enforces role
- Role name to gate: `'content-manager'`
- In local dev without SWA CLI, mock the header manually in test requests

**Multipart parsing:**
- Uses `request.formData()` from Azure Functions v4 HttpRequest
- `file` field = File object (has `.name`, `.size`, `.arrayBuffer()`)
- `metadata` field = JSON string parsed to `UploadMetadata`

**SAS URL generation:**
- Uses `generateBlobSASQueryParameters` with `StorageSharedKeyCredential`
- Account name/key extracted from connection string via regex
- Permissions: read-only (`'r'`); HTTPS protocol enforced
- Expiry: 1 hour from request time

**Ownership model:**
- `uploadedBy` stored in manifest = `principal.userDetails` (email from Entra)
- PUT and DELETE check `resource.uploadedBy === principal.userDetails`

**Allowed file types:** pdf, docx, pptx, xlsx, mp4, webm, jpg, jpeg, png, gif, svg
**Max file size:** 100 MB (104,857,600 bytes)
