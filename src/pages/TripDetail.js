import storage from '../services/storage.js';
import dataService from '../services/dataService.js';
import { icon } from '../utils/icons.js';
import { router } from '../router.js';
import { modal } from '../components/Modal.js';
import { toast } from '../components/Toast.js';
import { formatDate, formatCurrency, getTripStatus, daysBetween, escapeHtml, sumBy } from '../utils/helpers.js';
import { TRIP_STATUS_LABELS, TRIP_STATUS_CLASSES } from '../utils/constants.js';
import { renderItinerary } from './Itinerary.js';
import { renderFinances } from './Finances.js';
import { renderReservations } from './Reservations.js';
import { renderChecklist } from './Checklist.js';
import { renderFlights } from './Flights.js';

let currentTab = 'itinerary';

export async function renderTripDetail(params) {
  const content = document.getElementById('content-area');
  if (!content) return;

  const tripId = params.id;
  
  content.innerHTML = `
    <div class="animate-fade-in" style="padding: var(--space-20) 0; text-align: center;">
      <div class="spinner" style="margin: 0 auto;"></div>
      <p style="margin-top: var(--space-4); color: var(--text-secondary);">Carregando detalhes da viagem...</p>
    </div>
  `;

  const trip = await dataService.getTrip(tripId);

  if (!trip) {
    content.innerHTML = `<div class="empty-state"><h3 class="empty-state-title">Viagem não encontrada</h3><button class="btn btn-primary" onclick="location.hash='/trips'">Voltar</button></div>`;
    return;
  }

  const status = getTripStatus(trip.start_date, trip.end_date);
  const totalDays = daysBetween(trip.start_date, trip.end_date) + 1;
  const spent = storage.getTotalExpensesByTrip(tripId); // Will be migrated to dataService later
  const budget = Number(trip.budget) || 0;
  const remaining = budget - spent;
  const currency = trip.currency || 'BRL';

  content.innerHTML = `
    <div class="animate-fade-in-up">
      <div class="trip-detail-header">
        <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:var(--space-4)">
          <div>
            <button class="trip-detail-back" id="trip-back">
              ${icon('chevronLeft', 16)} Voltar para viagens
            </button>
            <div class="trip-detail-title">${escapeHtml(trip.name)}</div>
            <div class="trip-detail-destination">
              ${icon('mapPin', 16)} ${escapeHtml(trip.destination) || 'Sem destino'}
              <span class="badge ${TRIP_STATUS_CLASSES[status]}" style="margin-left:var(--space-2)">${TRIP_STATUS_LABELS[status]}</span>
            </div>
          </div>
          
          <div style="display:flex; gap:var(--space-2)">
            <button class="btn btn-secondary btn-sm" id="btn-share-trip">
              ${icon('users', 14)} Convidar amigos
            </button>
            <div class="participant-avatars-list" style="display:flex; -webkit-mask-image: linear-gradient(to right, black 80%, transparent 100%)">
              ${trip.participants?.map(p => `
                <img src="${p.profile?.avatar_url || `https://ui-avatars.com/api/?name=${p.profile?.full_name || 'V'}`}" 
                     class="participant-avatar" 
                     title="${escapeHtml(p.profile?.full_name)} (${p.role})"
                     style="width:32px; height:32px; border-radius:50%; border:2px solid var(--bg-primary); margin-left:-8px">
              `).join('')}
            </div>
          </div>
        </div>

        <div class="trip-detail-stats">
          <div class="trip-detail-stat">
            <span class="trip-detail-stat-label">Período</span>
            <span class="trip-detail-stat-value">${formatDate(trip.start_date)} — ${formatDate(trip.end_date)}</span>
          </div>
          <div class="trip-detail-stat">
            <span class="trip-detail-stat-label">Duração</span>
            <span class="trip-detail-stat-value">${totalDays} dia${totalDays !== 1 ? 's' : ''}</span>
          </div>
          <div class="trip-detail-stat">
            <span class="trip-detail-stat-label">Orçamento</span>
            <span class="trip-detail-stat-value">${formatCurrency(budget, currency)}</span>
          </div>
        </div>
      </div>

      <!-- Tabs -->
      <div class="tabs" id="trip-tabs">
        <button class="tab ${currentTab === 'itinerary' ? 'active' : ''}" data-tab="itinerary">
          📋 Roteiro
        </button>
        <button class="tab ${currentTab === 'flights' ? 'active' : ''}" data-tab="flights">
          ✈️ Voos
        </button>
        <button class="tab ${currentTab === 'finances' ? 'active' : ''}" data-tab="finances">
          💰 Finanças
        </button>
        <button class="tab ${currentTab === 'reservations' ? 'active' : ''}" data-tab="reservations">
          🏨 Reservas
        </button>
        <button class="tab ${currentTab === 'checklist' ? 'active' : ''}" data-tab="checklist">
          ✅ Checklist
        </button>
      </div>

      <div id="trip-tab-content"></div>
    </div>
  `;

  // Events
  document.getElementById('trip-back')?.addEventListener('click', () => router.navigate('/trips'));
  
  document.getElementById('btn-share-trip')?.addEventListener('click', () => {
    const shareLink = `${window.location.origin}/#/trips?join=${trip.share_token}`;
    
    modal.open({
      title: 'Convidar Amigos',
      content: `
        <div class="form-group">
          <label class="form-label">Link de Convite</label>
          <div style="display:flex; gap:var(--space-2)">
            <input type="text" class="form-input" value="${shareLink}" readonly id="share-link-input" />
            <button class="btn btn-primary" id="btn-copy-link">Copiar</button>
          </div>
          <p style="font-size:12px; color:var(--text-tertiary); margin-top:var(--space-2)">
            Qualquer pessoa com este link poderá visualizar e editar o roteiro e voos desta viagem.
          </p>
        </div>
      `,
      footer: `<button class="btn btn-secondary" onclick="document.querySelector('.modal-overlay').classList.remove('active')">Fechar</button>`
    });

    document.getElementById('btn-copy-link')?.addEventListener('click', () => {
      const input = document.getElementById('share-link-input');
      input.select();
      document.execCommand('copy');
      toast.success('Link copiado!');
    });
  });

  document.querySelectorAll('#trip-tabs .tab').forEach(el => {
    el.addEventListener('click', () => {
      currentTab = el.dataset.tab;
      document.querySelectorAll('#trip-tabs .tab').forEach(t => t.classList.remove('active'));
      el.classList.add('active');
      _renderTab(tripId, trip);
    });
  });

  _renderTab(tripId, trip);
}

function _renderTab(tripId, trip) {
  const container = document.getElementById('trip-tab-content');
  if (!container) return;

  switch (currentTab) {
    case 'itinerary':
      renderItinerary(container, tripId);
      break;
    case 'flights':
      renderFlights(container, tripId);
      break;
    case 'finances':
      renderFinances(container, tripId);
      break;
    case 'reservations':
      renderReservations(container, tripId);
      break;
    case 'checklist':
      renderChecklist(container, tripId);
      break;
  }
}
