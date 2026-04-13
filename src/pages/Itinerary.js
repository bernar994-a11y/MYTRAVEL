import storage from '../services/storage.js';
import dataService from '../services/dataService.js';
import { icon } from '../utils/icons.js';
import { modal } from '../components/Modal.js';
import { toast } from '../components/Toast.js';
import { getDateRange, formatDateLong, escapeHtml, addDaysToDate } from '../utils/helpers.js';
import { ACTIVITY_TYPES } from '../utils/constants.js';

let selectedDay = 1;
let subscription = null;

export async function renderItinerary(container, tripId) {
  const trip = await dataService.getTrip(tripId);
  if (!trip || !container) return;

  const dates = getDateRange(trip.start_date, trip.end_date);
  const totalDays = dates.length;
  if (selectedDay > totalDays) selectedDay = 1;

  // Realtime subscription
  if (subscription) subscription.unsubscribe();
  subscription = dataService.subscribeToTripChanges(tripId, () => {
    _refreshList(container, tripId, dates);
  });

  await _refreshList(container, tripId, dates);
}

async function _refreshList(container, tripId, dates) {
  const allActivities = await dataService.getActivities(tripId);
  const currentDate = dates[selectedDay - 1];
  const activities = allActivities.filter(a => a.date === currentDate);

  container.innerHTML = `
    <div class="animate-fade-in-up">
      <div class="itinerary-toolbar">
        <div class="day-tabs" id="day-tabs">
          ${dates.map((date, i) => `
            <button class="day-tab ${i + 1 === selectedDay ? 'active' : ''}" data-day="${i + 1}">
              <span class="day-label">Dia</span>
              <span class="day-number">${i + 1}</span>
              <span class="day-date">${new Date(date + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}</span>
            </button>
          `).join('')}
        </div>
        <button class="btn btn-primary btn-sm" id="btn-add-activity">
          ${icon('plus', 16)} Atividade
        </button>
      </div>

      <h3 style="font-size:var(--font-base);color:var(--text-secondary);margin-bottom:var(--space-4)">
        ${formatDateLong(currentDate)}
      </h3>

      ${activities.length > 0 ? `
        <div class="timeline" id="timeline-list">
          ${activities.map(act => {
            const typeInfo = ACTIVITY_TYPES.find(t => t.id === act.type) || ACTIVITY_TYPES[0];
            return `
              <div class="timeline-item" data-id="${act.id}">
                <div class="timeline-dot ${act.completed ? 'completed' : ''}"></div>
                <div class="timeline-card">
                  <div class="timeline-card-header">
                    <span class="timeline-card-time">
                      ${icon('clock', 14)} ${act.time ? act.time.substring(0, 5) : '--:--'}
                    </span>
                    <span class="timeline-card-type">${typeInfo.icon} ${typeInfo.label}</span>
                  </div>
                  <div class="timeline-card-title">${escapeHtml(act.title)}</div>
                  ${act.location ? `
                    <div class="timeline-card-location">
                      ${icon('mapPin', 14)} ${escapeHtml(act.location)}
                    </div>
                  ` : ''}
                  
                  <div style="display:flex; justify-content:space-between; align-items:center; margin-top:var(--space-3)">
                    <div class="creator-info" style="display:flex; align-items:center; gap:var(--space-2); font-size:10px; color:var(--text-tertiary)">
                      <img src="${act.creator?.avatar_url || 'https://ui-avatars.com/api/?name=?'}" style="width:16px; height:16px; border-radius:50%">
                      <span>por ${escapeHtml(act.creator?.full_name || 'Alguém')}</span>
                    </div>
                    
                    <div class="timeline-card-actions">
                      <button class="btn btn-ghost btn-icon btn-sm edit-act-btn" data-id="${act.id}">
                        ${icon('edit', 14)}
                      </button>
                      <button class="btn btn-ghost btn-icon btn-sm delete-act-btn" data-id="${act.id}">
                        ${icon('trash', 14)}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      ` : `
        <div style="padding:var(--space-8); text-align:center; color:var(--text-tertiary); border:1px dashed var(--border-color); border-radius:var(--radius-lg)">
          Nenhuma atividade planejada para este dia.
        </div>
      `}

      <button class="add-activity-btn" id="btn-add-activity-inline" style="margin-top:var(--space-4)">
        ${icon('plus', 18)} Adicionar atividade ao Dia ${selectedDay}
      </button>
    </div>
  `;

  // Events
  container.querySelectorAll('.day-tab').forEach(el => {
    el.addEventListener('click', () => {
      selectedDay = Number(el.dataset.day);
      renderItinerary(container, tripId);
    });
  });

  const addHandler = () => _openActivityModal(container, tripId, dates[selectedDay - 1]);
  container.querySelector('#btn-add-activity')?.addEventListener('click', addHandler);
  container.querySelector('#btn-add-activity-inline')?.addEventListener('click', addHandler);

  container.querySelectorAll('.edit-act-btn').forEach(el => {
    el.addEventListener('click', () => {
      const act = allActivities.find(a => a.id === el.dataset.id);
      if (act) _openActivityModal(container, tripId, dates[selectedDay - 1], act);
    });
  });

  container.querySelectorAll('.delete-act-btn').forEach(el => {
    el.addEventListener('click', async () => {
      const confirmed = await modal.confirm({ title: 'Excluir atividade?', message: 'Esta ação não pode ser desfeita.', confirmText: 'Excluir', danger: true });
      if (confirmed) {
        await dataService.deleteActivity(el.dataset.id);
        toast.success('Atividade excluída');
        renderItinerary(container, tripId);
      }
    });
  });
}

function _openActivityModal(container, tripId, date, activity = null) {
  const isEdit = !!activity;

  const content = `
    <div class="form-group">
      <label class="form-label">Título *</label>
      <input type="text" class="form-input" id="act-title" placeholder="Ex: Visitar Torre Eiffel" value="${activity ? escapeHtml(activity.title) : ''}" />
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Horário</label>
        <input type="time" class="form-input" id="act-time" value="${activity ? activity.time || '' : ''}" />
      </div>
      <div class="form-group">
        <label class="form-label">Tipo</label>
        <select class="form-select" id="act-type">
          ${ACTIVITY_TYPES.map(t => `<option value="${t.id}" ${activity?.type === t.id ? 'selected' : ''}>${t.icon} ${t.label}</option>`).join('')}
        </select>
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">Localização</label>
      <input type="text" class="form-input" id="act-location" placeholder="Ex: Champ de Mars, Paris" value="${activity ? escapeHtml(activity.location || '') : ''}" />
    </div>
    <div class="form-group">
      <label class="form-label">Notas</label>
      <textarea class="form-textarea" id="act-notes" placeholder="Observações...">${activity ? escapeHtml(activity.notes || '') : ''}</textarea>
    </div>
  `;

  const footer = `
    <button class="btn btn-secondary" id="act-cancel">Cancelar</button>
    <button class="btn btn-primary" id="act-save">${isEdit ? 'Salvar' : 'Adicionar'}</button>
  `;

  modal.open({ title: isEdit ? 'Editar Atividade' : 'Nova Atividade', content, footer });

  document.getElementById('act-cancel')?.addEventListener('click', () => modal.close());
  document.getElementById('act-save')?.addEventListener('click', async () => {
    const title = document.getElementById('act-title')?.value?.trim();
    if (!title) { toast.warning('Informe o título'); return; }

    const data = {
      trip_id: tripId,
      date,
      title,
      time: document.getElementById('act-time')?.value || null,
      description: document.getElementById('act-notes')?.value?.trim() || '',
      location: document.getElementById('act-location')?.value?.trim() || '',
    };

    try {
      if (isEdit) {
        await dataService.updateActivity(activity.id, data);
        toast.success('Atividade atualizada');
      } else {
        await dataService.createActivity(data);
        toast.success('Atividade adicionada');
      }
      modal.close();
      renderItinerary(container, tripId);
    } catch (err) {
      toast.error('Erro ao salvar atividade');
    }
  });
}
