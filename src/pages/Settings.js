// ==========================================
// MY TRAVEL — Settings Page
// ==========================================

import storage from '../services/storage.js';
import { icon } from '../utils/icons.js';
import { modal } from '../components/Modal.js';
import { toast } from '../components/Toast.js';
import { CURRENCIES, APP_VERSION } from '../utils/constants.js';

export function renderSettings() {
  const content = document.getElementById('content-area');
  if (!content) return;

  const settings = storage.getSettings();
  const theme = document.documentElement.getAttribute('data-theme');

  content.innerHTML = `
    <div class="animate-fade-in-up">
      <div class="page-header">
        <div>
          <h1>Configurações</h1>
          <p class="page-header-subtitle">Personalize o MY TRAVEL</p>
        </div>
      </div>

      <!-- Appearance -->
      <div class="settings-section">
        <h3 class="settings-section-title">${icon('sun', 20)} Aparência</h3>
        <div class="settings-card">
          <div class="settings-item">
            <div class="settings-item-info">
              <h4>Modo Escuro</h4>
              <p>Alterne entre tema claro e escuro</p>
            </div>
            <label class="toggle-switch">
              <input type="checkbox" id="setting-dark-mode" ${theme === 'dark' ? 'checked' : ''} />
              <span class="toggle-slider"></span>
            </label>
          </div>
        </div>
      </div>

      <!-- Preferences -->
      <div class="settings-section">
        <h3 class="settings-section-title">${icon('globe', 20)} Preferências</h3>
        <div class="settings-card">
          <div class="settings-item">
            <div class="settings-item-info">
              <h4>Moeda Padrão</h4>
              <p>Usada como padrão em novas viagens</p>
            </div>
            <select class="form-select" id="setting-currency" style="width:auto;min-width:140px">
              ${CURRENCIES.map(c => `<option value="${c.code}" ${settings.currency === c.code ? 'selected' : ''}>${c.code} - ${c.symbol}</option>`).join('')}
            </select>
          </div>
          <div class="settings-item">
            <div class="settings-item-info">
              <h4>Notificações</h4>
              <p>Receba alertas de lembretes</p>
            </div>
            <label class="toggle-switch">
              <input type="checkbox" id="setting-notifications" ${settings.notifications ? 'checked' : ''} />
              <span class="toggle-slider"></span>
            </label>
          </div>
        </div>
      </div>

      <!-- Data -->
      <div class="settings-section">
        <h3 class="settings-section-title">${icon('documents', 20)} Dados</h3>
        <div class="settings-card">
          <div class="settings-item">
            <div class="settings-item-info">
              <h4>Exportar Dados</h4>
              <p>Baixe todos os seus dados em JSON</p>
            </div>
            <button class="btn btn-settings" id="btn-export">${icon('download', 14)} Exportar</button>
          </div>
          <div class="settings-item">
            <div class="settings-item-info">
              <h4>Importar Dados</h4>
              <p>Restaure a partir de um backup</p>
            </div>
            <button class="btn btn-settings" id="btn-import">${icon('upload', 14)} Importar</button>
            <input type="file" id="import-file" accept=".json" style="display:none" />
          </div>
          <div class="settings-item">
            <div class="settings-item-info">
              <h4>Limpar Todos os Dados</h4>
              <p>Remove permanentemente tudo</p>
            </div>
            <button class="btn btn-settings-danger" id="btn-clear">${icon('trash', 14)} Limpar</button>
          </div>
        </div>
      </div>

      <!-- About -->
      <div class="settings-section">
        <h3 class="settings-section-title">${icon('info', 20)} Sobre</h3>
        <div class="settings-card">
          <div class="settings-item">
            <div class="settings-item-info">
              <h4>MY TRAVEL</h4>
              <p>Versão ${APP_VERSION} • Gestão Total de Viagens</p>
            </div>
          </div>
          <div class="settings-item">
            <div class="settings-item-info">
              <h4>Armazenamento</h4>
              <p id="storage-info">Calculando...</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  // Calculate storage
  _calcStorage();

  // Events
  document.getElementById('setting-dark-mode')?.addEventListener('change', (e) => {
    const theme = e.target.checked ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', theme);
    storage.updateSettings({ theme });
    // Update header icon
    const themeBtn = document.getElementById('theme-toggle');
    if (themeBtn) {
      themeBtn.innerHTML = theme === 'dark' ? icon('sun', 20) : icon('moon', 20);
    }
  });

  document.getElementById('setting-currency')?.addEventListener('change', (e) => {
    storage.updateSettings({ currency: e.target.value });
    toast.success('Moeda padrão atualizada');
  });

  document.getElementById('setting-notifications')?.addEventListener('change', (e) => {
    storage.updateSettings({ notifications: e.target.checked });
  });

  // Export
  document.getElementById('btn-export')?.addEventListener('click', () => {
    const data = storage.exportAllData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mytravel_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Backup exportado!');
  });

  // Import
  document.getElementById('btn-import')?.addEventListener('click', () => {
    document.getElementById('import-file')?.click();
  });

  document.getElementById('import-file')?.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        const confirmed = await modal.confirm({
          title: 'Importar dados?',
          message: 'Isso substituirá todos os dados atuais. Deseja continuar?',
          confirmText: 'Importar',
          danger: true
        });
        if (confirmed) {
          storage.importData(data);
          toast.success('Dados importados com sucesso!');
          setTimeout(() => location.reload(), 1000);
        }
      } catch {
        toast.error('Arquivo inválido');
      }
    };
    reader.readAsText(file);
  });

  // Clear
  document.getElementById('btn-clear')?.addEventListener('click', async () => {
    const confirmed = await modal.confirm({
      title: 'Limpar todos os dados?',
      message: 'Isso removerá TODAS as viagens, despesas, documentos e configurações permanentemente. Esta ação NÃO pode ser desfeita!',
      confirmText: 'Limpar Tudo',
      danger: true
    });
    if (confirmed) {
      storage.clearAllData();
      toast.success('Dados limpos');
      setTimeout(() => location.reload(), 1000);
    }
  });
}

function _calcStorage() {
  const el = document.getElementById('storage-info');
  if (!el) return;

  let total = 0;
  for (let key in localStorage) {
    if (localStorage.hasOwnProperty(key)) {
      total += (localStorage[key].length + key.length) * 2;
    }
  }

  const used = (total / 1024 / 1024).toFixed(2);
  el.textContent = `${used} MB utilizados`;
}
