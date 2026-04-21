/*
=============================================================================
COMPONENT:    AuthContext
FILE:         src/context/AuthContext.tsx
VERSION:      1.0.0
AUTHOR:       McManus / AIB Contact Center Portal Team
LAST UPDATED: 2026-04-21
ENVIRONMENT:  React / Vite / Azure Static Web Apps

------------------------------------------------------------------------------
OVERVIEW
------------------------------------------------------------------------------
React Context that fetches the Azure Static Web Apps built-in auth endpoint
/.auth/me on mount to determine the current user and their roles. Exposes
isContentManager derived from the roles array.

------------------------------------------------------------------------------
ARCHITECTURE
------------------------------------------------------------------------------
- Data Source:     GET /.auth/me (SWA built-in auth — zero custom auth code)
- Auth Model:      Microsoft Entra ID via SWA built-in auth
- Rendering:       Provider wraps App root; consumers use useAuth()

------------------------------------------------------------------------------
FEATURES
------------------------------------------------------------------------------
- Types:              User (userDetails, roles)
- State:              user, loading
- fetch on mount:     GET /.auth/me
- isContentManager:   roles includes 'content-manager'

------------------------------------------------------------------------------
SECURITY MODEL
------------------------------------------------------------------------------
- Auth Scope:     SWA-managed; no tokens stored client-side
- Data Exposure:  Only userDetails (UPN) and roles exposed to UI

------------------------------------------------------------------------------
NON-NEGOTIABLES
------------------------------------------------------------------------------
- useAuth() throws if called outside AuthProvider
- Do NOT poll /.auth/me — fetch once on mount only
=============================================================================
*/

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'

/* ---- Types ---- */
export interface User {
  userDetails: string
  roles: string[]
}

interface AuthState {
  user: User | null
  loading: boolean
}

interface AuthContextValue extends AuthState {
  isContentManager: boolean
}

/* ---- SWA /.auth/me response shape ---- */
interface SwaAuthResponse {
  clientPrincipal: {
    userDetails: string
    userRoles: string[]
  } | null
}

/* ---- Context ---- */
const AuthContext = createContext<AuthContextValue | null>(null)

/* ---- Provider ---- */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ user: null, loading: true })

  useEffect(() => {
    fetch('/.auth/me')
      .then((res) => {
        if (!res.ok) return null
        return res.json() as Promise<SwaAuthResponse>
      })
      .then((data) => {
        if (data?.clientPrincipal) {
          setState({
            user: {
              userDetails: data.clientPrincipal.userDetails,
              roles: data.clientPrincipal.userRoles,
            },
            loading: false,
          })
        } else {
          setState({ user: null, loading: false })
        }
      })
      .catch(() => {
        setState({ user: null, loading: false })
      })
  }, [])

  const isContentManager = state.user?.roles.includes('content-manager') ?? false

  return (
    <AuthContext.Provider value={{ ...state, isContentManager }}>
      {children}
    </AuthContext.Provider>
  )
}

/* ---- Hook ---- */
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (ctx === null) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return ctx
}
