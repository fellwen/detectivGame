import { archivedAgent, wallaceRecord, wallaceConfession, sergeantProtocol, wallaceBiography, dossierPages, dossierPageById, dossierExhibits, dossierCaution } from '../data/dossier.js';
import { canOpenEvidence } from './case.js';
import { escapeHTML as e } from './dom.js';
import { renderExhibit } from './exhibits.js';

const paragraphs = texts => texts.map(text => `<p>${e(text)}</p>`).join('');
const record = fields => `<dl class="archive-record">${fields.map(([label, value]) => `<div><dt>${e(label)}</dt><dd>${e(value)}</dd></div>`).join('')}</dl>`;

export function dossierFigure(index) {
  const item = dossierExhibits[index];
  if (!item) return '';
  return `<figure class="archive-figure ${item.scan ? 'archive-scan' : ''} ${item.wide ? 'archive-figure-wide' : ''}"><button type="button" class="image-button" data-exhibit="forged" data-exhibit-index="${index}" data-dossier-page="${item.page}" aria-label="Увеличить: ${e(item.caption)}">${renderExhibit({}, item)}</button><figcaption>${e(item.caption)} <span aria-hidden="true">↗</span></figcaption></figure>`;
}

export function dossierPageForKey(current, key) {
  const index = dossierPages.findIndex(page => page.id === current);
  if (index < 0) return null;
  if (key === 'Home') return dossierPages[0].id;
  if (key === 'End') return dossierPages.at(-1).id;
  const step = key === 'ArrowRight' ? 1 : key === 'ArrowLeft' ? -1 : 0;
  return step ? dossierPages[(index + step + dossierPages.length) % dossierPages.length].id : null;
}

export function renderDossier(state, requestedPage = 'agent') {
  if (!canOpenEvidence(state, 'forged')) return null;
  const selected = dossierPageById.get(requestedPage) ?? dossierPages[0];
  const contents = {
    agent: `<div class="archive-cover-heading"><p class="archive-overline">Личное дело · 50.98.1</p><h3>Досье агента</h3><p class="archive-cover-name">Виктор Дронов</p><span class="archive-seal">АРХИВНАЯ КОПИЯ</span></div>${record(archivedAgent)}<div class="archive-inventory"><h4>Состав папки</h4><ol><li>Карточка Роберта Уоллеса и признание в убийстве.</li><li>Протокол сержанта.</li><li>Биография Роберта Уоллеса.</li><li>Портрет супруги, след подошвы, карта города и вид дома.</li></ol></div><p class="archive-caution">${e(dossierCaution)}</p>`,
    suspect: `<header class="archive-page-heading"><p class="archive-overline">Лист 1 · учётная карточка</p><h3>Подозреваемый</h3><p>Роберт Уоллес</p></header><div class="archive-suspect-grid"><div class="archive-identity-images">${dossierFigure(0)}${dossierFigure(1)}</div>${record(wallaceRecord)}</div><section class="archive-confession"><h4>Признание в убийстве</h4><blockquote>${paragraphs(wallaceConfession)}</blockquote><p class="archive-signature">Роберт Уоллес<br>Подпись ____________________</p></section>`,
    protocol: `<header class="archive-page-heading"><p class="archive-overline">Лист 2 · показания и ход расследования</p><h3>Протокол сержанта</h3><p>Ливерпуль · 19 января 1931 года</p></header>${paragraphs(sergeantProtocol)}<p class="archive-signature">Сержант Кот<br>Личный номер 50.98.1</p>`,
    biography: `<header class="archive-page-heading"><p class="archive-overline">Лист 3 · биографическая справка</p><h3>Досье на Роберта Уоллеса</h3></header>${paragraphs(wallaceBiography)}<p class="archive-signature">Справка приобщена к архивному делу.</p>`,
    appendices: `<header class="archive-page-heading"><p class="archive-overline">Лист 4 · материалы осмотра</p><h3>Приложения к документам</h3><p>Нажмите на изображение, чтобы рассмотреть его крупнее.</p></header><div class="archive-attachments">${[2, 3, 4, 5].map(dossierFigure).join('')}</div>`
  };
  return `<div class="archive-dossier" data-active-dossier-page="${selected.id}"><p class="archive-intro">В папке из комнаты Виктора — личная карточка и четыре листа старого дела. Рассмотрите их вместе с другими материалами расследования.</p><nav class="archive-tabs" role="tablist" aria-label="Листы архивного дела">${dossierPages.map(page => `<button type="button" role="tab" class="archive-tab ${page.id === selected.id ? 'is-active' : ''}" id="dossier-tab-${page.id}" data-dossier-select="${page.id}" data-page-label="${e(page.label)}" aria-selected="${page.id === selected.id}" aria-controls="dossier-panel-${page.id}" tabindex="${page.id === selected.id ? '0' : '-1'}">${e(page.title)}</button>`).join('')}</nav><p class="archive-page-status" id="dossierPageStatus" role="status">${e(selected.label)}</p>${dossierPages.map(page => `<section class="document-sheet archive-paper ${page.id === 'agent' ? 'archive-cover' : ''}" role="tabpanel" id="dossier-panel-${page.id}" data-dossier-panel="${page.id}" aria-labelledby="dossier-tab-${page.id}" tabindex="0" ${page.id === selected.id ? '' : 'hidden'}><div class="archive-sheet-top"><span>Дело Уоллеса</span><span>№ 50.98.1</span></div>${contents[page.id]}<footer class="archive-sheet-footer"><span>Сержант Кот · архив</span><span>${e(page.label)}</span></footer></section>`).join('')}</div>`;
}
