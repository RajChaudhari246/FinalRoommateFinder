/**
 * Admin Portal & Dashboard Logic
 * Provides real-time user management, new user tracking, metric insights,
 * profile auditing, and role/status manipulation.
 */

let currentAdminUser = null;
let currentNewUsersTimeframe = 'week';
let searchDebounceTimer = null;
let activeModalUserId = null;

document.addEventListener('DOMContentLoaded', async () => {
  // Enforce admin privileges
  currentAdminUser = await window.requireAdminPage();
  if (!currentAdminUser) return;

  setupHeroProfile(currentAdminUser);
  setupTabs();
  setupFilterListeners();
  setupModalListeners();

  // Initial data loading
  await Promise.all([
    loadMetrics(),
    loadNewUsersStream(currentNewUsersTimeframe),
    loadUsersTable(),
    loadActivityFeed(),
    loadAdminProfileTab()
  ]);

  document.getElementById('btn-refresh-data')?.addEventListener('click', async () => {
    window.showAlert('Refreshing platform analytics...', 'info');
    await Promise.all([
      loadMetrics(),
      loadNewUsersStream(currentNewUsersTimeframe),
      loadUsersTable(),
      loadActivityFeed()
    ]);
    window.showAlert('Platform analytics updated successfully.', 'success');
  });

  document.getElementById('btn-refresh-activity')?.addEventListener('click', async () => {
    await loadActivityFeed();
    window.showAlert('Activity feed refreshed.', 'success');
  });
});

/**
 * Setup Admin Header Profile & Avatar
 */
function setupHeroProfile(user) {
  const nameEl = document.getElementById('hero-admin-name');
  const emailEl = document.getElementById('hero-admin-email');
  const avatarEl = document.getElementById('hero-admin-avatar');

  if (nameEl) nameEl.textContent = user.full_name || 'Administrator';
  if (emailEl) emailEl.textContent = user.email || 'admin@roommatefinder.com';

  const initials = (user.full_name || 'Admin')
    .split(' ')
    .map(n => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  if (avatarEl) avatarEl.textContent = initials;
}

/**
 * Tab Navigation Controller
 */
function setupTabs() {
  const tabBtns = document.querySelectorAll('.admin-tab-btn');
  const tabSections = document.querySelectorAll('.admin-tab-content');

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-tab');

      tabBtns.forEach(b => b.classList.remove('active'));
      tabSections.forEach(s => s.style.display = 'none');

      btn.classList.add('active');
      const targetSection = document.getElementById(targetId);
      if (targetSection) targetSection.style.display = 'block';
    });
  });

  // Timeframe buttons on Tab 1
  const tfBtns = document.querySelectorAll('.new-users-timeframe-btn');
  tfBtns.forEach(btn => {
    btn.addEventListener('click', async () => {
      tfBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentNewUsersTimeframe = btn.getAttribute('data-tf');
      await loadNewUsersStream(currentNewUsersTimeframe);
    });
  });
}

/**
 * Filter & Search Event Listeners
 */
function setupFilterListeners() {
  const searchInput = document.getElementById('admin-search-input');
  const filterTf = document.getElementById('filter-timeframe');
  const filterStatus = document.getElementById('filter-status');
  const filterRole = document.getElementById('filter-role');
  const filterGender = document.getElementById('filter-gender');
  const sortSelect = document.getElementById('sort-select');
  const resetBtn = document.getElementById('btn-reset-filters');

  const triggerSearch = () => {
    clearTimeout(searchDebounceTimer);
    searchDebounceTimer = setTimeout(() => {
      loadUsersTable();
    }, 250);
  };

  searchInput?.addEventListener('input', triggerSearch);
  filterTf?.addEventListener('change', () => loadUsersTable());
  filterStatus?.addEventListener('change', () => loadUsersTable());
  filterRole?.addEventListener('change', () => loadUsersTable());
  filterGender?.addEventListener('change', () => loadUsersTable());
  sortSelect?.addEventListener('change', () => loadUsersTable());

  resetBtn?.addEventListener('click', () => {
    if (searchInput) searchInput.value = '';
    if (filterTf) filterTf.value = 'all';
    if (filterStatus) filterStatus.value = 'all';
    if (filterRole) filterRole.value = 'all';
    if (filterGender) filterGender.value = 'all';
    if (sortSelect) sortSelect.value = 'newest';
    loadUsersTable();
  });
}

