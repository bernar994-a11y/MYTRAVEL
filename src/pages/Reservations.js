import dataService from '../services/dataService.js';
import { icon } from '../utils/icons.js';
import { router } from '../router.js';
import { modal } from '../components/Modal.js';
import { toast } from '../components/Toast.js';
import { formatDate, escapeHtml } from '../utils/helpers.js';
import { RESERVATION_TYPES, RESERVATION_STATUS } from '../utils/constants.js';

let activeTab = 'all';
let subscription = null;

export async function renderReservations(container, tripId) {
  if (!container) return;

  // Realtime subscription
  if (subscription) subscription.unsubscribe();
  subscription = dataService.subscribeToTripChanges(tripId, () => {
    _refreshList(container, tripId);
  });

  // Loading State inicial
  container.innerHTML = `
    <div class="animate-fade-in" style="padding: var(--space-20) 0; text-align: center;">
      <div class="spinner" style="margin: 0 auto; width: 32px; height: 32px; border: 3px solid var(--border-primary); border-top-color: var(--primary-500); border-radius: 50%; animation: spin 1s linear infinite;"></div>
      <p style="margin-top: var(--space-4); color: var(--text-secondary); font-size: 14px;">Carregando reservas...</p>
    </div>
  `;

  await _refreshList(container, tripId);
}

async function _refreshList(container, tripId) {
  const allReservations = await dataService.getReservations(tripId);
  const reservations = activeTab === 'all' ? allReservations : allReservations.filter(r => r.type === activeTab);

  container.innerHTML = `
    <div class="animate-fade-in-up">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:var(--space-4);margin-top:var(--space-4)">
        <h3 style="font-size:var(--font-md);font-weight:var(--fw-semibold)">🏨 Reservas e Estadias</h3>
        <button class="btn btn-primary btn-sm" id="btn-add-res">${icon('plus', 16)} Nova Reserva</button>
      </div>

      <div class="filter-bar mb-6">
        <button class="filter-chip ${activeTab === 'all' ? 'active' : ''}" data-tab="all">Todas</button>
        ${RESERVATION_TYPES.map(t => `
          <button class="filter-chip ${activeTab === t.id ? 'active' : ''}" data-tab="${t.id}">${t.icon} ${t.label}</button>
        `).join('')}
      </div>

      ${reservations.length > 0 ? `
        <div class="grid-cards" style="grid-template-columns: repeat(auto-fill, minmax(300px, 1fr))">
          ${reservations.map(res => {
            const typeInfo = RESERVATION_TYPES.find(t => t.id === res.type) || RESERVATION_TYPES[0];
            return `
              <div class="reservation-card" style="background:var(--bg-secondary); border:1px solid var(--border-color); border-radius:var(--radius-lg); padding:var(--space-4); position:relative">
                <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:var(--space-2)">
                  <div style="font-size:24px">${typeInfo.icon}</div>
                  <button class="btn btn-ghost btn-icon btn-sm delete-res-btn" data-id="${res.id}">
                    ${icon('trash', 14)}
                  </button>
                </div>
                <div style="font-weight:bold; font-size:var(--font-base); margin-bottom:var(--space-2)">${escapeHtml(res.title)}</div>
                
                <div style="font-size:11px; color:var(--text-secondary); display:flex; align-items:center; gap:var(--space-2); margin-bottom:4px">
                  ${icon('calendar', 12)} ${formatDate(res.start_date)}
                </div>
                
                ${res.location ? `
                  <div style="font-size:11px; color:var(--text-secondary); display:flex; align-items:center; gap:var(--space-2); margin-bottom:var(--space-3)">
                    ${icon('mapPin', 12)} ${escapeHtml(res.location)}
                  </div>
                ` : ''}

                ${res.confirmation_code ? `
                  <div class="reservation-code" style="background:var(--bg-primary); padding:var(--space-2) var(--space-3); border-radius:var(--radius-md); font-family:monospace; font-size:12px; display:flex; justify-content:space-between; align-items:center; color:var(--primary-400)">
                    ${escapeHtml(res.confirmation_code)}
                    ${icon('copy', 12)}
                  </div>
                ` : ''}
              </div>
            `;
          }).join('')}
        </div>
      ` : `
        <div class="empty-state" style="padding:var(--space-12)">
          <div style="font-size:32px; margin-bottom:var(--space-4)">🏨</div>
          <h3 class="empty-state-title">Nenhuma reserva</h3>
          <p class="empty-state-text">Mantenha seus hotéis, aluguéis e transportes organizados aqui.</p>
        </div>
      `}
    </div>
  `;

  // Events
  container.querySelector('#btn-add-res')?.addEventListener('click', () => _openResModal(container, tripId));

  container.querySelectorAll('.filter-chip[data-tab]').forEach(el => {
    el.addEventListener('click', () => {
      activeTab = el.dataset.tab;
      _refreshList(container, tripId);
    });
  });

  container.querySelectorAll('.delete-res-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const confirmed = await modal.confirm({ title: 'Excluir reserva?', message: 'Esta ação não pode ser desfeita.', confirmText: 'Excluir', danger: true });
      if (confirmed) {
        try {
          await dataService.deleteReservation(btn.dataset.id);
          toast.success('Reserva excluída');
          _refreshList(container, tripId);
        } catch (err) {
          toast.error('Erro ao excluir');
        }
      }
    });
  });

  // Copy code
  container.querySelectorAll('.reservation-code').forEach(el => {
    el.addEventListener('click', () => {
      const code = el.textContent.trim();
      navigator.clipboard.writeText(code);
      toast.success('Código copiado!');
    });
  });
}

