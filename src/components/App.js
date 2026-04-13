// ==========================================
// MY TRAVEL — App Shell
// ==========================================

import { icon } from '../utils/icons.js';
import { NAV_ITEMS, BOTTOM_NAV_ITEMS } from '../utils/constants.js';
import { router } from '../router.js';
import storage from '../services/storage.js';
import supabase from '../services/supabase.js';
import { debounce } from '../utils/helpers.js';

export function renderApp() {
  const app = document.getElementById('app');
  const settings = storage.getSettings();
  const trips = storage.getTrips();

  app.innerHTML = `
    <!-- Sidebar -->
    <div class="sidebar" id="sidebar">
      <div class="sidebar-header">
        <div class="sidebar-logo">
          <svg width="32" height="32" viewBox="0 0 48 48">
            <defs>
              <linearGradient id="sg" x1="0" y1="0" x2="48" y2="48">
                <stop offset="0%" stop-color="#3B82F6"/>
                <stop offset="100%" stop-color="#2563EB"/>
              </linearGradient>
            </defs>
            <circle cx="24" cy="24" r="22" fill="url(#sg)"/>
            <path d="M14 30L24 12L34 30" stroke="white" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
            <line x1="18" y1="24" x2="30" y2="24" stroke="white" stroke-width="2" stroke-linecap="round"/>
          </svg>
        </div>
        <div class="sidebar-header-text">
          <h2>MY TRAVEL</h2>
          <span>Gestão de Viagens</span>
        </div>
      </div>
      <nav class="sidebar-nav">
        <div class="nav-section-label">Menu</div>
        ${NAV_ITEMS.map(item => `
          <button class="nav-item" data-route="/${item.id}" id="nav-${item.id}">
            <span class="nav-item-icon">${icon(item.icon, 20)}</span>
            <span class="nav-text">${item.label}</span>
            ${item.id === 'reminders' ? `<span class="nav-badge" id="reminder-badge" style="display:none">0</span>` : ''}
          </button>
        `).join('')}
        
        ${trips.length > 0 ? `
          <div class="nav-section-label" style="margin-top: var(--space-4)">Viagens Recentes</div>
          <div class="sidebar-trip-list">
            ${trips.slice(0, 3).map(t => `
              <button class="nav-item" data-route="/trip/${t.id}">
                <span class="nav-item-icon">✈️</span>
                <span class="nav-text" style="font-size:var(--font-sm)">${t.name}</span>
              </button>
            `).join('')}
          </div>
        ` : ''}
      </nav>
      <div class="sidebar-footer">
        <button class="nav-item" id="nav-logout">
          <span class="nav-item-icon">${icon('logout', 20)}</span>
          <span class="nav-text">Sair</span>
        </button>
      </div>
    </div>

    <!-- Sidebar Overlay (mobile) -->
    <div class="sidebar-overlay" id="sidebar-overlay"></div>

    <!-- Main Area -->
    <div class="main-area" id="main-area">
      <!-- Header -->
      <header class="header" id="header">
        <div class="header-left">
          <button class="header-menu-btn" id="menu-toggle">
            ${icon('menu', 22)}
          </button>
          <div class="header-breadcrumb">
            <span>MY TRAVEL</span>
            <span style="color:var(--text-tertiary)">/</span>
            <span class="header-breadcrumb-current" id="breadcrumb-current">Dashboard</span>
          </div>
          <div class="header-search search-box" style="margin-left:var(--space-4)">
            <span class="search-box-icon">${icon('search', 18)}</span>
            <input type="text" placeholder="Buscar viagens, despesas..." id="global-search-input" />
          </div>
        </div>
        <div class="header-right">
          <button class="header-action-btn" id="search-mobile-btn" style="display:none">
            ${icon('search', 20)}
          </button>
          <button class="header-action-btn" id="notification-btn">
            ${icon('reminders', 20)}
            <span class="notification-dot" id="notification-dot" style="display:none"></span>
          </button>
          <button class="header-action-btn theme-toggle" id="theme-toggle">
            ${settings.theme === 'dark' ? icon('sun', 20) : icon('moon', 20)}
          </button>
        </div>
      </header>

      <!-- Content Area -->
      <main class="content-area" id="content-area">
        <!-- Page content renders here -->
      </main>
    </div>

    <!-- Bottom Navigation (Mobile) -->
    <nav class="bottom-nav" id="bottom-nav">
      ${BOTTOM_NAV_ITEMS.map(item => `
        <button class="bottom-nav-item" data-route="/${item.id}" id="bnav-${item.id}">
          ${icon(item.icon, 22)}
          <span>${item.label}</span>
        </button>
      `).join('')}
    </nav>

    <!-- Global Search Overlay -->
    <div class="global-search-overlay" id="search-overlay">
      <div class="global-search">
        <div class="global-search-input">
          ${icon('search', 20)}
          <input type="text" placeholder="Buscar viagens, despesas, reservas..." id="search-overlay-input" />
          <kbd style="font-size:11px;padding:2px 6px;background:var(--bg-tertiary);border-radius:4px;color:var(--text-tertiary)">ESC</kbd>
        </div>
        <div class="global-search-results" id="search-results">
          <div class="search-empty">Digite para buscar...</div>
        </div>
      </div>
    </div>
  `;

  _bindEvents();
  _updateActiveNav();
  _updateReminderBadge();
}

