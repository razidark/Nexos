import { For, Show } from 'solid-js';
import type { Guild, Member, Channel } from '../../types';

interface ChannelSidebarProps {
  activeGuildId: string;
  guild: Guild | undefined;
  members: Member[];
  self: Member | null;
  selectedDmPeerId: string | null;
  activeChannelId: string;
  activeVoiceChannel: string | null;
  collapsedCategories: Record<string, boolean>;
  rtcStatus: string;
  audioLevel: number;
  isMuted: boolean;
  isDeafened: boolean;
  isCameraOn: boolean;
  isScreenSharing: boolean;
  unreadMap?: Record<string, number>;
  onSelectChannel: (channelId: string) => void;
  onJoinVoice: (channelId: string) => void;
  onSelectDmPeer: (peerId: string) => void;
  onToggleCategory: (catName: string) => void;
  onOpenCreateChannelModal: () => void;
  onDeleteChannel: (channelId: string) => void;
  onLeaveVoice: () => void;
  onToggleCamera: () => void;
  onToggleScreenShare: () => void;
  onToggleMute: () => void;
  onToggleDeafen: () => void;
  onOpenSettings: () => void;
  onLogout: () => void;
}

export function ChannelSidebar(props: ChannelSidebarProps) {
  const getCategories = () => {
    if (!props.guild) return [];
    const cats: Record<string, Channel[]> = {};
    props.guild.channels.forEach((c) => {
      const cat = c.category || 'GERAL';
      if (!cats[cat]) cats[cat] = [];
      cats[cat].push(c);
    });
    return Object.entries(cats);
  };

  return (
    <div class="channel-sidebar">
      {/* 1. Server Header Banner */}
      <Show
        when={props.activeGuildId !== 'dms'}
        fallback={
          <div class="guild-header">
            <span class="guild-title">✉️ Mensagens Diretas</span>
          </div>
        }
      >
        <div class="guild-header-rich">
          <div class="guild-header-top">
            <span class="guild-title">{props.guild?.name || 'Servidor'}</span>
            <button
              type="button"
              class="add-channel-btn"
              onClick={props.onOpenCreateChannelModal}
              title="Criar Novo Canal"
            >
              +
            </button>
          </div>
        </div>

        {/* Server Navigation Quick Actions */}
        <div class="server-quick-nav">
          <div
            class="server-nav-pill"
            onClick={props.onOpenCreateChannelModal}
            title="Criar novo canal de texto ou voz"
          >
            <span class="nav-icon">➕</span>
            <span>Criar Canal</span>
          </div>
          <div
            class="server-nav-pill"
            onClick={props.onOpenSettings}
            title="Abrir configurações de usuário e servidor"
          >
            <span class="nav-icon">⚙️</span>
            <span>Configurações</span>
          </div>
        </div>
      </Show>

      {/* 2. Channel Tree or DM List */}
      <div class="channel-list">
        <Show
          when={props.activeGuildId !== 'dms'}
          fallback={
            <div class="dm-friends-list">
              <div class="channel-category">AMIGOS & CONVERSAS</div>
              <For each={props.members.filter((m) => m.id !== props.self?.id)}>
                {(member) => (
                  <div
                    class={`dm-user-item ${props.selectedDmPeerId === member.id ? 'active' : ''}`}
                    onClick={() => props.onSelectDmPeer(member.id)}
                  >
                    <div class="relative-avatar">
                      <div class={`dm-user-avatar avatar-${member.avatar || 'solar'}`}>
                        <Show
                          when={
                            member.avatar &&
                            (member.avatar.startsWith('http') || member.avatar.startsWith('data:'))
                          }
                          fallback={member.username.slice(0, 2).toUpperCase()}
                        >
                          <img src={member.avatar} alt={member.username} class="avatar-img" />
                        </Show>
                      </div>
                      <div class={`status-dot-mini status-${member.status || 'online'}`} />
                    </div>
                    <div class="dm-user-info">
                      <span class="dm-user-name">{member.username}</span>
                      <Show when={member.customStatus}>
                        <span class="dm-user-status">{member.customStatus}</span>
                      </Show>
                    </div>
                    <Show when={(props.unreadMap?.[member.id] || 0) > 0}>
                      <span class="badge-count-pill">{props.unreadMap![member.id]}</span>
                    </Show>
                  </div>
                )}
              </For>
            </div>
          }
        >
          <div class="channel-categories-tree">
            <For each={getCategories()}>
              {([categoryName, channels]) => {
                const isCollapsed = () => props.collapsedCategories[categoryName];
                return (
                  <div class="category-block">
                    <button
                      type="button"
                      class="category-header-btn"
                      onClick={() => props.onToggleCategory(categoryName)}
                    >
                      <span>│ {categoryName}</span>
                      <span class={`category-arrow ${isCollapsed() ? 'collapsed' : ''}`}>▼</span>
                    </button>

                    <Show when={!isCollapsed()}>
                      <div class="category-channels">
                        <For each={channels}>
                          {(channel) => (
                            <div>
                              <div
                                class={`channel-item ${
                                  channel.type === 'text' && props.activeChannelId === channel.id
                                    ? 'active'
                                    : ''
                                } ${
                                  channel.type === 'voice' && props.activeVoiceChannel === channel.id
                                    ? 'voice-active'
                                    : ''
                                }`}
                                onClick={() => {
                                  if (channel.type === 'text') {
                                    props.onSelectChannel(channel.id);
                                  } else {
                                    props.onJoinVoice(channel.id);
                                  }
                                }}
                              >
                                <span class="channel-icon">
                                  {channel.type === 'text' ? '#' : '🔊'}
                                </span>
                                <span class="channel-name">{channel.name}</span>

                                <Show
                                  when={
                                    (props.unreadMap?.[channel.id] || 0) > 0 &&
                                    props.activeChannelId !== channel.id
                                  }
                                >
                                  <span class="badge-count-pill">
                                    {props.unreadMap![channel.id]}
                                  </span>
                                </Show>

                                <Show when={channel.name !== 'geral' && channel.name !== 'general'}>
                                  <button
                                    type="button"
                                    class="delete-chan-btn"
                                    title="Excluir canal"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (confirm(`Deseja excluir o canal #${channel.name}?`)) {
                                        props.onDeleteChannel(channel.id);
                                      }
                                    }}
                                  >
                                    ✕
                                  </button>
                                </Show>
                              </div>

                              {/* Voice Channel Members List */}
                              <Show when={channel.type === 'voice'}>
                                <div class="voice-members-list">
                                  <For
                                    each={props.members.filter(
                                      (m) => m.voiceChannelId === channel.id
                                    )}
                                  >
                                    {(user) => (
                                      <div class="voice-user-row">
                                        <div
                                          class={`voice-user-avatar avatar-${user.avatar || 'solar'} ${
                                            user.isSpeaking ? 'speaking' : ''
                                          }`}
                                        >
                                          <Show
                                            when={
                                              user.avatar &&
                                              (user.avatar.startsWith('http') ||
                                                user.avatar.startsWith('data:'))
                                            }
                                            fallback={user.username.slice(0, 2).toUpperCase()}
                                          >
                                            <img
                                              src={user.avatar}
                                              alt={user.username}
                                              class="avatar-img"
                                            />
                                          </Show>
                                        </div>
                                        <span class="voice-user-name">{user.username}</span>
                                        <div class="voice-badges">
                                          <Show when={user.isScreenSharing}>
                                            <span class="badge-live" title="Compartilhando Tela">
                                              AO VIVO
                                            </span>
                                          </Show>
                                          <Show when={user.isCameraOn}>
                                            <span title="Câmera Ativa">📹</span>
                                          </Show>
                                          <Show when={user.isMuted}>
                                            <span title="Mudo">🔇</span>
                                          </Show>
                                        </div>
                                      </div>
                                    )}
                                  </For>
                                </div>
                              </Show>
                            </div>
                          )}
                        </For>
                      </div>
                    </Show>
                  </div>
                );
              }}
            </For>
          </div>
        </Show>
      </div>

      {/* 3. Bottom Profile & Voice Panel */}
      <div class="user-panel">
        <Show when={props.activeVoiceChannel}>
          <div class="voice-status-box">
            <div class="voice-status-meta">
              <span class="pulse-dot" />
              <div class="voice-status-text">
                <span class="voice-connected-title">Voz Conectada</span>
                <span class="voice-sub">WebRTC HD / Baixa Latência</span>
              </div>
            </div>
            <button class="hangup-mini-btn" onClick={props.onLeaveVoice} title="Desconectar Voz">
              ☎️
            </button>
          </div>

          <div class="voice-quick-actions">
            <button
              class={`voice-quick-btn ${props.isCameraOn ? 'active' : ''}`}
              onClick={props.onToggleCamera}
              title={props.isCameraOn ? 'Desligar Câmera' : 'Ligar Câmera'}
            >
              {props.isCameraOn ? '📹 Desligar Vídeo' : '📹 Vídeo'}
            </button>
            <button
              class={`voice-quick-btn ${props.isScreenSharing ? 'active live' : ''}`}
              onClick={props.onToggleScreenShare}
              title={props.isScreenSharing ? 'Parar Compartilhamento' : 'Compartilhar Tela'}
            >
              {props.isScreenSharing ? '🖥️ Parar Tela' : '🖥️ Compartilhar'}
            </button>
          </div>

          <div class="audio-visualizer-bar">
            <div class="audio-level" style={{ width: `${props.audioLevel}%` }} />
          </div>
        </Show>

        <div class="user-info">
          <div class="user-profile" onClick={props.onOpenSettings}>
            <div class="profile-avatar-wrapper">
              <div
                class={`user-avatar-main avatar-${props.self?.avatar || 'solar'} ${
                  props.self?.avatarDecoration && props.self?.avatarDecoration !== 'none'
                    ? `deco-${props.self.avatarDecoration}`
                    : ''
                } ${props.self?.isSpeaking ? 'speaking' : ''}`}
              >
                <Show
                  when={
                    props.self?.avatar &&
                    (props.self.avatar.startsWith('http') || props.self.avatar.startsWith('data:'))
                  }
                  fallback={(props.self?.username || 'US').slice(0, 2).toUpperCase()}
                >
                  <img src={props.self?.avatar} alt={props.self?.username} class="avatar-img" />
                </Show>
              </div>
              <div class={`user-status-dot status-${props.self?.status || 'online'}`} />
            </div>
            <div class="user-name-display">
              <div class="user-name-row">
                <span class="user-name-text">{props.self?.username || 'Usuário'}</span>
                <Show when={props.self?.clanTag}>
                  <span class="clan-tag-mini">{props.self!.clanTag}</span>
                </Show>
              </div>
              <Show when={props.self?.customStatus}>
                <span class="user-sub-text">{props.self!.customStatus}</span>
              </Show>
            </div>
          </div>

          <div class="user-controls">
            <button
              class={`control-btn ${props.isMuted ? 'active danger' : ''}`}
              title={props.isMuted ? 'Desmutar' : 'Mutar'}
              onClick={props.onToggleMute}
            >
              {props.isMuted ? '🔇' : '🎙️'}
            </button>
            <button
              class={`control-btn ${props.isDeafened ? 'active danger' : ''}`}
              title={props.isDeafened ? 'Ouvir' : 'Ensurdecer'}
              onClick={props.onToggleDeafen}
            >
              {props.isDeafened ? '❌' : '🎧'}
            </button>
            <button
              class="control-btn"
              title="Configurações"
              onClick={props.onOpenSettings}
            >
              ⚙️
            </button>
            <button
              class="control-btn user-action-btn logout-btn"
              title="Sair da Conta (Logout)"
              onClick={props.onLogout}
            >
              🚪
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
