/**
 * Shared Auth State & Navigation Controller
 */

async function checkAuthState() {
  try {
    const data = await window.api.auth.me();
    return data.user;
  } catch (error) {
    return null;
  }
}

async function renderNavbar() {
  const user = await checkAuthState();
  const navMenu = document.getElementById('nav-menu');
  const navActions = document.getElementById('nav-actions');

  if (!navActions) return;

  if (user) {
    // Authenticated User Navigation
    if (navMenu) {
      navMenu.innerHTML = `
        <li><a href="/find-roommates.html" class="nav-link" id="nav-find">Find Roommates</a></li>
        <li><a href="/dashboard.html" class="nav-link" id="nav-dash">Dashboard</a></li>
        <li><a href="/interests.html" class="nav-link" id="nav-interests">Interests</a></li>
        <li><a href="/profile.html" class="nav-link" id="nav-profile">My Profile</a></li>
      `;
    }

    navActions.innerHTML = `
      <div style="display: flex; align-items: center; gap: 0.75rem;">
        <a href="/profile.html" style="font-weight: 600; font-size: 0.9rem; color: var(--slate-700);">
          ${user.full_name.split(' ')[0]}
        </a>
        <a href="/settings.html" class="btn btn-secondary btn-sm" title="Settings">⚙️</a>
        <button id="logout-btn" class="btn btn-outline btn-sm">Log Out</button>
      </div>
    `;

    document.getElementById('logout-btn')?.addEventListener('click', async () => {
      try {
        await window.api.auth.logout();
        window.location.href = '/login.html';
      } catch (err) {
        window.location.href = '/login.html';
      }
    });

  } else {
    // Guest User Navigation
    if (navMenu) {
      navMenu.innerHTML = `
        <li><a href="/index.html#how-it-works" class="nav-link">How It Works</a></li>
        <li><a href="/index.html#features" class="nav-link">Features</a></li>
        <li><a href="/find-roommates.html" class="nav-link">Browse Profiles</a></li>
        <li><a href="/index.html#faq" class="nav-link">FAQ</a></li>
      `;
    }

    navActions.innerHTML = `
      <a href="/login.html" class="btn btn-secondary btn-sm">Log In</a>
      <a href="/register.html" class="btn btn-primary btn-sm">Get Started</a>
    `;
  }
}

async function requireAuthPage() {
  const user = await checkAuthState();
  if (!user) {
    window.location.href = '/login.html?redirect=' + encodeURIComponent(window.location.pathname);
    return null;
  }
  return user;
}

document.addEventListener('DOMContentLoaded', () => {
  renderNavbar();
});

window.checkAuthState = checkAuthState;
window.requireAuthPage = requireAuthPage;
