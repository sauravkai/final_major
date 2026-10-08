import test from 'node:test';
import assert from 'node:assert/strict';
import { isSessionJoinAllowed, isSessionVisibleInUpcomingList } from './sessionAccess.js';

test('completed sessions cannot be rejoined', () => {
  assert.equal(isSessionJoinAllowed('completed'), false);
  assert.equal(isSessionJoinAllowed('finished'), false);
});

test('inactive or ended items are hidden from upcoming lists', () => {
  assert.equal(isSessionVisibleInUpcomingList({ isActive: false }), false);
  assert.equal(isSessionVisibleInUpcomingList({ status: 'completed' }), false);
  assert.equal(isSessionVisibleInUpcomingList({ status: 'live' }), true);
});

test('active sessions can still be joined', () => {
  assert.equal(isSessionJoinAllowed('in-progress'), true);
  assert.equal(isSessionJoinAllowed('scheduled'), true);
  assert.equal(isSessionJoinAllowed('live'), true);
});

test('sessions scheduled in the future cannot be joined yet', () => {
  const future = new Date(Date.now() + 60 * 60 * 1000).toISOString();
  const past = new Date(Date.now() - 60 * 60 * 1000).toISOString();

  assert.equal(isSessionJoinAllowed({ status: 'scheduled', scheduledAt: future }), false);
  assert.equal(isSessionJoinAllowed({ status: 'scheduled', scheduledAt: past }), true);
});
