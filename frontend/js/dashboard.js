/**
 * Dashboard Controller
 * Loads user state, profile completion, received/sent interest metrics, and top recommended roommates.
 */

document.addEventListener('DOMContentLoaded', async () => {
  const user = await window.requireAuthPage();
  if (!user) return;

  // Set welcome message
  const firstName = user.full_name.split(' ')[0];
  document.getElementById('user-greeting').textContent = `Welcome back, ${firstName}!`;

  // Display Admin Banner if user has admin privileges
  if (user.role === 'admin') {
    const adminBanner = document.getElementById('admin-dashboard-banner');
    if (adminBanner) adminBanner.style.display = 'block';
  }

  // Enforce Wing isolation UI on dashboard
  renderLivingWingsSection(user);

  // Load Dashboard Data
  await loadProfileCompletion();
  await loadInterestCounts();
  await loadRecommendedRoommates();
});

function renderLivingWingsSection(user) {
  const isAdmin = user && user.role === 'admin';
  const userGender = (user && user.gender ? user.gender : '').toLowerCase();

  const girlsCard = document.getElementById('portal-card-girls');
  const boysCard = document.getElementById('portal-card-boys');
  const girlsBadge = document.getElementById('portal-badge-girls');
  const boysBadge = document.getElementById('portal-badge-boys');
  const girlsBtnWrap = document.getElementById('portal-btn-girls-wrap');
  const boysBtnWrap = document.getElementById('portal-btn-boys-wrap');

  if (isAdmin) {
    if (girlsBadge) girlsBadge.innerHTML = '<span class="wing-badge wing-badge-girls">Safe Space 🛡️</span>';
    if (boysBadge) boysBadge.innerHTML = '<span class="wing-badge wing-badge-boys">Living Wing ⚡</span>';
    return;
  }

  if (userGender === 'male') {
    if (boysBadge) {
      boysBadge.innerHTML = '<span class="wing-badge wing-badge-boys" style="font-weight: 700;">⚡ Your Verified Wing</span>';
    }
    if (boysBtnWrap) {
      boysBtnWrap.innerHTML = `
        <a href="/find-roommates.html?section=male" class="btn btn-primary" style="background: linear-gradient(135deg, #2563eb, #0284c7); border: none; align-self: flex-start; font-weight: 700;">
          Browse Male Roommates →
        </a>
      `;
    }

    if (girlsCard) {
      girlsCard.style.background = '#f8fafc';
      girlsCard.style.borderColor = '#e2e8f0';
      girlsCard.style.opacity = '0.85';
    }
    if (girlsBadge) {
      girlsBadge.innerHTML = '<span class="wing-badge" style="background: #f1f5f9; color: #64748b; border: 1px dashed #cbd5e1;">🔒 Women-Only (Restricted)</span>';
    }
    if (girlsBtnWrap) {
      girlsBtnWrap.innerHTML = `
        <button type="button" class="btn btn-secondary" disabled style="opacity: 0.65; cursor: not-allowed; align-self: flex-start; background: #e2e8f0; border-color: #cbd5e1; color: #64748b;" title="Girls Wing is strictly reserved for female members.">
          🔒 Restricted (Female Members Only)
        </button>
      `;
    }
  } else if (userGender === 'female') {
    if (girlsBadge) {
      girlsBadge.innerHTML = '<span class="wing-badge wing-badge-girls" style="font-weight: 700;">🌸 Your Verified Wing</span>';
    }
    if (girlsBtnWrap) {
      girlsBtnWrap.innerHTML = `
        <a href="/find-roommates.html?section=female" class="btn btn-primary" style="background: linear-gradient(135deg, #e11d48, #ec4899); border: none; align-self: flex-start; font-weight: 700;">
          Browse Female Roommates →
        </a>
      `;
    }

    if (boysCard) {
      boysCard.style.background = '#f8fafc';
      boysCard.style.borderColor = '#e2e8f0';
      boysCard.style.opacity = '0.85';
    }
    if (boysBadge) {
      boysBadge.innerHTML = '<span class="wing-badge" style="background: #f1f5f9; color: #64748b; border: 1px dashed #cbd5e1;">🔒 Men-Only (Restricted)</span>';
    }
    if (boysBtnWrap) {
      boysBtnWrap.innerHTML = `
        <button type="button" class="btn btn-secondary" disabled style="opacity: 0.65; cursor: not-allowed; align-self: flex-start; background: #e2e8f0; border-color: #cbd5e1; color: #64748b;" title="Boys Wing is reserved for male members.">
          🔒 Restricted (Male Members Only)
        </button>
      `;
    }
  }
}

