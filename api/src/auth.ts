/*
=============================================================================
COMPONENT:    Auth Helper
FILE:         api/src/auth.ts
VERSION:      1.0.0
AUTHOR:       Fenster / AIB Contact Center Team
LAST UPDATED: 2026-04-21
ENVIRONMENT:  Azure Functions v4 / Azure Static Web Apps

------------------------------------------------------------------------------
OVERVIEW
------------------------------------------------------------------------------
Server-side authentication helpers for the AIB Contact Center Resource Portal.
Decodes the SWA x-ms-client-principal header and enforces content-manager
role authorization for protected API operations.

------------------------------------------------------------------------------
ARCHITECTURE
------------------------------------------------------------------------------
- Auth Model:     Azure SWA built-in auth; Entra ID identity provider
- Header:         x-ms-client-principal (base64-encoded JSON)
- Role Check:     userRoles array must include 'content-manager'
- Used By:        uploadResource, updateResource, deleteResource functions

------------------------------------------------------------------------------
FEATURES
------------------------------------------------------------------------------
- parseClientPrincipal: Decodes SWA auth header → ClientPrincipal | null
- requireContentManager: Enforces role gate; throws HTTP-friendly errors

------------------------------------------------------------------------------
PREREQUISITES
------------------------------------------------------------------------------
- Azure SWA built-in auth configured with Microsoft Entra ID
- Roles assigned in SWA portal or via staticwebapp.config.json

------------------------------------------------------------------------------
SECURITY MODEL
------------------------------------------------------------------------------
- Auth Token:    x-ms-client-principal injected by SWA proxy (not forgeable from client)
- Role Dependency: 'content-manager' role required for write operations
- No secrets stored; pure header inspection

------------------------------------------------------------------------------
KNOWN LIMITATIONS
------------------------------------------------------------------------------
- x-ms-client-principal is only injected by the SWA runtime; not present in local dev
  without SWA CLI proxy. Use mock headers for local testing.

------------------------------------------------------------------------------
CHANGELOG
------------------------------------------------------------------------------
v1.0.0  2026-04-21  Initial version
=============================================================================
*/

import { HttpRequest } from '@azure/functions';
import { ClientPrincipal } from './types.js';

export function parseClientPrincipal(request: HttpRequest): ClientPrincipal | null {
  const header = request.headers.get('x-ms-client-principal');
  if (!header) return null;

  try {
    const decoded = Buffer.from(header, 'base64').toString('utf-8');
    return JSON.parse(decoded) as ClientPrincipal;
  } catch {
    return null;
  }
}

export function requireContentManager(request: HttpRequest): ClientPrincipal {
  const principal = parseClientPrincipal(request);

  if (!principal) {
    const err = new Error('Unauthorized') as Error & { statusCode: number };
    err.statusCode = 401;
    throw err;
  }

  if (!principal.userRoles.includes('content-manager')) {
    const err = new Error('Forbidden') as Error & { statusCode: number };
    err.statusCode = 403;
    throw err;
  }

  return principal;
}
