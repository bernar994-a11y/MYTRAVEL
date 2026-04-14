// ==========================================
// MY TRAVEL — Flights Page (Group/Individual)
// ==========================================

import dataService from '../services/dataService.js';
import { icon } from '../utils/icons.js';
import { modal } from '../components/Modal.js';
import { toast } from '../components/Toast.js';
import { formatDate, escapeHtml } from '../utils/helpers.js';

let subscription = null;

export async function renderFlights(container, tripId) {
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
      <p style="margin-top: var(--space-4); color: var(--text-secondary); font-size: 14px;">Carregando voos...</p>
    </div>
  `;

  await _refreshList(container, tripId);
}

async function _refreshList(container, tripId) {
  const flights = await dataService.getFlights(tripId);

  container.innerHTML = `
    <div class="animate-fade-in-up">
      <div class="page-header" style="margin-top:0">
        <div>
          <h3 style="font-size:var(--font-lg); color:var(--text-primary)">✈️ Voos do Grupo</h3>
          <p style="font-size:var(--font-sm); color:var(--text-tertiary)">Cada participante pode registrar seus próprios voos aqui.</p>
        </div>
        <button class="btn btn-primary btn-sm" id="btn-add-flight">
          ${icon('plus', 16)} Adicionar Voo
        </button>
      </div>

      ${flights.length > 0 ? `
        <div class="grid-cards" style="grid-template-columns: repeat(auto-fill, minmax(300px, 1fr))">
          ${flights.map(flight => `
            <div class="flight-card" style="background:var(--bg-secondary); border:1px solid var(--border-color); border-radius:var(--radius-lg); padding:var(--space-4); position:relative">
              <div class="flight-creator" style="display:flex; align-items:center; gap:var(--space-2); margin-bottom:var(--space-3); border-bottom:1px solid var(--border-dim); padding-bottom:var(--space-2)">
                <img src="${flight.user?.avatar_url || 'https://ui-avatars.com/api/?name=?'}" style="width:20px; height:20px; border-radius:50%">
                <span style="font-size:11px; font-weight:600; color:var(--text-secondary)">${escapeHtml(flight.user?.full_name || 'Participante')}</span>
              </div>
              
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:var(--space-2)">
                <div style="font-weight:bold; font-size:var(--font-base)">${flight.airline || 'Cia Aérea'}</div>
                <div class="badge badge-planning" style="font-size:10px">${flight.flight_number || 'Nº Voo'}</div>
              </div>

              <div style="display:flex; justify-content:space-between; align-items:center; background:var(--bg-primary); padding:var(--space-3); border-radius:var(--radius-md); margin-bottom:var(--space-3)">
                <div style="text-align:center">
                  <div style="font-size:var(--font-lg); font-weight:800">${flight.departure_airport || '---'}</div>
                  <div style="font-size:10px; color:var(--text-tertiary)">${flight.departure_time ? new Date(flight.departure_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '--:--'}</div>
                </div>
                <div style="flex:1; display:flex; flex-direction:column; align-items:center; padding:0 var(--space-2)">
                  <div style="width:100%; height:1px; background:var(--border-color); position:relative">
                    <div style="position:absolute; right:0; top:-7px; color:var(--primary-400)">${icon('plane', 14)}</div>
                  </div>
                </div>
                <div style="text-align:center">
                  <div style="font-size:var(--font-lg); font-weight:800">${flight.arrival_airport || '---'}</div>
                  <div style="font-size:10px; color:var(--text-tertiary)">${flight.arrival_time ? new Date(flight.arrival_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '--:--'}</div>
                </div>
              </div>

              <div style="font-size:11px; color:var(--text-secondary); display:flex; align-items:center; gap:var(--space-2)">
                ${icon('calendar', 12)} ${formatDate(flight.departure_time)}
              </div>
              
              ${flight.notes ? `<div style="margin-top:var(--space-2); font-size:11px; color:var(--text-tertiary); font-style:italic">"${escapeHtml(flight.notes)}"</div>` : ''}
            </div>
          `).join('')}
        </div>
      ` : `
        <div class="empty-state" style="padding:var(--space-12)">
          <div style="font-size:32px; margin-bottom:var(--space-4)">✈️</div>
          <h3 class="empty-state-title">Nenhum voo registrado</h3>
          <p class="empty-state-text">Clique em "Adicionar Voo" para informar seus dados de viagem ao grupo.</p>
        </div>
      `}
    </div>
  `;

  // Events
  container.querySelector('#btn-add-flight')?.addEventListener('click', () => _openFlightModal(container, tripId));
}

function _openFlightModal(container, tripId) {
  const content = `
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Cia Aérea</label>
        <input type="text" class="form-input" id="fl-airline" placeholder="Ex: LATAM" />
      </div>
      <div class="form-group">
        <label class="form-label">Nº do Voo</label>
        <input type="text" class="form-input" id="fl-number" placeholder="Ex: LA8100" />
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Origem (IATA)</label>
        <input type="text" class="form-input" id="fl-dep-air" placeholder="Ex: GRU" maxlength="3" />
      </div>
      <div class="form-group">
        <label class="form-label">Destino (IATA)</label>
        <input type="text" class="form-input" id="fl-arr-air" placeholder="Ex: CDG" maxlength="3" />
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Partida (Data/Hora)</label>
        <input type="datetime-local" class="form-input" id="fl-dep-time" />
      </div>
      <div class="form-group">
        <label class="form-label">Chegada (Data/Hora)</label>
        <input type="datetime-local" class="form-input" id="fl-arr-time" />
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">Notas</label>
      <textarea class="form-textarea" id="fl-notes" placeholder="Ex: Portão, assento..."></textarea>
    </div>
  `;

  const footer = `
    <button class="btn btn-secondary" id="fl-cancel">Cancelar</button>
    <button class="btn btn-primary" id="fl-save">Salvar Voo</button>
  `;

  modal.open({ title: 'Registrar Voo', content, footer });

  document.getElementById('fl-cancel')?.addEventListener('click', () => modal.close());
  document.getElementById('fl-save')?.addEventListener('click', async () => {
    const flightData = {
      trip_id: tripId,
      airline: document.getElementById('fl-airline').value,
      flight_number: document.getElementById('fl-number').value,
      departure_airport: document.getElementById('fl-dep-air').value?.toUpperCase(),
      arrival_airport: document.getElementById('fl-arr-air').value?.toUpperCase(),
      departure_time: document.getElementById('fl-dep-time').value,
      arrival_time: document.getElementById('fl-arr-time').value,
      notes: document.getElementById('fl-notes').value
    };

    if (!flightData.departure_airport || !flightData.arrival_airport) {
      toast.warning('Informe origem e destino');
      return;
    }

    try {
      await dataService.createFlight(flightData);
      toast.success('Voo registrado!');
      modal.close();
      renderFlights(container, tripId);
    } catch (err) {
      toast.error('Erro ao salvar voo');
    }
  });
}
