// ==========================================
// MY TRAVEL — SPA Router
// ==========================================

class Router {
  constructor() {
    this.routes = {};
    this.currentRoute = null;
    this.params = {};
    this.onNavigate = null;
    window.addEventListener('hashchange', () => this._handleRoute());
  }

  register(path, handler) {
    this.routes[path] = handler;
  }

  navigate(path) {
    window.location.hash = path;
  }

  _parseHash() {
    const hash = window.location.hash.slice(1) || '/dashboard';
    const parts = hash.split('/').filter(Boolean);
    this.params = {};

    // Check for parameterized routes like /trip/:id
    for (const route of Object.keys(this.routes)) {
      const routeParts = route.split('/').filter(Boolean);
      if (routeParts.length !== parts.length) continue;

      let match = true;
      const params = {};
      for (let i = 0; i < routeParts.length; i++) {
        if (routeParts[i].startsWith(':')) {
          params[routeParts[i].slice(1)] = parts[i];
        } else if (routeParts[i] !== parts[i]) {
          match = false;
          break;
        }
      }

      if (match) {
        this.params = params;
        return route;
      }
    }

    return '/' + parts.join('/');
  }

  _handleRoute() {
    const route = this._parseHash();
    const handler = this.routes[route];

    if (handler) {
      this.currentRoute = route;
      handler(this.params);
      if (this.onNavigate) this.onNavigate(route, this.params);
    } else {
      // Fallback to dashboard
      this.navigate('/dashboard');
    }
  }

  start() {
    if (!window.location.hash) {
      window.location.hash = '/dashboard';
    }
    this._handleRoute();
  }

  getCurrentRoute() {
    return this.currentRoute;
  }

  getParams() {
    return this.params;
  }
}

export const router = new Router();
export default router;
