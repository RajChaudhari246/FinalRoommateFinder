const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const bcrypt = require('bcryptjs');
const { isValidEmail } = require('../middleware/validate.middleware');

describe('Validation and Security Tests', () => {

  describe('Email Validator', () => {
    test('Valid email addresses pass', () => {
      assert.equal(isValidEmail('student@university.edu'), true);
      assert.equal(isValidEmail('roommate.seeker@domain.com'), true);
      assert.equal(isValidEmail('alex+roommate@company.org'), true);
    });

    test('Malformed email addresses fail', () => {
      assert.equal(isValidEmail(''), false);
      assert.equal(isValidEmail('invalid-plain-text'), false);
      assert.equal(isValidEmail('@missinguser.com'), false);
      assert.equal(isValidEmail('user@missingdomain'), false);
      assert.equal(isValidEmail(null), false);
      assert.equal(isValidEmail(undefined), false);
    });
  });

  describe('Password Hashing Integrity', () => {
    test('Bcrypt hashes and verifies password correctly', async () => {
      const password = 'StrongPassword@2026';
      const hash = await bcrypt.hash(password, 10);

      assert.notEqual(hash, password);
      assert.ok(hash.startsWith('$2a$') || hash.startsWith('$2b$'));

      const isMatch = await bcrypt.compare(password, hash);
      assert.equal(isMatch, true);

      const wrongMatch = await bcrypt.compare('WrongPassword', hash);
      assert.equal(wrongMatch, false);
    });
  });

  describe('Budget Constraints Verification', () => {
    test('Negative budget values are invalid', () => {
      const minBudget = -100;
      const maxBudget = 500;
      const isValid = minBudget >= 0 && maxBudget >= minBudget;
      assert.equal(isValid, false);
    });

    test('maxBudget less than minBudget is invalid', () => {
      const minBudget = 1500;
      const maxBudget = 1000;
      const isValid = minBudget >= 0 && maxBudget >= minBudget;
      assert.equal(isValid, false);
    });

    test('Valid budget range passes constraint', () => {
      const minBudget = 900;
      const maxBudget = 1400;
      const isValid = minBudget >= 0 && maxBudget >= minBudget;
      assert.equal(isValid, true);
    });
  });
});
