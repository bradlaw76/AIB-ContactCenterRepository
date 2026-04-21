import { describe, expect, it, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import ResourceCard from './ResourceCard'
import type { Resource } from '../../context/ManifestContext'

const baseResource: Resource = {
  id: 'res-1',
  title: 'Knowledge Base Overview',
  description: 'Portal onboarding guide',
  category: 'Training',
  type: 'document',
  fileExt: 'pdf',
  blobName: 'kb-overview.pdf',
  fileSize: 1024 * 1024,
  uploadDate: '2026-04-20T00:00:00.000Z',
  uploadedBy: 'manager@contoso.com',
  featured: false,
}

function renderCard(resource: Resource) {
  return render(
    <MemoryRouter>
      <ResourceCard resource={resource} />
    </MemoryRouter>
  )
}

describe('ResourceCard', () => {
  it('renders resource title, TypeBadge, category, and formatted relative date', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-04-21T00:00:00.000Z'))

    renderCard(baseResource)

    expect(screen.getByRole('heading', { name: baseResource.title })).toBeInTheDocument()
    expect(screen.getByText(/document/i)).toBeInTheDocument()
    expect(screen.getByText(baseResource.category)).toBeInTheDocument()
    expect(screen.getByText('1 day ago')).toBeInTheDocument()

    vi.useRealTimers()
  })

  it('links to the resource detail route', () => {
    renderCard(baseResource)

    expect(screen.getByRole('link')).toHaveAttribute('href', '/resource/res-1')
  })

  it('shows an image thumbnail for image resources', () => {
    renderCard({
      ...baseResource,
      id: 'img-1',
      title: 'Team Floorplan',
      type: 'image',
      fileExt: 'png',
      blobName: 'floorplan.png',
    })

    const image = screen.getByRole('img', { name: 'Team Floorplan' })
    expect(image).toHaveAttribute('src', expect.stringContaining('/seed/img-1/'))
  })

  it('shows a play overlay indicator for video resources', () => {
    renderCard({
      ...baseResource,
      id: 'vid-1',
      type: 'video',
      title: 'Call Handling Demo',
      fileExt: 'mp4',
      blobName: 'call-handling.mp4',
    })

    const videoLabels = screen.getAllByText(/video/i)
    expect(videoLabels.length).toBeGreaterThan(1)
    expect(document.querySelector('svg[aria-hidden="true"]')).toBeInTheDocument()
  })

  it('shows a file-type indicator for document resources', () => {
    renderCard({
      ...baseResource,
      id: 'doc-1',
      fileExt: 'docx',
      blobName: 'playbook.docx',
    })

    const card = screen.getByRole('link')
    expect(within(card).getByText('DOCX')).toBeInTheDocument()
  })
})
