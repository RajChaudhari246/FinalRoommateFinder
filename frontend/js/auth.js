/**
 * Shared Auth State, Brand Identity & Responsive Navigation Controller
 * RoommateFinder — JoinMyFlat Inspired Design System
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
  const navContainer = document.querySelector('.nav-container');
  const navBrand = document.querySelector('.nav-brand');
  const navMenu = document.getElementById('nav-menu');
  const navActions = document.getElementById('nav-actions');

  if (!navActions) return;

  const currentPath = window.location.pathname;
  const currentSearch = window.location.search;

  // 1. Upgrade Brand Identity
  if (navBrand) {
    navBrand.innerHTML = `
      <div class="brand-icon-wrap">
        <img src="/assets/logo.svg" alt="RoommateFinder Logo" width="36" height="36">
      </div>
      <div class="brand-text-group">
        <span class="brand-name">ROOMMATE<span>FINDER</span></span>
        <span class="brand-tagline-badge">Find your people. Share your space.</span>
      </div>
    `;
  }

  // 2. Setup Navigation Links & User Actions
  if (user) {
    const isAdmin = user.role === 'admin';
    const initials = user.full_name
      ? user.full_name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
      : 'U';
    const firstName = user.full_name ? user.full_name.split(' ')[0] : 'Account';

    const userGender = (user.gender || '').toLowerCase();
    let wingNavLink = '';
    if (isAdmin) {
      wingNavLink = `<li><a href="/find-roommates.html?section=female" class="nav-link" id="nav-girls" style="color: #be123c;">🌸 Girls Wing</a></li>
                     <li><a href="/find-roommates.html?section=male" class="nav-link" id="nav-boys" style="color: #1d4ed8;">⚡ Boys Wing</a></li>`;
    } else if (userGender === 'male') {
      wingNavLink = `<li><a href="/find-roommates.html?section=male" class="nav-link ${currentSearch.includes('section=male') ? 'active' : ''}" id="nav-my-wing" style="color: #1d4ed8; font-weight: 700;">⚡ Boys Wing</a></li>`;
    } else if (userGender === 'female') {
      wingNavLink = `<li><a href="/find-roommates.html?section=female" class="nav-link ${currentSearch.includes('section=female') ? 'active' : ''}" id="nav-my-wing" style="color: #be123c; font-weight: 700;">🌸 Girls Wing</a></li>`;
    }

    // Desktop Menu
    if (navMenu) {
      navMenu.innerHTML = `
        <li><a href="/find-roommates.html" class="nav-link ${currentPath.includes('find-roommates') && !currentSearch ? 'active' : ''}" id="nav-find">Find Roommates</a></li>
        ${wingNavLink}
        <li><a href="/find-roommates.html?view=rooms" class="nav-link ${currentSearch.includes('rooms') ? 'active' : ''}" id="nav-rooms">Explore Rooms</a></li>
        <li><a href="/index.html#how-it-works" class="nav-link" id="nav-how">How It Works</a></li>
        <li><a href="/index.html#about-us" class="nav-link" id="nav-about">About Us</a></li>
        <li><a href="/dashboard.html" class="nav-link ${currentPath.includes('dashboard') ? 'active' : ''}" id="nav-dash">Dashboard</a></li>
        <li><a href="/interests.html" class="nav-link ${currentPath.includes('interests') ? 'active' : ''}" id="nav-interests">Interests</a></li>
        ${isAdmin ? `<li><a href="/admin.html" class="nav-link ${currentPath.includes('admin') ? 'active' : ''}" style="color: #6366f1; font-weight: 700;" id="nav-admin">🛡️ Admin</a></li>` : ''}
      `;
    }

    // Desktop Actions
    navActions.innerHTML = `
      <div style="display: flex; align-items: center; gap: 0.6rem;">
        ${isAdmin ? `
          <a href="/admin.html" class="btn btn-sm" style="background: linear-gradient(135deg, #4f46e5, #7c3aed); color: #ffffff; border: none; font-size: 0.775rem; padding: 0.35rem 0.65rem; font-weight: 700; border-radius: var(--radius-full);" title="Admin Operations Portal">
            🛡️ Admin
          </a>
        ` : ''}
        <a href="/profile.html" class="user-menu-pill" title="View Profile">
          <span class="user-avatar-circle">${initials}</span>
          <span>${escapeHtml(firstName)}</span>
        </a>
        <a href="/settings.html" class="btn btn-secondary btn-sm" title="Account Settings" style="padding: 0.45rem 0.65rem;">
          ⚙️
        </a>
        <button id="logout-btn" class="btn btn-outline btn-sm">Log Out</button>
      </div>
    `;

    document.getElementById('logout-btn')?.addEventListener('click', async () => {
      try {
        await window.api.auth.logout();
      } catch (err) {}
      window.location.href = '/login.html';
    });

    setupMobileDrawer(user);

  } else {
    // Guest User Navigation
    if (navMenu) {
      navMenu.innerHTML = `
        <li><a href="/find-roommates.html" class="nav-link ${currentPath.includes('find-roommates') && !currentSearch ? 'active' : ''}">Find Roommates</a></li>
        <li><a href="/find-roommates.html?view=rooms" class="nav-link ${currentSearch.includes('rooms') ? 'active' : ''}">Explore Rooms</a></li>
        <li><a href="/index.html#how-it-works" class="nav-link">How It Works</a></li>
        <li><a href="/index.html#about-us" class="nav-link">About Us</a></li>
      `;
    }

    navActions.innerHTML = `
      <a href="/login.html" class="btn btn-secondary btn-sm">Log In</a>
      <a href="/register.html" class="btn btn-primary btn-sm">Sign Up</a>
    `;

    setupMobileDrawer(null);
  }
}

function setupMobileDrawer(user) {
  const navContainer = document.querySelector('.nav-container');
  if (!navContainer) return;

  // Add mobile toggle button to navbar if not exists
  let mobileToggle = document.getElementById('nav-mobile-toggle');
  if (!mobileToggle) {
    mobileToggle = document.createElement('button');
    mobileToggle.id = 'nav-mobile-toggle';
    mobileToggle.className = 'nav-mobile-toggle';
    mobileToggle.setAttribute('aria-label', 'Open navigation drawer');
    mobileToggle.innerHTML = `
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
        <line x1="3" y1="12" x2="21" y2="12"></line>
        <line x1="3" y1="6" x2="21" y2="6"></line>
        <line x1="3" y1="18" x2="21" y2="18"></line>
      </svg>
    `;
    navContainer.appendChild(mobileToggle);
  }

  // Create drawer backdrop & drawer element if not exists
  let drawerBackdrop = document.getElementById('mobile-nav-backdrop');
  if (!drawerBackdrop) {
    drawerBackdrop = document.createElement('div');
    drawerBackdrop.id = 'mobile-nav-backdrop';
    drawerBackdrop.className = 'mobile-nav-backdrop';
    drawerBackdrop.innerHTML = `
      <div class="mobile-nav-drawer">
        <div class="mobile-drawer-header">
          <div style="display: flex; align-items: center; gap: 0.6rem;">
            <img src="/assets/logo.svg" alt="RoommateFinder" width="30" height="30">
            <div>
              <div style="font-weight: 800; font-size: 1.05rem; color: var(--brand-navy); line-height: 1.1;">ROOMMATE<span style="color: var(--brand-teal);">FINDER</span></div>
              <div style="font-size: 0.65rem; color: var(--slate-500); font-weight: 600;">Find your people. Share your space.</div>
            </div>
          </div>
          <button type="button" class="mobile-drawer-close" id="mobile-drawer-close" aria-label="Close menu">&times;</button>
        </div>
        <ul class="mobile-drawer-links" id="mobile-drawer-links"></ul>
        <div class="mobile-drawer-footer" id="mobile-drawer-footer"></div>
      </div>
    `;
    document.body.appendChild(drawerBackdrop);

    // Event listeners to close
    document.getElementById('mobile-drawer-close')?.addEventListener('click', () => {
      drawerBackdrop.classList.remove('open');
    });
    drawerBackdrop.addEventListener('click', (e) => {
      if (e.target === drawerBackdrop) drawerBackdrop.classList.remove('open');
    });
  }

  // Bind toggle click
  mobileToggle.onclick = () => {
    drawerBackdrop.classList.add('open');
  };

  const drawerLinks = document.getElementById('mobile-drawer-links');
  const drawerFooter = document.getElementById('mobile-drawer-footer');
  const currentPath = window.location.pathname;

  if (user) {
    const userGender = (user.gender || '').toLowerCase();
    const isAdmin = user.role === 'admin';

    let wingsDrawerMenu = '';
    if (isAdmin) {
      wingsDrawerMenu = `
        <li><a href="/find-roommates.html?section=female" style="color: var(--girls-primary);">🌸 Girls Safe Wing</a></li>
        <li><a href="/find-roommates.html?section=male" style="color: var(--boys-primary);">⚡ Boys Living Wing</a></li>
      `;
    } else if (userGender === 'male') {
      wingsDrawerMenu = `
        <li><a href="/find-roommates.html?section=male" style="color: var(--boys-primary); font-weight: 700;">⚡ Boys Living Wing (My Wing)</a></li>
      `;
    } else if (userGender === 'female') {
      wingsDrawerMenu = `
        <li><a href="/find-roommates.html?section=female" style="color: var(--girls-primary); font-weight: 700;">🌸 Girls Safe Wing (My Wing)</a></li>
      `;
    }

    if (drawerLinks) {
      drawerLinks.innerHTML = `
        <li><a href="/find-roommates.html" class="${currentPath.includes('find-roommates') ? 'active' : ''}">🔍 Find Roommates</a></li>
        ${wingsDrawerMenu}
        <li><a href="/find-roommates.html?view=rooms">🏠 Explore Rooms</a></li>
        <li><a href="/dashboard.html" class="${currentPath.includes('dashboard') ? 'active' : ''}">📊 Dashboard</a></li>
        <li><a href="/interests.html" class="${currentPath.includes('interests') ? 'active' : ''}">🤝 Interests</a></li>
        <li><a href="/profile.html" class="${currentPath.includes('profile') ? 'active' : ''}">👤 My Profile</a></li>
        <li><a href="/preferences.html">🎯 Desired Criteria</a></li>
        <li><a href="/settings.html">⚙️ Settings</a></li>
        ${user.role === 'admin' ? `<li><a href="/admin.html" style="color: #6366f1; font-weight: 700;">🛡️ Admin Portal</a></li>` : ''}
      `;
    }
    if (drawerFooter) {
      drawerFooter.innerHTML = `
        <div style="font-size: 0.85rem; color: var(--slate-600); margin-bottom: 0.25rem;">Signed in as <strong>${escapeHtml(user.full_name)}</strong></div>
        <button id="mobile-logout-btn" class="btn btn-outline btn-sm" style="width: 100%;">Log Out</button>
      `;
      document.getElementById('mobile-logout-btn')?.addEventListener('click', async () => {
        try {
          await window.api.auth.logout();
        } catch (err) {}
        window.location.href = '/login.html';
      });
    }
  } else {
    if (drawerLinks) {
      drawerLinks.innerHTML = `
        <li><a href="/find-roommates.html">🔍 Find Roommates</a></li>
        <li><a href="/find-roommates.html?view=rooms">🏠 Explore Rooms</a></li>
        <li><a href="/find-roommates.html?section=female" style="color: var(--girls-primary);">🌸 Girls Safe Wing</a></li>
        <li><a href="/find-roommates.html?section=male" style="color: var(--boys-primary);">⚡ Boys Living Wing</a></li>
        <li><a href="/index.html#how-it-works">💡 How It Works</a></li>
        <li><a href="/index.html#about-us">ℹ️ About Us</a></li>
        <li><a href="/index.html#features">🛡️ Safety & Features</a></li>
        <li><a href="/index.html#faq">❓ FAQ</a></li>
      `;
    }
    if (drawerFooter) {
      drawerFooter.innerHTML = `
        <a href="/login.html" class="btn btn-secondary btn-sm" style="width: 100%;">Log In</a>
        <a href="/register.html" class="btn btn-primary btn-sm" style="width: 100%;">Sign Up</a>
      `;
    }
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

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

document.addEventListener('DOMContentLoaded', () => {
  renderNavbar();
});

window.checkAuthState = checkAuthState;
window.requireAuthPage = requireAuthPage;
window.requireAdminPage = requireAdminPage;
