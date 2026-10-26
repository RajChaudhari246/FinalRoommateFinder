/**
 * Rule-Based Roommate Compatibility Engine
 * Calculates a transparent, explainable compatibility score (0-100%)
 * based on weighted comparison of user preferences and candidate profiles.
 *
 * Weights (Total 100%):
 * - Budget: 25%
 * - Location: 20%
 * - Food: 10%
 * - Smoking: 10%
 * - Study/Work Schedule: 10%
 * - Sleeping Schedule: 10%
 * - Cleanliness: 10%
 * - Lifestyle / Roommate Count: 5%
 */

const DEFAULT_WEIGHTS = {
  budget: 25,
  location: 20,
  food: 10,
  smoking: 10,
  study: 10,
  sleeping: 10,
  cleanliness: 10,
  lifestyle: 5
};

/**
 * Normalize text for string comparison (lowercase, trimmed, special chars stripped)
 */
function normalize(str) {
  if (!str || typeof str !== 'string') return '';
  return str.toLowerCase().replace(/[^a-z0-9]/g, ' ').replace(/\s+/g, ' ').trim();
}

/**
 * Calculate overlap score between two numeric ranges [minA, maxA] and [minB, maxB]
 */
function calculateBudgetCompatibility(minPref, maxPref, minCandidate, maxCandidate) {
  if (minCandidate === null || minCandidate === undefined || maxCandidate === null || maxCandidate === undefined) {
    return { score: 0.5, status: 'neutral', reason: 'Candidate has not specified a budget range.' };
  }

  const pMin = parseFloat(minPref);
  const pMax = parseFloat(maxPref);
  const cMin = parseFloat(minCandidate);
  const cMax = parseFloat(maxCandidate);

  if (isNaN(pMin) || isNaN(pMax) || isNaN(cMin) || isNaN(cMax)) {
    return { score: 0.5, status: 'neutral', reason: 'Budget information incomplete.' };
  }

  const overlapStart = Math.max(pMin, cMin);
  const overlapEnd = Math.min(pMax, cMax);
  const overlap = overlapEnd - overlapStart;

  if (overlap >= 0) {
    const prefSpan = Math.max(1, pMax - pMin);
    const candSpan = Math.max(1, cMax - cMin);
    const smallerSpan = Math.min(prefSpan, candSpan);
    const overlapRatio = Math.min(1.0, overlap / smallerSpan);

    if (overlapRatio >= 0.7) {
      return {
        score: 1.0,
        status: 'positive',
        reason: `Budgets overlap strongly ($${Math.round(overlapStart)} - $${Math.round(overlapEnd)}).`
      };
    } else {
      return {
        score: 0.8,
        status: 'positive',
        reason: `Budgets partially overlap ($${Math.round(overlapStart)} - $${Math.round(overlapEnd)}).`
      };
    }
  }

  // Distance gap calculation
  const gap = cMin > pMax ? cMin - pMax : pMin - cMax;
  const avgBudget = (pMax + cMax) / 2 || 1000;
  const gapPercent = gap / avgBudget;

  if (gapPercent <= 0.15) {
    return {
      score: 0.4,
      status: 'neutral',
      reason: `Budgets are close, with a modest difference of ~$${Math.round(gap)}.`
    };
  }

  return {
    score: 0.1,
    status: 'negative',
    reason: `Budgets do not align (difference of ~$${Math.round(gap)}).`
  };
}

/**
 * Compare location strings
 */
