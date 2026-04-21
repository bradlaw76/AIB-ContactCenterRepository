/*
=============================================================================
COMPONENT:    ResourceCard
FILE:         src/components/ResourceCard/ResourceCard.tsx
VERSION:      1.0.0
AUTHOR:       McManus / AIB Contact Center Portal Team
LAST UPDATED: 2026-04-21
ENVIRONMENT:  React / Vite / Azure Static Web Apps

------------------------------------------------------------------------------
OVERVIEW
------------------------------------------------------------------------------
Card representation of a resource used across featured, browse, and search
grids with media-type-specific visual treatment.

------------------------------------------------------------------------------
ARCHITECTURE
------------------------------------------------------------------------------
- Data Source:     Resource prop
- Auth Model:      None
- Rendering:       Client-side React component with react-router Link

------------------------------------------------------------------------------
FEATURES
------------------------------------------------------------------------------
- Type-specific preview: image thumbnail, video placeholder, document tile
- Metadata row: type badge, category chip, relative upload time
- Title ellipsis and two-line description clamp
- Click target navigates to /resource/:id

------------------------------------------------------------------------------
CHANGELOG
------------------------------------------------------------------------------
v1.0.0  2026-04-21  Initial version

------------------------------------------------------------------------------
NON-NEGOTIABLES
------------------------------------------------------------------------------
- Internal navigation must use Link
- Visual styles must use CSS custom properties
=============================================================================
*/

import { Link } from 'react-router-dom'
import type { Resource } from '../../context/ManifestContext'
import TypeBadge from '../TypeBadge/TypeBadge'

interface ResourceCardProps {
  resource: Resource
}

function formatRelativeDate(isoDate: string): string {
  const now = Date.now()
  const target = new Date(isoDate).getTime()
  const diffMs = Math.max(0, now - target)
  const dayMs = 24 * 60 * 60 * 1000
  const days = Math.floor(diffMs / dayMs)

  if (days <= 0) return 'Today'
  if (days === 1) return '1 day ago'
  if (days < 30) return `${days} days ago`

  const months = Math.floor(days / 30)
  if (months === 1) return '1 month ago'
  if (months < 12) return `${months} months ago`

  const years = Math.floor(months / 12)
  return years === 1 ? '1 year ago' : `${years} years ago`
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

function renderDocumentVisual(resource: Resource) {
  const ext = resource.fileExt.toLowerCase()
  const label = ext === 'pdf' ? 'PDF' : ext === 'docx' ? 'DOCX' : ext.toUpperCase()

  return (
    <div
      style={{
        aspectRatio: '16 / 9',
        borderRadius: 'var(--radius-card)',
        backgroundColor: 'var(--color-background)',
        border: '1px solid var(--color-border)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 'var(--space-1)',
      }}
    >
      <div
        style={{
          width: '52px',
          height: '52px',
          borderRadius: 'var(--radius-card)',
          backgroundColor: 'var(--color-primary)',
          color: 'var(--color-type-text)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 'var(--font-size-caption)',
          fontWeight: 600,
          letterSpacing: '0.4px',
        }}
      >
        {label}
      </div>
      <span className="text-caption">{formatFileSize(resource.fileSize)}</span>
    </div>
  )
}

function renderVideoVisual() {
  return (
    <div
      style={{
        position: 'relative',
        aspectRatio: '16 / 9',
        borderRadius: 'var(--radius-card)',
        background: 'linear-gradient(140deg, var(--color-primary), var(--color-type-video))',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundColor: 'var(--color-type-video-overlay)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <svg width="56" height="56" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="12" cy="12" r="10" stroke="var(--color-type-text)" strokeWidth="1.5" />
          <path d="M10 8.5V15.5L16 12L10 8.5Z" fill="var(--color-type-text)" />
        </svg>
      </div>
      <span
        style={{
          position: 'absolute',
          top: 'var(--space-2)',
          right: 'var(--space-2)',
          fontSize: 'var(--font-size-caption)',
          color: 'var(--color-type-text)',
          backgroundColor: 'var(--color-type-video)',
          borderRadius: 'var(--radius-card)',
          padding: '2px var(--space-2)',
        }}
      >
        Video
      </span>
    </div>
  )
}

function renderImageVisual(resource: Resource) {
  return (
    <img
      src={`https://picsum.photos/seed/${encodeURIComponent(resource.id)}/640/360`}
      alt={resource.title}
      style={{
        width: '100%',
        aspectRatio: '16 / 9',
        objectFit: 'cover',
        borderRadius: 'var(--radius-card)',
        border: '1px solid var(--color-border)',
      }}
      loading="lazy"
    />
  )
}

export default function ResourceCard({ resource }: ResourceCardProps) {
  return (
    <Link
      to={`/resource/${resource.id}`}
      style={{
        textDecoration: 'none',
        color: 'inherit',
      }}
    >
      <article className="resource-card" style={{ cursor: 'pointer' }}>
        {resource.type === 'image' && renderImageVisual(resource)}
        {resource.type === 'video' && renderVideoVisual()}
        {resource.type === 'document' && renderDocumentVisual(resource)}

        <h3
          style={{
            marginTop: 'var(--space-3)',
            marginBottom: 'var(--space-1)',
            fontSize: 'var(--font-size-card-title)',
            fontWeight: 600,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
          title={resource.title}
        >
          {resource.title}
        </h3>

        <p
          style={{
            color: 'var(--color-text-secondary)',
            fontSize: 'var(--font-size-body)',
            marginBottom: 'var(--space-3)',
          }}
          className="line-clamp-2"
        >
          {resource.description || 'No description provided.'}
        </p>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
            flexWrap: 'wrap',
          }}
        >
          <TypeBadge type={resource.type} />
          <span className="chip">{resource.category}</span>
          <span className="text-caption" style={{ marginLeft: 'auto' }}>
            {formatRelativeDate(resource.uploadDate)}
          </span>
        </div>
      </article>
    </Link>
  )
}
