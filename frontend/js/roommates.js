/**
 * Roommate Discovery Script
 * Handles live multi-filter searching, dedicated Girls and Boys wings,
 * gender-specific safety/living questionnaires, and compatibility highlights.
 */

let currentPage = 1;
let currentFilters = {};
let selectedRoommate = null;
let currentSection = 'all'; // 'all', 'female', 'male'

document.addEventListener('DOMContentLoaded', async () => {
  await checkAuthState();

  // Check URL params for deep-linked section
  const urlParams = new URLSearchParams(window.location.search);
  const sectionParam = urlParams.get('section') || (urlParams.get('gender') ? urlParams.get('gender').toLowerCase() : null);

  if (sectionParam === 'female' || sectionParam === 'girls') {
    currentSection = 'female';
  } else if (sectionParam === 'male' || sectionParam === 'boys') {
    currentSection = 'male';
  } else {
    currentSection = 'all';
  }

  // Setup UI tabs and dynamic filters
  updateSectionUI(currentSection);

  // Setup Filter Form Listeners
  const filterForm = document.getElementById('filter-form');
  const resetBtn = document.getElementById('reset-filters-btn');

  filterForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    applyFilters();
  });

  resetBtn?.addEventListener('click', () => {
    filterForm.reset();
    currentFilters = {};
    if (currentSection === 'female') currentFilters.gender = 'Female';
    if (currentSection === 'male') currentFilters.gender = 'Male';
    currentPage = 1;
    loadRoommates();
  });

  // Setup Modal Listeners
  setupInterestModal();

  // Initial Load
  loadRoommates();
});

function switchSection(section) {
  currentSection = section;
  currentPage = 1;

  // Update browser URL query param cleanly without reloading
  const newUrl = new URL(window.location.href);
  if (section === 'all') {
    newUrl.searchParams.delete('section');
    newUrl.searchParams.delete('gender');
  } else {
    newUrl.searchParams.set('section', section);
  }
  window.history.pushState({}, '', newUrl);

  updateSectionUI(section);
  applyFilters();
}

