// ==========================================
// MY TRAVEL — Finances Page
// ==========================================

import storage from '../services/storage.js';
import { icon } from '../utils/icons.js';
import { router } from '../router.js';
import { modal } from '../components/Modal.js';
import { toast } from '../components/Toast.js';
import { formatCurrency, formatDate, escapeHtml, sortByDate } from '../utils/helpers.js';
import { EXPENSE_CATEGORIES, PAYMENT_METHODS, CURRENCIES } from '../utils/constants.js';

export function renderFinances(container, tripId = null) {
  const target = container || document.getElementById('content-area');
  if (!target) return;

  const isGlobal = !tripId;
  const trips = storage.getTrips();
  const expenses = tripId 
    ? sortByDate(storage.getExpensesByTrip(tripId), 'date', false)
    : sortByDate(storage.getExpenses(), 'date', false);
  
  const trip = tripId ? storage.getTrip(tripId) : null;
  const currency = trip?.currency || storage.getSettings()?.currency || 'BRL';
  const budget = trip ? Number(trip.budget) || 0 : trips.reduce((s, t) => s + (Number(t.budget) || 0), 0);
  const totalSpent = expenses.reduce((s, e) => s + (Number(e.amount) || 0), 0);
  const remaining = budget - totalSpent;
  const percent = budget > 0 ? Math.round((totalSpent / budget) * 100) : 0;

  target.innerHTML = `
    <div class="animate-fade-in-up">
      ${isGlobal ? `
        <div class="page-header">
          <div>
            <h1>Finanças</h1>
            <p class="page-header-subtitle">${expenses.length} despesa${expenses.length !== 1 ? 's' : ''} registrada${expenses.length !== 1 ? 's' : ''}</p>
          </div>
          <button class="btn btn-primary" id="btn-add-expense">
            ${icon('plus', 18)} Nova Despesa
          </button>
        </div>
      ` : `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:var(--space-4)">
          <h3 style="font-size:var(--font-md);font-weight:var(--fw-semibold)">Despesas</h3>
          <button class="btn btn-primary btn-sm" id="btn-add-expense">
            ${icon('plus', 16)} Nova Despesa
          </button>
        </div>
      `}

      <!-- Budget Overview -->
      <div class="budget-overview">
        <div class="budget-comparison">
          <div class="budget-item">
            <div class="budget-item-label">Orçamento</div>
            <div class="budget-item-value planned">${formatCurrency(budget, currency)}</div>
          </div>
          <div class="budget-vs">vs</div>
          <div class="budget-item">
            <div class="budget-item-label">Gasto Real</div>
            <div class="budget-item-value spent">${formatCurrency(totalSpent, currency)}</div>
          </div>
        </div>
        <div style="display:flex;justify-content:space-between;font-size:var(--font-sm);margin-bottom:var(--space-2)">
          <span style="color:var(--text-secondary)">${percent}% utilizado</span>
          <span style="color:${remaining >= 0 ? 'var(--success-400)' : 'var(--danger-400)'}">
            ${remaining >= 0 ? 'Restante' : 'Excedido'}: ${formatCurrency(Math.abs(remaining), currency)}
          </span>
        </div>
        <div class="progress-bar" style="height:8px">
          <div class="progress-bar-fill ${percent > 100 ? 'over-budget' : percent > 80 ? 'warning' : ''}" style="width:${Math.min(percent, 100)}%"></div>
        </div>
      </div>

      <!-- Expense List -->
      ${expenses.length > 0 ? `
        <div class="expense-list">
          ${expenses.map(exp => {
            const cat = EXPENSE_CATEGORIES.find(c => c.id === exp.category) || EXPENSE_CATEGORIES[5];
            const tripName = isGlobal ? storage.getTrip(exp.tripId)?.name : null;
            return `
              <div class="expense-item" data-id="${exp.id}">
                <div class="expense-icon ${exp.category}">${cat.icon}</div>
                <div class="expense-info">
                  <h4>${escapeHtml(exp.description)}</h4>
                  <span>${cat.label}${tripName ? ' · ' + escapeHtml(tripName) : ''} · ${formatDate(exp.date)}</span>
                </div>
                <div style="text-align:right">
                  <div class="expense-amount">${formatCurrency(exp.amount, exp.currency || currency)}</div>
                  <div class="expense-payment">${PAYMENT_METHODS.find(p => p.id === exp.paymentMethod)?.label || ''}</div>
                </div>
                <div class="dropdown" style="margin-left:var(--space-2)">
                  <button class="btn btn-ghost btn-icon btn-sm expense-menu-btn">${icon('moreVertical', 16)}</button>
                  <div class="dropdown-menu" id="exp-menu-${exp.id}">
                    <button class="dropdown-item edit-exp-btn" data-id="${exp.id}">${icon('edit', 14)} Editar</button>
                    <div class="dropdown-divider"></div>
                    <button class="dropdown-item danger del-exp-btn" data-id="${exp.id}">${icon('trash', 14)} Excluir</button>
                  </div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      ` : `
        <div class="empty-state">
          <div class="empty-state-icon">💰</div>
          <h3 class="empty-state-title">Nenhuma despesa registrada</h3>
          <p class="empty-state-text">Registre seus gastos para acompanhar o orçamento.</p>
          <button class="btn btn-primary btn-sm" id="btn-add-expense-empty">${icon('plus', 16)} Adicionar Despesa</button>
        </div>
      `}

      ${isGlobal && expenses.length > 0 ? `
        <div style="margin-top:var(--space-4);text-align:center">
          <button class="btn btn-secondary btn-sm" id="btn-export-csv">${icon('download', 14)} Exportar CSV</button>
        </div>
      ` : ''}
    </div>
  `;

  // Events
  const addExpenseHandler = () => _openExpenseModal(target, tripId, currency);
  target.querySelector('#btn-add-expense')?.addEventListener('click', addExpenseHandler);
  target.querySelector('#btn-add-expense-empty')?.addEventListener('click', addExpenseHandler);

  // Dropdown menus
  target.querySelectorAll('.expense-menu-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const menu = btn.nextElementSibling;
      target.querySelectorAll('.dropdown-menu').forEach(m => { if (m !== menu) m.classList.remove('active'); });
      menu.classList.toggle('active');
    });
  });

  // Close dropdowns on outside click
  document.addEventListener('click', () => {
    target.querySelectorAll('.dropdown-menu').forEach(m => m.classList.remove('active'));
  }, { once: true });

  // Edit expense
  target.querySelectorAll('.edit-exp-btn').forEach(el => {
    el.addEventListener('click', () => {
      const exp = storage.getExpense(el.dataset.id);
      if (exp) _openExpenseModal(target, tripId, currency, exp);
    });
  });

  // Delete expense
  target.querySelectorAll('.del-exp-btn').forEach(el => {
    el.addEventListener('click', async () => {
      const confirmed = await modal.confirm({ title: 'Excluir despesa?', message: 'Esta ação não pode ser desfeita.', confirmText: 'Excluir', danger: true });
      if (confirmed) {
        storage.deleteExpense(el.dataset.id);
        toast.success('Despesa excluída');
        renderFinances(target, tripId);
      }
    });
  });

  // Export CSV
  target.querySelector('#btn-export-csv')?.addEventListener('click', () => _exportCSV(expenses, currency));
}

function _openExpenseModal(container, tripId, defaultCurrency, expense = null) {
  const isEdit = !!expense;
  const trips = storage.getTrips();

  const content = `
    ${!tripId ? `
      <div class="form-group">
        <label class="form-label">Viagem *</label>
        <select class="form-select" id="exp-trip">
          <option value="">Selecione a viagem</option>
          ${trips.map(t => `<option value="${t.id}" ${expense?.tripId === t.id ? 'selected' : ''}>${escapeHtml(t.name)}</option>`).join('')}
        </select>
      </div>
    ` : ''}
    <div class="form-group">
      <label class="form-label">Descrição *</label>
      <input type="text" class="form-input" id="exp-desc" placeholder="Ex: Jantar no restaurante" value="${expense ? escapeHtml(expense.description) : ''}" />
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Valor *</label>
        <input type="number" class="form-input" id="exp-amount" placeholder="0.00" step="0.01" min="0" value="${expense ? expense.amount : ''}" />
      </div>
      <div class="form-group">
        <label class="form-label">Moeda</label>
        <select class="form-select" id="exp-currency">
          ${CURRENCIES.map(c => `<option value="${c.code}" ${(expense?.currency || defaultCurrency) === c.code ? 'selected' : ''}>${c.code}</option>`).join('')}
        </select>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Categoria</label>
        <select class="form-select" id="exp-category">
          ${EXPENSE_CATEGORIES.map(c => `<option value="${c.id}" ${expense?.category === c.id ? 'selected' : ''}>${c.icon} ${c.label}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Data</label>
        <input type="date" class="form-input" id="exp-date" value="${expense ? expense.date : new Date().toISOString().split('T')[0]}" />
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">Pagamento</label>
      <select class="form-select" id="exp-payment">
        ${PAYMENT_METHODS.map(p => `<option value="${p.id}" ${expense?.paymentMethod === p.id ? 'selected' : ''}>${p.label}</option>`).join('')}
      </select>
    </div>
    <div class="form-group">
      <label class="form-label">Notas</label>
      <textarea class="form-textarea" id="exp-notes" placeholder="Observações...">${expense ? escapeHtml(expense.notes || '') : ''}</textarea>
    </div>
  `;

  const footer = `
    <button class="btn btn-secondary" id="exp-cancel">Cancelar</button>
    <button class="btn btn-primary" id="exp-save">${isEdit ? 'Salvar' : 'Adicionar'}</button>
  `;

  modal.open({ title: isEdit ? 'Editar Despesa' : 'Nova Despesa', content, footer });

  document.getElementById('exp-cancel')?.addEventListener('click', () => modal.close());
  document.getElementById('exp-save')?.addEventListener('click', () => {
    const selectedTrip = tripId || document.getElementById('exp-trip')?.value;
    const description = document.getElementById('exp-desc')?.value?.trim();
    const amount = document.getElementById('exp-amount')?.value;

    if (!selectedTrip) { toast.warning('Selecione a viagem'); return; }
    if (!description) { toast.warning('Informe a descrição'); return; }
    if (!amount || Number(amount) <= 0) { toast.warning('Informe o valor'); return; }

    const data = {
      tripId: selectedTrip,
      description,
      amount: Number(amount),
      currency: document.getElementById('exp-currency')?.value || defaultCurrency,
      category: document.getElementById('exp-category')?.value || 'other',
      date: document.getElementById('exp-date')?.value || new Date().toISOString().split('T')[0],
      paymentMethod: document.getElementById('exp-payment')?.value || 'credit_card',
      notes: document.getElementById('exp-notes')?.value?.trim() || ''
    };

    if (isEdit) {
      storage.updateExpense(expense.id, data);
      toast.success('Despesa atualizada');
    } else {
      storage.createExpense(data);
      toast.success('Despesa adicionada');
    }

    modal.close();
    renderFinances(container, tripId);
  });
}

function _exportCSV(expenses, currency) {
  const headers = 'Descrição,Categoria,Valor,Moeda,Data,Pagamento,Notas\n';
  const rows = expenses.map(e => {
    const cat = EXPENSE_CATEGORIES.find(c => c.id === e.category)?.label || '';
    const pay = PAYMENT_METHODS.find(p => p.id === e.paymentMethod)?.label || '';
    return `"${e.description}","${cat}",${e.amount},"${e.currency || currency}","${e.date}","${pay}","${e.notes || ''}"`;
  }).join('\n');

  const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `despesas_${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  toast.success('CSV exportado!');
}
