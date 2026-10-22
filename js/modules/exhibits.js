import { evidenceById } from '../data/evidence.js';
import { sceneByKey, sceneKey, targetByKey, targetKey } from '../data/scenes.js';
import { canOpenEvidence } from './case.js';
import { escapeHTML as e } from './dom.js';
import { returnSceneAttributes } from './search-scene.js';
import { dossierPageById } from '../data/dossier.js';

export function renderExhibit(item, image) {
  const dimensions = Number.isInteger(image.width) && Number.isInteger(image.height) && image.width > 0 && image.height > 0 ? `width="${image.width}" height="${image.height}"` : '';
  return `<span class="exhibit-image ${image.letter ? 'letter-image' : ''}"><img src="${e(image.src)}" alt="${e(image.caption)}" ${dimensions} loading="lazy" decoding="async">${image.letter ? `<span class="letter-content">${item.letterLines.map(line => `<span>${e(line)}</span>`).join('')}</span>` : ''}</span>`;
}

export function sceneCrop(item) {
  const crop = item.sceneCrop;
  if (!crop) return '';
  const scene = sceneByKey.get(sceneKey(crop.roomId, crop.sceneId));
  const target = targetByKey.get(targetKey(crop.roomId, crop.sceneId, crop.targetId));
  if (!scene || !target || target.evidence !== item.id) return '';
  const w = Math.min(100, target.w * 1.5), h = Math.min(100, target.h * 1.5);
  const x = Math.max(0, Math.min(100 - w, target.x - w / 2));
  const y = Math.max(0, Math.min(100 - h, target.y - h / 2));
  return `<figure class="exhibit-crop"><div class="scene-crop" style="aspect-ratio:${w * scene.width / (h * scene.height)}"><img src="${e(scene.src)}" alt="Фрагмент сцены: ${e(item.title)}" style="width:${10000 / w}%;left:${-100 * x / w}%;top:${-100 * y / h}%" loading="lazy"></div><figcaption>Фрагмент места находки. Содержание документа приведено в тексте дела.</figcaption></figure>`;
}

export function documentExhibits(item) {
  return `${item.exhibits?.length ? `<div class="document-exhibits">${item.exhibits.map((image, index) => `<figure><button type="button" class="image-button" data-exhibit="${item.id}" data-exhibit-index="${index}" aria-label="Увеличить: ${e(image.caption)}">${renderExhibit(item, image)}</button><figcaption>${e(image.caption)}</figcaption></figure>`).join('')}</div>` : ''}${sceneCrop(item)}`;
}

export function enlargedExhibit(state, id, index, context = null, returnDossierPage = '') {
  if (!canOpenEvidence(state, id) || !Number.isInteger(index)) return null;
  const item = evidenceById.get(id), image = item.exhibits?.[index];
  if (!image) return null;
  const back = returnSceneAttributes(context);
  const page = id === 'forged' && dossierPageById.has(returnDossierPage) ? `data-dossier-return="${returnDossierPage}"` : '';
  const original = image.originalSize ? `<a class="btn btn-outline-brass" href="${e(image.src)}" target="_blank" rel="noopener noreferrer">Открыть в полном размере ↗</a>` : '';
  return `<figure class="large-exhibit ${image.scan ? 'archive-large-scan' : ''}">${renderExhibit(item, image)}<figcaption>${e(image.caption)}</figcaption></figure><div class="d-flex flex-wrap gap-2"><button type="button" class="btn btn-outline-brass" data-evidence="${id}" ${back} ${page}>К материалу дела</button>${original}</div>`;
}
