import { evidenceById } from '../data/evidence.js';
import { targetKey } from '../data/scenes.js';
import { sceneProgress } from './case.js';
import { escapeHTML as e } from './dom.js';

export const normalizeZoom = value => Number.isFinite(Number(value)) ? Math.max(1, Math.min(3, Number(value))) : 1;
export const normalizePan = value => Number.isFinite(Number(value)) ? Math.max(0, Math.min(1, Number(value))) : 0;
export const targetRegions = target => [{ x: target.x, y: target.y, w: target.w, h: target.h }, ...(target.regions ?? [])];

export function fittedSceneWidth(viewportWidth, viewportHeight, sceneWidth, sceneHeight, zoom = 1) {
  if (![viewportWidth, viewportHeight, sceneWidth, sceneHeight].every(value => Number.isFinite(value) && value > 0)) return 0;
  return Math.min(viewportWidth, viewportHeight * sceneWidth / sceneHeight) * normalizeZoom(zoom);
}

export function returnSceneAttributes(context) {
  return context ? `data-return-room="${e(context.roomId)}" data-return-scene="${e(context.sceneId)}" data-return-zoom="${normalizeZoom(context.zoom)}" data-return-pan-x="${normalizePan(context.panX)}" data-return-pan-y="${normalizePan(context.panY)}"` : '';
}

// Геометрия учитывает расширение маленьких зон до 44 px. При перекрытии точное
// попадание в предмет важнее порядка HTML-кнопок; затем выбирается ближайший центр.
export function pickSceneTarget(scene, x, y, pixelWidth, pixelHeight) {
  if (![x, y, pixelWidth, pixelHeight].every(Number.isFinite) || pixelWidth <= 0 || pixelHeight <= 0 || x < 0 || x > 100 || y < 0 || y > 100) return null;
  const candidates = [];
  for (const target of scene.targets) for (const region of targetRegions(target)) {
    const dx = Math.abs(x - region.x), dy = Math.abs(y - region.y);
    const w = Math.max(region.w, 4400 / pixelWidth), h = Math.max(region.h, 4400 / pixelHeight);
    if (dx > w / 2 || dy > h / 2) continue;
    candidates.push({ target, exact: dx <= region.w / 2 && dy <= region.h / 2, distance: Math.hypot(dx * pixelWidth / 100, dy * pixelHeight / 100) });
  }
  candidates.sort((a, b) => Number(b.exact) - Number(a.exact) || a.distance - b.distance);
  return candidates[0]?.target ?? null;
}

export function renderRoomSearch(state, room, requestedScene = '') {
  if (room.stage > state.stage || !state.visitedRooms.includes(room.id)) return null;
  const scene = room.scenes.find(item => item.id === requestedScene) ?? room.scenes[0];
  const progress = sceneProgress(state, room.id, scene.id);
  const roomProgress = sceneProgress(state, room.id);
  const collected = room.evidence.filter(id => state.foundEvidence.includes(id));
  return `<div class="room-search" data-search-room="${room.id}" data-search-scene="${scene.id}">
    <p class="eyebrow">${e(room.floor)} · реконструкция места осмотра</p><p>${e(room.text)}</p>
    <nav class="scene-tabs" aria-label="Ракурсы помещения">${room.scenes.map(item => `<button type="button" class="btn ${item.id === scene.id ? 'btn-brass' : 'btn-outline-brass'}" data-room="${room.id}" data-scene-id="${item.id}" ${item.id === scene.id ? 'aria-current="true"' : ''}>${e(item.title)}</button>`).join('')}</nav>
    <div class="search-toolbar"><span>${progress.total ? `На этом виде найдено: ${progress.found} / ${progress.total}` : 'Осмотрите детали обстановки'}</span><div class="search-tools"><button type="button" class="btn btn-outline-brass btn-sm" data-zoom-step="-0.5" aria-label="Уменьшить сцену">−</button><output id="sceneZoomValue" aria-label="Масштаб">100%</output><button type="button" class="btn btn-outline-brass btn-sm" data-zoom-step="0.5" aria-label="Увеличить сцену">+</button><button type="button" class="btn btn-outline-brass btn-sm" data-search-hint ${state.finished ? 'disabled' : ''}>Подсказка</button></div></div>
    <div class="scene-viewport" tabindex="0" aria-label="Сцена поиска. При увеличении прокручивайте изображение в стороны.">
      <div class="search-stage" data-scene-zoom="1"><img class="search-image" src="${e(scene.src)}" alt="${e(scene.alt)}" width="${scene.width}" height="${scene.height}" draggable="false" decoding="async">
        ${scene.targets.map((target, index) => {
          const key = targetKey(room.id, scene.id, target.id);
          const found = state.foundTargets.includes(key);
          const label = target.evidence ? evidenceById.get(target.evidence).title : target.label;
          return targetRegions(target).map((region, regionIndex) => `<button type="button" class="search-target ${found ? 'is-found' : ''}" data-search-target="${target.id}" data-target-key="${key}" ${regionIndex ? 'tabindex="-1"' : ''} aria-label="${found ? e(`Повторно осмотреть: ${label}`) : `Осмотреть участок ${index + 1}`}" style="left:${region.x}%;top:${region.y}%;width:${region.w}%;height:${region.h}%" ${state.finished && !found ? 'disabled' : ''}><span aria-hidden="true">✓</span></button>`).join('');
        }).join('')}
      </div>
    </div>
    <p class="scene-help">Нажимайте на предметы на изображении. При увеличении сцену можно прокручивать пальцем, колесом мыши или полосами прокрутки. Найденные участки отмечаются рамкой.</p>
    <p id="sceneFeedback" class="scene-feedback" role="status" aria-live="polite">${roomProgress.total ? `Всего в помещении и прилегающем участке: ${roomProgress.found} / ${roomProgress.total} находок.` : 'Детали сцены помогут сопоставить показания.'}</p>
    <h3 class="h6 mt-4">Найденные материалы</h3>${collected.length ? `<div class="evidence-list">${collected.map(id => `<button type="button" class="evidence-chip" data-evidence="${id}" data-return-room="${room.id}" data-return-scene="${scene.id}"><span>${e(evidenceById.get(id).title)}</span><span class="status-label">${state.readEvidence.includes(id) ? '✓ Изучено' : 'Открыть →'}</span></button>`).join('')}</div>` : '<p class="text-muted-custom small">Материалы появятся здесь после находок на изображении.</p>'}
  </div>`;
}
