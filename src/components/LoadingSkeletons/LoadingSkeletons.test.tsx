import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ResourceDetailSkeleton, ResourceGridSkeleton } from './LoadingSkeletons'

describe('LoadingSkeletons', () => {
  it('ResourceGridSkeleton renders exactly N skeleton cards when count is N', () => {
    const { container } = render(<ResourceGridSkeleton count={4} />)

    const grid = screen.getByLabelText('Loading resources')
    expect(grid).toBeInTheDocument()
    expect(container.querySelector('[aria-label="Loading resources"]')?.children).toHaveLength(4)
  })

  it('ResourceDetailSkeleton renders without crashing', () => {
    render(<ResourceDetailSkeleton />)

    expect(screen.getByLabelText('Loading resource detail')).toBeInTheDocument()
  })
})
