/**
 * Interests Management Script
 * Manages Received and Sent connection requests with real-time status actions.
 */

let currentTab = 'received';

document.addEventListener('DOMContentLoaded', async () => {
  const user = await window.requireAuthPage();
  if (!user) return;

  const tabReceived = document.getElementById('tab-received');
  const tabSent = document.getElementById('tab-sent');

  tabReceived?.addEventListener('click', () => {
    currentTab = 'received';
    tabReceived.classList.add('active');
    tabSent.classList.remove('active');
    loadReceivedInterests();
  });

  tabSent?.addEventListener('click', () => {
    currentTab = 'sent';
    tabSent.classList.add('active');
    tabReceived.classList.remove('active');
    loadSentInterests();
  });

  // Initial load
  loadReceivedInterests();
});

async function loadReceivedInterests() {
  const container = document.getElementById('interests-list');
  if (!container) return;

  container.innerHTML = '<div style="text-align: center; padding: 3rem;"><span class="loading-spinner" style="border-color: var(--primary-600); border-top-color: transparent;"></span></div>';

  try {
    const res = await window.api.interests.getReceived();
    const list = res.interests || [];

    if (list.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">📬</div>
          <h3>No incoming interest requests</h3>
          <p>When other roommates view your profile and want to connect, their requests will appear here.</p>
          <a href="/find-roommates.html" class="btn btn-primary btn-sm">Explore Roommates</a>
        </div>
      `;
      return;
    }

    container.innerHTML = list.map(item => `
      <div class="card" style="margin-bottom: 1.25rem;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 1rem; margin-bottom: 1rem;">
          <div>
            <h3 style="font-size: 1.2rem; margin-bottom: 0.25rem;">${escapeHtml(item.sender_name)}</h3>
            <p style="font-size: 0.85rem; color: var(--slate-500);">
              📍 ${escapeHtml(item.city || 'City')} • Budget: ₹${Math.round(item.min_budget || 0)} - ₹${Math.round(item.max_budget || 0)}/mo
            </p>
          </div>
          <span class="badge badge-status ${item.status}">
            Status: ${item.status.toUpperCase()}
          </span>
        </div>

        ${item.message ? `
          <div style="background: var(--slate-50); border-radius: var(--radius-md); padding: 0.85rem 1rem; margin-bottom: 1.25rem; font-size: 0.9rem; color: var(--slate-700);">
            💬 "${escapeHtml(item.message)}"
          </div>
        ` : ''}

        <div style="display: flex; gap: 0.75rem; align-items: center; justify-content: flex-end; flex-wrap: wrap;">
          <a href="/roommate-details.html?id=${item.sender_user_id}" class="btn btn-secondary btn-sm">View Profile</a>

          ${item.status === 'pending' ? `
            <button onclick="updateInterest(${item.id}, 'rejected')" class="btn btn-outline btn-sm" style="color: var(--danger-600); border-color: var(--danger-600);">Decline</button>
            <button onclick="updateInterest(${item.id}, 'accepted')" class="btn btn-primary btn-sm">Accept Connection</button>
          ` : ''}

          ${item.status === 'accepted' ? `
            <span style="font-size: 0.85rem; color: var(--success-600); font-weight: 600;">
              ✓ Connected! Email: ${escapeHtml(item.sender_email || 'Contact on file')}
            </span>
          ` : ''}
        </div>
      </div>
    `).join('');

  } catch (err) {
    container.innerHTML = `<div class="alert alert-danger">Error: ${err.message}</div>`;
  }
}

async function loadSentInterests() {
  const container = document.getElementById('interests-list');
  if (!container) return;

  container.innerHTML = '<div style="text-align: center; padding: 3rem;"><span class="loading-spinner" style="border-color: var(--primary-600); border-top-color: transparent;"></span></div>';

  try {
    const res = await window.api.interests.getSent();
    const list = res.interests || [];

    if (list.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">📤</div>
          <h3>No outgoing interest requests</h3>
          <p>You haven't reached out to any roommates yet. Discover profiles and express interest to get started.</p>
          <a href="/find-roommates.html" class="btn btn-primary btn-sm">Find Roommates</a>
        </div>
      `;
      return;
    }

    container.innerHTML = list.map(item => `
      <div class="card" style="margin-bottom: 1.25rem;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 1rem; margin-bottom: 1rem;">
          <div>
            <h3 style="font-size: 1.2rem; margin-bottom: 0.25rem;">${escapeHtml(item.receiver_name)}</h3>
            <p style="font-size: 0.85rem; color: var(--slate-500);">
              📍 ${escapeHtml(item.city || 'City')} • Sent on ${new Date(item.created_at).toLocaleDateString()}
            </p>
          </div>
          <span class="badge badge-status ${item.status}">
            Status: ${item.status.toUpperCase()}
          </span>
        </div>

        ${item.message ? `
          <div style="background: var(--slate-50); border-radius: var(--radius-md); padding: 0.85rem 1rem; margin-bottom: 1.25rem; font-size: 0.9rem; color: var(--slate-700);">
            💬 You wrote: "${escapeHtml(item.message)}"
          </div>
        ` : ''}

        <div style="display: flex; gap: 0.75rem; align-items: center; justify-content: flex-end; flex-wrap: wrap;">
          <a href="/roommate-details.html?id=${item.receiver_user_id}" class="btn btn-secondary btn-sm">View Profile</a>

          ${item.status === 'pending' ? `
            <button onclick="updateInterest(${item.id}, 'withdrawn')" class="btn btn-outline btn-sm">Withdraw Request</button>
          ` : ''}
        </div>
      </div>
    `).join('');

  } catch (err) {
    container.innerHTML = `<div class="alert alert-danger">Error: ${err.message}</div>`;
  }
}

async function updateInterest(id, status) {
  try {
    await window.api.interests.updateStatus(id, status);
    if (currentTab === 'received') {
      loadReceivedInterests();
    } else {
      loadSentInterests();
    }
  } catch (err) {
    alert(err.message || 'Action failed.');
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

window.updateInterest = updateInterest;
