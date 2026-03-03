import { useState, useEffect } from 'react'
import { useAuth } from '../auth/AuthProvider'
import { fetchSubscription } from '../lib/api'

/**
 * Fetches subscription status. Stripe-first flow: user pays before creating account,
 * so subscription is always present when they log in.
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
        if (!cancelled) {
          setStatus(null)
          setHasAccess(!err?.message?.includes('401'))
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
