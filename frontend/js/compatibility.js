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

    // Wing & Protocol Details
    const isFemale = (p.gender || '').toLowerCase() === 'female';
    const isMale = (p.gender || '').toLowerCase() === 'male';
    const wingBadge = document.getElementById('details-wing-badge');
    const protoTitle = document.getElementById('details-protocol-title');
    const protoStatus = document.getElementById('details-protocol-status');
    const protoDesc = document.getElementById('details-protocol-desc');

    if (isFemale) {
      if (wingBadge) {
        wingBadge.textContent = '🌸 Girls Wing • Safe Zone';
        wingBadge.className = 'wing-badge wing-badge-girls';
      }
      if (protoTitle) protoTitle.innerHTML = '🌸 Women\'s Safety & Security Protocol';
      if (protoStatus) {
        protoStatus.textContent = 'Girls Safe Space';
        protoStatus.style.background = '#fce7f3';
        protoStatus.style.color = '#be123c';
      }
      if (protoDesc) protoDesc.textContent = 'Self-reported safety requirements, visitor rules, and building security standards.';

      document.getElementById('lbl-details-visitor').textContent = 'Visitor & Male Guest Policy';
      document.getElementById('lbl-details-curfew').textContent = 'Hostel / Society Gate Timing';
      document.getElementById('lbl-details-amenities').textContent = 'Building Security Standards';
      document.getElementById('lbl-details-emergency').textContent = 'Guardian Verification';

      const visitorMap = {
        'no-male-guests': '🔒 Strictly No Male Guests (Women-Only Flat)',
        'female-friends-only': '🔒 Female Friends & Family Only',
        'pre-informed-daytime': '👥 Pre-informed Day Visitors Allowed',
        'open': '🔓 Open Guest Policy'
      };
      const curfewMap = {
        'strict-curfew': '⏰ Strict Gate Timing (Back by 9:00 PM)',
        'moderate-curfew': '⏰ Moderate Timing (Back by 10:30 PM)',
        'flexible': '⏰ Flexible / Shift Timing (11:00 PM+)',
        'no-curfew': '⏰ 24/7 Gate Access (No Curfew)'
      };
      const amenityMap = {
        'gated-cctv': '🛡️ 24/7 Guarded Society with CCTV',
        'secure-lock': '🛡️ Keypad / Biometric Door Lock',
        'safe-colony': '🛡️ Safe Well-Lit Colony'
      };
      const emergencyMap = {
        'verified-guardian': '📞 Guardian Contact Verified & Shareable',
        'available-on-request': '📞 Available on Request',
        'private': '🔒 Keep Private Initially'
      };

      document.getElementById('details-proto-visitor').textContent = visitorMap[p.security_visitor_policy] || 'Not specified';
      document.getElementById('details-proto-curfew').textContent = curfewMap[p.security_curfew] || 'Not specified';
      document.getElementById('details-proto-amenities').textContent = amenityMap[p.security_amenities] || 'Not specified';
      document.getElementById('details-proto-emergency').textContent = emergencyMap[p.security_emergency_contact] || 'Not specified';

    } else if (isMale) {
      if (wingBadge) {
        wingBadge.textContent = '⚡ Boys Wing • Living Space';
        wingBadge.className = 'wing-badge wing-badge-boys';
      }
      if (protoTitle) protoTitle.innerHTML = '⚡ Men\'s Living Harmony & Flat Protocol';
      if (protoStatus) {
        protoStatus.textContent = 'Boys Living Wing';
        protoStatus.style.background = '#e0f2fe';
        protoStatus.style.color = '#0369a1';
      }
      if (protoDesc) protoDesc.textContent = 'Study environment, quiet hours, door locking discipline, and bill splitting commitments.';

      document.getElementById('lbl-details-visitor').textContent = 'Overnight Guests & Parties';
      document.getElementById('lbl-details-curfew').textContent = 'Quiet Hours & Night Routine';
      document.getElementById('lbl-details-amenities').textContent = 'Flat Security & Key Custody';
      document.getElementById('lbl-details-emergency').textContent = 'Chores & UPI Bill Splitting';

      const guestMap = {
        'no-overnight-guests': '📚 Strict Quiet Study (No Overnight Guests)',
        'weekend-friends-only': '👥 Weekend Friends Permitted with Notice',
        'prior-consent': '👥 Consent-Based Guests Allowed',
        'open': '🔓 Social Living Space'
      };
      const quietMap = {
        'strict-curfew': '⏰ Strict Silence After 10:30 PM (Early Sleep)',
        'moderate-curfew': '⏰ Moderate (Headphones at Night)',
        'night-owl': '🎮 Late Night Gaming/Coding Friendly',
        'flexible': '⏰ Flexible Living Schedule'
      };
      const lockMap = {
        'strict-lock-discipline': '🔑 Door Lock & Key Custody Discipline',
        'cctv-parking': '🅿️ CCTV & Vehicle / Bike Parking'
      };
      const billMap = {
        'split-bill-discipline': '💳 Strict Cleaning Roster & Prompt UPI Split',
        'shared-cook': '🍳 Shared Cook / Housekeeping Required',
        'flexible': 'Casual / As-Needed'
      };

      document.getElementById('details-proto-visitor').textContent = guestMap[p.security_visitor_policy] || 'Not specified';
      document.getElementById('details-proto-curfew').textContent = quietMap[p.security_curfew] || 'Not specified';
      document.getElementById('details-proto-amenities').textContent = lockMap[p.security_amenities] || 'Not specified';
      document.getElementById('details-proto-emergency').textContent = billMap[p.security_emergency_contact] || 'Not specified';

    } else {
      if (wingBadge) wingBadge.textContent = '🌐 Community Listing';
      document.getElementById('details-proto-visitor').textContent = p.security_visitor_policy || 'Not set';
      document.getElementById('details-proto-curfew').textContent = p.security_curfew || 'Not set';
      document.getElementById('details-proto-amenities').textContent = p.security_amenities || 'Not set';
      document.getElementById('details-proto-emergency').textContent = p.security_emergency_contact || 'Not set';
    }

    if (p.security_notes) {
      document.getElementById('details-proto-notes').textContent = p.security_notes;
      document.getElementById('details-notes-wrap').style.display = 'block';
    }

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
