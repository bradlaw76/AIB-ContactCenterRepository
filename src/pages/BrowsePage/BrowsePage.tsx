/*
=============================================================================
COMPONENT:    BrowsePage
FILE:         src/pages/BrowsePage/BrowsePage.tsx
VERSION:      1.0.0
AUTHOR:       McManus / AIB Contact Center Portal Team
LAST UPDATED: 2026-04-21
ENVIRONMENT:  React / Vite / Azure Static Web Apps

------------------------------------------------------------------------------
OVERVIEW
------------------------------------------------------------------------------
Resource gallery page with type/category filters, multiple sort modes, and
responsive desktop-sidebar plus mobile-drawer filter UX.

------------------------------------------------------------------------------
ARCHITECTURE
------------------------------------------------------------------------------
- Data Source:     useManifest()
- Auth Model:      Public read
- Rendering:       Client-side React page route

------------------------------------------------------------------------------
CHANGELOG
------------------------------------------------------------------------------
v1.0.0  2026-04-21  Initial version

------------------------------------------------------------------------------
NON-NEGOTIABLES
------------------------------------------------------------------------------
- Category route param must preselect filter state
=============================================================================
*/

import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import EmptyState from '../../components/EmptyState/EmptyState'
import { ResourceGridSkeleton } from '../../components/LoadingSkeletons/LoadingSkeletons'
import ResourceCard from '../../components/ResourceCard/ResourceCard'
import { useManifest, type Resource } from '../../context/ManifestContext'

type SortOption = 'newest' | 'oldest' | 'az' | 'za'
type ResourceType = Resource['type']

function compareBySort(a: Resource, b: Resource, sort: SortOption): number {
  switch (sort) {
    case 'oldest':
      return new Date(a.uploadDate).getTime() - new Date(b.uploadDate).getTime()
    case 'az':
      return a.title.localeCompare(b.title)
    case 'za':
      return b.title.localeCompare(a.title)
    case 'newest':
    default:
      return new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime()
  }
}

interface FilterPanelProps {
  availableCategories: string[]
  selectedTypes: Set<ResourceType>
  selectedCategories: Set<string>
  onTypeToggle: (type: ResourceType) => void
  onCategoryToggle: (name: string) => void
}

function FilterPanel({
  availableCategories,
  selectedTypes,
  selectedCategories,
  onTypeToggle,
  onCategoryToggle,
}: FilterPanelProps) {
  return (
    <div className="stack-6">
      <section className="stack-4">
        <h2 className="text-card-title">Type</h2>
        <label>
          <input
            type="checkbox"
            checked={selectedTypes.has('document')}
            onChange={() => onTypeToggle('document')}
          />{' '}
          Document
        </label>
        <label>
          <input type="checkbox" checked={selectedTypes.has('video')} onChange={() => onTypeToggle('video')} /> Video
        </label>
        <label>
          <input type="checkbox" checked={selectedTypes.has('image')} onChange={() => onTypeToggle('image')} /> Image
        </label>
      </section>

      <section className="stack-4">
        <h2 className="text-card-title">Category</h2>
        {availableCategories.map((category) => (
          <label key={category}>
            <input
              type="checkbox"
              checked={selectedCategories.has(category)}
              onChange={() => onCategoryToggle(category)}
            />{' '}
            {category}
          </label>
        ))}
      </section>
    </div>
  )
}

export default function BrowsePage() {
  const {
    state: { manifest, loading },
  } = useManifest()
  const { category: routeCategory } = useParams<{ category?: string }>()

  const [selectedTypes, setSelectedTypes] = useState<Set<ResourceType>>(
    new Set<ResourceType>(['document', 'video', 'image'])
  )
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set())
  const [sort, setSort] = useState<SortOption>('newest')
  const [showFiltersMobile, setShowFiltersMobile] = useState(false)

  const categories = useMemo(
    () => (manifest?.categories ?? []).map((entry) => entry.name),
    [manifest?.categories]
  )

  useEffect(() => {
    if (routeCategory) {
      setSelectedCategories(new Set([decodeURIComponent(routeCategory)]))
      return
    }

    if (categories.length > 0) {
      setSelectedCategories(new Set(categories))
    }
  }, [routeCategory, categories])

  function toggleType(type: ResourceType) {
    setSelectedTypes((previous) => {
      const next = new Set(previous)
      if (next.has(type)) {
        next.delete(type)
      } else {
        next.add(type)
      }
      return next
    })
  }

  function toggleCategory(name: string) {
    setSelectedCategories((previous) => {
      const next = new Set(previous)
      if (next.has(name)) {
        next.delete(name)
      } else {
        next.add(name)
      }
      return next
    })
  }

  const visibleResources = useMemo(() => {
    const source = manifest?.resources ?? []

    return source
      .filter((resource) => {
        const byType = selectedTypes.size > 0 ? selectedTypes.has(resource.type) : false
        const byCategory =
          selectedCategories.size > 0 ? selectedCategories.has(resource.category) : true
        return byType && byCategory
      })
      .sort((a, b) => compareBySort(a, b, sort))
  }, [manifest?.resources, selectedTypes, selectedCategories, sort])

  if (loading) {
    return (
      <div className="container page-section">
        <ResourceGridSkeleton count={6} />
      </div>
    )
  }

  return (
    <div className="container page-section stack-6">
      <header style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
        <h1 className="text-heading" style={{ marginRight: 'auto' }}>
          Browse Resources
        </h1>
        <button className="btn btn-secondary mobile-only" onClick={() => setShowFiltersMobile(true)}>
          Filters
        </button>
        <label style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <span className="text-caption">Sort</span>
          <select value={sort} onChange={(event) => setSort(event.target.value as SortOption)}>
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="az">A-Z</option>
            <option value="za">Z-A</option>
          </select>
        </label>
      </header>

      <p className="text-caption">Showing {visibleResources.length} resources</p>

      <div className="sidebar-layout">
        <aside className="desktop-only" style={{ position: 'sticky', top: '64px', alignSelf: 'start' }}>
          <FilterPanel
            availableCategories={categories}
            selectedTypes={selectedTypes}
            selectedCategories={selectedCategories}
            onTypeToggle={toggleType}
            onCategoryToggle={toggleCategory}
          />
        </aside>

        <section>
          {visibleResources.length > 0 ? (
            <div className="resource-grid">
              {visibleResources.map((resource) => (
                <ResourceCard key={resource.id} resource={resource} />
              ))}
            </div>
          ) : (
            <EmptyState
              title="No matching resources"
              message="Try adjusting your filters to broaden your results."
            />
          )}
        </section>
      </div>

      {showFiltersMobile ? (
        <div className="filter-drawer" role="dialog" aria-modal="true" aria-label="Browse filters">
          <button
            type="button"
            className="filter-drawer__backdrop"
            aria-label="Close filters"
            onClick={() => setShowFiltersMobile(false)}
          />
          <div className="filter-drawer__panel stack-6">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 className="text-heading">Filters</h2>
              <button className="btn btn-secondary" onClick={() => setShowFiltersMobile(false)}>
                Close
              </button>
            </div>
            <FilterPanel
              availableCategories={categories}
              selectedTypes={selectedTypes}
              selectedCategories={selectedCategories}
              onTypeToggle={toggleType}
              onCategoryToggle={toggleCategory}
            />
          </div>
        </div>
      ) : null}
    </div>
  )
}
