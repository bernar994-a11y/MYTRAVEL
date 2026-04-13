// ==========================================
// MY TRAVEL — Reminders Page
// ==========================================

import storage from '../services/storage.js';
import { icon } from '../utils/icons.js';
import { modal } from '../components/Modal.js';
import { toast } from '../components/Toast.js';
import { formatDateTime, escapeHtml, daysUntil } from '../utils/helpers.js';
import { REMINDER_TYPES } from '../utils/constants.js';
import { notifications } from '../services/notifications.js';

export function renderReminders() {
  const content = document.getElementById('content-area');
  if (!content) return;

  const reminders = storage.getReminders().sort((a, b) => new Date(a.datetime) - new Date(b.datetime));
  const trips = storage.getTrips();
  const now = new Date();

  const upcoming = reminders.filter(r => !r.dismissed && new Date(r.datetime) > now);
  const overdue = reminders.filter(r => !r.dismissed && new Date(r.datetime) <= now);
  const dismissed = reminders.filter(r => r.dismissed);

  content.innerHTML = `
    <div class="animate-fade-in-up">
      <div class="page-header">
        <div>
          <h1>Lembretes</h1>
          <p class="page-header-subtitle">${upcoming.length} pendente${upcoming.length !== 1 ? 's' : ''}</p>
        </div>
        <div style="display:flex;gap:var(--space-2)">
          <button class="btn btn-secondary btn-sm" id="btn-enable-notif">
            ${icon('reminders', 16)} ${notifications.isGranted() ? 'Notificações ativas' : 'Ativar notificações'}
          </button>
          <button class="btn btn-primary" id="btn-add-reminder">${icon('plus', 18)} Novo Lembrete</button>
        </div>
      </div>

      ${overdue.length > 0 ? `
        <div class="mb-6">
          <h3 style="font-size:var(--font-base);font-weight:var(--fw-semibold);color:var(--danger-400);margin-bottom:var(--space-3)">⚠️ Atrasados (${overdue.length})</h3>
          <div style="display:flex;flex-direction:column;gap:var(--space-3)">
            ${overdue.map(r => _renderReminderCard(r, trips, true)).join('')}
          </div>
        </div>
      ` : ''}

      ${upcoming.length > 0 ? `
        <div class="mb-6">
          <h3 style="font-size:var(--font-base);font-weight:var(--fw-semibold);margin-bottom:var(--space-3)">📅 Próximos (${upcoming.length})</h3>
          <div style="display:flex;flex-direction:column;gap:var(--space-3)" class="stagger-children">
            ${upcoming.map(r => _renderReminderCard(r, trips, false)).join('')}
          </div>
        </div>
      ` : ''}

      ${overdue.length === 0 && upcoming.length === 0 ? `
        <div class="empty-state">
          <div class="empty-state-icon">🔔</div>
          <h3 class="empty-state-title">Nenhum lembrete</h3>
          <p class="empty-state-text">Crie lembretes para check-in, pagamentos e mais.</p>
          <button class="btn btn-primary btn-sm" id="btn-add-reminder-empty">${icon('plus', 16)} Criar Lembrete</button>
        </div>
      ` : ''}

      ${dismissed.length > 0 ? `
        <details style="margin-top:var(--space-6)">
          <summary style="cursor:pointer;color:var(--text-tertiary);font-size:var(--font-sm)">Lembretes dispensados (${dismissed.length})</summary>
          <div style="display:flex;flex-direction:column;gap:var(--space-3);margin-top:var(--space-3);opacity:0.6">
            ${dismissed.map(r => _renderReminderCard(r, trips, false)).join('')}
          </div>
        </details>
      ` : ''}
    </div>
  `;

  // Events
  const addHandler = () => _openReminderModal(trips);
  content.querySelector('#btn-add-reminder')?.addEventListener('click', addHandler);
  content.querySelector('#btn-add-reminder-empty')?.addEventListener('click', addHandler);

  content.querySelector('#btn-enable-notif')?.addEventListener('click', async () => {
    const granted = await notifications.requestPermission();
    if (granted) toast.success('Notificações ativadas!');
    else toast.warning('Permissão de notificação negada');
    renderReminders();
  });

  // Dismiss
  content.querySelectorAll('.dismiss-rem-btn').forEach(el => {
    el.addEventListener('click', () => {
      storage.updateReminder(el.dataset.id, { dismissed: true });
      toast.info('Lembrete dispensado');
      renderReminders();
    });
  });

  // Delete
  content.querySelectorAll('.del-rem-btn').forEach(el => {
    el.addEventListener('click', async () => {
      const confirmed = await modal.confirm({ title: 'Excluir lembrete?', message: 'Esta ação não pode ser desfeita.', confirmText: 'Excluir', danger: true });
      if (confirmed) {
        storage.deleteReminder(el.dataset.id);
        toast.success('Lembrete excluído');
        renderReminders();
      }
    });
  });
}

