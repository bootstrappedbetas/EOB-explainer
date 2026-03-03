import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import { createCheckoutSession } from '../lib/api'

export default function SubscribePage() {
  const { isAuthenticated } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubscribe() {
    if (!isAuthenticated) {
      return
    }
    setIsLoading(true)
    setError('')
    try {
      const { url } = await createCheckoutSession()
      if (url) {
        window.location.href = url
      } else {
        setError('Failed to create checkout session.')
      }
    } catch (err) {
      setError(err.message || 'Failed to start checkout')
    } finally {
      setIsLoading(false)
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="auth-page">
        <nav className="auth-nav">
          <Link to="/" className="auth-nav__brand">TrueCost</Link>
        </nav>
        <div className="auth-container">
          <div className="auth-card">
            <h1 className="auth-card__title">Sign in to subscribe</h1>
            <p className="auth-card__subtitle">
              Create an account or sign in to subscribe and upload EOBs.
            </p>
            <Link to="/register" state={{ from: { pathname: '/subscribe' } }} className="btn btn--primary" style={{ display: 'inline-block', marginTop: '1rem' }}>
              Create account
            </Link>
            <p className="auth-card__footer" style={{ marginTop: '1rem' }}>
              <Link to="/login" state={{ from: { pathname: '/subscribe' } }} className="auth-card__link">Already have an account? Sign in</Link>
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-page">
      <nav className="auth-nav">
        <Link to="/" className="auth-nav__brand">TrueCost</Link>
      </nav>
      <div className="auth-container">
        <div className="auth-card subscribe-card">
          <h1 className="auth-card__title">Subscribe to TrueCost</h1>
          <p className="auth-card__subtitle">
            Subscribe to upload EOBs and get AI summaries, cost breakdowns, and benchmarks.
          </p>

          <div className="subscribe-pricing">
            <span className="subscribe-price">$10</span>
            <span className="subscribe-period">/month</span>
          </div>

          <ul className="subscribe-features">
            <li>Upload and parse EOB documents</li>
            <li>AI-powered plain-language summaries</li>
            <li>Cost waterfall and benchmark comparison</li>
            <li>Billing code explanations</li>
            <li>Cancel anytime</li>
          </ul>

          {error && <p className="auth-form__error">{error}</p>}

          <button
            type="button"
            className="btn btn--primary subscribe-btn"
            onClick={handleSubscribe}
            disabled={isLoading}
          >
            {isLoading ? 'Loading…' : 'Subscribe with Stripe'}
          </button>

          <p className="subscribe-footer">
            Secure payment powered by Stripe. Your payment information is never stored on our servers.
          </p>
        </div>
      </div>
    </div>
  )
}
