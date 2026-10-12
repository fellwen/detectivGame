export const byId = id => document.getElementById(id);
export const escapeHTML = (value = '') => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));

export function showModal(title, html) {
  byId('detailModalTitle').textContent = title;
  byId('detailModalBody').innerHTML = html;
  byId('detailModalBody').scrollTop = 0;
  bootstrap.Modal.getOrCreateInstance(byId('detailModal')).show();
}
export function hideModal() { bootstrap.Modal.getInstance(byId('detailModal'))?.hide(); }
export function toast(title, message) {
  byId('toastTitle').textContent = title;
  byId('toastMessage').textContent = message;
  bootstrap.Toast.getOrCreateInstance(byId('gameToast'), { delay: 3800 }).show();
}
export function portraitHTML(person, className = '', lazy = true) {
  return `<span class="portrait-frame ${className}"><img src="${escapeHTML(person.image)}" alt="Иллюстрированный портрет: ${escapeHTML(person.name)}" width="600" height="800" ${lazy ? 'loading="lazy"' : 'fetchpriority="high"'} decoding="async"><span class="portrait-caption">${escapeHTML(person.role)}</span></span>`;
}
export function setFeedback(id, text, success = false) {
  const element = byId(id);
  if (!element) return;
  element.className = `answer-feedback ${success ? 'correct' : 'incorrect'}`;
  element.textContent = text;
}
