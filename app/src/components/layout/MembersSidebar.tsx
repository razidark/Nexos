import { createMemo, For, Show } from 'solid-js';
import type { Member } from '../../types';

interface MembersSidebarProps {
  members: Member[];
  onSelectMember: (member: Member) => void;
}

export function MembersSidebar(props: MembersSidebarProps) {
  // Real active members with activity
  const activeMembersWithActivity = createMemo(() =>
    props.members.filter((m) => m.status !== 'offline' && m.activity)
  );

  // Group members by real role or presence
  const onlineAdmins = createMemo(() =>
    props.members.filter(
      (m) => m.status !== 'offline' && (m.role === 'owner' || m.role === 'admin')
    )
  );

  const onlineMods = createMemo(() =>
    props.members.filter(
      (m) => m.status !== 'offline' && m.role === 'moderator'
    )
  );

  const onlineMembers = createMemo(() =>
    props.members.filter(
      (m) =>
        m.status !== 'offline' &&
        m.role !== 'owner' &&
        m.role !== 'admin' &&
        m.role !== 'moderator'
    )
  );

  const offlineMembers = createMemo(() =>
    props.members.filter((m) => m.status === 'offline')
  );

  const renderMemberRow = (member: Member) => {
    const isCustomAv = () =>
      member.avatar &&
      (member.avatar.startsWith('http') || member.avatar.startsWith('data:'));
    const decoClass = () =>
      member.avatarDecoration && member.avatarDecoration !== 'none'
        ? `deco-${member.avatarDecoration}`
        : '';
    const isOwner = member.role === 'owner' || member.role === 'admin';

    return (
      <div
        class={`member-row ${isOwner ? 'owner-row' : ''}`}
        onClick={() => props.onSelectMember(member)}
        title="Ver perfil detalhado"
      >
        <div class="relative-avatar">
          <div
            class={`member-avatar avatar-${member.avatar || 'solar'} ${decoClass()} ${
              member.isSpeaking ? 'speaking' : ''
            }`}
          >
            <Show
              when={isCustomAv()}
              fallback={member.username.slice(0, 2).toUpperCase()}
            >
              <img src={member.avatar} alt={member.username} class="avatar-img" />
            </Show>
          </div>
          <div class={`status-dot-mini status-${member.status || 'online'}`} />
        </div>
        <div class="member-info-col">
          <div class="member-name-row">
            <span class={`member-name ${isOwner ? 'owner-name' : ''}`}>
              {member.username}
            </span>
            <Show when={member.clanTag}>
              <span class="clan-tag-pill">{member.clanTag}</span>
            </Show>
          </div>
          <Show when={member.customStatus}>
            <span class="member-sub">{member.customStatus}</span>
          </Show>
        </div>
      </div>
    );
  };

  return (
    <div class="members-sidebar">
      {/* 1. Real Activity Section (rendered only if members actually have activities) */}
      <Show when={activeMembersWithActivity().length > 0}>
        <div class="activity-section">
          <div class="member-list-title">
            ATIVIDADE — {activeMembersWithActivity().length}
          </div>
          <div class="activity-cards-list">
            <For each={activeMembersWithActivity()}>
              {(member) => (
                <div
                  class="activity-card-item"
                  onClick={() => props.onSelectMember(member)}
                >
                  <div class="activity-card-icon">
                    {member.activity?.icon || '🎮'}
                  </div>
                  <div class="activity-card-meta">
                    <span class="act-user-name">{member.username}</span>
                    <span class="act-game-title">{member.activity?.name}</span>
                    <Show when={member.activity?.details || member.activity?.time}>
                      <span class="act-game-time">
                        {member.activity?.details || member.activity?.time}
                      </span>
                    </Show>
                  </div>
                </div>
              )}
            </For>
          </div>
        </div>
        <div class="members-separator" />
      </Show>

      {/* 2. Group: Admin / Owner */}
      <Show when={onlineAdmins().length > 0}>
        <div class="member-group-block">
          <div class="member-list-title">ADMINISTRADORES — {onlineAdmins().length}</div>
          <div class="members-container">
            <For each={onlineAdmins()}>{renderMemberRow}</For>
          </div>
        </div>
      </Show>

      {/* 3. Group: Moderators */}
      <Show when={onlineMods().length > 0}>
        <div class="member-group-block">
          <div class="member-list-title">MODERADORES — {onlineMods().length}</div>
          <div class="members-container">
            <For each={onlineMods()}>{renderMemberRow}</For>
          </div>
        </div>
      </Show>

      {/* 4. Group: Online Members */}
      <Show when={onlineMembers().length > 0}>
        <div class="member-group-block">
          <div class="member-list-title">ONLINE — {onlineMembers().length}</div>
          <div class="members-container">
            <For each={onlineMembers()}>{renderMemberRow}</For>
          </div>
        </div>
      </Show>

      {/* 5. Group: Offline Members */}
      <Show when={offlineMembers().length > 0}>
        <div class="member-group-block">
          <div class="member-list-title">OFFLINE — {offlineMembers().length}</div>
          <div class="members-container">
            <For each={offlineMembers()}>{renderMemberRow}</For>
          </div>
        </div>
      </Show>
    </div>
  );
}