async function loadProfileCompletion() {
  try {
    const res = await window.api.profile.getMe();
    const profile = res.profile;

    let completedFields = 0;
    const requiredFields = [
      'city',
      'preferred_location',
      'min_budget',
      'max_budget',
      'food_preference',
      'smoking_preference',
      'study_schedule',
      'sleeping_schedule',
      'cleanliness_preference',
      'about_me'
    ];

    requiredFields.forEach(f => {
      if (profile[f] && profile[f] !== 'Not Specified' && profile[f] !== 0 && profile[f] !== '0.00') {
        completedFields++;
      }
    });

    const percent = Math.min(100, Math.round((completedFields / requiredFields.length) * 100));
    const progressBar = document.getElementById('progress-fill');
    const percentText = document.getElementById('completion-percent');
    const banner = document.getElementById('completion-banner');

    if (progressBar) progressBar.style.width = `${percent}%`;
    if (percentText) percentText.textContent = `${percent}%`;

    if (percent === 100 && banner) {
      banner.style.display = 'none'; // Profile fully complete
    }

    // Set brief summary
    document.getElementById('profile-summary-city').textContent = profile.city || 'Location not set';
    document.getElementById('profile-summary-budget').textContent = profile.max_budget > 0
      ? `₹${Math.round(profile.min_budget)} - ₹${Math.round(profile.max_budget)}/mo`
      : 'Budget not set';

  } catch (err) {
    console.error('Error loading profile completion:', err);
  }
}

async function loadInterestCounts() {
  try {
    const [receivedRes, sentRes] = await Promise.all([
      window.api.interests.getReceived(),
      window.api.interests.getSent()
    ]);

    const receivedCount = receivedRes.count || 0;
    const sentCount = sentRes.count || 0;
    const acceptedCount = (receivedRes.interests || []).filter(i => i.status === 'accepted').length +
                          (sentRes.interests || []).filter(i => i.status === 'accepted').length;

    document.getElementById('count-received').textContent = receivedCount;
    document.getElementById('count-sent').textContent = sentCount;
    document.getElementById('count-matches').textContent = acceptedCount;
  } catch (err) {
    console.error('Error loading interest counts:', err);
  }
}

