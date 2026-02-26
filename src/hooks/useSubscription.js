import { useState, useEffect } from 'react'
import { useAuth } from '../auth/AuthProvider'
import { fetchSubscription } from '../lib/api'

/**
 * Fetches and caches the current user's subscription status.
 * Returns hasAccess=true when subscription is active or trialing.
 * When Stripe is not configured, hasAccess defaults to true (no paywall).
 */
export function useSubscription() {
  const { isAuthenticated } = useAuth()
  const [status, setStatus] = useState(null)
  const [hasAccess, setHasAccess] = useState(true)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!isAuthenticated) {
      setStatus(null)
      setHasAccess(false)
      setIsLoading(false)
      return
    }

    let cancelled = false

    async function load() {
      setIsLoading(true)
      try {
        const data = await fetchSubscription()
        if (!cancelled) {
          setStatus(data.status)
          setHasAccess(data.hasAccess ?? false)
        }
      } catch (err) {
        // If Stripe/subscription API fails (e.g. not configured), allow access
        if (!cancelled) {
          setStatus(null)
          setHasAccess(true)
        }
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [isAuthenticated])

  return { status, hasAccess, isLoading }
}
