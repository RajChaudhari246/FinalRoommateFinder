/**
 * Roommate Discovery Script — JoinMyFlat Inspired PropTech Experience
 * Handles search, live filtering, wings, active filter chips, real-time sorting,
 * view toggles, skeleton states, and the authentic Express Interest workflow.
 */

let currentPage = 1;
let currentFilters = {};
let currentSort = 'compatibility';
let currentView = 'grid'; // 'grid' | 'list'
let selectedRoommate = null;
let currentSection = 'all'; // 'all', 'female', 'male'
let currentUser = null;
let sentInterestsMap = {}; // { [receiverUserId]: status }
let lastLoadedRoommates = [];

document.addEventListener('DOMContentLoaded', async () => {
  // 1. Fetch current auth state & existing sent interests
  currentUser = await checkAuthState();
  if (currentUser) {
    try {
      const interestsData = await window.api.interests.getSent();
      if (interestsData && interestsData.interests) {
        interestsData.interests.forEach(item => {
          sentInterestsMap[item.receiver_user_id] = item.status;
        });
      }
    } catch (e) {
      console.warn('Could not pre-load sent interests map:', e.message);
    }
  }

  // 2. Parse URL params (e.g. ?section=female or ?location=Karwand)
  const urlParams = new URLSearchParams(window.location.search);
  const sectionParam = urlParams.get('section') || (urlParams.get('gender') ? urlParams.get('gender').toLowerCase() : null);
  const locParam = urlParams.get('location');
  const minBParam = urlParams.get('minBudget');
  const maxBParam = urlParams.get('maxBudget');

  if (sectionParam === 'female' || sectionParam === 'girls') {
    currentSection = 'female';
  } else if (sectionParam === 'male' || sectionParam === 'boys') {
    currentSection = 'male';
  } else {
    currentSection = 'all';
  }

  if (locParam) {
    const locInput = document.getElementById('filter-location');
    const qLocInput = document.getElementById('quick-search-location');
    if (locInput) locInput.value = locParam;
    if (qLocInput) qLocInput.value = locParam;
    currentFilters.location = locParam;
  }
  if (minBParam) {
    const minInput = document.getElementById('filter-min-budget');
    if (minInput) minInput.value = minBParam;
    currentFilters.minBudget = minBParam;
  }
  if (maxBParam) {
    const maxInput = document.getElementById('filter-max-budget');
    if (maxInput) maxInput.value = maxBParam;
    currentFilters.maxBudget = maxBParam;
  }

  // 3. Setup UI tabs and dynamic filters
  updateSectionUI(currentSection);

  // 4. Setup Event Listeners
  setupEventListeners();

  // 5. Initial Load
  applyFilters(false);
});

function setupEventListeners() {
  const filterForm = document.getElementById('filter-form');
  const resetBtn = document.getElementById('reset-filters-btn');
  const btnQuickSearch = document.getElementById('btn-quick-search');
  const quickSearchInput = document.getElementById('quick-search-location');
  const sortSelect = document.getElementById('sort-by-select');
  const btnViewGrid = document.getElementById('btn-view-grid');
  const btnViewList = document.getElementById('btn-view-list');
  const clearAllChipsBtn = document.getElementById('btn-clear-all-chips');

  // Filter Form Submit
  filterForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    applyFilters(true);
  });

  // Reset Filters
  resetBtn?.addEventListener('click', () => {
    resetFilters();
  });

  clearAllChipsBtn?.addEventListener('click', () => {
    resetFilters();
  });

  // Quick Search Bar
  btnQuickSearch?.addEventListener('click', () => {
    const val = quickSearchInput?.value.trim() || '';
    const locInput = document.getElementById('filter-location');
    if (locInput) locInput.value = val;
    currentFilters.location = val;
    applyFilters(true);
  });

  quickSearchInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      btnQuickSearch?.click();
    }
  });

  // Sorting
  sortSelect?.addEventListener('change', (e) => {
    currentSort = e.target.value;
    if (lastLoadedRoommates && lastLoadedRoommates.length > 0) {
      sortAndRenderRoommates(lastLoadedRoommates);
    }
  });

  // Grid / List View Toggle
  btnViewGrid?.addEventListener('click', () => {
    currentView = 'grid';
    btnViewGrid.classList.add('active');
    btnViewList?.classList.remove('active');
    document.getElementById('discovery-content-area')?.classList.remove('view-list');
  });

  btnViewList?.addEventListener('click', () => {
    currentView = 'list';
    btnViewList.classList.add('active');
    btnViewGrid?.classList.remove('active');
    document.getElementById('discovery-content-area')?.classList.add('view-list');
  });

  // Mobile Filter Drawer
  setupMobileFilterDrawer();

  // Express Interest Modal
  setupInterestModal();
}

