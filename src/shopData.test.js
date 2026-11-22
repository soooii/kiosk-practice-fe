import { test } from 'node:test';
import assert from 'node:assert/strict';
import { drinks, bags, addToCart, cartTotal, goodsTotal, quantitiesMatch } from './shopData.js';
test('카페: 같은 메뉴/온도 합산, 다른 온도 분리, 수량과 금액 계산', () => {
  let cart = addToCart([], drinks[1], 'ICE', 1);
  cart = addToCart(cart, drinks[1], 'ICE', 2);
  cart = addToCart(cart, drinks[1], 'HOT', 1);
  assert.equal(cart.length, 2);
  assert.equal(cart[0].quantity, 3);
  assert.equal(cartTotal(cart), 14000);
  assert.equal(cartTotal(cart.filter(item => item.temperature !== 'ICE')), 3500);
  assert.equal(cartTotal([]), 0);
});
test('다이소: 중복을 수정해야 완료 가능하며 모든 봉투 금액 반영', () => {
  assert.equal(quantitiesMatch([3, 1, 1]), false);
  assert.equal(quantitiesMatch([2, 2, 1]), false);
  assert.equal(quantitiesMatch([2, 1, 1]), true);
  assert.equal(goodsTotal([3, 1, 1]), 6000);
  assert.equal(goodsTotal([2, 1, 1]), 5000);
  assert.deepEqual(bags.map(bag => goodsTotal([2, 1, 1]) + bag.price), [5100, 5200, 5300, 5000]);
});
