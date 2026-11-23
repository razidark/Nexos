import { createSignal, Show, For } from 'solid-js';

export interface UserSession {
  id: string;
  email: string;
  username: string;
  avatar: string;
  customStatus?: string;
  status: 'online' | 'idle' | 'dnd' | 'offline';
  token: string;
}

interface AuthProps {
  onSuccess: (session: UserSession) => void;
}

const AVATARS = [
  { id: 'solar', name: 'Solar', icon: '☀️', color: '#ffb703' },
  { id: 'aurora', name: 'Aurora', icon: '🌌', color: '#06d6a0' },
  { id: 'nebula', name: 'Nebula', icon: '🔮', color: '#8a2be2' },
  { id: 'void', name: 'Void', icon: '🌑', color: '#4a4e69' },
  { id: 'cyber', name: 'Cyber', icon: '⚡', color: '#00f5d4' },
  { id: 'matrix', name: 'Matrix', icon: '🟩', color: '#38b000' },
  { id: 'flame', name: 'Flame', icon: '🔥', color: '#ff5400' },
  { id: 'phantom', name: 'Phantom', icon: '👻', color: '#9d4edd' },
];

export function Auth(props: AuthProps) {
  const [mode, setMode] = createSignal<'login' | 'register'>('login');
  const [loginInput, setLoginInput] = createSignal('');
  const [email, setEmail] = createSignal('');
  const [username, setUsername] = createSignal('');
  const [password, setPassword] = createSignal('');
  const [selectedAvatar, setSelectedAvatar] = createSignal('nebula');
  const [rememberMe, setRememberMe] = createSignal(true);
  const [errorMsg, setErrorMsg] = createSignal('');
  const [isLoading, setIsLoading] = createSignal(false);
  const [showPassword, setShowPassword] = createSignal(false);

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    try {
      if (mode() === 'login') {
        if (!loginInput() || !password()) {
          setErrorMsg('Preencha seu usuário/email e a senha.');
          setIsLoading(false);
          return;
        }

        const res = await fetch('http://localhost:5177/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            login: loginInput().trim(),
            password: password(),
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          setErrorMsg(data.error || 'Erro ao realizar login.');
          setIsLoading(false);
          return;
        }

        const session: UserSession = {
          ...data.user,
          token: data.token,
        };

        if (rememberMe()) {
          localStorage.setItem('nexos_session', JSON.stringify(session));
        }

        props.onSuccess(session);
      } else {
        if (!email() || !username() || !password()) {
          setErrorMsg('Preencha todos os campos obrigatórios.');
          setIsLoading(false);
          return;
        }

        if (username().trim().length < 3) {
          setErrorMsg('O nome de usuário deve ter pelo menos 3 caracteres.');
          setIsLoading(false);
          return;
        }

        if (password().length < 4) {
          setErrorMsg('A senha deve ter pelo menos 4 caracteres.');
          setIsLoading(false);
          return;
        }

        const res = await fetch('http://localhost:5177/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: email().trim(),
            username: username().trim(),
            password: password(),
            avatar: selectedAvatar(),
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          setErrorMsg(data.error || 'Erro ao criar conta.');
          setIsLoading(false);
          return;
        }

        const session: UserSession = {
          ...data.user,
          token: data.token,
        };

        if (rememberMe()) {
          localStorage.setItem('nexos_session', JSON.stringify(session));
        }

        props.onSuccess(session);
      }
    } catch (err) {
      console.error('Auth request failed:', err);
      setErrorMsg('Não foi possível conectar ao servidor Nexos (porta 5177). Verifique se o backend está ligado.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div class="auth-viewport">
      {/* Background Animated Elements */}
      <div class="auth-bg-glow glow-1"></div>
      <div class="auth-bg-glow glow-2"></div>
      <div class="auth-grid-overlay"></div>

      <div class="auth-card">
        {/* Header */}
        <div class="auth-header">
          <div class="auth-brand-logo">
            <span class="auth-logo-icon">🪐</span>
            <div class="auth-brand-details">
              <h1 class="auth-title">NEXOS</h1>
              <span class="auth-badge">PRO EDITION</span>
            </div>
          </div>
          <p class="auth-subtitle">
            {mode() === 'login'
              ? 'Que bom te ver de volta! Acesse sua conta.'
              : 'Junte-se ao novo padrão de voz, vídeo e chat.'}
          </p>
        </div>

        {/* Tab Switcher */}
        <div class="auth-tabs">
          <button
            type="button"
            class={`auth-tab-btn ${mode() === 'login' ? 'active' : ''}`}
            onClick={() => {
              setMode('login');
              setErrorMsg('');
            }}
          >
            Entrar
          </button>
          <button
            type="button"
            class={`auth-tab-btn ${mode() === 'register' ? 'active' : ''}`}
            onClick={() => {
              setMode('register');
              setErrorMsg('');
            }}
          >
            Criar Conta
          </button>
        </div>

        {/* Error Banner */}
        <Show when={errorMsg()}>
          <div class="auth-error-banner">
            <span class="error-icon">⚠️</span>
            <span>{errorMsg()}</span>
          </div>
        </Show>

        {/* Form */}
        <form onSubmit={handleSubmit} class="auth-form">
          <Show when={mode() === 'login'}>
            <div class="auth-field">
              <label class="auth-label">E-MAIL OU NOME DE USUÁRIO <span class="required">*</span></label>
              <div class="auth-input-wrapper">
                <span class="input-icon">👤</span>
                <input
                  type="text"
                  class="auth-input"
                  placeholder="ex: voce@email.com ou seu_nick"
                  value={loginInput()}
                  onInput={(e) => setLoginInput(e.currentTarget.value)}
                  autofocus
                  required
                />
              </div>
            </div>
          </Show>

          <Show when={mode() === 'register'}>
            <div class="auth-field">
              <label class="auth-label">E-MAIL <span class="required">*</span></label>
              <div class="auth-input-wrapper">
                <span class="input-icon">✉️</span>
                <input
                  type="email"
                  class="auth-input"
                  placeholder="seu_melhor@email.com"
                  value={email()}
                  onInput={(e) => setEmail(e.currentTarget.value)}
                  required
                />
              </div>
            </div>

            <div class="auth-field">
              <label class="auth-label">NOME DE EXIBIÇÃO / NICK <span class="required">*</span></label>
              <div class="auth-input-wrapper">
                <span class="input-icon">🏷️</span>
                <input
                  type="text"
                  class="auth-input"
                  placeholder="Como seus amigos vão te chamar"
                  value={username()}
                  onInput={(e) => setUsername(e.currentTarget.value)}
                  required
                />
              </div>
            </div>

            <div class="auth-field">
              <label class="auth-label">ESCOLHA SEU AVATAR (ENERGIA OU FOTO/GIF)</label>
              <div class="avatar-chips-grid">
                <For each={AVATARS}>
                  {(av) => (
                    <button
                      type="button"
                      class={`avatar-chip-btn ${selectedAvatar() === av.id ? 'active' : ''}`}
                      onClick={() => setSelectedAvatar(av.id)}
                      title={av.name}
                    >
                      <span class="avatar-chip-icon">{av.icon}</span>
                      <span class="avatar-chip-name">{av.name}</span>
                    </button>
                  )}
                </For>
              </div>

              <div style={{ 'margin-top': '8px', display: 'flex', gap: '8px', 'align-items': 'center' }}>
                <input
                  type="text"
                  class="auth-input"
                  style={{
                    background: 'rgba(0, 0, 0, 0.35)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    'border-radius': '10px',
                    padding: '8px 12px',
                    'font-size': '0.85rem'
                  }}
                  placeholder="Ou cole o link de uma imagem/GIF..."
                  value={selectedAvatar().startsWith('http') || selectedAvatar().startsWith('data:') ? selectedAvatar() : ''}
                  onInput={(e) => setSelectedAvatar(e.currentTarget.value || 'solar')}
                />
                <label class="btn-secondary" style={{ cursor: 'pointer', 'font-size': '0.8rem', 'white-space': 'nowrap', padding: '8px 12px' }}>
                  📁 Upload
                  <input
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={(e) => {
                      const file = e.currentTarget.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (ev) => {
                          if (ev.target?.result) setSelectedAvatar(ev.target.result as string);
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                </label>
              </div>
            </div>
          </Show>

          <div class="auth-field">
            <div class="auth-label-row">
              <label class="auth-label">SENHA <span class="required">*</span></label>
              <Show when={mode() === 'login'}>
                <span class="auth-forgot-link" onClick={() => alert('Para redefinir, solicite ao administrador do servidor local.')}>
                  Esqueceu a senha?
                </span>
              </Show>
            </div>
            <div class="auth-input-wrapper">
              <span class="input-icon">🔒</span>
              <input
                type={showPassword() ? 'text' : 'password'}
                class="auth-input"
                placeholder="••••••••"
                value={password()}
                onInput={(e) => setPassword(e.currentTarget.value)}
                required
              />
              <button
                type="button"
                class="password-toggle-btn"
                onClick={() => setShowPassword(!showPassword())}
                tabindex="-1"
              >
                {showPassword() ? '👁️' : '🙈'}
              </button>
            </div>
          </div>

          <div class="auth-options-row">
            <label class="auth-checkbox-label">
              <input
                type="checkbox"
                checked={rememberMe()}
                onChange={(e) => setRememberMe(e.currentTarget.checked)}
              />
              <span>Manter conectado neste dispositivo</span>
            </label>
          </div>

          <button
            type="submit"
            class="auth-submit-btn"
            disabled={isLoading()}
          >
            {isLoading() ? (
              <span class="auth-spinner"></span>
            ) : mode() === 'login' ? (
              'Entrar no Nexos ⚡'
            ) : (
              'Criar Minha Conta 🚀'
            )}
          </button>
        </form>

        {/* Footer info */}
        <div class="auth-footer">
          <span>Privacidade em primeiro lugar • Sem rastreadores • P2P Mesh HD Voice</span>
        </div>
      </div>
    </div>
  );
}
