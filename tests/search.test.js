import test from 'node:test';
import assert from 'node:assert/strict';
import { createState, sanitizeState } from '../js/modules/save-manager.js';
import { visitRoom, discoverTarget, sceneProgress, getHintTarget, readEvidence } from '../js/modules/case.js';
import { locations, locationById } from '../js/data/locations.js';
import { sceneByKey, targetByKey, targetKey } from '../js/data/scenes.js';
import { renderRoomSearch, normalizeZoom, pickSceneTarget, targetRegions, fittedSceneWidth } from '../js/modules/search-scene.js';
import { enlargedExhibit } from '../js/modules/exhibits.js';

test('открытие помещения не выдаёт предметы', () => {
  const state = createState();
  assert.equal(visitRoom(state, 'office'), true);
  assert.deepEqual(state.foundEvidence, ['report', 'autopsy']);
  assert.deepEqual(sceneProgress(state, 'office'), { found: 0, total: 6 });
  assert.equal(readEvidence(state, 'button'), false);
  const html = renderRoomSearch(state, locationById.get('office'));
  assert.equal(html.includes('data-evidence="button"'), false);
  assert.equal(html.includes('aria-label="Осмотреть участок 1"'), true);
});
test('объект открывается только в нужном помещении и ракурсе', () => {
  const state = createState(); visitRoom(state, 'office');
  assert.equal(discoverTarget(state, 'office', 'window', 'button').success, false);
  assert.equal(discoverTarget(state, 'office', 'interior', 'unknown').success, false);
  assert.equal(discoverTarget(state, 'office', 'interior', 'button').success, true);
  assert.equal(state.foundEvidence.includes('button'), true);
  assert.equal(state.foundEvidence.includes('decanter'), false);
  assert.equal(sceneProgress(state, 'office').found, 1);
});
test('повторный клик не дублирует находку или журнал', () => {
  const state = createState(); visitRoom(state, 'office');
  discoverTarget(state, 'office', 'interior', 'paper');
  const journal = state.journal.length;
  const result = discoverTarget(state, 'office', 'interior', 'paper');
  assert.equal(result.alreadyFound, true);
  assert.equal(state.journal.length, journal);
  assert.equal(state.foundEvidence.filter(id => id === 'note').length, 1);
});
test('декор осматривается отдельно от доказательств', () => {
  const state = createState(); visitRoom(state, 'office');
  assert.equal(discoverTarget(state, 'office', 'interior', 'rug').success, true);
  assert.equal(sceneProgress(state, 'office').found, 0);
  assert.deepEqual(state.foundEvidence, ['report', 'autopsy']);
});
test('закрытые комнаты нельзя обойти через сцену', () => {
  const state = createState();
  assert.equal(visitRoom(state, 'kotroom'), false);
  assert.equal(discoverTarget(state, 'kotroom', 'drawer', 'glove').success, false);
  assert.equal(renderRoomSearch(state, locationById.get('kotroom')), null);
  assert.equal(getHintTarget(state, 'kotroom', 'drawer'), null);
});
test('подсказка выбирает неизвестную улику, но не выдаёт её', () => {
  const state = createState(); visitRoom(state, 'office');
  discoverTarget(state, 'office', 'interior', 'drink');
  const hint = getHintTarget(state, 'office', 'interior');
  assert.ok(hint);
  assert.notEqual(hint.id, 'drink');
  assert.equal(state.foundEvidence.includes(hint.evidence), false);
  assert.equal(state.hintsUsed, 1);
});
test('находки и осмотренные детали переживают сохранение', () => {
  const state = createState(); visitRoom(state, 'office');
  discoverTarget(state, 'office', 'interior', 'button');
  discoverTarget(state, 'office', 'interior', 'rug');
  const restored = sanitizeState(JSON.parse(JSON.stringify(state)));
  assert.equal(restored.foundTargets.includes(targetKey('office', 'interior', 'button')), true);
  assert.equal(restored.foundTargets.includes(targetKey('office', 'interior', 'rug')), true);
  assert.equal(sceneProgress(restored, 'office').found, 1);
});
test('сохранение v2 переносит уже известные улики без повторного поиска', () => {
  const old = createState(); delete old.foundTargets; old.version = 2;
  old.foundEvidence.push('decanter', 'note', 'button', 'lock', 'handkerchief', 'footprints');
  old.visitedRooms.push('office');
  const migrated = sanitizeState(old);
  assert.equal(migrated.version, 3);
  assert.deepEqual(sceneProgress(migrated, 'office'), { found: 6, total: 6 });
});
test('испорченные зоны и счётчик подсказок отфильтровываются', () => {
  const state = sanitizeState({ foundTargets: ['unknown', 'kotroom:drawer:glove', 'office:interior:paper'], hintsUsed: -100 });
  assert.equal(state.foundTargets.length, 0);
  assert.equal(state.hintsUsed, 0);
});
test('все зоны имеют корректные относительные координаты и привязки', () => {
  for (const [key, target] of targetByKey) {
    assert.ok(sceneByKey.has(`${target.roomId}:${target.sceneId}`), key);
    for (const region of targetRegions(target)) {
      for (const prop of ['x', 'y', 'w', 'h']) assert.ok(Number.isFinite(region[prop]), key);
      assert.ok(region.w > 0 && region.h > 0, key);
      assert.ok(region.x - region.w / 2 >= 0 && region.x + region.w / 2 <= 100, key);
      assert.ok(region.y - region.h / 2 >= 0 && region.y + region.h / 2 <= 100, key);
    }
  }
  for (const room of locations) {
    const objects = room.scenes.flatMap(scene => scene.targets.map(target => target.evidence).filter(Boolean));
    assert.deepEqual([...objects].sort(), [...room.evidence].sort());
  }
});
test('увеличенный предмет нельзя открыть до находки', () => {
  const state = createState();
  assert.equal(enlargedExhibit(state, 'button', 0), null);
  visitRoom(state, 'office'); discoverTarget(state, 'office', 'interior', 'button');
  assert.equal(typeof enlargedExhibit(state, 'button', 0), 'string');
  assert.equal(enlargedExhibit(state, 'button', -1), null);
  assert.equal(enlargedExhibit(state, 'button', 100), null);
  const withReturn = enlargedExhibit(state, 'button', 0, { roomId: 'office', sceneId: 'interior', zoom: 2.5, panX: .7, panY: .8 });
  assert.ok(withReturn.includes('data-return-zoom="2.5"'));
  assert.ok(withReturn.includes('data-return-pan-x="0.7"'));
  assert.ok(withReturn.includes('data-return-pan-y="0.8"'));
});
test('масштаб ограничен рабочим диапазоном', () => {
  assert.equal(normalizeZoom(0), 1);
  assert.equal(normalizeZoom('NaN'), 1);
  assert.equal(normalizeZoom(1.5), 1.5);
  assert.equal(normalizeZoom(20), 3);
});
test('при масштабе 100% сцена полностью помещается в окно без обрезки', () => {
  for (const [width, height] of [[280, 440], [1100, 510], [400, 220]]) {
    const fitted = fittedSceneWidth(width, height, 1586, 992);
    assert.ok(fitted <= width);
    assert.ok(fitted * 992 / 1586 <= height + .001);
    assert.equal(fittedSceneWidth(width, height, 1586, 992, 2.5), fitted * 2.5);
  }
  assert.equal(fittedSceneWidth(0, 500, 1586, 992), 0);
});
test('соседние зоны на телефоне выбираются по предмету, а не порядку кнопок', () => {
  const scene = sceneByKey.get('office:interior');
  for (const width of [280, 360, 800, 1586]) {
    const height = width * 992 / 1586;
    assert.equal(pickSceneTarget(scene, 88.3, 54.2, width, height)?.id, 'cloth');
    assert.equal(pickSceneTarget(scene, 94.6, 53.3, width, height)?.id, 'wire');
    assert.equal(pickSceneTarget(scene, 22.1, 90.1, width, height)?.id, 'button');
    assert.equal(pickSceneTarget(scene, 5, 10, width, height), null);
  }
});
test('центры всех предметов работают при разных масштабах и размерах', () => {
  for (const scene of sceneByKey.values()) for (const target of scene.targets) for (const region of targetRegions(target)) {
    for (const width of [280, 560, 900, 1800]) {
      assert.equal(pickSceneTarget(scene, region.x, region.y, width, width * scene.height / scene.width)?.id, target.id, `${scene.id}:${target.id}`);
    }
  }
  assert.equal(pickSceneTarget(sceneByKey.get('office:interior'), 110, 50, 600, 375), null);
});
