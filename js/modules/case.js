import { evidence, evidenceById } from '../data/evidence.js';
import { characters, characterById } from '../data/characters.js';
import { locationById } from '../data/locations.js';
import { interrogationById, additionalById, additionalInterrogations } from '../data/dialogues.js';
import { meaningfulText, validateInventory, validateQuestions } from './validation.js';

const addUnique = (list, id) => { if (!list.includes(id)) list.push(id); };
export function record(state, text) {
  state.journal.push({ text, at: new Date().toISOString() });
  if (state.journal.length > 100) state.journal.shift();
}
export function canOpenEvidence(state, id) {
  const item = evidenceById.get(id);
  return Boolean(item && item.stage <= state.stage && state.foundEvidence.includes(id) && (id !== 'confession' || state.finished));
}
export function visitRoom(state, id) {
  const room = locationById.get(id);
  if (!room || room.stage > state.stage || (state.finished && !state.visitedRooms.includes(id))) return false;
  if (!state.visitedRooms.includes(id)) {
    addUnique(state.visitedRooms, id);
    room.evidence.forEach(item => addUnique(state.foundEvidence, item));
    record(state, `Осмотрено помещение: ${room.name}.`);
  }
  return true;
}
export function readEvidence(state, id) {
  if (!canOpenEvidence(state, id)) return false;
  if (!state.readEvidence.includes(id)) {
    addUnique(state.readEvidence, id);
    record(state, `Изучен материал: ${evidenceById.get(id).title}.`);
  }
  return true;
}
export function canOpenInterrogation(state, id, extra = false) {
  if (!characterById.has(id) || state.stage < (extra ? 3 : 2)) return false;
  if (!extra) return interrogationById.has(id);
  const dialogue = additionalById.get(id);
  return Boolean(dialogue && state.readInterrogations.includes(id) && dialogue.requires.every(clue => state.readEvidence.includes(clue)));
}
export function assessPerson(state, id, assessment, note) {
  if (state.finished || !canOpenInterrogation(state, id) || !['trust', 'doubt', 'lie'].includes(assessment)) return { success: false, message: 'Выберите оценку показаний.' };
  if (!meaningfulText(note)) return { success: false, message: 'Запишите причину оценки: минимум три слова.' };
  state.assessments[id] = assessment;
  state.notes[id] = String(note).slice(0, 4000);
  if (!state.readInterrogations.includes(id)) record(state, `Изучен первый протокол: ${characterById.get(id).name}.`);
  addUnique(state.readInterrogations, id);
  (interrogationById.get(id).evidence ?? []).forEach(clue => addUnique(state.foundEvidence, clue));
  return { success: true, message: 'Оценка сохранена. Это ваша версия; её можно изменить после новых материалов.' };
}
export function readAdditional(state, id) {
  if (state.finished || !canOpenInterrogation(state, id, true)) return false;
  if (!state.readAdditional.includes(id)) record(state, `Изучен дополнительный протокол: ${characterById.get(id).name}.`);
  addUnique(state.readAdditional, id);
  (additionalById.get(id).evidence ?? []).forEach(clue => addUnique(state.foundEvidence, clue));
  return true;
}

export function requirements(state, stage) {
  const result = [];
  const require = (complete, label, view) => result.push({ complete, label, view });
  if (stage === 1) {
    require(state.visitedRooms.includes('office') && state.visitedRooms.includes('lounge'), 'Осмотреть кабинет и гостиную', 'rooms');
    const initial = evidence.filter(item => item.stage === 1);
    require(initial.every(item => state.readEvidence.includes(item.id)), `Изучить первичные материалы (${initial.filter(item => state.readEvidence.includes(item.id)).length}/${initial.length})`, 'evidence');
  }
  if (stage === 2) {
    require(characters.every(person => state.readInterrogations.includes(person.id) && state.assessments[person.id] && meaningfulText(state.notes[person.id])), `Прочитать и оценить первые допросы (${state.readInterrogations.length}/7)`, 'people');
    require(['witness', 'somov'].every(id => state.readEvidence.includes(id)), 'Изучить новые показания в разделе «Улики»', 'evidence');
  }
  if (stage === 3) {
    require(['kotroom', 'bedroom'].every(id => state.visitedRooms.includes(id)), 'Осмотреть комнату сыщика и комнату Плюшкина', 'rooms');
    require(['dues', 'forged', 'glove'].every(id => state.readEvidence.includes(id)), 'Открыть и изучить три дополнительных конверта', 'evidence');
    require(additionalInterrogations.every(item => state.readAdditional.includes(item.id)), `Изучить повторные допросы (${state.readAdditional.length}/3)`, 'people');
    require(state.readEvidence.includes('gift'), 'Изучить показания о передаче бутылки', 'evidence');
  }
  return result;
}