/**
 * Load KPI Overview Metrics
 */
async function loadMetrics() {
  try {
    const res = await window.api.admin.getMetrics();
    const m = res.metrics;

    // Total Users
    document.getElementById('kpi-total-users').textContent = m.users.total;
    document.getElementById('kpi-users-sub').textContent = `${m.users.by_status.active || 0} active • ${m.users.by_role.admin || 0} admins`;

    // New Users
    document.getElementById('kpi-new-users').textContent = `+${m.users.this_week}`;
    document.getElementById('kpi-new-today').textContent = `Added today: ${m.users.today} • This month: ${m.users.this_month}`;

    // Living Wings
    document.getElementById('kpi-wings-ratio').textContent = `${m.profiles.girls_wing} 🌸 / ${m.profiles.boys_wing} ⚡`;
    document.getElementById('kpi-profiles-rate').textContent = `Profile completion: ${m.profiles.completion_rate}%`;

    // Interests
    document.getElementById('kpi-total-interests').textContent = m.interests.total;
    document.getElementById('kpi-matches-accepted').textContent = `Accepted connections: ${m.interests.accepted} (${m.interests.match_rate}%)`;

    // Badges in tabs
    const newBadge = document.getElementById('badge-tab-new-count');
    if (newBadge) newBadge.textContent = m.users.this_week;

    const allBadge = document.getElementById('badge-tab-all-count');
    if (allBadge) allBadge.textContent = m.users.total;

  } catch (error) {
    console.error('Failed to load metrics:', error);
  }
}

/**
 * Load "New Users Stream" (Tab 1)
 */
