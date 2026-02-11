/**
 * Auth0 configuration - reads from environment variables
 * Vite exposes env vars prefixed with VITE_ to the client
 */
export const authConfig = {
  domain: import.meta.env.VITE_AUTH0_DOMAIN || '',
  clientId: import.meta.env.VITE_AUTH0_CLIENT_ID || '',
  audience: import.meta.env.VITE_AUTH0_AUDIENCE || undefined,
  organization: import.meta.env.VITE_AUTH0_ORGANIZATION || undefined,
}

export const isAuthConfigured = !!(authConfig.domain && authConfig.clientId)