function _renderReminderCard(r, trips, isOverdue) {
  const typeInfo = REMINDER_TYPES.find(t => t.id === r.type) || REMINDER_TYPES[3];
  const tripName = r.tripId ? trips.find(t => t.id === r.tripId)?.name : null;

  return `
    <div class="reminder-card ${isOverdue ? 'overdue' : ''} animate-fade-in-up">
      <div class="reminder-icon-box ${r.type}">${typeInfo.icon}</div>
      <div class="reminder-info">
        <h4>${escapeHtml(r.title)}</h4>
        <div class="reminder-datetime">${icon('clock', 14)} ${formatDateTime(r.datetime)}</div>
        ${tripName ? `<div class="reminder-trip">${icon('trips', 12)} ${escapeHtml(tripName)}</div>` : ''}
      </div>
      <div style="display:flex;gap:var(--space-1)">
        ${!r.dismissed ? `
          <button class="btn btn-ghost btn-icon btn-sm dismiss-rem-btn" data-id="${r.id}" title="Dispensar">
            ${icon('check', 16)}
          </button>
        ` : ''}
        <button class="btn btn-ghost btn-icon btn-sm del-rem-btn" data-id="${r.id}" title="Excluir">
          ${icon('trash', 16)}
        </button>
      </div>
    </div>
  `;
}

function _openReminderModal(trips) {
  const content = `
    <div class="form-group">
      <label class="form-label">Título *</label>
      <input type="text" class="form-input" id="rem-title" placeholder="Ex: Check-in do voo" />
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Data e Hora *</label>
        <input type="datetime-local" class="form-input" id="rem-datetime" />
      </div>
      <div class="form-group">
        <label class="form-label">Tipo</label>
        <select class="form-select" id="rem-type">
          ${REMINDER_TYPES.map(t => `<option value="${t.id}">${t.icon} ${t.label}</option>`).join('')}
        </select>
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">Viagem</label>
      <select class="form-select" id="rem-trip">
        <option value="">Nenhuma</option>
        ${trips.map(t => `<option value="${t.id}">${escapeHtml(t.name)}</option>`).join('')}
      </select>
    </div>
  `;

  const footer = `
    <button class="btn btn-secondary" id="rem-cancel">Cancelar</button>
    <button class="btn btn-primary" id="rem-save">Criar</button>
  `;

  modal.open({ title: 'Novo Lembrete', content, footer, size: 'md' });

  document.getElementById('rem-cancel')?.addEventListener('click', () => modal.close());
  document.getElementById('rem-save')?.addEventListener('click', () => {
    const title = document.getElementById('rem-title')?.value?.trim();
    const datetime = document.getElementById('rem-datetime')?.value;
    if (!title) { toast.warning('Informe o título'); return; }
    if (!datetime) { toast.warning('Informe a data/hora'); return; }

    storage.createReminder({
      title,
      datetime,
      type: document.getElementById('rem-type')?.value || 'custom',
      tripId: document.getElementById('rem-trip')?.value || null,
      triggered: false,
      dismissed: false
    });

    toast.success('Lembrete criado!');
    modal.close();
    renderReminders();
  });
}
