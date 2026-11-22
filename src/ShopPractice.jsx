import React, { useEffect, useState } from 'react';
import { drinks, goods, bags, won, cartTotal, goodsTotal, quantitiesMatch, addToCart } from './shopData.js';
import PracticeFrame from './PracticeFrame.jsx';
import { useLearning } from './LearningAssistant.jsx';
import './shop.css';

function Button({ children, secondary = false, ...props }) {
  return <button className={`shop-button${secondary ? ' secondary' : ''}`} {...props}>{children}</button>;
}
function Hint({ children }) { return <p className="shop-hint">{children}</p>; }
function Counter({ value, onChange, label, max = 99 }) {
  return <div className="shop-counter"><button aria-label={`${label} 줄이기`} disabled={value <= 1} onClick={() => onChange(value - 1)}>−</button><strong aria-live="polite">{value}</strong><button aria-label={`${label} 늘리기`} disabled={value >= max} onClick={() => onChange(value + 1)}>+</button></div>;
}
function Drink({ product }) {
  return <span className={`drink-art ${product.art}`} aria-hidden="true"><span>Ⅿ</span></span>;
}
function Frame({ brand, step, title, guide, children, footer, learning, context }) {
  const header = <header className="shop-brand">{brand === 'cafe' ? <strong>▰ MEGA COFFEE<small>메가커피</small></strong> : <strong className="daiso-logo"><span>⠿</span> 다이소</strong>}<span className="practice-badge">연습용</span></header>;
  return <PracticeFrame className={`shop ${brand}`} header={header} step={step} count={8}
    title={title} guide={guide} footer={footer} learning={learning} context={context}
    reviewing={step === 6} completed={step === 7}>{children}</PracticeFrame>;
}
function Completion({ name, onRestart, onExit, onHome }) {
  return <><div className="shop-success"><span>✓</span><h2>잘했어요!</h2><p>{name}<br />연습을 모두 완료했어요.</p></div><div className="shop-completion"><Button onClick={onExit}>다른 키오스크 연습하기 ❯</Button><Button secondary onClick={onRestart}>↻ 다시 연습하기</Button><Button secondary onClick={onHome}>⌂ 처음으로</Button></div></>;
}

