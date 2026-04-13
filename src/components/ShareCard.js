import html2canvas from 'html2canvas';
import { icon } from '../utils/icons.js';
import { formatDate, escapeHtml } from '../utils/helpers.js';
import { modal } from './Modal.js';
import { toast } from './Toast.js';

/**
 * Renders a beautiful shareable card for the trip and its itinerary
 */
export async function openShareCard(trip, activities = []) {
  // Sort activities by date/time
  const sortedActivities = [...activities].sort((a, b) => {
    const dateA = new Date(a.date + 'T' + (a.time || '00:00'));
    const dateB = new Date(b.date + 'T' + (b.time || '00:00'));
    return dateA - dateB;
  }).slice(0, 5); // Take only first 5 for the card to keep it clean

  const content = `
    <div class="share-card-container animate-fade-in">
      <div id="capture-area" class="share-flyer">
        <div class="share-flyer-header" style="${trip.image_url ? `background-image: url('${trip.image_url}')` : 'background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%)'}">
          <div class="share-flyer-header-content">
            <div class="share-flyer-destination">${escapeHtml(trip.destination) || 'Destino por definir'}</div>
            <div class="share-flyer-title">${escapeHtml(trip.name)}</div>
          </div>
        </div>
        
        <div class="share-flyer-body">
          <div class="share-flyer-dates">
            ${icon('calendar', 14)} 
            <span>${formatDate(trip.start_date)} — ${formatDate(trip.end_date)}</span>
          </div>

          <div class="share-flyer-itinerary">
            ${sortedActivities.length > 0 ? sortedActivities.map(activity => `
              <div class="share-flyer-day">
                <div class="share-flyer-day-marker">
                  <div class="share-flyer-day-circle"></div>
                  <div class="share-flyer-day-line"></div>
                </div>
                <div class="share-flyer-day-info">
                  <div class="share-flyer-day-date">${formatDate(activity.date)}</div>
                  <div class="share-flyer-activity">
                    <div class="share-flyer-activity-time">${activity.time || ''}</div>
                    <div class="share-flyer-activity-title">${escapeHtml(activity.title)}</div>
                  </div>
                </div>
              </div>
            `).join('') : `
              <p style="text-align:center; color:#64748b; font-size:14px; padding:20px 0">
                O roteiro está sendo preparado... ✈️
              </p>
            `}
          </div>
        </div>

        <div class="share-flyer-footer">
          <div class="share-flyer-logo">MY TRAVEL</div>
          <div class="share-flyer-tagline">Organize suas aventuras favoritas</div>
        </div>
      </div>

      <div class="share-actions">
        <button class="btn btn-primary" id="btn-download-image">
          ${icon('download', 18)} Baixar Imagem
        </button>
        <button class="btn btn-secondary" id="share-modal-close">Fechar</button>
      </div>
    </div>
  `;

  modal.open({
    title: 'Compartilhar Roteiro',
    content,
    size: 'md'
  });

  // Inject CSS if not present
  if (!document.getElementById('share-card-css')) {
    const link = document.createElement('link');
    link.id = 'share-card-css';
    link.rel = 'stylesheet';
    link.href = 'src/styles/share-card.css';
    document.head.appendChild(link);
  }

  document.getElementById('share-modal-close')?.addEventListener('click', () => modal.close());

  document.getElementById('btn-download-image')?.addEventListener('click', async () => {
    const btn = document.getElementById('btn-download-image');
    const originalText = btn.innerHTML;
    btn.innerHTML = `${icon('loader', 18)} Gerando...`;
    btn.disabled = true;

    try {
      const element = document.getElementById('capture-area');
      const canvas = await html2canvas(element, {
        useCORS: true,
        scale: 2, // High resolution
        backgroundColor: '#0f172a'
      });
      
      const image = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = image;
      link.download = `Roteiro_${trip.name.replace(/\s+/g, '_')}.png`;
      link.click();
      
      toast.success('Imagem gerada com sucesso!');
    } catch (err) {
      console.error('Share capture error:', err);
      toast.error('Erro ao gerar imagem. Tente novamente.');
    } finally {
      btn.innerHTML = originalText;
      btn.disabled = false;
    }
  });
}
