import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import TypeBadge from './TypeBadge'

describe('TypeBadge', () => {
  it('renders Document, Video, and Image labels correctly', () => {
    render(
      <>
        <TypeBadge type="document" />
        <TypeBadge type="video" />
        <TypeBadge type="image" />
      </>
    )

    expect(screen.getByText(/document/i)).toBeInTheDocument()
    expect(screen.getByText(/video/i)).toBeInTheDocument()
    expect(screen.getByText(/image/i)).toBeInTheDocument()
  })

  it('applies distinct styles for each type', () => {
    render(
      <>
        <TypeBadge type="document" />
        <TypeBadge type="video" />
        <TypeBadge type="image" />
      </>
    )

    expect(screen.getByText(/document/i)).toHaveStyle({ backgroundColor: 'var(--color-type-document)' })
    expect(screen.getByText(/video/i)).toHaveStyle({ backgroundColor: 'var(--color-type-video)' })
    expect(screen.getByText(/image/i)).toHaveStyle({ backgroundColor: 'var(--color-type-image)' })
  })
})
