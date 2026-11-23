import { For, Show } from 'solid-js';
import type { Member } from '../../types';

interface StageViewProps {
  self: Member | null;
  members: Member[];
  activeVoiceMembers: Member[];
  remoteStreams: Record<string, MediaStream>;
  isCameraOn: boolean;
  isScreenSharing: boolean;
  spotlightTile: string | null;
  onToggleSpotlight: (tileId: string) => void;
  localVideoRef?: (el: HTMLVideoElement) => void;
  localScreenRef?: (el: HTMLVideoElement) => void;
}

export function StageView(props: StageViewProps) {
  return (
    <div class="stage-container">
      <div class={`stage-grid ${props.spotlightTile ? 'has-spotlight' : ''}`}>
        {/* Local User Tile */}
        <div
          class={`video-tile ${props.spotlightTile === 'local-cam' ? 'spotlight' : ''}`}
          onClick={() => props.onToggleSpotlight('local-cam')}
        >
          <Show
            when={props.isCameraOn}
            fallback={
              <div class="avatar-tile-inner">
                <div
                  class={`stage-avatar avatar-${props.self?.avatar || 'solar'} ${
                    props.self?.isSpeaking ? 'speaking' : ''
                  }`}
                >
                  <Show
                    when={props.self?.avatar && (props.self.avatar.startsWith('http') || props.self.avatar.startsWith('data:'))}
                    fallback={(props.self?.username || 'US').slice(0, 2).toUpperCase()}
                  >
                    <img src={props.self?.avatar} alt={props.self?.username} class="avatar-img" />
                  </Show>
                </div>
                <span class="stage-username">{props.self?.username} (Você)</span>
              </div>
            }
          >
            <video ref={props.localVideoRef} autoplay muted playsinline class="video-feed mirror" />
            <div class="video-overlay-meta">
              <span class="stage-tag">{props.self?.username} (Você)</span>
              <span class="video-pill">HD 720p</span>
            </div>
          </Show>
        </div>

        {/* Local Screen Share Tile */}
        <Show when={props.isScreenSharing}>
          <div
            class={`video-tile screenshare-tile ${props.spotlightTile === 'local-screen' ? 'spotlight' : ''}`}
            onClick={() => props.onToggleSpotlight('local-screen')}
          >
            <video ref={props.localScreenRef} autoplay muted playsinline class="video-feed" />
            <div class="video-overlay-meta">
              <span class="stage-tag">🖥️ {props.self?.username} (Sua Tela)</span>
              <span class="badge-live">AO VIVO</span>
            </div>
          </div>
        </Show>

        {/* Remote Peers Tiles */}
        <For each={props.activeVoiceMembers.filter((m) => m.id !== props.self?.id)}>
          {(user) => {
            const stream = () => props.remoteStreams[user.id];
            return (
              <div
                class={`video-tile ${props.spotlightTile === user.id ? 'spotlight' : ''}`}
                onClick={() => props.onToggleSpotlight(user.id)}
              >
                <Show
                  when={stream() && (user.isCameraOn || user.isScreenSharing)}
                  fallback={
                    <div class="avatar-tile-inner">
                      <div
                        class={`stage-avatar avatar-${user.avatar || 'solar'} ${
                          user.isSpeaking ? 'speaking' : ''
                        }`}
                      >
                        <Show
                          when={user.avatar && (user.avatar.startsWith('http') || user.avatar.startsWith('data:'))}
                          fallback={user.username.slice(0, 2).toUpperCase()}
                        >
                          <img src={user.avatar} alt={user.username} class="avatar-img" />
                        </Show>
                      </div>
                      <span class="stage-username">{user.username}</span>
                    </div>
                  }
                >
                  <video
                    ref={(el) => {
                      if (el && stream()) el.srcObject = stream();
                    }}
                    autoplay
                    playsinline
                    class="video-feed"
                  />
                  <div class="video-overlay-meta">
                    <span class="stage-tag">
                      {user.isScreenSharing ? '🖥️ ' : ''}
                      {user.username}
                    </span>
                    <Show when={user.isScreenSharing}>
                      <span class="badge-live">AO VIVO</span>
                    </Show>
                  </div>
                </Show>
              </div>
            );
          }}
        </For>
      </div>
    </div>
  );
}
