/**
 * Roommate Preferences Script
 * Manages desired roommate criteria distinctly from personal profile attributes.
 */

document.addEventListener('DOMContentLoaded', async () => {
  const user = await window.requireAuthPage();
  if (!user) return;

  const form = document.getElementById('preferences-form');
  const submitBtn = document.getElementById('save-preferences-btn');

  // Load existing preferences
  try {
    const res = await window.api.preferences.getMe();
    const pref = res.preferences || {};

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
      preferred_location: document.getElementById('pref_location').value.trim() || null,
      min_budget: minB,
      max_budget: maxB,
      preferred_food: document.getElementById('pref_food').value,
      preferred_smoking_status: document.getElementById('pref_smoking').value,
      preferred_study_schedule: document.getElementById('pref_study').value,
      preferred_sleeping_schedule: document.getElementById('pref_sleeping').value,
      preferred_cleanliness: document.getElementById('pref_cleanliness').value,
      preferred_roommate_count: document.getElementById('pref_roommate_count').value
    };

    try {
      await window.api.preferences.updateMe(payload);
      showAlert('Roommate preferences saved! Your matches will reflect these criteria.', 'success');
      submitBtn.disabled = false;
      submitBtn.innerHTML = 'Save Preferences';
    } catch (err) {
      showAlert(err.message || 'Failed to update preferences.');
      submitBtn.disabled = false;
      submitBtn.innerHTML = 'Save Preferences';
    }
  });
});
