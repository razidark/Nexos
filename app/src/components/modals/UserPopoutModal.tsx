import { Show } from 'solid-js';
import type { Member } from '../../types';

interface UserPopoutModalProps {
  user: Member | null;
  currentUserId?: string;
  peerVolume?: number;
  onVolumeChange?: (peerId: string, vol: number) => void;
  onClose: () => void;
  onSendDM: (targetId: string) => void;
}

export function UserPopoutModal(props: UserPopoutModalProps) {
  return (
    <Show when={props.user}>
      <div class="user-popout-backdrop" onClick={props.onClose}>
        <div class="user-popout-card" onClick={(e) => e.stopPropagation()}>
          <div
            class="popout-banner"
            style={{
              'background-image': props.user?.banner ? `url(${props.user.banner})` : undefined,
            }}
          >
            <button class="popout-close-btn" onClick={props.onClose}>✕</button>
          </div>

          <div class="popout-avatar-section">
            <div class="popout-avatar-wrapper">
              <div
                class={`popout-avatar avatar-${props.user?.avatar || 'solar'} ${
                  props.user?.avatarDecoration && props.user?.avatarDecoration !== 'none'
                    ? `deco-${props.user?.avatarDecoration}`
                    : ''
                }`}
              >
                <Show
                  when={props.user?.avatar && (props.user!.avatar.startsWith('http') || props.user!.avatar.startsWith('data:'))}
                  fallback={props.user?.username.slice(0, 2).toUpperCase()}
                >
                  <img src={props.user?.avatar} alt={props.user?.username} class="avatar-img" />
                </Show>
              </div>
              <div class={`popout-status-badge status-${props.user?.status || 'online'}`} />
            </div>
          </div>

          <div class="popout-body">
            <div class="popout-names">
              <span class="popout-username">{props.user?.username}</span>
              <span class="popout-tag">@{props.user?.username.toLowerCase()}</span>
            </div>

            <Show when={props.user?.customStatus}>
              <div class="popout-status-text">
                <span>💬</span>
                <span>{props.user?.customStatus}</span>
              </div>
            </Show>

            <Show when={props.user?.bio}>
              <div class="popout-bio-section">
                <span class="popout-section-title">Sobre Mim</span>
                <p class="popout-bio-text">{props.user?.bio}</p>
              </div>
            </Show>

            <Show when={props.user?.id !== props.currentUserId}>
              <div class="popout-volume-section" style={{ 'margin-top': '4px' }}>
                <div style={{ display: 'flex', 'justify-content': 'space-between', 'font-size': '0.75rem', color: '#94a3b8', 'font-weight': '700' }}>
                  <span>🔊 VOLUME DO USUÁRIO</span>
                  <span>{props.peerVolume ?? 100}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={props.peerVolume ?? 100}
                  onInput={(e) => props.onVolumeChange?.(props.user!.id, parseInt(e.currentTarget.value))}
                  style={{ width: '100%', 'accent-color': '#8a2be2', 'margin-top': '4px', cursor: 'pointer' }}
                />
              </div>

              <button
                type="button"
                class="popout-dm-btn"
                onClick={() => {
                  const targetId = props.user!.id;
                  props.onClose();
                  props.onSendDM(targetId);
                }}
              >
                💬 Enviar Mensagem Direta
              </button>
            </Show>
          </div>
        </div>
      </div>
    </Show>
  );
}
