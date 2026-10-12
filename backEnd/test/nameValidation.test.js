/**
 * Validates organizer + attendee name rules match event.js:
 * trimmed length >= 1 (no max).
 */
const assert = require('assert');
const { check, validationResult } = require('express-validator');

const nameChecks = [
  check('name', 'Name must be at least 1 character').trim().isLength({ min: 1 }),
];

async function runChecks(body) {
  const req = { body };
  for (const middleware of nameChecks) {
    await new Promise((resolve) => middleware(req, {}, resolve));
  }
  return validationResult(req);
}

async function main() {
  const cases = [
    { name: 'A', ok: true, label: 'single character' },
    { name: 'Jo', ok: true, label: 'two characters' },
    { name: 'Li', ok: true, label: 'short attendee-style name' },
    { name: 'x'.repeat(100), ok: true, label: 'long name (no max)' },
    { name: '  Bob  ', ok: true, label: 'padded name trims to valid' },
    { name: '', ok: false, label: 'empty string' },
    { name: '   ', ok: false, label: 'whitespace only' },
  ];

  let failed = 0;
  for (const c of cases) {
    const result = await runChecks({ name: c.name });
    const passed = result.isEmpty();
    try {
      assert.strictEqual(passed, c.ok, c.label);
      console.log(`PASS  ${c.label}`);
    } catch (err) {
      failed += 1;
      console.error(
        `FAIL  ${c.label}: expected ok=${c.ok}, got ok=${passed}`,
        result.array()
      );
    }
  }

  if (failed) {
    console.error(`\n${failed} test(s) failed`);
    process.exit(1);
  }
  console.log(`\nAll ${cases.length} name validation tests passed`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
