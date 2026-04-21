/*
=============================================================================
COMPONENT:    TypeBadge
FILE:         src/components/TypeBadge/TypeBadge.tsx
VERSION:      1.0.0
AUTHOR:       McManus / AIB Contact Center Portal Team
LAST UPDATED: 2026-04-21
ENVIRONMENT:  React / Vite / Azure Static Web Apps

------------------------------------------------------------------------------
OVERVIEW
------------------------------------------------------------------------------
Compact pill badge used across resource cards and detail views to communicate
resource type consistently.

------------------------------------------------------------------------------
ARCHITECTURE
------------------------------------------------------------------------------
- Data Source:     Props only
- Auth Model:      None
- Rendering:       Client-side React component

------------------------------------------------------------------------------
FEATURES
------------------------------------------------------------------------------
- Types:           document | video | image
- Visuals:         12px, semibold text, 4px radius, 8px/2px padding
- Colors:          Uses type-specific CSS custom properties

------------------------------------------------------------------------------
CHANGELOG
------------------------------------------------------------------------------
v1.0.0  2026-04-21  Initial version

------------------------------------------------------------------------------
NON-NEGOTIABLES
------------------------------------------------------------------------------
- Badge text must remain a single capitalized word
- Colors must be sourced from CSS custom properties
=============================================================================
*/

import type { CSSProperties } from 'react'

interface TypeBadgeProps {
  type: 'document' | 'video' | 'image'
}

const TYPE_STYLES: Record<TypeBadgeProps['type'], CSSProperties> = {
  document: {
    backgroundColor: 'var(--color-type-document)',
    color: 'var(--color-type-text)',
  },
  video: {
    backgroundColor: 'var(--color-type-video)',
    color: 'var(--color-type-text)',
  },
  image: {
    backgroundColor: 'var(--color-type-image)',
    color: 'var(--color-type-text)',
  },
}

const baseStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  borderRadius: 'var(--radius-card)',
  fontSize: 'var(--font-size-caption)',
  fontWeight: 500,
  lineHeight: 1.3,
  textTransform: 'capitalize',
  padding: '2px var(--space-2)',
}

export default function TypeBadge({ type }: TypeBadgeProps) {
  return <span style={{ ...baseStyle, ...TYPE_STYLES[type] }}>{type}</span>
}
