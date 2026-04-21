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

### Azure IaC Generation (2026-04-21)

**Files created:**
```
.azure/main.bicep              — Bicep IaC (SWA + Functions + Storage + App Insights + Managed Identity)
.azure/main.parameters.json   — Parameters with Key Vault secret references
.azure/README.md               — Deployment guide (prerequisites, azd up, cleanup)
azure.yaml                     — Azure Developer CLI manifest (services, infra, hooks)
```

**Bicep patterns used:**
- `uniqueString(resourceGroup().id, projectName)` with `take(..., 8)` for globally unique resource names
- `storageAccount.listKeys().keys[0].value` for inline storage connection string
- `UserAssigned` managed identity attached to Function App with `Storage Blob Data Contributor` role assignment
- `swaBackendLink` (`Microsoft.Web/staticSites/linkedBackends`) to wire Functions into the SWA
- `appsettings` sub-resource on Static Web App for `AAD_CLIENT_ID` / `AAD_CLIENT_SECRET`
- All secrets parameterized (`@secure()`) — no literals in template

**Validation:** `az bicep build` passed — zero errors, one PATH preference warning only.

**What's next:**
- Phase 6.3 (Bradley): Set GitHub secrets (AZURE_CLIENT_ID, GITHUB_TOKEN, AAD credentials)
- Phase 6.4 (Hockney): Run `azure-validate` skill against this Bicep before deploying
- Phase 6.5 (Fenster): `azd up` execution once secrets are in place
- After deploy: Update Entra App redirect URI with live SWA hostname



**Phase 5 automation shipped:**
- Added `scripts/normalize-manifest.mjs` to enforce deterministic `content-index.json` ordering and formatting.
- Added workflow `.github/workflows/normalize-content-manifest.yml` for push, pull_request, and workflow_dispatch triggers tied to `content-index.json` and `content/**`.
- Pull requests now fail when normalization drift is detected.
- Pushes to the default branch auto-commit normalized output with guardrails:
	- skip if actor is `github-actions[bot]`
	- skip if no manifest diff

**Normalization contract:**
- Required root keys validated: `version`, `generatedAt`, `resources`, `categories`.
- `categories` sorted by `name` (case-insensitive).
- `resources` sorted by `uploadDate` DESC, then `title` ASC.
- Output written with 2-space JSON indentation + trailing newline.

**Local verification:**
- Ran `node scripts/normalize-manifest.mjs` successfully (exit code 0).
- Current baseline manifest categories normalized alphabetically.
