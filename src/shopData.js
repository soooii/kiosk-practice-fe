export const won = (value) => value.toLocaleString('ko-KR') + '원';
export const drinks = [
  ['아메리카노', 2000, '커피', 'dark'], ['카페라떼', 3500, '커피', 'latte'],
  ['바닐라라떼', 4000, '커피', 'latte'], ['카라멜마키아또', 4200, '커피', 'latte'],
  ['카페모카', 4200, '커피', 'dark'], ['연유라떼', 4500, '커피', 'latte'],
  ['콜드브루', 3300, '커피', 'dark'], ['콜드브루라떼', 4300, '커피', 'latte'],
  ['디카페인 아메리카노', 2500, '커피', 'dark'], ['헤이즐넛라떼', 4000, '커피', 'latte'],
  ['딸기라떼', 4000, '음료', 'pink'], ['초코라떼', 4000, '음료', 'dark'],
  ['레몬에이드', 3500, '음료', 'lemon'], ['아이스티', 3000, '티', 'dark'],
  ['캐모마일', 3000, '티', 'lemon'], ['쿠키', 2000, '디저트', 'cookie'],
].map(([name, price, category, art], id) => ({ id, name, price, category, art }));
export const goods = [
  { name: '수세미', price: 1000, icon: '🧽', actual: 2 },
  { name: '테이프', price: 2000, icon: '◉', actual: 1 },
  { name: '건전지', price: 1000, icon: '🔋', actual: 1 },
];
export const bags = [
  { name: '비닐봉투 (소)', price: 100, icon: '🛍' },
  { name: '비닐봉투 (중)', price: 200, icon: '🛍' },
  { name: '종이쇼핑백', price: 300, icon: '🛍' },
  { name: '봉투 필요 없어요', price: 0, icon: '⊘' },
];
export const cartTotal = (cart) => cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
export const goodsTotal = (quantities) => goods.reduce((sum, item, i) => sum + item.price * quantities[i], 0);
export const quantitiesMatch = (quantities) => goods.every((item, i) => item.actual === quantities[i]);
export function addToCart(cart, product, temperature, quantity) {
  const key = `${product.id}-${temperature}`;
  const existing = cart.find((item) => item.key === key);
  return existing ? cart.map((item) => item.key === key ? { ...item, quantity: item.quantity + quantity } : item)
    : [...cart, { ...product, key, temperature, quantity }];
}
