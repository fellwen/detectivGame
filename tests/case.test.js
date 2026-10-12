import test from 'node:test';
import assert from 'node:assert/strict';
import { createState, sanitizeState, loadState, saveState, migrateLegacy, SAVE_KEY } from '../js/modules/save-manager.js';
import { visitRoom, readEvidence, canOpenEvidence, canOpenInterrogation, assessPerson, readAdditional, completeStage, evaluateStage, accuse, deferCase, resumeCase, investigationProgress } from '../js/modules/case.js';
import { validateInventory } from '../js/modules/validation.js';
import { characters } from '../js/data/characters.js';
import { questions } from '../js/data/stages.js';
import { evidence } from '../js/data/evidence.js';
import { renderPeople, personDocument } from '../js/modules/interrogation.js';
import { renderStage } from '../js/modules/quiz.js';
import { renderJournal } from '../js/modules/views.js';
import { evidenceDocument } from '../js/modules/investigation.js';

const inventory = 'коньяк с ядом; замок и ключ; пуговица; записка с угрозой; платок; следы обуви';
const reason = 'Сопоставляю независимые сведения из протоколов';
function answerQuestions(state, stage) { for (const question of questions[stage]) state.answers[`${stage}:${question.id}`] = question.correct; }
function passFirstStage(state) {
  visitRoom(state, 'office'); visitRoom(state, 'lounge');
  state.foundEvidence.forEach(id => readEvidence(state, id));
  state.notes.inventory = inventory; answerQuestions(state, 1);
  assert.equal(completeStage(state, 1), true);
}
function passSecondStage(state) {
  characters.forEach(person => assert.equal(assessPerson(state, person.id, 'doubt', reason).success, true));
  readEvidence(state, 'witness'); readEvidence(state, 'somov');
  state.notes.stage2 = reason; answerQuestions(state, 2);
  assert.equal(completeStage(state, 2), true);
}
function passThirdStage(state) {
  visitRoom(state, 'kotroom'); visitRoom(state, 'bedroom');
  ['forged', 'glove', 'dues'].forEach(id => readEvidence(state, id));
  ['kot', 'dunya', 'plyushkin'].forEach(id => assert.equal(readAdditional(state, id), true));
  readEvidence(state, 'gift'); state.notes.stage3 = reason; answerQuestions(state, 3);
  assert.equal(completeStage(state, 3), true);
}
function readyCase() { const state = createState(); passFirstStage(state); passSecondStage(state); passThirdStage(state); return state; }

