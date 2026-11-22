const choices = (title, options, help) => ({ title, options, help });
const service = choices('어디에서 드시나요?', ['매장에서 먹기', '포장하기'], '매장에서 먹을지 포장할지 선택하세요.');

export const products = [
  { name: '물티슈', icon: '🧻', price: 1000 },
  { name: '수세미', icon: '🧽', price: 1000 },
  { name: '건전지', icon: '🔋', price: 2000 },
];

export const burgers = [
  { name: '빅맥', price: 5500, detail: '두 장의 쇠고기 패티' },
  { name: '1955 버거', price: 6500, detail: '그릴드 어니언과 베이컨' },
  { name: '맥스파이시 상하이 버거', price: 5700, detail: '매콤한 치킨 패티' },
  { name: '불고기 버거', price: 4500, detail: '달콤한 불고기 소스' },
];

export const movies = [
  { name: '별빛 여행', rating: '전체', genre: '모험', duration: 114, icon: '✦' },
  { name: '바다의 친구들', rating: '전체', genre: '애니메이션', duration: 100, icon: '≋' },
  { name: '사라진 지도', rating: '12세', genre: '미스터리', duration: 108, icon: '◇' },
  { name: '마지막 열차', rating: '15세', genre: '드라마', duration: 122, icon: '◈' },
];

export const ticketTypes = [
  { name: '일반', price: 12000 },
  { name: '경로', price: 7000 },
  { name: '청소년', price: 9000 },
  { name: '어린이', price: 8000 },
];

export const burgerPrice = (order) => (burgers.find(({ name }) => name === order[1])?.price ?? 0) +
  (order[2] === '세트' ? (order[3] === '라지' ? 2600 : 1900) : 0);
export const kiosks = [
  {
    label: '카페 주문', brand: '메가커피',
    steps: [
      service,
      { ...choices('음료를 골라 주세요', ['아메리카노', '카페라테'], '메뉴 이름과 가격을 확인하고 원하는 음료를 눌러요.'), icons: ['🧊', '☕'], prices: [2000, 3000] },
      choices('온도를 골라 주세요', ['차갑게 (아이스)', '따뜻하게 (핫)'], '아이스는 차가운 음료예요.'),
      choices('몇 잔 드릴까요?', ['1잔', '2잔', '3잔'], '주문할 음료의 잔 수를 골라요.'),
    ],
    total: (order) => (order[1] === '아메리카노' ? 2000 : 3000) * parseInt(order[3], 10),
  },
  {
    label: '햄버거 주문', brand: '맥도날드',
    steps: [
      service,
      choices('버거를 골라 주세요', burgers.map(({ name }) => name), '버거 카드에서 단품과 세트 가격을 확인할 수 있어요.'),
      choices('단품과 세트 중 골라 주세요', ['단품', '세트'], '세트를 고르면 사이드와 음료가 함께 나와요.'),
      choices('세트 크기를 골라 주세요', ['미디엄', '라지'], '라지는 사이드와 음료가 더 커요.'),
      choices('사이드를 골라 주세요', ['감자튀김', '해시브라운', '콘 샐러드'], '세트와 함께 먹을 사이드를 하나 골라요.'),
      choices('음료를 골라 주세요', ['콜라', '제로 콜라', '스프라이트', '환타', '아이스티', '아메리카노'], '세트에 넣을 음료를 하나 골라요.'),
    ],
    total: (order) => burgerPrice(order) * (order.quantity ?? 1),
  },
  {
    label: '영화표 구매', brand: 'CGV',
    steps: [
      choices('영화를 골라 주세요', movies.map(({ name }) => name), '연습용 영화 목록에서 제목을 골라요.'),
      choices('상영 시간을 골라 주세요', ['09:30', '12:00', '14:30', '17:00', '19:30', '22:00'], '관람일을 확인하고 원하는 상영 시간을 선택하세요.'),
      { title: '관람 인원을 선택하세요', help: '해당하는 관람 유형에서 더하기를 눌러 인원을 추가하세요. 최대 6명까지 선택할 수 있어요.' },
      { title: '좌석을 골라 주세요', help: '관람 인원만큼 원하는 좌석을 선택하세요.' },
    ],
    total: (order) => ticketTypes.reduce((sum, { price }, index) => sum + price * (order[2]?.[index] ?? 0), 0),
  },
  {
    label: '마트 셀프계산대', brand: '다이소',
    steps: [
      { title: '상품을 스캔해 주세요', help: '바코드가 스캐너를 향하도록 대는 상황을 연습해요. 상품마다 스캔 버튼을 눌러요.' },
      { title: '실물과 목록을 비교해 주세요', help: '상품마다 실물 수량과 스캔 수량을 비교해 보세요. 수량이 다르면 상품 옆의 버튼으로 수정해요.' },
      choices('봉투가 필요하세요?', ['봉투 없음', '봉투 1장'], '가져온 가방이 있다면 봉투 없음을 골라요.'),
    ],
    total: (order) => products.reduce((sum, product, i) => sum + product.price * order[1][i], 0) +
      (order[2] === '봉투 1장' ? 100 : 0),
  },
];

export const seatLabels = ['A', 'B', 'C', 'D', 'E'].flatMap((row) => [1, 2, 3, 4, 5, 6].map((n) => row + n));

export function isAdjacentPair(seats) {
  if (seats.length !== 2) return false;
  const [left, right] = [...seats].sort();
  return left[0] === right[0] && Number(right[1]) - Number(left[1]) === 1 && left[1] !== '3';
}
