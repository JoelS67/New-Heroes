const pageList = document.getElementById('page-list');
const pageFields = document.getElementById('page-fields');
const sectionsEditor = document.getElementById('sections-editor');
const saveStatus = document.getElementById('save-status');
const editorAlert = document.getElementById('editor-alert');
let content;
let csrfToken;
let activeSlug;
let isDirty = false;
let pendingConfirmation;

const escapeHtml = (value = '') => String(value).replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
const pageUrl = (slug) => slug === 'inicio' ? '/' : `/${slug}`;
const getPage = () => content.pages.find((page) => page.slug === activeSlug);

function showAlert(message, isError = false) {
  editorAlert.textContent = message;
  editorAlert.hidden = false;
  editorAlert.classList.toggle('is-error', isError);
  if (!isError) window.setTimeout(() => { editorAlert.hidden = true; }, 4200);
}

async function api(url, options = {}) {
  const headers = { ...(options.body ? { 'Content-Type': 'application/json' } : {}), ...(options.headers || {}) };
  if (options.method && options.method !== 'GET') headers['X-CSRF-Token'] = csrfToken;
  const response = await fetch(url, { ...options, headers, credentials: 'same-origin' });
  const payload = await response.json().catch(() => ({}));
  if (response.status === 401) {
    window.location.replace('/admin');
    throw new Error('Sua sessão expirou. Entre novamente.');
  }
  if (!response.ok) throw new Error(payload.error || 'Não foi possível completar a solicitação.');
  return payload;
}

function markDirty() {
  isDirty = true;
  saveStatus.textContent = 'Alterações não publicadas';
  saveStatus.classList.add('is-dirty');
}

function askForConfirmation(message, action) {
  document.getElementById('confirm-message').textContent = message;
  document.getElementById('confirm-panel').hidden = false;
  pendingConfirmation = action;
  document.getElementById('accept-confirm').focus();
}

function closeConfirmation() {
  document.getElementById('confirm-panel').hidden = true;
  pendingConfirmation = undefined;
}

function renderPageList() {
  pageList.innerHTML = content.pages.map((page, index) => `
    <button class="page-nav-item ${page.slug === activeSlug ? 'is-active' : ''}" type="button" data-select-page="${escapeHtml(page.slug)}">
      <span class="page-nav-index">${String(index).padStart(2, '0')}</span>
      <span class="page-nav-title">${escapeHtml(page.title || 'Página sem título')}</span>
    </button>`).join('') || '<p class="no-pages">Nenhuma página disponível.</p>';
}

function imageControl(id, value, label = 'IMAGEM') {
  const safeValue = escapeHtml(value);
  return `<div class="admin-field image-control">
    <label class="field-label" for="${id}">${label}</label>
    <div class="image-control-row"><input class="admin-input" id="${id}" data-image-path value="${safeValue}" placeholder="/assets/imagem.jpg"><input type="file" accept="image/jpeg,image/png,image/webp" data-image-upload="${id}" aria-label="Enviar ${label.toLowerCase()}"></div>
    <div class="image-preview" id="preview-${id}">${value ? `<img src="${safeValue}" alt="Prévia da imagem">` : ''}<span>${safeValue || 'Nenhuma imagem selecionada'}</span></div>
  </div>`;
}

function renderSiteSettings() {
  document.getElementById('site-settings').innerHTML = `
    <label class="admin-field"><span class="field-label">NOME DO SITE</span><input class="admin-input" data-site-field="name" maxlength="100" value="${escapeHtml(content.site.name)}"></label>
    ${imageControl('site-logo', content.site.logo, 'LOGO DO SITE')}
    <label class="admin-field"><span class="field-label">TEXTO DO RODAPÉ</span><input class="admin-input" data-site-field="footerText" maxlength="240" value="${escapeHtml(content.site.footerText)}"></label>
    <label class="admin-field color-field"><span class="field-label">COR DE DESTAQUE</span><span><input type="color" data-site-field="accentColor" value="${escapeHtml(content.site.accentColor)}"><small>${escapeHtml(content.site.accentColor)}</small></span></label>
    <label class="admin-field color-field"><span class="field-label">FUNDO DO SITE</span><span><input type="color" data-site-field="backgroundColor" value="${escapeHtml(content.site.backgroundColor)}"><small>${escapeHtml(content.site.backgroundColor)}</small></span></label>`;
}

