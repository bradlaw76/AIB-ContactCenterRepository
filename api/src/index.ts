/*
=============================================================================
COMPONENT:    Azure Functions App Entry Point
FILE:         api/src/index.ts
VERSION:      1.0.0
AUTHOR:       Fenster / AIB Contact Center Team
LAST UPDATED: 2026-04-21
ENVIRONMENT:  Azure Functions v4 / Node.js

------------------------------------------------------------------------------
OVERVIEW
------------------------------------------------------------------------------
Entry point for the Azure Functions v4 app. Imports all function handler
modules so their app.http() registrations execute at startup.

------------------------------------------------------------------------------
ARCHITECTURE
------------------------------------------------------------------------------
- Model:      Azure Functions v4 programming model (app.http())
- Functions:  getManifest, getResourceUrl, uploadResource, updateResource,
              deleteResource

------------------------------------------------------------------------------
PREREQUISITES
------------------------------------------------------------------------------
- All function files self-register via app.http() on import
- host.json must point to this compiled entry point

------------------------------------------------------------------------------
CHANGELOG
------------------------------------------------------------------------------
v1.0.0  2026-04-21  Initial version
=============================================================================
*/

import './functions/getManifest.js';
import './functions/getResourceUrl.js';
import './functions/uploadResource.js';
import './functions/updateResource.js';
import './functions/deleteResource.js';