function switchSection(section) {
  currentSection = section;
  currentPage = 1;

  // Update URL without reload
  const newUrl = new URL(window.location.href);
  if (section === 'all') {
    newUrl.searchParams.delete('section');
    newUrl.searchParams.delete('gender');
  } else {
    newUrl.searchParams.set('section', section);
  }
  window.history.pushState({}, '', newUrl);

  updateSectionUI(section);
  applyFilters(true);
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

  tabAll?.classList.remove('active-all');
  tabGirls?.classList.remove('active-girls');
  tabBoys?.classList.remove('active-boys');

  if (section === 'female') {
    tabGirls?.classList.add('active-girls');
    if (pageHeading) pageHeading.innerHTML = '🌸 Girls Safe Wing <span style="font-size: 1rem; font-weight: 700; color: #be123c; margin-left: 0.5rem; vertical-align: middle;">Women\'s Verified Living Zone</span>';
    if (sidebarTitle) sidebarTitle.textContent = 'Girls Wing Safety Filters';
    if (sidebarSub) sidebarSub.textContent = 'Protected & Verified Roommate Criteria';

    if (bannerEl) {
      bannerEl.innerHTML = `
        <div class="section-notice-card section-notice-girls">
          <div>
            <h3>🛡️ Girls Section — Women's Verified Safe Living Space</h3>
            <p>Protected flatmate listings for female students and working professionals. Filter flatmates by male-visitor policies, society gate curfews, 24/7 security guard presence, and emergency contact readiness.</p>
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
        <div class="protocol-box protocol-box-girls" style="padding: 1rem; margin-bottom: 0.5rem;">
          <div class="protocol-header" style="margin-bottom: 0.75rem; padding-bottom: 0.4rem;">
            <div class="protocol-title" style="font-size: 0.925rem;">🌸 Safety & Guest Policies</div>
            <span class="protocol-badge" style="color: #be123c;">Security</span>
          </div>

          <div class="form-group" style="margin-bottom: 0.65rem;">
            <label class="form-label" style="font-size: 0.8rem;" for="filter-security-visitor">Visitor & Male Guest Policy</label>
            <select id="filter-security-visitor" class="form-control" style="font-size: 0.85rem; padding: 0.5rem;">
              <option value="">Any Policy</option>
              <option value="no-male-guests">Strictly No Male Guests (Women-Only)</option>
              <option value="female-friends-only">Female Friends Only (Daytime)</option>
              <option value="pre-informed-daytime">Pre-informed Day Guests Only</option>
            </select>
          </div>

          <div class="form-group" style="margin-bottom: 0.65rem;">
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
    if (pageHeading) pageHeading.innerHTML = '⚡ Boys Living Wing <span style="font-size: 1rem; font-weight: 700; color: #1d4ed8; margin-left: 0.5rem; vertical-align: middle;">Student & Bachelor Wing</span>';
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
        <div class="protocol-box protocol-box-boys" style="padding: 1rem; margin-bottom: 0.5rem;">
          <div class="protocol-header" style="margin-bottom: 0.75rem; padding-bottom: 0.4rem;">
            <div class="protocol-title" style="font-size: 0.925rem;">⚡ Living Harmony Protocol</div>
            <span class="protocol-badge" style="color: #1d4ed8;">Protocol</span>
          </div>

          <div class="form-group" style="margin-bottom: 0.65rem;">
            <label class="form-label" style="font-size: 0.8rem;" for="filter-security-visitor">Overnight Guests & Parties</label>
            <select id="filter-security-visitor" class="form-control" style="font-size: 0.85rem; padding: 0.5rem;">
              <option value="">Any Policy</option>
              <option value="no-overnight-guests">Quiet Study (Strictly No Overnight Guests)</option>
              <option value="weekend-friends-only">Weekend Friends with Notice</option>
              <option value="prior-consent">Prior Consent Allowed</option>
            </select>
          </div>

          <div class="form-group" style="margin-bottom: 0.65rem;">
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
        <span class="filter-section-title">🚻 Target Gender / Wing</span>
        <div class="form-group" style="margin-bottom: 0;">
          <select id="filter-gender-select" class="form-control" onchange="handleGenderSelectChange(this.value)">
            <option value="">All Genders & Community</option>
            <option value="Female">🌸 Girls Wing (Women's Safe Zone)</option>
            <option value="Male">⚡ Boys Wing (Men's Living Wing)</option>
          </select>
        </div>
      `;
    }
  }
}

