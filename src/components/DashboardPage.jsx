import { Link } from 'react-router-dom'

export default function DashboardPage() {
  return (
    <div className="auth-page">
      <nav className="auth-nav">
        <Link to="/" className="auth-nav__brand">TrueCost</Link>
        <div className="auth-nav__links">
          <Link to="/dashboard" className="auth-nav__link">Dashboard</Link>
          <Link to="/login" className="auth-nav__link">Log out</Link>
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
