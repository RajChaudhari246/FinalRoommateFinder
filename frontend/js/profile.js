/**
 * Profile Viewing & Editing Script
 * Supports gender wing identification, dedicated security questionnaires for girls and boys,
 * and seamless updating of living protocols.
 */

document.addEventListener('DOMContentLoaded', async () => {
  const user = await window.requireAuthPage();
  if (!user) return;

  const isEditPage = window.location.pathname.includes('edit-profile');

  if (isEditPage) {
    await initEditProfilePage(user);
  } else {
    await initViewProfilePage(user);
  }
});

async function initViewProfilePage(user) {
  try {
    const res = await window.api.profile.getMe();
    const p = res.profile;

    document.getElementById('profile-name').textContent = p.full_name || user.full_name;
    document.getElementById('profile-email').textContent = p.email || user.email;
    document.getElementById('profile-headline').textContent = `${p.city || 'City not set'} • ${p.preferred_location || 'Neighborhood not set'}`;

    // Initials avatar
    const initials = (p.full_name || user.full_name).split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    const avatarEl = document.getElementById('profile-avatar');
    if (avatarEl) avatarEl.textContent = initials;

    // Attributes
    document.getElementById('val-budget').textContent = p.max_budget > 0
      ? `₹${Math.round(p.min_budget)} - ₹${Math.round(p.max_budget)} / month`
      : 'Not set';

    document.getElementById('val-workplace').textContent = p.college_or_workplace || 'Not specified';
    document.getElementById('val-food').textContent = p.food_preference || 'Any';
    document.getElementById('val-smoking').textContent = p.smoking_preference || 'Non-smoker';
    document.getElementById('val-drinking').textContent = p.drinking_preference || 'Non-drinker';
    document.getElementById('val-study').textContent = p.study_schedule || 'Flexible';
    document.getElementById('val-sleeping').textContent = p.sleeping_schedule || 'Flexible';
    document.getElementById('val-cleanliness').textContent = p.cleanliness_preference || 'Moderate';
    document.getElementById('val-roommates').textContent = p.preferred_roommate_count ? `${p.preferred_roommate_count} roommate(s)` : '1 roommate';
    document.getElementById('val-about').textContent = p.about_me || 'No personal bio added yet. Click Edit Profile to tell roommates about yourself!';

    // Status badge
    const badge = document.getElementById('val-status-badge');
    if (badge) {
      if (p.is_complete) {
        badge.textContent = '✓ Profile Complete';
        badge.className = 'badge badge-match-high';
      } else {
        badge.textContent = '⚠️ Incomplete Profile';
        badge.className = 'badge badge-match-low';
      }
    }

    // Admin role badge & callout
    const isAdmin = (p.role === 'admin') || (user && user.role === 'admin');
    if (isAdmin) {
      const roleBadge = document.getElementById('val-role-badge');
      if (roleBadge) roleBadge.style.display = 'inline-flex';

      const adminBtn = document.getElementById('btn-admin-portal-profile');
      if (adminBtn) adminBtn.style.display = 'inline-flex';

      const adminCallout = document.getElementById('admin-privilege-callout');
      if (adminCallout) adminCallout.style.display = 'block';
    }

    // Gender Wing & Protocol Details
    const wingBadge = document.getElementById('profile-wing-badge');
    const cardTitle = document.getElementById('protocol-card-title');
    const cardDesc = document.getElementById('protocol-card-desc');
    const isFemale = (p.gender || '').toLowerCase() === 'female';
    const isMale = (p.gender || '').toLowerCase() === 'male';

    if (isFemale) {
      if (wingBadge) {
        wingBadge.textContent = '🌸 Girls Wing • Safe Zone';
        wingBadge.className = 'wing-badge wing-badge-girls';
      }
      if (cardTitle) cardTitle.innerHTML = '🌸 Women\'s Safety & Security Protocol';
      if (cardDesc) cardDesc.textContent = 'Your protected living standards, visitor restrictions, and building safety criteria.';

      document.getElementById('lbl-proto-visitor').textContent = 'Visitor & Male Guest Policy';
      document.getElementById('lbl-proto-curfew').textContent = 'Society / Hostel Gate Timing';
      document.getElementById('lbl-proto-amenities').textContent = 'Building Security Standards';
      document.getElementById('lbl-proto-emergency').textContent = 'Guardian Contact Verification';

      const visitorMap = {
        'no-male-guests': '🔒 Strictly No Male Guests (Women-Only Flat)',
        'female-friends-only': '🔒 Female Friends & Family Only (Daytime)',
        'pre-informed-daytime': '👥 Pre-informed Day Guests Only',
        'open': '🔓 Open Guest Policy'
      };
      const curfewMap = {
        'strict-curfew': '⏰ Strict Gate Timing (Back by 9:00 PM)',
        'moderate-curfew': '⏰ Moderate Timing (Back by 10:30 PM)',
        'flexible': '⏰ Flexible / Shift Timing (11:00 PM+)',
        'no-curfew': '⏰ 24/7 Gate Access'
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

      document.getElementById('val-proto-visitor').textContent = visitorMap[p.security_visitor_policy] || 'Not specified';
      document.getElementById('val-proto-curfew').textContent = curfewMap[p.security_curfew] || 'Not specified';
      document.getElementById('val-proto-amenities').textContent = amenityMap[p.security_amenities] || 'Not specified';
      document.getElementById('val-proto-emergency').textContent = emergencyMap[p.security_emergency_contact] || 'Not specified';

    } else if (isMale) {
      if (wingBadge) {
        wingBadge.textContent = '⚡ Boys Wing • Living Space';
        wingBadge.className = 'wing-badge wing-badge-boys';
      }
      if (cardTitle) cardTitle.innerHTML = '⚡ Men\'s Living Harmony & Flat Protocol';
      if (cardDesc) cardDesc.textContent = 'Your study environment, quiet hours, door lock discipline, and expense splitting standards.';

      document.getElementById('lbl-proto-visitor').textContent = 'Overnight Guests & Parties';
      document.getElementById('lbl-proto-curfew').textContent = 'Quiet Hours & Night Routine';
      document.getElementById('lbl-proto-amenities').textContent = 'Flat Security & Key Custody';
      document.getElementById('lbl-proto-emergency').textContent = 'Chores & UPI Bill Splitting';

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
        'flexible': '⏰ Flexible Living Routine'
      };
      const lockMap = {
        'strict-lock-discipline': '🔑 Strict Door Lock & Key Custody Responsibility',
        'cctv-parking': '🅿️ CCTV & Vehicle Parking Space'
      };
      const billMap = {
        'split-bill-discipline': '💳 Strict Cleaning Roster & Prompt UPI Split',
        'shared-cook': '🍳 Shared Cook / Housekeeping Required',
        'flexible': 'Casual / As-Needed'
      };

      document.getElementById('val-proto-visitor').textContent = guestMap[p.security_visitor_policy] || 'Not specified';
      document.getElementById('val-proto-curfew').textContent = quietMap[p.security_curfew] || 'Not specified';
      document.getElementById('val-proto-amenities').textContent = lockMap[p.security_amenities] || 'Not specified';
      document.getElementById('val-proto-emergency').textContent = billMap[p.security_emergency_contact] || 'Not specified';

    } else {
      if (wingBadge) wingBadge.textContent = '🌐 Community Listing';
      if (cardTitle) cardTitle.textContent = 'Household & Living Protocol';
      document.getElementById('val-proto-visitor').textContent = p.security_visitor_policy || 'Not set';
      document.getElementById('val-proto-curfew').textContent = p.security_curfew || 'Not set';
      document.getElementById('val-proto-amenities').textContent = p.security_amenities || 'Not set';
      document.getElementById('val-proto-emergency').textContent = p.security_emergency_contact || 'Not set';
    }

    if (p.security_notes) {
      document.getElementById('val-proto-notes').textContent = p.security_notes;
      document.getElementById('protocol-notes-wrap').style.display = 'block';
    }

  } catch (err) {
    showAlert('Failed to load profile details: ' + err.message);
  }
}

