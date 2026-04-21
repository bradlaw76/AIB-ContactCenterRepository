/*
=============================================================================
COMPONENT:    Shared TypeScript Interfaces
FILE:         api/src/types.ts
VERSION:      1.0.0
AUTHOR:       Fenster / AIB Contact Center Team
LAST UPDATED: 2026-04-21
ENVIRONMENT:  Azure Functions v4 / Node.js

------------------------------------------------------------------------------
OVERVIEW
------------------------------------------------------------------------------
Shared domain types for the AIB Contact Center Resource Portal API.
Defines Resource, Manifest, Category, UploadMetadata, and ClientPrincipal
interfaces used across all function handlers and helpers.

------------------------------------------------------------------------------
ARCHITECTURE
------------------------------------------------------------------------------
- Used By:        All api/src/functions/* handlers and helpers
- Auth Model:     ClientPrincipal decoded from x-ms-client-principal header
- Data Source:    content-index.json manifest in GitHub repo

------------------------------------------------------------------------------
FEATURES
------------------------------------------------------------------------------
- Resource:         Full content resource record schema
- Manifest:         Root manifest structure (version, resources, categories)
- Category:         Category entry with display order
- UploadMetadata:   Form payload for upload/update operations
- ClientPrincipal:  SWA auth header decoded payload

------------------------------------------------------------------------------
PREREQUISITES
------------------------------------------------------------------------------
- No external dependencies (pure TypeScript interfaces)

------------------------------------------------------------------------------
SECURITY MODEL
------------------------------------------------------------------------------
- ClientPrincipal.userRoles used to gate content-manager operations
- No PII beyond userDetails (email) stored in manifest

------------------------------------------------------------------------------
KNOWN LIMITATIONS
------------------------------------------------------------------------------
- Resource.type is a union literal — add new values here if content types expand

------------------------------------------------------------------------------
CHANGELOG
------------------------------------------------------------------------------
v1.0.0  2026-04-21  Initial version
=============================================================================
*/

export interface Category {
  name: string;
  order: number;
}

export interface Resource {
  id: string;
  title: string;
  description: string;
  category: string;
  type: 'document' | 'video' | 'image';
  fileExt: string;
  blobName: string;
  fileSize: number;
  uploadDate: string;
  uploadedBy: string;
  featured: boolean;
}

export interface Manifest {
  version: string;
  generatedAt: string;
  resources: Resource[];
  categories: Category[];
}

export interface UploadMetadata {
  title: string;
  description: string;
  category: string;
  featured: boolean;
}

export interface ClientPrincipal {
  identityProvider: string;
  userId: string;
  userDetails: string;
  userRoles: string[];
}