function calculateLocationCompatibility(prefLoc, userCity, candLoc, candCity) {
  const normPrefLoc = normalize(prefLoc);
  const normUserCity = normalize(userCity);
  const normCandLoc = normalize(candLoc);
  const normCandCity = normalize(candCity);

  if (!normPrefLoc && !normUserCity && !normCandLoc && !normCandCity) {
    return { score: 0.5, status: 'neutral', reason: 'No location details provided.' };
  }

  // Exact city match
  const cityMatch = normUserCity && normCandCity && normUserCity === normCandCity;

  // Substring match in preferred location keywords
  const prefTokens = normPrefLoc.split(' ').filter(t => t.length > 2);
  const candTokens = normCandLoc.split(' ').filter(t => t.length > 2);

  const sharedTokens = prefTokens.filter(t => candTokens.includes(t));
  const hasAreaOverlap = sharedTokens.length > 0 || (normPrefLoc && normCandLoc && (normPrefLoc.includes(normCandLoc) || normCandLoc.includes(normPrefLoc)));

  if (cityMatch && hasAreaOverlap) {
    return {
      score: 1.0,
      status: 'positive',
      reason: `Matching city (${candCity}) and shared target neighborhood.`
    };
  }

  if (cityMatch) {
    return {
      score: 0.85,
      status: 'positive',
      reason: `Located in the same city (${candCity}).`
    };
  }

  if (hasAreaOverlap) {
    return {
      score: 0.7,
      status: 'positive',
      reason: 'Targeting overlapping areas or neighboring districts.'
    };
  }

  return {
    score: 0.2,
    status: 'negative',
    reason: `Different preferred locations (${candCity || 'other city'}).`
  };
}

/**
 * Compare dietary habits
 */
function calculateFoodCompatibility(prefFood, candFood) {
  const p = (prefFood || 'any').toLowerCase();
  const c = (candFood || 'any').toLowerCase();

  if (p === 'any' || c === 'any') {
    return { score: 1.0, status: 'positive', reason: 'Food preferences are open and compatible.' };
  }
  if (p === c) {
    return { score: 1.0, status: 'positive', reason: `Both prefer ${p} diet.` };
  }
  if ((p === 'vegan' && c === 'vegetarian') || (p === 'vegetarian' && c === 'vegan')) {
    return { score: 0.8, status: 'positive', reason: 'Plant-forward dietary preferences align well.' };
  }

  return {
    score: 0.4,
    status: 'neutral',
    reason: `Different diets (${p} vs ${c}), which may require separate kitchen storage or cookware.`
  };
}

/**
 * Compare smoking preference
 */
function calculateSmokingCompatibility(prefSmoking, candSmoking) {
  const p = (prefSmoking || 'any').toLowerCase();
  const c = (candSmoking || 'non-smoker').toLowerCase();

  if (p === 'any') {
    return { score: 1.0, status: 'positive', reason: 'Open smoking preference policy.' };
  }
  if (p === c) {
    return { score: 1.0, status: 'positive', reason: `Identical smoking habits (${p}).` };
  }
  if (p === 'non-smoker' && c === 'outside-only') {
    return { score: 0.6, status: 'neutral', reason: 'Candidate smokes only outside; common indoor areas stay smoke-free.' };
  }
  if (p === 'non-smoker' && c === 'smoker') {
    return { score: 0.1, status: 'negative', reason: 'Smoking habits conflict (non-smoker vs indoor smoker).' };
  }

  return { score: 0.7, status: 'neutral', reason: `Smoking preference: ${c}.` };
}

/**
 * Compare study/work schedules
 */
function calculateStudyCompatibility(prefStudy, candStudy) {
  const p = (prefStudy || 'flexible').toLowerCase();
  const c = (candStudy || 'flexible').toLowerCase();

  if (p === 'flexible' || c === 'flexible') {
    return { score: 1.0, status: 'positive', reason: 'Flexible study/work schedules prevent routine conflicts.' };
  }
  if (p === c) {
    return { score: 1.0, status: 'positive', reason: `Both share a ${p} study/work schedule.` };
  }
  if ((p === 'morning' && c === 'afternoon') || (p === 'afternoon' && c === 'late-night')) {
    return { score: 0.7, status: 'neutral', reason: 'Adjacent study hours allow easy accommodation.' };
  }

  return { score: 0.4, status: 'neutral', reason: `Different study hours (${p} vs ${c}).` };
}

