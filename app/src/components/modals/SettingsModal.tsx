import { createSignal, Show, For } from 'solid-js';
import type { UserPresenceStatus, UserSession } from '../../types';

export type ExtendedSettingsTab =
  | 'account'
  | 'profile'
  | 'voice_video'
  | 'appearance'
  | 'privacy';

interface SettingsModalProps {
  show: boolean;
  onClose: () => void;
  tab: any;
  onTabChange: (tab: any) => void;
  currentUser?: UserSession;
  username: string;
  onUsernameChange: (val: string) => void;
  customStatus: string;
  onCustomStatusChange: (val: string) => void;
  bio: string;
  onBioChange: (val: string) => void;
  userStatus: UserPresenceStatus;
  onUserStatusChange: (val: UserPresenceStatus) => void;
  avatar: string;
  onAvatarChange: (val: string) => void;
  avatarDecoration: string;
  onAvatarDecorationChange: (val: string) => void;
  banner: string;
  onBannerChange: (val: string) => void;
  theme: string;
  onThemeChange: (val: string) => void;
  audioLevel: number;
  inputMode?: 'voice_activity' | 'push_to_talk';
  onInputModeChange?: (mode: 'voice_activity' | 'push_to_talk') => void;
  pttKey?: string;
  onPttKeyChange?: (key: string) => void;
  onSave: () => void;
  onLogout?: () => void;
}

const AVATAR_GRADIENTS = [
  'solar',
  'aurora',
  'cyber',
  'void',
  'emerald',
  'neon',
  'sunset',
  'nebula',
];

