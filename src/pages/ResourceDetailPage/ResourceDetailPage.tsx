/*
=============================================================================
COMPONENT:    ResourceDetailPage
FILE:         src/pages/ResourceDetailPage/ResourceDetailPage.tsx
VERSION:      1.0.0
AUTHOR:       McManus / AIB Contact Center Portal Team
LAST UPDATED: 2026-04-21
ENVIRONMENT:  React / Vite / Azure Static Web Apps

------------------------------------------------------------------------------
OVERVIEW
------------------------------------------------------------------------------
Resource detail route with inline viewing, metadata panel, sharing/download
actions, and owner-only edit/delete controls for content managers.

------------------------------------------------------------------------------
ARCHITECTURE
------------------------------------------------------------------------------
- Data Source:     useManifest() + GET /api/resource/:id/url
- Auth Model:      Owner actions gated by useAuth()
- Rendering:       Client-side React page route

------------------------------------------------------------------------------
CHANGELOG
------------------------------------------------------------------------------
v1.0.0  2026-04-21  Initial version

------------------------------------------------------------------------------
NON-NEGOTIABLES
------------------------------------------------------------------------------
- Delete action requires explicit user confirmation
=============================================================================
*/

import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import EmptyState from '../../components/EmptyState/EmptyState'
import InlineViewer from '../../components/InlineViewer/InlineViewer'
import TypeBadge from '../../components/TypeBadge/TypeBadge'
import { useAuth } from '../../context/AuthContext'
import { useManifest } from '../../context/ManifestContext'
import { useToast } from '../../context/ToastContext'

