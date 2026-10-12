import { evidenceById } from '../data/evidence.js';
import { characterById } from '../data/characters.js';
import { locationById } from '../data/locations.js';
import { additionalById } from '../data/dialogues.js';

export const SAVE_KEY = 'grace-hotel-case-v2';
const LEGACY_KEY = 'grace-hotel-case-v1';
const views = new Set(['home', 'stage', 'rooms', 'people', 'evidence', 'journal']);
const assessments = new Set(['trust', 'doubt', 'lie']);
const endings = new Set(['justice', 'wrong', 'unresolved']);
const object = value => value && typeof value === 'object' && !Array.isArray(value);
const string = value => typeof value === 'string' ? value.slice(0, 4000) : '';
const ids = (value, map) => Array.isArray(value) ? [...new Set(value.filter(id => typeof id === 'string' && map.has(id)))] : [];
const dictionary = value => {
  const result = {};
  if (object(value)) for (const [key, item] of Object.entries(value).slice(0, 100)) {
    if (/^[a-z0-9:_-]{1,60}$/i.test(key) && typeof item === 'string') result[key] = string(item);
  }
  return result;
};

export function createState() {
  return {
    version: 2, stage: 1, view: 'home', viewStage: 1, completedStages: [],
    foundEvidence: ['report', 'autopsy'], readEvidence: [], visitedRooms: [],
    readInterrogations: [], readAdditional: [], assessments: {}, notes: {}, answers: {},
    checkedStages: [], accusation: '', selectedEvidence: [], finished: false, ending: null,
    accusations: [], journal: [], savedAt: null
  };
}

export function sanitizeState(data) {
  const state = createState();
  if (!object(data)) return state;
  // Этапы непрерывны. Некорректное сохранение не открывает финал случайным числом.
  const complete = Array.isArray(data.completedStages) ? data.completedStages : [];
  for (const stage of [1, 2, 3]) {
    if (!complete.includes(stage)) break;
    state.completedStages.push(stage);
  }
  state.stage = state.completedStages.length + 1;
  state.view = views.has(data.view) ? data.view : 'home';
  state.viewStage = Number.isInteger(data.viewStage) && data.viewStage >= 1 && data.viewStage <= state.stage ? data.viewStage : state.stage;
  state.foundEvidence = [...new Set(['report', 'autopsy', ...ids(data.foundEvidence, evidenceById).filter(id => evidenceById.get(id).stage <= state.stage && id !== 'confession')])];
  state.readEvidence = ids(data.readEvidence, evidenceById).filter(id => state.foundEvidence.includes(id));
  state.visitedRooms = ids(data.visitedRooms, locationById).filter(id => locationById.get(id).stage <= state.stage);
  if (state.stage >= 2) state.readInterrogations = ids(data.readInterrogations, characterById);
  if (state.stage >= 3) state.readAdditional = ids(data.readAdditional, additionalById);
  state.notes = dictionary(data.notes);
  state.answers = dictionary(data.answers);
  if (object(data.assessments)) for (const [id, assessment] of Object.entries(data.assessments)) {
    if (characterById.has(id) && assessments.has(assessment) && state.readInterrogations.includes(id)) state.assessments[id] = assessment;
  }
  state.checkedStages = Array.isArray(data.checkedStages) ? [...new Set(data.checkedStages.filter(id => Number.isInteger(id) && id >= 1 && id <= state.stage))] : [];
  state.accusation = characterById.has(data.accusation) ? data.accusation : '';
  state.selectedEvidence = ids(data.selectedEvidence, evidenceById).filter(id => state.readEvidence.includes(id) && id !== 'confession');
  state.finished = data.finished === true && state.stage === 4 && endings.has(data.ending);
  state.ending = state.finished ? data.ending : null;
  if (state.finished && state.ending !== 'wrong') {
    state.foundEvidence.push('confession');
    if (Array.isArray(data.readEvidence) && data.readEvidence.includes('confession')) state.readEvidence.push('confession');
  }
  state.accusations = Array.isArray(data.accusations) ? data.accusations.filter(item => object(item) && characterById.has(item.target)).slice(-20).map(item => ({ target: item.target, result: endings.has(item.result) ? item.result : 'wrong' })) : [];
  state.journal = Array.isArray(data.journal) ? data.journal.filter(entry => object(entry) && typeof entry.text === 'string').slice(-100).map(entry => ({ text: string(entry.text), at: string(entry.at).slice(0, 40) })) : [];
  state.savedAt = typeof data.savedAt === 'string' ? data.savedAt.slice(0, 40) : null;
  return state;
}

export function migrateLegacy(old) {
  const data = object(old) ? { ...old } : {};
  const stage = Number.isInteger(data.stage) ? Math.max(1, Math.min(4, data.stage)) : 1;
  data.completedStages = Array.from({ length: stage - 1 }, (_, i) => i + 1);
  data.viewStage = stage;
  data.finished = false; // Старый финал определялся одним именем; доказательства нужно выбрать заново.
  data.notes = dictionary(data.notes);
  data.answers = {};
  const state = sanitizeState(data);
  state.journal.push({ text: 'Прогресс перенесён из предыдущей версии. Заметки и открытые этапы сохранены; новые материалы можно изучить в архиве.', at: new Date().toISOString() });
  return state;
}

export function loadState(storage = null) {
  try {
    storage ??= globalThis.localStorage;
    const raw = storage.getItem(SAVE_KEY);
    if (raw !== null) return { state: sanitizeState(JSON.parse(raw)), status: 'loaded' };
    const legacy = storage.getItem(LEGACY_KEY);
    if (legacy !== null) return { state: migrateLegacy(JSON.parse(legacy)), status: 'migrated' };
    return { state: createState(), status: 'new' };
  } catch {
    return { state: createState(), status: 'unavailable' };
  }
}

export function saveState(state, storage = null) {
  try {
    storage ??= globalThis.localStorage;
    state.savedAt = new Date().toISOString();
    storage.setItem(SAVE_KEY, JSON.stringify(state));
    return true;
  } catch { return false; }
}

export function clearState(storage = null) {
  try { storage ??= globalThis.localStorage; storage.removeItem(SAVE_KEY); storage.removeItem(LEGACY_KEY); return true; }
  catch { return false; }
}
