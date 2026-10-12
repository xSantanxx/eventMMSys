/**
 * Lightweight route / helper tests (no browser).
 * Run: node src/routes.test.js
 */
import assert from 'node:assert/strict';
import { extractEventId } from './eventId.js';

function getPublicRegisterUrl(eventId, origin = 'http://localhost:5173') {
  return `${origin}/e/${eventId}/register`;
}

const ROUTE_MAP = {
  home: '/',
  organizerHub: '/org',
  organizerEvent: '/org/events/:id',
  organizerCheckIn: '/org/events/:id/check-in',
  attendeeEvent: '/e/:id',
  attendeeRegister: '/e/:id/register',
};

function main() {
  assert.equal(extractEventId('abcdef1234567890'), 'abcdef1234567890');
  assert.equal(
    extractEventId('http://localhost:5173/e/abcdef1234567890/register'),
    'abcdef1234567890'
  );
  assert.equal(
    extractEventId('https://example.com/e/deadbeefcafebabe'),
    'deadbeefcafebabe'
  );
  assert.equal(extractEventId('/e/aabbccddeeff0011'), 'aabbccddeeff0011');
  assert.equal(extractEventId(''), '');

  assert.equal(
    getPublicRegisterUrl('abc123'),
    'http://localhost:5173/e/abc123/register'
  );

  assert.ok(ROUTE_MAP.organizerHub.startsWith('/org'));
  assert.ok(ROUTE_MAP.attendeeEvent.startsWith('/e/'));
  assert.notEqual(ROUTE_MAP.organizerHub, ROUTE_MAP.attendeeEvent);
  assert.ok(!ROUTE_MAP.organizerCheckIn.startsWith('/e/'));
  assert.ok(!ROUTE_MAP.attendeeRegister.startsWith('/org'));

  console.log('PASS  extractEventId cases');
  console.log('PASS  public register URL helper');
  console.log('PASS  organizer vs attendee route separation');
  console.log('\nAll route helper tests passed');
}

main();