function renderPageEditor() {
  const page = getPage();
  if (!page) return;
  document.getElementById('selected-page-title').textContent = page.title || 'Página sem título';
  document.getElementById('selected-page-path').textContent = pageUrl(page.slug);
  pageFields.innerHTML = `
    <label class="admin-field"><span class="field-label">TÍTULO PRINCIPAL</span><input class="admin-input" data-page-field="title" maxlength="120" value="${escapeHtml(page.title)}"></label>
    <label class="admin-field"><span class="field-label">ETIQUETA / SUBTÍTULO</span><input class="admin-input" data-page-field="kicker" maxlength="100" value="${escapeHtml(page.kicker)}"></label>
    <label class="admin-field field-wide"><span class="field-label">DESCRIÇÃO</span><textarea class="admin-textarea" data-page-field="description" maxlength="1500">${escapeHtml(page.description)}</textarea></label>
    <div class="field-wide">${imageControl('page-hero-image', page.heroImage, 'IMAGEM DE CAPA')}</div>
    <label class="admin-field field-wide"><span class="field-label">DESCRIÇÃO DA CAPA (ACESSIBILIDADE)</span><input class="admin-input" data-page-field="heroAlt" maxlength="240" value="${escapeHtml(page.heroAlt)}"></label>
    <label class="checkbox-field field-wide"><input type="checkbox" data-page-field="showInNav" ${page.showInNav ? 'checked' : ''}> Mostrar esta página no menu público</label>`;

  sectionsEditor.innerHTML = page.sections.length ? page.sections.map((section, sectionIndex) => `
    <article class="section-card" data-section-index="${sectionIndex}">
      <div class="section-card-top"><strong class="section-card-title">SEÇÃO ${String(sectionIndex + 1).padStart(2, '0')}</strong>
        <div class="section-card-actions"><button class="mini-button" type="button" data-move-section="up" aria-label="Mover seção para cima">↑</button><button class="mini-button" type="button" data-move-section="down" aria-label="Mover seção para baixo">↓</button><button class="mini-button is-danger" type="button" data-remove-section aria-label="Excluir seção">EXCLUIR</button></div>
      </div>
      <div class="section-form-grid">
        <label class="admin-field field-wide"><span class="field-label">TÍTULO DA SEÇÃO</span><input class="admin-input" data-section-field="heading" maxlength="120" value="${escapeHtml(section.heading)}" placeholder="Ex.: Conheça o universo"></label>
        <label class="admin-field field-wide"><span class="field-label">TEXTO</span><textarea class="admin-textarea" data-section-field="body" maxlength="5000" placeholder="Escreva o conteúdo desta seção">${escapeHtml(section.body)}</textarea><small class="field-help">Quebras de linha são preservadas no site.</small></label>
        <label class="checkbox-field field-wide"><input type="checkbox" data-section-field="expandable" ${section.expandable ? 'checked' : ''}> Exibir este texto em um botão “ver mais”</label>
        ${imageControl(`section-${sectionIndex}-image`, section.image, 'IMAGEM DA SEÇÃO')}
        <label class="admin-field"><span class="field-label">DESCRIÇÃO DA IMAGEM</span><input class="admin-input" data-section-field="imageAlt" maxlength="240" value="${escapeHtml(section.imageAlt)}"></label>
      </div>
      <div class="items-heading"><span>CARDS / NOTÍCIAS / PERSONAGENS (${section.items.length})</span><button class="mini-button" type="button" data-add-item>＋ ADICIONAR</button></div>
      <div class="items-list">${section.items.map((item, itemIndex) => `
        <div class="item-card" data-item-index="${itemIndex}">
          <div class="item-card-top"><strong class="item-card-title">${escapeHtml(item.meta || item.title || `Card ${itemIndex + 1}`)}</strong><button class="mini-button is-danger" type="button" data-remove-item>REMOVER</button></div>
          <div class="item-form-grid">
            <label class="admin-field"><span class="field-label">ETIQUETA</span><input class="admin-input" data-item-field="meta" maxlength="100" value="${escapeHtml(item.meta)}" placeholder="Categoria / número"></label>
            <label class="admin-field"><span class="field-label">TÍTULO</span><input class="admin-input" data-item-field="title" maxlength="120" value="${escapeHtml(item.title)}"></label>
            <label class="admin-field"><span class="field-label">LINK (OPCIONAL)</span><input class="admin-input" data-item-field="href" maxlength="220" value="${escapeHtml(item.href)}" placeholder="/historia"></label>
            <label class="admin-field field-full"><span class="field-label">TEXTO</span><textarea class="admin-textarea" data-item-field="text" maxlength="1500">${escapeHtml(item.text)}</textarea></label>
            <div class="field-full">${imageControl(`section-${sectionIndex}-item-${itemIndex}-image`, item.image, 'IMAGEM DO CARD')}</div>
            <label class="admin-field field-full"><span class="field-label">DESCRIÇÃO DA IMAGEM</span><input class="admin-input" data-item-field="imageAlt" maxlength="240" value="${escapeHtml(item.imageAlt)}"></label>
          </div>
        </div>`).join('')}</div>
    </article>`).join('') : '<div class="empty-sections">Esta página ainda não tem seções. Use “Adicionar seção” para começar a montar o conteúdo.</div>';
  renderPageList();
}

