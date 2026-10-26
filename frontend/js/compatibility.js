/**
 * Roommate Details & Compatibility Inspector Script
 */

let candidateId = null;
let candidateName = '';

document.addEventListener('DOMContentLoaded', async () => {
  const urlParams = new URLSearchParams(window.location.search);
  candidateId = parseInt(urlParams.get('id'), 10);

  if (!candidateId) {
    showAlert('No roommate selected. Redirecting to discovery...');
    setTimeout(() => { window.location.href = '/find-roommates.html'; }, 1500);
    return;
  }

  await loadRoommateDetails();
  setupInterestModal();
});

async function loadRoommateDetails() {
  const user = await window.checkAuthState();

  try {
    const res = await window.api.profile.getPublic(candidateId);
    const p = res.profile;
    candidateName = p.full_name;

    document.getElementById('details-name').textContent = p.full_name;
    document.getElementById('details-headline').textContent = `📍 ${p.city} • ${p.preferred_location} ${p.age ? `• ${p.age} years old` : ''}`;
    document.getElementById('details-work').textContent = p.college_or_workplace || 'Not specified';
    document.getElementById('details-budget').textContent = `₹${Math.round(p.min_budget)} - ₹${Math.round(p.max_budget)} / month`;
    document.getElementById('details-food').textContent = p.food_preference || 'Any';
    document.getElementById('details-smoking').textContent = p.smoking_preference || 'Non-smoker';
    document.getElementById('details-drinking').textContent = p.drinking_preference || 'Non-drinker';
    document.getElementById('details-study').textContent = p.study_schedule || 'Flexible';
    document.getElementById('details-sleeping').textContent = p.sleeping_schedule || 'Flexible';
    document.getElementById('details-cleanliness').textContent = p.cleanliness_preference || 'Moderate';
    document.getElementById('details-roommates').textContent = `${p.preferred_roommate_count || 1} roommate(s)`;
    document.getElementById('details-about').textContent = p.about_me || 'No additional bio provided.';

    // Initials avatar
    const initials = p.full_name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    const avatarEl = document.getElementById('details-avatar');
    if (avatarEl) avatarEl.textContent = initials;

    // Load compatibility breakdown if authenticated
    if (user) {
      await loadDetailedCompatibility();
    } else {
      document.getElementById('compatibility-box').innerHTML = `
        <div class="alert alert-info">
          <span><a href="/login.html?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}">Log in</a> to view your personalized compatibility score and factor breakdown with ${escapeHtml(p.full_name)}.</span>
        </div>
      `;
    }

  } catch (err) {
    showAlert('Error loading profile: ' + err.message);
  }
}

async function loadDetailedCompatibility() {
  const box = document.getElementById('compatibility-box');
  if (!box) return;

  try {
    const res = await window.api.roommates.getCompatibility(candidateId);
    const comp = res.compatibility;

    if (!comp.hasSufficientData) {
      box.innerHTML = `
        <div class="alert alert-info">
          <span>Not enough information to calculate compatibility. Complete your own profile and preferences to generate a match score!</span>
        </div>
      `;
      return;
    }

    let scoreClass = 'pill-none';
    if (comp.percentage >= 80) scoreClass = 'pill-high';
    else if (comp.percentage >= 60) scoreClass = 'pill-med';
    else scoreClass = 'pill-low';

    box.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem;">
        <div>
          <h3 style="font-size: 1.25rem; margin-bottom: 0.25rem;">Compatibility Estimate</h3>
          <p style="font-size: 0.85rem; color: var(--slate-500);">Transparent rule-based scoring based on your roommate preferences</p>
        </div>
        <span class="compatibility-pill ${scoreClass}" style="font-size: 1.2rem; padding: 0.5rem 1.25rem;">
          ⚡ ${comp.percentage}% Match
        </span>
      </div>

      <div class="factors-breakdown">
        ${comp.factors.map(f => `
          <div class="factor-item">
            <span class="factor-indicator ${f.status}">
              ${f.status === 'positive' ? '✓' : f.status === 'negative' ? '✕' : '•'}
            </span>
            <div class="factor-text">
              <h4>${escapeHtml(f.name)} (${f.weight}%)</h4>
              <p>${escapeHtml(f.reason)}</p>
            </div>
          </div>
        `).join('')}
      </div>
    `;

  } catch (err) {
    console.warn('Could not load compatibility breakdown:', err.message);
  }
}

function setupInterestModal() {
  const backdrop = document.getElementById('interest-modal');
  const openBtn = document.getElementById('express-interest-trigger');
  const closeBtn = document.getElementById('close-interest-modal');
  const cancelBtn = document.getElementById('cancel-interest-btn');
  const form = document.getElementById('send-interest-form');

  const close = () => {
    backdrop?.classList.remove('open');
    form?.reset();
  };

  openBtn?.addEventListener('click', async () => {
    const user = await window.checkAuthState();
    if (!user) {
      window.location.href = `/login.html?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`;
      return;
    }
    const nameEl = document.getElementById('modal-target-name');
    if (nameEl) nameEl.textContent = candidateName;
    backdrop?.classList.add('open');
  });

  closeBtn?.addEventListener('click', close);
  cancelBtn?.addEventListener('click', close);

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const message = document.getElementById('interest-message')?.value.trim();
    const btn = document.getElementById('submit-interest-btn');

    btn.disabled = true;
    btn.innerHTML = '<span class="loading-spinner"></span> Sending...';

    try {
      await window.api.interests.send({
        receiver_user_id: candidateId,
        message: message || 'Hi! I saw your profile and would love to connect about finding an apartment together.'
      });
      alert(`Interest request sent to ${candidateName}!`);
      close();
    } catch (err) {
      alert(err.message || 'Could not send interest.');
    } finally {
      btn.disabled = false;
      btn.innerHTML = 'Send Interest Request';
    }
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
