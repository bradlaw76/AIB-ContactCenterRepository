/*
=============================================================================
COMPONENT:    SearchPage
FILE:         src/pages/SearchPage/SearchPage.tsx
VERSION:      1.0.0
AUTHOR:       McManus / AIB Contact Center Portal Team
LAST UPDATED: 2026-04-21
ENVIRONMENT:  React / Vite / Azure Static Web Apps

------------------------------------------------------------------------------
OVERVIEW
------------------------------------------------------------------------------
Search results page backed by query-string input with client-side matching,
type filtering, and date sort controls.

------------------------------------------------------------------------------
ARCHITECTURE
------------------------------------------------------------------------------
- Data Source:     useManifest() + useSearchParams()
- Auth Model:      Public read
- Rendering:       Client-side React page route

------------------------------------------------------------------------------
CHANGELOG
------------------------------------------------------------------------------
v1.0.0  2026-04-21  Initial version

------------------------------------------------------------------------------
NON-NEGOTIABLES
------------------------------------------------------------------------------
- Search must update when URL query changes
=============================================================================
*/

import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import EmptyState from '../../components/EmptyState/EmptyState'
import { ResourceGridSkeleton } from '../../components/LoadingSkeletons/LoadingSkeletons'
import ResourceCard from '../../components/ResourceCard/ResourceCard'
import { useManifest, type Resource } from '../../context/ManifestContext'

type TypeFilter = 'all' | Resource['type']
type SortFilter = 'newest' | 'oldest'

export default function SearchPage() {
  const {
    state: { manifest, loading },
  } = useManifest()
  const [searchParams] = useSearchParams()
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all')
  const [sort, setSort] = useState<SortFilter>('newest')

  const query = (searchParams.get('q') ?? '').trim()
  const lowerQuery = query.toLowerCase()

  const results = useMemo(() => {
    const allResources = manifest?.resources ?? []
    const queried = lowerQuery
      ? allResources.filter((resource) => {
          const haystack = `${resource.title} ${resource.description} ${resource.category}`.toLowerCase()
          return haystack.includes(lowerQuery)
        })
      : allResources

    const byType =
      typeFilter === 'all' ? queried : queried.filter((resource) => resource.type === typeFilter)

    return [...byType].sort((a, b) => {
      const diff = new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime()
      return sort === 'newest' ? diff : -diff
    })
  }, [manifest?.resources, lowerQuery, typeFilter, sort])

  if (loading) {
    return (
      <div className="container page-section">
        <ResourceGridSkeleton count={3} />
      </div>
    )
  }

  return (
    <div className="container page-section stack-6">
      <header className="stack-4">
        <h1 className="text-heading">Search</h1>
        <p className="text-body">
          {results.length} results for '{query || 'all resources'}'
        </p>
      </header>

      <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center', flexWrap: 'wrap' }}>
        <div className="pill-toggle-group" aria-label="Type filters">
          <button
            className={`pill-toggle ${typeFilter === 'all' ? 'is-active' : ''}`}
            onClick={() => setTypeFilter('all')}
          >
            All
          </button>
          <button
            className={`pill-toggle ${typeFilter === 'document' ? 'is-active' : ''}`}
            onClick={() => setTypeFilter('document')}
          >
            Document
          </button>
          <button
            className={`pill-toggle ${typeFilter === 'video' ? 'is-active' : ''}`}
            onClick={() => setTypeFilter('video')}
          >
            Video
          </button>
          <button
            className={`pill-toggle ${typeFilter === 'image' ? 'is-active' : ''}`}
            onClick={() => setTypeFilter('image')}
          >
            Image
          </button>
        </div>

        <label style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <span className="text-caption">Sort</span>
          <select value={sort} onChange={(event) => setSort(event.target.value as SortFilter)}>
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
          </select>
        </label>
      </div>

      {results.length > 0 ? (
        <div className="resource-grid">
          {results.map((resource) => (
            <ResourceCard key={resource.id} resource={resource} />
          ))}
        </div>
      ) : (
        <EmptyState
          title="No resources found"
          message="Try a different keyword, remove filters, or broaden your search terms."
        />
      )}
    </div>
  )
}
