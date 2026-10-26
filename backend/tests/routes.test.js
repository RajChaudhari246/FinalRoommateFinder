const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const http = require('http');
const app = require('../app');

describe('Express Server & Routing Integration Tests', () => {
  let server;
  let baseUrl;

  before(async () => {
    await new Promise((resolve) => {
      server = http.createServer(app);
      server.listen(0, () => {
        const port = server.address().port;
        baseUrl = `http://localhost:${port}`;
        resolve();
      });
    });
  });

  after(async () => {
    await new Promise((resolve) => {
      server.close(resolve);
    });
  });

  test('GET / serves homepage index.html with 200 OK', async () => {
    const res = await fetch(`${baseUrl}/`);
    assert.equal(res.status, 200);
    const text = await res.text();
    assert.ok(text.includes('Roommate Finder'), 'Expected page title in homepage');
    assert.ok(text.includes('Find Your Perfect Roommate'), 'Expected headline');
  });

  test('GET /login serves login.html with 200 OK', async () => {
    const res = await fetch(`${baseUrl}/login`);
    assert.equal(res.status, 200);
    const text = await res.text();
    assert.ok(text.includes('Sign In'), 'Expected Sign In header');
  });

  test('GET /register serves register.html with 200 OK', async () => {
    const res = await fetch(`${baseUrl}/register`);
    assert.equal(res.status, 200);
    const text = await res.text();
    assert.ok(text.includes('Create Account'), 'Expected Create Account header');
  });

  test('GET /find-roommates serves find-roommates.html with 200 OK', async () => {
    const res = await fetch(`${baseUrl}/find-roommates`);
    assert.equal(res.status, 200);
    const text = await res.text();
    assert.ok(text.includes('Discover Roommates'), 'Expected Discover Roommates header');
  });

  test('GET /api/auth/me returns 401 when unauthenticated', async () => {
    const res = await fetch(`${baseUrl}/api/auth/me`);
    assert.equal(res.status, 401);
    const json = await res.json();
    assert.equal(json.authenticated, false);
  });

  test('Protected endpoint GET /api/profile/me rejects unauthenticated request with 401', async () => {
    const res = await fetch(`${baseUrl}/api/profile/me`);
    assert.equal(res.status, 401);
    const json = await res.json();
    assert.equal(json.success, false);
    assert.match(json.message, /authentication required/i);
  });

  test('Protected endpoint GET /api/interests/received rejects unauthenticated request with 401', async () => {
    const res = await fetch(`${baseUrl}/api/interests/received`);
    assert.equal(res.status, 401);
    const json = await res.json();
    assert.equal(json.success, false);
  });

  test('Validation: POST /api/auth/register fails with 400 on invalid email or short password', async () => {
    const res = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        full_name: 'Test User',
        email: 'invalid-email-address',
        password: '123'
      })
    });
    assert.equal(res.status, 400);
    const json = await res.json();
    assert.equal(json.success, false);
    assert.match(json.message, /valid email/i);
  });

  test('Validation: POST /api/auth/register fails with 400 when passwords do not match', async () => {
    const res = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        full_name: 'Test User',
        email: 'valid@example.com',
        password: 'Password123',
        confirm_password: 'PasswordMismatch'
      })
    });
    assert.equal(res.status, 400);
    const json = await res.json();
    assert.equal(json.success, false);
    assert.match(json.message, /do not match/i);
  });

  test('Security headers: Helmet headers are present in responses', async () => {
    const res = await fetch(`${baseUrl}/`);
    assert.ok(res.headers.has('x-content-type-options'));
    assert.equal(res.headers.get('x-content-type-options'), 'nosniff');
  });

  test('404 Handler returns clean structured JSON for unknown API endpoint', async () => {
    const res = await fetch(`${baseUrl}/api/unknown-endpoint-xyz`);
    assert.equal(res.status, 404);
    const json = await res.json();
    assert.equal(json.success, false);
    assert.match(json.message, /not found/i);
  });
});
