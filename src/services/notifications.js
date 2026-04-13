// ==========================================
// MY TRAVEL — Notification Service
// ==========================================

class NotificationService {
  constructor() {
    this.permission = 'default';
    this.checkInterval = null;
  }

  async requestPermission() {
    if (!('Notification' in window)) return false;
    const result = await Notification.requestPermission();
    this.permission = result;
    return result === 'granted';
  }

  isGranted() {
    return 'Notification' in window && Notification.permission === 'granted';
  }

  show(title, options = {}) {
    if (!this.isGranted()) return null;
    try {
      return new Notification(title, {
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-96x96.png',
        vibrate: [200, 100, 200],
        ...options
      });
    } catch (e) {
      console.warn('Notification error:', e);
      return null;
    }
  }

  startReminderCheck(storage, onReminder) {
    if (this.checkInterval) return;
    this.checkInterval = setInterval(() => {
      const dueReminders = storage.getDueReminders();
      dueReminders.forEach(reminder => {
        storage.updateReminder(reminder.id, { triggered: true });
        this.show(reminder.title, {
          body: 'Lembrete para sua viagem',
          tag: `reminder-${reminder.id}`
        });
        if (onReminder) onReminder(reminder);
      });
    }, 30000);
  }

  stopReminderCheck() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }
}

export const notifications = new NotificationService();
export default notifications;
