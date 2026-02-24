import { useEffect, useState } from 'react'
import { fetchEob, summarizeEob } from '../lib/api'

function formatCurrency(amount) {
  if (amount === null || amount === undefined) return '—'
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)
}

function formatDate(value) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
}

export default function EOBDetailModal({ eobId, onClose }) {
  const [eob, setEob] = useState(null)
  const [summary, setSummary] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSummarizing, setIsSummarizing] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!eobId) {
      setEob(null)
      setSummary(null)
      setIsLoading(false)
      return
    }

    let cancelled = false

    async function load() {
      setIsLoading(true)
      setError('')

      try {
        const data = await fetchEob(eobId)
        if (cancelled) return
        setEob(data)

        const stored = data.ai_summary
        if (stored) {
          try {
            const parsed = JSON.parse(stored)
            if (parsed.summary) {
              setSummary(parsed)
              return
            }
          } catch (_) {
            // ai_summary might be legacy plain text
            if (typeof stored === 'string' && stored.length > 0) {
              setSummary({ summary: stored, codeExplanations: [] })
              return
            }
          }
        }

        setIsSummarizing(true)
        const result = await summarizeEob(eobId)
        if (cancelled) return
        setSummary(result)
      } catch (err) {
        if (!cancelled) setError(err.message || 'Failed to load EOB')
      } finally {
        if (!cancelled) {
          setIsLoading(false)
          setIsSummarizing(false)
        }
      }
    }

    load()
    return () => { cancelled = true }
  }, [eobId])

  if (!eobId) return null

  function handleBackdropClick(e) {
    if (e.target === e.currentTarget) onClose?.()
  }

  return (
    <div
      className="modal-backdrop"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className="modal">
        <div className="modal__header">
          <h2 id="modal-title">Claim details</h2>
          <button
            type="button"
            className="modal__close"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="modal__body">
          {error && <p className="modal__error">{error}</p>}

          {isLoading ? (
            <p className="modal__placeholder">Loading…</p>
          ) : eob ? (
            <>
              <div className="modal__meta">
                {eob.claim_number && (
                  <div className="modal__meta-row">
                    <span className="modal__meta-label">Claim #</span>
                    <span>{eob.claim_number}</span>
                  </div>
                )}
                <div className="modal__meta-row">
                  <span className="modal__meta-label">Provider</span>
                  <span>{eob.provider || '—'}</span>
                </div>
                <div className="modal__meta-row">
                  <span className="modal__meta-label">Service date</span>
                  <span>{formatDate(eob.service_date)}</span>
                </div>
                {eob.member && (
                  <div className="modal__meta-row">
                    <span className="modal__meta-label">Member</span>
                    <span>{eob.member}</span>
                  </div>
                )}
                <div className="modal__meta-row">
                  <span className="modal__meta-label">Plan</span>
                  <span>{eob.plan || '—'}</span>
                </div>
                {eob.group_number && (
                  <div className="modal__meta-row">
                    <span className="modal__meta-label">Group #</span>
                    <span>{eob.group_number}</span>
                  </div>
                )}
                {eob.member_id && (
                  <div className="modal__meta-row">
                    <span className="modal__meta-label">Member ID</span>
                    <span>{eob.member_id}</span>
                  </div>
                )}
                {eob.amount_charged != null && (
                  <div className="modal__meta-row">
                    <span className="modal__meta-label">Amount charged</span>
                    <span className="modal__amount">{formatCurrency(eob.amount_charged)}</span>
                  </div>
                )}
                {eob.insurance_paid != null && (
                  <div className="modal__meta-row">
                    <span className="modal__meta-label">Plan paid</span>
                    <span className="modal__amount">{formatCurrency(eob.insurance_paid)}</span>
                  </div>
                )}
                <div className="modal__meta-row">
                  <span className="modal__meta-label">Amount owed</span>
                  <span className="modal__amount">{formatCurrency(eob.amount_owed)}</span>
                </div>
              </div>

              <section className="modal__section">
                <h3>Summary</h3>
                {isSummarizing ? (
                  <p className="modal__placeholder">Generating summary…</p>
                ) : summary?.summary ? (
                  <p className="modal__summary">{summary.summary}</p>
                ) : (
                  <p className="modal__placeholder">No summary available. The document may need OCR or additional processing.</p>
                )}
              </section>

              {summary?.codeExplanations?.length > 0 && (
                <section className="modal__section">
                  <h3>Billing codes</h3>
                  <ul className="modal__code-list">
                    {summary.codeExplanations.map((item, i) => (
                      <li key={i} className="modal__code-item">
                        <span className="modal__code">{item.code}</span>
                        {item.type && <span className="modal__code-type">{item.type}</span>}
                        <span className="modal__code-desc">{item.description}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </>
          ) : null}
        </div>
      </div>
    </div>
  )
}
