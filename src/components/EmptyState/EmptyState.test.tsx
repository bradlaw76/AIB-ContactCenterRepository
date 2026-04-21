import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import EmptyState from './EmptyState'

describe('EmptyState', () => {
  it('renders title and message', () => {
    render(
      <MemoryRouter>
        <EmptyState title="Nothing here" message="Try again later." />
      </MemoryRouter>
    )

    expect(screen.getByRole('heading', { name: 'Nothing here' })).toBeInTheDocument()
    expect(screen.getByText('Try again later.')).toBeInTheDocument()
  })

  it('renders action link when action prop is provided', () => {
    render(
      <MemoryRouter>
        <EmptyState
          title="No uploads"
          message="Start by uploading one."
          action={{ label: 'Upload now', href: '/upload' }}
        />
      </MemoryRouter>
    )

    expect(screen.getByRole('link', { name: 'Upload now' })).toHaveAttribute('href', '/upload')
  })

  it('does not render action link when action prop is omitted', () => {
    render(
      <MemoryRouter>
        <EmptyState title="No uploads" message="Start by uploading one." />
      </MemoryRouter>
    )

    expect(screen.queryByRole('link')).not.toBeInTheDocument()
  })
})