export function SettingsModal(props: SettingsModalProps) {
  const [activeSubTab, setActiveSubTab] = createSignal<ExtendedSettingsTab>('account');
  const [showEmail, setShowEmail] = createSignal(false);
  const [saveToast, setSaveToast] = createSignal(false);

  const handleSave = () => {
    props.onSave();
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 2500);
  };

  const userEmail = () =>
    props.currentUser?.email || `${props.username.toLowerCase().replace(/\s+/g, '')}@nexos.im`;

  const userId = () => props.currentUser?.id || 'usr-local';

  return (
    <Show when={props.show}>
      <div class="settings-fullscreen-overlay">
        {/* Close ESC button */}
        <div class="settings-escape-bar" onClick={props.onClose}>
          <div class="esc-btn-circle">✕</div>
          <span class="esc-text">ESC</span>
        </div>

        <div class="settings-modal-wrapper">
          {/* Left Navigation Sidebar */}
          <div class="settings-sidebar-nav">
            {/* User Mini Card */}
            <div class="settings-user-card" onClick={() => setActiveSubTab('profile')}>
              <div class="settings-user-avatar">
                <Show
                  when={props.avatar.startsWith('http') || props.avatar.startsWith('data:')}
                  fallback={<span>{props.username.slice(0, 2).toUpperCase()}</span>}
                >
                  <img src={props.avatar} alt={props.username} class="avatar-img" />
                </Show>
              </div>
              <div class="settings-user-meta">
                <span class="settings-user-name">{props.username || 'Usuário'}</span>
                <span class="settings-edit-hint">Editar perfil ✏️</span>
              </div>
            </div>

            {/* Category: Configurações do Usuário */}
            <div class="nav-section-title">CONFIGURAÇÕES DO USUÁRIO</div>
            <button
              type="button"
              class={`settings-nav-item ${activeSubTab() === 'account' ? 'active' : ''}`}
              onClick={() => setActiveSubTab('account')}
            >
              👤 Minha Conta
            </button>
            <button
              type="button"
              class={`settings-nav-item ${activeSubTab() === 'profile' ? 'active' : ''}`}
              onClick={() => setActiveSubTab('profile')}
            >
              🎨 Perfil & Nitro
            </button>
            <button
              type="button"
              class={`settings-nav-item ${activeSubTab() === 'privacy' ? 'active' : ''}`}
              onClick={() => setActiveSubTab('privacy')}
            >
              🔒 Dados e Privacidade
            </button>

            {/* Category: Configurações do Aplicativo */}
            <div class="nav-section-title">CONFIGURAÇÕES DO APLICATIVO</div>
            <button
              type="button"
              class={`settings-nav-item ${activeSubTab() === 'voice_video' ? 'active' : ''}`}
              onClick={() => setActiveSubTab('voice_video')}
            >
              🎙️ Voz & Vídeo
            </button>
            <button
              type="button"
              class={`settings-nav-item ${activeSubTab() === 'appearance' ? 'active' : ''}`}
              onClick={() => setActiveSubTab('appearance')}
            >
              🎨 Aparência & Temas
            </button>

            <div class="nav-divider" />

            {/* Logout button */}
            <button
              type="button"
              class="settings-nav-item danger"
              onClick={() => {
                if (confirm('Deseja realmente sair da sua conta?')) {
                  props.onClose();
                  props.onLogout?.();
                }
              }}
            >
              🚪 Sair da Conta
            </button>

            <div class="settings-version-footer">
              <span>Nexos v1.0.0 Stable</span>
              <span>WebRTC HD Mesh · Fastify Core</span>
            </div>
          </div>

          {/* Right Content Area */}
          <div class="settings-content-pane">
            <Show when={saveToast()}>
              <div class="save-toast-banner">
                ✅ Alterações salvas com sucesso!
              </div>
            </Show>

            {/* 1. MINHA CONTA */}
            <Show when={activeSubTab() === 'account'}>
              <div class="pane-header">
                <h2>Informações da conta</h2>
              </div>

              {/* Account Info Box */}
              <div class="discord-settings-card">
                <div class="settings-row-item">
                  <div class="row-meta">
                    <span class="row-label">NOME DE USUÁRIO</span>
                    <span class="row-value">{props.username}</span>
                  </div>
                  <button
                    type="button"
                    class="btn-discord-edit"
                    onClick={() => setActiveSubTab('profile')}
                  >
                    Editar
                  </button>
                </div>

                <div class="settings-row-item">
                  <div class="row-meta">
                    <span class="row-label">E-MAIL</span>
                    <span class="row-value">
                      {showEmail() ? userEmail() : '••••••••••••••••'}
                    </span>
                  </div>
                  <div class="row-actions">
                    <button
                      type="button"
                      class="btn-text-link"
                      onClick={() => setShowEmail(!showEmail())}
                    >
                      {showEmail() ? 'Ocultar' : 'Mostrar'}
                    </button>
                  </div>
                </div>

                <div class="settings-row-item no-border">
                  <div class="row-meta">
                    <span class="row-label">ID DA CONTA</span>
                    <span class="row-value" style={{ 'font-family': 'monospace' }}>
                      {userId()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Password and Security */}
              <div class="pane-header sub">
                <h3>Senha e segurança</h3>
              </div>

              <div class="discord-settings-card">
                <div class="settings-row-item">
                  <div class="row-meta">
                    <span class="row-label">STATUS DE SESSÃO</span>
                    <span class="row-value" style={{ color: '#06d6a0' }}>
                      Sessão Criptografada Ativa
                    </span>
                  </div>
                </div>

                <div class="settings-row-item no-border">
                  <div class="row-meta">
                    <span class="row-label">GATEWAY WEBSOCKET</span>
                    <span class="row-value">Conectado (ws://localhost:5177)</span>
                  </div>
                </div>
              </div>

              {/* Account Status */}
              <div class="pane-header sub">
                <h3>Status da Conta</h3>
              </div>
              <div class="discord-settings-card status-good">
                <div class="status-good-content">
                  <span class="check-icon">✅</span>
                  <div>
                    <span class="status-good-title">Sua conta está toda em ordem</span>
                    <p class="status-good-sub">
                      Conexão em tempo real estabelecida e permissões autenticadas.
                    </p>
                  </div>
                </div>
              </div>
            </Show>

            {/* 2. PERFIL & NITRO */}
            <Show when={activeSubTab() === 'profile'}>
              <div class="pane-header">
                <h2>Perfis & Customização Nitro</h2>
              </div>

              <div class="form-group">
                <label>NOME DE EXIBIÇÃO</label>
                <input
                  type="text"
                  value={props.username}
                  onInput={(e) => props.onUsernameChange(e.currentTarget.value)}
                />
              </div>

              <div class="form-group">
                <label>STATUS PERSONALIZADO</label>
                <input
                  type="text"
                  placeholder='Ex: "We are but Unkindled..." ou jogando UnrealMu'
                  value={props.customStatus}
                  onInput={(e) => props.onCustomStatusChange(e.currentTarget.value)}
                />
              </div>

              <div class="form-group">
                <label>SOBRE MIM (BIO)</label>
                <textarea
                  class="chat-input"
                  style={{ height: '70px', resize: 'none' }}
                  placeholder="Conte um pouco sobre você..."
                  value={props.bio}
                  onInput={(e) => props.onBioChange(e.currentTarget.value)}
                />
              </div>

              <div class="form-group">
                <label>PRESENÇA / STATUS</label>
                <select
                  value={props.userStatus}
                  onChange={(e) =>
                    props.onUserStatusChange(e.currentTarget.value as UserPresenceStatus)
                  }
                >
                  <option value="online">🟢 Online</option>
                  <option value="idle">🟡 Ausente (Idle)</option>
                  <option value="dnd">🔴 Não Perturbe (DND)</option>
                  <option value="offline">⚪ Invisível</option>
                </select>
              </div>

              <div class="form-group">
                <label>FOTO OU GIF DE AVATAR</label>
                <div style={{ display: 'flex', gap: '8px', 'align-items': 'center' }}>
                  <input
                    type="text"
                    placeholder="Cole o link direto da imagem/GIF ou use o botão ->"
                    value={
                      props.avatar.startsWith('http') || props.avatar.startsWith('data:')
                        ? props.avatar
                        : ''
                    }
                    onInput={(e) => props.onAvatarChange(e.currentTarget.value || 'solar')}
                    style={{ flex: 1 }}
                  />
                  <label class="btn-secondary" style={{ cursor: 'pointer', 'font-size': '0.85rem' }}>
                    📁 Upload PC
                    <input
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={(e) => {
                        const file = e.currentTarget.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (ev) => {
                            if (ev.target?.result) props.onAvatarChange(ev.target.result as string);
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </label>
                </div>
              </div>

              <div class="form-group">
                <label>MOLDURA / DECORAÇÃO DE AVATAR (ESTILO NITRO)</label>
                <div class="avatar-chips-grid">
                  <button
                    type="button"
                    class={`avatar-chip-btn ${props.avatarDecoration === 'none' ? 'active' : ''}`}
                    onClick={() => props.onAvatarDecorationChange('none')}
                  >
                    <span>⚪</span>
                    <span class="avatar-chip-name">Nenhuma</span>
                  </button>
                  <button
                    type="button"
                    class={`avatar-chip-btn ${props.avatarDecoration === 'flame' ? 'active' : ''}`}
                    onClick={() => props.onAvatarDecorationChange('flame')}
                  >
                    <span>🔥</span>
                    <span class="avatar-chip-name">Mystic Flame</span>
                  </button>
                  <button
                    type="button"
                    class={`avatar-chip-btn ${props.avatarDecoration === 'cyber' ? 'active' : ''}`}
                    onClick={() => props.onAvatarDecorationChange('cyber')}
                  >
                    <span>⚡</span>
                    <span class="avatar-chip-name">Cyber Pulse</span>
                  </button>
                  <button
                    type="button"
                    class={`avatar-chip-btn ${props.avatarDecoration === 'gold' ? 'active' : ''}`}
                    onClick={() => props.onAvatarDecorationChange('gold')}
                  >
                    <span>👑</span>
                    <span class="avatar-chip-name">Golden VIP</span>
                  </button>
                  <button
                    type="button"
                    class={`avatar-chip-btn ${props.avatarDecoration === 'galaxy' ? 'active' : ''}`}
                    onClick={() => props.onAvatarDecorationChange('galaxy')}
                  >
                    <span>🌌</span>
                    <span class="avatar-chip-name">Cosmic Galaxy</span>
                  </button>
                  <button
                    type="button"
                    class={`avatar-chip-btn ${props.avatarDecoration === 'matrix' ? 'active' : ''}`}
                    onClick={() => props.onAvatarDecorationChange('matrix')}
                  >
                    <span>🟩</span>
                    <span class="avatar-chip-name">Matrix Circuit</span>
                  </button>
                </div>
              </div>

              <div class="form-group">
                <label>CAPA DE PERFIL (BANNER IMAGEM / GIF)</label>
                <div style={{ display: 'flex', gap: '8px', 'align-items': 'center' }}>
                  <input
                    type="text"
                    placeholder="Link de imagem/GIF para a capa"
                    value={props.banner}
                    onInput={(e) => props.onBannerChange(e.currentTarget.value)}
                    style={{ flex: 1 }}
                  />
                  <label class="btn-secondary" style={{ cursor: 'pointer', 'font-size': '0.85rem' }}>
                    📁 Upload Capa
                    <input
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={(e) => {
                        const file = e.currentTarget.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (ev) => {
                            if (ev.target?.result) props.onBannerChange(ev.target.result as string);
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </label>
                </div>
              </div>

              <div class="form-group">
                <label>AVATARES DE GRADIENTE PADRÃO</label>
                <div class="avatar-grid">
                  <For each={AVATAR_GRADIENTS}>
                    {(av) => (
                      <div
                        class={`avatar-select-btn avatar-${av} ${
                          props.avatar === av ? 'active' : ''
                        }`}
                        onClick={() => props.onAvatarChange(av)}
                      />
                    )}
                  </For>
                </div>
              </div>

              <div style={{ 'margin-top': '20px' }}>
                <button type="button" class="btn-primary" onClick={handleSave}>
                  Salvar Alterações
                </button>
              </div>
            </Show>

            {/* 3. VOZ & VÍDEO */}
            <Show when={activeSubTab() === 'voice_video'}>
              <div class="pane-header">
                <h2>Voz & Vídeo</h2>
              </div>

              <div class="form-group">
                <label>MODO DE ENTRADA</label>
                <div style={{ display: 'flex', gap: '10px', 'margin-top': '6px' }}>
                  <button
                    type="button"
                    class={`btn-secondary ${
                      props.inputMode === 'voice_activity' ? 'active' : ''
                    }`}
                    style={{
                      flex: 1,
                      padding: '12px',
                      'border-color':
                        props.inputMode === 'voice_activity' ? '#8a2be2' : undefined,
                      background:
                        props.inputMode === 'voice_activity'
                          ? 'rgba(138,43,226,0.2)'
                          : undefined,
                    }}
                    onClick={() => props.onInputModeChange?.('voice_activity')}
                  >
                    🎙️ Ativação por Voz (Automático)
                  </button>
                  <button
                    type="button"
                    class={`btn-secondary ${
                      props.inputMode === 'push_to_talk' ? 'active' : ''
                    }`}
                    style={{
                      flex: 1,
                      padding: '12px',
                      'border-color':
                        props.inputMode === 'push_to_talk' ? '#8a2be2' : undefined,
                      background:
                        props.inputMode === 'push_to_talk'
                          ? 'rgba(138,43,226,0.2)'
                          : undefined,
                    }}
                    onClick={() => props.onInputModeChange?.('push_to_talk')}
                  >
                    📻 Pressionar para Falar (PTT)
                  </button>
                </div>
              </div>

              <Show when={props.inputMode === 'push_to_talk'}>
                <div class="form-group">
                  <label>TECLA DE ATALHO DO PUSH-TO-TALK</label>
                  <div style={{ display: 'flex', gap: '8px', 'align-items': 'center' }}>
                    <input
                      type="text"
                      readonly
                      value={`Tecla Atual: [ ${props.pttKey || 'Space'} ]`}
                      style={{
                        flex: 1,
                        'font-weight': '700',
                        color: '#06d6a0',
                        background: 'rgba(0,0,0,0.4)',
                      }}
                    />
                    <button
                      type="button"
                      class="btn-primary"
                      onClick={() => {
                        const handleKey = (ev: KeyboardEvent) => {
                          ev.preventDefault();
                          props.onPttKeyChange?.(ev.code);
                          window.removeEventListener('keydown', handleKey);
                        };
                        window.addEventListener('keydown', handleKey, { once: true });
                        alert('Pressione a tecla desejada no teclado agora...');
                      }}
                    >
                      Gravar Tecla
                    </button>
                  </div>
                </div>
              </Show>

              <div class="device-test-box">
                <h4>Teste de Microfone</h4>
                <p>Fale no seu microfone para testar o nível de sensibilidade:</p>
                <div class="audio-visualizer-bar full-width">
                  <div class="audio-level" style={{ width: `${props.audioLevel}%` }} />
                </div>
              </div>
            </Show>

            {/* 4. APARÊNCIA & TEMAS */}
            <Show when={activeSubTab() === 'appearance'}>
              <div class="pane-header">
                <h2>Aparência & Temas</h2>
              </div>
              <div class="theme-picker-grid">
                <button
                  type="button"
                  class={`theme-card-btn ${props.theme === 'dark-onyx' ? 'active' : ''}`}
                  onClick={() => props.onThemeChange('dark-onyx')}
                >
                  <div class="theme-preview-dots">
                    <div class="theme-dot" style={{ background: '#0c0d14' }} />
                    <div class="theme-dot" style={{ background: '#8a2be2' }} />
                    <div class="theme-dot" style={{ background: '#06d6a0' }} />
                  </div>
                  <span class="theme-card-name">🪐 Dark Onyx (Padrão)</span>
                </button>

                <button
                  type="button"
                  class={`theme-card-btn ${props.theme === 'cyberpunk' ? 'active' : ''}`}
                  onClick={() => props.onThemeChange('cyberpunk')}
                >
                  <div class="theme-preview-dots">
                    <div class="theme-dot" style={{ background: '#070913' }} />
                    <div class="theme-dot" style={{ background: '#f72585' }} />
                    <div class="theme-dot" style={{ background: '#00f5d4' }} />
                  </div>
                  <span class="theme-card-name">⚡ Cyberpunk</span>
                </button>

                <button
                  type="button"
                  class={`theme-card-btn ${props.theme === 'oled' ? 'active' : ''}`}
                  onClick={() => props.onThemeChange('oled')}
                >
                  <div class="theme-preview-dots">
                    <div class="theme-dot" style={{ background: '#000000' }} />
                    <div class="theme-dot" style={{ background: '#a855f7' }} />
                    <div class="theme-dot" style={{ background: '#3b82f6' }} />
                  </div>
                  <span class="theme-card-name">🌑 Pure OLED</span>
                </button>

                <button
                  type="button"
                  class={`theme-card-btn ${props.theme === 'nebula' ? 'active' : ''}`}
                  onClick={() => props.onThemeChange('nebula')}
                >
                  <div class="theme-preview-dots">
                    <div class="theme-dot" style={{ background: '#0f091a' }} />
                    <div class="theme-dot" style={{ background: '#c084fc' }} />
                    <div class="theme-dot" style={{ background: '#f472b6' }} />
                  </div>
                  <span class="theme-card-name">🔮 Nebula Dream</span>
                </button>
              </div>
            </Show>

            {/* 5. DADOS & PRIVACIDADE */}
            <Show when={activeSubTab() === 'privacy'}>
              <div class="pane-header">
                <h2>Dados e Privacidade</h2>
              </div>
              <div class="discord-settings-card">
                <div class="settings-row-item">
                  <div class="row-meta">
                    <span class="row-label">PERMITIR MENSAGENS DIRETAS</span>
                    <span class="row-value">Permitir DMs de membros de servidores</span>
                  </div>
                  <button type="button" class="btn-discord-edit">Ativado</button>
                </div>
                <div class="settings-row-item no-border">
                  <div class="row-meta">
                    <span class="row-label">CRIPTOGRAFIA P2P</span>
                    <span class="row-value" style={{ color: '#06d6a0' }}>
                      WebRTC DTLS / SRTP Ativa
                    </span>
                  </div>
                </div>
              </div>
            </Show>
          </div>
        </div>
      </div>
    </Show>
  );
}
