import html2canvas from 'html2canvas';
import { icon } from '../utils/icons.js';
import { formatDate, escapeHtml } from '../utils/helpers.js';
import { modal } from './Modal.js';
import { toast } from './Toast.js';

export async function openShareCard(trip, activities = []) {
  // Pega até os 6 primeiros eventos do roteiro
  const sortedActivities = [...activities].sort((a, b) => {
    const dateA = new Date(a.date + 'T' + (a.time || '00:00'));
    const dateB = new Date(b.date + 'T' + (b.time || '00:00'));
    return dateA - dateB;
  }).slice(0, 6);

  const content = `
    <div class="share-card-container animate-fade-in">
      <div id="capture-area" class="share-flyer" style="border-radius: 24px; overflow: hidden; background: #ffffff; color: #0f172a; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);">
        <!-- Top Section -->
        <div style="position: relative; height: 180px; ${trip.image_url ? `background: url('${trip.image_url}') center/cover` : 'background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)'}">
          <div style="position: absolute; inset: 0; background: linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 100%);"></div>
          <div style="position: absolute; bottom: 20px; left: 24px; right: 24px;">
            <div style="font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 1.5px; color: #93c5fd; display: flex; align-items: center; gap: 8px;">
              ${icon('mapPin', 14)} ${escapeHtml(trip.destination) || 'Destino a definir'}
            </div>
            <div style="font-size: 32px; font-weight: 800; color: white; line-height: 1.1; margin-top: 4px;">
              ${escapeHtml(trip.name)}
            </div>
          </div>
        </div>
        
        <!-- Info Bar -->
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 16px 24px; background: #f8fafc; border-bottom: 1px solid #e2e8f0;">
          <div style="display: flex; align-items: center; gap: 8px; font-weight: 600; color: #334155;">
            ${icon('calendar', 16)} 
            <span style="font-size: 14px;">${formatDate(trip.start_date)} — ${formatDate(trip.end_date)}</span>
          </div>
          <div style="font-size: 14px; font-weight: 700; color: #3b82f6; background: #dbeafe; padding: 4px 12px; border-radius: 20px;">
            ${activities.length > 0 ? activities.length + ' eventos' : 'Planejando'}
          </div>
        </div>

        <!-- Itinerary Section -->
        <div style="padding: 24px; background: #ffffff;">
          <h4 style="font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #94a3b8; margin-bottom: 20px; text-align: center;">Resumo do Roteiro</h4>
          <div class="share-flyer-itinerary" style="display: flex; flex-direction: column; gap: 16px;">
            ${sortedActivities.length > 0 ? sortedActivities.map(activity => `
              <div style="display: flex; gap: 16px; align-items: flex-start;">
                <div style="display: flex; flex-direction: column; align-items: center; margin-top: 2px;">
                  <div style="width: 12px; height: 12px; border-radius: 50%; border: 3px solid #3b82f6; background: #fff; z-index: 2;"></div>
                  <div style="width: 2px; height: 50px; background: #e2e8f0; margin-top: -2px; margin-bottom: -16px;"></div>
                </div>
                <div style="flex: 1; padding: 12px 16px; background: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0;">
                  <div style="font-size: 11px; font-weight: 600; color: #64748b; margin-bottom: 4px;">
                    ${formatDate(activity.date)} ${activity.time ? '• ' + activity.time : ''}
                  </div>
                  <div style="font-size: 15px; font-weight: 700; color: #1e293b; line-height: 1.3;">
                    ${escapeHtml(activity.title)}
                  </div>
                </div>
              </div>
            `).join('') : `
              <div style="text-align: center; padding: 32px 0;">
                <div style="font-size: 40px; margin-bottom: 12px;">🛫</div>
                <p style="color: #64748b; font-size: 15px; font-weight: 500;">O roteiro detalhado ainda está sendo preparado...</p>
              </div>
            `}
          </div>
        </div>

        <!-- Footer -->
        <div style="background: #0f172a; padding: 20px; display: flex; align-items: center; justify-content: center; gap: 12px; color: white;">
          <div style="width: 32px; height: 32px; border-radius: 50%; background: linear-gradient(135deg, #3b82f6, #2563eb); display: flex; align-items: center; justify-content: center;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 30L24 12L34 30" transform="translate(-10, -10)"/></svg>
          </div>
          <div>
            <div style="font-weight: 800; font-size: 16px; letter-spacing: 1px;">MY TRAVEL</div>
            <div style="font-size: 11px; color: #94a3b8;">Gerado via MY TRAVEL App</div>
          </div>
        </div>
      </div>

      <div class="share-actions" style="margin-top: 24px; display: flex; gap: 12px; flex-wrap: wrap; justify-content: center;">
        <button class="btn btn-primary" id="btn-share-native" style="flex: 1; min-width: 140px; padding: 12px; border-radius: 12px; font-size: 15px; font-weight: 600; box-shadow: 0 4px 12px rgba(59,130,246,0.3);">
          ${icon('share', 18)} Compartilhar
        </button>
        <button class="btn btn-secondary" id="btn-download-image" style="flex: 1; min-width: 140px; padding: 12px; border-radius: 12px; font-size: 15px; font-weight: 600; background: #ffffff;">
          ${icon('download', 18)} Salvar Imagem
        </button>
      </div>
    </div>
  `;

  modal.open({
    title: 'Compartilhar Itinerário',
    content,
    size: 'md'
  });

  const captureArea = document.getElementById('capture-area');

  document.getElementById('btn-download-image')?.addEventListener('click', async () => {
    const btn = document.getElementById('btn-download-image');
    const originalText = btn.innerHTML;
    btn.innerHTML = `${icon('loader', 18) || '⏳'} Gerando...`;
    btn.disabled = true;

    try {
      const canvas = await html2canvas(captureArea, {
        useCORS: true,
        scale: 2, 
        backgroundColor: null
      });
      
      const image = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = image;
      link.download = `Roteiro_${trip.name.replace(/\s+/g, '_')}.png`;
      link.click();
      
      toast.success('Imagem salva!');
    } catch (err) {
      console.error('Share capture error:', err);
      toast.error('Erro ao gerar imagem.');
    } finally {
      btn.innerHTML = originalText;
      btn.disabled = false;
    }
  });

  document.getElementById('btn-share-native')?.addEventListener('click', async () => {
    try {
      // Create image blob
      const canvas = await html2canvas(captureArea, {
        useCORS: true,
        scale: 2,
        backgroundColor: null
      });
      
      canvas.toBlob(async (blob) => {
        if (!blob) {
          toast.error('Erro ao preparar imagem');
          return;
        }

        const file = new File([blob], 'roteiro.png', { type: 'image/png' });

        if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({
              title: `Roteiro: ${trip.name}`,
              text: `Confira os detalhes da nossa viagem: ${trip.name} para ${trip.destination}!`,
              files: [file]
            });
          } catch (e) {
            console.log("Compartilhamento cancelado ou falhou", e);
          }
        } else if (navigator.share) {
          try {
             await navigator.share({
               title: `Roteiro: ${trip.name}`,
               text: `Confira os detalhes da nossa viagem: ${trip.name} para ${trip.destination} no app MY TRAVEL!`,
               url: window.location.href
             });
          } catch (e) {
            console.log("Compartilhamento cancelado", e);
          }
        } else {
          toast.info('Seu dispositivo não suporta compartilhamento nativo. Tente baixar a imagem.');
        }
      });
    } catch (err) {
      toast.error('Erro ao compartilhar');
    }
  });
}