interface ResourceUrlResponse {
  url: string
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

export default function ResourceDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user, isContentManager } = useAuth()
  const { addToast } = useToast()
  const {
    state: { manifest, loading: manifestLoading },
    refresh,
  } = useManifest()

  const resource = useMemo(
    () => manifest?.resources.find((item) => item.id === id),
    [manifest?.resources, id]
  )

  const [sasUrl, setSasUrl] = useState<string | null>(null)
  const [urlLoading, setUrlLoading] = useState(false)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deletePending, setDeletePending] = useState(false)
  const [editTitle, setEditTitle] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editCategory, setEditCategory] = useState('')
  const [editFeatured, setEditFeatured] = useState(false)

  useEffect(() => {
    if (!resource) {
      return
    }

    setEditTitle(resource.title)
    setEditDescription(resource.description)
    setEditCategory(resource.category)
    setEditFeatured(resource.featured)
  }, [resource])

  useEffect(() => {
    if (!id || !resource) {
      return
    }

    let active = true

    async function loadResourceUrl() {
      setUrlLoading(true)

      try {
        const response = await fetch(`/api/resource/${id}/url`)
        if (!response.ok) {
          throw new Error('Failed to load resource URL')
        }

        const data = (await response.json()) as ResourceUrlResponse
        if (active) {
          setSasUrl(data.url)
        }
      } catch {
        if (active) {
          setSasUrl(null)
          addToast('Unable to load preview URL', 'error')
        }
      } finally {
        if (active) {
          setUrlLoading(false)
        }
      }
    }

    void loadResourceUrl()

    return () => {
      active = false
    }
  }, [id, resource, addToast])

  if (manifestLoading) {
    return <div className="container page-section text-body">Loading resource...</div>
  }

  if (!resource) {
    return (
      <div className="container page-section">
        <EmptyState
          title="Resource not found"
          message="This resource may have been removed or the link may be invalid."
          action={{ label: 'Browse resources', href: '/browse' }}
        />
      </div>
    )
  }

  const canManage = isContentManager && user?.userDetails === resource.uploadedBy

  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href)
      addToast('Link copied!', 'success')
    } catch {
      addToast('Unable to copy link', 'error')
    }
  }

  async function handleDelete() {
    if (!id || deletePending) {
      return
    }

    const confirmed = window.confirm('Delete this resource? This action cannot be undone.')
    if (!confirmed) {
      return
    }

    setDeletePending(true)
    try {
      const response = await fetch(`/api/resource/${id}`, { method: 'DELETE' })
      if (!response.ok) {
        throw new Error('Delete failed')
      }

      await refresh()
      addToast('Resource deleted', 'success')
      navigate('/browse')
    } catch {
      addToast('Delete failed', 'error')
    } finally {
      setDeletePending(false)
    }
  }

  async function handleSave() {
    if (!id || saving || !editTitle.trim() || !editCategory.trim()) {
      return
    }

    setSaving(true)
    try {
      const response = await fetch(`/api/resource/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editTitle.trim(),
          description: editDescription.trim(),
          category: editCategory,
          featured: editFeatured,
        }),
      })

      if (!response.ok) {
        throw new Error('Update failed')
      }

      await refresh()
      addToast('Resource updated', 'success')
      setEditing(false)
    } catch {
      addToast('Update failed', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="container page-section">
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 2fr) minmax(280px, 1fr)',
          gap: 'var(--space-6)',
        }}
      >
        <InlineViewer resource={resource} sasUrl={sasUrl} loading={urlLoading} />

        <aside className="stack-4" style={{ backgroundColor: 'var(--color-surface)', padding: 'var(--space-4)', borderRadius: 'var(--radius-card)', border: '1px solid var(--color-border)' }}>
          <h1 style={{ fontSize: '20px', fontWeight: 600 }}>{resource.title}</h1>

          <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
            <TypeBadge type={resource.type} />
            <span className="chip">{resource.category}</span>
          </div>

          <p className="text-body">{resource.description || 'No description provided.'}</p>
          <p className="text-caption">File size: {formatFileSize(resource.fileSize)}</p>
          <p className="text-caption">
            Upload date:{' '}
            {new Date(resource.uploadDate).toLocaleDateString('en-US', {
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            })}
          </p>
          <p className="text-caption">Uploaded by: {resource.uploadedBy || 'Unknown'}</p>

          <div className="stack-4">
            <button
              className="btn btn-primary"
              onClick={() => {
                if (sasUrl) {
                  window.open(sasUrl, '_blank', 'noopener,noreferrer')
                }
              }}
              disabled={!sasUrl}
            >
              Download
            </button>
            <button className="btn btn-secondary" onClick={handleCopyLink}>
              Copy Link
            </button>
          </div>

          {canManage ? (
            <section className="stack-4" style={{ borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-4)' }}>
              {editing ? (
                <>
                  <label className="stack-4">
                    <span className="text-caption">Title</span>
                    <input value={editTitle} onChange={(event) => setEditTitle(event.target.value)} />
                  </label>

                  <label className="stack-4">
                    <span className="text-caption">Description</span>
                    <textarea
                      value={editDescription}
                      rows={4}
                      onChange={(event) => setEditDescription(event.target.value)}
                    />
                  </label>

                  <label className="stack-4">
                    <span className="text-caption">Category</span>
                    <select value={editCategory} onChange={(event) => setEditCategory(event.target.value)}>
                      {(manifest?.categories ?? []).map((category) => (
                        <option key={category.name} value={category.name}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label>
                    <input
                      type="checkbox"
                      checked={editFeatured}
                      onChange={(event) => setEditFeatured(event.target.checked)}
                    />{' '}
                    Featured
                  </label>

                  <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                    <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                      {saving ? 'Saving...' : 'Save'}
                    </button>
                    <button className="btn btn-secondary" onClick={() => setEditing(false)}>
                      Cancel
                    </button>
                  </div>
                </>
              ) : (
                <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                  <button className="btn btn-secondary" onClick={() => setEditing(true)}>
                    Edit
                  </button>
                  <button className="btn btn-danger" onClick={handleDelete} disabled={deletePending}>
                    {deletePending ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              )}
            </section>
          ) : null}
        </aside>
      </div>
    </div>
  )
}