function updateSectionUI(section) {
  const tabAll = document.getElementById('tab-all');
  const tabGirls = document.getElementById('tab-girls');
  const tabBoys = document.getElementById('tab-boys');
  const bannerEl = document.getElementById('section-notice-banner');
  const pageHeading = document.getElementById('page-heading');
  const sidebarTitle = document.getElementById('filter-sidebar-title');
  const sidebarSub = document.getElementById('filter-sidebar-subtitle');
  const dynamicFilterBox = document.getElementById('dynamic-security-filters');

  // Reset tab active classes
  tabAll?.classList.remove('active-all');
  tabGirls?.classList.remove('active-girls');
  tabBoys?.classList.remove('active-boys');

  if (section === 'female') {
    tabGirls?.classList.add('active-girls');
    if (pageHeading) pageHeading.innerHTML = '🌸 Girls Section <span style="font-size: 1.15rem; font-weight: 600; color: #be123c; margin-left: 0.5rem; vertical-align: middle;">Women\'s Safe Living Zone</span>';
    if (sidebarTitle) sidebarTitle.textContent = 'Girls Wing Safety Filters';
    if (sidebarSub) sidebarSub.textContent = 'Protected & Verified Roommate Criteria';

    if (bannerEl) {
      bannerEl.innerHTML = `
        <div class="section-notice-card section-notice-girls">
          <div>
            <h3>🛡️ Girls Section — Women's Verified Safe Living Space</h3>
            <p>Protected accommodation listings for female students and working professionals. Filter flatmates by male-visitor policies, society gate curfews, 24/7 security guard presence, and emergency contact readiness.</p>
            <div class="section-notice-pills">
              <span>🔒 Zero Unauthorized Male Visitors</span>
              <span>⏰ Transparent Gate/Curfew Hours</span>
              <span>🛡️ 24/7 Gated Societies & CCTV</span>
              <span>📞 Guardian Contact Verified</span>
            </div>
          </div>
        </div>
      `;
    }

    if (dynamicFilterBox) {
      dynamicFilterBox.innerHTML = `
        <div class="protocol-box protocol-box-girls" style="padding: 1rem; margin-bottom: 1rem;">
          <div class="protocol-header" style="margin-bottom: 0.75rem; padding-bottom: 0.4rem;">
            <div class="protocol-title" style="font-size: 0.95rem;">🌸 Safety & Guest Policies</div>
            <span class="protocol-badge" style="color: #be123c;">Security</span>
          </div>

          <div class="form-group" style="margin-bottom: 0.75rem;">
            <label class="form-label" style="font-size: 0.8rem;" for="filter-security-visitor">Visitor & Male Guest Policy</label>
            <select id="filter-security-visitor" class="form-control" style="font-size: 0.85rem; padding: 0.5rem;">
              <option value="">Any Policy</option>
              <option value="no-male-guests">Strictly No Male Guests (Women-Only)</option>
              <option value="female-friends-only">Female Friends Only (Daytime)</option>
              <option value="pre-informed-daytime">Pre-informed Day Guests Only</option>
            </select>
          </div>

          <div class="form-group" style="margin-bottom: 0.75rem;">
            <label class="form-label" style="font-size: 0.8rem;" for="filter-security-curfew">Society Gate / Curfew Timing</label>
            <select id="filter-security-curfew" class="form-control" style="font-size: 0.85rem; padding: 0.5rem;">
              <option value="">Any Timing</option>
              <option value="strict-curfew">Strict Gate Timing (Back by 9:00 PM)</option>
              <option value="moderate-curfew">Moderate Timing (Back by 10:30 PM)</option>
              <option value="flexible">Flexible / Shift Timing (11:00 PM+)</option>
            </select>
          </div>

          <div class="form-group" style="margin-bottom: 0;">
            <label class="form-label" style="font-size: 0.8rem;" for="filter-security-amenities">Building & Society Security</label>
            <select id="filter-security-amenities" class="form-control" style="font-size: 0.85rem; padding: 0.5rem;">
              <option value="">Any Amenities</option>
              <option value="gated-cctv">24/7 Guarded Society & CCTV</option>
              <option value="secure-lock">Keypad / Biometric Door Lock</option>
              <option value="safe-colony">Safe Well-Lit Colony</option>
            </select>
          </div>
        </div>
      `;
    }

  } else if (section === 'male') {
    tabBoys?.classList.add('active-boys');
    if (pageHeading) pageHeading.innerHTML = '⚡ Boys Section <span style="font-size: 1.15rem; font-weight: 600; color: #1d4ed8; margin-left: 0.5rem; vertical-align: middle;">Student & Pro Living Wing</span>';
    if (sidebarTitle) sidebarTitle.textContent = 'Boys Wing Living Filters';
    if (sidebarSub) sidebarSub.textContent = 'Living Protocol & Flat Harmony';

    if (bannerEl) {
      bannerEl.innerHTML = `
        <div class="section-notice-card section-notice-boys">
          <div>
            <h3>⚡ Boys Section — Men's Student & Professional Living Wing</h3>
            <p>Focused living spaces for male college students and working bachelors. Find flatmates based on study-first environments, quiet hours, responsible door lock custody, and transparent UPI bill splitting.</p>
            <div class="section-notice-pills">
              <span>📚 Quiet Study & Non-Party Options</span>
              <span>🔑 Main Door & Key Custody Protocol</span>
              <span>⏰ Late Study / Quiet Hours Agreement</span>
              <span>💳 Prompt UPI Bill Splitting</span>
            </div>
          </div>
        </div>
      `;
    }

    if (dynamicFilterBox) {
      dynamicFilterBox.innerHTML = `
        <div class="protocol-box protocol-box-boys" style="padding: 1rem; margin-bottom: 1rem;">
          <div class="protocol-header" style="margin-bottom: 0.75rem; padding-bottom: 0.4rem;">
            <div class="protocol-title" style="font-size: 0.95rem;">⚡ Living Harmony Protocol</div>
            <span class="protocol-badge" style="color: #1d4ed8;">Protocol</span>
          </div>

          <div class="form-group" style="margin-bottom: 0.75rem;">
            <label class="form-label" style="font-size: 0.8rem;" for="filter-security-visitor">Overnight Guests & Parties</label>
            <select id="filter-security-visitor" class="form-control" style="font-size: 0.85rem; padding: 0.5rem;">
              <option value="">Any Policy</option>
              <option value="no-overnight-guests">Quiet Study (Strictly No Overnight Guests)</option>
              <option value="weekend-friends-only">Weekend Friends with Notice</option>
              <option value="prior-consent">Prior Consent Allowed</option>
            </select>
          </div>

          <div class="form-group" style="margin-bottom: 0.75rem;">
            <label class="form-label" style="font-size: 0.8rem;" for="filter-security-curfew">Quiet Hours & Night Discipline</label>
            <select id="filter-security-curfew" class="form-control" style="font-size: 0.85rem; padding: 0.5rem;">
              <option value="">Any Rhythm</option>
              <option value="strict-curfew">Strict Silence After 10:30 PM (Early Sleep)</option>
              <option value="moderate-curfew">Moderate (Headphones required at night)</option>
              <option value="night-owl">Late Night Gaming/Coding Friendly</option>
            </select>
          </div>

          <div class="form-group" style="margin-bottom: 0;">
            <label class="form-label" style="font-size: 0.8rem;" for="filter-security-amenities">Flat Security & Key Custody</label>
            <select id="filter-security-amenities" class="form-control" style="font-size: 0.85rem; padding: 0.5rem;">
              <option value="">Any Standard</option>
              <option value="strict-lock-discipline">Strict Door Lock & Key Discipline</option>
              <option value="cctv-parking">CCTV & Vehicle/Bike Parking</option>
            </select>
          </div>
        </div>
      `;
    }

  } else {
    tabAll?.classList.add('active-all');
    if (pageHeading) pageHeading.textContent = 'Discover Roommates';
    if (sidebarTitle) sidebarTitle.textContent = 'Filter Roommates';
    if (sidebarSub) sidebarSub.textContent = 'All Verified Community Listings';
    if (bannerEl) bannerEl.innerHTML = '';

    if (dynamicFilterBox) {
      dynamicFilterBox.innerHTML = `
        <div class="form-group" style="margin-bottom: 1rem;">
          <label class="form-label" for="filter-gender-select">Target Gender / Section</label>
          <select id="filter-gender-select" class="form-control" onchange="if(this.value === 'Female') switchSection('female'); else if(this.value === 'Male') switchSection('male');">
            <option value="">All Genders & Community</option>
            <option value="Female">🌸 Girls Section (Women's Safe Zone)</option>
            <option value="Male">⚡ Boys Section (Men's Living Wing)</option>
          </select>
        </div>
      `;
    }
  }
}

