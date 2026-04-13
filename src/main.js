// ==========================================
// MY TRAVEL — Main Entry Point
// ==========================================

import './styles/index.css';
import { router } from './router.js';
import storage from './services/storage.js';
import { notifications } from './services/notifications.js';
import { currencyService } from './services/currency.js';
import { renderApp, updateActiveNav, refreshApp } from './components/App.js';
import { renderLogin } from './pages/Login.js';
import { renderDashboard } from './pages/Dashboard.js';
import { renderTrips } from './pages/Trips.js';
import { renderTripDetail } from './pages/TripDetail.js';
import { renderFinances } from './pages/Finances.js';
import { renderReservations } from './pages/Reservations.js';
import { renderDocuments } from './pages/Documents.js';
import { renderChecklist } from './pages/Checklist.js';
import { renderReminders } from './pages/Reminders.js';
import { renderSettings } from './pages/Settings.js';

import supabase from './services/supabase.js';

// ---- App Initialization ----

async function init() {
  // Apply saved theme
  const settings = storage.getSettings();
  document.documentElement.setAttribute('data-theme', settings.theme || 'dark');

  // Hide loading screen
  const loading = document.getElementById('loading-screen');
  if (loading) loading.classList.add('hidden');

  // Monitor Auth Changes
  supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
      if (session) {
        startApp();
      } else {
        renderLogin(() => startApp());
      }
    }
    
    if (event === 'SIGNED_OUT') {
      location.reload();
    }
  });

  // Initial Check
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    renderLogin(() => startApp());
  } else {
    startApp();
  }
}

function startApp() {
  // Render app shell
  renderApp();

  // Register routes
  router.register('/dashboard', () => renderDashboard());
  router.register('/trips', () => renderTrips());
  router.register('/trip/:id', (params) => renderTripDetail(params));
  router.register('/finances', () => renderFinances(null));
  router.register('/reservations', () => renderReservations(null));
  router.register('/documents', () => renderDocuments());
  router.register('/checklist', () => renderChecklist(null));
  router.register('/reminders', () => renderReminders());
  router.register('/settings', () => renderSettings());

  // Route change handler
  router.onNavigate = (route) => {
    updateActiveNav(route);
    refreshApp();
  };

  // Start router
  router.start();

  // Fetch exchange rates in background
  currencyService.fetchRates().catch(() => {});

  // Start reminder notifications
  const settings = storage.getSettings();
  if (settings.notifications) {
    notifications.startReminderCheck(storage, () => {
      refreshApp();
    });
  }

  // PWA install prompt
  let deferredPrompt;
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
  });
}

// ---- Start ----
document.addEventListener('DOMContentLoaded', init);

// Handle visibility change for reminder checks
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') {
    refreshApp();
  }
});