function _bindEvents() {
  // Navigation clicks
  document.querySelectorAll('[data-route]').forEach(el => {
    el.addEventListener('click', () => {
      router.navigate(el.dataset.route);
      _closeMobileSidebar();
    });
  });

  // Mobile menu toggle
  document.getElementById('menu-toggle')?.addEventListener('click', _toggleMobileSidebar);
  document.getElementById('sidebar-overlay')?.addEventListener('click', _closeMobileSidebar);

  // Theme toggle
  document.getElementById('theme-toggle')?.addEventListener('click', _toggleTheme);

  // Search
  const searchInput = document.getElementById('global-search-input');
  if (searchInput) {
    searchInput.addEventListener('focus', () => _openSearch());
    searchInput.addEventListener('input', debounce((e) => _performSearch(e.target.value), 200));
  }

  // Mobile search button
  document.getElementById('search-mobile-btn')?.addEventListener('click', _openSearch);

  // Search overlay
  const searchOverlay = document.getElementById('search-overlay');
  searchOverlay?.addEventListener('click', (e) => {
    if (e.target === searchOverlay) _closeSearch();
  });

  const searchOverlayInput = document.getElementById('search-overlay-input');
  if (searchOverlayInput) {
    searchOverlayInput.addEventListener('input', debounce((e) => _performSearch(e.target.value), 200));
  }

  // Escape key for search
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') _closeSearch();
    if (e.key === 'k' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      _openSearch();
    }
  });

  // Logout
  document.getElementById('nav-logout')?.addEventListener('click', async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) location.reload();
  });

  // Notification button
  document.getElementById('notification-btn')?.addEventListener('click', () => {
    router.navigate('/reminders');
  });

  // Show mobile search btn on small screens
  const mq = window.matchMedia('(max-width: 768px)');
  const updateMobileUI = (e) => {
    const btn = document.getElementById('search-mobile-btn');
    if (btn) btn.style.display = e.matches ? 'flex' : 'none';
  };
  mq.addEventListener('change', updateMobileUI);
  updateMobileUI(mq);
}

function _toggleMobileSidebar() {
  document.getElementById('sidebar')?.classList.toggle('mobile-open');
  document.getElementById('sidebar-overlay')?.classList.toggle('active');
}

function _closeMobileSidebar() {
  document.getElementById('sidebar')?.classList.remove('mobile-open');
  document.getElementById('sidebar-overlay')?.classList.remove('active');
}

function _toggleTheme() {
  const html = document.documentElement;
  const current = html.getAttribute('data-theme');
  const next = current === 'dark' ? 'light' : 'dark';
  html.setAttribute('data-theme', next);
  storage.updateSettings({ theme: next });

  const btn = document.getElementById('theme-toggle');
  if (btn) {
    btn.innerHTML = next === 'dark' 
      ? icon('sun', 20) 
      : icon('moon', 20);
  }
}