async function loadNewUsersStream(timeframe = 'week') {
  const container = document.getElementById('new-users-container');
  if (!container) return;

  container.innerHTML = `
    <div class="empty-state" style="grid-column: 1 / -1;">
      <div class="empty-state-icon">⏳</div>
      <p>Fetching newly registered users...</p>
    </div>
  `;

  try {
    const res = await window.api.admin.getUsers({
      timeframe: timeframe === 'all' ? '' : timeframe,
      sort: 'newest',
      limit: 50
    });

    const users = res.users || [];

    if (users.length === 0) {
      container.innerHTML = `
        <div class="empty-state" style="grid-column: 1 / -1;">
          <div class="empty-state-icon">👥</div>
          <h3>No New Users Found</h3>
          <p>No new users registered for the selected timeframe (${timeframe}). Switch to 'All Recent' or 'This Month' to inspect other members.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = users.map(u => {
      const isFemale = u.gender === 'Female';
      const isMale = u.gender === 'Male';
      const wingClass = isFemale ? 'female' : isMale ? 'male' : '';
      const wingBadge = isFemale
        ? '<span class="wing-badge wing-badge-girls">🌸 Girls Section</span>'
        : isMale
        ? '<span class="wing-badge wing-badge-boys">⚡ Boys Section</span>'
        : '<span class="wing-badge wing-badge-all">Community</span>';

      const initials = (u.full_name || 'U')
        .split(' ')
        .map(n => n[0])
        .join('')
        .substring(0, 2)
        .toUpperCase();

      // Relative registration time formatting
      let timeText = 'Joined recently';
      if (u.age_in_hours < 1) {
        timeText = 'Joined just now';
      } else if (u.age_in_hours < 24) {
        timeText = `Joined ${u.age_in_hours} hour${u.age_in_hours > 1 ? 's' : ''} ago`;
      } else if (u.age_in_days === 1) {
        timeText = 'Joined yesterday';
      } else {
        timeText = `Joined ${u.age_in_days} days ago`;
      }

      const isToday = u.age_in_hours < 24;

      return `
        <div class="new-user-card ${isToday ? 'is-new-today' : ''}">
          <div>
            <div class="new-user-badge-header">
              <span class="badge-new-pulse">
                <span class="admin-pill-dot" style="width: 5px; height: 5px;"></span>
                ${timeText}
              </span>
              ${wingBadge}
            </div>

            <div class="new-user-meta">
              <div class="new-user-avatar ${wingClass}">${initials}</div>
              <div>
                <div class="new-user-name">${escapeHtml(u.full_name)}</div>
                <div class="new-user-email">${escapeHtml(u.email)}</div>
              </div>
            </div>

            <div class="new-user-details">
              <div><strong>📍 Location:</strong> ${escapeHtml(u.city || 'Shirpur')} • ${escapeHtml(u.preferred_location || 'Campus Area')}</div>
              <div><strong>🎓 College/Work:</strong> ${escapeHtml(u.college_or_workplace || 'Not specified')}</div>
              <div><strong>💰 Budget:</strong> ${u.max_budget > 0 ? `₹${Math.round(u.min_budget)} - ₹${Math.round(u.max_budget)}/mo` : 'Not set'}</div>
              <div><strong>🛡️ Profile:</strong> ${u.is_complete ? '<span style="color: #059669; font-weight: 600;">✓ Complete</span>' : '<span style="color: #d97706; font-weight: 600;">⚠️ Incomplete</span>'} • Role: <strong style="text-transform: capitalize;">${u.role}</strong></div>
            </div>
          </div>

          <div style="display: flex; gap: 0.5rem; justify-content: space-between; border-top: 1px solid var(--slate-100); padding-top: 0.85rem; margin-top: 0.5rem;">
            <button class="btn btn-secondary btn-sm" onclick="openUserModal(${u.id})">
              👁️ Inspect Profile
            </button>
            <div style="display: flex; gap: 0.35rem;">
              <button class="btn btn-sm ${u.account_status === 'active' ? 'btn-outline' : 'btn-primary'}" style="font-size: 0.775rem;" onclick="handleToggleStatus(${u.id}, '${u.account_status}')">
                ${u.account_status === 'active' ? 'Suspend' : 'Activate'}
              </button>
              <button class="btn btn-sm btn-outline" style="font-size: 0.775rem;" onclick="handleToggleRole(${u.id}, '${u.role}')" title="Change Admin Role">
                ${u.role === 'admin' ? '👤 Demote' : '🛡️ Admin'}
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');

  } catch (error) {
    container.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1;">
        <div class="empty-state-icon">⚠️</div>
        <h3>Failed to load new users</h3>
        <p>${escapeHtml(error.message || 'Unknown network error.')}</p>
      </div>
    `;
  }
}

/**
 * Load "All Users Directory" Table (Tab 2)
 */
async function loadUsersTable() {
  const tbody = document.getElementById('admin-users-table-body');
  if (!tbody) return;

  const search = document.getElementById('admin-search-input')?.value || '';
  const timeframe = document.getElementById('filter-timeframe')?.value || 'all';
  const status = document.getElementById('filter-status')?.value || 'all';
  const role = document.getElementById('filter-role')?.value || 'all';
  const gender = document.getElementById('filter-gender')?.value || 'all';
  const sort = document.getElementById('sort-select')?.value || 'newest';

  tbody.innerHTML = `
    <tr>
      <td colspan="9" style="text-align: center; padding: 2.5rem; color: var(--slate-400);">
        Filtering member directory...
      </td>
    </tr>
  `;

  try {
    const res = await window.api.admin.getUsers({
      search,
      timeframe: timeframe === 'all' ? '' : timeframe,
      status,
      role,
      gender,
      sort,
      limit: 100
    });

    const users = res.users || [];

    if (users.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="9" style="text-align: center; padding: 3rem;">
            <div style="font-size: 2rem; margin-bottom: 0.5rem;">🔍</div>
            <div style="font-weight: 700; color: var(--slate-800);">No matching members found</div>
            <div style="color: var(--slate-500); font-size: 0.85rem; margin-top: 0.25rem;">Try modifying your search or filter criteria.</div>
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = users.map(u => {
      const isFemale = u.gender === 'Female';
      const isMale = u.gender === 'Male';
      const initials = (u.full_name || 'U')
        .split(' ')
        .map(n => n[0])
        .join('')
        .substring(0, 2)
        .toUpperCase();

      const wingBadge = isFemale
        ? '<span class="wing-badge wing-badge-girls" style="font-size: 0.72rem;">🌸 Girls</span>'
        : isMale
        ? '<span class="wing-badge wing-badge-boys" style="font-size: 0.72rem;">⚡ Boys</span>'
        : '<span class="wing-badge wing-badge-all" style="font-size: 0.72rem;">General</span>';

      const roleBadge = u.role === 'admin'
        ? '<span class="badge badge-role-admin">🛡️ Admin</span>'
        : '<span class="badge badge-role-user">👤 User</span>';

      const statusBadge = u.account_status === 'active'
        ? '<span class="badge badge-status-active">Active</span>'
        : '<span class="badge badge-status-suspended">Suspended</span>';

      const completionBadge = u.is_complete
        ? '<span style="color: #059669; font-weight: 600; font-size: 0.8rem;">✓ Complete</span>'
        : '<span style="color: #d97706; font-weight: 600; font-size: 0.8rem;">⚠️ Incomplete</span>';

      const formattedDate = new Date(u.created_at).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });

      const isNewHighlight = u.is_new ? 'row-new' : '';
      const isSuspendedRow = u.account_status !== 'active' ? 'row-suspended' : '';

      return `
        <tr class="${isNewHighlight} ${isSuspendedRow}">
          <td>
            <div class="user-identity-cell">
              <div class="user-identity-avatar ${u.role === 'admin' ? 'admin-avatar' : ''}">
                ${initials}
              </div>
              <div class="user-identity-meta">
                <a href="javascript:void(0)" onclick="openUserModal(${u.id})" class="user-name-link">
                  ${escapeHtml(u.full_name)}
                  ${u.is_new ? '<span style="font-size: 0.65rem; background: #ecfdf5; color: #065f46; border: 1px solid #a7f3d0; padding: 0.1rem 0.35rem; border-radius: 9999px;">NEW</span>' : ''}
                </a>
                <span class="user-email-text">${escapeHtml(u.email)}</span>
              </div>
            </div>
          </td>
          <td>${roleBadge}</td>
          <td>${statusBadge}</td>
          <td>${wingBadge}</td>
          <td>
            <div style="font-weight: 600; font-size: 0.825rem; color: var(--slate-800);">${escapeHtml(u.city || 'Shirpur')}</div>
            <div style="font-size: 0.75rem; color: var(--slate-500); max-width: 180px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
              ${escapeHtml(u.college_or_workplace || u.preferred_location || 'Campus')}
            </div>
          </td>
          <td>${completionBadge}</td>
          <td style="font-size: 0.825rem; color: var(--slate-600);">${formattedDate}</td>
          <td style="font-size: 0.8rem; color: var(--slate-600);">
            <span>📤 ${u.sent_interests_count || 0} sent</span> • 
            <span>📥 ${u.received_interests_count || 0} in</span>
          </td>
          <td style="text-align: right;">
            <div class="table-actions-cell" style="justify-content: flex-end;">
              <button class="btn-icon-sm" onclick="openUserModal(${u.id})" title="Inspect full profile and interests">
                👁️ View
              </button>
              <button class="btn-icon-sm" onclick="handleToggleRole(${u.id}, '${u.role}')" title="Change role between User and Admin">
                ${u.role === 'admin' ? 'Demote' : 'Make Admin'}
              </button>
              <button class="btn-icon-sm" onclick="handleToggleStatus(${u.id}, '${u.account_status}')" title="Toggle active/suspended state">
                ${u.account_status === 'active' ? 'Suspend' : 'Activate'}
              </button>
              <button class="btn-icon-sm danger" onclick="handleDeleteUser(${u.id}, '${escapeHtml(u.full_name)}')" title="Permanently delete user">
                🗑️
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

  } catch (error) {
    tbody.innerHTML = `
      <tr>
        <td colspan="9" style="text-align: center; color: var(--danger-600); padding: 2rem;">
          Error loading user directory: ${escapeHtml(error.message || 'Unknown error')}
        </td>
      </tr>
    `;
  }
}

/**
 * Load Activity Feed (Tab 3)
 */
async function loadActivityFeed() {
  const container = document.getElementById('activity-stream-container');
  if (!container) return;

  try {
    const res = await window.api.admin.getActivity();
    const events = res.events || [];

    if (events.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">📋</div>
          <h3>No Recent Activity Logged</h3>
          <p>System events, user registrations, and connection requests will show here.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = events.map(e => {
      const isUser = e.type === 'user_registered';
      const formattedTime = new Date(e.timestamp).toLocaleString();

      return `
        <div class="activity-item">
          <div class="activity-icon ${isUser ? 'user' : 'interest'}">
            ${e.icon || '📌'}
          </div>
          <div class="activity-content">
            <div class="activity-title">${escapeHtml(e.title)}</div>
            <div class="activity-desc">${escapeHtml(e.description)}</div>
          </div>
          <div class="activity-time">${formattedTime}</div>
        </div>
      `;
    }).join('');

  } catch (error) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">⚠️</div>
        <p>Could not load activity feed: ${escapeHtml(error.message)}</p>
      </div>
    `;
  }
}

/**
 * Load Admin Profile & Privileges (Tab 4)
 */
async function loadAdminProfileTab() {
  try {
    const res = await window.api.admin.getProfile();
    const a = res.admin;

    document.getElementById('tab-admin-name').textContent = a.full_name;
    document.getElementById('tab-admin-email').textContent = a.email;
    document.getElementById('tab-admin-id').textContent = `#${a.id}`;
    document.getElementById('tab-admin-status').textContent = (a.account_status || 'active').toUpperCase();
    document.getElementById('tab-admin-location').textContent = a.city || 'Shirpur HQ';
    document.getElementById('tab-admin-created').textContent = new Date(a.created_at).toLocaleDateString();

    const initials = (a.full_name || 'Admin')
      .split(' ')
      .map(n => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
    document.getElementById('tab-admin-avatar').textContent = initials;

    // Privileges list
    const privList = document.getElementById('admin-privileges-list');
    if (privList && a.privileges) {
      privList.innerHTML = a.privileges.map(p => `
        <li style="display: flex; align-items: center; gap: 0.65rem; font-size: 0.875rem; color: var(--slate-700);">
          <span style="color: #059669; font-weight: 700;">✓</span>
          <span>${escapeHtml(p)}</span>
        </li>
      `).join('');
    }

  } catch (error) {
    console.error('Failed to load admin profile tab:', error);
  }
}

/**
 * Open User Dossier Inspection Modal
 */
async function openUserModal(userId) {
  activeModalUserId = userId;
  const modal = document.getElementById('user-detail-modal');
  if (!modal) return;

  modal.classList.add('open');

  try {
    const res = await window.api.admin.getUserDetails(userId);
    const u = res.user;

    // Header
    document.getElementById('modal-user-name').textContent = u.full_name;
    document.getElementById('modal-user-email').textContent = `${u.email} • ID: #${u.id} • Role: ${u.role}`;

    const initials = (u.full_name || 'U')
      .split(' ')
      .map(n => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
    document.getElementById('modal-user-avatar').textContent = initials;

    // Overview Tab
    document.getElementById('modal-loc').textContent = `${u.city || 'Not set'} • ${u.preferred_location || 'Not set'}`;
    document.getElementById('modal-college').textContent = u.college_or_workplace || 'Not specified';
    document.getElementById('modal-budget').textContent = u.max_budget > 0 ? `₹${Math.round(u.min_budget)} - ₹${Math.round(u.max_budget)} / mo` : 'Not set';
    document.getElementById('modal-gender').textContent = `${u.gender || 'Not specified'}, ${u.age ? `${u.age} yrs` : 'Age not set'}`;
    document.getElementById('modal-food').textContent = u.food_preference || 'Any';
    document.getElementById('modal-smoking').textContent = u.smoking_preference || 'Non-smoker';
    document.getElementById('modal-study').textContent = u.study_schedule || 'Flexible';
    document.getElementById('modal-sleep').textContent = u.sleeping_schedule || 'Flexible';
    document.getElementById('modal-bio').textContent = u.about_me || 'No personal bio added yet.';

    // Security Tab
    document.getElementById('modal-sec-visitor').textContent = u.security_visitor_policy || 'Standard visitor rules';
    document.getElementById('modal-sec-curfew').textContent = u.security_curfew || 'Flexible timing';
    document.getElementById('modal-sec-amenities').textContent = u.security_amenities || 'Standard building security';
    document.getElementById('modal-sec-emergency').textContent = u.security_emergency_contact || 'None listed';
    document.getElementById('modal-sec-notes').textContent = u.security_notes || 'No security or safety notes added by this user.';

    // Interests Tab
    const sent = u.interactions?.sent || [];
    const received = u.interactions?.received || [];
    document.getElementById('modal-sent-count').textContent = sent.length;
    document.getElementById('modal-received-count').textContent = received.length;

    const sentListEl = document.getElementById('modal-sent-list');
    if (sent.length === 0) {
      sentListEl.innerHTML = '<p style="color: var(--slate-400);">No requests sent by this user.</p>';
    } else {
      sentListEl.innerHTML = sent.map(s => `
        <div style="background: var(--slate-50); padding: 0.65rem 0.85rem; border-radius: var(--radius-sm); margin-bottom: 0.4rem; border: 1px solid var(--slate-200);">
          <div style="font-weight: 600;">To: ${escapeHtml(s.receiver_name)} (${escapeHtml(s.receiver_email)})</div>
          <div style="font-size: 0.8rem; color: var(--slate-500);">Status: <strong>${s.status}</strong> • ${new Date(s.created_at).toLocaleDateString()}</div>
          ${s.message ? `<div style="font-size: 0.8rem; margin-top: 0.25rem; font-style: italic;">"${escapeHtml(s.message)}"</div>` : ''}
        </div>
      `).join('');
    }

    const recListEl = document.getElementById('modal-received-list');
    if (received.length === 0) {
      recListEl.innerHTML = '<p style="color: var(--slate-400);">No incoming requests received by this user.</p>';
    } else {
      recListEl.innerHTML = received.map(r => `
        <div style="background: var(--slate-50); padding: 0.65rem 0.85rem; border-radius: var(--radius-sm); margin-bottom: 0.4rem; border: 1px solid var(--slate-200);">
          <div style="font-weight: 600;">From: ${escapeHtml(r.sender_name)} (${escapeHtml(r.sender_email)})</div>
          <div style="font-size: 0.8rem; color: var(--slate-500);">Status: <strong>${r.status}</strong> • ${new Date(r.created_at).toLocaleDateString()}</div>
          ${r.message ? `<div style="font-size: 0.8rem; margin-top: 0.25rem; font-style: italic;">"${escapeHtml(r.message)}"</div>` : ''}
        </div>
      `).join('');
    }

    // Modal Footer Actions
    const actionsContainer = document.getElementById('modal-actions-container');
    actionsContainer.innerHTML = `
      <button class="btn btn-sm ${u.account_status === 'active' ? 'btn-danger' : 'btn-primary'}" onclick="handleToggleStatus(${u.id}, '${u.account_status}'); closeModal();">
        ${u.account_status === 'active' ? 'Suspend Account' : 'Activate Account'}
      </button>
      <button class="btn btn-secondary btn-sm" onclick="handleToggleRole(${u.id}, '${u.role}'); closeModal();">
        ${u.role === 'admin' ? 'Revoke Admin Privileges' : 'Promote to Admin 🛡️'}
      </button>
      <button class="btn btn-outline btn-sm" style="color: var(--danger-600); border-color: var(--danger-600);" onclick="handleDeleteUser(${u.id}, '${escapeHtml(u.full_name)}'); closeModal();">
        Delete User 🗑️
      </button>
    `;

  } catch (error) {
    alert(`Could not load user details: ${error.message}`);
    closeModal();
  }
}

function closeModal() {
  const modal = document.getElementById('user-detail-modal');
  if (modal) modal.classList.remove('open');
  activeModalUserId = null;
}

function setupModalListeners() {
  document.getElementById('modal-close-btn')?.addEventListener('click', closeModal);
  document.getElementById('modal-close-bottom-btn')?.addEventListener('click', closeModal);

  // Close on clicking backdrop
  document.getElementById('user-detail-modal')?.addEventListener('click', (e) => {
    if (e.target.id === 'user-detail-modal') closeModal();
  });

  // Modal subtabs
  const mtabs = document.querySelectorAll('.detail-modal-tab');
  const msubtabs = document.querySelectorAll('.modal-subtab');

  mtabs.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-modaltab');
      mtabs.forEach(b => b.classList.remove('active'));
      msubtabs.forEach(s => s.style.display = 'none');

      btn.classList.add('active');
      const target = document.getElementById(targetId);
      if (target) target.style.display = 'block';
    });
  });
}