/**
 * Compare sleeping schedules
 */
function calculateSleepingCompatibility(prefSleep, candSleep) {
  const p = (prefSleep || 'flexible').toLowerCase();
  const c = (candSleep || 'flexible').toLowerCase();

  if (p === 'flexible' || c === 'flexible') {
    return { score: 1.0, status: 'positive', reason: 'Flexible sleep schedules offer easy coexistence.' };
  }
  if (p === c) {
    return { score: 1.0, status: 'positive', reason: `Both are ${p}s.` };
  }
  if ((p === 'early-bird' && c === 'night-owl') || (p === 'night-owl' && c === 'early-bird')) {
    return { score: 0.2, status: 'negative', reason: 'Opposite sleeping schedules (early-bird vs night-owl) may need quiet hours agreement.' };
  }

  return { score: 0.6, status: 'neutral', reason: 'Different sleep rhythms.' };
}

/**
 * Compare cleanliness preferences
 */
function calculateCleanlinessCompatibility(prefClean, candClean) {
  const p = (prefClean || 'moderate').toLowerCase();
  const c = (candClean || 'moderate').toLowerCase();

  if (p === 'any') {
    return { score: 1.0, status: 'positive', reason: 'Flexible cleanliness expectations.' };
  }
  if (p === c) {
    return { score: 1.0, status: 'positive', reason: `Both value a ${p} living environment.` };
  }
  if ((p === 'very-clean' && c === 'moderate') || (p === 'moderate' && c === 'very-clean') ||
      (p === 'moderate' && c === 'relaxed') || (p === 'relaxed' && c === 'moderate')) {
    return { score: 0.7, status: 'neutral', reason: 'Slightly different cleanliness standards, easily managed with a chore chart.' };
  }

  return { score: 0.2, status: 'negative', reason: 'Significantly differing cleanliness expectations (very-clean vs relaxed).' };
}

/**
 * Compare lifestyle and roommate count
 */
function calculateLifestyleCompatibility(prefCount, candCount) {
  const pCount = parseInt(prefCount, 10) || 1;
  const cCount = parseInt(candCount, 10) || 1;

  if (pCount === cCount) {
    return { score: 1.0, status: 'positive', reason: `Both prefer living with ${pCount} roommate${pCount > 1 ? 's' : ''}.` };
  }
  if (Math.abs(pCount - cCount) === 1) {
    return { score: 0.75, status: 'neutral', reason: `Similar target household size (${pCount} vs ${cCount}).` };
  }

  return { score: 0.4, status: 'neutral', reason: `Different desired roommate counts (${pCount} vs ${cCount}).` };
}

/**
 * Main Compatibility Calculator
 * Compares seeker preferences (or profile if preferences are unset) against candidate profile.
 *
 * @param {Object} seekerCriteria - Seeker's preferences and profile
 * @param {Object} candidateProfile - Candidate's profile
 * @param {Object} [customWeights] - Optional custom weights
 * @returns {Object} { percentage, hasSufficientData, factors, summary }
 */