function _openSearch() {
  const overlay = document.getElementById('search-overlay');
  overlay?.classList.add('active');
  setTimeout(() => {
    document.getElementById('search-overlay-input')?.focus();
  }, 100);
}

function _closeSearch() {
  document.getElementById('search-overlay')?.classList.remove('active');
}

function _performSearch(query) {
  const resultsEl = document.getElementById('search-results');
  if (!resultsEl) return;

  if (!query || query.length < 2) {
    resultsEl.innerHTML = '<div class="search-empty">Digite para buscar...</div>';
    return;
  }

  const q = query.toLowerCase();
  const results = [];

  // Search trips
  storage.getTrips().forEach(trip => {
    if (trip.name.toLowerCase().includes(q) || trip.destination?.toLowerCase().includes(q)) {
      results.push({
        type: 'Viagem',
        icon: '✈️',
        title: trip.name,
        subtitle: trip.destination,
        route: `/trip/${trip.id}`
      });
    }
  });

  // Search expenses
  storage.getExpenses().forEach(exp => {
    if (exp.description?.toLowerCase().includes(q)) {
      const trip = storage.getTrip(exp.tripId);
      results.push({
        type: 'Despesa',
        icon: '💰',
        title: exp.description,
        subtitle: trip ? trip.name : '',
        route: `/trip/${exp.tripId}`
      });
    }
  });

  // Search reservations
  storage.getReservations().forEach(res => {
    if (res.title?.toLowerCase().includes(q) || res.confirmationCode?.toLowerCase().includes(q)) {
      results.push({
        type: 'Reserva',
        icon: '📅',
        title: res.title,
        subtitle: res.confirmationCode || '',
        route: `/trip/${res.tripId}`
      });
    }
  });

  if (results.length === 0) {
    resultsEl.innerHTML = '<div class="search-empty">Nenhum resultado encontrado</div>';
    return;
  }

  resultsEl.innerHTML = results.slice(0, 10).map(r => `
    <div class="search-result-item" data-route="${r.route}">
      <div class="search-result-icon">${r.icon}</div>
      <div class="search-result-text">
        <h4>${r.title}</h4>
        <span>${r.type}${r.subtitle ? ' · ' + r.subtitle : ''}</span>
      </div>
    </div>
  `).join('');

  resultsEl.querySelectorAll('[data-route]').forEach(el => {
    el.addEventListener('click', () => {
      router.navigate(el.dataset.route);
      _closeSearch();
    });
  });
}

export function updateActiveNav(route) {
  // Update sidebar nav
  document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
  
  const routeBase = route?.split('/')[1] || 'dashboard';
  const navItem = document.getElementById(`nav-${routeBase}`);
  if (navItem) navItem.classList.add('active');

  // Update bottom nav
  document.querySelectorAll('.bottom-nav-item').forEach(el => el.classList.remove('active'));
  const bnavItem = document.getElementById(`bnav-${routeBase}`);
  if (bnavItem) bnavItem.classList.add('active');

  // Update breadcrumb
  const breadcrumb = document.getElementById('breadcrumb-current');
  const labels = {
    dashboard: 'Dashboard',
    trips: 'Viagens',
    trip: 'Detalhes da Viagem',
    finances: 'Finanças',
    reservations: 'Reservas',
    documents: 'Documentos',
    checklist: 'Checklist',
    reminders: 'Lembretes',
    settings: 'Configurações'
  };
  if (breadcrumb) breadcrumb.textContent = labels[routeBase] || 'Dashboard';
}

function _updateActiveNav() {
  const hash = window.location.hash.slice(1) || '/dashboard';
  updateActiveNav(hash);
}

function _updateReminderBadge() {
  const upcoming = storage.getUpcomingReminders();
  const badge = document.getElementById('reminder-badge');
  const dot = document.getElementById('notification-dot');
  
  if (badge) {
    if (upcoming.length > 0) {
      badge.style.display = 'flex';
      badge.textContent = upcoming.length;
    } else {
      badge.style.display = 'none';
    }
  }
  if (dot) {
    dot.style.display = upcoming.length > 0 ? 'block' : 'none';
  }
}

export function refreshApp() {
  _updateReminderBadge();
}
