// Authentication utilities
export interface User {
  id: string
  email: string
  name: string
  role: string
}

export interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
}

export const getStoredAuth = (): AuthState => {
  if (typeof window === 'undefined') {
    return { user: null, isAuthenticated: false, isLoading: false }
  }

  try {
    const stored = localStorage.getItem('auth')
    return stored ? JSON.parse(stored) : { user: null, isAuthenticated: false, isLoading: false }
  } catch {
    return { user: null, isAuthenticated: false, isLoading: false }
  }
}

export const setStoredAuth = (auth: AuthState): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('auth', JSON.stringify(auth))
  }
}

export const clearStoredAuth = (): void => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('auth')
  }
}
