const BASE_URL = '/api'

let getToken = null

/** Call once at app init (e.g. from Auth0Wrapper) to wire Auth0 tokens into API calls */
export function configureApi(tokenGetter) {
  getToken = tokenGetter
}

async function getAuthHeaders() {
  if (!getToken) return {}
  try {
    const token = await getToken()
    return token ? { Authorization: `Bearer ${token}` } : {}
  } catch {
    return {}
  }
}

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
  const headers = await getAuthHeaders()
  const response = await fetch(`${BASE_URL}/eobs`, {
    credentials: 'include',
    headers,
  })
  return handleResponse(response)
}

export async function uploadEob(formData, signal) {
  const headers = await getAuthHeaders()
  const response = await fetch(`${BASE_URL}/eobs`, {
    method: 'POST',
    body: formData,
    credentials: 'include',
    headers,
    signal,
  })
  return handleResponse(response)
}

export async function fetchEob(id) {
  const headers = await getAuthHeaders()
  const response = await fetch(`${BASE_URL}/eobs/${id}`, {
    credentials: 'include',
    headers,
  })
  return handleResponse(response)
}

export async function fetchUserProfile() {
  const headers = await getAuthHeaders()
  const response = await fetch(`${BASE_URL}/users/me`, {
    credentials: 'include',
    headers,
  })
  return handleResponse(response)
}

export async function updateUserZip(zip) {
  const headers = await getAuthHeaders()
  const response = await fetch(`${BASE_URL}/users/zip`, {
    method: 'PATCH',
    credentials: 'include',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({ zip }),
  })
  return handleResponse(response)
}

export async function fetchBenchmarks(procedureCode, zip = null) {
  const headers = await getAuthHeaders()
  const params = new URLSearchParams({
    procedure_code: procedureCode,
  })
  if (zip) {
    params.set('zip', zip)
  }
  const response = await fetch(`${BASE_URL}/eobs/benchmarks?${params.toString()}`, {
    credentials: 'include',
    headers,
  })
  return handleResponse(response)
}

export async function createCheckoutSession() {
  const headers = await getAuthHeaders()
  const response = await fetch(`${BASE_URL}/stripe/create-checkout-session`, {
    method: 'POST',
    credentials: 'include',
    headers: { ...headers, 'Content-Type': 'application/json' },
  })
  return handleResponse(response)
}

export async function fetchSubscription() {
  const headers = await getAuthHeaders()
  const response = await fetch(`${BASE_URL}/stripe/subscription`, {
    credentials: 'include',
    headers,
  })
  return handleResponse(response)
}

export async function summarizeEob(id) {
  const headers = await getAuthHeaders()
  const response = await fetch(`${BASE_URL}/eobs/${id}/summarize`, {
    method: 'POST',
    credentials: 'include',
    headers,
  })
  return handleResponse(response)
}
