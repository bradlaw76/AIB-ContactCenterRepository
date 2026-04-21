/*
=============================================================================
COMPONENT:    InlineViewer
FILE:         src/components/InlineViewer/InlineViewer.tsx
VERSION:      1.0.0
AUTHOR:       McManus / AIB Contact Center Portal Team
LAST UPDATED: 2026-04-21
ENVIRONMENT:  React / Vite / Azure Static Web Apps

------------------------------------------------------------------------------
OVERVIEW
------------------------------------------------------------------------------
Unified inline preview surface for images, videos, and documents on the
resource detail page.

------------------------------------------------------------------------------
ARCHITECTURE
------------------------------------------------------------------------------
- Data Source:     Resource metadata + SAS URL prop
- Auth Model:      None
- Rendering:       Client-side React component

------------------------------------------------------------------------------
FEATURES
------------------------------------------------------------------------------
- Loading state delegates to ResourceDetailSkeleton
- Image preview with bounded width and bordered frame
- Video preview with native controls and fallback text
- Document card for non-previewable document types in v1

------------------------------------------------------------------------------
CHANGELOG
------------------------------------------------------------------------------
v1.0.0  2026-04-21  Initial version

------------------------------------------------------------------------------
NON-NEGOTIABLES
------------------------------------------------------------------------------
- Documents must not attempt inline rendering in v1
=============================================================================
*/

import type { Resource } from '../../context/ManifestContext'
import { ResourceDetailSkeleton } from '../LoadingSkeletons/LoadingSkeletons'

interface InlineViewerProps {
  resource: Resource
  sasUrl: string | null
  loading: boolean
}

function formatFileSize(bytes: number): string {
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }
  if (bytes >= 1024) {
    return `${Math.round(bytes / 1024)} KB`
  }
  return `${bytes} B`
}

export default function InlineViewer({ resource, sasUrl, loading }: InlineViewerProps) {
  if (loading) {
    return <ResourceDetailSkeleton />
  }

  if (resource.type === 'image') {
    return sasUrl ? (
      <img
        src={sasUrl}
        alt={resource.title}
        style={{
          maxWidth: '100%',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-card)',
        }}
      />
    ) : (
      <p className="text-body">Preview unavailable for this image.</p>
    )
  }

  if (resource.type === 'video') {
    return sasUrl ? (
      <video controls src={sasUrl} style={{ width: '100%', borderRadius: 'var(--radius-card)' }}>
        Your browser does not support HTML5 video playback.
      </video>
    ) : (
      <p className="text-body">Preview unavailable for this video.</p>
    )
  }

  return (
    <section
      style={{
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-card)',
        backgroundColor: 'var(--color-surface)',
        padding: 'var(--space-6)',
      }}
    >
      <div
        style={{
          width: '56px',
          height: '56px',
          borderRadius: 'var(--radius-card)',
          backgroundColor: 'var(--color-background)',
          color: 'var(--color-primary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 'var(--space-3)',
        }}
      >
        <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M6 2a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8.828A2 2 0 0 0 19.414 7L15 2.586A2 2 0 0 0 13.586 2H6Zm8 1.5V8h4.5" />
        </svg>
      </div>
      <h3 style={{ fontSize: 'var(--font-size-card-title)', fontWeight: 600, marginBottom: 'var(--space-1)' }}>
        {resource.blobName}
      </h3>
      <p className="text-caption" style={{ marginBottom: 'var(--space-3)' }}>
        {formatFileSize(resource.fileSize)}
      </p>
      <p className="text-body">Preview not available - download to view.</p>
    </section>
  )
}
