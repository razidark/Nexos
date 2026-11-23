import { Show } from 'solid-js';
import type { ViewMode } from '../../types';

interface MainChatHeaderProps {
  title: string;
  hasVoiceActive: boolean;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  pinnedCount?: number;
  onOpenPins: () => void;
  onOpenSoundboard: () => void;
  showMembersSidebar?: boolean;
  onToggleMembersSidebar?: () => void;
  isChannelMuted?: boolean;
  onToggleChannelMute?: () => void;
  onOpenMediaGallery?: () => void;
}

export function MainChatHeader(props: MainChatHeaderProps) {
  return (
    <div class="chat-header">
      <div class="active-channel-name">
        <span class="header-channel-icon">#</span>
        <span class="header-channel-title">{props.title}</span>
        <Show when={props.hasVoiceActive}>
          <div class="view-mode-tabs">
            <button
              class={`tab-btn ${props.viewMode === 'chat' ? 'active' : ''}`}
              onClick={() => props.onViewModeChange('chat')}
            >
              💬 Chat
            </button>
            <button
              class={`tab-btn ${props.viewMode === 'stage' ? 'active' : ''}`}
              onClick={() => props.onViewModeChange('stage')}
            >
              📹 Palco / Vídeo
            </button>
            <button
              class={`tab-btn ${props.viewMode === 'split' ? 'active' : ''}`}
              onClick={() => props.onViewModeChange('split')}
            >
              ◫ Dividido
            </button>
          </div>
        </Show>
      </div>

      <div class="chat-actions" style={{ display: 'flex', 'align-items': 'center', gap: '8px' }}>
        {/* Search */}
        <div class="chat-search-box" style={{ display: 'flex', 'align-items': 'center', background: 'rgba(0,0,0,0.3)', 'border-radius': '8px', padding: '4px 8px', border: '1px solid rgba(255,255,255,0.08)' }}>
          <span style={{ 'font-size': '0.8rem', 'margin-right': '6px', opacity: '0.7' }}>🔍</span>
          <input
            type="text"
            placeholder="Buscar mensagens..."
            value={props.searchQuery}
            onInput={(e) => props.onSearchQueryChange(e.currentTarget.value)}
            style={{ background: 'transparent', border: 'none', color: '#fff', 'font-size': '0.82rem', outline: 'none', width: '130px' }}
          />
          <Show when={props.searchQuery}>
            <button
              type="button"
              onClick={() => props.onSearchQueryChange('')}
              style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', 'font-size': '0.75rem', padding: '0 2px' }}
            >
              ✕
            </button>
          </Show>
        </div>

        {/* Pinned Messages Button */}
        <button
          type="button"
          class="control-btn"
          title="Mensagens Fixadas"
          onClick={props.onOpenPins}
          style={{ position: 'relative' }}
        >
          📌
          <Show when={(props.pinnedCount || 0) > 0}>
            <span class="badge-count-mini">{props.pinnedCount}</span>
          </Show>
        </button>

        {/* Media & Files Gallery */}
        <button
          type="button"
          class="control-btn"
          title="Mídias e Arquivos do Canal"
          onClick={props.onOpenMediaGallery}
        >
          📁
        </button>

        {/* Soundboard Button (if voice active) */}
        <Show when={props.hasVoiceActive}>
          <button
            type="button"
            class="control-btn"
            title="Abrir Soundboard"
            onClick={props.onOpenSoundboard}
          >
            🔊
          </button>
        </Show>

        {/* Mute Channel Notifications */}
        <button
          type="button"
          class={`control-btn ${props.isChannelMuted ? 'active danger' : ''}`}
          title={props.isChannelMuted ? 'Desmutar Notificações' : 'Mutar Notificações do Canal'}
          onClick={props.onToggleChannelMute}
        >
          {props.isChannelMuted ? '🔕' : '🔔'}
        </button>

        {/* Member list toggle */}
        <button
          type="button"
          class={`control-btn ${props.showMembersSidebar ? 'active' : ''}`}
          title="Mostrar/Ocultar Lista de Membros"
          onClick={props.onToggleMembersSidebar}
        >
          👥
        </button>
      </div>
    </div>
  );
}
