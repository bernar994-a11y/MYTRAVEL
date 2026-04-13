import storage from '../services/storage.js';
import dataService from '../services/dataService.js';
import { icon } from '../utils/icons.js';
import { router } from '../router.js';
import { modal } from '../components/Modal.js';
import { toast } from '../components/Toast.js';
import { formatDate, formatCurrency, getTripStatus, daysUntil, escapeHtml } from '../utils/helpers.js';
import { CURRENCIES, TRIP_STATUS_LABELS, TRIP_STATUS_CLASSES } from '../utils/constants.js';

let currentFilter = 'all';

export async function renderTrips() {
  const content = document.getElementById('content-area');
  if (!content) return;

  // Check for invite token in URL
  const hash = window.location.hash;
  if (hash.includes('join=')) {
    const token = hash.split('join=')[1];
    if (token) {
      try {
        const tripId = await dataService.joinTripByToken(token);
        toast.success('Você entrou na viagem!');
        // Clean URL
        history.replaceState(null, null, '#/trips');
        router.navigate(`/trip/${tripId}`);
        return;
      } catch (err) {
        toast.error(err.message);
        history.replaceState(null, null, '#/trips');
      }
    }
  }

  content.innerHTML = `
    <div class="animate-fade-in" style="padding: var(--space-20) 0; text-align: center;">
      <div class="spinner" style="margin: 0 auto;"></div>
      <p style="margin-top: var(--space-4); color: var(--text-secondary);">Carregando suas viagens...</p>
    </div>
  `;

  const trips = await dataService.getTrips();
  const settings = storage.getSettings();
  const currency = settings.currency || 'BRL';

  // Filter trips
  const filtered = currentFilter === 'all' 
    ? trips 
    : trips.filter(t => getTripStatus(t.start_date, t.end_date) === currentFilter);

  content.innerHTML = `
    <div class="animate-fade-in-up">
      <div class="page-header">
        <div>
          <h1 class="page-title">Sua Viagens</h1>
          <p class="page-header-subtitle"><strong>${trips.length}</strong> ${trips.length === 1 ? 'viagem registrada' : 'viagens registradas'}</p>
        </div>
        <button class="btn btn-primary" id="btn-new-trip">
          ${icon('plus', 18)} Nova Viagem
        </button>
      </div>

      <div class="filter-bar mb-6">
        <button class="filter-chip ${currentFilter === 'all' ? 'active' : ''}" data-filter="all">Todas</button>
        <button class="filter-chip ${currentFilter === 'planning' ? 'active' : ''}" data-filter="planning">Planejando</button>
        <button class="filter-chip ${currentFilter === 'active' ? 'active' : ''}" data-filter="active">Em andamento</button>
        <button class="filter-chip ${currentFilter === 'completed' ? 'active' : ''}" data-filter="completed">Concluídas</button>
      </div>

      ${filtered.length > 0 ? `
        <div class="grid-cards stagger-children">
          ${filtered.map(trip => {
            const status = getTripStatus(trip.start_date, trip.end_date);
            // Budget/Spent from Supabase (to be implemented fully in Finances)
            const budget = Number(trip.budget) || 0;
            const days = daysUntil(trip.start_date);

            return `
              <div class="trip-card animate-fade-in-up" data-trip-id="${trip.id}">
                <div class="trip-card-cover">
                  <div class="trip-card-cover-placeholder">
                    ${_getDestinationEmoji(trip.destination)}
                  </div>
                  <div class="trip-card-status">
                    <span class="badge ${TRIP_STATUS_CLASSES[status]}">${TRIP_STATUS_LABELS[status]}</span>
                  </div>
                  ${trip.participants?.length > 1 ? `
                    <div class="trip-card-badges">
                      <span class="badge badge-active" style="display:flex; align-items:center; gap:4px">
                        ${icon('users', 10)} ${trip.participants.length}
                      </span>
                    </div>
                  ` : ''}
                </div>
                <div class="trip-card-body">
                  <div class="trip-card-destination">
                    ${icon('mapPin', 14)} ${escapeHtml(trip.destination) || 'Sem destino'}
                  </div>
                  <div class="trip-card-name">${escapeHtml(trip.name)}</div>
                  <div class="trip-card-dates">
                    ${icon('calendar', 14)} ${formatDate(trip.start_date)} — ${formatDate(trip.end_date)}
                    ${status === 'planning' && days > 0 ? `<span class="badge-planning" style="margin-left:auto; font-size:10px; padding:2px 8px; border-radius:10px">em ${days} dia${days !== 1 ? 's' : ''}</span>` : ''}
                  </div>
                </div>
                <div class="trip-card-footer">
                  <div class="trip-card-meta">
                    <div class="participant-avatars" style="display:flex; margin-left:4px">
                      <!-- Avatars could be loaded here -->
                    </div>
                  </div>
                  <div class="trip-card-actions">
                    <button class="btn btn-ghost btn-icon btn-sm edit-trip-btn" data-id="${trip.id}" title="Editar">
                      ${icon('edit', 14)}
                    </button>
                    <button class="btn btn-ghost btn-icon btn-sm delete-trip-btn" data-id="${trip.id}" title="Excluir">
                      ${icon('trash', 14)}
                    </button>
                  </div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      ` : `
        <div class="empty-state">
          <div class="empty-state-icon">✈️</div>
          <h3 class="empty-state-title">Nenhuma viagem encontrada</h3>
          <p class="empty-state-text">Comece criando sua primeira viagem colaborativa para organizar seu roteiro e compartilhar com amigos.</p>
          <button class="btn btn-primary" id="btn-new-trip-empty">${icon('plus', 18)} Criar Minha Primeira Viagem</button>
        </div>
      `}
    </div>
  `;

  // Events
  document.getElementById('btn-new-trip')?.addEventListener('click', () => _openTripModal());
  document.getElementById('btn-new-trip-empty')?.addEventListener('click', () => _openTripModal());

  document.querySelectorAll('.filter-chip[data-filter]').forEach(el => {
    el.addEventListener('click', () => {
      currentFilter = el.dataset.filter;
      renderTrips();
    });
  });

  document.querySelectorAll('.trip-card[data-trip-id]').forEach(el => {
    el.addEventListener('click', (e) => {
      if (e.target.closest('.edit-trip-btn') || e.target.closest('.delete-trip-btn')) return;
      router.navigate(`/trip/${el.dataset.tripId}`);
    });
  });

  document.querySelectorAll('.edit-trip-btn').forEach(el => {
    el.addEventListener('click', async (e) => {
      e.stopPropagation();
      const trip = await dataService.getTrip(el.dataset.id);
      if (trip) _openTripModal(trip);
    });
  });

  document.querySelectorAll('.delete-trip-btn').forEach(el => {
    el.addEventListener('click', async (e) => {
      e.stopPropagation();
      const confirmed = await modal.confirm({
        title: 'Excluir viagem?',
        message: 'Todos os dados desta viagem serão removidos permanentemente.',
        confirmText: 'Excluir',
        danger: true
      });
      if (confirmed) {
        toast.warning('Apenas o dono pode excluir a viagem principal.');
      }
    });
  });
}

function _openTripModal(trip = null) {
  const isEdit = !!trip;
  const settings = storage.getSettings();

  const content = `
    <div class="form-group">
      <label class="form-label">Nome da Viagem *</label>
      <input type="text" class="form-input" id="trip-name" placeholder="Ex: Férias em Paris" value="${trip ? escapeHtml(trip.name) : ''}" required />
    </div>
    <div class="form-group">
      <label class="form-label">Destino *</label>
      <input type="text" class="form-input" id="trip-destination" placeholder="Ex: Paris, França" value="${trip ? escapeHtml(trip.destination || '') : ''}" />
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Data de Ida *</label>
        <input type="date" class="form-input" id="trip-start" value="${trip ? trip.start_date : ''}" required />
      </div>
      <div class="form-group">
        <label class="form-label">Data de Volta *</label>
        <input type="date" class="form-input" id="trip-end" value="${trip ? trip.end_date : ''}" required />
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Orçamento</label>
        <input type="number" class="form-input" id="trip-budget" placeholder="0.00" step="0.01" min="0" value="${trip ? trip.budget || '' : ''}" />
      </div>
      <div class="form-group">
        <label class="form-label">Moeda</label>
        <select class="form-select" id="trip-currency">
          ${CURRENCIES.map(c => `<option value="${c.code}" ${(trip?.currency || settings.currency) === c.code ? 'selected' : ''}>${c.code} - ${c.name}</option>`).join('')}
        </select>
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">Notas</label>
      <textarea class="form-textarea" id="trip-notes" placeholder="Anotações sobre a viagem...">${trip ? escapeHtml(trip.notes || '') : ''}</textarea>
    </div>
  `;

  const footer = `
    <button class="btn btn-secondary" id="trip-modal-cancel">Cancelar</button>
    <button class="btn btn-primary" id="trip-modal-save">${isEdit ? 'Salvar' : 'Criar Viagem'}</button>
  `;

  modal.open({
    title: isEdit ? 'Editar Viagem' : 'Nova Viagem',
    content,
    footer,
    size: 'md'
  });

  document.getElementById('trip-modal-cancel')?.addEventListener('click', () => modal.close());
  document.getElementById('trip-modal-save')?.addEventListener('click', async () => {
    const name = document.getElementById('trip-name')?.value?.trim();
    const destination = document.getElementById('trip-destination')?.value?.trim();
    const start_date = document.getElementById('trip-start')?.value;
    const end_date = document.getElementById('trip-end')?.value;
    const budget = document.getElementById('trip-budget')?.value;
    const currency = document.getElementById('trip-currency')?.value;
    const notes = document.getElementById('trip-notes')?.value?.trim();

    if (!name) { toast.warning('Informe o nome da viagem'); return; }
    if (!start_date || !end_date) { toast.warning('Informe as datas'); return; }
    if (new Date(end_date) < new Date(start_date)) { toast.warning('A data de volta deve ser após a ida'); return; }

    const data = { name, destination, start_date, end_date, budget: Number(budget) || 0, currency, notes };

    try {
      if (isEdit) {
        // storage.updateTrip(trip.id, data); // Legacy logic
        toast.info('Para editar viagens compartilhadas, use as permissões de owner.');
      } else {
        await dataService.createTrip(data);
        toast.success('Viagem criada!');
      }
      modal.close();
      renderTrips();
    } catch (err) {
      toast.error('Erro ao salvar viagem');
    }
  });
}

function _getDestinationEmoji(destination) {
  if (!destination) return '✈️';
  const d = destination.toLowerCase();
  if (d.includes('paris') || d.includes('frança')) return '🗼';
  if (d.includes('tokyo') || d.includes('japão')) return '🗾';
  if (d.includes('new york') || d.includes('nova york')) return '🗽';
  if (d.includes('london') || d.includes('londres')) return '🎡';
  if (d.includes('roma') || d.includes('itália')) return '🏛️';
  if (d.includes('rio') || d.includes('praia') || d.includes('beach')) return '🏖️';
  if (d.includes('montanha') || d.includes('mountain') || d.includes('ski')) return '🏔️';
  if (d.includes('disney') || d.includes('orlando')) return '🏰';
  if (d.includes('argentina') || d.includes('buenos')) return '🇦🇷';
  if (d.includes('portugal') || d.includes('lisboa')) return '🇵🇹';
  return '✈️';
}
