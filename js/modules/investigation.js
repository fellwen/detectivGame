import { evidence, evidenceById } from '../data/evidence.js';
import { locations } from '../data/locations.js';
import { canOpenEvidence, sceneProgress } from './case.js';
import { escapeHTML as e } from './dom.js';
import { renderRoomSearch } from './search-scene.js';
import { documentExhibits } from './exhibits.js';
import { renderDossier } from './dossier.js';

export function heading(kicker, title, tag = '') {
  return `<header class="section-heading"><div><p class="eyebrow mb-2">${e(kicker)}</p><h1 class="h2 mb-0" tabindex="-1">${e(title)}</h1></div>${tag ? `<span class="tag">${e(tag)}</span>` : ''}</header>`;
}
export function renderEvidencePage(state) {
  const available = evidence.filter(item => canOpenEvidence(state, item.id));
  return `${heading('Папка следователя', 'Улики и документы', `${state.readEvidence.length} / ${available.length} изучено`)}
    <p class="text-muted-custom">Предметы появляются после находок на изображениях, показания — после допросов. Откройте материал и отметьте, что изучили его.</p>
    <div class="evidence-grid">${available.map(item => {
      const read = state.readEvidence.includes(item.id);
      return `<article class="evidence-card ${read ? 'is-read' : ''}"><div class="d-flex justify-content-between gap-2"><span class="file-label">${e(item.type)}</span><span class="small-mono">${e(item.number)}</span></div><h2 class="h5">${e(item.title)}</h2><p class="text-muted-custom">${e(item.summary)}</p><div class="card-actions"><button type="button" class="btn ${item.type.startsWith('Конверт') ? 'btn-brass' : 'btn-outline-brass'}" data-evidence="${item.id}">${item.type.startsWith('Конверт') && !read ? 'Открыть конверт' : 'Изучить материал'}</button><span class="status-label ${read ? 'complete' : ''}">${read ? '✓ Изучено' : 'Не изучено'}</span></div></article>`;
    }).join('')}</div>`;
}
export function evidenceDocument(state, id, options = {}) {
  if (!canOpenEvidence(state, id)) return null;
  const item = evidenceById.get(id);
  const read = state.readEvidence.includes(id);
  if (id === 'forged') return `${renderDossier(state, options?.dossierPage)}<section class="archive-case-notes mt-4"><h3 class="h6">Сопоставление с делом отеля</h3>${item.paragraphs.map(text => `<p class="text-muted-custom small">${e(text)}</p>`).join('')}</section><div class="mt-3"><button type="button" class="btn btn-brass" data-read-evidence="forged" ${read ? 'disabled' : ''}>${read ? '✓ Материал изучен' : 'Отметить как изученное'}</button></div>`;
  return `<article class="document-sheet"><div class="document-top"><span class="document-stamp">ПОЛИЦИЯ ГРЕНОБЛЯ</span><span>СОЗ-172438 · № ${e(item.number)}</span></div><h3>${e(item.title)}</h3><p class="document-meta">${e(item.date ?? '13 декабря 1928')} · ${e(item.type)}</p>
    ${item.image ? `<figure class="document-portrait"><button type="button" class="image-button" data-portrait="arkadiy" aria-label="Открыть портрет Аркадия"><img src="${e(item.image)}" alt="Портрет Аркадия Вельского" width="300" height="400"></button><figcaption>${e(item.imageCaption)}</figcaption></figure>` : ''}
    ${documentExhibits(item)}${item.paragraphs.map(text => `<p>${e(text)}</p>`).join('')}<p class="document-signature">Приобщено к делу № СОЗ-172438.<br>Подпись следователя ____________________</p></article>
    <div class="mt-3"><button type="button" class="btn btn-brass" data-read-evidence="${id}" ${read ? 'disabled' : ''}>${read ? '✓ Материал изучен' : 'Отметить как изученное'}</button></div>`;
}
export function renderRooms(state) {
  return `${heading('Осмотр отеля', 'Помещения', `${state.visitedRooms.length} / 4 осмотрено`)}
    <p class="text-muted-custom">Первичные помещения доступны сразу. Две комнаты откроются после сопоставления первых допросов.</p>
    <div class="room-grid">${locations.map(room => {
      const locked = room.stage > state.stage;
      const visited = state.visitedRooms.includes(room.id);
      const progress = sceneProgress(state, room.id);
      return `<article class="room-card ${locked ? 'locked' : ''}"><button type="button" class="image-button room-cover" data-room="${room.id}" aria-label="Открыть сцену: ${e(room.name)}" ${locked || (state.finished && !visited) ? 'disabled' : ''}><img src="${e(room.cover)}" alt="Иллюстрированный вид: ${e(room.name)}" width="1600" height="1000" loading="lazy"></button><span class="small-mono">${e(room.floor)}</span><h2 class="h4 mt-2">${e(room.name)}</h2><p class="text-muted-custom">${e(room.description)}</p><div class="card-actions"><button type="button" class="btn btn-outline-brass" data-room="${room.id}" ${locked || (state.finished && !visited) ? 'disabled' : ''}>${locked ? 'Доступно с этапа 3' : visited ? 'Продолжить поиск' : 'Осмотреть'}</button><span class="status-label ${visited ? 'complete' : ''}">${locked ? 'Закрыто' : progress.total ? `Находки: ${progress.found}/${progress.total}` : visited ? '✓ Осмотрено' : 'Не осмотрено'}</span></div></article>`;
    }).join('')}</div>`;
}
export function roomDocument(state, room, sceneId = '') {
  return renderRoomSearch(state, room, sceneId);
}
