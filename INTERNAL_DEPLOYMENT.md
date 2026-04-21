# Internal-Only Deployment Guide

## Overview

The **AIB Contact Center Resource Portal** is configured for **internal-only access**. All users must authenticate via **Microsoft Entra ID (Azure AD)** to access the portal.

### Security Model

- ✅ **All routes protected** — Every page (home, browse, search, upload, manage) requires authentication
- ✅ **Role-based access** — Upload/manage operations restricted to `content-manager` role
- ✅ **Entra ID enforcement** — SSO via Microsoft account in your organization
- ✅ **Automatic redirects** — Unauthenticated requests redirect to login

---

## Deployment Steps

### 1. Create Entra App Registration

Register the app in Azure Portal or via CLI. The app is used for OAuth2 sign-in flow.

#### Option A: Azure Portal
1. Go to **Azure Active Directory > App Registrations > New registration**
2. Name: `AIB Contact Center Portal`
3. Supported account types: **Accounts in this organizational directory only**
4. Redirect URI: `https://{your-swa-hostname}/.auth/login/aad/callback`
   - Example: `https://aibccportal-abc123.azurestaticapps.net/.auth/login/aad/callback`
5. Copy the **Application (client) ID**

#### Option B: Azure CLI
```bash
az ad app create \
  --display-name "AIB Contact Center Portal" \
  --sign-in-audience "AzureADMyOrg" \
  --web-redirect-uris "https://{your-swa-hostname}/.auth/login/aad/callback"
```

### 2. Create Client Secret

1. Go to **Certificates & secrets > New client secret**
2. Expiry: 24 months (or your org policy)
3. Copy the secret value (shown only once)

### 3. Configure GitHub Secrets

Set these secrets in your GitHub repository (`Settings > Secrets and variables`):

| Secret | Value |
|--------|-------|
| `AAD_CLIENT_ID` | Application (client) ID from step 1 |
| `AAD_CLIENT_SECRET` | Client secret from step 2 |
| `MANIFEST_GITHUB_TOKEN` | GitHub PAT with `repo` scope (already set) |

### 4. Deploy via GitHub Actions

1. Trigger the deploy workflow:
   ```bash
   git push origin 001-contact-center-portal
   ```
   Or manually trigger in GitHub Actions.

2. Workflow: `.github/workflows/deploy-swa.yml`
   - Builds React SPA
   - Deploys API functions
   - Provisions Azure resources via Bicep
   - Deploys to Azure Static Web Apps

3. Expected deployment time: **5-10 minutes**

---

## Local Testing

### Start Local Environment

```bash
# Terminal 1: Start SWA CLI with mock auth
swa start dist --api-location api

# Terminal 2 (if needed): Start Vite dev server
npm run dev -- --port 5174
```

SWA CLI runs on `http://localhost:4280/` with mock Entra ID authentication. Log in as any role:
- `user` — viewer role (browse, search, view resources)
- `content-manager` — manager role (all above + upload, manage)

### Test Flows

1. **Browse & Search**
   - Homepage → category cards
   - Browse page → filter by category
   - Search page → keyword search
   - Click resource → open detail view (inline viewer)

2. **Upload & Manage** (content-manager only)
   - Sign in as `content-manager`
   - Upload page → add resource
   - Manage page → edit/delete resources

---

## User Access

### Add Users to Portal

Users must have accounts in your organization's Entra ID. To grant access:

1. User must log in with their organizational account
2. **Owner/Admin**: Grant `content-manager` role for write access
   - Portal role assignment happens via Azure Portal > Static Web App > **Role-based access** (future feature)
   - For now: Users are `authenticated` by default; add to `content-manager` via app manifest

### Default Roles

- `authenticated` — Can browse, search, view resources (all read operations)
- `content-manager` — Can upload, manage, update, delete resources

---

## Security Notes

- 🔒 All API endpoints require authentication token
- 🔒 Sensitive operations (upload, delete) require `content-manager` role
- 🔒 Session tokens expire after 1 hour (configurable in Static Web Apps)
- 🔒 HTTPS only in production
- 🔒 CORS headers restricted to SWA domain

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| **Login redirects infinitely** | Verify redirect URI in Entra app matches SWA hostname exactly |
| **403 Forbidden on upload** | Ensure user is added to `content-manager` role in app manifest |
| **Blank page after login** | Check browser console; verify API endpoints respond with auth token |
| **Manifest (resources) not loading** | Verify `MANIFEST_GITHUB_TOKEN` secret is set and has `repo` scope |

---

## Next Steps

1. **Test locally** using mock auth (no Entra app needed)
2. **Create Entra app** in your Azure tenant
3. **Set GitHub secrets** with app credentials
4. **Deploy to Azure Static Web Apps** via GitHub Actions
5. **Add users** to your organization's Entra ID for access

For production, consider:
- Setting up **conditional access policies** for IP restrictions
- Implementing **Role-Based Access Control (RBAC)** via app manifest
- Configuring **audit logging** in Static Web Apps
- Setting up **alerts** for failed login attempts
