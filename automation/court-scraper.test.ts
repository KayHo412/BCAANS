import assert from 'node:assert/strict';
import test from 'node:test';
import { extractCourts, resolveLabel, shouldIncludeSlot } from './court-scraper';

test('extractCourts recognises only booking controls', () => {
  assert.deepEqual(extractCourts('<button>Book court 1</button><span>Book court 3</span><p>court 7</p>'), ['Court 1', 'Court 3']);
});

test('resolveLabel falls back when the detail page has no heading', () => {
  assert.equal(resolveLabel('<li role="heading">Sun 1.2. 16:00</li>', 'fallback'), 'Sun 1.2. 16:00');
  assert.equal(resolveLabel('<main />', 'fallback'), 'fallback');
});

test('weekend policy is shared and explicit', () => {
  assert.equal(shouldIncludeSlot('Sat 1.2.', '16:00'), true);
  assert.equal(shouldIncludeSlot('Sun 2.2.', '19:30'), false);
  assert.equal(shouldIncludeSlot('Mon 3.2.', '19:30'), true);
});
