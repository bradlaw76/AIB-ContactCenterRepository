/*
=============================================================================
COMPONENT:    UploadPage
FILE:         src/pages/UploadPage/UploadPage.tsx
VERSION:      1.0.0
AUTHOR:       McManus / AIB Contact Center Portal Team
LAST UPDATED: 2026-04-21
ENVIRONMENT:  React / Vite / Azure Static Web Apps

------------------------------------------------------------------------------
OVERVIEW
------------------------------------------------------------------------------
Authenticated content-manager upload form with file validation, metadata
capture, and API submission to create new resources.

------------------------------------------------------------------------------
ARCHITECTURE
------------------------------------------------------------------------------
- Data Source:     useManifest() categories + POST /api/upload
- Auth Model:      useAuth().isContentManager guard
- Rendering:       Client-side React page route

------------------------------------------------------------------------------
CHANGELOG
------------------------------------------------------------------------------
v1.0.0  2026-04-21  Initial version

------------------------------------------------------------------------------
NON-NEGOTIABLES
------------------------------------------------------------------------------
- Maximum file size validation must enforce 100MB
=============================================================================
*/

import { useMemo, useState, type ChangeEvent, type DragEvent } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useManifest } from '../../context/ManifestContext'
import { useToast } from '../../context/ToastContext'

const ACCEPTED_EXTENSIONS = new Set([
  '.pdf',
  '.docx',
  '.pptx',
  '.xlsx',
  '.mp4',
  '.webm',
  '.jpg',
  '.jpeg',
  '.png',
  '.gif',
  '.svg',
])

const MAX_FILE_SIZE = 100 * 1024 * 1024

interface UploadResponse {
  id: string
}

function formatFileSize(bytes: number): string {
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }
  return `${Math.round(bytes / 1024)} KB`
}

export default function UploadPage() {
  const navigate = useNavigate()
  const { addToast } = useToast()
  const { isContentManager, loading: authLoading } = useAuth()
  const {
    state: { manifest },
    refresh,
  } = useManifest()

  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [featured, setFeatured] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const categories = useMemo(() => manifest?.categories ?? [], [manifest?.categories])

  function validateFile(file: File): string | null {
    const extension = file.name.slice(file.name.lastIndexOf('.')).toLowerCase()
    if (!ACCEPTED_EXTENSIONS.has(extension)) {
      return 'Unsupported file type. Please select an allowed file format.'
    }

    if (file.size > MAX_FILE_SIZE) {
      return 'File exceeds the 100MB upload limit.'
    }

    return null
  }

  function handleFile(file: File | null) {
    if (!file) {
      return
    }

    const validationError = validateFile(file)
    if (validationError) {
      setError(validationError)
      setSelectedFile(null)
      return
    }

    setError(null)
    setSelectedFile(file)
    if (!title.trim()) {
      const dotIndex = file.name.lastIndexOf('.')
      setTitle(dotIndex > 0 ? file.name.slice(0, dotIndex) : file.name)
    }
  }

  function handleInputFileChange(event: ChangeEvent<HTMLInputElement>) {
    handleFile(event.target.files?.[0] ?? null)
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    const file = event.dataTransfer.files?.[0] ?? null
    handleFile(file)
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!selectedFile) {
      setError('Please select a file to upload.')
      return
    }

    if (!title.trim()) {
      setError('Title is required.')
      return
    }

    if (!category.trim()) {
      setError('Category is required.')
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('file', selectedFile)
      formData.append(
        'metadata',
        JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          category,
          featured,
        })
      )

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Upload failed')
      }

      const payload = (await response.json()) as UploadResponse
      await refresh()
      addToast('Resource uploaded!', 'success')
      navigate(`/resource/${payload.id}`)
    } catch {
      setError('Upload failed. Please try again.')
      addToast('Upload failed', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  if (!authLoading && !isContentManager) {
    return <Navigate to="/" replace />
  }

  return (
    <div className="container page-section">
      <form className="stack-6" onSubmit={handleSubmit}>
        <header className="stack-4">
          <h1 className="text-heading">Upload Resource</h1>
          <p className="text-body">Add a file and metadata to publish new contact center content.</p>
        </header>

        <section className="stack-4">
          <div
            onDragOver={(event) => event.preventDefault()}
            onDrop={handleDrop}
            style={{
              border: '2px dashed var(--color-border)',
              borderRadius: 'var(--radius-card)',
              backgroundColor: 'var(--color-surface)',
              padding: 'var(--space-8)',
              textAlign: 'center',
            }}
          >
            <p className="text-body" style={{ marginBottom: 'var(--space-2)' }}>
              Drag and drop a file here, or click to choose
            </p>
            <p className="text-caption" style={{ marginBottom: 'var(--space-4)' }}>
              Accepted: PDF, DOCX, PPTX, XLSX, MP4, WEBM, JPG, JPEG, PNG, GIF, SVG (max 100MB)
            </p>
            <label className="btn btn-secondary" style={{ cursor: 'pointer' }}>
              Choose File
              <input
                type="file"
                accept=".pdf,.docx,.pptx,.xlsx,.mp4,.webm,.jpg,.jpeg,.png,.gif,.svg"
                onChange={handleInputFileChange}
                style={{ display: 'none' }}
              />
            </label>
          </div>

          {selectedFile ? (
            <p className="text-caption">
              Selected: {selectedFile.name} ({formatFileSize(selectedFile.size)})
            </p>
          ) : null}
        </section>

        <section className="stack-4" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-card)', padding: 'var(--space-4)' }}>
          <h2 className="text-card-title">Metadata</h2>

          <label className="stack-4">
            <span className="text-caption">Title *</span>
            <input value={title} onChange={(event) => setTitle(event.target.value)} required />
          </label>

          <label className="stack-4">
            <span className="text-caption">Description</span>
            <textarea
              value={description}
              rows={4}
              onChange={(event) => setDescription(event.target.value)}
            />
          </label>

          <label className="stack-4">
            <span className="text-caption">Category *</span>
            <select value={category} onChange={(event) => setCategory(event.target.value)} required>
              <option value="">Select category</option>
              {categories.map((entry) => (
                <option key={entry.name} value={entry.name}>
                  {entry.name}
                </option>
              ))}
            </select>
          </label>

          <label>
            <input
              type="checkbox"
              checked={featured}
              onChange={(event) => setFeatured(event.target.checked)}
            />{' '}
            Featured
          </label>
        </section>

        {error ? <p style={{ color: 'var(--color-danger)' }}>{error}</p> : null}

        <div>
          <button className="btn btn-primary" type="submit" disabled={submitting}>
            {submitting ? 'Uploading...' : 'Upload Resource'}
          </button>
        </div>
      </form>
    </div>
  )
}
