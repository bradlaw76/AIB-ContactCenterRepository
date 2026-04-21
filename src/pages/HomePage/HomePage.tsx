/*
=============================================================================
COMPONENT:    HomePage
FILE:         src/pages/HomePage/HomePage.tsx
VERSION:      1.0.0
AUTHOR:       McManus / AIB Contact Center Portal Team
LAST UPDATED: 2026-04-21
ENVIRONMENT:  React / Vite / Azure Static Web Apps

------------------------------------------------------------------------------
OVERVIEW
------------------------------------------------------------------------------
Landing page showing hero messaging, featured resources, and recently added
resources from the manifest.

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
- Featured list must respect resource.featured flag
=============================================================================
*/

import EmptyState from '../../components/EmptyState/EmptyState'
import { ResourceGridSkeleton } from '../../components/LoadingSkeletons/LoadingSkeletons'
import ResourceCard from '../../components/ResourceCard/ResourceCard'
import { useManifest } from '../../context/ManifestContext'

export default function HomePage() {
  const {
    state: { manifest, loading },
  } = useManifest()

  if (loading) {
    return (
      <div className="container page-section">
        <ResourceGridSkeleton count={6} />
      </div>
    )
  }

  const resources = manifest?.resources ?? []

  if (resources.length === 0) {
    return (
      <div className="container page-section">
        <EmptyState
          title="No resources yet"
          message="No content is available yet. Content managers can upload the first resource to get started."
        />
      </div>
    )
  }

  const featured = resources.filter((resource) => resource.featured).slice(0, 3)
  const recentlyAdded = [...resources]
    .sort((a, b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime())
    .slice(0, 6)

  return (
    <>
      <section
        style={{
          background: 'linear-gradient(120deg, var(--color-primary), var(--color-primary-dark))',
          color: 'var(--color-type-text)',
          paddingBlock: '64px',
        }}
      >
        <div className="container stack-4">
          <h1 style={{ fontSize: '28px', fontWeight: 600 }}>Contact Center Resources</h1>
          <p style={{ fontSize: '16px', opacity: 0.9 }}>
            Browse, search, and share training materials, policies, and tools
          </p>
        </div>
      </section>

      <div className="container page-section stack-6">
        <section className="stack-4">
          <h2 className="text-heading">Featured</h2>
          {featured.length > 0 ? (
            <div className="resource-grid">
              {featured.map((resource) => (
                <ResourceCard key={resource.id} resource={resource} />
              ))}
            </div>
          ) : (
            <EmptyState
              title="No featured resources"
              message="Featured resources will appear here once content managers mark items as featured."
            />
          )}
        </section>

        <section className="stack-4">
          <h2 className="text-heading">Recently Added</h2>
          <div className="resource-grid">
            {recentlyAdded.map((resource) => (
              <ResourceCard key={resource.id} resource={resource} />
            ))}
          </div>
        </section>
      </div>
    </>
  )
}