function applyFilters() {
  currentFilters = {
    location: document.getElementById('filter-location')?.value.trim() || '',
    minBudget: document.getElementById('filter-min-budget')?.value || '',
    maxBudget: document.getElementById('filter-max-budget')?.value || '',
    food: document.getElementById('filter-food')?.value || '',
    smoking: document.getElementById('filter-smoking')?.value || '',
    study: document.getElementById('filter-study')?.value || '',
    sleeping: document.getElementById('filter-sleeping')?.value || '',
    cleanliness: document.getElementById('filter-cleanliness')?.value || '',
    roommateCount: document.getElementById('filter-roommates')?.value || '',
    securityVisitorPolicy: document.getElementById('filter-security-visitor')?.value || '',
    securityCurfew: document.getElementById('filter-security-curfew')?.value || '',
    securityAmenities: document.getElementById('filter-security-amenities')?.value || ''
  };

  if (currentSection === 'female') {
    currentFilters.gender = 'Female';
  } else if (currentSection === 'male') {
    currentFilters.gender = 'Male';
  } else {
    const selGender = document.getElementById('filter-gender-select')?.value;
    if (selGender) currentFilters.gender = selGender;
  }

  currentPage = 1;
  loadRoommates();
}

async function loadRoommates() {
  const container = document.getElementById('roommates-list');
  const countEl = document.getElementById('results-count');
  const paginationEl = document.getElementById('pagination-bar');

  if (!container) return;

  container.innerHTML = `
    <div style="grid-column: 1 / -1; text-align: center; padding: 4rem 1rem;">
      <div class="loading-spinner" style="width: 2.25rem; height: 2.25rem; border-color: var(--primary-600); border-top-color: transparent;"></div>
      <p style="margin-top: 1rem; color: var(--slate-500); font-weight: 500;">Searching compatible roommates...</p>
    </div>
  `;

  try {
    const res = await window.api.roommates.search({
      ...currentFilters,
      page: currentPage,
      limit: 9
    });

    const roommates = res.roommates || [];
    const sectionLabel = currentSection === 'female' ? 'girls safe space' : currentSection === 'male' ? 'boys living wing' : 'community';
    if (countEl) countEl.textContent = `${res.count} profiles found in ${sectionLabel}`;

    if (roommates.length === 0) {
      container.innerHTML = `
        <div class="empty-state" style="grid-column: 1 / -1; padding: 3.5rem 1rem; text-align: center; background: #ffffff; border-radius: var(--radius-lg); border: var(--border-light);">
          <div class="empty-state-icon" style="font-size: 3rem; margin-bottom: 1rem;">🔍</div>
          <h3 style="font-size: 1.35rem; margin-bottom: 0.5rem;">No matching roommates found in this section</h3>
          <p style="color: var(--slate-500); max-width: 500px; margin: 0 auto 1.5rem auto;">
            Try clearing security/lifestyle filters, widening your rent budget, or exploring the other living wings.
          </p>
          <div style="display: flex; gap: 0.75rem; justify-content: center; flex-wrap: wrap;">
            <button onclick="document.getElementById('reset-filters-btn').click()" class="btn btn-secondary btn-sm">Clear Filters</button>
            <button onclick="switchSection('all')" class="btn btn-outline btn-sm">Browse All Roommates</button>
          </div>
        </div>
      `;
      if (paginationEl) paginationEl.innerHTML = '';
      return;
    }

    container.innerHTML = roommates.map(r => renderRoommateCard(r)).join('');
    renderPagination(res.page, res.totalPages);

  } catch (err) {
    container.innerHTML = `<div class="alert alert-danger" style="grid-column: 1 / -1;">Failed to load roommate profiles: ${err.message}</div>`;
  }
}

