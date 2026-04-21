import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import InlineViewer from './InlineViewer'
import type { Resource } from '../../context/ManifestContext'

const baseResource: Resource = {
  id: 'res-1',
  title: 'Viewer Resource',
  description: 'Viewer description',
  category: 'Training',
  type: 'document',
  fileExt: 'pdf',
  blobName: 'viewer-resource.pdf',
  fileSize: 2048,
  uploadDate: '2026-04-21T00:00:00.000Z',
  uploadedBy: 'manager@contoso.com',
  featured: false,
}

describe('InlineViewer', () => {
  it('renders loading skeleton when loading is true', () => {
    render(<InlineViewer resource={baseResource} sasUrl={null} loading />)

    expect(screen.getByLabelText('Loading resource detail')).toBeInTheDocument()
  })

  it('renders an image with sasUrl for image resources', () => {
    render(
      <InlineViewer
        resource={{ ...baseResource, type: 'image', title: 'Sample image', fileExt: 'png', blobName: 'sample.png' }}
        sasUrl="https://example.com/image.png?sig=abc"
        loading={false}
      />
    )

    expect(screen.getByRole('img', { name: 'Sample image' })).toHaveAttribute(
      'src',
      'https://example.com/image.png?sig=abc'
    )
  })

  it('renders a video with sasUrl for video resources', () => {
    render(
      <InlineViewer
        resource={{ ...baseResource, type: 'video', title: 'Sample video', fileExt: 'mp4', blobName: 'sample.mp4' }}
        sasUrl="https://example.com/video.mp4?sig=abc"
        loading={false}
      />
    )

    expect(document.querySelector('video')).toHaveAttribute('src', 'https://example.com/video.mp4?sig=abc')
  })

  it('renders Preview not available message for document resources', () => {
    render(<InlineViewer resource={baseResource} sasUrl="https://example.com/doc.pdf?sig=abc" loading={false} />)

    expect(screen.getByText('Preview not available - download to view.')).toBeInTheDocument()
  })

  it('renders gracefully when sasUrl is null', () => {
    render(
      <>
        <InlineViewer
          resource={{ ...baseResource, type: 'image', title: 'Image without url', fileExt: 'jpg', blobName: 'img.jpg' }}
          sasUrl={null}
          loading={false}
        />
        <InlineViewer
          resource={{ ...baseResource, type: 'video', title: 'Video without url', fileExt: 'mp4', blobName: 'vid.mp4' }}
          sasUrl={null}
          loading={false}
        />
      </>
    )

    expect(screen.getByText('Preview unavailable for this image.')).toBeInTheDocument()
    expect(screen.getByText('Preview unavailable for this video.')).toBeInTheDocument()
  })
})
