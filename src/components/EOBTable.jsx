function formatCurrency(amount) {
  if (amount === null || amount === undefined) return '—'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount)
}

function formatDate(value) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

export default function EOBTable({ eobs = [], selectedId, onSelect, isLoading = false }) {
  return (
    <div className="eob-table__container">
      <table className="eob-table">
        <thead>
          <tr>
            <th scope="col">Member</th>
            <th scope="col">Plan</th>
            <th scope="col">Date of Service</th>
            <th scope="col">Provider</th>
            <th scope="col" className="eob-table__amount">Amount Owed</th>
          </tr>
        </thead>
        <tbody>
          {isLoading ? (
            <tr>
              <td colSpan={5} className="eob-table__empty">
                Loading EOBs…
              </td>
            </tr>
          ) : eobs.length === 0 ? (
            <tr>
              <td colSpan={5} className="eob-table__empty">
                No EOBs yet. Upload your first Explanation of Benefits above.
              </td>
            </tr>
          ) : (
            eobs.map((eob) => (
              <tr
                key={eob.id}
                className={selectedId === eob.id ? 'eob-table__row--selected' : ''}
                onClick={() => onSelect?.(eob.id)}
              >
                <td>{eob.member || '—'}</td>
                <td>{eob.plan || '—'}</td>
                <td>{formatDate(eob.date)}</td>
                <td>{eob.provider || '—'}</td>
                <td className="eob-table__amount">{formatCurrency(eob.amount_owed)}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
