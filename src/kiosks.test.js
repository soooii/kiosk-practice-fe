import assert from 'node:assert/strict';
import test from 'node:test';
import { isAdjacentPair, kiosks } from './kiosks.js';

test('burger cart uses the selected size and quantity', () => {
  const { total } = kiosks[1];
  assert.equal(total({ 1: '빅맥', 2: '세트', 3: '미디엄', quantity: 2 }), 14800);
  assert.equal(total({ 1: '빅맥', 2: '단품', 3: '라지' }), 5500);
});

test('cinema booking prices ticket types and checks whether seats share a row and aisle section', () => {
  assert.equal(kiosks[2].total({ 2: [1, 1, 0, 0] }), 19000);
  assert.equal(isAdjacentPair(['A2', 'A1']), true);
  assert.equal(isAdjacentPair(['B3', 'B4']), false);
  assert.equal(isAdjacentPair(['A1', 'B1']), false);
});
