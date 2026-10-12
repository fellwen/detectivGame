import { characters, characterById } from '../data/characters.js';
import { interrogationById, additionalById } from '../data/dialogues.js';
import { evidenceById } from '../data/evidence.js';
import { canOpenInterrogation } from './case.js';
import { escapeHTML as e, portraitHTML } from './dom.js';
import { heading } from './investigation.js';

export const assessmentLabels = { trust: 'Доверяю', doubt: 'Сомневаюсь', lie: 'Считаю, что лжёт' };
export function renderPeople(state) {
  return `${heading('Лица, связанные с делом', 'Подозреваемые', `${state.readInterrogations.length} / 7 первых протоколов`)}<p class="text-muted-custom">Оценка показаний — ваша рабочая версия. Мотив или нервная реакция сами по себе не доказывают вину.</p>
    <div class="people-grid">${characters.map(person => `<article class="person-card"><button type="button" class="image-button portrait-button" data-portrait="${person.id}" aria-label="Увеличить портрет ${e(person.name)}">${portraitHTML(person)}</button><div class="person-copy"><h2 class="h5">${e(person.name)}</h2><p class="person-description">${e(person.description)}</p><p class="motive"><strong>Проверить:</strong> ${e(person.motive)}</p><div class="person-status">${state.assessments[person.id] ? `<span class="tag">${e(assessmentLabels[state.assessments[person.id]])}</span>` : '<span class="small-mono">Версия не записана</span>'}</div><button type="button" class="btn btn-outline-brass w-100" data-person="${person.id}">Открыть досье</button>${state.stage >= 3 && additionalById.has(person.id) ? `<button type="button" class="btn btn-link-custom mt-2 w-100" data-person-extra="${person.id}" ${canOpenInterrogation(state, person.id, true) ? '' : 'disabled'}>${state.readAdditional.includes(person.id) ? '✓ Повторный протокол' : 'Дополнительный допрос'}</button>` : ''}</div></article>`).join('')}</div>`;
}
const transcript = lines => `<div class="transcript">${lines.map(([speaker, text]) => `<div class="dialogue-line ${speaker === 'Майор' ? 'question-line' : ''}"><strong>${e(speaker)}</strong><p>${e(text)}</p></div>`).join('')}</div>`;

export function personDocument(state, id, extra = false) {
  const person = characterById.get(id);
  if (!person) return null;
  const allowed = canOpenInterrogation(state, id, extra);
  const dialogue = extra ? additionalById.get(id) : interrogationById.get(id);
  const head = `<div class="dossier-head"><button type="button" class="image-button" data-portrait="${id}" aria-label="Увеличить портрет">${portraitHTML(person, 'dossier-portrait', false)}</button><div><span class="tag">${e(person.role)}</span><p class="mt-3">${e(person.description)}</p><p class="motive"><strong>Проверить:</strong> ${e(person.motive)}</p></div></div>`;
  if (!allowed) {
    const missing = extra && dialogue ? dialogue.requires.filter(clue => !state.readEvidence.includes(clue)).map(clue => evidenceById.get(clue).title) : [];
    return `${head}<div class="answer-feedback">${extra ? `Для повторного допроса сначала прочитайте первый протокол и изучите: ${e(missing.join(', ') || 'материалы по этому фигуранту')}.` : 'Первые протоколы откроются после завершения осмотра.'}</div>`;
  }
  const read = extra ? state.readAdditional.includes(id) : state.readInterrogations.includes(id);
  if (extra) return `${head}<h3 class="h5 mt-4">Дополнительный протокол</h3>${transcript(dialogue.lines)}<button type="button" class="btn btn-brass mt-3" data-read-extra="${id}" ${read || state.finished ? 'disabled' : ''}>${read ? '✓ Протокол изучен' : 'Отметить как изученное'}</button>`;
  return `${head}<h3 class="h5 mt-4">Первый протокол допроса</h3>${transcript(dialogue.lines)}<form class="assessment-form mt-4" data-assessment-form="${id}"><fieldset ${state.finished ? 'disabled' : ''}><legend class="h6">Ваша оценка показаний</legend><div class="assessment-options">${Object.entries(assessmentLabels).map(([value, label]) => `<label class="choice-option"><input type="radio" name="assessment" value="${value}" ${state.assessments[id] === value ? 'checked' : ''}><span>${e(label)}</span></label>`).join('')}</div><label class="form-label mt-3" for="personNote">Почему вы так думаете?</label><textarea id="personNote" name="note" data-note="${id}" class="form-control" rows="3" maxlength="4000" placeholder="Укажите конкретную реплику или противоречие">${e(state.notes[id] ?? '')}</textarea><p class="small text-muted-custom mt-2">Минимум три слова. Оценку можно пересмотреть; она не проверяется как единственный правильный ответ.</p><button type="submit" class="btn btn-brass">${read ? 'Обновить оценку' : 'Сохранить оценку и завершить допрос'}</button></fieldset><div id="personFeedback" class="d-none" role="status"></div></form>`;
}
