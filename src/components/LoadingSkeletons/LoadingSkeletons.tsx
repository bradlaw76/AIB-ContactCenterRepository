/*
=============================================================================
COMPONENT:    LoadingSkeletons
FILE:         src/components/LoadingSkeletons/LoadingSkeletons.tsx
VERSION:      1.0.0
AUTHOR:       McManus / AIB Contact Center Portal Team
LAST UPDATED: 2026-04-21
ENVIRONMENT:  React / Vite / Azure Static Web Apps

------------------------------------------------------------------------------
OVERVIEW
------------------------------------------------------------------------------
Skeleton loading primitives for resource grids and detail views to avoid abrupt
layout shifts while data is loading.

------------------------------------------------------------------------------
ARCHITECTURE
------------------------------------------------------------------------------
- Data Source:     Props only
- Auth Model:      None
- Rendering:       Client-side React component

------------------------------------------------------------------------------
FEATURES
------------------------------------------------------------------------------
- ResourceGridSkeleton: configurable card placeholder count
- ResourceDetailSkeleton: two-column detail layout placeholder
- Animated shimmer: uses shared .skeleton-shimmer class

------------------------------------------------------------------------------
CHANGELOG
------------------------------------------------------------------------------
v1.0.0  2026-04-21  Initial version

------------------------------------------------------------------------------
NON-NEGOTIABLES
------------------------------------------------------------------------------
- Skeleton blocks must preserve final layout proportions
=============================================================================
*/

import type { CSSProperties } from 'react'

const cardStyle: CSSProperties = {
  backgroundColor: 'var(--color-surface)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-card)',
  padding: 'var(--space-3)',
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--space-3)',
}

const skeletonBlock = (height: string, width = '100%'): CSSProperties => ({
  height,
  width,
  borderRadius: 'var(--radius-card)',
})

export function ResourceGridSkeleton({ count }: { count: number }) {
  return (
    <div className="resource-grid" aria-label="Loading resources" aria-busy="true">
      {Array.from({ length: count }, (_, index) => (
        <div key={`grid-skeleton-${index}`} style={cardStyle}>
          <div className="skeleton-shimmer" style={skeletonBlock('160px')} />
          <div className="skeleton-shimmer" style={skeletonBlock('16px', '72%')} />
          <div className="skeleton-shimmer" style={skeletonBlock('12px', '94%')} />
          <div className="skeleton-shimmer" style={skeletonBlock('12px', '82%')} />
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            <div className="skeleton-shimmer" style={skeletonBlock('20px', '72px')} />
            <div className="skeleton-shimmer" style={skeletonBlock('20px', '84px')} />
          </div>
        </div>
      ))}
    </div>
  )
}

export function ResourceDetailSkeleton() {
  return (
    <div
      aria-label="Loading resource detail"
      aria-busy="true"
      style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 2fr) minmax(260px, 1fr)',
        gap: 'var(--space-6)',
      }}
    >
      <div className="skeleton-shimmer" style={{ ...skeletonBlock('420px'), borderRadius: 'var(--radius-card)' }} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        <div className="skeleton-shimmer" style={skeletonBlock('24px', '80%')} />
        <div className="skeleton-shimmer" style={skeletonBlock('20px', '56%')} />
        <div className="skeleton-shimmer" style={skeletonBlock('14px', '100%')} />
        <div className="skeleton-shimmer" style={skeletonBlock('14px', '96%')} />
        <div className="skeleton-shimmer" style={skeletonBlock('14px', '68%')} />
        <div className="skeleton-shimmer" style={skeletonBlock('40px', '100%')} />
        <div className="skeleton-shimmer" style={skeletonBlock('40px', '100%')} />
      </div>
    </div>
  )
}
