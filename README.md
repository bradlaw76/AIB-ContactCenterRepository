# AIB Contact Center Resource Portal

A **secure, internal-only web portal** for browsing, searching, uploading, and managing contact center resources.

- 🔐 **Internal-only access** via Microsoft Entra ID  
- ⚛️ **React 19 + TypeScript** frontend  
- 🔧 **Azure Functions** API  
- 📦 **Azure Blob Storage** resource hosting  
- 🧪 **80%+ test coverage** (80+ tests)  
- 📋 **Squad-coordinated** development (AI team)  

---

## Quick Start

### Local Development

```bash
# Install dependencies
npm install

# Development mode (Vite + SWA CLI with mock auth)
npm run dev
swa start dist --api-location api    # In separate terminal
# Visit http://localhost:4280
```

### Testing

```bash
# Run all tests
npm test

# Watch mode
npm test -- --watch

# Coverage report
npm test -- --coverage
```

---

## Features

### Browse & Search
- Homepage with resource categories
- Browse by category
- Full-text keyword search
- Resource detail view with inline content preview

### Upload & Manage (content-manager only)
- Upload new resources
- Edit resource metadata
- Delete resources
- View all uploaded content

### Admin
- View upload history
- Monitor activity
- Manage resource categories

---

## Deployment

### ⚠️ Internal-Only Access

All users must authenticate via Microsoft Entra ID. Public access is **not permitted**.

For deployment instructions, see **[INTERNAL_DEPLOYMENT.md](./INTERNAL_DEPLOYMENT.md)**.

Requirements:
- Microsoft Entra app registration (your Azure tenant)
- GitHub secrets: `AAD_CLIENT_ID`, `AAD_CLIENT_SECRET`, `MANIFEST_GITHUB_TOKEN`
- Azure Static Web Apps resource (created via GitHub Actions)

**Deploy:**
```bash
git push origin 001-contact-center-portal
```
Workflow: `.github/workflows/deploy-swa.yml`

---

## Architecture

### Frontend
- **Framework**: React 19 + Vite 8
- **Language**: TypeScript  
- **Styling**: Tailwind CSS
- **State**: Context API + custom hooks
- **Tests**: Vitest + React Testing Library

**Pages**: Home, Browse, Search, Detail, Upload, Manage

### API
- **Runtime**: Azure Functions v4 (Node.js)
- **Type**: HTTP-triggered endpoints
- **Auth**: Entra ID (validated by Azure Static Web Apps)

**Endpoints**:
- `GET /api/manifest` — Content index from GitHub
- `GET /api/resource/{id}/url` — Signed blob download URL  
- `POST /api/upload` — Upload resource (content-manager only)
- `PUT /api/resource/{id}` — Update metadata (content-manager only)
- `DELETE /api/resource/{id}` — Delete resource (content-manager only)

### Storage
- **Azure Blob Storage** — Resource files
- **GitHub Repository** — `content-index.json` manifest
- **Manifest Syncing** — GitHub Actions workflow (normalize, validate)

### Security
- ✅ **Entra ID SSO** — All routes protected
- ✅ **Role-based access** — content-manager for write operations
- ✅ **Auth scoping** — Azure Static Web Apps gateway enforcement
- ✅ **HTTPS only** — Production deployments

---

## Project Structure

```
AIB-ContactCenterRepository/
├── src/                          # React frontend
│   ├── pages/                    # Page components
│   ├── components/               # Shared UI components
│   ├── contexts/                 # State providers
│   ├── hooks/                    # Custom hooks
│   ├── App.tsx                   # Root component
│   └── main.tsx                  # Entry point
├── api/                          # Azure Functions
│   ├── src/
│   │   ├── functions/            # HTTP trigger handlers
│   │   ├── helpers/              # Utility functions
│   │   └── index.ts              # Entry point
│   └── host.json                 # Functions config
├── .azure/                       # Infrastructure as Code
│   ├── main.bicep                # SWA + Functions + Storage + App Insights
│   └── main.parameters.json      # Environment-specific params
├── .github/workflows/            # GitHub Actions
│   ├── deploy-swa.yml            # SWA deployment
│   └── normalize-content-manifest.yml  # Manifest validation/sync
├── .squad/                       # AI team state (governance, decisions)
├── __tests__/                    # Test suites
├── staticwebapp.config.json      # SWA routing & auth config (internal-only)
├── azure.yaml                    # Azure Developer CLI manifest
├── vite.config.ts                # Vite configuration
├── eslint.config.js              # Linting rules
└── README.md                     # This file
```

---

## Development Workflow

### Adding a Feature

1. **Create spec** — `.claude/specs/` (if significant)
2. **Create branch** — `git checkout -b feature/description`
3. **Implement** — Add pages, components, tests, API handlers
4. **Test** — `npm test` (>80% coverage required)
5. **Commit** — Clear, descriptive messages
6. **Push** — `git push origin feature/description`
7. **Open PR** — Link to issue, describe changes
8. **Review** — Await feedback from AI team
9. **Merge** — Squash commits before merge to main

### Code Standards

- **TypeScript** — No `any` types; strict mode enabled
- **Testing** — Each component/page gets >80% coverage
- **Comments** — Component headers per SpeckKit standards
- **Naming** — camelCase for variables/functions, PascalCase for components

---

## Governance

This project is governed by:
- **SpeckKit** project development framework
- **Squad** AI team coordination  
- **Azure best practices** for cloud deployments

See `.claude/` and `.squad/` directories for project specs, governance, and team coordination logs.

---

## Support

- **Issue Tracker**: GitHub Issues (this repo)
- **Documentation**: [INTERNAL_DEPLOYMENT.md](./INTERNAL_DEPLOYMENT.md)
- **Team**: AI Squad (agents: Lead, Frontend, Backend, Tester, Scribe)

---

## License

Internal use only. See [LICENSE](./LICENSE) for details.
