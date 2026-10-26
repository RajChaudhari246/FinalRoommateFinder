/**
 * Roommate Discovery Script
 * Handles live multi-filter searching, profile rendering, pagination, and interest modals.
 */

let currentPage = 1;
let currentFilters = {};
let selectedRoommate = null;

document.addEventListener('DOMContentLoaded', async () => {
  // Check auth but allow browsing even if guest (features show guest prompts if not logged in)
  await checkAuthState();

  // Setup Filter Form Listeners
  const filterForm = document.getElementById('filter-form');
  const resetBtn = document.getElementById('reset-filters-btn');

  filterForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    applyFilters();
  });

  resetBtn?.addEventListener('click', () => {
    filterForm.reset();
    currentFilters = {};
    currentPage = 1;
    loadRoommates();
  });

  // Setup Modal Listeners
  setupInterestModal();

  // Initial Load
  loadRoommates();
});

function applyFilters() {
  currentFilters = {
    location: document.getElementById('filter-location')?.value.trim() || '',
    minBudget: document.getElementById('filter-min-budget')?.value || '',
    maxBudget: document.getElementById('filter-max-budget')?.value || '',
    food: document.getElementById('filter-food')?.value || '',
    smoking: document.getElementById('filter-smoking')?.value || '',
    study: document.getElementById('filter-study')?.value || '',
    sleeping: document.getElementById('filter-sleeping')?.value || '',
    cleanliness: document.getElementById('filter-cleanliness')?.value || '',
    roommateCount: document.getElementById('filter-roommates')?.value || ''
  };
  currentPage = 1;
  loadRoommates();
}

async function loadRoommates() {
  const container = document.getElementById('roommates-list');
  const countEl = document.getElementById('results-count');
  const paginationEl = document.getElementById('pagination-bar');

  if (!container) return;

  container.innerHTML = `
    <div style="grid-column: 1 / -1; text-align: center; padding: 4rem 1rem;">
      <div class="loading-spinner" style="width: 2rem; height: 2rem; border-color: var(--primary-600); border-top-color: transparent;"></div>
      <p style="margin-top: 1rem; color: var(--slate-500);">Searching compatible roommates...</p>
    </div>
  `;

  try {
    const res = await window.api.roommates.search({
      ...currentFilters,
      page: currentPage,
      limit: 9
    });

    const roommates = res.roommates || [];
    if (countEl) countEl.textContent = `${res.count} profiles found`;

    if (roommates.length === 0) {
      container.innerHTML = `
        <div class="empty-state" style="grid-column: 1 / -1;">
          <div class="empty-state-icon">🔍</div>
          <h3>No matching roommates found</h3>
          <p>Try broadening your budget range, clearing specific lifestyle filters, or searching a nearby city.</p>
          <button onclick="document.getElementById('reset-filters-btn').click()" class="btn btn-secondary btn-sm">Clear All Filters</button>
        </div>
      `;
      if (paginationEl) paginationEl.innerHTML = '';
      return;
    }

    container.innerHTML = roommates.map(r => renderRoommateCard(r)).join('');
    renderPagination(res.page, res.totalPages);

  } catch (err) {
    container.innerHTML = `<div class="alert alert-danger" style="grid-column: 1 / -1;">Failed to load roommate profiles: ${err.message}</div>`;
  }
}

