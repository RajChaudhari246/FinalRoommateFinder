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

  const currentPath = window.location.pathname;
  const currentSearch = window.location.search;

  if (user) {
    const isAdmin = user.role === 'admin';

    // Authenticated User Navigation
    if (navMenu) {
      navMenu.innerHTML = `
        <li><a href="/find-roommates.html?section=female" class="nav-link ${currentSearch.includes('female') ? 'active' : ''}" style="color: #be123c; font-weight: 600;" id="nav-girls">🌸 Girls Section</a></li>
        <li><a href="/find-roommates.html?section=male" class="nav-link ${currentSearch.includes('male') ? 'active' : ''}" style="color: #1d4ed8; font-weight: 600;" id="nav-boys">⚡ Boys Section</a></li>
        <li><a href="/find-roommates.html" class="nav-link ${currentPath.includes('find-roommates') && !currentSearch ? 'active' : ''}" id="nav-find">All Roommates</a></li>
        <li><a href="/dashboard.html" class="nav-link ${currentPath.includes('dashboard') ? 'active' : ''}" id="nav-dash">Dashboard</a></li>
        <li><a href="/interests.html" class="nav-link ${currentPath.includes('interests') ? 'active' : ''}" id="nav-interests">Interests</a></li>
        <li><a href="/profile.html" class="nav-link ${currentPath.includes('profile') && !currentPath.includes('edit') ? 'active' : ''}" id="nav-profile">My Profile</a></li>
        ${isAdmin ? `<li><a href="/admin.html" class="nav-link ${currentPath.includes('admin') ? 'active' : ''}" style="color: #6366f1; font-weight: 700;" id="nav-admin">🛡️ Admin Portal</a></li>` : ''}
      `;
    }

    navActions.innerHTML = `
      <div style="display: flex; align-items: center; gap: 0.75rem;">
        ${isAdmin ? `
          <a href="/admin.html" class="btn btn-sm" style="background: linear-gradient(135deg, #4f46e5, #7c3aed); color: #ffffff; border: none; font-size: 0.8rem; padding: 0.35rem 0.75rem; font-weight: 700; box-shadow: 0 2px 8px rgba(99, 102, 241, 0.35);" title="Go to Admin Operations Center">
            🛡️ Admin
          </a>
        ` : ''}
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
        <li><a href="/find-roommates.html?section=female" class="nav-link ${currentSearch.includes('female') ? 'active' : ''}" style="color: #be123c; font-weight: 600;">🌸 Girls Section</a></li>
        <li><a href="/find-roommates.html?section=male" class="nav-link ${currentSearch.includes('male') ? 'active' : ''}" style="color: #1d4ed8; font-weight: 600;">⚡ Boys Section</a></li>
        <li><a href="/find-roommates.html" class="nav-link">Browse All</a></li>
        <li><a href="/index.html#how-it-works" class="nav-link">How It Works</a></li>
        <li><a href="/index.html#features" class="nav-link">Safety & Features</a></li>
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

async function requireAdminPage() {
  const user = await checkAuthState();
  if (!user) {
    window.location.href = '/login.html?redirect=' + encodeURIComponent(window.location.pathname);
    return null;
  }
  if (user.role !== 'admin') {
    alert('Access restricted: System Administrator credentials are required to view the Admin Portal.');
    window.location.href = '/dashboard.html';
    return null;
  }
  return user;
}

document.addEventListener('DOMContentLoaded', () => {
  renderNavbar();
});

window.checkAuthState = checkAuthState;
window.requireAuthPage = requireAuthPage;
window.requireAdminPage = requireAdminPage;
