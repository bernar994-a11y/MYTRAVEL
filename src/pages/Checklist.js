// ==========================================
// MY TRAVEL — Checklist Page
// ==========================================

import storage from '../services/storage.js';
import { icon } from '../utils/icons.js';
import { modal } from '../components/Modal.js';
import { toast } from '../components/Toast.js';
import { escapeHtml, groupBy } from '../utils/helpers.js';
import { DEFAULT_CHECKLIST } from '../utils/constants.js';

export function renderChecklist(container, tripId = null) {
  const target = container || document.getElementById('content-area');
  if (!target) return;

  const isGlobal = !tripId;
  const trips = storage.getTrips();

  if (isGlobal) {
    target.innerHTML = `
      <div class="animate-fade-in-up">
        <div class="page-header">
          <div>
            <h1>Checklist</h1>
            <p class="page-header-subtitle">Organize o que levar em cada viagem</p>
          </div>
        </div>
        ${trips.length > 0 ? `
          <div class="grid-cards">
            ${trips.map(t => {
              const items = storage.getChecklistByTrip(t.id);
              const checked = items.filter(i => i.checked).length;
              const total = items.length;
              const percent = total > 0 ? Math.round((checked / total) * 100) : 0;
              return `
                <div class="card" style="cursor:pointer" data-trip="${t.id}">
                  <h3 style="font-size:var(--font-md);font-weight:var(--fw-semibold);margin-bottom:var(--space-2)">${escapeHtml(t.name)}</h3>
                  <p style="font-size:var(--font-sm);color:var(--text-secondary);margin-bottom:var(--space-3)">${checked}/${total} itens</p>
                  <div class="progress-bar"><div class="progress-bar-fill" style="width:${percent}%"></div></div>
                  <span style="font-size:var(--font-xs);color:var(--text-tertiary);margin-top:var(--space-1);display:block">${percent}% concluído</span>
                </div>
              `;
            }).join('')}
          </div>
        ` : `
          <div class="empty-state">
            <div class="empty-state-icon">✅</div>
            <h3 class="empty-state-title">Nenhuma viagem criada</h3>
            <p class="empty-state-text">Crie uma viagem primeiro para usar o checklist.</p>
          </div>
        `}
      </div>
    `;

    target.querySelectorAll('[data-trip]').forEach(el => {
      el.addEventListener('click', () => {
        location.hash = `/trip/${el.dataset.trip}`;
      });
    });
    return;
  }

  // Trip-specific checklist
  const items = storage.getChecklistByTrip(tripId);
  const grouped = groupBy(items, 'category');
  const allCategories = DEFAULT_CHECKLIST.map(c => c.category);
  const checked = items.filter(i => i.checked).length;
  const total = items.length;
  const percent = total > 0 ? Math.round((checked / total) * 100) : 0;

  target.innerHTML = `
    <div class="animate-fade-in-up">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:var(--space-4);flex-wrap:wrap;gap:var(--space-3)">
        <div>
          <h3 style="font-size:var(--font-md);font-weight:var(--fw-semibold)">Checklist de Viagem</h3>
          <p style="font-size:var(--font-sm);color:var(--text-secondary)">${checked}/${total} itens concluídos (${percent}%)</p>
        </div>
        <div style="display:flex;gap:var(--space-2)">
          ${items.length === 0 ? `
            <button class="btn btn-secondary btn-sm" id="btn-load-template">${icon('checklist', 14)} Carregar Template</button>
          ` : ''}
          <button class="btn btn-primary btn-sm" id="btn-add-item">${icon('plus', 14)} Novo Item</button>
        </div>
      </div>

      <!-- Progress -->
      <div style="margin-bottom:var(--space-6)">
        <div class="progress-bar" style="height:8px">
          <div class="progress-bar-fill" style="width:${percent}%"></div>
        </div>
      </div>

      ${items.length > 0 ? `
        ${DEFAULT_CHECKLIST.map(cat => {
          const catItems = grouped[cat.category] || [];
          if (catItems.length === 0) return '';
          const catChecked = catItems.filter(i => i.checked).length;
          return `
            <div class="checklist-category">
              <div class="checklist-category-header">
                <span class="checklist-category-title">${cat.label}</span>
                <span class="checklist-progress-text">${catChecked}/${catItems.length}</span>
              </div>
              <div class="checklist-items">
                ${catItems.map(item => `
                  <div class="checklist-item ${item.checked ? 'checked' : ''}" data-id="${item.id}">
                    <div class="checkbox-custom">
                      ${item.checked ? icon('check', 14) : ''}
                    </div>
                    <span class="checklist-text">${escapeHtml(item.text)}</span>
                    <button class="btn btn-ghost btn-icon btn-sm remove-btn" data-id="${item.id}" title="Remover">
                      ${icon('close', 12)}
                    </button>
                  </div>
                `).join('')}
              </div>
            </div>
          `;
        }).join('')}
        ${grouped['custom'] ? `
          <div class="checklist-category">
            <div class="checklist-category-header">
              <span class="checklist-category-title">🎯 Personalizados</span>
              <span class="checklist-progress-text">${(grouped['custom'] || []).filter(i => i.checked).length}/${(grouped['custom'] || []).length}</span>
            </div>
            <div class="checklist-items">
              ${(grouped['custom'] || []).map(item => `
                <div class="checklist-item ${item.checked ? 'checked' : ''}" data-id="${item.id}">
                  <div class="checkbox-custom">
                    ${item.checked ? icon('check', 14) : ''}
                  </div>
                  <span class="checklist-text">${escapeHtml(item.text)}</span>
                  <button class="btn btn-ghost btn-icon btn-sm remove-btn" data-id="${item.id}" title="Remover">
                    ${icon('close', 12)}
                  </button>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}
      ` : `
        <div class="empty-state">
          <div class="empty-state-icon">✅</div>
          <h3 class="empty-state-title">Checklist vazio</h3>
          <p class="empty-state-text">Carregue o template padrão ou adicione itens manualmente.</p>
        </div>
      `}
    </div>
  `;

  // Events
  target.querySelector('#btn-load-template')?.addEventListener('click', () => {
    DEFAULT_CHECKLIST.forEach(cat => {
      cat.items.forEach((text, i) => {
        storage.createChecklistItem({
          tripId, category: cat.category, text, checked: false, order: i
        });
      });
    });
    toast.success('Template carregado!');
    renderChecklist(target, tripId);
  });

  target.querySelector('#btn-add-item')?.addEventListener('click', () => {
    _openAddItemModal(target, tripId);
  });

  // Toggle check
  target.querySelectorAll('.checklist-item[data-id]').forEach(el => {
    el.addEventListener('click', (e) => {
      if (e.target.closest('.remove-btn')) return;
      storage.toggleChecklistItem(el.dataset.id);
      renderChecklist(target, tripId);
    });
  });

  // Remove
  target.querySelectorAll('.remove-btn[data-id]').forEach(el => {
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      storage.deleteChecklistItem(el.dataset.id);
      renderChecklist(target, tripId);
    });
  });
}

