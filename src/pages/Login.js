// ==========================================
// MY TRAVEL — Login Page
// ==========================================

import storage from '../services/storage.js';
import supabase from '../services/supabase.js';
import { toast } from '../components/Toast.js';
import { icon } from '../utils/icons.js';

export function renderLogin(onSuccess) {
  const app = document.getElementById('app');
  let isSignUp = false;

  const render = () => {
    app.innerHTML = `
      <div class="login-page">
        <div class="login-card">
          <div class="login-logo">
            <svg width="64" height="64" viewBox="0 0 48 48">
              <defs>
                <linearGradient id="lg" x1="0" y1="0" x2="48" y2="48">
                  <stop offset="0%" stop-color="#3B82F6"/>
                  <stop offset="100%" stop-color="#2563EB"/>
                </linearGradient>
              </defs>
              <circle cx="24" cy="24" r="22" fill="url(#lg)"/>
              <path d="M14 30L24 12L34 30" stroke="white" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
              <line x1="18" y1="24" x2="30" y2="24" stroke="white" stroke-width="2" stroke-linecap="round"/>
            </svg>
            <h1>MY TRAVEL</h1>
            <p>${isSignUp ? 'Crie sua conta para começar' : 'Bem-vindo de volta!'}</p>
          </div>
          <form class="login-form" id="login-form">
            <div class="form-group">
              <label class="form-label">E-mail</label>
              <input type="email" class="form-input" id="login-email" placeholder="seu@email.com" required />
            </div>
            ${isSignUp ? `
              <div class="form-group">
                <label class="form-label">Seu Nome</label>
                <input type="text" class="form-input" id="login-name" placeholder="Como quer ser chamado?" required />
              </div>
            ` : ''}
            <div class="form-group">
              <label class="form-label">Senha</label>
              <input type="password" class="form-input" id="login-password" placeholder="Mínimo 6 caracteres" required minlength="6" />
            </div>
            <button type="submit" class="btn btn-primary btn-lg" id="btn-submit">
              ${isSignUp ? 'Criar Conta' : 'Entrar'}
            </button>
          </form>
          <p style="text-align:center;margin-top:var(--space-4);color:var(--text-secondary);font-size:var(--font-sm)">
            ${isSignUp ? 'Já tem uma conta?' : 'Ainda não tem conta?'} 
            <button class="btn btn-ghost btn-sm" id="btn-toggle-mode" style="padding:0;height:auto;color:var(--primary-500);font-weight:bold">
              ${isSignUp ? 'Fazer Login' : 'Cadastre-se'}
            </button>
          </p>
        </div>
      </div>
    `;

    _bindEvents();
  };

  const _bindEvents = () => {
    document.getElementById('btn-toggle-mode')?.addEventListener('click', () => {
      isSignUp = !isSignUp;
      render();
    });

    document.getElementById('login-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('login-email')?.value?.trim();
      const password = document.getElementById('login-password')?.value;
      const name = document.getElementById('login-name')?.value?.trim();
      const btn = document.getElementById('btn-submit');

      if (!email || !password) return;
      
      btn.disabled = true;
      btn.textContent = 'Aguarde...';

      try {
        if (isSignUp) {
          const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: { full_name: name || 'Viajante' }
            }
          });

          if (error) throw error;
          
          if (data.user) {
            // Create profile
            await supabase.from('profiles').insert({
              id: data.user.id,
              full_name: name || 'Viajante',
              avatar_url: `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'V')}&background=random`
            });

            toast.success('Conta criada! Verifique seu e-mail (se necessário).');
            if (data.session) onSuccess();
            else {
              isSignUp = false;
              render();
            }
          }
        } else {
          const { error } = await supabase.auth.signInWithPassword({ email, password });
          if (error) throw error;
          toast.success('Bem-vindo de volta!');
          onSuccess();
        }
      } catch (err) {
        toast.error(err.message || 'Erro na autenticação');
        btn.disabled = false;
        btn.textContent = isSignUp ? 'Criar Conta' : 'Entrar';
      }
    });
  };

  render();
}

