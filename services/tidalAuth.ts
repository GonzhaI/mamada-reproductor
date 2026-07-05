import * as AuthSession from 'expo-auth-session'
import * as SecureStore from 'expo-secure-store'

/**
 * Endpoints del TIDAL Developer Platform (OAuth 2.1 + PKCE, flujo Authorization Code).
 *
 * IMPORTANTE: no pude verificar estos paths contra la documentación en vivo de
 * developer.tidal.com (el portal es una SPA que no expone contenido a fetch
 * automatizado, y login.tidal.com está detrás de bot-protection). Estos valores
 * vienen de PLAN.md y de la spec pública del TIDAL SDK oficial (github.com/tidal-music/tidal-sdk).
 * Confirmá el path exacto en el dashboard de tu app antes del primer login real;
 * si falla, es cuestión de ajustar `discovery` acá.
 */
export const discovery: AuthSession.DiscoveryDocument = {
  authorizationEndpoint: 'https://login.tidal.com/oauth2/authorize',
  tokenEndpoint: 'https://auth.tidal.com/v1/oauth2/token',
}

export const CLIENT_ID = process.env.EXPO_PUBLIC_TIDAL_CLIENT_ID ?? ''

// client_secret NO se usa acá a propósito: el flujo Authorization Code + PKCE es para
// clientes públicos/nativos y no requiere secreto (solo el grant client_credentials lo pide,
// y ese es server-to-server). Nunca empaquetar el client_secret en el bundle de la app.

// Ajustar según los scopes habilitados en el dashboard de developer.tidal.com para esta app.
export const SCOPES = ['user.read', 'playlists.read', 'collection.read']

export const redirectUri = AuthSession.makeRedirectUri({
  scheme: 'reproductor',
  path: 'auth/callback',
})

const ACCESS_TOKEN_KEY = 'tidal_access_token'
const REFRESH_TOKEN_KEY = 'tidal_refresh_token'
const EXPIRES_AT_KEY = 'tidal_expires_at'

export interface TidalTokens {
  accessToken: string
  refreshToken: string | null
  expiresAt: number
}

function toTidalTokens(response: AuthSession.TokenResponse): TidalTokens {
  const issuedAtMs = response.issuedAt * 1000
  const expiresInMs = (response.expiresIn ?? 0) * 1000
  return {
    accessToken: response.accessToken,
    refreshToken: response.refreshToken ?? null,
    expiresAt: issuedAtMs + expiresInMs,
  }
}

async function persistTokens(tokens: TidalTokens): Promise<void> {
  const writes = [
    SecureStore.setItemAsync(ACCESS_TOKEN_KEY, tokens.accessToken),
    SecureStore.setItemAsync(EXPIRES_AT_KEY, String(tokens.expiresAt)),
  ]
  if (tokens.refreshToken) {
    writes.push(SecureStore.setItemAsync(REFRESH_TOKEN_KEY, tokens.refreshToken))
  }
  await Promise.all(writes)
}

export async function exchangeCode(code: string, codeVerifier: string): Promise<TidalTokens> {
  const response = await AuthSession.exchangeCodeAsync(
    {
      clientId: CLIENT_ID,
      code,
      redirectUri,
      extraParams: { code_verifier: codeVerifier },
    },
    discovery
  )
  const tokens = toTidalTokens(response)
  await persistTokens(tokens)
  return tokens
}

export async function refreshTokens(refreshToken: string): Promise<TidalTokens> {
  const response = await AuthSession.refreshAsync({ clientId: CLIENT_ID, refreshToken }, discovery)
  const tokens = toTidalTokens(response)
  await persistTokens(tokens)
  return tokens
}

export async function loadStoredTokens(): Promise<TidalTokens | null> {
  const [accessToken, refreshToken, expiresAtRaw] = await Promise.all([
    SecureStore.getItemAsync(ACCESS_TOKEN_KEY),
    SecureStore.getItemAsync(REFRESH_TOKEN_KEY),
    SecureStore.getItemAsync(EXPIRES_AT_KEY),
  ])
  if (!accessToken || !expiresAtRaw) return null
  return { accessToken, refreshToken, expiresAt: Number(expiresAtRaw) }
}

export async function clearTokens(): Promise<void> {
  await Promise.all([
    SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY),
    SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY),
    SecureStore.deleteItemAsync(EXPIRES_AT_KEY),
  ])
}