function _openResModal(container, tripId) {
  const content = `
    <div class="form-group">
      <label class="form-label">Título da Reserva *</label>
      <input type="text" class="form-input" id="res-title" placeholder="Ex: Hotel Hilton" />
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Tipo</label>
        <select class="form-select" id="res-type">
          ${RESERVATION_TYPES.map(t => `<option value="${t.id}">${t.icon} ${t.label}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Código</label>
        <input type="text" class="form-input" id="res-code" placeholder="Confirmação" />
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Data Início</label>
        <input type="date" class="form-input" id="res-start" />
      </div>
      <div class="form-group">
        <label class="form-label">Data Fim (Opcional)</label>
        <input type="date" class="form-input" id="res-end" />
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">Local / Endereço</label>
      <input type="text" class="form-input" id="res-location" placeholder="Endereço ou Google Maps link" />
    </div>
    <div class="form-group">
      <label class="form-label">Notas</label>
      <textarea class="form-textarea" id="res-notes" placeholder="Informações extras..."></textarea>
    </div>
  `;

  const footer = `
    <button class="btn btn-secondary" id="res-cancel">Cancelar</button>
    <button class="btn btn-primary" id="res-save">Adicionar Reserva</button>
  `;

  modal.open({ title: 'Nova Reserva', content, footer });

  document.getElementById('res-cancel')?.addEventListener('click', () => modal.close());
  document.getElementById('res-save')?.addEventListener('click', async () => {
    const data = {
      trip_id: tripId,
      title: document.getElementById('res-title').value,
      type: document.getElementById('res-type').value,
      confirmation_code: document.getElementById('res-code').value,
      start_date: document.getElementById('res-start').value,
      end_date: document.getElementById('res-end').value,
      location: document.getElementById('res-location').value,
      notes: document.getElementById('res-notes').value
    };

    if (!data.title || !data.start_date) {
      toast.warning('Informe título e data de início');
      return;
    }

    try {
      await dataService.createReservation(data);
      toast.success('Reserva adicionada!');
      modal.close();
      _refreshList(container, tripId);
    } catch (err) {
      toast.error('Erro ao salvar reserva');
    }
  });
}
