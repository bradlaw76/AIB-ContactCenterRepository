import { ReactNode } from 'react'

export function ManifestProvider({ children }: { children: ReactNode }) {
  return <>{children}</>
}

export function useManifest() {
  return { state: { manifest: null, loading: false, error: null }, refresh: () => {} }
}
