const assert = require('assert');

function canRegister({ status, capacity, registered }) {
  if (status === 'draft') {
    return { ok: false, code: 403, error: 'Registration is not open yet' };
  }
  if (status === 'closed') {
    return { ok: false, code: 403, error: 'Registration is closed' };
  }
  if (status !== 'live') {
    return { ok: false, code: 403, error: 'Registration is not available' };
  }
  if (capacity != null && registered >= capacity) {
    return { ok: false, code: 409, error: 'Event is full' };
  }
  return { ok: true };
}

function nextCheckedInCount(current, action) {
  if (action === 'check_in') return current + 1;
  if (action === 'undo') return Math.max(0, current - 1);
  throw new Error('unknown action');
}

function main() {
  assert.deepEqual(canRegister({ status: 'live', capacity: null, registered: 99 }), {
    ok: true,
  });
  assert.equal(
    canRegister({ status: 'draft', capacity: 10, registered: 0 }).error,
    'Registration is not open yet'
  );
  assert.equal(
    canRegister({ status: 'closed', capacity: 10, registered: 0 }).error,
    'Registration is closed'
  );
  assert.equal(
    canRegister({ status: 'live', capacity: 2, registered: 2 }).error,
    'Event is full'
  );
  assert.equal(canRegister({ status: 'live', capacity: 2, registered: 1 }).ok, true);

  assert.equal(nextCheckedInCount(3, 'check_in'), 4);
  assert.equal(nextCheckedInCount(1, 'undo'), 0);
  assert.equal(nextCheckedInCount(0, 'undo'), 0);

  console.log('PASS  registration status/capacity rules');
  console.log('PASS  check-in counter undo math');
  console.log('\nAll P2 rule tests passed');
}

main();