async function initEditProfilePage(user) {
  const form = document.getElementById('edit-profile-form');
  const submitBtn = document.getElementById('save-profile-btn');
  const genderSelect = document.getElementById('gender');
  const protocolContainer = document.getElementById('gender-protocol-container');

  // Check welcome banner
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('welcome')) {
    showAlert('Welcome to Roommate Finder! Complete your profile to start discovering matches.', 'info');
  }

  let currentProfileData = {};

  function renderProtocolSection(gender) {
    if (!protocolContainer) return;

    if (gender === 'Female') {
      protocolContainer.style.display = 'block';
      protocolContainer.className = 'edit-section protocol-box-girls';
      protocolContainer.innerHTML = `
        <div class="protocol-header">
          <div>
            <h3 class="protocol-title">🌸 4. Women's Safety & Security Protocol</h3>
            <p class="edit-section-desc" style="margin-bottom: 0;">Specify your security priorities, visitor policies, and building standards.</p>
          </div>
          <span class="protocol-badge" style="color: #be123c;">Girls Safe Wing</span>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label class="form-label" for="security_visitor_policy">Visitor & Male Guest Policy *</label>
            <select id="security_visitor_policy" class="form-control">
              <option value="no-male-guests">Strictly No Male Guests (Women-Only Apartment)</option>
              <option value="female-friends-only">Female Friends & Family Only (Daytime)</option>
              <option value="pre-informed-daytime">Pre-informed Day Guests Permitted</option>
              <option value="open">Open / Flexible Policy</option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label" for="security_curfew">Hostel / Society Gate Timing (Curfew) *</label>
            <select id="security_curfew" class="form-control">
              <option value="strict-curfew">Strict Gate Timing (Back by 9:00 PM)</option>
              <option value="moderate-curfew">Moderate Gate Timing (Back by 10:30 PM)</option>
              <option value="flexible">Flexible / Shift Timing (11:00 PM+)</option>
              <option value="no-curfew">24/7 Gate Access (No Curfew)</option>
            </select>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label class="form-label" for="security_amenities">Building & Society Security Standards *</label>
            <select id="security_amenities" class="form-control">
              <option value="gated-cctv">24/7 Gated Society with Guard & CCTV</option>
              <option value="secure-lock">Keypad / Biometric Main Door Lock</option>
              <option value="safe-colony">Safe Well-Lit Residential Colony</option>
              <option value="standard">Standard Residential Building</option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label" for="security_emergency_contact">Guardian / Emergency Contact Sharing</label>
            <select id="security_emergency_contact" class="form-control">
              <option value="verified-guardian">Willing to share Guardian/Emergency Contact with flatmate (Recommended)</option>
              <option value="available-on-request">Available on request after in-person meeting</option>
              <option value="private">Prefer to keep private initially</option>
            </select>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label" for="security_notes">Personal Safety & Flat Rules</label>
          <input type="text" id="security_notes" class="form-control" placeholder="e.g. Prefer RCPIT/NMIMS students, main balcony & door locked at night, quiet study environment.">
        </div>
      `;

      // Set existing values if available
      if (currentProfileData.security_visitor_policy) {
        document.getElementById('security_visitor_policy').value = currentProfileData.security_visitor_policy;
      }
      if (currentProfileData.security_curfew) {
        document.getElementById('security_curfew').value = currentProfileData.security_curfew;
      }
      if (currentProfileData.security_amenities) {
        document.getElementById('security_amenities').value = currentProfileData.security_amenities;
      }
      if (currentProfileData.security_emergency_contact) {
        document.getElementById('security_emergency_contact').value = currentProfileData.security_emergency_contact;
      }
      if (currentProfileData.security_notes) {
        document.getElementById('security_notes').value = currentProfileData.security_notes;
      }

    } else if (gender === 'Male') {
      protocolContainer.style.display = 'block';
      protocolContainer.className = 'edit-section protocol-box-boys';
      protocolContainer.innerHTML = `
        <div class="protocol-header">
          <div>
            <h3 class="protocol-title">⚡ 4. Men's Living Harmony & Flat Security Protocol</h3>
            <p class="edit-section-desc" style="margin-bottom: 0;">Set your expectations for overnight guests, noise discipline, and flat responsibilities.</p>
          </div>
          <span class="protocol-badge" style="color: #1d4ed8;">Boys Living Wing</span>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label class="form-label" for="security_visitor_policy">Overnight Guests & Gatherings *</label>
            <select id="security_visitor_policy" class="form-control">
              <option value="no-overnight-guests">Quiet Study Environment (Strictly No Overnight Guests)</option>
              <option value="weekend-friends-only">Weekend Friends Permitted with Notice</option>
              <option value="prior-consent">Prior Consent Allowed for Project/Study Mates</option>
              <option value="open">Open & Social Flat</option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label" for="security_curfew">Quiet Hours & Night Routine *</label>
            <select id="security_curfew" class="form-control">
              <option value="strict-curfew">Strict Silence After 10:30 PM (Early Sleep)</option>
              <option value="moderate-curfew">Moderate (Headphones required at night)</option>
              <option value="night-owl">Late Night Gaming / Project Friendly</option>
              <option value="flexible">Flexible Living Schedule</option>
            </select>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label class="form-label" for="security_amenities">Flat Security & Key Custody *</label>
            <select id="security_amenities" class="form-control">
              <option value="strict-lock-discipline">Strict Door Locking & Responsible Key Custody</option>
              <option value="cctv-parking">CCTV & Vehicle / Bike Parking Space</option>
              <option value="standard">Standard Lock & Shared Key</option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label" for="security_emergency_contact">Chores & Bill Splitting Accountability</label>
            <select id="security_emergency_contact" class="form-control">
              <option value="split-bill-discipline">Strict Cleaning Roster & Prompt UPI Bill Split</option>
              <option value="shared-cook">Shared Cook / Housekeeping Required</option>
              <option value="flexible">Casual / Independent Chores</option>
            </select>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label" for="security_notes">Flat Rules & Schedule Notes</label>
          <input type="text" id="security_notes" class="form-control" placeholder="e.g. GATE preparation, gym timings, no loud speakers late night, clean kitchen after cooking.">
        </div>
      `;

      // Set existing values if available
      if (currentProfileData.security_visitor_policy) {
        document.getElementById('security_visitor_policy').value = currentProfileData.security_visitor_policy;
      }
      if (currentProfileData.security_curfew) {
        document.getElementById('security_curfew').value = currentProfileData.security_curfew;
      }
      if (currentProfileData.security_amenities) {
        document.getElementById('security_amenities').value = currentProfileData.security_amenities;
      }
      if (currentProfileData.security_emergency_contact) {
        document.getElementById('security_emergency_contact').value = currentProfileData.security_emergency_contact;
      }
      if (currentProfileData.security_notes) {
        document.getElementById('security_notes').value = currentProfileData.security_notes;
      }

    } else {
      protocolContainer.style.display = 'none';
      protocolContainer.innerHTML = '';
    }
  }

  genderSelect?.addEventListener('change', (e) => {
    renderProtocolSection(e.target.value);
  });

  // Pre-fill form from DB
  try {
    const res = await window.api.profile.getMe();
    const p = res.profile;
    currentProfileData = p;

    document.getElementById('full_name').value = p.full_name || user.full_name;
    document.getElementById('age').value = p.age || '';
    document.getElementById('gender').value = p.gender || '';
    document.getElementById('city').value = p.city && p.city !== 'Not Specified' ? p.city : '';
    document.getElementById('preferred_location').value = p.preferred_location && p.preferred_location !== 'Not Specified' ? p.preferred_location : '';
    document.getElementById('college_or_workplace').value = p.college_or_workplace || '';
    document.getElementById('min_budget').value = p.min_budget > 0 ? Math.round(p.min_budget) : '';
    document.getElementById('max_budget').value = p.max_budget > 0 ? Math.round(p.max_budget) : '';

    if (p.food_preference) document.getElementById('food_preference').value = p.food_preference;
    if (p.smoking_preference) document.getElementById('smoking_preference').value = p.smoking_preference;
    if (p.drinking_preference) document.getElementById('drinking_preference').value = p.drinking_preference;
    if (p.study_schedule) document.getElementById('study_schedule').value = p.study_schedule;
    if (p.sleeping_schedule) document.getElementById('sleeping_schedule').value = p.sleeping_schedule;
    if (p.cleanliness_preference) document.getElementById('cleanliness_preference').value = p.cleanliness_preference;
    if (p.preferred_roommate_count) document.getElementById('preferred_roommate_count').value = p.preferred_roommate_count;
    document.getElementById('about_me').value = p.about_me || '';

    // Render protocol questions if gender is already selected
    if (p.gender) {
      renderProtocolSection(p.gender);
    }

  } catch (err) {
    console.error('Error pre-filling profile:', err);
  }

  // Form submit handler
  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearAlert();

    const minBudget = parseFloat(document.getElementById('min_budget').value) || 0;
    const maxBudget = parseFloat(document.getElementById('max_budget').value) || 0;

    if (maxBudget < minBudget) {
      return showAlert('Maximum budget cannot be less than minimum budget.');
    }

    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="loading-spinner"></span> Saving Profile...';

    const payload = {
      age: document.getElementById('age').value || null,
      gender: document.getElementById('gender').value || null,
      city: document.getElementById('city').value.trim(),
      preferred_location: document.getElementById('preferred_location').value.trim(),
      college_or_workplace: document.getElementById('college_or_workplace').value.trim(),
      min_budget: minBudget,
      max_budget: maxBudget,
      food_preference: document.getElementById('food_preference').value,
      smoking_preference: document.getElementById('smoking_preference').value,
      drinking_preference: document.getElementById('drinking_preference').value,
      study_schedule: document.getElementById('study_schedule').value,
      sleeping_schedule: document.getElementById('sleeping_schedule').value,
      cleanliness_preference: document.getElementById('cleanliness_preference').value,
      preferred_roommate_count: document.getElementById('preferred_roommate_count').value,
      about_me: document.getElementById('about_me').value.trim(),
      security_visitor_policy: document.getElementById('security_visitor_policy')?.value || null,
      security_curfew: document.getElementById('security_curfew')?.value || null,
      security_amenities: document.getElementById('security_amenities')?.value || null,
      security_emergency_contact: document.getElementById('security_emergency_contact')?.value || null,
      security_notes: document.getElementById('security_notes')?.value.trim() || null
    };

    try {
      await window.api.profile.updateMe(payload);
      showAlert('Profile and living protocol saved successfully! Redirecting...', 'success');
      setTimeout(() => {
        window.location.href = '/profile.html';
      }, 900);
    } catch (err) {
      showAlert(err.message || 'Failed to save profile.');
      submitBtn.disabled = false;
      submitBtn.innerHTML = 'Save Profile Changes';
    }
  });
}