/**
 * Handle Account Status Toggle (Active <-> Suspended)
 */
async function handleToggleStatus(userId, currentStatus) {
  const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
  const actionText = newStatus === 'suspended' ? 'suspend' : 'activate';

  if (!confirm(`Are you sure you want to ${actionText} this user's account?`)) {
    return;
  }

  try {
    const res = await window.api.admin.updateUserStatus(userId, newStatus);
    window.showAlert(res.message, 'success');
    await Promise.all([
      loadMetrics(),
      loadNewUsersStream(currentNewUsersTimeframe),
      loadUsersTable(),
      loadActivityFeed()
    ]);
  } catch (error) {
    window.showAlert(`Status update failed: ${error.message}`, 'danger');
  }
}

/**
 * Handle Role Toggle (User <-> Admin)
 */
async function handleToggleRole(userId, currentRole) {
  const newRole = currentRole === 'admin' ? 'user' : 'admin';
  const actionText = newRole === 'admin' ? 'promote this user to System Administrator' : 'demote this administrator to regular user';

  if (!confirm(`Are you sure you want to ${actionText}?`)) {
    return;
  }

  try {
    const res = await window.api.admin.updateUserRole(userId, newRole);
    window.showAlert(res.message, 'success');
    await Promise.all([
      loadMetrics(),
      loadNewUsersStream(currentNewUsersTimeframe),
      loadUsersTable(),
      loadActivityFeed()
    ]);
  } catch (error) {
    window.showAlert(`Role update failed: ${error.message}`, 'danger');
  }
}

/**
 * Handle User Deletion
 */
async function handleDeleteUser(userId, userName) {
  if (!confirm(`DANGER: Are you sure you want to permanently delete user "${userName}"?\nThis will remove their profile, roommate criteria, and all associated messages. This action cannot be undone.`)) {
    return;
  }

  try {
    const res = await window.api.admin.deleteUser(userId);
    window.showAlert(res.message, 'success');
    await Promise.all([
      loadMetrics(),
      loadNewUsersStream(currentNewUsersTimeframe),
      loadUsersTable(),
      loadActivityFeed()
    ]);
  } catch (error) {
    window.showAlert(`Deletion failed: ${error.message}`, 'danger');
  }
}

/**
 * Helper to escape HTML and prevent XSS
 */
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Global window exposure for inline onclick handlers
window.openUserModal = openUserModal;
window.closeModal = closeModal;
window.handleToggleStatus = handleToggleStatus;
window.handleToggleRole = handleToggleRole;
window.handleDeleteUser = handleDeleteUser;
