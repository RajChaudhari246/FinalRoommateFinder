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

  // Load Dashboard Data
  await loadProfileCompletion();
  await loadInterestCounts();
  await loadRecommendedRoommates();
});

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
    const res = await window.api.roommates.search({ limit: 3 });
    const roommates = res.roommates || [];

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

      return `
        <div class="roommate-card">
          <div class="roommate-card-header">
            <div class="roommate-name-meta">
              <h3>${escapeHtml(r.full_name)}</h3>
              <p>📍 ${escapeHtml(r.city)} • ${r.age ? `${r.age} yrs` : 'Student / Pro'}</p>
            </div>
            ${matchScore !== null ? `<span class="compatibility-pill ${badgeClass}">⚡ ${matchScore}% Match</span>` : ''}
          </div>

          <div class="budget-chip">
            💰 $${Math.round(r.min_budget)} - $${Math.round(r.max_budget)} / mo
          </div>

          <div class="tag-list">
            <span class="tag">🥗 ${escapeHtml(r.food_preference)}</span>
            <span class="tag">🚭 ${escapeHtml(r.smoking_preference)}</span>
            <span class="tag">⏰ ${escapeHtml(r.sleeping_schedule)}</span>
          </div>

          <p style="font-size: 0.85rem; color: var(--slate-600); margin-bottom: 1.25rem; line-height: 1.5;">
            ${r.about_me ? escapeHtml(r.about_me.substring(0, 95)) + (r.about_me.length > 95 ? '...' : '') : 'No bio provided yet.'}
          </p>

          <div class="roommate-actions">
            <a href="/roommate-details.html?id=${r.user_id}" class="btn btn-secondary btn-sm" style="flex: 1;">View Details</a>
            <button onclick="expressQuickInterest(${r.user_id}, '${escapeHtml(r.full_name)}')" class="btn btn-primary btn-sm" style="flex: 1;">Connect</button>
          </div>
        </div>
      `;
    }).join('');

  } catch (err) {
    container.innerHTML = `<p class="alert alert-danger">Error loading recommendations: ${err.message}</p>`;
  }
}

async function expressQuickInterest(userId, name) {
  try {
    await window.api.interests.send({ receiver_user_id: userId, message: 'Hi, I saw your profile and would love to connect!' });
    alert(`Interest sent to ${name}!`);
    await loadInterestCounts();
  } catch (err) {
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
