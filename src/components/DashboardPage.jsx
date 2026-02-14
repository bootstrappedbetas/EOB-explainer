import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import UploadZone from './UploadZone'
import EOBTable from './EOBTable'
import EOBDetailModal from './EOBDetailModal'
import { fetchEobs, uploadEob } from '../lib/api'

export default function DashboardPage() {
  const { logout } = useAuth()
  const [isUploading, setIsUploading] = useState(false)
  const [uploadStatus, setUploadStatus] = useState('')
  const [eobs, setEobs] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedEobId, setSelectedEobId] = useState(null)

  useEffect(() => {
    let isMounted = true
    async function loadEobs() {
      try {
        setIsLoading(true)
        const data = await fetchEobs()
        if (isMounted) {
          setEobs(data)
        }
      } catch (err) {
        console.error('Failed to load EOBs', err)
        if (isMounted) setError(err.message || 'Failed to load EOBs')
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }
    loadEobs()
    return () => {
      isMounted = false
    }
  }, [])

  function handleLogout() {
    logout({
      logoutParams: {
        returnTo: window.location.origin,
      },
    })
  }

  async function handleUpload(files) {
    if (!files.length) return

    setIsUploading(true)
    setUploadStatus('')
    setError('')

    try {
      for (const file of files) {
        const formData = new FormData()
        formData.append('file', file)
        setUploadStatus(`Uploading ${file.name}…`)
        const created = await uploadEob(formData)
        setEobs((prev) => [created, ...prev])
        setUploadStatus(created.note || `${file.name} uploaded`)
      }
    } catch (err) {
      console.error('Upload failed', err)
      setError(err.message || 'Upload failed')
    } finally {
      setIsUploading(false)
      setTimeout(() => setUploadStatus(''), 2000)
    }
  }

  return (
    <div className="dashboard">
      <nav className="dashboard__nav">
        <Link to="/" className="dashboard__brand">TrueCost</Link>
        <div className="dashboard__nav-links">
          <button type="button" className="dashboard__nav-link dashboard__nav-link--active">
            Dashboard
          </button>
          <button type="button" className="dashboard__nav-link" onClick={handleLogout}>
            Log out
          </button>
        </div>
      </nav>

      <main className="dashboard__content">
        <header className="dashboard__header">
          <div>
            <h1 className="dashboard__title">Explanation of Benefits</h1>
            <p className="dashboard__subtitle">
              Upload new EOBs or review past claims to understand what you owe.
            </p>
          </div>
        </header>

        <section className="dashboard__upload-card">
          <div className="dashboard__upload-info">
            <h2>Upload a new EOB</h2>
            <p>Drop a PDF or connect to your insurance portal.</p>
          </div>
          <UploadZone
            isUploading={isUploading}
            statusMessage={uploadStatus}
            onFilesSelected={handleUpload}
          />
        </section>

        <section className="dashboard__table-card">
          <div className="dashboard__table-header">
            <div>
              <h2>Recent EOBs</h2>
              <p>Click an item to open the detailed view.</p>
            </div>
            <span className="dashboard__count">
              {eobs.length} {eobs.length === 1 ? 'claim' : 'claims'}
            </span>
          </div>

          {error && <p className="dashboard__error">{error}</p>}

          <EOBTable
            eobs={isLoading ? [] : eobs}
            selectedId={selectedEobId}
            onSelect={(id) => setSelectedEobId(id)}
            isLoading={isLoading}
          />
        </section>
      </main>

      <EOBDetailModal
        eobId={selectedEobId}
        onClose={() => setSelectedEobId(null)}
      />
    </div>
  )
}
