// ==========================================
// MY TRAVEL — Reservations Page
// ==========================================

import storage from '../services/storage.js';
import { icon } from '../utils/icons.js';
import { router } from '../router.js';
import { modal } from '../components/Modal.js';
import { toast } from '../components/Toast.js';
import { formatDateTime, escapeHtml } from '../utils/helpers.js';
import { RESERVATION_TYPES, RESERVATION_STATUS } from '../utils/constants.js';

let activeTab = 'all';

export function renderReservations(container, tripId = null) {
  const target = container || document.getElementById('content-area');
  if (!target) return;

  const isGlobal = !tripId;
  const allReservations = tripId ? storage.getReservationsByTrip(tripId) : storage.getReservations();
  const reservations = activeTab === 'all' ? allReservations : allReservations.filter(r => r.type === activeTab);

  target.innerHTML = `
    <div class="animate-fade-in-up">
      ${isGlobal ? `
        <div class="page-header">
          <div>
            <h1>Reservas</h1>
            <p class="page-header-subtitle">${allReservations.length} reserva${allReservations.length !== 1 ? 's' : ''}</p>
          </div>
          <button class="btn btn-primary" id="btn-add-res">${icon('plus', 18)} Nova Reserva</button>
        </div>
      ` : `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:var(--space-4)">
          <h3 style="font-size:var(--font-md);font-weight:var(--fw-semibold)">Reservas</h3>
          <button class="btn btn-primary btn-sm" id="btn-add-res">${icon('plus', 16)} Nova Reserva</button>
        </div>
      `}

      <div class="filter-bar mb-6">
        <button class="filter-chip ${activeTab === 'all' ? 'active' : ''}" data-tab="all">Todas</button>
        ${RESERVATION_TYPES.map(t => `
          <button class="filter-chip ${activeTab === t.id ? 'active' : ''}" data-tab="${t.id}">${t.icon} ${t.label}</button>
        `).join('')}
      </div>

      ${reservations.length > 0 ? `
        <div class="grid-cards stagger-children">
          ${reservations.map(res => {
            const typeInfo = RESERVATION_TYPES.find(t => t.id === res.type) || RESERVATION_TYPES[0];
            const statusInfo = RESERVATION_STATUS.find(s => s.id === res.status) || RESERVATION_STATUS[0];
            const tripName = isGlobal ? storage.getTrip(res.tripId)?.name : null;
            return `
              <div class="reservation-card animate-fade-in-up">
                <div class="reservation-card-header">
                  <div class="reservation-type-icon ${res.type}">${typeInfo.icon}</div>
                  <div style="display:flex;gap:var(--space-2);align-items:center">
                    <span class="badge badge-${res.status}">${statusInfo.label}</span>
                    <div class="dropdown">
                      <button class="btn btn-ghost btn-icon btn-sm res-menu-btn">${icon('moreVertical', 16)}</button>
                      <div class="dropdown-menu">
                        <button class="dropdown-item edit-res-btn" data-id="${res.id}">${icon('edit', 14)} Editar</button>
                        <div class="dropdown-divider"></div>
                        <button class="dropdown-item danger del-res-btn" data-id="${res.id}">${icon('trash', 14)} Excluir</button>
                      </div>
                    </div>
                  </div>
                </div>
                <div class="reservation-card-title">${escapeHtml(res.title)}</div>
                ${tripName ? `<div class="reservation-card-detail">${icon('trips', 14)} ${escapeHtml(tripName)}</div>` : ''}
                <div class="reservation-card-detail">${icon('calendar', 14)} ${formatDateTime(res.startDate)}</div>
                ${res.endDate ? `<div class="reservation-card-detail">${icon('clock', 14)} até ${formatDateTime(res.endDate)}</div>` : ''}
                ${res.location ? `<div class="reservation-card-detail">${icon('mapPin', 14)} ${escapeHtml(res.location)}</div>` : ''}
                ${res.confirmationCode ? `
                  <div class="reservation-code">
                    ${icon('copy', 12)} ${escapeHtml(res.confirmationCode)}
                  </div>
                ` : ''}
              </div>
            `;
          }).join('')}
        </div>
      ` : `
        <div class="empty-state">
          <div class="empty-state-icon">🏨</div>
          <h3 class="empty-state-title">Nenhuma reserva</h3>
          <p class="empty-state-text">Adicione seus voos, hotéis e transportes.</p>
          <button class="btn btn-primary btn-sm" id="btn-add-res-empty">${icon('plus', 16)} Adicionar Reserva</button>
        </div>
      `}
    </div>
  `;

  // Events
  const addHandler = () => _openResModal(target, tripId);
  target.querySelector('#btn-add-res')?.addEventListener('click', addHandler);
  target.querySelector('#btn-add-res-empty')?.addEventListener('click', addHandler);

  target.querySelectorAll('.filter-chip[data-tab]').forEach(el => {
    el.addEventListener('click', () => { activeTab = el.dataset.tab; renderReservations(target, tripId); });
  });

  target.querySelectorAll('.res-menu-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const menu = btn.nextElementSibling;
      target.querySelectorAll('.dropdown-menu').forEach(m => { if (m !== menu) m.classList.remove('active'); });
      menu.classList.toggle('active');
    });
  });

  target.querySelectorAll('.edit-res-btn').forEach(el => {
    el.addEventListener('click', () => {
      const res = storage.getReservation(el.dataset.id);
      if (res) _openResModal(target, tripId, res);
    });
  });

  target.querySelectorAll('.del-res-btn').forEach(el => {
    el.addEventListener('click', async () => {
      const confirmed = await modal.confirm({ title: 'Excluir reserva?', message: 'Esta ação não pode ser desfeita.', confirmText: 'Excluir', danger: true });
      if (confirmed) { storage.deleteReservation(el.dataset.id); toast.success('Reserva excluída'); renderReservations(target, tripId); }
    });
  });

  // Copy confirmation codes
  target.querySelectorAll('.reservation-code').forEach(el => {
    el.style.cursor = 'pointer';
    el.addEventListener('click', () => {
      navigator.clipboard?.writeText(el.textContent.trim());
      toast.info('Código copiado!');
    });
  });

  document.addEventListener('click', () => {
    target.querySelectorAll('.dropdown-menu').forEach(m => m.classList.remove('active'));
  }, { once: true });
}