export function CafePractice({ onExit, onHome }) {
  const [step, setStep] = useState(0);
  const [category, setCategory] = useState('커피');
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState(null);
  const [temperature, setTemperature] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [cart, setCart] = useState([]);
  const [payment, setPayment] = useState('');
  const total = cartTotal(cart);
  const count = cart.reduce((sum, item) => sum + item.quantity, 0);
  const filtered = drinks.filter((item) => category === '추천' ? [0, 1, 10].includes(item.id) : item.category === category);
  const titles = ['원하는 메뉴를 선택하세요', '옵션 선택', '수량 선택', '장바구니', '결제하기', '주문 확인', '주문 내역 돌아보기', '연습 완료'];
  const learning = useLearning('메가커피', step, titles[step], step === 6, step === 7);
  const guides = ['마시고 싶은 음료나 디저트를 눌러주세요.', '따뜻하게 드실지, 차갑게 드실지 골라주세요.', '수량을 확인하고 장바구니에 담으세요.', '주문 내역을 확인하고 결제하기를 누르세요.', '연습할 결제 수단을 선택하세요.', '주문 내용이 맞으면 결제하기(연습)를 누르세요.', '선택한 내용을 순서대로 돌아보세요.'];
  function restart() { learning.reset(); setStep(0); setCart([]); setSelected(null); setTemperature(''); setQuantity(1); setPayment(''); setCategory('커피'); setPage(0); }
  function choose(product) { setSelected(product); setTemperature(product.category === '디저트' ? '기본' : ''); setQuantity(1); }
  const rows = (editable) => <div className="shop-receipt"><div className="receipt-head"><span>주문내역</span><span>수량 / 금액</span></div>{cart.map((item) => <div className="cart-row" key={item.key}><Drink product={item} /><strong>{item.name}<small>({item.temperature})</small></strong>{editable ? <Counter label={`${item.name} ${item.temperature} 수량`} value={item.quantity} max={99} onChange={(value) => setCart(cart.map((row) => row.key === item.key ? { ...row, quantity: value } : row))} /> : <span>{item.quantity}개</span>}<b>{won(item.price * item.quantity)}</b>{editable && <button className="remove-item" aria-label={`${item.name} ${item.temperature} 삭제`} onClick={() => setCart(cart.filter((row) => row.key !== item.key))}>×</button>}</div>)}</div>;
  let footer;
  if (step === 0) footer = <><Button secondary onClick={() => setStep(3)}>🛒 {count}개 {won(total)}</Button><Button disabled={!selected} onClick={() => setStep(selected.category === '디저트' ? 2 : 1)}>다음 ❯</Button></>;
  if (step === 1) footer = <><Button secondary onClick={() => setStep(0)}>‹ 이전</Button><Button disabled={!temperature} onClick={() => setStep(2)}>다음 ❯</Button></>;
  if (step === 2) footer = <><Button secondary onClick={() => setStep(selected.category === '디저트' ? 0 : 1)}>‹ 이전</Button><Button onClick={() => { setCart(addToCart(cart, selected, temperature, quantity)); setStep(3); }}>🛒 장바구니 담기</Button></>;
  if (step === 3) footer = <><Button secondary onClick={() => { setSelected(null); setStep(0); }}>+ 메뉴 더 담기</Button><Button disabled={!cart.length} onClick={() => setStep(4)}>결제하기 ❯</Button></>;
  if (step === 4) footer = <><Button secondary onClick={() => setStep(3)}>‹ 이전</Button><Button disabled={!payment} onClick={() => setStep(5)}>다음 ❯</Button></>;
  if (step === 5) footer = <><Button secondary onClick={() => setStep(4)}>‹ 이전</Button><Button onClick={() => setStep(6)}>결제하기(연습) ❯</Button></>;
  if (step === 6) footer = <><Button secondary onClick={restart}>↻ 다시 연습하기</Button><Button onClick={() => setStep(7)}>완료하기 ❯</Button></>;
  return <Frame brand="cafe" step={step} title={titles[step]} guide={guides[step]} footer={footer} learning={learning}
    context={{ selected: selected?.name, temperature, quantity, cart: cart.map(({ name, temperature, quantity }) => ({ name, temperature, quantity })), payment }}>
    {step === 0 && <><nav className="menu-tabs" aria-label="메뉴 분류">{['추천', '커피', '음료', '티', '디저트'].map((tab) => <button key={tab} aria-pressed={category === tab} onClick={() => { setCategory(tab); setPage(0); }}>{tab}</button>)}</nav><div className="menu-grid">{filtered.slice(page * 9, page * 9 + 9).map((product) => <button key={product.id} aria-pressed={selected?.id === product.id} onClick={() => choose(product)}><Drink product={product} /><strong>{product.name}</strong><b>{won(product.price)}</b></button>)}</div><div className="menu-pages"><button aria-label="이전 메뉴 페이지" disabled={page === 0} onClick={() => setPage(page - 1)}>‹</button><span>{page + 1} / {Math.ceil(filtered.length / 9)}</span><button aria-label="다음 메뉴 페이지" disabled={(page + 1) * 9 >= filtered.length} onClick={() => setPage(page + 1)}>›</button></div></>}
    {(step === 1 || step === 2) && <><div className="selected-product"><Drink product={selected} /><div><h2>{selected.name}{step === 2 && ` (${temperature})`}</h2><b>{won(selected.price)}</b>{step === 1 && <p>원하는 옵션으로<br />주문해 보세요.</p>}</div></div>{step === 1 ? <><h2>온도<span className="red">(필수)</span></h2><div className="temperature-options">{['HOT', 'ICE'].map((option) => <button key={option} aria-pressed={temperature === option} onClick={() => setTemperature(option)}><span>{option === 'HOT' ? '♨' : '❄'}</span>{option}<small>{option === 'HOT' ? '(따뜻하게)' : '(차갑게)'}</small></button>)}</div></> : <><h2>수량을 선택하세요</h2><div className="large-counter"><Counter label="음료 수량" value={quantity} onChange={setQuantity} /></div><div className="shop-total">금액 <b>{won(selected.price * quantity)}</b></div></>}</>}
    {step === 3 && <>{cart.length ? rows(true) : <Hint>장바구니가 비어 있어요.<br />메뉴를 먼저 담아 주세요.</Hint>}<div className="shop-total">총 {count}개 <b>{won(total)}</b></div></>}
    {step === 4 && <><h2>결제 방법을 선택하세요</h2><div className="payment-options">{[['▣', '신용·체크카드'], ['▤', '모바일 결제'], ['♧', '메가커피 기프트카드']].map(([icon, name]) => <button key={name} aria-pressed={payment === name} onClick={() => setPayment(name)}><span>{icon}</span><strong>{name}</strong></button>)}</div><Hint>※ 연습용 화면입니다.<br />실제 결제는 진행되지 않습니다.</Hint></>}
    {step === 5 && <><h2>주문 내용을 확인하세요</h2>{rows(false)}<p>결제 방법: {payment}</p><div className="shop-total">결제할 금액 <b>{won(total)}</b></div></>}
    {step === 6 && <><div className="feedback-success"><h2>✓ 아주 잘하셨어요!</h2><p>메가커피 키오스크 주문을<br />순서대로 잘 따라 했어요.</p></div><section className="shop-receipt"><h2>주요 단계 다시 보기</h2><ol className="review-list"><li>메뉴 선택: {cart.map((item) => item.name).join(', ')}</li><li>옵션 선택: {cart.map((item) => item.temperature).join(', ')}</li><li>수량 선택: 총 {count}개</li><li>장바구니 확인: {won(total)}</li><li>결제 방법: {payment}</li><li>주문 확인 및 모의 결제 완료</li></ol></section></>}
    {step === 7 && <Completion name="메가커피 키오스크 주문" onRestart={restart} onExit={onExit} onHome={onHome} />}
    {step < 7 && <button className="shop-home" onClick={onHome}>⌂ 처음으로</button>}
  </Frame>;
}

