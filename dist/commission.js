'use strict';

function calculateCommission(price, rate, vat) {
  if (![price, rate, vat].every(Number.isFinite) || price < 0 || price > 100000000 || rate < 0 || rate > 100 || vat < 0 || vat > 100) return null;
  // Round each payable amount to cents before calculating the remainder.
  const priceCents = Math.round(price * 100);
  const base = Math.round(priceCents * rate / 100);
  const tax = Math.round(base * vat / 100);
  return { base, tax, total: base + tax, remaining: priceCents - base - tax };
}

if (typeof module !== 'undefined' && module.exports) module.exports = { calculateCommission };

if (typeof document !== 'undefined') {
  const calculator = document.getElementById('commission-calculator');
  if (calculator) {
    const price = document.getElementById('commission-price');
    const rate = document.getElementById('commission-rate');
    const vat = document.getElementById('commission-vat');
    const slider = document.getElementById('commission-slider');
    const error = document.getElementById('commission-error');
    const announcement = document.getElementById('commission-announcement');
    const money = new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 2 });
    let announcementTimer;

    function update() {
      clearTimeout(announcementTimer);
      const valid = price.validity.valid && rate.validity.valid;
      price.setAttribute('aria-invalid', String(!price.validity.valid));
      rate.setAttribute('aria-invalid', String(!rate.validity.valid));
      const result = valid ? calculateCommission(price.valueAsNumber, rate.valueAsNumber, Number(vat.value)) : null;
      error.hidden = Boolean(result);
      error.textContent = result ? '' : 'Indique um valor de venda entre 0 e 100 milhões de euros e uma comissão entre 0% e 100%.';
      for (const name of ['base', 'tax', 'total', 'remaining']) {
        document.getElementById(`commission-${name}`).textContent = result ? money.format(result[name] / 100) : '—';
      }
      if (rate.validity.valid) {
        slider.max = String(Math.max(10, Math.ceil(rate.valueAsNumber)));
        slider.value = rate.value;
        slider.setAttribute('aria-valuetext', `${rate.value} por cento`);
      }
      announcementTimer = setTimeout(() => {
        announcement.textContent = result
          ? `Comissão e IVA: ${money.format(result.total / 100)}. Fica com ${money.format(result.remaining / 100)}, antes de outros custos.`
          : error.textContent;
      }, 400);
    }

    slider.addEventListener('input', () => { rate.value = slider.value; update(); });
    for (const control of [price, rate, vat]) control.addEventListener('input', update);
    update();
  }
}
