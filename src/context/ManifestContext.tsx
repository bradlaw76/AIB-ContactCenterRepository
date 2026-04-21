/*
=============================================================================
COMPONENT:    ManifestContext
FILE:         src/context/ManifestContext.tsx
VERSION:      1.0.0
AUTHOR:       McManus / AIB Contact Center Portal Team
LAST UPDATED: 2026-04-21
ENVIRONMENT:  React / Vite / Azure Static Web Apps

------------------------------------------------------------------------------
OVERVIEW
------------------------------------------------------------------------------
React Context that fetches the content manifest from /api/manifest on mount,
stores it globally, and exposes a refresh() function for post-upload
invalidation. All browse, search, and filter operations read from this context.

------------------------------------------------------------------------------
ARCHITECTURE
------------------------------------------------------------------------------
- Data Source:     GET /api/manifest (Azure Function proxy -> GitHub raw)
- Auth Model:      None (public read)
- Rendering:       Provider wraps App root; consumers use useManifest()

------------------------------------------------------------------------------
FEATURES
------------------------------------------------------------------------------
- Types:           Resource, Category, Manifest
- State:           manifest, loading, error
- fetch on mount:  GET /api/manifest
- refresh():       Refetches manifest (call after upload/delete)

------------------------------------------------------------------------------
NON-NEGOTIABLES
------------------------------------------------------------------------------
- useManifest() throws if called outside ManifestProvider
- Do NOT cache manifest in localStorage for v1
=============================================================================
*/

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useReducer,
  type ReactNode,
} from 'react'

/* ---- Types ---- */
export interface Resource {
  id: string
  title: string
  description: string
  category: string
  type: 'document' | 'video' | 'image'
  fileExt: string
  blobName: string
  fileSize: number
  uploadDate: string
  uploadedBy: string
  featured: boolean
}

export interface Category {
  name: string
  order: number
}

export interface Manifest {
  version: string
  generatedAt: string
  resources: Resource[]
  categories: Category[]
}

/* ---- State / Reducer ---- */
interface ManifestState {
  manifest: Manifest | null
  loading: boolean
  error: string | null
}

type ManifestAction =
  | { type: 'FETCH_START' }
  | { type: 'FETCH_SUCCESS'; payload: Manifest }
  | { type: 'FETCH_ERROR'; payload: string }

function manifestReducer(state: ManifestState, action: ManifestAction): ManifestState {
  switch (action.type) {
    case 'FETCH_START':
      return { ...state, loading: true, error: null }
    case 'FETCH_SUCCESS':
      return { manifest: action.payload, loading: false, error: null }
    case 'FETCH_ERROR':
      return { ...state, loading: false, error: action.payload }
    default:
      return state
  }
}

/* ---- Context ---- */
interface ManifestContextValue {
  state: ManifestState
  refresh: () => void
}

const ManifestContext = createContext<ManifestContextValue | null>(null)

/* ---- Provider ---- */
export function ManifestProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(manifestReducer, {
    manifest: null,
    loading: false,
    error: null,
  })

  const fetchManifest = useCallback(async () => {
    dispatch({ type: 'FETCH_START' })
    try {
      const res = await fetch('/api/manifest')
      if (!res.ok) {
        throw new Error(`Failed to load manifest: ${res.status} ${res.statusText}`)
      }
      const data: Manifest = await res.json()
      dispatch({ type: 'FETCH_SUCCESS', payload: data })
    } catch (err) {
      dispatch({
        type: 'FETCH_ERROR',
        payload: err instanceof Error ? err.message : 'Unknown error loading manifest',
      })
    }
  }, [])

  useEffect(() => {
    void fetchManifest()
  }, [fetchManifest])

  return (
    <ManifestContext.Provider value={{ state, refresh: fetchManifest }}>
      {children}
    </ManifestContext.Provider>
  )
}

/* ---- Hook ---- */
export function useManifest(): ManifestContextValue {
  const ctx = useContext(ManifestContext)
  if (ctx === null) {
    throw new Error('useManifest must be used within a ManifestProvider')
  }
  return ctx
}
