const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const {
  calculateCompatibility,
  calculateBudgetCompatibility,
  calculateLocationCompatibility,
  calculateFoodCompatibility,
  calculateSmokingCompatibility,
  calculateStudyCompatibility,
  calculateSleepingCompatibility,
  calculateCleanlinessCompatibility,
  calculateLifestyleCompatibility
} = require('../services/compatibility.service');

describe('Roommate Compatibility Engine Tests', () => {

  describe('Budget Compatibility', () => {
    test('Overlapping budgets score positive and high', () => {
      const res = calculateBudgetCompatibility(1000, 1500, 1200, 1600);
      assert.equal(res.status, 'positive');
      assert.ok(res.score >= 0.8, 'Expected score >= 0.8');
      assert.match(res.reason, /overlap/i);
    });

    test('Non-overlapping budgets with large gap score negative', () => {
      const res = calculateBudgetCompatibility(800, 1000, 2000, 2500);
      assert.equal(res.status, 'negative');
      assert.ok(res.score <= 0.3, 'Expected score <= 0.3');
    });

    test('Modest budget gap scores neutral', () => {
      const res = calculateBudgetCompatibility(1000, 1200, 1250, 1400);
      assert.equal(res.status, 'neutral');
      assert.ok(res.score >= 0.4);
    });

    test('Missing budget returns neutral with explanation', () => {
      const res = calculateBudgetCompatibility(null, null, null, null);
      assert.equal(res.status, 'neutral');
    });
  });

  describe('Location Compatibility', () => {
    test('Exact city and overlapping neighborhood matches positive', () => {
      const res = calculateLocationCompatibility('Brooklyn Heights', 'New York', 'Brooklyn Downtown', 'New York');
      assert.equal(res.status, 'positive');
      assert.ok(res.score >= 0.8);
      assert.match(res.reason, /New York/i);
    });

    test('Different cities score negative', () => {
      const res = calculateLocationCompatibility('Back Bay', 'Boston', 'SOMA', 'San Francisco');
      assert.equal(res.status, 'negative');
      assert.ok(res.score <= 0.3);
    });
  });

  describe('Dietary Compatibility', () => {
    test('Both vegetarian scores 1.0', () => {
      const res = calculateFoodCompatibility('vegetarian', 'vegetarian');
      assert.equal(res.score, 1.0);
      assert.equal(res.status, 'positive');
    });

    test('Any preference accepts any candidate diet', () => {
      const res = calculateFoodCompatibility('any', 'non-vegetarian');
      assert.equal(res.score, 1.0);
      assert.equal(res.status, 'positive');
    });

    test('Vegetarian and vegan align well with partial compatibility', () => {
      const res = calculateFoodCompatibility('vegan', 'vegetarian');
      assert.equal(res.score, 0.8);
      assert.equal(res.status, 'positive');
    });

    test('Conflicting specific diets note separation in reason', () => {
      const res = calculateFoodCompatibility('vegan', 'non-vegetarian');
      assert.equal(res.status, 'neutral');
      assert.match(res.reason, /separate/i);
    });
  });

  describe('Smoking Habits', () => {
    test('Non-smoker paired with non-smoker scores 1.0', () => {
      const res = calculateSmokingCompatibility('non-smoker', 'non-smoker');
      assert.equal(res.score, 1.0);
      assert.equal(res.status, 'positive');
    });

    test('Non-smoker paired with indoor smoker scores negative (0.1)', () => {
      const res = calculateSmokingCompatibility('non-smoker', 'smoker');
      assert.equal(res.status, 'negative');
      assert.equal(res.score, 0.1);
    });

    test('Non-smoker paired with outside-only smoker is neutral', () => {
      const res = calculateSmokingCompatibility('non-smoker', 'outside-only');
      assert.equal(res.status, 'neutral');
    });
  });

  describe('Sleeping Schedule', () => {
    test('Early-bird vs night-owl scores negative', () => {
      const res = calculateSleepingCompatibility('early-bird', 'night-owl');
      assert.equal(res.status, 'negative');
      assert.equal(res.score, 0.2);
    });

    test('Flexible sleeping matches positively', () => {
      const res = calculateSleepingCompatibility('flexible', 'night-owl');
      assert.equal(res.score, 1.0);
      assert.equal(res.status, 'positive');
    });
  });

  describe('Cleanliness Standards', () => {
    test('Very clean vs relaxed scores negative', () => {
      const res = calculateCleanlinessCompatibility('very-clean', 'relaxed');
      assert.equal(res.status, 'negative');
      assert.equal(res.score, 0.2);
    });

    test('Very clean vs moderate scores neutral and workable', () => {
      const res = calculateCleanlinessCompatibility('very-clean', 'moderate');
      assert.equal(res.status, 'neutral');
      assert.equal(res.score, 0.7);
    });
  });

  describe('Overall Compatibility Calculation', () => {
    test('Calculates weighted percentage within 0-100', () => {
      const seeker = {
        profile: {
          city: 'New York',
          preferred_location: 'Brooklyn',
          min_budget: 1200,
          max_budget: 1600,
          food_preference: 'vegetarian',
          smoking_preference: 'non-smoker',
          sleeping_schedule: 'early-bird',
          cleanliness_preference: 'very-clean',
          preferred_roommate_count: 1
        },
        preferences: {
          preferred_location: 'Brooklyn',
          min_budget: 1100,
          max_budget: 1700,
          preferred_food: 'vegetarian',
          preferred_smoking_status: 'non-smoker',
          preferred_sleeping_schedule: 'early-bird',
          preferred_cleanliness: 'very-clean',
          preferred_roommate_count: 1
        }
      };

      const candidate = {
        city: 'New York',
        preferred_location: 'Brooklyn / Manhattan',
        min_budget: 1250,
        max_budget: 1650,
        food_preference: 'vegetarian',
        smoking_preference: 'non-smoker',
        study_schedule: 'morning',
        sleeping_schedule: 'early-bird',
        cleanliness_preference: 'very-clean',
        preferred_roommate_count: 1
      };

      const result = calculateCompatibility(seeker, candidate);

      assert.equal(result.hasSufficientData, true);
      assert.ok(result.percentage >= 85, `Expected >= 85%, got ${result.percentage}%`);
      assert.ok(result.percentage <= 100);
      assert.ok(result.factors.length === 8, 'Expected 8 factor categories');

      // Check explanations exist
      result.factors.forEach(f => {
        assert.ok(f.reason && f.reason.length > 0, `Factor ${f.name} missing explanation`);
      });
    });

    test('Insufficient data returns hasSufficientData: false', () => {
      const emptySeeker = { profile: {}, preferences: {} };
      const emptyCandidate = {};

      const result = calculateCompatibility(emptySeeker, emptyCandidate);
      assert.equal(result.hasSufficientData, false);
      assert.equal(result.percentage, null);
      assert.match(result.message, /Not enough information/i);
    });
  });
});
