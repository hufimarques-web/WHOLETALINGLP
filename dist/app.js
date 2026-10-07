'use strict';
// Answers stay in memory until the visitor explicitly submits them.
if (window.lucide) window.lucide.createIcons();
const form = document.getElementById('lead-form');
const steps = [...form.querySelectorAll('fieldset')];
const titles = ['O imóvel', 'Localização e estado', 'A sua venda', 'Preço e condições', 'A conversa'];
const priceStep = steps.findIndex(panel => panel.querySelector('#minimo'));
const contactStep = steps.findIndex(panel => panel.querySelector('#telefone'));
const back = document.getElementById('back');
const next = document.getElementById('next');
const error = document.getElementById('form-error');
const noFit = document.getElementById('no-fit');
const result = document.getElementById('preview-result');
const situation = document.getElementById('situacao');
const originalOptions = situation.innerHTML;
const offerField = document.getElementById('offer-field');
const offerInput = document.getElementById('melhor-proposta');
const licence = document.getElementById('licenca');
const confirmForm = document.getElementById('confirm-form');
const confirmPhone = document.getElementById('confirmar-telefone');
const sendStatus = document.getElementById('send-status');
const sendButton = document.getElementById('send');
let step = 0;
let sending = false;
let sent = false;
let requestId = crypto.randomUUID();
let startedAt = Date.now();
let pendingPayload = null;
const contactConsent = document.getElementById('contact-consent');
const success = document.getElementById('send-success');

