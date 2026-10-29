const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const http = require('http');
const app = require('../app');

describe('Gender Wing Isolation & Access Control Security Tests', () => {
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

  async function loginAs(email, password = 'Password@123') {
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const cookie = res.headers.get('set-cookie');
    const json = await res.json();
    return { res, json, cookie };
  }

  test('Guest: GET /api/roommates?section=female is rejected with 401', async () => {
    const res = await fetch(`${baseUrl}/api/roommates?section=female`);
    assert.equal(res.status, 401);
    const json = await res.json();
    assert.equal(json.success, false);
    assert.match(json.message, /Girls Safe Wing/i);
  });

  test('Guest: GET /api/profiles/2 (Pooja Sharma) is rejected with 401', async () => {
    const res = await fetch(`${baseUrl}/api/profiles/2`);
    assert.equal(res.status, 401);
    const json = await res.json();
    assert.equal(json.success, false);
  });

  test('Male User (Rajesh Patil): Can only view Boys Wing and male candidates', async () => {
    const { cookie, json: loginJson } = await loginAs('rajesh.patil@example.com');
    assert.equal(loginJson.success, true);
    assert.equal(loginJson.user.gender, 'Male');

    // Query roommates
    const res = await fetch(`${baseUrl}/api/roommates`, {
      headers: { Cookie: cookie }
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.ok(data.roommates.length > 0);
    // Verify ALL returned candidates are male
    data.roommates.forEach(r => {
      assert.equal(r.gender, 'Male', `Expected male candidate, got ${r.gender}`);
    });
  });

  test('Male User: Attempt to access Girls Wing (?section=female) returns 403 Forbidden', async () => {
    const { cookie } = await loginAs('rajesh.patil@example.com');

    const res = await fetch(`${baseUrl}/api/roommates?section=female`, {
      headers: { Cookie: cookie }
    });
    assert.equal(res.status, 403);
    const json = await res.json();
    assert.equal(json.success, false);
    assert.match(json.message, /Girls Safe Wing/i);
  });

  test('Male User: Attempt to view Female Profile (/api/profiles/2) returns 403 Forbidden', async () => {
    const { cookie } = await loginAs('rajesh.patil@example.com');

    const res = await fetch(`${baseUrl}/api/profiles/2`, {
      headers: { Cookie: cookie }
    });
    assert.equal(res.status, 403);
    const json = await res.json();
    assert.equal(json.success, false);
    assert.match(json.message, /Girls Safe Wing/i);
  });

  test('Male User: Attempt to send interest to Female user returns 403 Forbidden', async () => {
    const { cookie } = await loginAs('rajesh.patil@example.com');

    const res = await fetch(`${baseUrl}/api/interests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookie
      },
      body: JSON.stringify({
        receiver_user_id: 2, // Pooja Sharma
        message: 'Hello'
      })
    });
    assert.equal(res.status, 403);
    const json = await res.json();
    assert.equal(json.success, false);
    assert.match(json.message, /different gender wings/i);
  });

  test('Female User (Pooja Sharma): Can only view Girls Wing and female candidates', async () => {
    const { cookie, json: loginJson } = await loginAs('pooja.sharma@example.com');
    assert.equal(loginJson.success, true);
    assert.equal(loginJson.user.gender, 'Female');

    const res = await fetch(`${baseUrl}/api/roommates`, {
      headers: { Cookie: cookie }
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.ok(data.roommates.length > 0);
    data.roommates.forEach(r => {
      assert.equal(r.gender, 'Female', `Expected female candidate, got ${r.gender}`);
    });
  });

  test('Female User: Attempt to access Boys Wing (?section=male) returns 403 Forbidden', async () => {
    const { cookie } = await loginAs('pooja.sharma@example.com');

    const res = await fetch(`${baseUrl}/api/roommates?section=male`, {
      headers: { Cookie: cookie }
    });
    assert.equal(res.status, 403);
    const json = await res.json();
    assert.equal(json.success, false);
    assert.match(json.message, /Boys Living Wing/i);
  });

  test('Female User: Attempt to view Male Profile (/api/profiles/1) returns 403 Forbidden', async () => {
    const { cookie } = await loginAs('pooja.sharma@example.com');

    const res = await fetch(`${baseUrl}/api/profiles/1`, {
      headers: { Cookie: cookie }
    });
    assert.equal(res.status, 403);
    const json = await res.json();
    assert.equal(json.success, false);
    assert.match(json.message, /Boys Living Wing/i);
  });
});
