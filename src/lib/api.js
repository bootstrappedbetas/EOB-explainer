const BASE_URL = '/api'

async function handleResponse(response) {
  if (!response.ok) {
    let message = `Request failed with ${response.status}`
    try {
      const data = await response.json()
      if (data?.error) message = data.error
    } catch (_) {
      // ignore
    }
    throw new Error(message)
  }
  return response.json()
}

export async function fetchEobs() {
  const response = await fetch(`${BASE_URL}/eobs`, {
    credentials: 'include',
  })
  return handleResponse(response)
}

export async function uploadEob(formData, signal) {
  const response = await fetch(`${BASE_URL}/eobs`, {
    method: 'POST',
    body: formData,
    credentials: 'include',
    signal,
  })
  return handleResponse(response)
}
