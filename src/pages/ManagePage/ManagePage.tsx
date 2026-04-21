/*
=============================================================================
COMPONENT:    ManagePage
FILE:         src/pages/ManagePage/ManagePage.tsx
VERSION:      1.0.0
AUTHOR:       McManus / AIB Contact Center Portal Team
LAST UPDATED: 2026-04-21
ENVIRONMENT:  React / Vite / Azure Static Web Apps

------------------------------------------------------------------------------
OVERVIEW
------------------------------------------------------------------------------
Manager-only dashboard listing resources uploaded by the current user with
quick edit navigation and deletion actions.

------------------------------------------------------------------------------
ARCHITECTURE
------------------------------------------------------------------------------
- Data Source:     useManifest() + DELETE /api/resource/:id
- Auth Model:      useAuth().isContentManager guard
- Rendering:       Client-side React page route

------------------------------------------------------------------------------
CHANGELOG
------------------------------------------------------------------------------
v1.0.0  2026-04-21  Initial version

------------------------------------------------------------------------------
NON-NEGOTIABLES
------------------------------------------------------------------------------
- Only resources owned by current user are displayed
=============================================================================
*/

import { useMemo, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import EmptyState from '../../components/EmptyState/EmptyState'
import TypeBadge from '../../components/TypeBadge/TypeBadge'
import { useAuth } from '../../context/AuthContext'
import { useManifest } from '../../context/ManifestContext'
import { useToast } from '../../context/ToastContext'

export default function ManagePage() {
  const { user, isContentManager, loading: authLoading } = useAuth()
  const { addToast } = useToast()
  const {
    state: { manifest },
    refresh,
  } = useManifest()
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const ownedResources = useMemo(() => {
    if (!user) {
      return []
    }

    return (manifest?.resources ?? [])
      .filter((resource) => resource.uploadedBy === user.userDetails)
      .sort((a, b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime())
  }, [manifest?.resources, user])

  async function handleDelete(id: string, title: string) {
    const confirmed = window.confirm(`Delete \"${title}\"? This action cannot be undone.`)
    if (!confirmed) {
      return
    }

    setDeletingId(id)
    try {
      const response = await fetch(`/api/resource/${id}`, { method: 'DELETE' })
      if (!response.ok) {
        throw new Error('Delete failed')
      }

      await refresh()
      addToast('Resource deleted', 'success')
    } catch {
      addToast('Delete failed', 'error')
    } finally {
      setDeletingId(null)
    }
  }

  if (!authLoading && !isContentManager) {
    return <Navigate to="/" replace />
  }

  return (
    <div className="container page-section stack-6">
      <header className="stack-4">
        <h1 className="text-heading">Manage My Resources</h1>
        <p className="text-body">Update or remove resources you uploaded.</p>
      </header>

      {ownedResources.length === 0 ? (
        <EmptyState
          title="You haven't uploaded any resources yet"
          message="Upload your first resource to start managing content."
          action={{ label: 'Upload Resource', href: '/upload' }}
        />
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table className="table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Type</th>
                <th>Category</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {ownedResources.map((resource) => (
                <tr key={resource.id}>
                  <td>{resource.title}</td>
                  <td>
                    <TypeBadge type={resource.type} />
                  </td>
                  <td>{resource.category}</td>
                  <td>
                    {new Date(resource.uploadDate).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                      <Link className="btn btn-secondary" to={`/resource/${resource.id}`}>
                        Edit
                      </Link>
                      <button
                        className="btn btn-danger"
                        onClick={() => handleDelete(resource.id, resource.title)}
                        disabled={deletingId === resource.id}
                      >
                        {deletingId === resource.id ? 'Deleting...' : 'Delete'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
