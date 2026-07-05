import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import * as AuthSession from 'expo-auth-session'
import * as WebBrowser from 'expo-web-browser'
import {
  CLIENT_ID,
  SCOPES,
  discovery,
  redirectUri,
  clearTokens,
  exchangeCode,
  loadStoredTokens,
  refreshTokens,
  type TidalTokens,
} from '@/services/tidalAuth'
import { setOnSessionExpired } from '@/services/tidalApi'

WebBrowser.maybeCompleteAuthSession()

// Margen de seguridad: refrescar el token un poco antes de que expire de verdad.
const EXPIRY_SAFETY_MARGIN_MS = 60_000

type AuthStatus = 'loading' | 'signedOut' | 'signedIn'

interface AuthContextValue {
  status: AuthStatus
  accessToken: string | null
  isGuest: boolean
  login: () => Promise<void>
  skipLogin: () => Promise<void>
  logout: () => Promise<void>
}

const GUEST_FLAG_KEY = 'tidal_guest_mode'

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('loading')
  const [tokens, setTokens] = useState<TidalTokens | null>(null)
  const [isGuest, setIsGuest] = useState(false)

  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: CLIENT_ID,
      scopes: SCOPES,
      redirectUri,
      responseType: AuthSession.ResponseType.Code,
      usePKCE: true,
    },
    discovery
  )

  // Al montar, intenta recuperar la sesión guardada (y refrescarla si ya venció).
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const guestFlag = await SecureStore.getItemAsync(GUEST_FLAG_KEY)
      if (guestFlag === 'true') {
        if (!cancelled) {
          setIsGuest(true)
          setStatus('signedIn')
        }
        return
      }

      const stored = await loadStoredTokens()
      if (!stored) {
        if (!cancelled) setStatus('signedOut')
        return
      }
      const isExpired = Date.now() >= stored.expiresAt - EXPIRY_SAFETY_MARGIN_MS
      if (!isExpired) {
        if (!cancelled) {
          setTokens(stored)
          setStatus('signedIn')
        }
        return
      }
      if (!stored.refreshToken) {
        await clearTokens()
        if (!cancelled) setStatus('signedOut')
        return
      }
      try {
        const refreshed = await refreshTokens(stored.refreshToken)
        if (!cancelled) {
          setTokens(refreshed)
          setStatus('signedIn')
        }
      } catch {
        await clearTokens()
        if (!cancelled) setStatus('signedOut')
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  // Cuando promptAsync() resuelve con éxito, intercambia el code por tokens.
  useEffect(() => {
    if (response?.type !== 'success' || !request?.codeVerifier) return
    ;(async () => {
      const fresh = await exchangeCode(response.params.code, request.codeVerifier!)
      setTokens(fresh)
      setStatus('signedIn')
    })()
  }, [response, request])

  const login = useCallback(async () => {
    await promptAsync()
  }, [promptAsync])

  const skipLogin = useCallback(async () => {
    await SecureStore.setItemAsync(GUEST_FLAG_KEY, 'true')
    setIsGuest(true)
    setTokens(null)
    setStatus('signedIn')
  }, [])

  const logout = useCallback(async () => {
    await clearTokens()
    await SecureStore.deleteItemAsync(GUEST_FLAG_KEY)
    setTokens(null)
    setIsGuest(false)
    setStatus('signedOut')
  }, [])

  // Si tidalApi.ts no logra refrescar un 401 (refresh token vencido/revocado),
  // fuerza el mismo logout que dispararía el usuario manualmente.
  useEffect(() => {
    setOnSessionExpired(() => {
      if (!isGuest) void logout()
    })
    return () => setOnSessionExpired(null)
  }, [logout, isGuest])

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      accessToken: tokens?.accessToken ?? null,
      isGuest,
      login,
      skipLogin,
      logout,
    }),
    [status, tokens, login, skipLogin, logout, isGuest]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>')
  return ctx
}
