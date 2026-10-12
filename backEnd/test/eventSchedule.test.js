const assert = require('assert');
const { check, validationResult } = require('express-validator');

const scheduleChecks = [
  check('starts_at', 'Start time must be a valid ISO date').isISO8601(),
  check('ends_at', 'End time must be a valid ISO date').isISO8601(),
  check('timezone', 'Timezone is required').optional({ values: 'falsy' }).isLength({
    min: 1,
    max: 64,
  }),
  check('ends_at').custom((endsAt, { req }) => {
    if (new Date(endsAt) <= new Date(req.body.starts_at)) {
      throw new Error('End time must be after start time');
    }
    return true;
  }),
];

async function runChecks(body) {
  const req = { body };
  for (const middleware of scheduleChecks) {
    await new Promise((resolve) => middleware(req, {}, resolve));
  }
  return validationResult(req);
}

async function main() {
  const ok = await runChecks({
    starts_at: '2026-10-20T18:00:00.000Z',
    ends_at: '2026-10-20T21:00:00.000Z',
    timezone: 'America/New_York',
  });
  assert.equal(ok.isEmpty(), true, 'valid schedule');

  const badOrder = await runChecks({
    starts_at: '2026-10-20T21:00:00.000Z',
    ends_at: '2026-10-20T18:00:00.000Z',
    timezone: 'UTC',
  });
  assert.equal(badOrder.isEmpty(), false, 'end before start fails');

  const badDate = await runChecks({
    starts_at: 'not-a-date',
    ends_at: '2026-10-20T21:00:00.000Z',
  });
  assert.equal(badDate.isEmpty(), false, 'invalid start fails');

  console.log('PASS  valid start/end schedule');
  console.log('PASS  end-before-start rejected');
  console.log('PASS  invalid ISO rejected');
  console.log('\nAll event schedule validation tests passed');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
