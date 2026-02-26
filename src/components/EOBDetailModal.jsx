import { useEffect, useState } from 'react'
import { VictoryBar, VictoryChart, VictoryAxis, VictoryTheme } from 'victory'
import { fetchEob, fetchBenchmarks, summarizeEob } from '../lib/api'

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
  const [benchmarks, setBenchmarks] = useState(null)
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
  }, [eobId])

  // Fetch benchmarks when we have eob with procedure_code
  useEffect(() => {
    if (!eob?.procedure_code) {
      setBenchmarks(null)
      return
    }

    let cancelled = false

    async function loadBenchmarks() {
      try {
        const data = await fetchBenchmarks(eob.procedure_code)
        if (!cancelled) setBenchmarks(data)
      } catch (err) {
        if (!cancelled) setBenchmarks(null)
      }
    }

    loadBenchmarks()
    return () => { cancelled = true }
  }, [eob?.procedure_code])

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

              {/* Cost breakdown bar chart */}
              {(eob.amount_charged != null || eob.insurance_paid != null || eob.amount_owed != null) && (
                <section className="modal__section modal__charts">
                  <h3>Cost breakdown</h3>
                  <div className="modal__chart-container">
                    <VictoryChart
                      domainPadding={{ x: 24, y: 20 }}
                      height={180}
                      padding={{ top: 12, bottom: 36, left: 56, right: 24 }}
                      theme={VictoryTheme.material}
                    >
                      <VictoryAxis
                        tickFormat={['Amount charged', 'Plan paid', 'Amount owed']}
                        style={{ tickLabels: { fontSize: 10, fontFamily: 'inherit' } }}
                      />
                      <VictoryAxis
                        dependentAxis
                        tickFormat={(v) => `$${v}`}
                        style={{ tickLabels: { fontSize: 10, fontFamily: 'inherit' } }}
                      />
                      <VictoryBar
                        barWidth={28}
                        data={[
                          { x: 1, y: Number(eob.amount_charged) || 0, fill: '#0d9488' },
                          { x: 2, y: Number(eob.insurance_paid) || 0, fill: '#64748b' },
                          { x: 3, y: Number(eob.amount_owed) ?? 0, fill: '#d97706' },
                        ]}
                        style={{ data: { fill: ({ datum }) => datum.fill } }}
                      />
                    </VictoryChart>
                  </div>
                </section>
              )}

              <hr className="modal__separator" aria-hidden="true" />

              {/* Benchmark comparison */}
              <section className="modal__section modal__charts">
                <h3>Benchmark comparison</h3>
                <p className="modal__benchmark-note">
                  Compare your amount owed to users&apos; average{benchmarks?.marketAverageOwed == null && benchmarks?.marketSource == null && ' (market data coming soon)'}
                </p>
                <div className="modal__chart-container">
                  <VictoryChart
                    domainPadding={{ x: 20, y: 12 }}
                    height={140}
                    padding={{ top: 12, bottom: 36, left: 56, right: 24 }}
                    theme={VictoryTheme.material}
                  >
                    <VictoryAxis
                      tickFormat={['Your amount', "Users' avg", 'Market avg']}
                      style={{ tickLabels: { fontSize: 10, fontFamily: 'inherit' } }}
                    />
                    <VictoryAxis
                      dependentAxis
                      tickFormat={(v) => `$${v}`}
                      style={{ tickLabels: { fontSize: 10, fontFamily: 'inherit' } }}
                    />
                    <VictoryBar
                      barWidth={24}
                      data={[
                        { x: 1, y: Number(eob.amount_owed) ?? 0, fill: '#0d9488' },
                        { x: 2, y: benchmarks?.usersAverageOwed ?? 0, fill: '#64748b' },
                        { x: 3, y: benchmarks?.marketAverageOwed ?? 0, fill: benchmarks?.marketAverageOwed != null ? '#7c3aed' : '#cbd5e1' },
                      ]}
                      style={{ data: { fill: ({ datum }) => datum.fill } }}
                    />
                  </VictoryChart>
                </div>
              </section>

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
