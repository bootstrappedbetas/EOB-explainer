import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import { useSubscription } from '../hooks/useSubscription'

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const { hasAccess, isLoading: subLoading } = useSubscription()
  const location = useLocation()

  if (authLoading || subLoading) {
    return (
      <div className="auth-page">
        <div className="auth-container">
          <div className="auth-card">
            <p className="auth-card__subtitle">Loading...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (!hasAccess) {
    return <Navigate to="/subscribe" state={{ from: location }} replace />
  }

  return children
}
