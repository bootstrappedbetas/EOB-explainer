import { Auth0Provider, useAuth0 } from '@auth0/auth0-react'
import { createContext, useContext } from 'react'
import { authConfig } from './config'

const AuthContext = createContext(null)

function Auth0Wrapper({ children }) {
  const auth = useAuth0()
  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>
}

function FallbackProvider({ children }) {
  const value = {
    isAuthenticated: false,
    isLoading: false,
    user: null,
    loginWithRedirect: () => {
      alert(
        'Auth0 not configured. Add VITE_AUTH0_DOMAIN and VITE_AUTH0_CLIENT_ID to .env (see AUTH0_SETUP.md)'
      )
    },
    logout: () => {},
  }
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function AuthProvider({ children }) {
  if (authConfig.domain && authConfig.clientId) {
    return (
      <Auth0Provider
        domain={authConfig.domain}
        clientId={authConfig.clientId}
        authorizationParams={{
          redirect_uri: window.location.origin,
          audience: authConfig.audience,
          organization: authConfig.organization,
        }}
        onRedirectCallback={(appState) => {
          window.location.assign(appState?.returnTo || `${window.location.origin}/dashboard`)
        }}
      >
        <Auth0Wrapper>{children}</Auth0Wrapper>
      </Auth0Provider>
    )
  }
  return <FallbackProvider>{children}</FallbackProvider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return ctx
}
