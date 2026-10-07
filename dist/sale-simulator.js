'use strict';

function calculateTraditionalSale({ price, negotiation, rate, vat, basis, months, holding, preparation }) {
  const amounts = [price, holding, preparation];
  if (amounts.some(value => !Number.isFinite(value) || value < 0 || value > 100000000)) return null;
  if ([negotiation, rate, vat].some(value => !Number.isFinite(value) || value < 0 || value > 100)) return null;
  if (!Number.isInteger(months) || months < 0 || months > 120 || !['sale', 'asking'].includes(basis)) return null;
  const asking = Math.round(price * 100);
  const discount = Math.round(asking * negotiation / 100);
  const sale = asking - discount;
  const commissionBase = basis === 'sale' ? sale : asking;
  const commissionCalculator = typeof module !== 'undefined' && module.exports
    ? require('./commission.js').calculateCommission : calculateCommission;
  const commission = commissionCalculator(commissionBase / 100, rate, vat).total;
  const holdingCents = Math.round(holding * 100);
  const preparationCents = Math.round(preparation * 100);
  return { asking, discount, sale, commissionBase, commission, holding: holdingCents, preparation: preparationCents, net: sale - commission - holdingCents - preparationCents };
}

if (typeof module !== 'undefined' && module.exports) module.exports = { calculateTraditionalSale };

if (typeof document !== 'undefined') {
  const dialog = document.getElementById('sale-simulator');
  if (dialog && typeof dialog.showModal === 'function') {
    const simulation = document.getElementById('sale-simulation-form');
    const invitation = document.getElementById('sale-invitation');
    const leadFlow = document.getElementById('lead-flow');
    const leadForm = document.getElementById('lead-form');
    const reopenButton = leadFlow.querySelector('[data-open-sale-simulator]');
    const slider = document.getElementById('sale-price-slider');
    const error = document.getElementById('sale-error');
    const fields = Array.from(simulation.querySelectorAll('[name]'));
    const priceInput = document.getElementById('sale-price');
    const announcement = document.getElementById('sale-announcement');
    const money = new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0, maximumFractionDigits: 2 });
    const percent = new Intl.NumberFormat('pt-PT', { maximumFractionDigits: 2 });
    const format = cents => money.format(cents / 100);
    let announcementTimer;
    let invitationOffered = false;

    function update() {
      clearTimeout(announcementTimer);
      const values = {};
      let valid = true;
      fields.forEach(field => {
        valid = field.validity.valid && valid;
        field.setAttribute('aria-invalid', String(!field.validity.valid));
        values[field.name] = field.name === 'basis' ? field.value : field.type === 'number' ? field.valueAsNumber : Number(field.value);
      });
      const result = valid ? calculateTraditionalSale(values) : null;
      error.hidden = Boolean(result);
      error.textContent = result ? '' : 'Preencha os valores em falta. Use custos entre 0 e 100 milhões de euros, percentagens entre 0 e 100 e um prazo entre 0 e 120 meses.';
      dialog.querySelectorAll('[data-sale-output]').forEach(output => {
        const name = output.dataset.saleOutput;
        output.textContent = result ? `${output.classList.contains('sale-minus') && result[name] > 0 ? '−' : ''}${format(result[name])}` : '—';
      });
      document.getElementById('sale-negative').hidden = !result || result.net >= 0;
      if (result) {
        document.getElementById('sale-discount-label').textContent = `${percent.format(values.negotiation)}% neste exemplo`;
        document.getElementById('sale-commission-label').textContent = `${percent.format(values.rate)}% + ${percent.format(values.vat)}% IVA sobre ${format(result.commissionBase)}`;
        document.getElementById('sale-wait-label').textContent = `Total em ${values.months} ${values.months === 1 ? 'mês' : 'meses'}`;
        document.getElementById('sale-period').textContent = `Num cenário de venda em ${values.months} ${values.months === 1 ? 'mês' : 'meses'}.`;
      } else {
        for (const id of ['sale-discount-label', 'sale-commission-label', 'sale-wait-label', 'sale-period']) document.getElementById(id).textContent = '';
      }
      if (priceInput.validity.valid) {
        slider.max = String(Math.max(1000000, Math.ceil(values.price / 100000) * 100000));
        slider.value = String(values.price);
        slider.setAttribute('aria-valuetext', money.format(values.price));
        slider.style.setProperty('--sale-fill', `${values.price / Number(slider.max) * 100}%`);
        document.getElementById('sale-range-max').textContent = money.format(Number(slider.max));
      }
      if (dialog.open) announcementTimer = setTimeout(() => {
        announcement.textContent = result ? `Estimativa após estes custos: ${format(result.net)}. Prazo do cenário: ${values.months} meses. Não é uma proposta nem uma previsão.` : error.textContent;
      }, 500);
    }

    function startLead() {
      if (dialog.open) dialog.close();
      if (invitation.open) invitation.close();
      const target = leadFlow.querySelector('#lead-form:not([hidden]) fieldset:not([hidden]) input:not([disabled]), .form-result:not([hidden])');
      target?.focus({ preventScroll: true });
      document.getElementById('pedido').scrollIntoView({ block: 'start', behavior: 'instant' });
    }

    function syncScrollLock() {
      document.body.classList.toggle('sale-dialog-open', dialog.open || invitation.open);
    }

    function offerSimulation() {
      if (invitationOffered) return;
      invitationOffered = true;
      reopenButton.hidden = false;
      invitation.showModal();
      syncScrollLock();
      document.getElementById('sale-invitation-close').focus({ preventScroll: true });
    }

    // Show the choice once, only after the visitor starts the form or uses a CTA.
    leadForm.addEventListener('change', event => {
      if (event.target.name === 'tipoImovel') offerSimulation();
    });
    leadForm.addEventListener('submit', event => {
      if (invitationOffered || !leadForm.querySelector('[name="tipoImovel"]:checked')) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      offerSimulation();
    }, true);
    document.querySelectorAll('a[href="#pedido"]').forEach(link => {
      link.addEventListener('click', event => {
        if (invitationOffered || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
        event.preventDefault();
        offerSimulation();
      });
    });

    // The optional simulation never changes or submits the seller's answers.
    document.querySelectorAll('[data-open-sale-simulator]').forEach(button => {
      button.addEventListener('click', () => {
        if (invitation.open) invitation.close();
        dialog.showModal();
        syncScrollLock();
        dialog.scrollTop = 0;
        document.getElementById('sale-simulator-close').focus({ preventScroll: true });
        update();
      });
    });
    document.querySelectorAll('[data-start-lead]').forEach(button => button.addEventListener('click', startLead));
    document.getElementById('sale-invitation-close').addEventListener('click', () => invitation.close());
    invitation.addEventListener('close', syncScrollLock);
    document.getElementById('sale-simulator-close').addEventListener('click', () => dialog.close());
    dialog.addEventListener('close', () => {
      syncScrollLock();
      clearTimeout(announcementTimer);
    });
    simulation.addEventListener('submit', event => event.preventDefault());
    fields.forEach(field => field.addEventListener('input', update));
    slider.addEventListener('input', () => { priceInput.value = slider.value; update(); });
    document.getElementById('sale-reset').addEventListener('click', () => { simulation.reset(); update(); });
    update();
  }
}
