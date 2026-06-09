/**
 * API client for Tranquille, on est en vacances
 * Configured to use environment variables for API URL
 */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8787';

async function apiCall(endpoint, options = {}) {
  const url = `${API_URL}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = new Error(`API Error: ${response.status}`);
    error.status = response.status;
    throw error;
  }

  return response.json();
}

export const api = {
  // Settings
  getSettings: () => apiCall('/api/settings'),

  // Articles
  getArticles: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return apiCall(`/api/articles${qs ? '?' + qs : ''}`);
  },
  getArticle: (slugOrId) => apiCall(`/api/articles/${slugOrId}`),
  recordView: (articleId) => apiCall(`/api/articles/${articleId}/view`, { method: 'POST' }),

  // Folders
  getFolders: () => apiCall('/api/folders'),

  // Subscriptions
  subscribePush: (subscription) =>
    apiCall('/api/push/subscribe', {
      method: 'POST',
      body: JSON.stringify(subscription),
    }),

  subscribeEmail: (email) =>
    apiCall('/api/email/subscribe', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),
};

export default api;
