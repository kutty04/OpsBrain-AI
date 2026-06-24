const API_BASE = 'http://127.0.0.1:8000/api/v1';

export async function fetchAPI(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  
  const headers = { ...options.headers };
  // Only set Content-Type if we aren't uploading files (FormData handles its own boundaries)
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });
  
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'API request failed');
  }
  return data;
}
