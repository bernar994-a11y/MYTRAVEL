// ==========================================
// MY TRAVEL — Documents Page
// ==========================================

import storage from '../services/storage.js';
import { icon } from '../utils/icons.js';
import { modal } from '../components/Modal.js';
import { toast } from '../components/Toast.js';
import { formatDate, formatFileSize, escapeHtml } from '../utils/helpers.js';
import { DOCUMENT_TYPES } from '../utils/constants.js';

export function renderDocuments() {
  const content = document.getElementById('content-area');
  if (!content) return;

  const documents = storage.getDocuments();
  const trips = storage.getTrips();

  content.innerHTML = `
    <div class="animate-fade-in-up">
      <div class="page-header">
        <div>
          <h1>Documentos</h1>
          <p class="page-header-subtitle">${documents.length} documento${documents.length !== 1 ? 's' : ''}</p>
        </div>
        <button class="btn btn-primary" id="btn-add-doc">${icon('upload', 18)} Upload</button>
      </div>

      ${documents.length > 0 ? `
        <div class="grid-cards stagger-children">
          ${documents.map(doc => {
            const typeInfo = DOCUMENT_TYPES.find(t => t.id === doc.type) || DOCUMENT_TYPES[4];
            const tripName = doc.tripId ? storage.getTrip(doc.tripId)?.name : 'Geral';
            return `
              <div class="document-card animate-fade-in-up" data-id="${doc.id}">
                <div style="display:flex;justify-content:space-between;align-items:flex-start">
                  <div class="document-card-icon">${typeInfo.icon}</div>
                  <div style="display:flex;gap:var(--space-1)">
                    ${doc.encrypted ? `<span class="document-encrypted" title="Criptografado">${icon('lock', 14)}</span>` : ''}
                    <div class="dropdown">
                      <button class="btn btn-ghost btn-icon btn-sm doc-menu-btn">${icon('moreVertical', 14)}</button>
                      <div class="dropdown-menu">
                        <button class="dropdown-item view-doc-btn" data-id="${doc.id}">${icon('eye', 14)} Visualizar</button>
                        <button class="dropdown-item download-doc-btn" data-id="${doc.id}">${icon('download', 14)} Baixar</button>
                        <div class="dropdown-divider"></div>
                        <button class="dropdown-item danger del-doc-btn" data-id="${doc.id}">${icon('trash', 14)} Excluir</button>
                      </div>
                    </div>
                  </div>
                </div>
                <div class="document-card-name">${escapeHtml(doc.name)}</div>
                <div class="document-card-meta">
                  <span>${typeInfo.label}</span>
                  <span>•</span>
                  <span>${tripName || 'Geral'}</span>
                  <span>•</span>
                  <span>${formatDate(doc.createdAt?.split('T')[0])}</span>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      ` : `
        <div class="empty-state">
          <div class="empty-state-icon">📎</div>
          <h3 class="empty-state-title">Nenhum documento</h3>
          <p class="empty-state-text">Faça upload de passaportes, vistos, tickets e outros documentos.</p>
          <button class="btn btn-primary btn-sm" id="btn-add-doc-empty">${icon('upload', 16)} Upload</button>
        </div>
      `}
    </div>
  `;

  // Events
  const uploadHandler = () => _openUploadModal(trips);
  content.querySelector('#btn-add-doc')?.addEventListener('click', uploadHandler);
  content.querySelector('#btn-add-doc-empty')?.addEventListener('click', uploadHandler);

  // Dropdown menus
  content.querySelectorAll('.doc-menu-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const menu = btn.nextElementSibling;
      content.querySelectorAll('.dropdown-menu').forEach(m => { if (m !== menu) m.classList.remove('active'); });
      menu.classList.toggle('active');
    });
  });

  document.addEventListener('click', () => {
    content.querySelectorAll('.dropdown-menu').forEach(m => m.classList.remove('active'));
  }, { once: true });

  // View document
  content.querySelectorAll('.view-doc-btn').forEach(el => {
    el.addEventListener('click', () => _viewDocument(el.dataset.id));
  });

  // Download document
  content.querySelectorAll('.download-doc-btn').forEach(el => {
    el.addEventListener('click', () => _downloadDocument(el.dataset.id));
  });

  // Delete document
  content.querySelectorAll('.del-doc-btn').forEach(el => {
    el.addEventListener('click', async () => {
      const confirmed = await modal.confirm({ title: 'Excluir documento?', message: 'Esta ação não pode ser desfeita.', confirmText: 'Excluir', danger: true });
      if (confirmed) {
        storage.deleteDocument(el.dataset.id);
        toast.success('Documento excluído');
        renderDocuments();
      }
    });
  });
}

function _openUploadModal(trips) {
  const content = `
    <div class="form-group">
      <label class="form-label">Nome do Documento *</label>
      <input type="text" class="form-input" id="doc-name" placeholder="Ex: Passaporte" />
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Tipo</label>
        <select class="form-select" id="doc-type">
          ${DOCUMENT_TYPES.map(t => `<option value="${t.id}">${t.icon} ${t.label}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Viagem</label>
        <select class="form-select" id="doc-trip">
          <option value="">Geral</option>
          ${trips.map(t => `<option value="${t.id}">${escapeHtml(t.name)}</option>`).join('')}
        </select>
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">Arquivo *</label>
      <div class="upload-zone" id="upload-zone">
        <div style="color:var(--text-tertiary);margin-bottom:var(--space-2)">${icon('upload', 32)}</div>
        <p style="color:var(--text-secondary);font-size:var(--font-sm)">Clique ou arraste um arquivo</p>
        <p style="color:var(--text-tertiary);font-size:var(--font-xs)">Imagens, PDFs (máx. 5MB)</p>
        <input type="file" id="doc-file" accept="image/*,.pdf" style="display:none" />
      </div>
      <div id="file-preview" style="display:none;margin-top:var(--space-2)"></div>
    </div>
  `;

  const footer = `
    <button class="btn btn-secondary" id="doc-cancel">Cancelar</button>
    <button class="btn btn-primary" id="doc-save">Salvar</button>
  `;

  modal.open({ title: 'Upload de Documento', content, footer });

  let fileData = null;
  let fileType = null;

  const zone = document.getElementById('upload-zone');
  const fileInput = document.getElementById('doc-file');
  const preview = document.getElementById('file-preview');

  zone?.addEventListener('click', () => fileInput?.click());
  zone?.addEventListener('dragover', (e) => { e.preventDefault(); zone.classList.add('drag-over'); });
  zone?.addEventListener('dragleave', () => zone.classList.remove('drag-over'));
  zone?.addEventListener('drop', (e) => {
    e.preventDefault();
    zone.classList.remove('drag-over');
    if (e.dataTransfer.files.length) _handleFile(e.dataTransfer.files[0]);
  });

  fileInput?.addEventListener('change', (e) => {
    if (e.target.files.length) _handleFile(e.target.files[0]);
  });

  function _handleFile(file) {
    if (file.size > 5 * 1024 * 1024) {
      toast.warning('Arquivo muito grande (máx 5MB)');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      fileData = e.target.result;
      fileType = file.type;
      zone.style.display = 'none';
      preview.style.display = 'block';
      if (file.type.startsWith('image/')) {
        preview.innerHTML = `<img src="${fileData}" style="max-height:120px;border-radius:var(--radius-md)" /><p style="font-size:var(--font-xs);color:var(--text-secondary);margin-top:var(--space-1)">${file.name} (${formatFileSize(file.size)})</p>`;
      } else {
        preview.innerHTML = `<div style="padding:var(--space-3);background:var(--bg-tertiary);border-radius:var(--radius-md);display:flex;align-items:center;gap:var(--space-2)">${icon('documents', 18)} <span>${file.name} (${formatFileSize(file.size)})</span></div>`;
      }
      // Auto-fill name
      const nameInput = document.getElementById('doc-name');
      if (nameInput && !nameInput.value) {
        nameInput.value = file.name.replace(/\.[^/.]+$/, '');
      }
    };
    reader.readAsDataURL(file);
  }

  document.getElementById('doc-cancel')?.addEventListener('click', () => modal.close());
  document.getElementById('doc-save')?.addEventListener('click', () => {
    const name = document.getElementById('doc-name')?.value?.trim();
    if (!name) { toast.warning('Informe o nome'); return; }
    if (!fileData) { toast.warning('Selecione um arquivo'); return; }

    storage.createDocument({
      name,
      type: document.getElementById('doc-type')?.value || 'other',
      tripId: document.getElementById('doc-trip')?.value || null,
      fileData,
      fileType,
      encrypted: false
    });

    toast.success('Documento salvo!');
    modal.close();
    renderDocuments();
  });
}

function _viewDocument(id) {
  const doc = storage.getDocument(id);
  if (!doc) return;

  let preview = '';
  if (doc.fileType?.startsWith('image/')) {
    preview = `<img src="${doc.fileData}" class="document-preview" />`;
  } else if (doc.fileType === 'application/pdf') {
    preview = `<iframe src="${doc.fileData}" style="width:100%;height:500px;border:none;border-radius:var(--radius-lg)"></iframe>`;
  } else {
    preview = `<p style="text-align:center;color:var(--text-secondary)">Visualização não disponível para este tipo de arquivo.</p>`;
  }

  modal.open({
    title: doc.name,
    content: preview,
    size: 'lg'
  });
}

function _downloadDocument(id) {
  const doc = storage.getDocument(id);
  if (!doc || !doc.fileData) return;

  const a = document.createElement('a');
  a.href = doc.fileData;
  a.download = doc.name;
  a.click();
  toast.success('Download iniciado');
}
