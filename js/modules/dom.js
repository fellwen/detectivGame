export const escapeHTML=(value='')=>String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
export const byId=id=>document.getElementById(id);
export function showModal(title,html){byId('detailModalTitle').textContent=title;byId('detailModalBody').innerHTML=html;bootstrap.Modal.getOrCreateInstance(byId('detailModal')).show();}
export function toast(title,message){byId('toastTitle').textContent=title;byId('toastMessage').textContent=message;bootstrap.Toast.getOrCreateInstance(byId('gameToast'),{delay:3200}).show();}
export function button(label,attrs=''){return `<button type="button" class="btn btn-brass" ${attrs}>${escapeHTML(label)}</button>`;}