test('новое дело не раскрывает допросы, конверты и мотив сыщика', () => {
  const state = createState();
  assert.equal(canOpenInterrogation(state, 'kot'), false);
  assert.equal(visitRoom(state, 'kotroom'), false);
  assert.equal(readEvidence(state, 'forged'), false);
  assert.equal(evidenceDocument(state, 'confession'), null);
  assert.doesNotMatch(renderPeople(state), /фабрикац|Настоящий убийца|шантажировал/);
  assert.doesNotMatch(personDocument(state, 'kot'), /Непрерывно|С 21:00|15:17/);
});
test('нельзя пройти осмотр только правильными ответами без чтения', () => {
  const state = createState(); state.notes.inventory = inventory; answerQuestions(state, 1);
  assert.equal(completeStage(state, 1), false); assert.equal(state.stage, 1);
  visitRoom(state, 'office'); visitRoom(state, 'lounge');
  assert.equal(completeStage(state, 1), false);
  state.foundEvidence.forEach(id => readEvidence(state, id));
  assert.equal(completeStage(state, 1), true);
  assert.equal(completeStage(state, 1), false); assert.equal(state.stage, 2);
});
test('проверка находок отличает частичные и неверные ответы', () => {
  assert.equal(validateInventory(inventory).success, true);
  const partial = validateInventory('бутылка; ключ; нож');
  assert.equal(partial.success, false); assert.equal(partial.rows[2].valid, false);
  assert.equal(partial.missing.length, 4);
  assert.equal(validateInventory('ПЛАТОК; пуговица\nконьяк; дверь; записка; следы у окна').success, true);
  assert.equal(validateInventory('').success, false);
});
test('допрос требует оценки и объяснения, субъективный выбор не ограничен', () => {
  const state = createState(); passFirstStage(state);
  assert.equal(assessPerson(state, 'kot', 'lie', '').success, false);
  assert.equal(assessPerson(state, 'kot', 'wrong', reason).success, false);
  assert.equal(assessPerson(state, 'kot', 'trust', reason).success, true);
  assert.equal(assessPerson(state, 'kot', 'lie', reason).success, true);
  assert.equal(state.readInterrogations.length, 1);
  assert.equal(completeStage(state, 2), false);
});
test('повторные допросы требуют изученных конвертов и не дублируют показания', () => {
  const state = createState(); passFirstStage(state); passSecondStage(state);
  assert.equal(readAdditional(state, 'dunya'), false);
  visitRoom(state, 'kotroom'); assert.equal(readAdditional(state, 'dunya'), false);
  readEvidence(state, 'glove'); assert.equal(readAdditional(state, 'dunya'), true);
  assert.equal(state.foundEvidence.includes('gift'), true);
  readAdditional(state, 'dunya'); assert.equal(state.readAdditional.length, 1);
});
test('полное прохождение требует осмысленного набора доказательств', () => {
  const state = readyCase();
  assert.equal(state.stage, 4); assert.equal(investigationProgress(state), 75);
  assert.equal(accuse(state, 'kot', ['decanter', 'glove'], reason).success, false);
  assert.equal(state.finished, false); assert.equal(canOpenEvidence(state, 'confession'), false);
  assert.equal(accuse(state, 'kot', ['decanter', 'gift', 'forged', 'witness'], reason).success, true);
  assert.equal(state.ending, 'justice'); assert.equal(investigationProgress(state), 100);
  assert.equal(canOpenEvidence(state, 'confession'), true);
  assert.equal(accuse(state, 'kot', ['decanter', 'gift', 'forged', 'witness'], reason).success, false);
});
test('ошибочное обвинение допускает повторное расследование', () => {
  const state = readyCase();
  assert.equal(accuse(state, 'elena', ['handkerchief', 'note'], reason).ending, 'wrong');
  assert.equal(state.foundEvidence.includes('confession'), false);
  assert.equal(resumeCase(state), true); assert.equal(state.finished, false);
  assert.equal(state.accusations.length, 1); assert.equal(state.stage, 4);
});
test('альтернативный эпилог доступен только после подготовки', () => {
  assert.equal(deferCase(createState()), false);
  const state = readyCase(); assert.equal(deferCase(state), true);
  assert.equal(state.ending, 'unresolved'); assert.equal(readEvidence(state, 'confession'), true);
  const restored = sanitizeState(JSON.parse(JSON.stringify(state)));
  assert.equal(restored.readEvidence.includes('confession'), true);
  resumeCase(restored); assert.equal(canOpenEvidence(restored, 'confession'), false);
});
test('сохранение полного дела восстанавливает заметки, этапы и финал', () => {
  const state = readyCase();
  accuse(state, 'kot', ['decanter', 'gift', 'forged', 'witness'], reason);
  readEvidence(state, 'confession');
  const memory = new Map(); const storage = { getItem: key => memory.get(key) ?? null, setItem: (key, value) => memory.set(key, value) };
  assert.equal(saveState(state, storage), true);
  const restored = loadState(storage).state;
  assert.equal(restored.stage, 4); assert.equal(restored.finished, true);
  assert.deepEqual(restored.readEvidence, state.readEvidence);
  assert.equal(restored.notes.inventory, inventory);
});
test('повреждённое и недоступное сохранение не ломает игру', () => {
  const broken = { getItem: () => '{not json' };
  assert.equal(loadState(broken).state.stage, 1);
  const blocked = { getItem: () => { throw Error('blocked'); }, setItem: () => { throw Error('blocked'); } };
  assert.equal(loadState(blocked).status, 'unavailable'); assert.equal(saveState(createState(), blocked), false);
  const bad = sanitizeState({ stage: 999, foundEvidence: ['made-up', 'confession'], notes: null, readInterrogations: 'bad', finished: true, ending: 'justice' });
  assert.equal(bad.stage, 1); assert.equal(bad.finished, false);
  assert.deepEqual(bad.foundEvidence, ['report', 'autopsy']); assert.equal(typeof renderStage(bad), 'string');
});
test('старые сохранения переносят заметки и открытые этапы', () => {
  const migrated = migrateLegacy({ stage: 3, foundEvidence: ['report', 'glove'], notes: { kot: reason }, readInterrogations: ['kot'] });
  assert.equal(migrated.stage, 3); assert.equal(migrated.notes.kot, reason);
  assert.equal(migrated.foundEvidence.includes('glove'), true);
});
test('заметки не исполняются как HTML при отображении', () => {
  const state = createState(); state.notes.inventory = '<img src=x onerror=alert(1)> & "';
  const html = renderJournal(state);
  assert.equal(html.includes('<img src=x'), false); assert.equal(html.includes('&lt;img'), true);
});
test('все ссылки данных согласованы', () => {
  assert.equal(new Set(evidence.map(item => item.id)).size, evidence.length);
  assert.equal(characters.length, 7);
  assert.equal(evaluateStage(createState(), 1).tasks.every(task => task.complete), false);
});