function renderRoommateCard(r) {
  const isFemale = (r.gender || '').toLowerCase() === 'female';
  const isMale = (r.gender || '').toLowerCase() === 'male';

  // Section badge
  let wingBadgeHtml = '';
  let cardClass = '';
  if (isFemale) {
    wingBadgeHtml = '<span class="wing-badge wing-badge-girls">🌸 Girls Wing • Safe Zone</span>';
    cardClass = 'card-female';
  } else if (isMale) {
    wingBadgeHtml = '<span class="wing-badge wing-badge-boys">⚡ Boys Wing • Living Space</span>';
    cardClass = 'card-male';
  } else {
    wingBadgeHtml = '<span class="wing-badge wing-badge-all">🌐 Verified Roommate</span>';
  }

  // Compatibility Pill
  const match = r.compatibility;
  const matchScore = match ? match.percentage : null;

  let pillClass = 'pill-none';
  let pillText = 'Sign in to match';

  if (matchScore !== null) {
    if (matchScore >= 80) pillClass = 'pill-high';
    else if (matchScore >= 60) pillClass = 'pill-med';
    else pillClass = 'pill-low';
    pillText = `⚡ ${matchScore}% Match`;
  }

  // Security badges
  let securityChipsHtml = '';
  if (isFemale) {
    const visitorMap = {
      'no-male-guests': '🔒 Strictly No Male Guests',
      'female-friends-only': '🔒 Female Friends Only',
      'pre-informed-daytime': '👥 Pre-informed Day Visitors',
      'open': '🔓 Open Guest Policy'
    };
    const curfewMap = {
      'strict-curfew': '⏰ Gate: 9:00 PM',
      'moderate-curfew': '⏰ Gate: 10:30 PM',
      'flexible': '⏰ Flexible In-Time',
      'no-curfew': '⏰ 24/7 Gate Access'
    };
    const amenityMap = {
      'gated-cctv': '🛡️ 24/7 CCTV & Guard',
      'secure-lock': '🛡️ Keypad/Biometric Lock',
      'safe-colony': '🛡️ Safe Residential Colony'
    };

    const visitorTag = visitorMap[r.security_visitor_policy];
    const curfewTag = curfewMap[r.security_curfew];
    const amenityTag = amenityMap[r.security_amenities];

    securityChipsHtml = `
      <div class="security-highlights-container">
        ${visitorTag ? `<span class="sec-chip safe-alert">${visitorTag}</span>` : ''}
        ${curfewTag ? `<span class="sec-chip safe-alert">${curfewTag}</span>` : ''}
        ${amenityTag ? `<span class="sec-chip safe-alert">${amenityTag}</span>` : ''}
      </div>
    `;
  } else if (isMale) {
    const guestMap = {
      'no-overnight-guests': '📚 Strict Quiet Study Space',
      'weekend-friends-only': '👥 Weekend Friends Permitted',
      'prior-consent': '👥 Consent-Based Guests',
      'open': '🔓 Open Living Space'
    };
    const quietMap = {
      'strict-curfew': '⏰ Silence: 10:30 PM',
      'moderate-curfew': '⏰ Headphones at Night',
      'night-owl': '🎮 Night-Owl Friendly',
      'flexible': '⏰ Flexible Routine'
    };
    const lockMap = {
      'strict-lock-discipline': '🔑 Door Lock Discipline',
      'cctv-parking': '🅿️ CCTV & Parking Space'
    };

    const guestTag = guestMap[r.security_visitor_policy];
    const quietTag = quietMap[r.security_curfew];
    const lockTag = lockMap[r.security_amenities];

    securityChipsHtml = `
      <div class="security-highlights-container">
        ${guestTag ? `<span class="sec-chip harmony-alert">${guestTag}</span>` : ''}
        ${quietTag ? `<span class="sec-chip harmony-alert">${quietTag}</span>` : ''}
        ${lockTag ? `<span class="sec-chip harmony-alert">${lockTag}</span>` : ''}
      </div>
    `;
  }

  const highlights = match && match.highlights && match.highlights.length > 0
    ? match.highlights
    : [
        `Prefers ${r.cleanliness_preference} cleanliness`,
        `${r.study_schedule} study rhythm`
      ];

  return `
    <div class="roommate-card ${cardClass}">
      <div class="roommate-card-topbar">
        ${wingBadgeHtml}
        <span class="compatibility-pill ${pillClass}">${pillText}</span>
      </div>

      <div class="roommate-card-header">
        <div class="roommate-name-meta">
          <h3>${escapeHtml(r.full_name)}</h3>
          <p>📍 ${escapeHtml(r.city)} • ${escapeHtml(r.preferred_location || 'Area not set')} ${r.age ? `• ${r.age} yrs` : ''}</p>
        </div>
      </div>

      <div class="budget-chip">
        💰 ₹${Math.round(r.min_budget)} - ₹${Math.round(r.max_budget)} / month
      </div>

      ${securityChipsHtml}

      <div class="tag-list">
        <span class="tag">🥗 ${escapeHtml(r.food_preference)}</span>
        <span class="tag">🚭 ${escapeHtml(r.smoking_preference)}</span>
        <span class="tag">⏰ ${escapeHtml(r.sleeping_schedule)}</span>
        <span class="tag">🧹 ${escapeHtml(r.cleanliness_preference)}</span>
      </div>

      <div class="highlights-box">
        <strong>Compatibility Highlights:</strong>
        <ul>
          ${highlights.map(h => `<li>${escapeHtml(h)}</li>`).join('')}
        </ul>
      </div>

      <p style="font-size: 0.85rem; color: var(--slate-600); margin-bottom: 1.25rem; line-height: 1.5;">
        ${r.about_me ? escapeHtml(r.about_me.substring(0, 115)) + (r.about_me.length > 115 ? '...' : '') : 'Looking for compatible roommates with shared living standards.'}
      </p>

      <div class="roommate-actions">
        <a href="/roommate-details.html?id=${r.user_id}" class="btn btn-secondary btn-sm" style="flex: 1;">View Profile</a>
        <button onclick="openInterestModal(${r.user_id}, '${escapeHtml(r.full_name)}')" class="btn btn-primary btn-sm" style="flex: 1;">Express Interest</button>
      </div>
    </div>
  `;
}