export function evaluateStage(state, stage) {
  const tasks = requirements(state, stage);
  const results = validateQuestions(stage, state.answers);
  const inventory = stage === 1 ? validateInventory(state.notes.inventory) : null;
  const noteValid = stage === 1 || meaningfulText(state.notes[`stage${stage}`]);
  return { tasks, results, inventory, noteValid, success: tasks.every(task => task.complete) && results.every(answer => answer.correct) && (!inventory || inventory.success) && noteValid };
}
export function completeStage(state, stage) {
  if (state.finished || stage !== state.stage || stage < 1 || stage > 3) return false;
  const result = evaluateStage(state, stage);
  addUnique(state.checkedStages, stage);
  if (!result.success) return false;
  addUnique(state.completedStages, stage);
  state.stage = stage + 1;
  record(state, `Завершён этап ${stage}. Открыт этап ${state.stage}.`);
  return true;
}

export function accuse(state, target, selected, reason) {
  if (state.finished || state.stage !== 4 || !characterById.has(target)) return { success: false, message: 'Обвинение доступно после завершения расследования.' };
  const unique = [...new Set(selected)].filter(id => state.readEvidence.includes(id) && id !== 'confession');
  if (unique.length < 2 || !meaningfulText(reason)) return { success: false, message: 'Выберите минимум два изученных материала и объясните вывод хотя бы тремя словами.' };
  if (target === 'kot' && !['decanter', 'gift', 'forged', 'witness'].every(id => unique.includes(id))) {
    return { success: false, message: 'Обвинение пока не связывает способ убийства, передачу напитка, мотив и нарушение алиби. Проверьте, какие материалы подтверждают каждую часть.' };
  }
  state.accusation = target;
  state.selectedEvidence = unique;
  state.notes.verdict = String(reason).slice(0, 4000);
  state.finished = true;
  state.ending = target === 'kot' ? 'justice' : 'wrong';
  state.accusations.push({ target, result: state.ending });
  if (state.ending === 'justice') addUnique(state.foundEvidence, 'confession');
  record(state, `Предъявлено обвинение: ${characterById.get(target).name}. Итог: ${state.ending === 'justice' ? 'обосновано' : 'не подтверждено'}.`);
  return { success: true, ending: state.ending };
}
export function deferCase(state) {
  if (state.finished || state.stage !== 4) return false;
  state.finished = true;
  state.ending = 'unresolved';
  addUnique(state.foundEvidence, 'confession');
  record(state, 'Обвинение отложено. Получены заключительные материалы дела.');
  return true;
}
export function resumeCase(state) {
  if (state.stage !== 4) return false;
  state.finished = false;
  state.ending = null;
  state.foundEvidence = state.foundEvidence.filter(id => id !== 'confession');
  state.readEvidence = state.readEvidence.filter(id => id !== 'confession');
  state.view = 'stage';
  state.viewStage = 4;
  record(state, 'Расследование возобновлено для повторной оценки доказательств.');
  return true;
}
export function investigationProgress(state) {
  if (state.finished) return 100;
  const stage = state.stage;
  const tasks = requirements(state, stage);
  const fraction = tasks.length ? tasks.filter(task => task.complete).length / tasks.length : 0;
  return Math.round(((stage - 1) + fraction * 0.75) / 4 * 100);
}