function captureEditor() {
  if (!content) return;
  content.site.name = document.querySelector('[data-site-field="name"]')?.value || content.site.name;
  content.site.footerText = document.querySelector('[data-site-field="footerText"]')?.value || '';
  content.site.logo = document.getElementById('site-logo')?.value || '';
  content.site.accentColor = document.querySelector('[data-site-field="accentColor"]')?.value || '#35c5e8';
  content.site.backgroundColor = document.querySelector('[data-site-field="backgroundColor"]')?.value || '#071522';
  const page = getPage();
  if (!page) return;
  document.querySelectorAll('[data-page-field]').forEach((field) => {
    page[field.dataset.pageField] = field.type === 'checkbox' ? field.checked : field.value;
  });
  page.heroImage = document.getElementById('page-hero-image')?.value || '';
  page.sections = [...sectionsEditor.querySelectorAll('.section-card')].map((sectionCard) => {
    const value = (field) => sectionCard.querySelector(`[data-section-field="${field}"]`)?.value || '';
    return {
      heading: value('heading'),
      body: value('body'),
      image: sectionCard.querySelector('[data-image-path][id$="-image"]')?.value || '',
      imageAlt: value('imageAlt'),
      expandable: sectionCard.querySelector('[data-section-field="expandable"]')?.checked || false,
      items: [...sectionCard.querySelectorAll('.item-card')].map((itemCard) => {
        const itemValue = (field) => itemCard.querySelector(`[data-item-field="${field}"]`)?.value || '';
        const imagePath = itemCard.querySelector('[data-image-path]')?.value || '';
        return { meta: itemValue('meta'), title: itemValue('title'), text: itemValue('text'), image: imagePath, imageAlt: itemValue('imageAlt'), href: itemValue('href') };
      })
    };
  });
}

function emptyItem() { return { meta: '', title: '', text: '', image: '', imageAlt: '', href: '' }; }
function emptySection() { return { heading: '', body: '', image: '', imageAlt: '', items: [] }; }

async function uploadImage(file, targetId) {
  if (!file) return;
  if (file.size > 5 * 1024 * 1024) throw new Error('A imagem deve ter no máximo 5 MB.');
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) throw new Error('Escolha uma imagem JPG, PNG ou WebP.');
  const dataUrl = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Não foi possível ler o arquivo.'));
    reader.readAsDataURL(file);
  });
  const result = await api('/admin/api/upload', { method: 'POST', body: JSON.stringify({ dataUrl }) });
  captureEditor();
  const target = document.getElementById(targetId);
  if (target) {
    target.value = result.path;
    const preview = document.getElementById(`preview-${targetId}`);
    if (preview) preview.innerHTML = `<img src="${escapeHtml(result.path)}" alt="Prévia da imagem"><span>${escapeHtml(result.path)}</span>`;
    markDirty();
  }
}

async function initialize() {
  try {
    const result = await api('/admin/api/content');
    content = result.content;
    csrfToken = result.csrfToken;
    activeSlug = content.pages[0]?.slug;
    renderSiteSettings();
    renderPageEditor();
  } catch (error) {
    showAlert(error.message, true);
  }
}

document.addEventListener('input', (event) => {
  if (event.target.closest('.editor-main')) markDirty();
  if (event.target.matches('[data-image-path]')) {
    const preview = document.getElementById(`preview-${event.target.id}`);
    if (preview) {
      const imagePath = escapeHtml(event.target.value.trim());
      preview.innerHTML = `${imagePath ? `<img src="${imagePath}" alt="Prévia da imagem">` : ''}<span>${imagePath || 'Nenhuma imagem selecionada'}</span>`;
    }
  }
  if (event.target.matches('[data-site-field$="Color"]')) {
    const label = event.target.parentElement.querySelector('small');
    if (label) label.textContent = event.target.value;
  }
});
document.addEventListener('change', async (event) => {
  const uploadInput = event.target.closest('[data-image-upload]');
  if (!uploadInput) return;
  try {
    await uploadImage(uploadInput.files[0], uploadInput.dataset.imageUpload);
    showAlert('Imagem enviada. Publique as alterações para atualizar o site.');
  } catch (error) {
    showAlert(error.message, true);
  } finally {
    uploadInput.value = '';
  }
});

pageList.addEventListener('click', (event) => {
  const button = event.target.closest('[data-select-page]');
  if (!button || button.dataset.selectPage === activeSlug) return;
  captureEditor();
  activeSlug = button.dataset.selectPage;
  renderPageEditor();
  document.getElementById('selected-page-title').scrollIntoView({ behavior: 'smooth', block: 'center' });
});

