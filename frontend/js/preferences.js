/**
 * Roommate Preferences Script
 * Manages desired roommate criteria, gender wings, and dynamic safety/living standards.
 */

document.addEventListener('DOMContentLoaded', async () => {
  const user = await window.requireAuthPage();
  if (!user) return;

  const form = document.getElementById('preferences-form');
  const submitBtn = document.getElementById('save-preferences-btn');
  const genderPrefSelect = document.getElementById('preferred_gender');
  const secContainer = document.getElementById('pref-security-container');

  let currentPrefs = {};

  function renderSecurityCriteria(gender) {
    if (!secContainer) return;

    if (gender === 'Female') {
      secContainer.style.display = 'block';
      secContainer.className = 'edit-section protocol-box-girls';
      secContainer.innerHTML = `
        <div class="protocol-header">
          <div>
            <h3 class="protocol-title">🌸 Desired Safety & Living Standards (Girls Safe Wing)</h3>
            <p class="edit-section-desc" style="margin-bottom: 0;">Specify what safety, visitor guidelines, and society security standards your ideal female roommate should meet.</p>
          </div>
          <span class="protocol-badge" style="color: #be123c;">Girls Safe Criteria</span>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label class="form-label" for="pref_security_visitor_policy">Desired Visitor & Male Guest Policy</label>
            <select id="pref_security_visitor_policy" class="form-control">
              <option value="any">Flexible / Open</option>
              <option value="no-male-guests">Strictly No Male Guests (Mandatory for safe flat)</option>
              <option value="female-friends-only">Female Friends & Family Only</option>
              <option value="pre-informed-daytime">Pre-informed Day Guests Only</option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label" for="pref_security_curfew">Desired In-Time / Curfew Rhythm</label>
            <select id="pref_security_curfew" class="form-control">
              <option value="any">Flexible / Any</option>
              <option value="strict-curfew">Strict Gate Timing (Back by 9:00 PM)</option>
              <option value="moderate-curfew">Moderate Timing (Back by 10:30 PM)</option>
              <option value="flexible">Late Shift / Flexible</option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label" for="pref_security_amenities">Desired Building Security Standard</label>
            <select id="pref_security_amenities" class="form-control">
              <option value="any">Standard Building / Flexible</option>
              <option value="gated-cctv">24/7 Gated Society & CCTV Mandatory</option>
              <option value="secure-lock">Keypad / Biometric Door Lock Required</option>
              <option value="safe-colony">Safe Residential Colony</option>
            </select>
          </div>
        </div>
      `;

      if (currentPrefs.pref_security_visitor_policy) {
        document.getElementById('pref_security_visitor_policy').value = currentPrefs.pref_security_visitor_policy;
      }
      if (currentPrefs.pref_security_curfew) {
        document.getElementById('pref_security_curfew').value = currentPrefs.pref_security_curfew;
      }
      if (currentPrefs.pref_security_amenities) {
        document.getElementById('pref_security_amenities').value = currentPrefs.pref_security_amenities;
      }

    } else if (gender === 'Male') {
      secContainer.style.display = 'block';
      secContainer.className = 'edit-section protocol-box-boys';
      secContainer.innerHTML = `
        <div class="protocol-header">
          <div>
            <h3 class="protocol-title">⚡ Desired Living Harmony Standards (Boys Living Wing)</h3>
            <p class="edit-section-desc" style="margin-bottom: 0;">Specify what study atmosphere, quiet hours, and flat discipline you seek in future male housemates.</p>
          </div>
          <span class="protocol-badge" style="color: #1d4ed8;">Boys Living Criteria</span>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label class="form-label" for="pref_security_visitor_policy">Desired Overnight Guest / Gathering Policy</label>
            <select id="pref_security_visitor_policy" class="form-control">
              <option value="any">Flexible / Open</option>
              <option value="no-overnight-guests">Quiet Study Environment (No Overnight Guests)</option>
              <option value="weekend-friends-only">Weekend Friends Permitted with Notice</option>
              <option value="prior-consent">Prior Consent with Flatmates</option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label" for="pref_security_curfew">Desired Quiet Hours Rhythm</label>
            <select id="pref_security_curfew" class="form-control">
              <option value="any">Flexible / Any</option>
              <option value="strict-curfew">Strict Silence After 10:30 PM (Early Sleepers)</option>
              <option value="moderate-curfew">Moderate (Headphones at Night)</option>
              <option value="night-owl">Late Night Coding / Gaming Friendly</option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label" for="pref_security_amenities">Desired Flat Security & Bill Discipline</label>
            <select id="pref_security_amenities" class="form-control">
              <option value="any">Standard / Flexible</option>
              <option value="strict-lock-discipline">Strict Door Locking & Prompt UPI Split</option>
              <option value="cctv-parking">CCTV & Vehicle Parking Required</option>
            </select>
          </div>
        </div>
      `;

      if (currentPrefs.pref_security_visitor_policy) {
        document.getElementById('pref_security_visitor_policy').value = currentPrefs.pref_security_visitor_policy;
      }
      if (currentPrefs.pref_security_curfew) {
        document.getElementById('pref_security_curfew').value = currentPrefs.pref_security_curfew;
      }
      if (currentPrefs.pref_security_amenities) {
        document.getElementById('pref_security_amenities').value = currentPrefs.pref_security_amenities;
      }

    } else {
      secContainer.style.display = 'none';
      secContainer.innerHTML = '';
    }
  }

  genderPrefSelect?.addEventListener('change', (e) => {
    renderSecurityCriteria(e.target.value);
  });

  // Load existing preferences
  try {
    const res = await window.api.preferences.getMe();
    const pref = res.preferences || {};
    currentPrefs = pref;

    if (pref.preferred_gender) {
      genderPrefSelect.value = pref.preferred_gender;
      renderSecurityCriteria(pref.preferred_gender);
    }
    if (pref.preferred_location) document.getElementById('pref_location').value = pref.preferred_location;
    if (pref.min_budget) document.getElementById('pref_min_budget').value = Math.round(pref.min_budget);
    if (pref.max_budget) document.getElementById('pref_max_budget').value = Math.round(pref.max_budget);
    if (pref.preferred_food) document.getElementById('pref_food').value = pref.preferred_food;
    if (pref.preferred_smoking_status) document.getElementById('pref_smoking').value = pref.preferred_smoking_status;
    if (pref.preferred_study_schedule) document.getElementById('pref_study').value = pref.preferred_study_schedule;
    if (pref.preferred_sleeping_schedule) document.getElementById('pref_sleeping').value = pref.preferred_sleeping_schedule;
    if (pref.preferred_cleanliness) document.getElementById('pref_cleanliness').value = pref.preferred_cleanliness;
    if (pref.preferred_roommate_count) document.getElementById('pref_roommate_count').value = pref.preferred_roommate_count;

  } catch (err) {
    console.error('Failed to load preferences:', err);
  }

  // Handle submit
  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearAlert();

    const minB = document.getElementById('pref_min_budget').value ? parseFloat(document.getElementById('pref_min_budget').value) : null;
    const maxB = document.getElementById('pref_max_budget').value ? parseFloat(document.getElementById('pref_max_budget').value) : null;

    if (minB !== null && maxB !== null && maxB < minB) {
      return showAlert('Maximum budget cannot be less than minimum budget.');
    }

    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="loading-spinner"></span> Saving Roommate Criteria...';

    const payload = {
      preferred_gender: genderPrefSelect.value,
      preferred_location: document.getElementById('pref_location').value.trim() || null,
      min_budget: minB,
      max_budget: maxB,
      preferred_food: document.getElementById('pref_food').value,
      preferred_smoking_status: document.getElementById('pref_smoking').value,
      preferred_study_schedule: document.getElementById('pref_study').value,
      preferred_sleeping_schedule: document.getElementById('pref_sleeping').value,
      preferred_cleanliness: document.getElementById('pref_cleanliness').value,
      preferred_roommate_count: document.getElementById('pref_roommate_count').value,
      pref_security_visitor_policy: document.getElementById('pref_security_visitor_policy')?.value || 'any',
      pref_security_curfew: document.getElementById('pref_security_curfew')?.value || 'any',
      pref_security_amenities: document.getElementById('pref_security_amenities')?.value || 'any'
    };

    try {
      await window.api.preferences.updateMe(payload);
      showAlert('Roommate criteria saved! Your compatibility calculations and matches now reflect your living wing safety requirements.', 'success');
      submitBtn.disabled = false;
      submitBtn.innerHTML = 'Save Preferences';
    } catch (err) {
      showAlert(err.message || 'Failed to update preferences.');
      submitBtn.disabled = false;
      submitBtn.innerHTML = 'Save Preferences';
    }
  });
});