function calculateCompatibility(seekerCriteria, candidateProfile, customWeights = {}) {
  const weights = { ...DEFAULT_WEIGHTS, ...customWeights };

  if (!candidateProfile) {
    return {
      percentage: null,
      hasSufficientData: false,
      message: 'Not enough information to calculate compatibility.',
      factors: []
    };
  }

  // Extract seeker preferences falling back to seeker's own profile values
  const seeker = seekerCriteria || {};
  const pref = seeker.preferences || {};
  const userProf = seeker.profile || {};

  const prefMinBudget = pref.min_budget ?? userProf.min_budget;
  const prefMaxBudget = pref.max_budget ?? userProf.max_budget;
  const prefLocation = pref.preferred_location || userProf.preferred_location || '';
  const userCity = userProf.city || '';

  const prefFood = pref.preferred_food || userProf.food_preference || 'any';
  const prefSmoking = pref.preferred_smoking_status || userProf.smoking_preference || 'non-smoker';
  const prefStudy = pref.preferred_study_schedule || userProf.study_schedule || 'flexible';
  const prefSleep = pref.preferred_sleeping_schedule || userProf.sleeping_schedule || 'flexible';
  const prefClean = pref.preferred_cleanliness || userProf.cleanliness_preference || 'moderate';
  const prefCount = pref.preferred_roommate_count ?? userProf.preferred_roommate_count ?? 1;

  // Check sufficient data
  const hasBudget = prefMinBudget !== undefined && prefMaxBudget !== undefined &&
                    candidateProfile.min_budget !== undefined && candidateProfile.max_budget !== undefined;
  const hasLocation = Boolean(prefLocation || userCity || candidateProfile.city || candidateProfile.preferred_location);

  if (!hasBudget && !hasLocation) {
    return {
      percentage: null,
      hasSufficientData: false,
      message: 'Not enough information to calculate compatibility.',
      factors: []
    };
  }

  // Calculate factor components
  const budgetFactor = calculateBudgetCompatibility(
    prefMinBudget,
    prefMaxBudget,
    candidateProfile.min_budget,
    candidateProfile.max_budget
  );

  const locationFactor = calculateLocationCompatibility(
    prefLocation,
    userCity,
    candidateProfile.preferred_location,
    candidateProfile.city
  );

  const foodFactor = calculateFoodCompatibility(prefFood, candidateProfile.food_preference);
  const smokingFactor = calculateSmokingCompatibility(prefSmoking, candidateProfile.smoking_preference);
  const studyFactor = calculateStudyCompatibility(prefStudy, candidateProfile.study_schedule);
  const sleepFactor = calculateSleepingCompatibility(prefSleep, candidateProfile.sleeping_schedule);
  const cleanFactor = calculateCleanlinessCompatibility(prefClean, candidateProfile.cleanliness_preference);
  const lifestyleFactor = calculateLifestyleCompatibility(prefCount, candidateProfile.preferred_roommate_count);

  const factorResults = [
    { key: 'budget', name: 'Budget Alignment', weight: weights.budget, ...budgetFactor },
    { key: 'location', name: 'Location Preference', weight: weights.location, ...locationFactor },
    { key: 'food', name: 'Dietary Compatibility', weight: weights.food, ...foodFactor },
    { key: 'smoking', name: 'Smoking Policy', weight: weights.smoking, ...smokingFactor },
    { key: 'study', name: 'Study & Work Rhythm', weight: weights.study, ...studyFactor },
    { key: 'sleeping', name: 'Sleep Schedule', weight: weights.sleeping, ...sleepFactor },
    { key: 'cleanliness', name: 'Cleanliness Standards', weight: weights.cleanliness, ...cleanFactor },
    { key: 'lifestyle', name: 'Household Size & Lifestyle', weight: weights.lifestyle, ...lifestyleFactor }
  ];

  // Calculate weighted sum
  let totalScore = 0;
  let totalWeight = 0;

  factorResults.forEach(f => {
    totalScore += f.score * f.weight;
    totalWeight += f.weight;
  });

  const percentage = Math.round(Math.min(100, Math.max(0, (totalScore / totalWeight) * 100)));

  return {
    percentage,
    hasSufficientData: true,
    message: `${percentage}% Match`,
    factors: factorResults
  };
}

module.exports = {
  calculateCompatibility,
  DEFAULT_WEIGHTS,
  calculateBudgetCompatibility,
  calculateLocationCompatibility,
  calculateFoodCompatibility,
  calculateSmokingCompatibility,
  calculateStudyCompatibility,
  calculateSleepingCompatibility,
  calculateCleanlinessCompatibility,
  calculateLifestyleCompatibility
};
