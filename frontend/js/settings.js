/**
 * Settings Page Script
 * Manages account details, password updates, and account deactivation.
 */

document.addEventListener('DOMContentLoaded', async () => {
  const user = await window.requireAuthPage();
  if (!user) return;

  const passwordForm = document.getElementById('change-password-form');
  const deactivateForm = document.getElementById('deactivate-form');

  // Load account details
  try {
    const res = await window.api.settings.getAccount();
    const acct = res.account;

    document.getElementById('acc-name').textContent = acct.full_name;
    document.getElementById('acc-email').textContent = acct.email;
    document.getElementById('acc-date').textContent = new Date(acct.created_at).toLocaleDateString();
  } catch (err) {
    console.error('Error loading account:', err);
  }

  // Change Password
  passwordForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearAlert('password-alert');

    const currentPassword = document.getElementById('current_password').value;
    const newPassword = document.getElementById('new_password').value;
    const confirmPassword = document.getElementById('confirm_password').value;
    const btn = document.getElementById('save-password-btn');

    if (newPassword.length < 6) {
      return showAlert('New password must be at least 6 characters long.', 'danger', 'password-alert');
    }

    if (newPassword !== confirmPassword) {
      return showAlert('New password and confirmation do not match.', 'danger', 'password-alert');
    }

    btn.disabled = true;
    btn.innerHTML = '<span class="loading-spinner"></span> Updating...';

    try {
      await window.api.settings.changePassword({
        current_password: currentPassword,
        new_password: newPassword,
        confirm_password: confirmPassword
      });

      showAlert('Password updated successfully!', 'success', 'password-alert');
      passwordForm.reset();
    } catch (err) {
      showAlert(err.message || 'Failed to update password.', 'danger', 'password-alert');
    } finally {
      btn.disabled = false;
      btn.innerHTML = 'Update Password';
    }
  });

  // Deactivate Account
  deactivateForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearAlert('deactivate-alert');

    const password = document.getElementById('deactivate_password').value;
    const confirmed = confirm('Are you sure you want to deactivate your account? You will be immediately logged out.');
    if (!confirmed) return;

    try {
      await window.api.settings.deactivate({ password });
      alert('Your account has been deactivated.');
      window.location.href = '/login.html';
    } catch (err) {
      showAlert(err.message || 'Failed to deactivate account.', 'danger', 'deactivate-alert');
    }
  });
});
