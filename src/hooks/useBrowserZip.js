import { useState, useCallback } from 'react'

/**
 * Attempts to infer the user's ZIP code using the browser Geolocation API
 * and a public reverse-geocoding service.
 *
 * NOTE: This runs entirely in the browser. For production, consider routing
 * reverse-geocoding through your backend and adding proper rate limiting.
 */
export function useBrowserZip() {
  const [zip, setZip] = useState(null)
  const [error, setError] = useState(null)
  const [isLoading, setIsLoading] = useState(false)

  const requestZip = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser.')
      return
    }

    setIsLoading(true)
    setError(null)

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords
          const url = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${encodeURIComponent(
            latitude
          )}&longitude=${encodeURIComponent(longitude)}&localityLanguage=en`

          const res = await fetch(url)
          if (!res.ok) {
            throw new Error(`Reverse geocoding failed with status ${res.status}`)
          }
          const data = await res.json()
          const postalCode =
            data.postcode ||
            data.postalCode ||
            data.localityInfo?.administrative?.find((x) => x.order === 5)?.name ||
            null

          if (!postalCode) {
            setError('Could not determine ZIP code from location.')
          } else {
            setZip(postalCode)
          }
        } catch (err) {
          setError(err.message || 'Failed to resolve ZIP code from location.')
        } finally {
          setIsLoading(false)
        }
      },
      (geoErr) => {
        setIsLoading(false)
        if (geoErr.code === geoErr.PERMISSION_DENIED) {
          setError('Location permission denied.')
        } else {
          setError('Unable to access location.')
        }
      }
    )
  }, [])

  return { zip, error, isLoading, requestZip }
}