function normalizePhone(value) {
  let phone = value.replace(/[\s().-]/g, '').replace(/^00/, '+');
  if (/^9\d{8}$/.test(phone)) phone = `+351${phone}`;
  return phone;
}
function validPhone(value) {
  const phone = normalizePhone(value);
  return /^\+[1-9]\d{7,14}$/.test(phone) && (!phone.startsWith('+351') || /^\+3519\d{8}$/.test(phone));
}
function syncLicence() {
  const isLand = form.querySelector('[name="tipoImovel"]:checked')?.value === 'Terreno';
  document.getElementById('licenca-field').hidden = isLand;
  licence.disabled = isLand;
}

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
  syncLicence();
  back.hidden = index === 0;
  next.querySelector('span').textContent = index === steps.length - 1 ? 'Rever e confirmar' : 'Continuar';
  document.getElementById('step-name').textContent = titles[index];
  document.getElementById('step-count').textContent = `${String(index + 1).padStart(2, '0')} / ${String(steps.length).padStart(2, '0')}`;
  document.getElementById('progress-fill').style.width = `${(index + 1) / steps.length * 100}%`;
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
    if (el === licence && licence.disabled) return;
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
  if (step === priceStep) {
    const price = Number(document.getElementById('pedido-preco').value);
    const minimum = Number(document.getElementById('minimo').value);
    if (price && minimum > price) {
      fail('O mínimo indicado é superior ao preço pedido. Confirme os dois valores.', document.getElementById('minimo'));
      return false;
    }
  }
  if (step === contactStep) {
    const phone = document.getElementById('telefone');
    if (!validPhone(phone.value)) {
      fail('Indique um telemóvel com 9 algarismos. Para outro país, inclua o indicativo, por exemplo +44.', phone);
      return false;
    }
  }
  return true;
}
function showSummary() {
  pendingPayload = null;
  const data = values();
  const summary = document.getElementById('summary');
  summary.replaceChildren();
  const items = {
    'Imóvel e localização': `${data.tipoImovel} · ${data.localizacao}`,
    'Área indicada': `${data.areaM2} m² · ${data.tipoArea}`,
    'Estado': data.situacaoAtual,
    ...(data.licencaHabitacao ? { 'Licença de habitação': data.licencaHabitacao === 'sim' ? 'Sim' : 'Não' } : {}),
    'Numa imobiliária': data.numaImobiliaria === 'sim' ? 'Sim' : 'Não',
    'Tempo à venda': data.tempoVenda,
    'Propostas recebidas': data.propostasRecebidas === 'sim' ? `Sim${data.melhorProposta ? ` · ${data.melhorProposta} €` : ''}` : data.propostasRecebidas === 'na' ? 'Ainda não anunciou' : 'Não',
    'Preço pedido': data.precoPedido ? `${data.precoPedido} €` : 'Não indicado',
    'Valor mínimo': new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(Number(data.valorMinimoAbsoluto)),
    'Aceita negociar': data.flexibilidade,
    'Preço e condições': data.enquadramento === 'sim' ? 'Sim, se fizerem sentido' : 'Quer saber mais',
    'Prazo pretendido': data.prazoPretendido,
    ...(data.motivo ? { 'Motivo da venda': data.motivo } : {}),
    'Fotografias': data.fotosDisponiveis,
    'Nome': data.nomeProprietario,
    'Melhor horário': data.horario
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
  confirmForm.hidden = false;
  sendButton.hidden = false;
  confirmPhone.disabled = false;
  contactConsent.checked = false;
  contactConsent.disabled = false;
  document.getElementById('phone-review').textContent = data.telefone;
  confirmPhone.value = '';
  confirmPhone.removeAttribute('aria-invalid');
  sendStatus.textContent = '';
  document.getElementById('step-name').textContent = 'Resumo';
  result.focus({ preventScroll: true });
  result.scrollIntoView({ block: 'nearest', behavior: 'instant' });
}
form.addEventListener('submit', event => {
  event.preventDefault();
  if (!validateCurrent()) return;
  if (step === priceStep && document.getElementById('enquadramento').value === 'nao') {
    form.hidden = true;
    noFit.hidden = false;
    noFit.focus({ preventScroll: true });
    noFit.scrollIntoView({ block: 'nearest', behavior: 'instant' });
    return;
  }
  if (step < steps.length - 1) showStep(step + 1);
  else showSummary();
});
form.addEventListener('change', event => {
  if (event.target.name !== 'tipoImovel') return;
  const isLand = event.target.value === 'Terreno';
  situation.innerHTML = isLand
    ? '<option value="">Selecione</option><option>Construção confirmada por documento</option><option>Possível construção, ainda por confirmar</option><option>Terreno rústico / agrícola</option><option>Não sei</option>'
    : originalOptions;
  if (event.target.value !== 'Moradia') [...situation.options].find(option => option.value === 'Ruína')?.remove();
  document.getElementById('area-tipo').value = isLand ? 'Área do terreno' : '';
  licence.value = '';
  syncLicence();
});
document.getElementById('edit-phone').addEventListener('click', () => {
  showStep(contactStep);
  document.getElementById('telefone').focus();
});
confirmForm.addEventListener('submit', async event => {
  event.preventDefault();
  if (sending) return;
  if (sent) return;
  confirmPhone.removeAttribute('aria-invalid');
  const data = values();
  if (!validPhone(confirmPhone.value) || normalizePhone(confirmPhone.value) !== normalizePhone(data.telefone)) {
    sendStatus.textContent = 'Os números não coincidem. Escreva o mesmo número ou escolha “Corrigir o número”.';
    confirmPhone.setAttribute('aria-invalid', 'true');
    confirmPhone.focus();
    return;
  }
  const endpoint = confirmForm.dataset.endpoint;
  if (endpoint !== 'https://crm-wholetaling.vercel.app/api/landing-leads' || confirmForm.dataset.enabled !== 'true') {
    sendStatus.textContent = 'O envio está temporariamente indisponível. Nenhuma resposta foi enviada.';
    return;
  }
  if (!contactConsent.checked) {
    sendStatus.textContent = 'Confirme que pretende ser contactado sobre este imóvel.';
    contactConsent.focus();
    return;
  }
  pendingPayload ??= {
    ...data, telefone: normalizePhone(data.telefone), telefoneConfirmacao: confirmPhone.value,
    requestId, startedAt, website: document.getElementById('website').value,
    contactConsent: true, privacyVersion: '2026-10-07-v1'
  };
  sending = true;
  sendButton.disabled = true;
  confirmPhone.disabled = true;
  contactConsent.disabled = true;
  confirmForm.setAttribute('aria-busy', 'true');
  result.querySelectorAll('.result-actions button, #edit-phone').forEach(button => { button.disabled = true; });
  sendButton.querySelector('span').textContent = 'A enviar…';
  sendStatus.textContent = '';
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(endpoint, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: controller.signal,
      body: JSON.stringify(pendingPayload), credentials: 'omit', cache: 'no-store', redirect: 'error'
    });
    const receipt = await response.json();
    if (!response.ok || receipt.accepted !== true || !/^lp-[a-f0-9]{64}$/.test(receipt.reference || '')) {
      if (response.status === 429) throw new Error('Recebemos muitos pedidos. Aguarde algum tempo e tente novamente.');
      if (response.status === 400) throw new Error('Verifique as respostas e confirme novamente o contacto.');
      throw new Error('Não foi possível confirmar o envio. As respostas continuam nesta página. Tente novamente sem a fechar.');
    }
    sent = true;
    result.hidden = true;
    success.hidden = false;
    document.getElementById('step-name').textContent = 'Pedido recebido';
    success.focus({ preventScroll: true });
    success.scrollIntoView({ block: 'nearest', behavior: 'instant' });
    form.reset();
    confirmForm.reset();
    pendingPayload = null;
    document.getElementById('summary').replaceChildren();
    document.getElementById('phone-review').textContent = '';
  } catch (error) {
    sendStatus.textContent = error.name === 'AbortError' || error instanceof TypeError
      ? 'A ligação foi interrompida. Não conseguimos confirmar o envio. Tente novamente: o mesmo pedido não será guardado duas vezes.'
      : error.message;
  } finally {
    clearTimeout(timeout);
    sending = false;
    sendButton.disabled = false;
    confirmPhone.disabled = false;
    contactConsent.disabled = false;
    confirmForm.removeAttribute('aria-busy');
    sendButton.querySelector('span').textContent = 'Enviar respostas';
    result.querySelectorAll('.result-actions button, #edit-phone').forEach(button => { button.disabled = false; });
  }
});
document.getElementById('propostas').addEventListener('change', syncOffer);
back.addEventListener('click', () => showStep(Math.max(0, step - 1)));
document.getElementById('reconsider').addEventListener('click', () => showStep(priceStep));
document.getElementById('edit').addEventListener('click', () => showStep(0));
function restartForm() {
  sent = false;
  pendingPayload = null;
  requestId = crypto.randomUUID();
  startedAt = Date.now();
  success.hidden = true;
  form.reset();
  confirmForm.reset();
  sendButton.hidden = false;
  confirmPhone.disabled = false;
  situation.innerHTML = originalOptions;
  form.querySelectorAll('[aria-invalid]').forEach(el => { el.removeAttribute('aria-invalid'); el.removeAttribute('aria-describedby'); });
  document.getElementById('summary').replaceChildren();
  showStep(0);
}
document.getElementById('restart').addEventListener('click', restartForm);
document.getElementById('new-request').addEventListener('click', restartForm);
const privacy = document.getElementById('privacy-dialog');
document.getElementById('privacy-open').addEventListener('click', () => privacy.showModal());
document.getElementById('form-privacy-open').addEventListener('click', () => privacy.showModal());
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
const scenarioSection = document.querySelector('.recognition-process');
const scenarioTabs = [...document.querySelectorAll('.recognition-tabs [role="tab"]')];
const scenarioMotion = scenarioSection?.querySelector('.recognition-motion');
const scenarioReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const scenarioMobile = window.matchMedia('(max-width: 760px)');
let scenarioIndex = 0;
let scenarioElapsed = 0;
let scenarioPaused = scenarioReducedMotion.matches;
let scenarioInView = false;
let scenarioHovered = false;
let scenarioLastTick = performance.now();
function updateScenarioMotion() {
  if (!scenarioMotion) return;
  scenarioMotion.hidden = scenarioMobile.matches;
  const label = scenarioPaused ? 'Retomar apresentação' : 'Pausar apresentação';
  scenarioMotion.setAttribute('aria-label', label);
  scenarioMotion.setAttribute('aria-pressed', String(scenarioPaused));
  scenarioMotion.title = label;
  scenarioMotion.innerHTML = `<i data-lucide="${scenarioPaused ? 'play' : 'pause'}" aria-hidden="true"></i>`;
  lucide.createIcons();
}
function selectScenario(index, focus = false) {
  scenarioIndex = index;
  scenarioElapsed = 0;
  scenarioTabs.forEach((tab, current) => {
    const selected = current === index;
    tab.setAttribute('aria-selected', String(selected));
    tab.tabIndex = selected ? 0 : -1;
    tab.querySelector('.recognition-progress > span').style.transform = 'scaleX(0)';
    document.getElementById(tab.getAttribute('aria-controls')).hidden = !selected;
  });
  scenarioSection.querySelector('.recognition-window-count').textContent = `0${index + 1} / 03`;
  if (focus) scenarioTabs[index].focus({ preventScroll: true });
}
function selectScenarioManually(index, focus = false) {
  scenarioPaused = true;
  selectScenario(index, focus);
  updateScenarioMotion();
}
scenarioTabs.forEach((tab, index) => {
  tab.addEventListener('click', () => selectScenarioManually(index));
  tab.addEventListener('keydown', event => {
    let target;
    if (['ArrowRight', 'ArrowDown'].includes(event.key)) target = (index + 1) % scenarioTabs.length;
    if (['ArrowLeft', 'ArrowUp'].includes(event.key)) target = (index - 1 + scenarioTabs.length) % scenarioTabs.length;
    if (event.key === 'Home') target = 0;
    if (event.key === 'End') target = scenarioTabs.length - 1;
    if (target === undefined) return;
    event.preventDefault();
    selectScenarioManually(target, true);
  });
});
if (scenarioSection && scenarioMotion) {
  updateScenarioMotion();
  let scenarioScrollFrame = 0;
  const syncScenarioToScroll = () => {
    scenarioScrollFrame = 0;
    if (!scenarioMobile.matches) return;
    const usableHeight = innerHeight - (parseFloat(getComputedStyle(document.body).paddingBottom) || 0);
    const readingLine = Math.min(240, usableHeight * 0.35);
    const bounds = scenarioTabs.map(tab => tab.getBoundingClientRect());
    // The image follows the text crossing the reading line, in either scroll direction.
    let index = 0;
    bounds.forEach((rect, current) => { if (rect.top <= readingLine) index = current; });
    if (index !== scenarioIndex) selectScenario(index);
    const progress = Math.max(0, Math.min(1, (readingLine - bounds[index].top) / bounds[index].height));
    scenarioTabs[index].querySelector('.recognition-progress > span').style.transform = `scaleX(${progress})`;
  };
  const scheduleScenarioScroll = () => {
    if (scenarioMobile.matches && !scenarioScrollFrame) scenarioScrollFrame = requestAnimationFrame(syncScenarioToScroll);
  };
  addEventListener('scroll', scheduleScenarioScroll, { passive: true });
  addEventListener('resize', scheduleScenarioScroll);
  scenarioMobile.addEventListener('change', () => {
    scenarioElapsed = 0;
    updateScenarioMotion();
    scheduleScenarioScroll();
  });
  new ResizeObserver(scheduleScenarioScroll).observe(scenarioSection);
  scheduleScenarioScroll();
  scenarioMotion.addEventListener('click', () => {
    scenarioPaused = !scenarioPaused;
    updateScenarioMotion();
  });
  scenarioSection.addEventListener('pointerenter', event => { if (event.pointerType === 'mouse') scenarioHovered = true; });
  scenarioSection.addEventListener('pointerleave', () => { scenarioHovered = false; });
  scenarioSection.addEventListener('focusin', event => {
    if (!scenarioMotion.contains(event.target)) {
      scenarioPaused = true;
      updateScenarioMotion();
    }
  });
  scenarioReducedMotion.addEventListener('change', event => {
    if (event.matches) { scenarioPaused = true; updateScenarioMotion(); }
  });
  new IntersectionObserver(([entry]) => { scenarioInView = entry.isIntersecting; }, { threshold: 0.12 }).observe(scenarioSection);
  // Count only visible, uninterrupted reading time before advancing.
  setInterval(() => {
    const now = performance.now();
    const delta = Math.min(now - scenarioLastTick, 200);
    scenarioLastTick = now;
    if (scenarioMobile.matches || !scenarioInView || scenarioPaused || scenarioHovered || document.hidden) return;
    scenarioElapsed += delta;
    if (scenarioElapsed >= 7000) selectScenario((scenarioIndex + 1) % scenarioTabs.length);
    scenarioTabs[scenarioIndex].querySelector('.recognition-progress > span').style.transform = `scaleX(${scenarioElapsed / 7000})`;
  }, 80);
}
const storyWall = document.getElementById('story-wall');
if (storyWall) {
  const cards = [...storyWall.querySelectorAll('.story-card')];
  const controls = document.querySelector('.story-controls');
  const motion = controls.querySelector('.story-motion');
  const view = controls.querySelector('.story-view');
  const compact = window.matchMedia('(max-width: 600px)');
  const tablet = window.matchMedia('(max-width: 1000px)');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  let paused = reduced.matches;
  let expanded = reduced.matches;
  let inView = false;

  function updateStories() {
    controls.hidden = reduced.matches;
    storyWall.classList.toggle('is-paused', paused);
    storyWall.classList.toggle('is-expanded', expanded);
    storyWall.classList.toggle('is-running', inView && !document.hidden);
    motion.hidden = expanded;
    motion.setAttribute('aria-pressed', String(paused));
    const label = paused ? 'Retomar testemunhos' : 'Pausar testemunhos';
    motion.setAttribute('aria-label', label);
    motion.title = label;
    motion.innerHTML = `<i data-lucide="${paused ? 'play' : 'pause'}" aria-hidden="true"></i>`;
    view.setAttribute('aria-expanded', String(expanded));
    view.querySelector('span').textContent = expanded ? 'Voltar à apresentação' : 'Ver todos os testemunhos';
    if (window.lucide) lucide.createIcons();
  }

  function buildStoryLanes() {
    const count = compact.matches ? 1 : tablet.matches ? 2 : 3;
    const lanes = Array.from({ length: count }, () => {
      const lane = document.createElement('div');
      lane.className = 'story-lane';
      const track = document.createElement('div');
      track.className = 'story-track';
      const group = document.createElement('div');
      group.className = 'story-group';
      track.append(group);
      lane.append(track);
      return { lane, track, group };
    });
    // Move the originals; only visual loop copies are hidden from assistive technology.
    cards.forEach((card, index) => lanes[index % count].group.append(card));
    lanes.forEach(({ track, group }) => {
      const copy = group.cloneNode(true);
      copy.setAttribute('aria-hidden', 'true');
      copy.inert = true;
      track.append(copy);
      track.style.setProperty('--story-duration', `${group.children.length * 24}s`);
    });
    storyWall.replaceChildren(...lanes.map(({ lane }) => lane));
    storyWall.classList.add('is-ready');
    updateStories();
  }

  motion.addEventListener('click', () => { paused = !paused; updateStories(); });
  view.addEventListener('click', () => { expanded = !expanded; updateStories(); });
  compact.addEventListener('change', buildStoryLanes);
  tablet.addEventListener('change', buildStoryLanes);
  reduced.addEventListener('change', () => {
    if (reduced.matches) { paused = true; expanded = true; }
    updateStories();
  });
  document.addEventListener('visibilitychange', updateStories);
  new IntersectionObserver(([entry]) => {
    inView = entry.isIntersecting;
    updateStories();
  }, { threshold: 0.05 }).observe(storyWall);
  buildStoryLanes();
}
const benefitTicker = document.querySelector('.benefit-ticker');
if (benefitTicker) {
  const track = benefitTicker.querySelector('.benefit-ticker-track');
  const duplicate = track.firstElementChild.cloneNode(true);
  duplicate.setAttribute('aria-hidden', 'true');
  track.append(duplicate);
  const toggle = benefitTicker.querySelector('.benefit-ticker-toggle');
  toggle.hidden = false;
  benefitTicker.classList.add('is-ready');
  toggle.addEventListener('click', () => {
    const paused = benefitTicker.classList.toggle('is-paused');
    const label = paused ? 'Retomar movimento' : 'Pausar movimento';
    toggle.setAttribute('aria-pressed', String(paused));
    toggle.setAttribute('aria-label', label);
    toggle.title = label;
    toggle.innerHTML = `<i data-lucide="${paused ? 'play' : 'pause'}" aria-hidden="true"></i>`;
    lucide.createIcons();
  });
}
[
  { id: 'etapas', control: '.process-motion-toggle', playing: 'is-process-playing', subject: 'das etapas' },
  { id: 'preco', control: '.price-motion-toggle', playing: 'is-price-playing', subject: 'dos fatores de preço' }
].forEach(({ id, control, playing, subject }) => {
  const section = document.getElementById(id);
  const toggle = section?.querySelector(control);
  if (!toggle) return;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let paused = false;
  let inView = false;
  const updateMotion = () => {
    section.classList.toggle(playing, inView && !paused && !reduced.matches && !document.hidden);
    toggle.hidden = reduced.matches;
  };
  toggle.addEventListener('click', () => {
    paused = !paused;
    const label = `${paused ? 'Retomar' : 'Pausar'} animações ${subject}`;
    toggle.setAttribute('aria-pressed', String(paused));
    toggle.setAttribute('aria-label', label);
    toggle.title = label;
    toggle.innerHTML = `<i data-lucide="${paused ? 'play' : 'pause'}" aria-hidden="true"></i>`;
    lucide.createIcons();
    updateMotion();
  });
  new IntersectionObserver(([entry]) => {
    inView = entry.isIntersecting;
    updateMotion();
  }, { threshold: 0.05 }).observe(section);
  reduced.addEventListener('change', updateMotion);
  document.addEventListener('visibilitychange', updateMotion);
  updateMotion();
});
const footerReveal = document.querySelector('.footer-reveal-shell');
if (footerReveal) {
  const panel = footerReveal.querySelector('.footer-reveal-panel');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let frame = 0;
  const updateFooterReveal = () => {
    frame = 0;
    const bounds = footerReveal.getBoundingClientRect();
    const bottom = parseFloat(getComputedStyle(document.body).paddingBottom) || 0;
    const availableHeight = innerHeight - bottom;
    const enabled = !reduced.matches && bounds.height < availableHeight;
    const visible = bounds.top < availableHeight && bounds.bottom > 0;
    const progress = Math.max(0, Math.min(1, (availableHeight - bounds.top) / bounds.height));
    footerReveal.classList.toggle('is-reveal-ready', enabled);
    footerReveal.classList.toggle('is-reveal-visible', visible);
    // Fixed content is clipped to its reserved space, never over the preceding section.
    panel.inert = enabled && !visible;
    footerReveal.style.setProperty('--footer-shift', `${enabled ? (1 - progress) * 90 : 0}px`);
  };
  const scheduleFooterReveal = () => {
    if (!frame) frame = requestAnimationFrame(updateFooterReveal);
  };
  addEventListener('scroll', scheduleFooterReveal, { passive: true });
  addEventListener('resize', scheduleFooterReveal);
  reduced.addEventListener('change', scheduleFooterReveal);
  new ResizeObserver(scheduleFooterReveal).observe(footerReveal);
  updateFooterReveal();
}
const stickyCta = document.querySelector('.mobile-sticky-cta');
const requestSection = document.getElementById('pedido');
if (stickyCta && requestSection) {
  let requestVisible = false;
  const updateStickyCta = () => {
    stickyCta.hidden = requestVisible || requestSection.contains(document.activeElement);
  };
  const requestObserver = new IntersectionObserver(([entry]) => {
    requestVisible = entry.isIntersecting;
    updateStickyCta();
  });
  requestObserver.observe(requestSection);
  document.addEventListener('focusin', updateStickyCta);
}
showStep(0, false);
