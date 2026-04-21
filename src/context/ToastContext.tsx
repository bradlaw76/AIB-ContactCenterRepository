/*
=============================================================================
COMPONENT:    ToastContext
FILE:         src/context/ToastContext.tsx
VERSION:      1.0.0
AUTHOR:       McManus / AIB Contact Center Portal Team
LAST UPDATED: 2026-04-21
ENVIRONMENT:  React / Vite / Azure Static Web Apps

------------------------------------------------------------------------------
OVERVIEW
------------------------------------------------------------------------------
React Context that manages a queue of toast notifications. Renders a fixed
ToastContainer (bottom-right) inside the provider. Toasts auto-dismiss after
a configurable duration (default 4000ms).

------------------------------------------------------------------------------
ARCHITECTURE
------------------------------------------------------------------------------
- Data Source:     Internal state only
- Auth Model:      None
- Rendering:       ToastContainer rendered inside ToastProvider via createPortal

------------------------------------------------------------------------------
FEATURES
------------------------------------------------------------------------------
- Types:              Toast (id, message, type, duration)
- addToast():         Adds toast with auto-dismiss timer
- removeToast():      Removes toast by id
- ToastContainer:     Fixed bottom-right stack, WCAG role="status"
- Visual styles:      success=#107C10, error=#D13438, info=#0078D4, white text

------------------------------------------------------------------------------
NON-NEGOTIABLES
------------------------------------------------------------------------------
- useToast() throws if called outside ToastProvider
- IDs generated via crypto.randomUUID() — no external dependency
=============================================================================
*/

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'

/* ---- Types ---- */
export interface Toast {
  id: string
  message: string
  type: 'success' | 'error' | 'info'
  duration?: number
}

interface ToastContextValue {
  addToast: (message: string, type: Toast['type'], duration?: number) => void
  removeToast: (id: string) => void
}

/* ---- Context ---- */
const ToastContext = createContext<ToastContextValue | null>(null)

/* ---- Inline styles (uses CSS custom property values) ---- */
const TYPE_COLORS: Record<Toast['type'], string> = {
  success: 'var(--color-success)',
  error:   'var(--color-danger)',
  info:    'var(--color-primary)',
}

/* ---- ToastItem ---- */
function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
  return (
    <div
      role="alert"
      style={{
        backgroundColor: TYPE_COLORS[toast.type],
        color: '#fff',
        borderRadius: 'var(--radius-card)',
        padding: 'var(--space-3) var(--space-4)',
        minWidth: '280px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 'var(--space-2)',
        boxShadow: 'var(--shadow-card-hover)',
        fontSize: 'var(--font-size-body)',
      }}
    >
      <span>{toast.message}</span>
      <button
        aria-label="Dismiss notification"
        onClick={() => onRemove(toast.id)}
        style={{
          background: 'none',
          border: 'none',
          color: '#fff',
          cursor: 'pointer',
          fontSize: '1rem',
          lineHeight: 1,
          padding: 0,
          flexShrink: 0,
        }}
      >
        ×
      </button>
    </div>
  )
}

/* ---- ToastContainer ---- */
function ToastContainer({ toasts, onRemove }: { toasts: Toast[]; onRemove: (id: string) => void }) {
  if (toasts.length === 0) return null
  return createPortal(
    <div
      role="status"
      aria-live="polite"
      aria-atomic="false"
      style={{
        position: 'fixed',
        bottom: 'var(--space-4)',
        right: 'var(--space-4)',
        zIndex: 'var(--z-toast)' as unknown as number,
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-2)',
        alignItems: 'flex-end',
      }}
    >
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onRemove={onRemove} />
      ))}
    </div>,
    document.body
  )
}

/* ---- Provider ---- */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const addToast = useCallback(
    (message: string, type: Toast['type'], duration = 4000) => {
      const id = crypto.randomUUID()
      setToasts((prev) => [...prev, { id, message, type, duration }])
      if (duration > 0) {
        setTimeout(() => removeToast(id), duration)
      }
    },
    [removeToast]
  )

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  )
}

/* ---- Hook ---- */
export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext)
  if (ctx === null) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return ctx
}
