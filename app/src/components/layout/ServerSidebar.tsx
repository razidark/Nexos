import { For, Show } from 'solid-js';
import type { Guild } from '../../types';

interface ServerSidebarProps {
  guilds: Guild[];
  activeGuildId: string;
  guildUnreadMap?: Record<string, number>;
  onSelectDms: () => void;
  onSelectGuild: (guildId: string) => void;
  onOpenCreateGuildModal: () => void;
}

export function ServerSidebar(props: ServerSidebarProps) {
  return (
    <div class="server-sidebar">
      {/* Direct Messages Icon */}
      <div
        class={`server-icon ${props.activeGuildId === 'dms' ? 'active' : ''}`}
        onClick={props.onSelectDms}
        title="Direct Messages"
        style={{ position: 'relative' }}
      >
        <div class="server-indicator" />
        ✉️
        <Show when={(props.guildUnreadMap?.['dms'] || 0) > 0}>
          <span class="badge-count-mini">{props.guildUnreadMap!['dms']}</span>
        </Show>
      </div>

      <div class="server-separator" />

      {/* Guilds List */}
      <For each={props.guilds}>
        {(guild) => {
          const isImg = () => guild.icon && (guild.icon.startsWith('http') || guild.icon.startsWith('data:'));
          const unreadCount = () => props.guildUnreadMap?.[guild.id] || 0;
          return (
            <div
              class={`server-icon ${props.activeGuildId === guild.id ? 'active' : ''}`}
              onClick={() => props.onSelectGuild(guild.id)}
              title={guild.name}
              style={{ position: 'relative' }}
            >
              <div class="server-indicator" />
              <Show when={isImg()} fallback={<span>{guild.icon || '🪐'}</span>}>
                <img src={guild.icon} alt={guild.name} class="guild-icon-img" />
              </Show>
              <Show when={unreadCount() > 0 && props.activeGuildId !== guild.id}>
                <span class="badge-count-mini">{unreadCount()}</span>
              </Show>
            </div>
          );
        }}
      </For>

      <div class="server-separator" />

      {/* Add Guild Button */}
      <div
        class="server-icon add-btn"
        onClick={props.onOpenCreateGuildModal}
        title="Criar Servidor"
      >
        +
      </div>
    </div>
  );
}