document.getElementById('add-page').addEventListener('click', () => {
  const form = document.getElementById('create-page-form');
  form.hidden = false;
  document.getElementById('new-page-title').focus();
});

document.getElementById('cancel-create-page').addEventListener('click', () => {
  document.getElementById('create-page-form').hidden = true;
});

document.getElementById('create-page-form').addEventListener('submit', (event) => {
  event.preventDefault();
  const title = document.getElementById('new-page-title').value.trim();
  if (!title) return;
  const slug = title.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 50);
  if (!slug || content.pages.some((page) => page.slug === slug)) {
    showAlert('Este nome gera um endereço inválido ou já usado. Escolha outro nome.', true);
    return;
  }
  captureEditor();
  const page = { slug, title: title.trim(), kicker: 'NOVA PÁGINA', description: '', heroImage: '/assets/hero-blue.jpg', heroAlt: '', showInNav: true, sections: [] };
  content.pages.push(page);
  activeSlug = slug;
  document.getElementById('create-page-form').hidden = true;
  document.getElementById('new-page-title').value = '';
  renderPageEditor();
  markDirty();
});

document.getElementById('add-section').addEventListener('click', () => {
  captureEditor();
  getPage().sections.push(emptySection());
  renderPageEditor();
  markDirty();
});

sectionsEditor.addEventListener('click', (event) => {
  const sectionCard = event.target.closest('.section-card');
  if (!sectionCard) return;
  captureEditor();
  const sectionIndex = Number(sectionCard.dataset.sectionIndex);
  const page = getPage();
  if (event.target.closest('[data-add-item]')) page.sections[sectionIndex].items.push(emptyItem());
  else if (event.target.closest('[data-remove-section]')) page.sections.splice(sectionIndex, 1);
  else if (event.target.closest('[data-remove-item]')) page.sections[sectionIndex].items.splice(Number(event.target.closest('.item-card').dataset.itemIndex), 1);
  else if (event.target.closest('[data-move-section="up"]') && sectionIndex > 0) [page.sections[sectionIndex - 1], page.sections[sectionIndex]] = [page.sections[sectionIndex], page.sections[sectionIndex - 1]];
  else if (event.target.closest('[data-move-section="down"]') && sectionIndex < page.sections.length - 1) [page.sections[sectionIndex + 1], page.sections[sectionIndex]] = [page.sections[sectionIndex], page.sections[sectionIndex + 1]];
  else return;
  renderPageEditor();
  markDirty();
});

document.getElementById('save-button').addEventListener('click', async (event) => {
  captureEditor();
  const button = event.currentTarget;
  button.disabled = true;
  saveStatus.textContent = 'Publicando…';
  try {
    const result = await api('/admin/api/content', { method: 'PUT', body: JSON.stringify(content) });
    content = result.content;
    isDirty = false;
    saveStatus.textContent = 'Publicado';
    saveStatus.classList.remove('is-dirty');
    renderSiteSettings();
    renderPageEditor();
    showAlert('Alterações publicadas. O site já está atualizado.');
  } catch (error) {
    saveStatus.textContent = 'Não publicado';
    showAlert(error.message, true);
  } finally {
    button.disabled = false;
  }
});

document.getElementById('delete-page').addEventListener('click', () => {
  const page = getPage();
  if (!page || ['inicio', 'historia', 'mapa', 'personagens', 'temporada', 'noticias'].includes(page.slug)) {
    showAlert('As páginas principais do portal não podem ser excluídas.', true);
    return;
  }
  askForConfirmation(`Excluir “${page.title}”? Esta mudança só será publicada ao clicar em Publicar alterações.`, () => {
    content.pages = content.pages.filter((item) => item.slug !== page.slug);
    activeSlug = content.pages[0].slug;
    renderPageEditor();
    markDirty();
  });
});

document.getElementById('export-button').addEventListener('click', () => {
  captureEditor();
  const file = new Blob([JSON.stringify(content, null, 2)], { type: 'application/json' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(file);
  link.download = `new-heroes-backup-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  URL.revokeObjectURL(link.href);
});

document.getElementById('cancel-confirm').addEventListener('click', closeConfirmation);
document.getElementById('accept-confirm').addEventListener('click', () => {
  const action = pendingConfirmation;
  closeConfirmation();
  action?.();
});

document.getElementById('logout-button').addEventListener('click', () => {
  if (isDirty) {
    askForConfirmation('Há alterações não publicadas. Sair mesmo assim?', logout);
    return;
  }
  logout();
});

async function logout() {
  try {
    captureEditor();
    await api('/admin/api/logout', { method: 'POST', body: '{}' });
    window.location.replace('/admin');
  } catch (error) {
    showAlert(error.message, true);
  }
}

window.addEventListener('beforeunload', (event) => {
  if (!isDirty) return;
  event.preventDefault();
  event.returnValue = '';
});

initialize();