function renderPagination(page, totalPages) {
  const container = document.getElementById('pagination-bar');
  if (!container || totalPages <= 1) {
    if (container) container.innerHTML = '';
    return;
  }

  let html = `
    <button class="btn btn-secondary btn-sm" ${page <= 1 ? 'disabled' : ''} onclick="goToPage(${page - 1})">← Previous</button>
    <span style="font-size: 0.875rem; color: var(--slate-600); font-weight: 500;">Page ${page} of ${totalPages}</span>
    <button class="btn btn-secondary btn-sm" ${page >= totalPages ? 'disabled' : ''} onclick="goToPage(${page + 1})">Next →</button>
  `;
  container.innerHTML = html;
}

function goToPage(p) {
  currentPage = p;
  loadRoommates();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* Express Interest Modal */
function setupInterestModal() {
  const backdrop = document.getElementById('interest-modal');
  const closeBtn = document.getElementById('close-interest-modal');
  const cancelBtn = document.getElementById('cancel-interest-btn');
  const form = document.getElementById('send-interest-form');

  const close = () => {
    backdrop?.classList.remove('open');
    form?.reset();
    selectedRoommate = null;
  };

  closeBtn?.addEventListener('click', close);
  cancelBtn?.addEventListener('click', close);
  backdrop?.addEventListener('click', (e) => {
    if (e.target === backdrop) close();
  });

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!selectedRoommate) return;

    const message = document.getElementById('interest-message')?.value.trim();
    const btn = document.getElementById('submit-interest-btn');

    btn.disabled = true;
    btn.innerHTML = '<span class="loading-spinner"></span> Sending...';

    try {
      await window.api.interests.send({
        receiver_user_id: selectedRoommate.id,
        message: message || 'Hi, I noticed our living habits and budgets align well. Would love to connect and coordinate shared housing!'
      });
      alert(`Interest request sent successfully to ${selectedRoommate.name}!`);
      close();
    } catch (err) {
      alert(err.message || 'Could not express interest.');
    } finally {
      btn.disabled = false;
      btn.innerHTML = 'Send Interest Request';
    }
  });
}

function openInterestModal(userId, name) {
  window.checkAuthState().then(user => {
    if (!user) {
      window.location.href = `/login.html?redirect=${encodeURIComponent(window.location.pathname)}`;
      return;
    }
    selectedRoommate = { id: userId, name };
    const nameEl = document.getElementById('modal-target-name');
    if (nameEl) nameEl.textContent = name;
    document.getElementById('interest-modal')?.classList.add('open');
  });
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

window.switchSection = switchSection;
window.openInterestModal = openInterestModal;
window.goToPage = goToPage;
