import { ReactNode } from 'react'

export function ToastProvider({ children }: { children: ReactNode }) {
  return <>{children}</>
}

export function useToast() {
  return { addToast: (_message: string) => {} }
}