function handleGenderSelectChange(val) {
  if (val === 'Female') switchSection('female');
  else if (val === 'Male') switchSection('male');
  else switchSection('all');
}

function selectQuickLocality(loc) {
  const locInput = document.getElementById('filter-location');
  const qLocInput = document.getElementById('quick-search-location');
  if (locInput) locInput.value = loc;
  if (qLocInput) qLocInput.value = loc;
  currentFilters.location = loc;
  applyFilters(true);
}

function setBudgetPreset(min, max) {
  const minInput = document.getElementById('filter-min-budget');
  const maxInput = document.getElementById('filter-max-budget');
  if (minInput) minInput.value = min || '';
  if (maxInput) maxInput.value = max || '';
  currentFilters.minBudget = min || '';
  currentFilters.maxBudget = max || '';
  applyFilters(true);
}

function resetFilters() {
  const filterForm = document.getElementById('filter-form');
  const quickSearchInput = document.getElementById('quick-search-location');
  filterForm?.reset();
  if (quickSearchInput) quickSearchInput.value = '';

  currentFilters = {};
  if (currentSection === 'female') currentFilters.gender = 'Female';
  if (currentSection === 'male') currentFilters.gender = 'Male';
  currentPage = 1;
  loadRoommates();
}

function applyFilters(shouldScroll = false) {
  const locVal = document.getElementById('filter-location')?.value.trim() ||
                 document.getElementById('quick-search-location')?.value.trim() || '';

  const minBVal = document.getElementById('filter-min-budget')?.value || '';
  const maxBVal = document.getElementById('filter-max-budget')?.value || '';

  // Validate budget range if both provided
  if (minBVal && maxBVal && parseFloat(maxBVal) < parseFloat(minBVal)) {
    alert('Maximum budget must be greater than or equal to minimum budget.');
    return;
  }

  currentFilters = {
    location: locVal,
    minBudget: minBVal,
    maxBudget: maxBVal,
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
  renderActiveFilterChips();
  loadRoommates(shouldScroll);
}

function renderActiveFilterChips() {
  const container = document.getElementById('active-filters-container');
  const chipsBox = document.getElementById('active-filter-chips');
  const mobileBadge = document.getElementById('mobile-filter-badge');

  if (!container || !chipsBox) return;

  const chips = [];

  if (currentFilters.location) {
    chips.push({ key: 'location', label: `📍 ${currentFilters.location}` });
  }
  if (currentFilters.minBudget && currentFilters.maxBudget) {
    chips.push({ key: 'budget', label: `💰 ₹${currentFilters.minBudget} - ₹${currentFilters.maxBudget}` });
  } else if (currentFilters.minBudget) {
    chips.push({ key: 'minBudget', label: `💰 Min ₹${currentFilters.minBudget}` });
  } else if (currentFilters.maxBudget) {
    chips.push({ key: 'maxBudget', label: `💰 Max ₹${currentFilters.maxBudget}` });
  }
  if (currentFilters.food) {
    chips.push({ key: 'food', label: `🥗 ${currentFilters.food}` });
  }
  if (currentFilters.smoking) {
    chips.push({ key: 'smoking', label: `🚭 ${currentFilters.smoking}` });
  }
  if (currentFilters.sleeping) {
    chips.push({ key: 'sleeping', label: `⏰ ${currentFilters.sleeping}` });
  }
  if (currentFilters.study) {
    chips.push({ key: 'study', label: `📚 ${currentFilters.study}` });
  }
  if (currentFilters.cleanliness) {
    chips.push({ key: 'cleanliness', label: `🧹 ${currentFilters.cleanliness}` });
  }
  if (currentFilters.roommateCount) {
    chips.push({ key: 'roommateCount', label: `👥 ${currentFilters.roommateCount} Roommate(s)` });
  }
  if (currentFilters.securityVisitorPolicy) {
    chips.push({ key: 'securityVisitorPolicy', label: `🔒 Guest Policy` });
  }
  if (currentFilters.securityCurfew) {
    chips.push({ key: 'securityCurfew', label: `⏰ Gate Timing` });
  }

  if (chips.length > 0) {
    container.style.display = 'block';
    chipsBox.innerHTML = chips.map(c => `
      <span class="filter-chip-removable">
        <span>${escapeHtml(c.label)}</span>
        <button type="button" onclick="removeFilterChip('${c.key}')" title="Remove filter" aria-label="Remove filter">&times;</button>
      </span>
    `).join('');
    if (mobileBadge) {
      mobileBadge.style.display = 'inline-block';
      mobileBadge.textContent = chips.length;
    }
  } else {
    container.style.display = 'none';
    chipsBox.innerHTML = '';
    if (mobileBadge) mobileBadge.style.display = 'none';
  }
}

function removeFilterChip(key) {
  if (key === 'location') {
    const locInput = document.getElementById('filter-location');
    const qLocInput = document.getElementById('quick-search-location');
    if (locInput) locInput.value = '';
    if (qLocInput) qLocInput.value = '';
    delete currentFilters.location;
  } else if (key === 'budget') {
    const minInput = document.getElementById('filter-min-budget');
    const maxInput = document.getElementById('filter-max-budget');
    if (minInput) minInput.value = '';
    if (maxInput) maxInput.value = '';
    delete currentFilters.minBudget;
    delete currentFilters.maxBudget;
  } else {
    const el = document.getElementById(`filter-${key}`);
    if (el) el.value = '';
    delete currentFilters[key];
  }

  renderActiveFilterChips();
  loadRoommates(false);
}

async function loadRoommates(shouldScroll = false) {
  const container = document.getElementById('roommates-list');
  const countEl = document.getElementById('results-count');
  const paginationEl = document.getElementById('pagination-bar');

  if (!container) return;

  // Render 6 PropTech Skeleton Cards while loading
  container.innerHTML = Array(6).fill(0).map(() => `
    <div class="skeleton-card">
      <div style="display: flex; gap: 0.85rem; align-items: center;">
        <div class="skeleton-shimmer skeleton-avatar"></div>
        <div style="flex: 1; display: flex; flex-direction: column; gap: 0.4rem;">
          <div class="skeleton-shimmer skeleton-line md"></div>
          <div class="skeleton-shimmer skeleton-line sm"></div>
        </div>
      </div>
      <div class="skeleton-shimmer skeleton-line" style="height: 2.2rem; border-radius: 8px;"></div>
      <div style="display: flex; gap: 0.4rem;">
        <div class="skeleton-shimmer skeleton-line badge"></div>
        <div class="skeleton-shimmer skeleton-line badge"></div>
      </div>
      <div class="skeleton-shimmer skeleton-line" style="height: 3rem;"></div>
      <div style="display: flex; gap: 0.5rem; margin-top: auto;">
        <div class="skeleton-shimmer skeleton-line" style="height: 2.25rem; flex: 1;"></div>
        <div class="skeleton-shimmer skeleton-line" style="height: 2.25rem; flex: 1.5;"></div>
      </div>
    </div>
  `).join('');

  try {
    const res = await window.api.roommates.search({
      ...currentFilters,
      page: currentPage,
      limit: 9
    });

    const roommates = res.roommates || [];
    lastLoadedRoommates = roommates;

    const sectionLabel = currentSection === 'female' ? 'Girls Safe Wing' : currentSection === 'male' ? 'Boys Living Wing' : 'All Wings';
    if (countEl) {
      countEl.innerHTML = `Showing <span>${res.count}</span> verified roommate${res.count === 1 ? '' : 's'} in ${sectionLabel}`;
    }

    if (roommates.length === 0) {
      container.innerHTML = `
        <div class="empty-state" style="grid-column: 1 / -1;">
          <div class="empty-state-icon">🔍</div>
          <h3>No matching roommates found in this criteria</h3>
          <p>
            Try widening your rent share budget, clearing security or lifestyle filters, or exploring all wings.
          </p>
          <div style="display: flex; gap: 0.75rem; justify-content: center; flex-wrap: wrap;">
            <button type="button" onclick="resetFilters()" class="btn btn-secondary btn-sm">Clear All Filters</button>
            <button type="button" onclick="switchSection('all')" class="btn btn-primary btn-sm">Browse All Roommates</button>
          </div>
        </div>
      `;
      if (paginationEl) paginationEl.innerHTML = '';
      return;
    }

    sortAndRenderRoommates(roommates);
    renderPagination(res.page, res.totalPages);

    if (shouldScroll) {
      document.querySelector('.discovery-toolbar')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

  } catch (err) {
    container.innerHTML = `
      <div class="alert alert-danger" style="grid-column: 1 / -1; justify-content: space-between;">
        <span>Failed to load roommate profiles: ${escapeHtml(err.message)}</span>
        <button type="button" onclick="loadRoommates()" class="btn btn-sm btn-secondary">Retry</button>
      </div>
    `;
  }
}

function sortAndRenderRoommates(roommates) {
  const container = document.getElementById('roommates-list');
  if (!container) return;

  const sorted = [...roommates];

  if (currentSort === 'compatibility') {
    sorted.sort((a, b) => {
      const scoreA = a.compatibility?.percentage ?? -1;
      const scoreB = b.compatibility?.percentage ?? -1;
      return scoreB - scoreA;
    });
  } else if (currentSort === 'budget-asc') {
    sorted.sort((a, b) => (parseFloat(a.min_budget) || 0) - (parseFloat(b.min_budget) || 0));
  } else if (currentSort === 'budget-desc') {
    sorted.sort((a, b) => (parseFloat(b.max_budget) || 0) - (parseFloat(a.max_budget) || 0));
  } else if (currentSort === 'newest') {
    sorted.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
  }

  container.innerHTML = sorted.map(r => renderRoommateCard(r)).join('');
}

function renderRoommateCard(r) {
  const isFemale = (r.gender || '').toLowerCase() === 'female';
  const isMale = (r.gender || '').toLowerCase() === 'male';

  // Section badge & card class
  let wingBadgeHtml = '';
  let cardClass = '';
  let avatarClass = 'avatar-default';

  if (isFemale) {
    wingBadgeHtml = '<span class="wing-badge wing-badge-girls">🌸 Girls Wing</span>';
    cardClass = 'card-female';
    avatarClass = 'avatar-female';
  } else if (isMale) {
    wingBadgeHtml = '<span class="wing-badge wing-badge-boys">⚡ Boys Wing</span>';
    cardClass = 'card-male';
    avatarClass = 'avatar-male';
  } else {
    wingBadgeHtml = '<span class="wing-badge wing-badge-all">🌐 Verified</span>';
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

  // Avatar Initials
  const initials = r.full_name
    ? r.full_name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
    : 'RF';

  // Security Highlights
  let securityChipsHtml = '';
  if (isFemale) {
    const visitorMap = {
      'no-male-guests': '🔒 No Male Guests',
      'female-friends-only': '🔒 Female Friends Only',
      'pre-informed-daytime': '👥 Pre-informed Day Guests',
      'open': '🔓 Open Guest Policy'
    };
    const curfewMap = {
      'strict-curfew': '⏰ Gate: 9:00 PM',
      'moderate-curfew': '⏰ Gate: 10:30 PM',
      'flexible': '⏰ Flexible Gate',
      'no-curfew': '⏰ 24/7 Gate'
    };
    const amenityMap = {
      'gated-cctv': '🛡️ 24/7 CCTV & Guard',
      'secure-lock': '🛡️ Biometric Lock',
      'safe-colony': '🛡️ Safe Colony'
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
      'no-overnight-guests': '📚 Quiet Study Only',
      'weekend-friends-only': '👥 Weekend Friends',
      'prior-consent': '👥 Prior Consent Guests',
      'open': '🔓 Open Living'
    };
    const quietMap = {
      'strict-curfew': '⏰ Silence: 10:30 PM',
      'moderate-curfew': '⏰ Headphones at Night',
      'night-owl': '🎮 Night-Owl Friendly',
      'flexible': '⏰ Flexible Routine'
    };
    const lockMap = {
      'strict-lock-discipline': '🔑 Door Lock Discipline',
      'cctv-parking': '🅿️ CCTV & Parking'
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

  // Highlights Reason list
  const highlights = match && match.highlights && match.highlights.length > 0
    ? match.highlights
    : [
        `Prefers ${r.cleanliness_preference} cleanliness`,
        `${r.study_schedule} study rhythm`
      ];

  // Express Interest Button Dynamic State
  const isSelf = currentUser && currentUser.id === r.user_id;
  const existingStatus = sentInterestsMap[r.user_id];

  let interestBtnHtml = '';
  if (isSelf) {
    interestBtnHtml = `<button type="button" class="btn btn-secondary btn-sm" disabled style="flex: 1.35; opacity: 0.65;">Your Profile</button>`;
  } else if (existingStatus === 'pending') {
    interestBtnHtml = `<button type="button" class="btn btn-secondary btn-sm" disabled style="flex: 1.35; color: var(--slate-700);">Request Sent ✓</button>`;
  } else if (existingStatus === 'accepted') {
    interestBtnHtml = `<a href="/interests.html" class="btn btn-teal btn-sm" style="flex: 1.35;">Connected 🤝</a>`;
  } else {
    interestBtnHtml = `<button type="button" id="btn-interest-${r.user_id}" onclick="openInterestModal(${r.user_id}, '${escapeHtml(r.full_name)}')" class="btn btn-primary btn-sm btn-card-interest">Express Interest</button>`;
  }

  return `
    <article class="roommate-card ${cardClass}" id="profile-card-${r.user_id}">
      <div class="roommate-card-accent"></div>

      <!-- Card Visual Header -->
      <div class="card-header-visual">
        <div class="avatar-meta-group">
          <div class="roommate-avatar ${avatarClass}">
            ${initials}
            <span class="avatar-verified-dot" title="Verified Member">✓</span>
          </div>
          <div class="roommate-name-block">
            <h3>${escapeHtml(r.full_name)}</h3>
            <span class="roommate-college-text">
              🏫 ${escapeHtml(r.college_or_workplace || (r.age ? `${r.age} yrs • Roommate` : 'Student / Working'))}
            </span>
          </div>
        </div>

        <div class="card-badges-column">
          ${wingBadgeHtml}
          <span class="compatibility-pill ${pillClass}">${pillText}</span>
        </div>
      </div>

      <!-- Card Body -->
      <div class="card-body">
        <div class="roommate-location">
          <span>📍</span>
          <span>${escapeHtml(r.preferred_location || r.city)} • ${escapeHtml(r.city)}</span>
        </div>

        <!-- Rent Share Price Box -->
        <div class="rent-share-box">
          <div>
            <div class="rent-share-amount">₹${Math.round(r.min_budget).toLocaleString('en-IN')} – ₹${Math.round(r.max_budget).toLocaleString('en-IN')}</div>
            <div class="rent-share-period">estimated monthly rent share</div>
          </div>
          <span class="rent-zero-brokerage">Zero Brokerage</span>
        </div>

        <!-- Security / Wing Policy Chips -->
        ${securityChipsHtml}

        <!-- Lifestyle Vibe Tags -->
        <div class="vibe-tag-list">
          <span class="vibe-tag" title="Dietary Preference">🥗 ${escapeHtml(r.food_preference)}</span>
          <span class="vibe-tag" title="Smoking Policy">🚭 ${escapeHtml(r.smoking_preference)}</span>
          <span class="vibe-tag" title="Sleep Routine">⏰ ${escapeHtml(r.sleeping_schedule)}</span>
          <span class="vibe-tag" title="Cleanliness Standard">🧹 ${escapeHtml(r.cleanliness_preference)}</span>
        </div>

        <!-- Compatibility Breakdown Excerpt -->
        <div class="highlights-box">
          <div class="highlights-box-header">
            <span>✨</span>
            <span>Compatibility Alignment</span>
          </div>
          <ul>
            ${highlights.map(h => `<li>${escapeHtml(h)}</li>`).join('')}
          </ul>
        </div>

        <p class="roommate-bio-text">
          ${r.about_me ? escapeHtml(r.about_me) : 'Looking for compatible roommates who share similar living standards, respect quiet hours, and value cleanliness.'}
        </p>

        <!-- Card Footer Actions -->
        <div class="roommate-actions">
          <a href="/roommate-details.html?id=${r.user_id}" class="btn btn-sm btn-card-profile">View Profile</a>
          ${interestBtnHtml}
        </div>
      </div>
    </article>
  `;
}

function renderPagination(page, totalPages) {
  const container = document.getElementById('pagination-bar');
  if (!container || totalPages <= 1) {
    if (container) container.innerHTML = '';
    return;
  }

  container.innerHTML = `
    <button type="button" class="btn btn-secondary btn-sm" ${page <= 1 ? 'disabled' : ''} onclick="goToPage(${page - 1})">
      ← Previous
    </button>
    <span style="font-size: 0.875rem; color: var(--slate-600); font-weight: 600;">
      Page ${page} of ${totalPages}
    </span>
    <button type="button" class="btn btn-secondary btn-sm" ${page >= totalPages ? 'disabled' : ''} onclick="goToPage(${page + 1})">
      Next →
    </button>
  `;
}

function goToPage(p) {
  currentPage = p;
  loadRoommates(true);
}

/* =====================================================================
   EXPRESS INTEREST WORKFLOW
   ===================================================================== */
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

    const messageInput = document.getElementById('interest-message');
    const message = messageInput?.value.trim() || 'Hi, I noticed our living habits and budgets align well. Would love to connect and coordinate shared housing!';
    const submitBtn = document.getElementById('submit-interest-btn');

    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="loading-spinner"></span> Sending Request...';

    try {
      await window.api.interests.send({
        receiver_user_id: selectedRoommate.id,
        message
      });

      // Update state & UI
      sentInterestsMap[selectedRoommate.id] = 'pending';
      const cardBtn = document.getElementById(`btn-interest-${selectedRoommate.id}`);
      if (cardBtn) {
        cardBtn.outerHTML = `<button type="button" class="btn btn-secondary btn-sm" disabled style="flex: 1.35; color: var(--slate-700);">Request Sent ✓</button>`;
      }

      alert(`Interest request sent successfully to ${selectedRoommate.name}! They will receive your notification.`);
      close();
    } catch (err) {
      if (err.status === 409) {
        sentInterestsMap[selectedRoommate.id] = 'pending';
        const cardBtn = document.getElementById(`btn-interest-${selectedRoommate.id}`);
        if (cardBtn) {
          cardBtn.outerHTML = `<button type="button" class="btn btn-secondary btn-sm" disabled style="flex: 1.35; color: var(--slate-700);">Request Sent ✓</button>`;
        }
      }
      alert(err.message || 'Could not express interest.');
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = 'Send Interest Request';
    }
  });
}

function setPresetMessage(msg) {
  const messageInput = document.getElementById('interest-message');
  if (messageInput) {
    messageInput.value = msg;
    messageInput.focus();
  }
}

function openInterestModal(userId, name) {
  window.checkAuthState().then(user => {
    if (!user) {
      window.location.href = `/login.html?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`;
      return;
    }
    if (user.id === userId) {
      alert('You cannot express interest in your own profile.');
      return;
    }
    selectedRoommate = { id: userId, name };
    const nameEl = document.getElementById('modal-target-name');
    if (nameEl) nameEl.textContent = name;
    document.getElementById('interest-modal')?.classList.add('open');
  });
}

/* =====================================================================
   MOBILE FILTER DRAWER
   ===================================================================== */
function setupMobileFilterDrawer() {
  const trigger = document.getElementById('btn-open-mobile-filter');
  const backdrop = document.getElementById('mobile-filter-backdrop');
  const closeBtn = document.getElementById('btn-close-mobile-filter');
  const applyBtn = document.getElementById('btn-mobile-apply');
  const resetBtn = document.getElementById('btn-mobile-reset');
  const target = document.getElementById('mobile-filter-container-target');
  const desktopForm = document.getElementById('filter-form');

  if (!trigger || !backdrop) return;

  trigger.addEventListener('click', () => {
    // Clone desktop form content for mobile
    if (desktopForm && target && target.children.length === 0) {
      target.appendChild(desktopForm);
    }
    backdrop.classList.add('open');
  });

  const closeDrawer = () => {
    // Restore form back to desktop filter card if window resizes
    const desktopCard = document.getElementById('desktop-filter-card');
    if (desktopCard && desktopForm && !desktopCard.contains(desktopForm)) {
      desktopCard.appendChild(desktopForm);
    }
    backdrop.classList.remove('open');
  };

  closeBtn?.addEventListener('click', closeDrawer);
  backdrop.addEventListener('click', (e) => {
    if (e.target === backdrop) closeDrawer();
  });

  applyBtn?.addEventListener('click', () => {
    applyFilters(true);
    closeDrawer();
  });

  resetBtn?.addEventListener('click', () => {
    resetFilters();
    closeDrawer();
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
window.selectQuickLocality = selectQuickLocality;
window.setBudgetPreset = setBudgetPreset;
window.removeFilterChip = removeFilterChip;
window.resetFilters = resetFilters;
window.openInterestModal = openInterestModal;
window.setPresetMessage = setPresetMessage;
window.goToPage = goToPage;
window.handleGenderSelectChange = handleGenderSelectChange;