function renderRoommateCard(r) {
  const match = r.compatibility;
  const matchScore = match ? match.percentage : null;

  let pillClass = 'pill-none';
  let pillText = 'Sign in to match';

  if (matchScore !== null) {
    if (matchScore >= 80) pillClass = 'pill-high';
    else if (matchScore >= 60) pillClass = 'pill-med';
    else pillClass = 'pill-low';
    pillText = `⚡ ${matchScore}% Match`;
  }

  const highlights = match && match.highlights && match.highlights.length > 0
    ? match.highlights
    : [
        `Prefers ${r.cleanliness_preference} cleanliness`,
        `${r.study_schedule} study rhythm`
      ];

  return `
    <div class="roommate-card">
      <div class="roommate-card-header">
        <div class="roommate-name-meta">
          <h3>${escapeHtml(r.full_name)}</h3>
          <p>📍 ${escapeHtml(r.city)} • ${r.age ? `${r.age} yrs` : 'Member'}</p>
        </div>
        <span class="compatibility-pill ${pillClass}">${pillText}</span>
      </div>

      <div class="budget-chip">
        💰 ₹${Math.round(r.min_budget)} - ₹${Math.round(r.max_budget)} / mo
      </div>

      <div class="tag-list">
        <span class="tag">🥗 ${escapeHtml(r.food_preference)}</span>
        <span class="tag">🚭 ${escapeHtml(r.smoking_preference)}</span>
        <span class="tag">⏰ ${escapeHtml(r.sleeping_schedule)}</span>
        <span class="tag">🧹 ${escapeHtml(r.cleanliness_preference)}</span>
      </div>

      <div class="highlights-box">
        <strong>Compatibility Highlights:</strong>
        <ul>
          ${highlights.map(h => `<li>${escapeHtml(h)}</li>`).join('')}
        </ul>
      </div>

      <p style="font-size: 0.85rem; color: var(--slate-600); margin-bottom: 1.25rem; line-height: 1.5;">
        ${r.about_me ? escapeHtml(r.about_me.substring(0, 110)) + (r.about_me.length > 110 ? '...' : '') : 'Looking for compatible roommates with shared living standards.'}
      </p>

      <div class="roommate-actions">
        <a href="/roommate-details.html?id=${r.user_id}" class="btn btn-secondary btn-sm" style="flex: 1;">View Profile</a>
        <button onclick="openInterestModal(${r.user_id}, '${escapeHtml(r.full_name)}')" class="btn btn-primary btn-sm" style="flex: 1;">Express Interest</button>
      </div>
    </div>
  `;
}

function renderPagination(page, totalPages) {
  const container = document.getElementById('pagination-bar');
  if (!container || totalPages <= 1) {
    if (container) container.innerHTML = '';
    return;
  }

  let html = `
    <button class="btn btn-secondary btn-sm" ${page <= 1 ? 'disabled' : ''} onclick="goToPage(${page - 1})">← Previous</button>
    <span style="font-size: 0.875rem; color: var(--slate-600); font-weight: 500;">Page ${page} of ${totalPages}</span>
    <button class="btn btn-secondary btn-sm" ${page >= totalPages ? 'disabled' : ''} onclick="goToPage(${page + 1})">Next →</button>
  `;
  container.innerHTML = html;
}

function goToPage(p) {
  currentPage = p;
  loadRoommates();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* Express Interest Modal */
function setupInterestModal() {
  const backdrop = document.getElementById('interest-modal');
  const closeBtn = document.getElementById('close-interest-modal');
  const cancelBtn = document.getElementById('cancel-interest-btn');
  const form = document.getElementById('send-interest-form');

  const close = () => {
    backdrop?.classList.remove('open');
    form?.reset();
    selectedRoommate = null;
  };

  closeBtn?.addEventListener('click', close);
  cancelBtn?.addEventListener('click', close);
  backdrop?.addEventListener('click', (e) => {
    if (e.target === backdrop) close();
  });

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!selectedRoommate) return;

    const message = document.getElementById('interest-message')?.value.trim();
    const btn = document.getElementById('submit-interest-btn');

    btn.disabled = true;
    btn.innerHTML = '<span class="loading-spinner"></span> Sending...';

    try {
      await window.api.interests.send({
        receiver_user_id: selectedRoommate.id,
        message: message || 'Hi, I would love to connect and discuss rooming together!'
      });
      alert(`Interest sent successfully to ${selectedRoommate.name}!`);
      close();
    } catch (err) {
      alert(err.message || 'Could not express interest.');
    } finally {
      btn.disabled = false;
      btn.innerHTML = 'Send Interest Request';
    }
  });
}

function openInterestModal(userId, name) {
  // Check auth
  window.checkAuthState().then(user => {
    if (!user) {
      window.location.href = `/login.html?redirect=${encodeURIComponent(window.location.pathname)}`;
      return;
    }
    selectedRoommate = { id: userId, name };
    const nameEl = document.getElementById('modal-target-name');
    if (nameEl) nameEl.textContent = name;
    document.getElementById('interest-modal')?.classList.add('open');
  });
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

window.openInterestModal = openInterestModal;
window.goToPage = goToPage;