function _openAddItemModal(container, tripId) {
  const content = `
    <div class="form-group">
      <label class="form-label">Item *</label>
      <input type="text" class="form-input" id="checklist-text" placeholder="Ex: Protetor solar" />
    </div>
    <div class="form-group">
      <label class="form-label">Categoria</label>
      <select class="form-select" id="checklist-cat">
        ${DEFAULT_CHECKLIST.map(c => `<option value="${c.category}">${c.label}</option>`).join('')}
        <option value="custom">🎯 Personalizado</option>
      </select>
    </div>
  `;
  const footer = `
    <button class="btn btn-secondary" id="cl-cancel">Cancelar</button>
    <button class="btn btn-primary" id="cl-save">Adicionar</button>
  `;

  modal.open({ title: 'Novo Item', content, footer, size: 'sm' });

  document.getElementById('cl-cancel')?.addEventListener('click', () => modal.close());
  document.getElementById('cl-save')?.addEventListener('click', () => {
    const text = document.getElementById('checklist-text')?.value?.trim();
    if (!text) { toast.warning('Informe o item'); return; }
    const category = document.getElementById('checklist-cat')?.value || 'custom';
    storage.createChecklistItem({ tripId, category, text, checked: false, order: 999 });
    toast.success('Item adicionado');
    modal.close();
    renderChecklist(container, tripId);
  });
}
