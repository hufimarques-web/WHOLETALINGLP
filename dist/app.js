'use strict';
// Preview only: responses stay in memory; no submission, analytics or storage.
if (window.lucide) window.lucide.createIcons();
const form = document.getElementById('lead-form');
const steps = [...form.querySelectorAll('fieldset')];
const titles = ['O imóvel', 'A sua venda', 'Preço e condições', 'A conversa'];
const back = document.getElementById('back');
const next = document.getElementById('next');
const error = document.getElementById('form-error');
const noFit = document.getElementById('no-fit');
const result = document.getElementById('preview-result');
const situation = document.getElementById('situacao');
const originalOptions = situation.innerHTML;
const offerField = document.getElementById('offer-field');
const offerInput = document.getElementById('melhor-proposta');
let step = 0;

function syncOffer() {
  const hasOffer = document.getElementById('propostas').value === 'sim';
  offerField.hidden = !hasOffer;
  offerInput.disabled = !hasOffer;
}
function showStep(index, focus = true) {
  step = index;
  form.hidden = false;
  noFit.hidden = true;
  result.hidden = true;
  steps.forEach((panel, i) => { panel.hidden = i !== index; panel.disabled = i !== index; });
  syncOffer();
  back.hidden = index === 0;
  next.querySelector('span').textContent = index === 3 ? 'Ver resumo de teste' : 'Continuar';
  document.getElementById('step-name').textContent = titles[index];
  document.getElementById('step-count').textContent = `0${index + 1} / 04`;
  document.getElementById('progress-fill').style.width = `${(index + 1) * 25}%`;
  document.querySelector('.progress').setAttribute('aria-valuenow', String(index + 1));
  error.hidden = true;
  if (focus) {
    steps[index].querySelector('input,select,textarea').focus({ preventScroll: true });
    steps[index].scrollIntoView({ block: 'nearest', behavior: 'instant' });
  }
}
function values() {
  const data = {};
  form.querySelectorAll('[name]').forEach(el => {
    if (el.type === 'radio' && !el.checked) return;
    if (el === offerInput && document.getElementById('propostas').value !== 'sim') return;
    data[el.name] = el.value.trim();
  });
  return data;
}
function fail(message, input) {
  error.textContent = message;
  error.hidden = false;
  input.setAttribute('aria-invalid', 'true');
  input.setAttribute('aria-describedby', 'form-error');
  input.focus();
}
function validateCurrent() {
  const inputs = [...steps[step].querySelectorAll('input,select,textarea')].filter(el => !el.disabled);
  inputs.forEach(el => { el.removeAttribute('aria-invalid'); el.removeAttribute('aria-describedby'); });
  const invalid = inputs.find(el => !el.checkValidity() || (el.required && el.type !== 'radio' && !el.value.trim()));
  if (invalid) {
    fail(invalid.type === 'radio' ? 'Selecione o tipo de imóvel para continuar.' : 'Preencha os campos obrigatórios com valores válidos.', invalid);
    return false;
  }
  if (step === 2) {
    const price = Number(document.getElementById('pedido-preco').value);
    const minimum = Number(document.getElementById('minimo').value);
    if (price && minimum > price) {
      fail('O mínimo indicado é superior ao preço pedido. Confirme os dois valores.', document.getElementById('minimo'));
      return false;
    }
  }
  if (step === 3) {
    const phone = document.getElementById('telefone');
    const compact = phone.value.replace(/[\s()-]/g, '');
    if (!/^(?:\+|00)?[0-9]{9,15}$/.test(compact)) {
      fail('Indique um telefone válido. Pode incluir o indicativo internacional.', phone);
      return false;
    }
  }
  return true;
}
function showSummary() {
  const data = values();
  const summary = document.getElementById('summary');
  summary.replaceChildren();
  const items = {
    'Imóvel e localização': `${data.tipoImovel} · ${data.concelho}, ${data.freguesia}`,
    'Área indicada': `${data.areaM2} m² · ${data.tipoArea}`,
    'Mínimo a estudar': new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(Number(data.valorMinimoAbsoluto)),
    'Prazo pretendido': data.prazoPretendido,
    'Fotografias': data.fotosDisponiveis,
    'Estado inicial previsto': 'Nova lead · Não contactado · Por analisar'
  };
  Object.entries(items).forEach(([label, value]) => {
    const dt = document.createElement('dt');
    const dd = document.createElement('dd');
    dt.textContent = label;
    dd.textContent = value;
    summary.append(dt, dd);
  });
  form.hidden = true;
  result.hidden = false;
  document.getElementById('step-name').textContent = 'Resumo';
  result.focus({ preventScroll: true });
  result.scrollIntoView({ block: 'nearest', behavior: 'instant' });
}
form.addEventListener('submit', event => {
  event.preventDefault();
  if (!validateCurrent()) return;
  if (step === 2 && document.getElementById('enquadramento').value === 'nao') {
    form.hidden = true;
    noFit.hidden = false;
    noFit.focus({ preventScroll: true });
    noFit.scrollIntoView({ block: 'nearest', behavior: 'instant' });
    return;
  }
  if (step < 3) showStep(step + 1);
  else showSummary();
});
form.addEventListener('change', event => {
  if (event.target.name !== 'tipoImovel') return;
  const isLand = event.target.value === 'Terreno';
  situation.innerHTML = isLand
    ? '<option value="">Selecione</option><option>Construção confirmada por documento</option><option>Possível construção, ainda por confirmar</option><option>Terreno rústico / agrícola</option><option>Não sei</option>'
    : originalOptions;
  if (isLand) document.getElementById('area-tipo').value = 'Área do terreno';
});
document.getElementById('propostas').addEventListener('change', syncOffer);
back.addEventListener('click', () => showStep(Math.max(0, step - 1)));
document.getElementById('reconsider').addEventListener('click', () => showStep(2));
document.getElementById('edit').addEventListener('click', () => showStep(0));
document.getElementById('restart').addEventListener('click', () => {
  form.reset();
  situation.innerHTML = originalOptions;
  form.querySelectorAll('[aria-invalid]').forEach(el => { el.removeAttribute('aria-invalid'); el.removeAttribute('aria-describedby'); });
  document.getElementById('summary').replaceChildren();
  showStep(0);
});
const privacy = document.getElementById('privacy-dialog');
document.getElementById('privacy-open').addEventListener('click', () => privacy.showModal());
document.getElementById('privacy-close').addEventListener('click', () => privacy.close());
privacy.addEventListener('click', event => {
  if (event.target !== privacy) return;
  const bounds = privacy.getBoundingClientRect();
  if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) privacy.close();
});
const playBtn = document.querySelector('.video-play-btn');
if (playBtn) {
  playBtn.addEventListener('click', () => {
    document.getElementById('pedido')?.scrollIntoView({ behavior: 'smooth' });
  });
}
const storyTabs = Array.from(document.querySelectorAll('.story-tabs [role="tab"]'));
if (storyTabs.length > 0) {
  function selectStory(index, moveFocus = false) {
    storyTabs.forEach((tab, current) => {
      const selected = current === index;
      tab.setAttribute('aria-selected', String(selected));
      tab.tabIndex = selected ? 0 : -1;
      const ctrl = document.getElementById(tab.getAttribute('aria-controls'));
      if (ctrl) ctrl.hidden = !selected;
    });
    if (moveFocus) storyTabs[index].focus();
  }
  storyTabs.forEach((tab, index) => {
    tab.addEventListener('click', () => selectStory(index));
    tab.addEventListener('keydown', event => {
      let target;
      if (event.key === 'ArrowRight') target = (index + 1) % storyTabs.length;
      if (event.key === 'ArrowLeft') target = (index - 1 + storyTabs.length) % storyTabs.length;
      if (event.key === 'Home') target = 0;
      if (event.key === 'End') target = storyTabs.length - 1;
      if (target === undefined) return;
      event.preventDefault();
      selectStory(target, true);
    });
  });
}
showStep(0, false);
