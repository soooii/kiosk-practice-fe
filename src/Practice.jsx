import React, { useState } from 'react';
import { kiosks, products, seatLabels, burgers, burgerPrice, movies, ticketTypes } from './kiosks.js';
import artwork from './artwork.js';
import PracticeFrame from './PracticeFrame.jsx';
import { useLearning } from './LearningAssistant.jsx';

const won = (price) => price.toLocaleString('ko-KR') + '원';
const reservedSeats = ['A3', 'A4', 'B4', 'C1', 'C2', 'D5', 'E6'];
const showDates = ['오늘', '내일'];
const theater = 'CGV 용산아이파크몰';

function Counter({ label, value, max, min = 0, onChange }) {
  return (
    <div className="counter kiosk-counter">
      <button aria-label={label + ' 줄이기'} disabled={value <= min} onClick={() => onChange(value - 1)}>−</button>
      <strong aria-live="polite">{value}</strong>
      <button aria-label={label + ' 늘리기'} disabled={value >= max} onClick={() => onChange(value + 1)}>+</button>
    </div>
  );
}

export default function Practice({ kiosk, onExit }) {
  const scenario = kiosks[kiosk];
  const { brand, steps, total } = scenario;
  const [step, setStep] = useState(0);
  const [order, setOrder] = useState({});
  const market = kiosk === 3;
  const burger = kiosk === 1;
  const cinema = kiosk === 2;
  const branded = burger || cinema;
  const payment = steps.length;
  const checkout = payment + 1;
  const review = branded ? checkout + 1 : payment + 1;
  const done = review + 1;
  const current = steps[step];
  const value = order[step];
  const scans = order[0] ?? [];
  const quantities = order[1] ?? [];
  const seats = order[3] ?? [];
  const tickets = cinema ? order[2] ?? [0, 0, 0, 0] : [];
  const seatCount = tickets.reduce((sum, count) => sum + count, 0);
  const movie = movies.find(({ name }) => name === order[0]);
  const quantity = order.quantity ?? 1;
  const date = order.date ?? showDates[0];
  const ticketSummary = ticketTypes.flatMap(({ name }, i) => tickets[i] ? [name + ' ' + tickets[i] + '명'] : []).join(' · ');
  const single = burger && order[2] === '단품';
  function select(nextValue) {
    setOrder((previous) => ({ ...previous, [step]: nextValue }));
  }

  function update(name, value) {
    setOrder((previous) => ({ ...previous, [name]: value }));
  }

  function scan(index) {
    const nextScans = [...scans, index];
    const nextQuantities = [...(order[1] ?? [0, 0, 0])];
    nextQuantities[index] = index === 1 ? 2 : 1;
    setOrder({ ...order, 0: nextScans, 1: nextQuantities });
  }

  function advance() {
    setStep(single && step === 2 ? payment : step + 1);
  }

  const canAdvance = market && step === 0 ? scans.length === products.length :
    cinema && step === 2 ? seatCount > 0 :
    cinema && step === 3 ? seatCount > 0 && seats.length === seatCount :
    market && step === 1 ? quantities.some((quantity) => quantity > 0) : Boolean(value);
  const title = current?.title ?? (step === payment ? (cinema ? '예매 내용을 확인하세요' : burger ? '장바구니를 확인하세요' : '장바구니와 결제') :
    branded && step === checkout ? '결제 방법을 선택하세요' :
    step === review ? (market ? '연습 영수증' : '내 주문 돌아보기') : '잘했어요!');
  const orderLines = steps.flatMap(({ options }, i) =>
    options && order[i] && !(single && i > 2) ? [order[i]] : []);
  if (cinema && seats.length) orderLines.push(seats.join(', '));
  const paymentMethods = cinema ? ['신용카드', '간편결제', '상품권'] : ['카드 결제', '모바일 결제'];

  const guide = current?.help ?? (
    step === payment ? '선택한 내용과 합계를 확인하세요.' :
    branded && step === checkout ? '결제 수단을 고른 뒤 모의 결제를 누르세요.' :
    step === review ? '내역을 확인하고 완료하기를 누르세요.' : undefined
  );
  const learning = useLearning(brand, step, title, step === review, step === done);
  const header = <header className="practice-header"><strong>{brand}</strong><span className="practice-badge">연습용</span></header>;
  const footer = <>
      <button className="back" onClick={() => {
        if (step > 0 && step < review) {
          setStep(single && step === payment ? 2 : step - 1);
        } else {
          onExit();
        }
      }}>{step > 0 && step < review ? '이전 단계' : '다른 키오스크 연습하기'}</button>
      {step < payment && <button className="primary" disabled={!canAdvance} onClick={advance}>다음</button>}
      {step === payment && <button className="primary" onClick={() => setStep(branded ? checkout : review)}>
        {branded ? '결제로 이동' : '카드 넣기 연습'}
      </button>}
      {branded && step === checkout && <button className="primary" disabled={!order.method} onClick={() => setStep(review)}>모의 결제</button>}
      {step === review && <button className="primary" onClick={() => setStep(done)}>완료하기</button>}
  </>;

  return (
    <PracticeFrame className={branded ? `kiosk-flow ${cinema ? 'kiosk-cinema' : 'kiosk-burger'}` : 'practice-flow'}
      header={header} step={step} count={done + 1} title={title} guide={guide} footer={footer}
      learning={learning} context={order} reviewing={step === review} completed={step === done}>
      {step === done && <div className="success-icon" aria-hidden="true">✓</div>}

      {cinema && step === 1 && (
        <div className="summary show-date">
          <strong>{movie.name} · 2D 일반</strong>
          <span>{theater}</span>
          <label>관람일 <select value={date} onChange={(event) => update('date', event.target.value)}>
            {showDates.map((day) => <option key={day}>{day}</option>)}
          </select></label>
        </div>
      )}
      {current?.options && (
        <div className={`choices ${burger && step === 1 ? 'burger-menu' : cinema && step === 1 ? 'showtimes' : ''}`} role="group" aria-label={title}>
          {current.options.map((option, i) => (
            <button key={option} className="option" aria-pressed={value === option} onClick={() => select(option)}>
              {burger && step === 1 && <img src={artwork[2]} alt="" />}
              {cinema && step === 0 && <span className={`film-poster poster-${i}`} aria-hidden="true">{movies[i].icon}</span>}
              {burger && step >= 2 && <span aria-hidden="true">{step === 2 && i === 0 ? '🍔' : step <= 3 ? '🍔🍟' : step === 4 ? ['🍟', '🥔', '🌽'][i] : '🥤'}</span>}
              {current.icons && <span aria-hidden="true">{current.icons[i]}</span>}
              <span>{option}
                {current.prices && <small>{won(current.prices[i])}</small>}
                {burger && step === 1 && <small>단품 {won(burgers[i].price)}<br />세트 {won(burgers[i].price + 1900)}</small>}
                {burger && step === 2 && <small>{i === 0 ? '버거만' : '버거 + 사이드 + 음료'} · {won(burgerPrice({ ...order, 2: option, 3: '미디엄' }))}</small>}
                {burger && step === 3 && <small>{i === 0 ? '보통 크기' : '더 큰 크기'} · {won(burgerPrice({ ...order, 3: option }))}</small>}
                {cinema && step === 0 && <small>{movies[i].rating} · {movies[i].genre} · {movies[i].duration}분</small>}
              </span>
              {value === option && <span className="selection-mark" aria-hidden="true">✓</span>}
            </button>
          ))}
        </div>
      )}

      {cinema && step === 2 && (
        <div className="ticket-list">
          {ticketTypes.map(({ name, price }, i) => (
            <div className="ticket-row" key={name}>
              <div><strong>{name}</strong><small>{won(price)}</small></div>
              <Counter label={name + ' 인원'} value={tickets[i]} max={6 - seatCount + tickets[i]}
                onChange={(count) => select(tickets.map((value, index) => index === i ? count : value))} />
            </div>
          ))}
          <p role="status">선택 인원 {seatCount}명 · {won(total(order))}</p>
        </div>
      )}

      {cinema && step === 3 && (
        <>
          <p className="screen-label">스크린</p>
          <p className="seat-legend">□ 선택 가능　✓ 선택함　× 예매 완료</p>
          <div className="seats" role="group" aria-label="좌석 배치">
            {seatLabels.map((seat) => (
              <button key={seat} className="option" aria-pressed={seats.includes(seat)}
                disabled={reservedSeats.includes(seat) || (!seats.includes(seat) && seats.length >= seatCount)}
                aria-label={reservedSeats.includes(seat) ? seat + ' 예매된 좌석' : seat}
                data-reserved={reservedSeats.includes(seat) || undefined}
                onClick={() => select(seats.includes(seat) ? seats.filter((item) => item !== seat) : [...seats, seat])}>
                {reservedSeats.includes(seat) ? '×' : seat}
              </button>
            ))}
          </div>
          <p role="status">선택 {seats.length} / {seatCount}석 {seats.length > 0 && '· ' + [...seats].sort().join(', ')}</p>
        </>
      )}

      {market && step === 0 && (
        <div className="choices">
          {products.map(({ name, icon, price }, i) => (
            <button key={name} className="option" disabled={scans.includes(i)} onClick={() => scan(i)}>
              <span aria-hidden="true">{icon}</span>
              <span>{name}<small>{won(price)}</small></span>
              <span className="scan-label">{scans.includes(i) ? '스캔됨' : '스캔'}</span>
            </button>
          ))}
          <p role="status">실물 상품 {scans.length} / {products.length}개 스캔</p>
        </div>
      )}

      {market && step === 1 && (
        <div className="choices">
          {products.map(({ name, icon }, i) => (
            <section key={name} className="summary scan-row">
              <strong><span aria-hidden="true">{icon} </span>{name}</strong>
              <span>실물 1개</span>
              <div className="counter">
                <button aria-label={name + ' 스캔 수량 줄이기'} disabled={quantities[i] === 0}
                  onClick={() => select(quantities.map((quantity, index) => index === i ? quantity - 1 : quantity))}>−</button>
                <span aria-live="polite">스캔 {quantities[i]}개</span>
                <button aria-label={name + ' 스캔 수량 늘리기'} disabled={quantities[i] === 2}
                  onClick={() => select(quantities.map((quantity, index) => index === i ? quantity + 1 : quantity))}>+</button>
              </div>
            </section>
          ))}
        </div>
      )}

      {(step === payment || (branded && step === checkout) || step === review || step === done) && (
        <section className="summary" aria-label={step === payment ? '장바구니' : '주문 내역'}>
          {step === review && <strong>연습 {cinema ? '예매' : '주문'}번호 027</strong>}
          {market && products.map(({ name, price }, i) => quantities[i] > 0 && (
            <div className="receipt-line" key={name}><span>{name} × {quantities[i]}</span><span>{won(price * quantities[i])}</span></div>
          ))}
          {cinema ? (
            <dl className="booking-details">
              <dt>영화</dt><dd>{movie.name}</dd>
              <dt>극장</dt><dd>{theater}</dd>
              <dt>회차</dt><dd>{date} {order[1]}</dd>
              <dt>인원</dt><dd>{ticketSummary}</dd>
              <dt>좌석</dt><dd>{[...seats].sort().join(', ')}</dd>
            </dl>
          ) : <p>{orderLines.join(' · ')}{market && order[2] === '봉투 1장' && ' (100원)'}</p>}
          {burger && (step === payment ?
            <Counter label="주문 수량" value={quantity} min={1} max={9} onChange={(count) => update('quantity', count)} /> :
            <p>수량 {quantity}개</p>)}
          <strong className={branded ? 'kiosk-total' : undefined}>합계 {won(total(order))}</strong>
        </section>
      )}

      {branded && step === checkout && (
        <div className="choices" role="group" aria-label="모의 결제 방법">
          <p className="notice">실제 결제는 없습니다</p>
          {paymentMethods.map((method, i) => (
            <button key={method} className="option" aria-pressed={order.method === method} onClick={() => update('method', method)}>
              <span aria-hidden="true">{['💳', '📱', '🎁'][i]}</span>{method} (연습)
            </button>
          ))}
        </div>
      )}
      {!branded && step === payment && (
        <div className="payment-guide">
          <div className="card-reader" aria-hidden="true"><span>💳</span></div>
          <p>카드의 칩이 단말기 슬롯을 향하도록 넣어요.</p>
          <p className="notice">실제 결제는 없습니다</p>
        </div>
      )}
      {step === done && <p className="success-banner">✓ 연습을 완료했어요</p>}

    </PracticeFrame>
  );
}
