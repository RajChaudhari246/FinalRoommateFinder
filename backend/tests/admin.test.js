const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const http = require('http');
const app = require('../app');
const { pool } = require('../config/database');

describe('Admin Portal & User Management Integration Tests', () => {
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

  test('GET /admin serves admin.html with 200 OK', async () => {
    const res = await fetch(`${baseUrl}/admin`);
    assert.equal(res.status, 200);
    const text = await res.text();
    assert.ok(text.includes('Admin Operations Center'), 'Expected Admin Operations Center title');
    assert.ok(text.includes('Recently Added Members'), 'Expected New Users Stream section');
  });

  test('GET /api/admin/metrics returns 401 when unauthenticated', async () => {
    const res = await fetch(`${baseUrl}/api/admin/metrics`);
    assert.equal(res.status, 401);
    const json = await res.json();
    assert.equal(json.success, false);
    assert.match(json.message, /authentication required/i);
  });

  test('GET /api/admin/users returns 401 when unauthenticated', async () => {
    const res = await fetch(`${baseUrl}/api/admin/users`);
    assert.equal(res.status, 401);
    const json = await res.json();
    assert.equal(json.success, false);
  });

  test('Non-admin user receives 403 Forbidden on /api/admin/metrics', async () => {
    // Log in as a regular user (Rajesh Patil is a regular user)
    const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'rajesh.patil@example.com',
        password: 'Password@123'
      })
    });
    assert.equal(loginRes.status, 200);
    const cookie = loginRes.headers.get('set-cookie');

    // Attempt to access admin metrics with regular user session cookie
    const adminRes = await fetch(`${baseUrl}/api/admin/metrics`, {
      headers: { cookie }
    });
    assert.equal(adminRes.status, 403);
    const json = await adminRes.json();
    assert.equal(json.success, false);
    assert.match(json.message, /administrator privileges/i);
  });

  test('Admin user can successfully access metrics and user directory', async () => {
    // Log in as admin user
    const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@roommatefinder.com',
        password: 'Password@123'
      })
    });
    assert.equal(loginRes.status, 200);
    const loginJson = await loginRes.json();
    assert.equal(loginJson.user.role, 'admin');

    const cookie = loginRes.headers.get('set-cookie');

    // Check Metrics endpoint
    const metricsRes = await fetch(`${baseUrl}/api/admin/metrics`, {
      headers: { cookie }
    });
    assert.equal(metricsRes.status, 200);
    const metricsJson = await metricsRes.json();
    assert.equal(metricsJson.success, true);
    assert.ok(metricsJson.metrics.users.total >= 8);
    assert.ok(metricsJson.metrics.users.by_role.admin >= 1);

    // Check Users directory endpoint
    const usersRes = await fetch(`${baseUrl}/api/admin/users?sort=newest`, {
      headers: { cookie }
    });
    assert.equal(usersRes.status, 200);
    const usersJson = await usersRes.json();
    assert.equal(usersJson.success, true);
    assert.ok(usersJson.users.length > 0);

    // Check Activity endpoint
    const actRes = await fetch(`${baseUrl}/api/admin/activity`, {
      headers: { cookie }
    });
    assert.equal(actRes.status, 200);
    const actJson = await actRes.json();
    assert.equal(actJson.success, true);
    assert.ok(Array.isArray(actJson.events));

    // Check Admin Profile endpoint
    const profRes = await fetch(`${baseUrl}/api/admin/profile`, {
      headers: { cookie }
    });
    assert.equal(profRes.status, 200);
    const profJson = await profRes.json();
    assert.equal(profJson.success, true);
    assert.equal(profJson.admin.role, 'admin');
    assert.ok(profJson.admin.privileges.length > 0);
  });

  test('Admin can filter specifically for new users and inspect user details', async () => {
    const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@roommatefinder.com',
        password: 'Password@123'
      })
    });
    const cookie = loginRes.headers.get('set-cookie');

    // Test timeframe filter
    const newUsersRes = await fetch(`${baseUrl}/api/admin/users?timeframe=week&sort=newest`, {
      headers: { cookie }
    });
    assert.equal(newUsersRes.status, 200);
    const newUsersJson = await newUsersRes.json();
    assert.equal(newUsersJson.success, true);
    assert.ok(Array.isArray(newUsersJson.users));

    // Test single user details inspection
    const firstUserId = newUsersJson.users[0]?.id || 1;
    const detailRes = await fetch(`${baseUrl}/api/admin/users/${firstUserId}`, {
      headers: { cookie }
    });
    assert.equal(detailRes.status, 200);
    const detailJson = await detailRes.json();
    assert.equal(detailJson.success, true);
    assert.ok(detailJson.user.email);
    assert.ok(detailJson.user.interactions);
  });
});
