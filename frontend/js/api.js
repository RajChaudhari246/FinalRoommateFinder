/**
 * Roommate Finder - Central API Client & Utilities
 * Handles all HTTP communication with the Express backend using Fetch API.
 */

const API_BASE = '/api';

async function request(endpoint, options = {}) {
  const config = {
    method: options.method || 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    },
    credentials: 'same-origin',
    ...options
  };

  if (options.body && typeof options.body === 'object') {
    config.body = JSON.stringify(options.body);
  }

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, config);
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const error = new Error(data.message || `Request failed with status ${response.status}`);
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  } catch (error) {
    console.error(`[API Error] ${endpoint}:`, error.message);
    throw error;
  }
}

// Global alert display helper
function showAlert(message, type = 'danger', containerId = 'alert-container') {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = `
    <div class="alert alert-${type}">
      <span>${message}</span>
    </div>
  `;
  container.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function clearAlert(containerId = 'alert-container') {
  const container = document.getElementById(containerId);
  if (container) {
    container.innerHTML = '';
  }
}

const api = {
  auth: {
    register: (data) => request('/auth/register', { method: 'POST', body: data }),
    login: (data) => request('/auth/login', { method: 'POST', body: data }),
    logout: () => request('/auth/logout', { method: 'POST' }),
    me: () => request('/auth/me')
  },
  profile: {
    getMe: () => request('/profile/me'),
    updateMe: (data) => request('/profile/me', { method: 'PUT', body: data }),
    getPublic: (id) => request(`/profiles/${id}`)
  },
  preferences: {
    getMe: () => request('/preferences/me'),
    updateMe: (data) => request('/preferences/me', { method: 'PUT', body: data })
  },
  roommates: {
    search: (params = {}) => {
      const query = new URLSearchParams(
        Object.entries(params).filter(([_, v]) => v !== undefined && v !== null && v !== '')
      ).toString();
      return request(`/roommates${query ? `?${query}` : ''}`);
    },
    getCompatibility: (id) => request(`/roommates/${id}/compatibility`)
  },
  interests: {
    send: (data) => request('/interests', { method: 'POST', body: data }),
    getReceived: () => request('/interests/received'),
    getSent: () => request('/interests/sent'),
    updateStatus: (id, status) => request(`/interests/${id}`, { method: 'PATCH', body: { status } })
  },
  settings: {
    getAccount: () => request('/settings/account'),
    changePassword: (data) => request('/settings/password', { method: 'PUT', body: data }),
    deactivate: (data) => request('/settings/deactivate', { method: 'POST', body: data })
  },
  admin: {
    getMetrics: () => request('/admin/metrics'),
    getUsers: (params = {}) => {
      const query = new URLSearchParams(
        Object.entries(params).filter(([_, v]) => v !== undefined && v !== null && v !== '')
      ).toString();
      return request(`/admin/users${query ? `?${query}` : ''}`);
    },
    getUserDetails: (id) => request(`/admin/users/${id}`),
    updateUserStatus: (id, status) => request(`/admin/users/${id}/status`, { method: 'PATCH', body: { status } }),
    updateUserRole: (id, role) => request(`/admin/users/${id}/role`, { method: 'PATCH', body: { role } }),
    deleteUser: (id) => request(`/admin/users/${id}`, { method: 'DELETE' }),
    getActivity: () => request('/admin/activity'),
    getProfile: () => request('/admin/profile')
  }
};

window.api = api;
window.showAlert = showAlert;
window.clearAlert = clearAlert;
