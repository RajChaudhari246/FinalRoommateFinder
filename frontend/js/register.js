/**
 * Registration Page Script
 */

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('register-form');
  const submitBtn = document.getElementById('submit-btn');
  const passwordInput = document.getElementById('password');
  const confirmInput = document.getElementById('confirm_password');
  const toggleBtn = document.getElementById('toggle-password');

  // Toggle password visibility
  toggleBtn?.addEventListener('click', () => {
    const isPassword = passwordInput.type === 'password';
    passwordInput.type = isPassword ? 'text' : 'password';
    confirmInput.type = isPassword ? 'text' : 'password';
    toggleBtn.textContent = isPassword ? '🙈' : '👁️';
  });

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearAlert();

    const fullName = document.getElementById('full_name').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = passwordInput.value;
    const confirmPassword = confirmInput.value;
    const terms = document.getElementById('terms').checked;

    // Client Validation
    if (fullName.length < 2) {
      return showAlert('Full name must be at least 2 characters.');
    }

    if (!email.includes('@')) {
      return showAlert('Please enter a valid email address.');
    }

    if (password.length < 6) {
      return showAlert('Password must be at least 6 characters long.');
    }

    if (password !== confirmPassword) {
      return showAlert('Passwords do not match.');
    }

    if (!terms) {
      return showAlert('Please agree to the terms to create an account.');
    }

    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="loading-spinner"></span> Creating Account...';

    try {
      const res = await window.api.auth.register({
        full_name: fullName,
        email,
        password,
        confirm_password: confirmPassword
      });

      showAlert('Account created successfully! Redirecting to setup profile...', 'success');
      setTimeout(() => {
        window.location.href = '/edit-profile.html?welcome=true';
      }, 1000);
    } catch (err) {
      showAlert(err.message || 'Registration failed.');
      submitBtn.disabled = false;
      submitBtn.innerHTML = 'Create Account';
    }
  });
});
