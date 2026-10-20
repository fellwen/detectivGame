import { victim, characterById } from './data/characters.js';
import { locationById } from './data/locations.js';
import { sceneByKey, sceneKey } from './data/scenes.js';
import { loadState, saveState, clearState, createState } from './modules/save-manager.js';
import { visitRoom, readEvidence, assessPerson, readAdditional, completeStage, accuse, deferCase, resumeCase, discoverTarget, getHintTarget } from './modules/case.js';
import { renderEvidencePage, evidenceDocument, renderRooms, roomDocument } from './modules/investigation.js';
import { renderPeople, personDocument } from './modules/interrogation.js';
import { renderStage } from './modules/quiz.js';
import { renderHome, renderJournal, renderEnding, journalText } from './modules/views.js';
import { byId, escapeHTML, showModal, hideModal, toast } from './modules/dom.js';
import { normalizeZoom, normalizePan, pickSceneTarget, returnSceneAttributes, fittedSceneWidth } from './modules/search-scene.js';
import { enlargedExhibit } from './modules/exhibits.js';

const loaded = loadState();
let state = loaded.state;
let saveTimer;
let evidenceContext = null;
const app = byId('app');
const validViews = new Set(['home', 'stage', 'rooms', 'people', 'evidence', 'journal']);

function showSaveStatus(success) {
  byId('saveStatus').textContent = success ? 'Прогресс сохранён' : 'Сохранение недоступно: оставьте вкладку открытой';
  byId('saveStatus').classList.toggle('error-text', !success);
}
function persist(immediate = false) {
  clearTimeout(saveTimer);
  if (immediate) showSaveStatus(saveState(state));
  else {
    byId('saveStatus').textContent = 'Сохраняю записи…';
    saveTimer = setTimeout(() => showSaveStatus(saveState(state)), 300);
  }
}
function render() {
  const views = { home: renderHome, stage: state.finished && state.viewStage === 4 ? renderEnding : renderStage, rooms: renderRooms, people: renderPeople, evidence: renderEvidencePage, journal: renderJournal };
  app.innerHTML = (views[state.view] ?? renderHome)(state);
  byId('evidenceCount').textContent = String(state.foundEvidence.length);
  byId('currentStage').textContent = state.finished ? 'Итог дела' : `Этап ${state.stage} / 4`;
  document.querySelectorAll('.app-navbar [data-view]').forEach(link => {
    const active = link.dataset.view === state.view;
    link.classList.toggle('active', active);
    if (active) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  });
}
function go(view, stage = null, push = true) {
  if (!validViews.has(view)) return;
  if (stage !== null && (!Number.isInteger(stage) || stage < 1 || stage > state.stage)) return;
  hideModal();
  state.view = view;
  if (view === 'stage') state.viewStage = stage ?? state.stage;
  if (push && location.hash !== `#${view}`) history.pushState(null, '', `#${view}`);
  render();
  persist(true);
  bootstrap.Collapse.getInstance(byId('mainNav'))?.hide();
  app.querySelector('h1')?.focus({ preventScroll: true });
  window.scrollTo({ top: 0, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
}
function openEvidence(id, context = null) {
  const html = evidenceDocument(state, id);
  if (!html) { toast('Материал закрыт', 'Сначала получите его при осмотре или допросе.'); return; }
  evidenceContext = context ? { ...context, id } : null;
  const back = context ? `<button type="button" class="btn btn-outline-brass mt-3" data-room="${escapeHTML(context.roomId)}" data-scene-id="${escapeHTML(context.sceneId)}" ${returnSceneAttributes(context)}>Вернуться к поиску →</button>` : '';
  showModal('Материалы дела', html + back);
}
function searchContext() {
  const root = document.querySelector('.room-search');
  if (!root) return null;
  const viewport = root.querySelector('.scene-viewport');
  return {
    roomId: root.dataset.searchRoom, sceneId: root.dataset.searchScene,
    zoom: normalizeZoom(root.querySelector('.search-stage')?.dataset.sceneZoom),
    panX: normalizePan(viewport.scrollLeft / Math.max(1, viewport.scrollWidth - viewport.clientWidth)),
    panY: normalizePan(viewport.scrollTop / Math.max(1, viewport.scrollHeight - viewport.clientHeight))
  };
}
function openRoom(id, sceneId = '', zoom = 1, position = null) {
  const room = locationById.get(id);
  if (!room || !visitRoom(state, id)) return;
  const html = roomDocument(state, room, sceneId);
  if (!html) return;
  render(); persist(true);
  showModal(room.name, html, { wide: true });
  setSceneZoom(zoom);
  if (position) {
    const viewport = document.querySelector('.room-search .scene-viewport');
    viewport.scrollLeft = normalizePan(position.panX) * Math.max(0, viewport.scrollWidth - viewport.clientWidth);
    viewport.scrollTop = normalizePan(position.panY) * Math.max(0, viewport.scrollHeight - viewport.clientHeight);
  }
}
function setSceneZoom(value) {
  const root = document.querySelector('.room-search');
  if (!root) return;
  const viewport = root.querySelector('.scene-viewport'), stage = root.querySelector('.search-stage');
  const previous = stage.getBoundingClientRect();
  const centerX = (viewport.scrollLeft + viewport.clientWidth / 2 - stage.offsetLeft) / Math.max(previous.width, 1);
  const centerY = (viewport.scrollTop + viewport.clientHeight / 2) / Math.max(previous.height, 1);
  const zoom = normalizeZoom(value);
  const scene = sceneByKey.get(sceneKey(root.dataset.searchRoom, root.dataset.searchScene));
  const availableHeight = Math.min(760, window.innerHeight * (matchMedia('(max-width: 575px)').matches ? .55 : .64)) - 2;
  stage.style.width = `${fittedSceneWidth(viewport.clientWidth, Math.max(1, availableHeight), scene.width, scene.height, zoom)}px`;
  stage.dataset.sceneZoom = String(zoom);
  root.querySelector('#sceneZoomValue').textContent = `${Math.round(zoom * 100)}%`;
  root.querySelector('[data-zoom-step="-0.5"]').disabled = zoom <= 1;
  root.querySelector('[data-zoom-step="0.5"]').disabled = zoom >= 3;
  const next = stage.getBoundingClientRect();
  viewport.scrollLeft = Math.max(0, centerX * next.width + stage.offsetLeft - viewport.clientWidth / 2);
  viewport.scrollTop = Math.max(0, centerY * next.height - viewport.clientHeight / 2);
}
function findSceneTarget(id) {
  const context = searchContext();
  if (!context) return;
  const result = discoverTarget(state, context.roomId, context.sceneId, id);
  if (!result.success) return;
  persist(true); render();
  if (result.target.evidence) return openEvidence(result.target.evidence, context);
  const target = result.target;
  showModal(target.label, `${target.image ? `<figure class="large-exhibit"><img src="${escapeHTML(target.image)}" alt="${escapeHTML(target.label)}"></figure>` : ''}<p>${escapeHTML(target.description)}</p><button type="button" class="btn btn-outline-brass" data-room="${context.roomId}" data-scene-id="${context.sceneId}" ${returnSceneAttributes(context)}>Вернуться к поиску →</button>`);
}
function showSearchHint() {
  const context = searchContext();
  if (!context) return;
  const hint = getHintTarget(state, context.roomId, context.sceneId);
  const feedback = byId('sceneFeedback');
  if (!hint) { feedback.textContent = 'На этом виде все доступные участки уже осмотрены. Проверьте другие ракурсы.'; return; }
  const root = document.querySelector('.room-search');
  root.querySelectorAll('.is-hint').forEach(button => button.classList.remove('is-hint'));
  const button = [...root.querySelectorAll('[data-search-target]')].find(item => item.dataset.searchTarget === hint.id);
  button.classList.add('is-hint');
  button.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'center', inline: 'center' });
  feedback.textContent = 'Подсвечен один участок. Нажмите на него, чтобы рассмотреть предмет.';
  persist(true);
}
function openPerson(id, extra = false) {
  const person = characterById.get(id);
  if (!person) return;
  const html = personDocument(state, id, extra);
  if (html) showModal(`${extra ? 'Повторный допрос' : 'Досье'}: ${person.name}`, html);
}
function openPortrait(id) {
  const person = id === 'arkadiy' ? victim : characterById.get(id);
  if (!person) return;
  showModal(person.name, `<figure class="full-portrait"><img src="${escapeHTML(person.image)}" alt="${escapeHTML(person.name)}" width="600" height="800"><figcaption>${escapeHTML(person.role)} · иллюстрированный портрет</figcaption></figure><button type="button" class="btn btn-outline-brass" ${id === 'arkadiy' ? 'data-evidence="report"' : `data-person="${id}"`}>${id === 'arkadiy' ? 'К отчёту' : 'К досье'}</button>`);
}
function confirmReset() {
  showModal('Начать новое дело?', '<p>Будут удалены прогресс и ваши записи в этом браузере. При необходимости сначала скачайте журнал.</p><div class="d-flex flex-wrap gap-2"><button type="button" class="btn btn-outline-brass" data-action="export-journal">Скачать записи</button><button type="button" class="btn btn-brass" data-action="reset-confirm">Начать заново</button></div>');
}
function captureDrafts() {
  document.querySelectorAll('textarea[data-note]').forEach(field => { state.notes[field.dataset.note] = field.value.slice(0, 4000); });
  document.querySelectorAll('input[data-answer]:checked').forEach(field => { state.answers[field.dataset.answer] = field.value; });
  const select = byId('verdictSelect');
  if (select) state.accusation = select.value;
  if (document.querySelector('[data-verdict-evidence]')) state.selectedEvidence = [...document.querySelectorAll('[data-verdict-evidence]:checked')].map(field => field.value);
}
function downloadJournal() {
  captureDrafts();
  const url = URL.createObjectURL(new Blob(['\uFEFF', journalText(state)], { type: 'text/plain;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = 'grace-hotel-journal.txt';
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function action(name) {
  if (name === 'export-journal') return downloadJournal();
  if (name === 'reset-prompt') return confirmReset();
  if (name === 'reset-confirm') {
    clearTimeout(saveTimer);
    clearState();
    state = createState();
    go('home');
    return toast('Новое дело', 'Расследование начинается с первичного осмотра.');
  }
  if (name === 'resume') { resumeCase(state); return go('stage', 4); }
  if (name === 'defer-prompt') return showModal('Завершить без обвинения?', '<p>Откроется альтернативный эпилог с развязкой дела. После него можно вернуться к доказательствам.</p><button type="button" class="btn btn-brass" data-action="defer-confirm">Открыть эпилог</button>');
  if (name === 'defer-confirm') { if (deferCase(state)) go('stage', 4); }
}

document.addEventListener('click', event => {
  const imageStage = event.target.closest('.search-stage');
  if (imageStage && event.detail > 0) {
    const context = searchContext(), rect = imageStage.getBoundingClientRect();
    const scene = context ? sceneByKey.get(sceneKey(context.roomId, context.sceneId)) : null;
    const found = scene ? pickSceneTarget(scene, (event.clientX - rect.left) / rect.width * 100, (event.clientY - rect.top) / rect.height * 100, rect.width, rect.height) : null;
    if (found) findSceneTarget(found.id);
    else byId('sceneFeedback').textContent = 'Этот участок осмотрен. Продолжайте поиск или воспользуйтесь увеличением.';
    return;
  }
  const target = event.target.closest('button, a');
  if (!target) {
    if (event.target.closest('.search-stage')) byId('sceneFeedback').textContent = 'Этот участок осмотрен. Продолжайте поиск или воспользуйтесь увеличением.';
    return;
  }
  if (target.disabled) return;
  if (target.dataset.searchTarget) return findSceneTarget(target.dataset.searchTarget);
  if (target.hasAttribute('data-search-hint')) return showSearchHint();
  if (target.dataset.zoomStep) {
    const context = searchContext();
    if (context) setSceneZoom(context.zoom + Number(target.dataset.zoomStep));
    return;
  }
  if (target.dataset.view) { event.preventDefault(); captureDrafts(); return go(target.dataset.view); }
  if (target.dataset.stage) { captureDrafts(); return go('stage', Number(target.dataset.stage)); }
  if (target.dataset.evidence) {
    const current = searchContext();
    return openEvidence(target.dataset.evidence, target.dataset.returnRoom ? {
      roomId: target.dataset.returnRoom, sceneId: target.dataset.returnScene,
      zoom: normalizeZoom(target.dataset.returnZoom ?? current?.zoom),
      panX: normalizePan(target.dataset.returnPanX ?? current?.panX),
      panY: normalizePan(target.dataset.returnPanY ?? current?.panY)
    } : null);
  }
  if (target.dataset.exhibit) {
    const html = enlargedExhibit(state, target.dataset.exhibit, Number(target.dataset.exhibitIndex), evidenceContext?.id === target.dataset.exhibit ? evidenceContext : null);
    if (html) showModal('Крупный план предмета', html);
    return;
  }
  if (target.dataset.person) return openPerson(target.dataset.person);
  if (target.dataset.personExtra) return openPerson(target.dataset.personExtra, true);
  if (target.dataset.portrait) return openPortrait(target.dataset.portrait);
  if (target.dataset.room) {
    return openRoom(target.dataset.room, target.dataset.sceneId ?? target.dataset.returnScene, normalizeZoom(target.dataset.returnZoom), target.hasAttribute('data-return-pan-x') ? { panX: target.dataset.returnPanX, panY: target.dataset.returnPanY } : null);
  }
  if (target.dataset.readEvidence && readEvidence(state, target.dataset.readEvidence)) {
    target.disabled = true; target.textContent = '✓ Материал изучен'; render(); persist(true); return;
  }
  if (target.dataset.readExtra && readAdditional(state, target.dataset.readExtra)) {
    target.disabled = true; target.textContent = '✓ Протокол изучен'; render(); persist(true); return;
  }
  if (target.dataset.action) action(target.dataset.action);
});

document.addEventListener('input', event => {
  const field = event.target;
  if (field.matches('textarea[data-note]')) { state.notes[field.dataset.note] = field.value.slice(0, 4000); persist(); }
});
document.addEventListener('change', event => {
  const field = event.target;
  if (field.matches('[data-answer], [data-accusation], [data-verdict-evidence]')) { captureDrafts(); persist(); }
});
document.addEventListener('submit', event => {
  const form = event.target;
  if (!form.matches('[data-stage-form], [data-assessment-form], [data-verdict-form]')) return;
  event.preventDefault();
  captureDrafts();
  if (form.dataset.stageForm) {
    const stage = Number(form.dataset.stageForm);
    const passed = completeStage(state, stage);
    persist(true); render();
    if (passed) toast('Этап завершён', `Доступен следующий этап: ${state.stage}.`);
    return;
  }
  if (form.dataset.assessmentForm) {
    const data = new FormData(form);
    const result = assessPerson(state, form.dataset.assessmentForm, data.get('assessment'), data.get('note'));
    const feedback = byId('personFeedback');
    feedback.className = `answer-feedback ${result.success ? 'correct' : 'incorrect'}`;
    feedback.textContent = result.message;
    if (result.success) { persist(true); render(); }
    return;
  }
  const result = accuse(state, state.accusation, state.selectedEvidence, state.notes.verdict);
  if (result.success) go('stage', 4);
  else { const feedback = byId('verdictFeedback'); feedback.className = 'answer-feedback incorrect'; feedback.textContent = result.message; persist(true); }
});
window.addEventListener('popstate', () => {
  const view = location.hash.slice(1);
  go(validViews.has(view) ? view : 'home', null, false);
});
window.addEventListener('pagehide', () => { clearTimeout(saveTimer); saveState(state); });
window.addEventListener('resize', () => {
  const context = searchContext();
  if (context) setSceneZoom(context.zoom);
});
document.addEventListener('visibilitychange', () => { if (document.hidden) { clearTimeout(saveTimer); saveState(state); } });
byId('resetGameBtn').addEventListener('click', confirmReset);
byId('rulesBtn').addEventListener('click', () => showModal('Как вести расследование', '<p>В каждом этапе есть список подготовки. Откройте помещение и нажимайте на предметы на изображении. Некоторые детали относятся к обстановке, другие откроют материал дела.</p><p>Используйте кнопки + и −, прокрутку увеличенной сцены и подсказку. У кабинета есть отдельный вид снаружи у окна, у комнаты сыщика — два ракурса. Найденные предметы отмечаются рамкой.</p><p>После находки изучите документ и отметьте его как прочитанный. В первом этапе перечислите шесть находок с места преступления. Разделяйте их точкой с запятой или новой строкой. Верные названия отмечаются зелёным, неизвестные — красным.</p><p>После каждого первого допроса выберите оценку и объясните её. Это ваша версия: система не объявляет персонажа виновным за вас.</p><p>В третьем этапе откроются конверты и дополнительные допросы. В четвёртом — обвинение с выбором доказательств.</p><p>Заметки, найденные предметы и прогресс сохраняются в текущем браузере. Журнал можно скачать. Все события и экспертные документы относятся к вымышленному сюжету.</p>'));

const hashView = location.hash.slice(1);
if (validViews.has(hashView)) state.view = hashView;
if (typeof bootstrap === 'undefined') throw new Error('Локальные файлы Bootstrap не загрузились.');
render();
document.documentElement.dataset.gameReady = 'true';
persist(true);
if (loaded.status === 'unavailable') toast('Сохранение не прочитано', 'Начато новое дело. Если сохранение недоступно, игра продолжит работать до закрытия вкладки.');
if (loaded.status === 'migrated') toast('Прогресс перенесён', 'Заметки и открытые этапы сохранены. Новые материалы доступны в архиве.');
