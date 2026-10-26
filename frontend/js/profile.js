/**
 * Profile Viewing & Editing Script
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
      ? `$${Math.round(p.min_budget)} - $${Math.round(p.max_budget)} / month`
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
  } catch (err) {
    showAlert('Failed to load profile details: ' + err.message);
  }
}

async function initEditProfilePage(user) {
  const form = document.getElementById('edit-profile-form');
  const submitBtn = document.getElementById('save-profile-btn');

  // Check welcome banner
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('welcome')) {
    showAlert('Welcome to Roommate Finder! Complete your profile to start discovering matches.', 'info');
  }

  // Pre-fill form from DB
  try {
    const res = await window.api.profile.getMe();
    const p = res.profile;

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
      about_me: document.getElementById('about_me').value.trim()
    };

    try {
      await window.api.profile.updateMe(payload);
      showAlert('Profile saved successfully! Redirecting...', 'success');
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