function _openResModal(container, tripId, reservation = null) {
  const isEdit = !!reservation;
  const trips = storage.getTrips();

  const content = `
    ${!tripId ? `
      <div class="form-group">
        <label class="form-label">Viagem *</label>
        <select class="form-select" id="res-trip">
          <option value="">Selecione</option>
          ${trips.map(t => `<option value="${t.id}" ${reservation?.tripId === t.id ? 'selected' : ''}>${escapeHtml(t.name)}</option>`).join('')}
        </select>
      </div>
    ` : ''}
    <div class="form-group">
      <label class="form-label">Título *</label>
      <input type="text" class="form-input" id="res-title" placeholder="Ex: Voo para Paris" value="${reservation ? escapeHtml(reservation.title) : ''}" />
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Tipo</label>
        <select class="form-select" id="res-type">
          ${RESERVATION_TYPES.map(t => `<option value="${t.id}" ${reservation?.type === t.id ? 'selected' : ''}>${t.icon} ${t.label}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Status</label>
        <select class="form-select" id="res-status">
          ${RESERVATION_STATUS.map(s => `<option value="${s.id}" ${reservation?.status === s.id ? 'selected' : ''}>${s.label}</option>`).join('')}
        </select>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Data/Hora Início</label>
        <input type="datetime-local" class="form-input" id="res-start" value="${reservation?.startDate || ''}" />
      </div>
      <div class="form-group">
        <label class="form-label">Data/Hora Fim</label>
        <input type="datetime-local" class="form-input" id="res-end" value="${reservation?.endDate || ''}" />
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">Local</label>
      <input type="text" class="form-input" id="res-location" placeholder="Ex: GRU → CDG" value="${reservation ? escapeHtml(reservation.location || '') : ''}" />
    </div>
    <div class="form-group">
      <label class="form-label">Código da Reserva</label>
      <input type="text" class="form-input" id="res-code" placeholder="Ex: ABC123" value="${reservation ? escapeHtml(reservation.confirmationCode || '') : ''}" />
    </div>
    <div class="form-group">
      <label class="form-label">Notas</label>
      <textarea class="form-textarea" id="res-notes" placeholder="Observações...">${reservation ? escapeHtml(reservation.notes || '') : ''}</textarea>
    </div>
  `;

  const footer = `
    <button class="btn btn-secondary" id="res-cancel">Cancelar</button>
    <button class="btn btn-primary" id="res-save">${isEdit ? 'Salvar' : 'Adicionar'}</button>
  `;

  modal.open({ title: isEdit ? 'Editar Reserva' : 'Nova Reserva', content, footer });

  document.getElementById('res-cancel')?.addEventListener('click', () => modal.close());
  document.getElementById('res-save')?.addEventListener('click', () => {
    const selectedTrip = tripId || document.getElementById('res-trip')?.value;
    const title = document.getElementById('res-title')?.value?.trim();
    if (!selectedTrip) { toast.warning('Selecione a viagem'); return; }
    if (!title) { toast.warning('Informe o título'); return; }

    const data = {
      tripId: selectedTrip, title,
      type: document.getElementById('res-type')?.value || 'flight',
      status: document.getElementById('res-status')?.value || 'confirmed',
      startDate: document.getElementById('res-start')?.value || '',
      endDate: document.getElementById('res-end')?.value || '',
      location: document.getElementById('res-location')?.value?.trim() || '',
      confirmationCode: document.getElementById('res-code')?.value?.trim() || '',
      notes: document.getElementById('res-notes')?.value?.trim() || ''
    };

    if (isEdit) { storage.updateReservation(reservation.id, data); toast.success('Reserva atualizada'); }
    else { storage.createReservation(data); toast.success('Reserva adicionada'); }
    modal.close();
    renderReservations(container, tripId);
  });
}
