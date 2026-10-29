/**
 * Login Page Script
 */

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('login-form');
  const submitBtn = document.getElementById('submit-btn');
  const passwordInput = document.getElementById('password');
  const toggleBtn = document.getElementById('toggle-password');

  // Toggle password visibility
  toggleBtn?.addEventListener('click', () => {
    const isPassword = passwordInput.type === 'password';
    passwordInput.type = isPassword ? 'text' : 'password';
    toggleBtn.textContent = isPassword ? '🙈' : '👁️';
  });

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearAlert();

    const email = document.getElementById('email').value.trim();
    const password = passwordInput.value;

    if (!email || !password) {
      return showAlert('Please enter both email and password.');
    }

    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="loading-spinner"></span> Logging In...';

    try {
      const res = await window.api.auth.login({ email, password });
      showAlert('Login successful! Redirecting...', 'success');

      const urlParams = new URLSearchParams(window.location.search);
      const defaultRedirect = (res.user && res.user.role === 'admin') ? '/admin.html' : '/dashboard.html';
      const redirect = urlParams.get('redirect') || defaultRedirect;

      setTimeout(() => {
        window.location.href = redirect;
      }, 700);
    } catch (err) {
      showAlert(err.message || 'Invalid email or password.');
      submitBtn.disabled = false;
      submitBtn.innerHTML = 'Sign In';
    }
  });
});
