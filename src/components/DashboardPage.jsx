import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'

export default function DashboardPage() {
  const { logout } = useAuth()

  function handleLogout() {
    logout({
      logoutParams: {
        returnTo: window.location.origin,
      },
    })
  }

  return (
    <div className="auth-page">
      <nav className="auth-nav">
        <Link to="/" className="auth-nav__brand">TrueCost</Link>
        <div className="auth-nav__links">
          <Link to="/dashboard" className="auth-nav__link">Dashboard</Link>
          <button
            type="button"
            onClick={handleLogout}
            className="auth-nav__link auth-nav__logout"
          >
            Log out
          </button>
        </div>
      </nav>

      <div className="auth-container">
        <div className="auth-card dashboard-placeholder">
          <h1 className="auth-card__title">Dashboard</h1>
          <p className="auth-card__subtitle">
            Your EOB dashboard is coming soon. Upload and track your Explanation of Benefits here.
          </p>
          <Link to="/" className="btn btn-primary">
            Back to home
          </Link>
        </div>
      </div>
    </div>
  )
}
