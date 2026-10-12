import { victim, characterById } from './data/characters.js';
import { locationById } from './data/locations.js';
import { loadState, saveState, clearState, createState } from './modules/save-manager.js';
import { visitRoom, readEvidence, canOpenInterrogation, assessPerson, readAdditional, completeStage, accuse, deferCase, resumeCase } from './modules/case.js';
import { renderEvidencePage, evidenceDocument, renderRooms, roomDocument } from './modules/investigation.js';
import { renderPeople, personDocument } from './modules/interrogation.js';
import { renderStage } from './modules/quiz.js';
import { renderHome, renderJournal, renderEnding, journalText } from './modules/views.js';
import { byId, escapeHTML, showModal, hideModal, toast } from './modules/dom.js';

const loaded = loadState();
let state = loaded.state;
let saveTimer;
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
function openEvidence(id) {
  const html = evidenceDocument(state, id);
  if (!html) { toast('Материал закрыт', 'Сначала получите его при осмотре или допросе.'); return; }
  showModal('Материалы дела', html);
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
  const target = event.target.closest('button, a');
  if (!target || target.disabled) return;
  if (target.dataset.view) { event.preventDefault(); captureDrafts(); return go(target.dataset.view); }
  if (target.dataset.stage) { captureDrafts(); return go('stage', Number(target.dataset.stage)); }
  if (target.dataset.evidence) return openEvidence(target.dataset.evidence);
  if (target.dataset.person) return openPerson(target.dataset.person);
  if (target.dataset.personExtra) return openPerson(target.dataset.personExtra, true);
  if (target.dataset.portrait) return openPortrait(target.dataset.portrait);
  if (target.dataset.room) {
    const room = locationById.get(target.dataset.room);
    if (room && visitRoom(state, room.id)) { render(); persist(true); showModal(room.name, roomDocument(state, room)); }
    return;
  }
  if (target.dataset.readEvidence && readEvidence(state, target.dataset.readEvidence)) {
    target.disabled = true; target.textContent = '✓ Материал изучен'; render(); persist(true); return;
  }
  if (target.dataset.readExtra && readAdditional(state, target.dataset.readExtra)) {
    target.disabled = true; target.textContent = '✓ Протокол изучен'; render(); persist(true); return;
  }
  if (target.dataset.roomPhoto) {
    const room = locationById.get(target.dataset.roomPhoto);
    const photo = room?.stage <= state.stage ? room.photos[Number(target.dataset.photoIndex)] : null;
    if (photo) showModal(room.name, `<figure class="full-portrait"><img src="${escapeHTML(photo.src)}" alt="${escapeHTML(photo.alt)}"><figcaption>${escapeHTML(photo.caption)}</figcaption></figure><button type="button" class="btn btn-outline-brass" data-room="${room.id}">К осмотру</button>`);
    return;
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
document.addEventListener('visibilitychange', () => { if (document.hidden) { clearTimeout(saveTimer); saveState(state); } });
byId('resetGameBtn').addEventListener('click', confirmReset);
byId('rulesBtn').addEventListener('click', () => showModal('Как вести расследование', '<p>В каждом этапе есть список подготовки. Осматривайте помещения, открывайте материалы и отмечайте их как изученные.</p><p>В первом этапе перечислите шесть находок из кабинета. Разделяйте их точкой с запятой или новой строкой. Правильно распознанные названия подсвечиваются зелёным, неизвестные — красным.</p><p>После каждого первого допроса выберите оценку и объясните её. Это ваша версия: система не объявляет персонажа виновным за вас.</p><p>В третьем этапе откроются конверты и дополнительные допросы. В четвёртом — обвинение с выбором доказательств.</p><p>Заметки и прогресс сохраняются в текущем браузере. Журнал можно скачать. Все события и экспертные документы относятся к вымышленному сюжету.</p>'));

const hashView = location.hash.slice(1);
if (validViews.has(hashView)) state.view = hashView;
if (typeof bootstrap === 'undefined') throw new Error('Локальные файлы Bootstrap не загрузились.');
render();
document.documentElement.dataset.gameReady = 'true';
persist(true);
if (loaded.status === 'unavailable') toast('Сохранение не прочитано', 'Начато новое дело. Если сохранение недоступно, игра продолжит работать до закрытия вкладки.');
if (loaded.status === 'migrated') toast('Прогресс перенесён', 'Заметки и открытые этапы сохранены. Новые материалы доступны в архиве.');
