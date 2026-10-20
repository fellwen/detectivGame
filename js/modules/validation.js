import { questions } from '../data/stages.js';

export const normalizeText = value => String(value ?? '').toLowerCase().replace(/ё/g, 'е').replace(/[^а-яa-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
export function meaningfulText(value, minimumWords = 3) {
  const text = normalizeText(value);
  return text.length >= 12 && text.split(' ').filter(word => word.length > 1).length >= minimumWords;
}

const inventory = [
  { id: 'decanter', label: 'Коньяк и бокал', stems: ['конья', 'бутыл', 'бокал', 'напит', 'цианид'] },
  { id: 'lock', label: 'Замок и проволока', stems: ['замок', 'замк', 'ключ', 'двер', 'проволок'] },
  { id: 'button', label: 'Пуговица', stems: ['пуговиц'] },
  { id: 'note', label: 'Записка с угрозой', stems: ['записк', 'угроз'] },
  { id: 'handkerchief', label: 'Платок', stems: ['платок', 'платк'] },
  { id: 'footprints', label: 'Следы обуви', stems: ['след', 'отпечат'], context: ['обув', 'снег', 'окн', 'размер', '43', 'двор'] }
];
export const inventoryLabels = inventory.map(item => item.label);

// Проверка названий, а не произвольных утверждений. Разделяйте предметы ; или новой строкой.
export function validateInventory(value) {
  const fragments = String(value ?? '').slice(0, 4000).split(/[;\n,]+/).map(part => part.trim()).filter(Boolean).slice(0, 30);
  const found = new Set();
  const rows = fragments.map(fragment => {
    const tokens = normalizeText(fragment).split(' ');
    const matches = inventory.filter(item => tokens.some(token => item.stems.some(stem => token.startsWith(stem))) && (!item.context || tokens.some(token => item.context.some(stem => token.startsWith(stem)))));
    matches.forEach(item => found.add(item.id));
    return { text: fragment, valid: matches.length > 0, labels: matches.map(item => item.label) };
  });
  const missing = inventory.filter(item => !found.has(item.id)).map(item => item.label);
  return { rows, missing, success: fragments.length > 0 && missing.length === 0 && rows.every(row => row.valid) };
}

export function validateQuestions(stage, answers) {
  return (questions[stage] ?? []).map(question => ({
    id: question.id,
    correct: answers[`${stage}:${question.id}`] === question.correct,
    answered: Boolean(answers[`${stage}:${question.id}`]),
    explanation: question.explanation
  }));
}
