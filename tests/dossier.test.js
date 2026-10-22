import test from 'node:test';
import assert from 'node:assert/strict';
import { createState, sanitizeState } from '../js/modules/save-manager.js';
import { visitRoom, discoverTarget, readEvidence } from '../js/modules/case.js';
import { evidenceById } from '../js/data/evidence.js';
import { dossierPages, dossierExhibits, archivedAgent, wallaceRecord, sergeantProtocol, wallaceBiography } from '../js/data/dossier.js';
import { renderDossier, dossierPageForKey } from '../js/modules/dossier.js';
import { evidenceDocument } from '../js/modules/investigation.js';
import { enlargedExhibit } from '../js/modules/exhibits.js';

const stageThree = () => sanitizeState({ ...createState(), completedStages: [1, 2] });
const findDossier = () => {
  const state = stageThree();
  visitRoom(state, 'kotroom');
  discoverTarget(state, 'kotroom', 'study', 'folder');
  return state;
};

test('архивное досье и его изображения закрыты до находки папки', () => {
  for (const state of [createState(), stageThree()]) {
    assert.equal(renderDossier(state), null);
    assert.equal(evidenceDocument(state, 'forged'), null);
    for (let index = 0; index < dossierExhibits.length; index++) assert.equal(enlargedExhibit(state, 'forged', index), null);
  }
  const state = findDossier();
  assert.ok(renderDossier(state));
  assert.equal(readEvidence(state, 'forged'), true);
});

test('обложка и четыре листа открываются по одному без потери содержимого', () => {
  const state = findDossier();
  assert.equal(dossierPages.length, 5);
  for (const page of dossierPages) {
    const html = renderDossier(state, page.id);
    assert.ok(html.includes(`data-active-dossier-page="${page.id}"`));
    assert.equal((html.match(/data-dossier-panel="[^"]+"[^>]*\bhidden/g) ?? []).length, 4);
    assert.equal((html.match(/aria-selected="true"/g) ?? []).length, 1);
  }
  assert.ok(renderDossier(state, '<invalid>').includes('data-active-dossier-page="agent"'));
});

test('в архивной копии сохранены существенные сведения и противоречивые даты ТЗ', () => {
  assert.equal(new Map(archivedAgent).get('Личный номер агента'), '50.98.1');
  assert.equal(new Map(archivedAgent).get('Возраст в карточке'), '18 лет');
  assert.equal(new Map(wallaceRecord).get('Дата задержания'), '19.01.1920');
  assert.equal(new Map(wallaceRecord).get('Адрес'), 'Ул. Вулвертон, 29');
  const protocol = sergeantProtocol.join(' ');
  for (const detail of ['1931', 'Куалтроу', '19:30', 'Менлав Гарденс', '370', '18:30', '18:00–20:00', 'макинтош']) assert.ok(protocol.includes(detail), detail);
  for (const detail of ['1907', '1911', 'Харрогейте', 'Милломе']) assert.ok(wallaceBiography.join(' ').includes(detail), detail);
  assert.ok(evidenceById.get('report').date.includes('1928'));
  assert.ok(renderDossier(findDossier()).includes('расходятся датировки'));
});

test('все шесть приложений доступны для увеличения только после осмотра', () => {
  const state = findDossier();
  assert.equal(dossierExhibits.length, 6);
  assert.deepEqual(evidenceById.get('forged').exhibits, dossierExhibits);
  for (const [index, exhibit] of dossierExhibits.entries()) {
    const html = enlargedExhibit(state, 'forged', index, null, exhibit.page);
    assert.ok(html.includes(exhibit.src));
    assert.ok(html.includes(`data-dossier-return="${exhibit.page}"`));
  }
  const map = enlargedExhibit(state, 'forged', 4, null, 'appendices');
  assert.ok(map.includes('Открыть в полном размере'));
  assert.ok(map.includes('archive-large-scan'));
});

test('возврат из изображения сохраняет лист досье и положение комнаты', () => {
  const context = { roomId: 'kotroom', sceneId: 'study', zoom: 2.5, panX: .6, panY: .4 };
  const html = enlargedExhibit(findDossier(), 'forged', 4, context, 'appendices');
  for (const attribute of ['data-dossier-return="appendices"', 'data-return-room="kotroom"', 'data-return-scene="study"', 'data-return-zoom="2.5"', 'data-return-pan-x="0.6"', 'data-return-pan-y="0.4"']) assert.ok(html.includes(attribute), attribute);
  assert.ok(evidenceDocument(findDossier(), 'forged', { dossierPage: 'appendices' }).includes('data-active-dossier-page="appendices"'));
});

test('листы можно выбирать стрелками и клавишами Home и End', () => {
  assert.equal(dossierPageForKey('agent', 'ArrowRight'), 'suspect');
  assert.equal(dossierPageForKey('agent', 'ArrowLeft'), 'appendices');
  assert.equal(dossierPageForKey('appendices', 'ArrowRight'), 'agent');
  assert.equal(dossierPageForKey('protocol', 'Home'), 'agent');
  assert.equal(dossierPageForKey('protocol', 'End'), 'appendices');
  assert.equal(dossierPageForKey('protocol', 'Escape'), null);
  assert.equal(dossierPageForKey('unknown', 'ArrowRight'), null);
});

test('старое сохранение с изученным конвертом открывает новые листы без сброса прогресса', () => {
  const previous = findDossier();
  readEvidence(previous, 'forged');
  previous.notes.stage3 = 'Моя версия старого дела';
  const restored = sanitizeState(JSON.parse(JSON.stringify(previous)));
  assert.equal(restored.stage, 3);
  assert.ok(restored.readEvidence.includes('forged'));
  assert.equal(restored.notes.stage3, 'Моя версия старого дела');
  assert.ok(evidenceDocument(restored, 'forged', { dossierPage: 'appendices' }).includes('data-active-dossier-page="appendices"'));
});
