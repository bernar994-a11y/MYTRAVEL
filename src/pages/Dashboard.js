// ==========================================
// MY TRAVEL — Dashboard Page
// ==========================================

import storage from '../services/storage.js';
import { icon } from '../utils/icons.js';
import { router } from '../router.js';
import { formatCurrency, formatDateShort, getGreeting, getTripStatus, daysUntil, sumBy, relativeTime, escapeHtml } from '../utils/helpers.js';
import { EXPENSE_CATEGORIES, TRIP_STATUS_LABELS, TRIP_STATUS_CLASSES } from '../utils/constants.js';

export function renderDashboard() {
  const content = document.getElementById('content-area');
  if (!content) return;

  const trips = storage.getTrips();
  const expenses = storage.getExpenses();
  const settings = storage.getSettings();
  const user = storage.getUser() || { name: 'Viajante' };
  const currency = settings.currency || 'BRL';

  // Calculate stats
  const activeTrips = trips.filter(t => getTripStatus(t.startDate, t.endDate) === 'active');
  const planningTrips = trips.filter(t => getTripStatus(t.startDate, t.endDate) === 'planning');
  const totalBudget = sumBy(trips, 'budget');
  const totalSpent = expenses.reduce((s, e) => s + (Number(e.amount) || 0), 0);
  const upcomingReminders = storage.getUpcomingReminders().slice(0, 5);
  const visitedCountries = new Set(trips.filter(t => t.destination).map(t => t.destination.split(',').pop().trim()));

  // Upcoming trips
  const upcomingTrips = trips
    .filter(t => getTripStatus(t.startDate, t.endDate) !== 'completed')
    .sort((a, b) => new Date(a.startDate) - new Date(b.startDate))
    .slice(0, 5);

  // Spending by category
  const categorySpending = {};
  EXPENSE_CATEGORIES.forEach(c => { categorySpending[c.id] = 0; });
  expenses.forEach(e => {
    categorySpending[e.category] = (categorySpending[e.category] || 0) + (Number(e.amount) || 0);
  });

  content.innerHTML = `
    <div class="animate-fade-in-up">
      <!-- Welcome Banner -->
      <div class="welcome-banner">
        <div class="welcome-banner-content">
          <h1>Olá, ${user.name ? escapeHtml(user.name.split(' ')[0]) : 'Viajante'}! 👋</h1>
          <p>Você tem <strong>${activeTrips.length}</strong> ${activeTrips.length === 1 ? 'viagem' : 'viagens'} em andamento e <strong>${upcomingTrips.length}</strong> ${upcomingTrips.length === 1 ? 'planejada' : 'planejadas'}.</p>
        </div>
        <div class="quick-actions">
          <button class="quick-action-btn" id="dash-new-trip">
            ${icon('plus', 16)} Nova Viagem
          </button>
          <button class="quick-action-btn" id="dash-add-expense">
            ${icon('finances', 16)} Nova Despesa
          </button>
        </div>
      </div>

      <!-- Stats Grid -->
      <div class="card grid-stats stagger-children" style="background:transparent; border:none; box-shadow:none; padding:0;">
        <div class="stat-card" style="display:flex; flex-direction:column; gap:8px; padding:20px; border-radius:16px;">
          <div class="stat-card-header" style="justify-content:flex-start; gap:12px; margin-bottom:4px;">
            <div class="stat-card-icon primary" style="width:48px; height:48px; border-radius:12px; background:rgba(59,130,246,0.1); color:#3b82f6;">${icon('trendingUp', 24)}</div>
            <span class="stat-card-label" style="font-size:14px; text-transform:none; font-weight:600; color:var(--text-secondary); letter-spacing:normal;">Demonstrativo</span>
          </div>
          <div class="stat-card-value" style="font-size:28px; line-height:1.2;">${formatCurrency(totalBudget - totalSpent, currency)}</div>
          <div class="stat-card-change ${totalBudget - totalSpent >= 0 ? 'up' : 'down'}">Saldo atual disponível</div>
        </div>

        <div class="stat-card" style="display:flex; flex-direction:column; gap:8px; padding:20px; border-radius:16px;">
          <div class="stat-card-header" style="justify-content:flex-start; gap:12px; margin-bottom:4px;">
            <div class="stat-card-icon success" style="width:48px; height:48px; border-radius:12px; background:rgba(16,185,129,0.1); color:#10b981;">${icon('dashboard', 24)}</div>
            <span class="stat-card-label" style="font-size:14px; text-transform:none; font-weight:600; color:var(--text-secondary); letter-spacing:normal;">Total de viagens</span>
          </div>
          <div class="stat-card-value" style="font-size:28px; line-height:1.2;">${trips.length}</div>
          <div class="stat-card-change up">${activeTrips.length} em andamento</div>
        </div>

        <div class="stat-card" style="display:flex; flex-direction:column; gap:8px; padding:20px; border-radius:16px;">
          <div class="stat-card-header" style="justify-content:flex-start; gap:12px; margin-bottom:4px;">
            <div class="stat-card-icon warning" style="width:48px; height:48px; border-radius:12px; background:rgba(245,158,11,0.1); color:#f59e0b;">${icon('finances', 24)}</div>
            <span class="stat-card-label" style="font-size:14px; text-transform:none; font-weight:600; color:var(--text-secondary); letter-spacing:normal;">Investimento total</span>
          </div>
          <div class="stat-card-value" style="font-size:28px; line-height:1.2;">${formatCurrency(totalBudget, currency)}</div>
          <div class="stat-card-change down">${formatCurrency(totalSpent, currency)} gastos</div>
        </div>
      </div>

      <!-- Charts + Events Grid -->
      <div class="dashboard-grid">
        <!-- Spending by Category Chart -->
        <div class="chart-container animate-fade-in-up">
          <div class="chart-header">
            <h3 class="chart-title">Gastos por Categoria</h3>
          </div>
          ${expenses.length > 0 ? `
            <div class="chart-canvas-wrapper">
              <canvas id="category-chart"></canvas>
            </div>
            <div class="category-list" style="margin-top:var(--space-4)">
              ${EXPENSE_CATEGORIES.filter(c => categorySpending[c.id] > 0).map(c => `
                <div class="category-item">
                  <div class="category-color" style="background:${c.color}"></div>
                  <span class="category-name">${c.icon} ${c.label}</span>
                  <span class="category-value">${formatCurrency(categorySpending[c.id], currency)}</span>
                  <span class="category-percent">${Math.round((categorySpending[c.id] / totalSpent) * 100)}%</span>
                </div>
              `).join('')}
            </div>
          ` : `
            <div class="empty-state" style="padding:var(--space-8)">
              <div class="empty-state-icon">${icon('barChart', 32)}</div>
              <p class="empty-state-text">Adicione despesas para ver o gráfico</p>
            </div>
          `}
        </div>

        <!-- Spending by Trip Chart -->
        <div class="chart-container animate-fade-in-up">
          <div class="chart-header">
            <h3 class="chart-title">Gastos por Viagem</h3>
          </div>
          ${trips.length > 0 && expenses.length > 0 ? `
            <div class="chart-canvas-wrapper">
              <canvas id="trip-chart"></canvas>
            </div>
          ` : `
            <div class="empty-state" style="padding:var(--space-8)">
              <div class="empty-state-icon">${icon('barChart', 32)}</div>
              <p class="empty-state-text">Crie viagens e adicione gastos</p>
            </div>
          `}
        </div>

        <!-- Upcoming Events -->
        <div class="upcoming-events animate-fade-in-up">
          <div class="upcoming-header">
            <h3>Próximos Eventos</h3>
            <button class="btn btn-ghost btn-sm" onclick="location.hash='/reminders'">Ver todos</button>
          </div>
          ${upcomingTrips.length > 0 ? upcomingTrips.map(trip => {
            const days = daysUntil(trip.startDate);
            const status = getTripStatus(trip.startDate, trip.endDate);
            return `
              <div class="event-item" data-route="/trip/${trip.id}" style="cursor:pointer">
                <div class="event-date-badge">
                  <span class="month">${new Date(trip.startDate + 'T00:00:00').toLocaleDateString('pt-BR', { month: 'short' })}</span>
                  <span class="day">${new Date(trip.startDate + 'T00:00:00').getDate()}</span>
                </div>
                <div class="event-info">
                  <h4>${trip.name}</h4>
                  <span>${status === 'active' ? 'Em andamento' : days > 0 ? `em ${days} dia${days !== 1 ? 's' : ''}` : 'Hoje!'}</span>
                </div>
                <span class="badge ${TRIP_STATUS_CLASSES[status]}">${TRIP_STATUS_LABELS[status]}</span>
              </div>
            `;
          }).join('') : `
            <div class="empty-state" style="padding:var(--space-6)">
              <p class="empty-state-text">Nenhum evento próximo</p>
              <button class="btn btn-primary btn-sm" id="dash-create-trip-empty">Criar Viagem</button>
            </div>
          `}
        </div>

        <!-- Reminders -->
        <div class="upcoming-events animate-fade-in-up">
          <div class="upcoming-header">
            <h3>Lembretes</h3>
            <button class="btn btn-ghost btn-sm" onclick="location.hash='/reminders'">Ver todos</button>
          </div>
          ${upcomingReminders.length > 0 ? upcomingReminders.map(r => `
            <div class="event-item">
              <div class="event-date-badge" style="background:rgba(139,92,246,0.1)">
                <span class="month" style="color:var(--secondary-400)">${new Date(r.datetime).toLocaleDateString('pt-BR', { month: 'short' })}</span>
                <span class="day">${new Date(r.datetime).getDate()}</span>
              </div>
              <div class="event-info">
                <h4>${r.title}</h4>
                <span>${new Date(r.datetime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            </div>
          `).join('') : `
            <div class="empty-state" style="padding:var(--space-6)">
              <p class="empty-state-text">Nenhum lembrete pendente</p>
            </div>
          `}
        </div>
      </div>
    </div>
  `;

  // Bind events
  document.getElementById('dash-new-trip')?.addEventListener('click', () => router.navigate('/trips'));
  document.getElementById('dash-add-expense')?.addEventListener('click', () => router.navigate('/finances'));
  document.getElementById('dash-create-trip-empty')?.addEventListener('click', () => router.navigate('/trips'));

  document.querySelectorAll('[data-route]').forEach(el => {
    el.addEventListener('click', () => router.navigate(el.dataset.route));
  });

  // Render charts
  _renderCharts(trips, expenses, categorySpending, currency);
}

async function _renderCharts(trips, expenses, categorySpending, currency) {
  if (expenses.length === 0) return;

  try {
    const { Chart, DoughnutController, BarController, ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend } = await import('chart.js');
    Chart.register(DoughnutController, BarController, ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend);

    // Category doughnut chart
    const catCanvas = document.getElementById('category-chart');
    if (catCanvas) {
      const catData = EXPENSE_CATEGORIES.filter(c => categorySpending[c.id] > 0);
      new Chart(catCanvas, {
        type: 'doughnut',
        data: {
          labels: catData.map(c => c.label),
          datasets: [{
            data: catData.map(c => categorySpending[c.id]),
            backgroundColor: catData.map(c => c.color),
            borderWidth: 0,
            hoverOffset: 8
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: '65%',
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: 'rgba(15, 23, 42, 0.9)',
              titleFont: { family: 'Inter' },
              bodyFont: { family: 'Inter' },
              padding: 12,
              cornerRadius: 8,
              callbacks: {
                label: (ctx) => ` ${formatCurrency(ctx.raw, currency)}`
              }
            }
          }
        }
      });
    }

    // Trip bar chart
    const tripCanvas = document.getElementById('trip-chart');
    if (tripCanvas && trips.length > 0) {
      const tripData = trips.slice(0, 8).map(t => ({
        name: t.name.length > 12 ? t.name.slice(0, 12) + '…' : t.name,
        budget: Number(t.budget) || 0,
        spent: storage.getTotalExpensesByTrip(t.id)
      }));

      new Chart(tripCanvas, {
        type: 'bar',
        data: {
          labels: tripData.map(t => t.name),
          datasets: [
            {
              label: 'Orçamento',
              data: tripData.map(t => t.budget),
              backgroundColor: 'rgba(99, 102, 241, 0.3)',
              borderColor: '#6366F1',
              borderWidth: 1,
              borderRadius: 4
            },
            {
              label: 'Gasto',
              data: tripData.map(t => t.spent),
              backgroundColor: 'rgba(139, 92, 246, 0.6)',
              borderColor: '#8B5CF6',
              borderWidth: 1,
              borderRadius: 4
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            x: {
              grid: { display: false },
              ticks: { color: '#94A3B8', font: { family: 'Inter', size: 11 } }
            },
            y: {
              grid: { color: 'rgba(148, 163, 184, 0.08)' },
              ticks: {
                color: '#94A3B8',
                font: { family: 'Inter', size: 11 },
                callback: (v) => formatCurrency(v, currency)
              }
            }
          },
          plugins: {
            legend: {
              position: 'bottom',
              labels: { color: '#94A3B8', font: { family: 'Inter', size: 12 }, padding: 16, usePointStyle: true }
            },
            tooltip: {
              backgroundColor: 'rgba(15, 23, 42, 0.9)',
              titleFont: { family: 'Inter' },
              bodyFont: { family: 'Inter' },
              padding: 12,
              cornerRadius: 8,
              callbacks: {
                label: (ctx) => ` ${ctx.dataset.label}: ${formatCurrency(ctx.raw, currency)}`
              }
            }
          }
        }
      });
    }
  } catch (e) {
    console.warn('Chart.js not loaded:', e);
  }
}
