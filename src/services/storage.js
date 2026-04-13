// ==========================================
// MY TRAVEL — Storage Service
// ==========================================

import { STORAGE_PREFIX } from '../utils/constants.js';
import { generateId } from '../utils/helpers.js';

/**
 * Storage abstraction layer for localStorage
 * Provides CRUD operations for all entities
 */
class StorageService {
  constructor() {
    this.prefix = STORAGE_PREFIX;
    this._initDefaults();
  }

  // ---- Low Level ----

  _getKey(key) {
    return `${this.prefix}${key}`;
  }

  _get(key) {
    try {
      const raw = localStorage.getItem(this._getKey(key));
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  _set(key, value) {
    try {
      localStorage.setItem(this._getKey(key), JSON.stringify(value));
      return true;
    } catch (e) {
      console.error('Storage error:', e);
      return false;
    }
  }

  _remove(key) {
    localStorage.removeItem(this._getKey(key));
  }

  _initDefaults() {
    if (!this._get('trips')) this._set('trips', []);
    if (!this._get('expenses')) this._set('expenses', []);
    if (!this._get('activities')) this._set('activities', []);
    if (!this._get('reservations')) this._set('reservations', []);
    if (!this._get('documents')) this._set('documents', []);
    if (!this._get('checklists')) this._set('checklists', []);
    if (!this._get('reminders')) this._set('reminders', []);
    if (!this._get('settings')) this._set('settings', { 
      theme: 'dark', 
      currency: 'BRL',
      notifications: true
    });
  }

  // ---- Generic CRUD ----

  _getAll(collection) {
    return this._get(collection) || [];
  }

  _getById(collection, id) {
    const items = this._getAll(collection);
    return items.find(item => item.id === id) || null;
  }

  _create(collection, data) {
    const items = this._getAll(collection);
    const item = {
      ...data,
      id: generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    items.push(item);
    this._set(collection, items);
    return item;
  }

  _update(collection, id, data) {
    const items = this._getAll(collection);
    const index = items.findIndex(item => item.id === id);
    if (index === -1) return null;
    items[index] = {
      ...items[index],
      ...data,
      id,
      updatedAt: new Date().toISOString()
    };
    this._set(collection, items);
    return items[index];
  }

  _delete(collection, id) {
    const items = this._getAll(collection);
    const filtered = items.filter(item => item.id !== id);
    this._set(collection, filtered);
    return filtered.length < items.length;
  }

  // ---- Trips ----

  getTrips() { return this._getAll('trips'); }
  getTrip(id) { return this._getById('trips', id); }
  createTrip(data) { return this._create('trips', data); }
  updateTrip(id, data) { return this._update('trips', id, data); }
  deleteTrip(id) {
    // Also delete related data
    const expenses = this.getExpensesByTrip(id);
    expenses.forEach(e => this.deleteExpense(e.id));
    const activities = this.getActivitiesByTrip(id);
    activities.forEach(a => this.deleteActivity(a.id));
    const reservations = this.getReservationsByTrip(id);
    reservations.forEach(r => this.deleteReservation(r.id));
    const checklists = this.getChecklistByTrip(id);
    checklists.forEach(c => this.deleteChecklistItem(c.id));
    const reminders = this.getRemindersByTrip(id);
    reminders.forEach(r => this.deleteReminder(r.id));
    return this._delete('trips', id);
  }

  // ---- Expenses ----

  getExpenses() { return this._getAll('expenses'); }
  getExpensesByTrip(tripId) { return this._getAll('expenses').filter(e => e.tripId === tripId); }
  getExpense(id) { return this._getById('expenses', id); }
  createExpense(data) { return this._create('expenses', data); }
  updateExpense(id, data) { return this._update('expenses', id, data); }
  deleteExpense(id) { return this._delete('expenses', id); }

  getTotalExpensesByTrip(tripId) {
    return this.getExpensesByTrip(tripId).reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  }

  // ---- Activities (Itinerary) ----

  getActivities() { return this._getAll('activities'); }
  getActivitiesByTrip(tripId) { 
    return this._getAll('activities')
      .filter(a => a.tripId === tripId)
      .sort((a, b) => {
        if (a.day !== b.day) return a.day - b.day;
        return (a.order || 0) - (b.order || 0);
      });
  }
  getActivitiesByDay(tripId, day) {
    return this.getActivitiesByTrip(tripId)
      .filter(a => a.day === day)
      .sort((a, b) => (a.order || 0) - (b.order || 0));
  }
  createActivity(data) { return this._create('activities', data); }
  updateActivity(id, data) { return this._update('activities', id, data); }
  deleteActivity(id) { return this._delete('activities', id); }

  reorderActivities(tripId, day, orderedIds) {
    const all = this._getAll('activities');
    orderedIds.forEach((id, index) => {
      const item = all.find(a => a.id === id);
      if (item) item.order = index;
    });
    this._set('activities', all);
  }

  // ---- Reservations ----

  getReservations() { return this._getAll('reservations'); }
  getReservationsByTrip(tripId) { return this._getAll('reservations').filter(r => r.tripId === tripId); }
  getReservation(id) { return this._getById('reservations', id); }
  createReservation(data) { return this._create('reservations', data); }
  updateReservation(id, data) { return this._update('reservations', id, data); }
  deleteReservation(id) { return this._delete('reservations', id); }

  // ---- Documents ----

  getDocuments() { return this._getAll('documents'); }
  getDocumentsByTrip(tripId) { return this._getAll('documents').filter(d => d.tripId === tripId); }
  getDocument(id) { return this._getById('documents', id); }
  createDocument(data) { return this._create('documents', data); }
  updateDocument(id, data) { return this._update('documents', id, data); }
  deleteDocument(id) { return this._delete('documents', id); }

  // ---- Checklist ----

  getChecklist() { return this._getAll('checklists'); }
  getChecklistByTrip(tripId) { 
    return this._getAll('checklists')
      .filter(c => c.tripId === tripId)
      .sort((a, b) => (a.order || 0) - (b.order || 0));
  }
  createChecklistItem(data) { return this._create('checklists', data); }
  updateChecklistItem(id, data) { return this._update('checklists', id, data); }
  deleteChecklistItem(id) { return this._delete('checklists', id); }

  toggleChecklistItem(id) {
    const item = this._getById('checklists', id);
    if (item) {
      return this._update('checklists', id, { checked: !item.checked });
    }
    return null;
  }

  // ---- Reminders ----

  getReminders() { return this._getAll('reminders'); }
  getRemindersByTrip(tripId) { return this._getAll('reminders').filter(r => r.tripId === tripId); }
  getReminder(id) { return this._getById('reminders', id); }
  createReminder(data) { return this._create('reminders', data); }
  updateReminder(id, data) { return this._update('reminders', id, data); }
  deleteReminder(id) { return this._delete('reminders', id); }

  getUpcomingReminders() {
    const now = new Date();
    return this._getAll('reminders')
      .filter(r => !r.dismissed && new Date(r.datetime) > now)
      .sort((a, b) => new Date(a.datetime) - new Date(b.datetime));
  }

  getDueReminders() {
    const now = new Date();
    return this._getAll('reminders')
      .filter(r => !r.dismissed && !r.triggered && new Date(r.datetime) <= now);
  }

  // ---- Settings ----

  getSettings() {
    return this._get('settings') || { theme: 'dark', currency: 'BRL', notifications: true };
  }

  updateSettings(data) {
    const current = this.getSettings();
    return this._set('settings', { ...current, ...data });
  }

  // ---- Auth ----

  getUser() { 
    // Return mock for now if no real user to avoid breaking legacy?
    // Actually, Login.js already handles this. 
    return this._get('user'); 
  }

  setUser(data) { return this._set('user', data); }
  clearUser() { 
    this._remove('user');
    localStorage.removeItem('supabase.auth.token'); // Helper to clear supabase too
  }

  // ---- Data Export/Import ----

  exportAllData() {
    return {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      trips: this.getTrips(),
      expenses: this.getExpenses(),
      activities: this.getActivities(),
      reservations: this.getReservations(),
      documents: this.getDocuments(),
      checklists: this.getChecklist(),
      reminders: this.getReminders(),
      settings: this.getSettings()
    };
  }

  importData(data) {
    try {
      if (data.trips) this._set('trips', data.trips);
      if (data.expenses) this._set('expenses', data.expenses);
      if (data.activities) this._set('activities', data.activities);
      if (data.reservations) this._set('reservations', data.reservations);
      if (data.documents) this._set('documents', data.documents);
      if (data.checklists) this._set('checklists', data.checklists);
      if (data.reminders) this._set('reminders', data.reminders);
      if (data.settings) this._set('settings', data.settings);
      return true;
    } catch (e) {
      console.error('Import error:', e);
      return false;
    }
  }

  clearAllData() {
    const keys = Object.keys(localStorage).filter(k => k.startsWith(this.prefix));
    keys.forEach(k => localStorage.removeItem(k));
    this._initDefaults();
  }
}

// Singleton
export const storage = new StorageService();
export default storage;
