'use strict';
// Preview only: responses stay in memory; no submission, analytics or storage.
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
  next.querySelector('span').textContent = index === steps.length - 1 ? 'Ver resumo de teste' : 'Continuar';
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
  if (isLand) document.getElementById('area-tipo').value = 'Área do terreno';
});
document.getElementById('propostas').addEventListener('change', syncOffer);
back.addEventListener('click', () => showStep(Math.max(0, step - 1)));
document.getElementById('reconsider').addEventListener('click', () => showStep(priceStep));
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
const scenarioSection = document.querySelector('.recognition-process');
const scenarioTabs = [...document.querySelectorAll('.recognition-tabs [role="tab"]')];
const scenarioMotion = scenarioSection?.querySelector('.recognition-motion');
const scenarioReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
let scenarioIndex = 0;
let scenarioElapsed = 0;
let scenarioPaused = scenarioReducedMotion.matches;
let scenarioInView = false;
let scenarioHovered = false;
let scenarioLastTick = performance.now();
function updateScenarioMotion() {
  if (!scenarioMotion) return;
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
  scenarioMotion.hidden = false;
  updateScenarioMotion();
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
    if (!scenarioInView || scenarioPaused || scenarioHovered || document.hidden) return;
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
    const label = paused ? 'Retomar testemunhos ilustrativos' : 'Pausar testemunhos ilustrativos';
    motion.setAttribute('aria-label', label);
    motion.title = label;
    motion.innerHTML = `<i data-lucide="${paused ? 'play' : 'pause'}" aria-hidden="true"></i>`;
    view.setAttribute('aria-expanded', String(expanded));
    view.querySelector('span').textContent = expanded ? 'Voltar à apresentação' : 'Ver todos os exemplos';
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
