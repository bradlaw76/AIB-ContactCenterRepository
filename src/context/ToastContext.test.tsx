import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { ToastProvider, useToast } from './ToastContext'

function ToastHarness() {
  const { addToast, removeToast } = useToast()

  return (
    <div>
      <button onClick={() => addToast('Saved successfully', 'success', 4000)}>add toast</button>
      <button onClick={() => addToast('Short lived', 'info', 1000)}>add timed toast</button>
      <button onClick={() => addToast('First', 'info', 0)}>add first</button>
      <button onClick={() => addToast('Second', 'success', 0)}>add second</button>
      <button onClick={() => addToast('Third', 'error', 0)}>add third</button>
      <button onClick={() => removeToast('toast-1')}>remove specific</button>
    </div>
  )
}

describe('ToastProvider and useToast', () => {
  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('renders a toast with the correct message when addToast is called', async () => {
    render(
      <ToastProvider>
        <ToastHarness />
      </ToastProvider>
    )

    fireEvent.click(screen.getByRole('button', { name: 'add toast' }))

    expect(await screen.findByText('Saved successfully')).toBeInTheDocument()
  })

  it('removes a toast after the specified duration', async () => {
    vi.useFakeTimers()

    render(
      <ToastProvider>
        <ToastHarness />
      </ToastProvider>
    )

    fireEvent.click(screen.getByRole('button', { name: 'add timed toast' }))
    expect(screen.getByText('Short lived')).toBeInTheDocument()

    act(() => {
      vi.advanceTimersByTime(1000)
    })

    expect(screen.queryByText('Short lived')).not.toBeInTheDocument()
  })

  it('removes a specific toast immediately when removeToast is called', async () => {
    vi.spyOn(globalThis.crypto, 'randomUUID').mockReturnValue('toast-1')

    render(
      <ToastProvider>
        <ToastHarness />
      </ToastProvider>
    )

    fireEvent.click(screen.getByRole('button', { name: 'add toast' }))
    expect(await screen.findByText('Saved successfully')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'remove specific' }))

    await waitFor(() => {
      expect(screen.queryByText('Saved successfully')).not.toBeInTheDocument()
    })
  })

  it('keeps multiple toasts visible when several toasts are added', async () => {
    render(
      <ToastProvider>
        <ToastHarness />
      </ToastProvider>
    )

    fireEvent.click(screen.getByRole('button', { name: 'add first' }))
    fireEvent.click(screen.getByRole('button', { name: 'add second' }))
    fireEvent.click(screen.getByRole('button', { name: 'add third' }))

    expect(await screen.findByText('First')).toBeInTheDocument()
    expect(screen.getByText('Second')).toBeInTheDocument()
    expect(screen.getByText('Third')).toBeInTheDocument()
  })

  it('throws when useToast is used outside the provider', () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    function BrokenConsumer() {
      useToast()
      return null
    }

    expect(() => render(<BrokenConsumer />)).toThrow('useToast must be used within a ToastProvider')

    consoleErrorSpy.mockRestore()
  })

  it('renders the toast container with role status for accessibility', async () => {
    render(
      <ToastProvider>
        <ToastHarness />
      </ToastProvider>
    )

    fireEvent.click(screen.getByRole('button', { name: 'add toast' }))

    expect(await screen.findByRole('status')).toBeInTheDocument()
  })
})
