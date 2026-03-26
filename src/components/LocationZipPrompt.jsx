import { useEffect, useRef } from 'react'
import { useBrowserZip } from '../hooks/useBrowserZip'

/**
 * Small UI component that lets the user share their location
 * so you can infer and store a ZIP code.
 *
 * Props:
 * - onZipDetected(zip: string): optional callback fired when a ZIP is successfully resolved
 */
export default function LocationZipPrompt({ onZipDetected }) {
  const { zip, error, isLoading, requestZip } = useBrowserZip()
  const lastSentRef = useRef(null)

  useEffect(() => {
    if (zip && onZipDetected && lastSentRef.current !== zip) {
      lastSentRef.current = zip
      onZipDetected(zip)
    }
  }, [zip, onZipDetected])

  return (
    <div className="zip-prompt">
      <div className="zip-prompt__content">
        <h3 className="zip-prompt__title">Improve your fair-market comparisons</h3>
        <p className="zip-prompt__subtitle">
          Share your approximate location so we can benchmark your costs against similar services in your area.
        </p>

        <button
          type="button"
          className="btn btn--primary"
          onClick={requestZip}
          disabled={isLoading}
        >
          {isLoading ? 'Detecting location…' : 'Use my location'}
        </button>

        {zip && !error && (
          <p className="zip-prompt__status">
            Detected ZIP: <strong>{zip}</strong>
          </p>
        )}

        {error && (
          <p className="zip-prompt__error">
            {error}
          </p>
        )}
      </div>
    </div>
  )
}

