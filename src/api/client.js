const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000';

function buildUrl(path) {
  return `${API_BASE}${path}`;
}

export async function apiRequest(path, options = {}) {
  const { method = 'GET', body, token, headers = {} } = options;
  const requestHeaders = {
    'Content-Type': 'application/json',
    ...headers,
  };

  if (token) {
    requestHeaders.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(buildUrl(path), {
    method,
    headers: requestHeaders,
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    const error = data || { detail: response.statusText };
    throw error;
  }

  return data;
}
