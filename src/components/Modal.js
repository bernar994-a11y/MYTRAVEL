// ==========================================
// MY TRAVEL — Modal Component
// ==========================================

import { icon } from '../utils/icons.js';

class ModalManager {
  constructor() {
    this._overlay = null;
    this._onClose = null;
  }

  open({ title, content, footer, size = 'md', onClose }) {
    this.close(); // Close any existing modal

    const maxWidths = { sm: '420px', md: '560px', lg: '720px', xl: '900px' };

    this._overlay = document.createElement('div');
    this._overlay.className = 'modal-overlay';
    this._overlay.innerHTML = `
      <div class="modal" style="max-width: ${maxWidths[size] || maxWidths.md}">
        <div class="modal-header">
          <h3 class="modal-title">${title}</h3>
          <button class="modal-close" id="modal-close-btn">
            ${icon('close', 18)}
          </button>
        </div>
        <div class="modal-body">${content}</div>
        ${footer ? `<div class="modal-footer">${footer}</div>` : ''}
      </div>
    `;

    this._onClose = onClose;
    document.body.appendChild(this._overlay);
    document.body.style.overflow = 'hidden';

    // Animate in
    requestAnimationFrame(() => {
      this._overlay.classList.add('active');
    });

    // Close handlers
    this._overlay.querySelector('#modal-close-btn').addEventListener('click', () => this.close());
    this._overlay.addEventListener('click', (e) => {
      if (e.target === this._overlay) this.close();
    });

    // Escape key
    this._escHandler = (e) => {
      if (e.key === 'Escape') this.close();
    };
    document.addEventListener('keydown', this._escHandler);

    return this._overlay;
  }

  close() {
    if (!this._overlay) return;

    this._overlay.classList.remove('active');
    document.body.style.overflow = '';
    document.removeEventListener('keydown', this._escHandler);

    setTimeout(() => {
      if (this._overlay && this._overlay.parentNode) {
        this._overlay.remove();
      }
      if (this._onClose) this._onClose();
      this._overlay = null;
      this._onClose = null;
    }, 200);
  }

  confirm({ title, message, confirmText = 'Confirmar', cancelText = 'Cancelar', danger = false }) {
    return new Promise((resolve) => {
      const content = `
        <div class="confirm-dialog">
          <div class="confirm-dialog-icon">
            ${icon(danger ? 'alertCircle' : 'info', 28)}
          </div>
          <h4 class="confirm-dialog-title">${title}</h4>
          <p class="confirm-dialog-text">${message}</p>
        </div>
      `;
      const footer = `
        <button class="btn btn-secondary" id="confirm-cancel">${cancelText}</button>
        <button class="btn ${danger ? 'btn-danger' : 'btn-primary'}" id="confirm-ok">${confirmText}</button>
      `;

      const overlay = this.open({ title: '', content, footer, size: 'sm' });
      
      // Hide the header for confirm dialogs
      overlay.querySelector('.modal-header').style.display = 'none';
      overlay.querySelector('.modal-body').style.paddingTop = 'var(--space-6)';

      overlay.querySelector('#confirm-cancel').addEventListener('click', () => {
        this.close();
        resolve(false);
      });
      overlay.querySelector('#confirm-ok').addEventListener('click', () => {
        this.close();
        resolve(true);
      });
    });
  }

  getBody() {
    return this._overlay?.querySelector('.modal-body');
  }

  getOverlay() {
    return this._overlay;
  }
}

export const modal = new ModalManager();
export default modal;
