import { evidence, evidenceById } from '../data/evidence.js';
import { locations } from '../data/locations.js';
import { canOpenEvidence } from './case.js';
import { escapeHTML as e } from './dom.js';

export function heading(kicker, title, tag = '') {
  return `<header class="section-heading"><div><p class="eyebrow mb-2">${e(kicker)}</p><h1 class="h2 mb-0" tabindex="-1">${e(title)}</h1></div>${tag ? `<span class="tag">${e(tag)}</span>` : ''}</header>`;
}
export function renderEvidencePage(state) {
  const available = evidence.filter(item => canOpenEvidence(state, item.id));
  return `${heading('Папка следователя', 'Улики и документы', `${state.readEvidence.length} / ${available.length} изучено`)}
    <p class="text-muted-custom">Материалы появляются после осмотра или чтения показаний. Откройте документ и отметьте, что изучили его.</p>
    <div class="evidence-grid">${available.map(item => {
      const read = state.readEvidence.includes(item.id);
      return `<article class="evidence-card ${read ? 'is-read' : ''}"><div class="d-flex justify-content-between gap-2"><span class="file-label">${e(item.type)}</span><span class="small-mono">${e(item.number)}</span></div><h2 class="h5">${e(item.title)}</h2><p class="text-muted-custom">${e(item.summary)}</p><div class="card-actions"><button type="button" class="btn ${item.type.startsWith('Конверт') ? 'btn-brass' : 'btn-outline-brass'}" data-evidence="${item.id}">${item.type.startsWith('Конверт') && !read ? 'Открыть конверт' : 'Изучить материал'}</button><span class="status-label ${read ? 'complete' : ''}">${read ? '✓ Изучено' : 'Не изучено'}</span></div></article>`;
    }).join('')}</div>`;
}
export function evidenceDocument(state, id) {
  if (!canOpenEvidence(state, id)) return null;
  const item = evidenceById.get(id);
  const read = state.readEvidence.includes(id);
  return `<article class="document-sheet"><div class="document-top"><span class="document-stamp">ПОЛИЦИЯ ГРЕНОБЛЯ</span><span>СОЗ-172438 · № ${e(item.number)}</span></div><h3>${e(item.title)}</h3><p class="document-meta">${e(item.date ?? '13 декабря 1928')} · ${e(item.type)}</p>
    ${item.image ? `<figure class="document-portrait"><button type="button" class="image-button" data-portrait="arkadiy" aria-label="Открыть портрет Аркадия"><img src="${e(item.image)}" alt="Портрет Аркадия Вельского" width="300" height="400"></button><figcaption>${e(item.imageCaption)}</figcaption></figure>` : ''}
    ${item.paragraphs.map(text => `<p>${e(text)}</p>`).join('')}<p class="document-signature">Приобщено к делу № СОЗ-172438.<br>Подпись следователя ____________________</p></article>
    <div class="mt-3"><button type="button" class="btn btn-brass" data-read-evidence="${id}" ${read ? 'disabled' : ''}>${read ? '✓ Материал изучен' : 'Отметить как изученное'}</button></div>`;
}
export function renderRooms(state) {
  return `${heading('Осмотр отеля', 'Помещения', `${state.visitedRooms.length} / 4 осмотрено`)}
    <p class="text-muted-custom">Первичные помещения доступны сразу. Две комнаты откроются после сопоставления первых допросов.</p>
    <div class="room-grid">${locations.map(room => {
      const locked = room.stage > state.stage;
      const visited = state.visitedRooms.includes(room.id);
      return `<article class="room-card ${locked ? 'locked' : ''}"><div class="room-plate" aria-hidden="true"><span>GRACE</span><strong>${room.number}</strong><span>${e(room.floor)}</span></div><span class="small-mono">${e(room.floor)}</span><h2 class="h4 mt-2">${e(room.name)}</h2><p class="text-muted-custom">${e(room.description)}</p><div class="card-actions"><button type="button" class="btn btn-outline-brass" data-room="${room.id}" ${locked || (state.finished && !visited) ? 'disabled' : ''}>${locked ? 'Доступно с этапа 3' : visited ? 'Повторить осмотр' : 'Осмотреть'}</button><span class="status-label ${visited ? 'complete' : ''}">${visited ? '✓ Осмотрено' : locked ? 'Закрыто' : 'Не осмотрено'}</span></div></article>`;
    }).join('')}</div>`;
}
export function roomDocument(state, room) {
  if (room.stage > state.stage) return null;
  const photos = room.photos.map((photo, index) => `<figure class="room-photo"><button type="button" class="image-button" data-room-photo="${room.id}" data-photo-index="${index}"><img src="${e(photo.src)}" alt="${e(photo.alt)}" loading="lazy"></button><figcaption>${e(photo.caption)}</figcaption></figure>`).join('');
  return `<p class="eyebrow">${e(room.floor)} · помещение ${room.number}</p><p>${e(room.text)}</p>${photos ? `<div class="photo-gallery">${photos}</div>` : ''}<h3 class="h5 mt-4">Приобщённые материалы</h3>
    ${room.evidence.length ? `<div class="evidence-list">${room.evidence.map(id => `<button type="button" class="evidence-chip" data-evidence="${id}"><span>${e(evidenceById.get(id).title)}</span><span class="status-label">${state.readEvidence.includes(id) ? '✓ Изучено' : 'Открыть →'}</span></button>`).join('')}</div>` : '<p class="text-muted-custom">Новых предметов не изъято. Сведения о гостях появятся в протоколах.</p>'}`;
}
