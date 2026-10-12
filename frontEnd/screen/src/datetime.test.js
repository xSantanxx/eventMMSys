import assert from 'node:assert/strict';
import { attendeesToCsv, datetimeLocalToIso, toDatetimeLocalValue } from './datetime.js';

function main() {
  const local = '2026-10-20T18:30';
  const iso = datetimeLocalToIso(local);
  assert.ok(iso.endsWith('Z') || iso.includes('+') || iso.includes('T'));
  assert.ok(!Number.isNaN(Date.parse(iso)));

  const roundTrip = toDatetimeLocalValue(new Date(iso));
  assert.match(roundTrip, /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);

  const csv = attendeesToCsv([
    { name: 'Ada', email: 'ada@example.com', checked_in: true },
    { name: 'Bob, Jr', email: 'bob@example.com', checked_in: false },
  ]);
  assert.ok(csv.includes('name,email,checked_in'));
  assert.ok(csv.includes('Ada,ada@example.com,yes'));
  assert.ok(csv.includes('"Bob, Jr",bob@example.com,no'));

  console.log('PASS  datetime local ↔ ISO');
  console.log('PASS  attendees CSV export');
  console.log('\nAll datetime helper tests passed');
}

main();