async function loadRecommendedRoommates() {
  const container = document.getElementById('recommended-grid');
  if (!container) return;

  try {
    const [res, sentRes] = await Promise.all([
      window.api.roommates.search({ limit: 3 }),
      window.api.interests.getSent().catch(() => ({ interests: [] }))
    ]);

    const roommates = res.roommates || [];
    const sentMap = {};
    (sentRes.interests || []).forEach(i => {
      sentMap[i.receiver_user_id] = i.status;
    });

    if (roommates.length === 0) {
      container.innerHTML = `
        <div class="empty-state" style="grid-column: 1 / -1; padding: 2rem 1rem;">
          <div class="empty-state-icon">👥</div>
          <h3>No recommended roommates yet</h3>
          <p>Complete your profile and preferences to help us surface compatible roommates in your city.</p>
          <a href="/edit-profile.html" class="btn btn-primary btn-sm">Complete Profile</a>
        </div>
      `;
      return;
    }

    container.innerHTML = roommates.map(r => {
      const matchScore = r.compatibility ? r.compatibility.percentage : null;
      let badgeClass = 'pill-none';
      if (matchScore !== null) {
        if (matchScore >= 80) badgeClass = 'pill-high';
        else if (matchScore >= 60) badgeClass = 'pill-med';
        else badgeClass = 'pill-low';
      }

      const isFemale = (r.gender || '').toLowerCase() === 'female';
      const isMale = (r.gender || '').toLowerCase() === 'male';
      const wingBadge = isFemale
        ? '<span class="wing-badge wing-badge-girls">🌸 Girls Wing</span>'
        : isMale
          ? '<span class="wing-badge wing-badge-boys">⚡ Boys Wing</span>'
          : '<span class="wing-badge wing-badge-all">🌐 Roommate</span>';

      const cardClass = isFemale ? 'card-female' : isMale ? 'card-male' : '';
      const existingStatus = sentMap[r.user_id];

      let connectBtn = '';
      if (existingStatus === 'accepted') {
        connectBtn = `<a href="/interests.html" class="btn btn-teal btn-sm" style="flex: 1;">Connected 🤝</a>`;
      } else if (existingStatus === 'pending') {
        connectBtn = `<button type="button" class="btn btn-secondary btn-sm" disabled style="flex: 1; opacity: 0.75;">Sent ✓</button>`;
      } else {
        connectBtn = `<button id="btn-quick-interest-${r.user_id}" onclick="expressQuickInterest(${r.user_id}, '${escapeHtml(r.full_name)}')" class="btn btn-primary btn-sm" style="flex: 1;">Connect</button>`;
      }

      return `
        <div class="roommate-card ${cardClass}">
          <div class="roommate-card-topbar">
            ${wingBadge}
            ${matchScore !== null ? `<span class="compatibility-pill ${badgeClass}">⚡ ${matchScore}% Match</span>` : ''}
          </div>

          <div class="roommate-card-header">
            <div class="roommate-name-meta">
              <h3>${escapeHtml(r.full_name)}</h3>
              <p>📍 ${escapeHtml(r.city)} • ${r.age ? `${r.age} yrs` : 'Member'}</p>
            </div>
          </div>

          <div class="budget-chip">
            💰 ₹${Math.round(r.min_budget)} - ₹${Math.round(r.max_budget)} / month
          </div>

          <div class="tag-list">
            <span class="tag">🥗 ${escapeHtml(r.food_preference)}</span>
            <span class="tag">🚭 ${escapeHtml(r.smoking_preference)}</span>
            <span class="tag">⏰ ${escapeHtml(r.sleeping_schedule)}</span>
          </div>

          <p style="font-size: 0.85rem; color: var(--slate-600); margin-bottom: 1.25rem; line-height: 1.5;">
            ${r.about_me ? escapeHtml(r.about_me.substring(0, 95)) + (r.about_me.length > 95 ? '...' : '') : 'Looking for compatible roommates with shared living standards.'}
          </p>

          <div class="roommate-actions">
            <a href="/roommate-details.html?id=${r.user_id}" class="btn btn-secondary btn-sm" style="flex: 1;">View Profile</a>
            ${connectBtn}
          </div>
        </div>
      `;
    }).join('');

  } catch (err) {
    container.innerHTML = `<p class="alert alert-danger">Error loading recommendations: ${err.message}</p>`;
  }
}

async function expressQuickInterest(userId, name) {
  const btn = document.getElementById(`btn-quick-interest-${userId}`);
  if (btn) {
    btn.disabled = true;
    btn.textContent = 'Sending...';
  }

  try {
    await window.api.interests.send({ receiver_user_id: userId, message: 'Hi, I saw your profile and would love to connect about finding an apartment together!' });
    if (btn) {
      btn.outerHTML = `<button type="button" class="btn btn-secondary btn-sm" disabled style="flex: 1; opacity: 0.75;">Sent ✓</button>`;
    }
    alert(`Interest request sent to ${name}!`);
    await loadInterestCounts();
  } catch (err) {
    if (btn) {
      btn.disabled = false;
      btn.textContent = 'Connect';
    }
    alert(err.message || 'Could not send interest.');
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

window.expressQuickInterest = expressQuickInterest;