export function DaisoPractice({ onExit, onHome }) {
  const [step, setStep] = useState(0);
  const [scanned, setScanned] = useState([]);
  const [quantities, setQuantities] = useState([0, 0, 0]);
  const [bag, setBag] = useState(null);
  const [message, setMessage] = useState('');
  const [paying, setPaying] = useState(false);
  const corrected = quantitiesMatch(quantities);
  const subtotal = goodsTotal(quantities);
  const total = subtotal + (bag?.price ?? 0);
  const titles = ['바코드 스캔 대기', '상품 스캔 (3개 담기)', '스캔 목록 확인', '오류 수정 (중복 제거)', '봉투(쇼핑백) 선택', '결제하기 (연습)', '거래 내용 확인', '연습 완료'];
  const learning = useLearning('다이소', step, titles[step], step === 6, step === 7);
  const guides = ['상품의 바코드를 스캐너에 보여 주세요.', '아래 상품을 각각 눌러 스캔하세요.', '실제 바구니와 스캔 목록의 수량을 비교하세요.', '수세미 수량을 실제와 같은 2개로 수정하세요.', '필요한 봉투를 선택하세요.', '카드 넣기 버튼으로 모의 결제를 연습하세요.', '스캔부터 결제까지 연습한 내용을 확인하세요.'];
  useEffect(() => {
    if (!paying) return;
    const timer = setTimeout(() => { setPaying(false); setStep(6); }, 1000);
    return () => clearTimeout(timer);
  }, [paying]);
  function restart() { learning.reset(); setStep(0); setScanned([]); setQuantities([0, 0, 0]); setBag(null); setMessage(''); setPaying(false); }
  function scan(index) {
    if (scanned.includes(index)) return;
    setScanned([...scanned, index]);
    setQuantities(quantities.map((value, i) => i === index ? (index === 0 ? 3 : 1) : value));
  }
  const list = (values, editable = false) => <div className="goods-list">{goods.map((item, i) => <div className="goods-row" key={item.name}><span className="goods-icon" aria-hidden="true">{item.icon}</span><strong>{item.name}</strong>{editable ? <Counter value={values[i]} max={4} label={`${item.name} 수량`} onChange={(value) => setQuantities(values.map((q, j) => j === i ? value : q))} /> : <b>{values[i]}개</b>}</div>)}</div>;
  let footer;
  if (step === 0) footer = <><Button secondary onClick={onHome}>⌂ 처음으로</Button><Button onClick={() => setStep(1)}>바코드 스캔 시작 ❯</Button></>;
  if (step === 1) footer = <><Button secondary onClick={() => setStep(0)}>‹ 이전</Button><Button disabled={scanned.length !== 3} onClick={() => setStep(2)}>다음 ❯</Button></>;
  if (step === 2) footer = <><Button secondary data-help-target={!corrected || undefined} onClick={() => { setMessage(''); setStep(3); }}>아니요<br />(수정할게요)</Button><Button onClick={() => corrected ? setStep(4) : setMessage('실제 상품과 스캔 수량이 달라요. ‘아니요’를 눌러 수정해 주세요.')}>네, 같아요</Button></>;
  if (step === 3) footer = <><Button secondary onClick={() => setStep(2)}>‹ 이전</Button><Button disabled={!corrected} onClick={() => setStep(4)}>수정 완료하고 다음 ❯</Button></>;
  if (step === 4) footer = <><Button secondary onClick={() => setStep(3)}>‹ 이전</Button><Button disabled={!bag} onClick={() => setStep(5)}>다음 (결제하기) ❯</Button></>;
  if (step === 5) footer = <><Button secondary disabled={paying} onClick={() => setStep(4)}>‹ 이전</Button><Button disabled={paying} onClick={() => setPaying(true)}>{paying ? '결제 연습 중…' : '카드 넣기 (연습)'}</Button></>;
  if (step === 6) footer = <><Button secondary onClick={restart}>↻ 다시 연습하기</Button><Button onClick={() => setStep(7)}>다음 (완료하기) ❯</Button></>;
  return <Frame brand="daiso" step={step} title={titles[step]} guide={guides[step]} footer={footer} learning={learning}
    context={{ scanned: scanned.map((i) => goods[i].name), quantities, bag: bag?.name, corrected, message }}>
    {step === 0 && <><div className="scanner-art" aria-hidden="true"><div><span /><b>▥▥▥</b></div></div><section className="shop-receipt"><h2>연습할 상품 (총 3가지)</h2>{list(goods.map((item) => item.actual))}</section></>}
    {step === 1 && <><div className="scan-products">{goods.map((item, i) => <button key={item.name} disabled={scanned.includes(i)} onClick={() => scan(i)}><span className="goods-icon">{item.icon}</span><strong>{item.name}<small>{won(item.price)}</small></strong><b>{scanned.includes(i) ? '✓ 스캔됨' : '스캔하기'}</b></button>)}</div><section className="shop-receipt"><h2>스캔된 상품 ({scanned.length}/3가지)</h2>{list(quantities)}</section><p role="status">{scanned.length === 3 ? '스캔 완료! 실제 수량과 비교해 보세요.' : '아직 스캔하지 않은 상품을 눌러주세요.'}</p></>}
    {step === 2 && <><div className="compare-lists"><section className="shop-receipt"><h2>실제 바구니</h2>{list(goods.map((item) => item.actual))}</section><section className="shop-receipt"><h2>스캔한 목록</h2>{list(quantities)}</section></div><p className="pink-hint">두 목록이 같나요?</p>{message && <p className="error-message" role="alert">{message}</p>}</>}
    {step === 3 && <><section className="shop-receipt"><h2>스캔한 상품 목록 (수정 가능)</h2>{list(quantities, true)}</section><section className="shop-receipt correct-list"><h2>올바른 수량</h2>{list(goods.map((item) => item.actual))}</section><p role="status">{corrected ? '✓ 실제 상품과 수량이 같아요!' : '모든 상품을 실제 수량과 맞춰 주세요.'}</p><div className="shop-total">합계 ({quantities.reduce((a, b) => a + b, 0)}개) <b>{won(subtotal)}</b></div></>}
    {step === 4 && <><div className="bag-options">{bags.map((item) => <button key={item.name} aria-pressed={bag?.name === item.name} onClick={() => setBag(item)}><span className="radio-dot" /><span className="goods-icon">{item.icon}</span><strong>{item.name}<small>{item.price ? won(item.price) : '(직접 가져갈게요)'}</small></strong></button>)}</div><div className="shop-total">상품 합계 <strong>{won(subtotal)}</strong></div><div className="shop-total">결제할 금액 <b>{won(total)}</b></div></>}
    {step === 5 && <><section className="shop-receipt"><h2>결제 내용</h2><div className="shop-total">상품 금액 (4개)<strong>{won(subtotal)}</strong></div><div className="shop-total">{bag.name}<strong>{won(bag.price)}</strong></div><div className="shop-total">최종 결제금액<b>{won(total)}</b></div></section><div className="practice-terminal"><h2>카드 결제 (연습용)</h2><p>아래 버튼을 눌러<br />카드를 넣는 연습을 해요.</p><div className="terminal-art" aria-hidden="true"><span>💳</span></div><p role="status">{paying ? '결제 연습 중…' : '카드나 개인정보가 필요하지 않아요.'}</p></div></>}
    {step === 6 && <><div className="feedback-success"><h2>✓ 거의 다 했어요!</h2><p>선택 기록을 바탕으로<br />오늘의 연습을 돌아봐요.</p></div><section className="shop-receipt"><h2>이번 연습 결과</h2><ul className="review-list"><li>✓ 상품 3가지 스캔 완료</li><li>✓ 실제 바구니와 목록 비교</li><li>✓ 수세미 3개 → 2개 수정</li><li>✓ {bag.name} ({won(bag.price)})</li><li>✓ 카드 결제 연습: {won(total)}</li></ul></section><p className="pink-hint">처음에는 수세미가 중복 스캔됐지만,<br />수량을 2개로 잘 수정했어요!</p></>}
    {step === 7 && <Completion name="다이소 셀프계산대" onRestart={restart} onExit={onExit} onHome={onHome} />}
    {step > 0 && step < 7 && <button className="shop-home" disabled={paying} onClick={onHome}>⌂ 처음으로</button>}
  </Frame>;
}
