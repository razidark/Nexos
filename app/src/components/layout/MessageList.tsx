import { createSignal, For, Show } from 'solid-js';
import type { Message, Member, PollData } from '../../types';
import { renderMarkdown } from '../../utils/markdown';

interface MessageListProps {
  channelName: string;
  messages: Message[];
  self: Member | null;
  members: Member[];
  typers: string[];
  onReply: (msg: Message) => void;
  onToggleReaction: (messageId: string, emoji: string) => void;
  onTogglePin: (messageId: string) => void;
  onEditMessage: (messageId: string, newText: string) => void;
  onDeleteMessage: (messageId: string) => void;
  onOpenUserPopout: (user: Member) => void;
  onVotePoll?: (messageId: string, optionId: string) => void;
  onOpenLightbox?: (url: string) => void;
  bottomRef?: (el: HTMLDivElement) => void;
}

export function MessageList(props: MessageListProps) {
  const [editingMsgId, setEditingMsgId] = createSignal<string | null>(null);
  const [editingText, setEditingText] = createSignal<string>('');

  const startEdit = (msg: Message) => {
    setEditingMsgId(msg.id);
    setEditingText(msg.text);
  };

  const saveEdit = (msgId: string) => {
    if (editingText().trim()) {
      props.onEditMessage(msgId, editingText().trim());
    }
    setEditingMsgId(null);
  };

  const cancelEdit = () => {
    setEditingMsgId(null);
  };

  const formatDateDivider = (timestamp: number) => {
    const d = new Date(timestamp);
    return d.toLocaleDateString('pt-BR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const getTotalPollVotes = (poll: PollData) => {
    return poll.options.reduce((sum, opt) => sum + (opt.votes?.length || 0), 0);
  };

  return (
    <div class="chat-messages-container">
      <div class="chat-scrollable">
        {/* Discord-style Channel Welcome Hero */}
        <div class="channel-welcome-hero">
          <div class="welcome-hash-circle">#</div>
          <h2 class="welcome-title">Bem-vindo(a) a {props.channelName}!</h2>
          <p class="welcome-desc">
            Este é o começo do canal <strong>{props.channelName}</strong>. Envie mensagens, arquivos e converse em tempo real!
          </p>
        </div>

        <div class="messages-stream">
          <For each={props.messages}>
            {(msg, index) => {
              const prevMsg = () => (index() > 0 ? props.messages[index() - 1] : null);
              const showDateDivider = () => {
                if (index() === 0) return true;
                const prevDate = new Date(prevMsg()!.timestamp).toDateString();
                const currDate = new Date(msg.timestamp).toDateString();
                return prevDate !== currDate;
              };

              const isSameSenderAsPrev = () => {
                if (!prevMsg() || showDateDivider() || msg.poll) return false;
                const timeDiff = msg.timestamp - prevMsg()!.timestamp;
                return prevMsg()!.sender.id === msg.sender.id && timeDiff < 5 * 60 * 1000;
              };

              return (
                <div>
                  {/* Date Divider */}
                  <Show when={showDateDivider()}>
                    <div class="chat-date-divider">
                      <span class="divider-line" />
                      <span class="divider-text">{formatDateDivider(msg.timestamp)}</span>
                      <span class="divider-line" />
                    </div>
                  </Show>

                  {/* Message Row */}
                  <div
                    class={`message-row group ${msg.pinned ? 'is-pinned-msg' : ''} ${
                      isSameSenderAsPrev() ? 'compact-row' : ''
                    }`}
                  >
                    <Show
                      when={!isSameSenderAsPrev()}
                      fallback={
                        <div class="compact-timestamp">
                          {new Date(msg.timestamp).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      }
                    >
                      <div
                        class={`message-sender-avatar avatar-${msg.sender.avatar || 'solar'} ${
                          msg.sender.avatarDecoration && msg.sender.avatarDecoration !== 'none'
                            ? `deco-${msg.sender.avatarDecoration}`
                            : ''
                        }`}
                        onClick={() => {
                          const foundMember = props.members.find((m) => m.id === msg.sender.id);
                          if (foundMember) props.onOpenUserPopout(foundMember);
                          else {
                            props.onOpenUserPopout({
                              id: msg.sender.id,
                              username: msg.sender.username,
                              avatar: msg.sender.avatar,
                              avatarDecoration: msg.sender.avatarDecoration,
                              voiceChannelId: null,
                              isMuted: false,
                              isDeafened: false,
                              isSpeaking: false,
                              isCameraOn: false,
                              isScreenSharing: false,
                              status: 'online',
                            });
                          }
                        }}
                        style={{ cursor: 'pointer' }}
                        title="Ver perfil"
                      >
                        <Show
                          when={
                            msg.sender.avatar &&
                            (msg.sender.avatar.startsWith('http') ||
                              msg.sender.avatar.startsWith('data:'))
                          }
                          fallback={msg.sender.username.slice(0, 2).toUpperCase()}
                        >
                          <img
                            src={msg.sender.avatar}
                            alt={msg.sender.username}
                            class="avatar-img"
                          />
                        </Show>
                      </div>
                    </Show>

                    <div class="message-content">
                      {/* Pinned pill tag */}
                      <Show when={msg.pinned}>
                        <div class="pinned-tag-row">
                          <span>📌 Mensagem Fixada</span>
                        </div>
                      </Show>

                      <Show when={msg.replyTo}>
                        <div class="reply-quote">
                          <span class="reply-arrow">↳</span>
                          <span class="reply-author">@{msg.replyTo!.username}:</span>
                          <span class="reply-snippet">{msg.replyTo!.text}</span>
                        </div>
                      </Show>

                      <Show when={!isSameSenderAsPrev()}>
                        <div class="message-meta">
                          <span class="sender-name">{msg.sender.username}</span>
                          <Show when={msg.sender.clanTag}>
                            <span class="clan-tag-pill">{msg.sender.clanTag}</span>
                          </Show>
                          <Show when={msg.sender.role === 'admin' || msg.sender.role === 'owner'}>
                            <span class="role-badge role-admin">👑 ADMIN</span>
                          </Show>
                          <Show when={msg.sender.role === 'moderator'}>
                            <span class="role-badge role-mod">🛡️ MOD</span>
                          </Show>
                          <Show when={msg.sender.role === 'vip'}>
                            <span class="role-badge role-vip">⭐ VIP</span>
                          </Show>
                          <Show when={msg.sender.isBot}>
                            <span class="bot-badge">AI BOT</span>
                          </Show>
                          <span class="message-time">
                            {new Date(msg.timestamp).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                          <Show when={msg.edited}>
                            <span class="edited-tag">(editado)</span>
                          </Show>
                        </div>
                      </Show>

                      {/* Inline Message Text or Editing Textarea */}
                      <Show
                        when={editingMsgId() === msg.id}
                        fallback={
                          <Show when={msg.text}>
                            <div
                              class={`message-text chat-msg-text ${
                                msg.sender.username === 'System' ? 'system' : ''
                              }`}
                              innerHTML={renderMarkdown(msg.text)}
                            />
                          </Show>
                        }
                      >
                        <div class="inline-edit-box">
                          <input
                            type="text"
                            class="chat-input inline-edit-input"
                            value={editingText()}
                            onInput={(e) => setEditingText(e.currentTarget.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') saveEdit(msg.id);
                              if (e.key === 'Escape') cancelEdit();
                            }}
                          />
                          <div class="inline-edit-actions">
                            <span class="edit-hint">Enter para salvar • Esc para cancelar</span>
                            <button type="button" class="btn-secondary mini" onClick={cancelEdit}>
                              Cancelar
                            </button>
                            <button
                              type="button"
                              class="btn-primary mini"
                              onClick={() => saveEdit(msg.id)}
                            >
                              Salvar
                            </button>
                          </div>
                        </div>
                      </Show>

                      {/* Interactive Poll Card */}
                      <Show when={msg.poll}>
                        <div class="poll-message-card">
                          <div class="poll-header-row">
                            <span class="poll-icon">📊</span>
                            <span class="poll-question-text">{msg.poll!.question}</span>
                          </div>
                          <div class="poll-options-container">
                            <For each={msg.poll!.options}>
                              {(option) => {
                                const totalVotes = () => getTotalPollVotes(msg.poll!);
                                const optVotes = () => option.votes?.length || 0;
                                const percentage = () =>
                                  totalVotes() === 0 ? 0 : Math.round((optVotes() / totalVotes()) * 100);
                                const hasVoted = () =>
                                  props.self ? option.votes?.includes(props.self.id) : false;

                                return (
                                  <div
                                    class={`poll-option-bar ${hasVoted() ? 'user-voted' : ''}`}
                                    onClick={() => props.onVotePoll?.(msg.id, option.id)}
                                  >
                                    <div
                                      class="poll-fill-progress"
                                      style={{ width: `${percentage()}%` }}
                                    />
                                    <div class="poll-option-content">
                                      <div class="poll-radio-circle">
                                        <Show when={hasVoted()}>
                                          <div class="poll-radio-dot" />
                                        </Show>
                                      </div>
                                      <span class="poll-option-label">{option.text}</span>
                                      <div class="poll-vote-meta">
                                        <span class="poll-percentage">{percentage()}%</span>
                                        <span class="poll-count">({optVotes()} votos)</span>
                                      </div>
                                    </div>
                                  </div>
                                );
                              }}
                            </For>
                          </div>
                          <div class="poll-footer-row">
                            <span>Total de {getTotalPollVotes(msg.poll!)} votos</span>
                            <span class="poll-hint">Clique em uma opção para votar ou alterar seu voto</span>
                          </div>
                        </div>
                      </Show>

                      {/* Voice Note / Audio memo */}
                      <Show when={msg.voiceNote}>
                        <div class="voice-note-card">
                          <audio controls src={msg.voiceNote!.url} class="voice-note-audio" />
                          <span class="voice-note-duration">
                            🎙️ Mensagem de Voz ({Math.round(msg.voiceNote!.duration)}s)
                          </span>
                        </div>
                      </Show>

                      {/* Real Rich Embed Card */}
                      <Show when={msg.embed}>
                        <div
                          class="rich-embed-card"
                          style={{ 'border-left-color': msg.embed!.color || '#8a2be2' }}
                        >
                          <Show when={msg.embed!.author}>
                            <span class="embed-author">{msg.embed!.author}</span>
                          </Show>
                          <Show when={msg.embed!.title}>
                            <a
                              href={msg.embed!.url || '#'}
                              target="_blank"
                              rel="noreferrer"
                              class="embed-title-link"
                            >
                              {msg.embed!.title}
                            </a>
                          </Show>
                          <Show when={msg.embed!.description}>
                            <p class="embed-description">{msg.embed!.description}</p>
                          </Show>
                          <Show when={msg.embed!.image}>
                            <div
                              class="embed-media-wrapper"
                              onClick={() => props.onOpenLightbox?.(msg.embed!.image!)}
                              style={{ cursor: 'pointer' }}
                            >
                              <img
                                src={msg.embed!.image}
                                alt="Embed Thumbnail"
                                class="embed-image"
                              />
                            </div>
                          </Show>
                        </div>
                      </Show>

                      {/* Attachments */}
                      <Show when={msg.attachments && msg.attachments.length > 0}>
                        <div class="attachments-grid">
                          <For each={msg.attachments}>
                            {(att) => (
                              <div class="attachment-card">
                                <Show
                                  when={att.type.startsWith('image/')}
                                  fallback={
                                    <div class="generic-file">
                                      <span>📁 {att.name}</span>
                                      <a href={att.url} download={att.name} class="download-link">
                                        Baixar
                                      </a>
                                    </div>
                                  }
                                >
                                  <img
                                    src={att.url}
                                    alt={att.name}
                                    class="attachment-image"
                                    onClick={() => props.onOpenLightbox?.(att.url)}
                                    style={{ cursor: 'zoom-in' }}
                                  />
                                </Show>
                              </div>
                            )}
                          </For>
                        </div>
                      </Show>

                      {/* Message Reactions */}
                      <Show when={msg.reactions && Object.keys(msg.reactions).length > 0}>
                        <div class="reactions-list">
                          <For each={Object.entries(msg.reactions!)}>
                            {([emoji, userList]) => {
                              const hasReacted = () =>
                                props.self ? userList.includes(props.self.id) : false;
                              return (
                                <button
                                  class={`reaction-pill ${hasReacted() ? 'active' : ''}`}
                                  onClick={() => props.onToggleReaction(msg.id, emoji)}
                                  title={`${userList.length} reações`}
                                >
                                  <span>{emoji}</span>
                                  <span class="reaction-count">{userList.length}</span>
                                </button>
                              );
                            }}
                          </For>
                        </div>
                      </Show>
                    </div>

                    {/* Hover Quick Actions Bar */}
                    <div class="message-hover-actions">
                      <button
                        class="hover-action-btn"
                        onClick={() => props.onReply(msg)}
                        title="Responder"
                      >
                        ↩️
                      </button>
                      <button
                        class={`hover-action-btn ${msg.pinned ? 'active' : ''}`}
                        onClick={() => props.onTogglePin(msg.id)}
                        title={msg.pinned ? 'Desafixar mensagem' : 'Fixar mensagem'}
                      >
                        📌
                      </button>
                      <button
                        class="hover-action-btn"
                        onClick={() => props.onToggleReaction(msg.id, '❤️')}
                        title="Coração"
                      >
                        ❤️
                      </button>
                      <button
                        class="hover-action-btn"
                        onClick={() => props.onToggleReaction(msg.id, '👍')}
                        title="Joinha"
                      >
                        👍
                      </button>
                      <button
                        class="hover-action-btn"
                        onClick={() => props.onToggleReaction(msg.id, '🚀')}
                        title="Foguete"
                      >
                        🚀
                      </button>
                      <button
                        class="hover-action-btn"
                        onClick={() => props.onToggleReaction(msg.id, '✨')}
                        title="Brilho"
                      >
                        ✨
                      </button>
                      <Show when={msg.sender.id === props.self?.id}>
                        <button
                          class="hover-action-btn"
                          onClick={() => startEdit(msg)}
                          title="Editar mensagem"
                        >
                          ✏️
                        </button>
                        <button
                          class="hover-action-btn danger"
                          onClick={() => props.onDeleteMessage(msg.id)}
                          title="Excluir mensagem"
                        >
                          🗑️
                        </button>
                      </Show>
                    </div>
                  </div>
                </div>
              );
            }}
          </For>
        </div>
        <div ref={props.bottomRef} />
      </div>

      {/* Typing indicator */}
      <Show when={props.typers.length > 0}>
        <div class="typing-indicator">
          <span class="typing-dots">⋯</span>
          <span>
            {props.typers.join(', ')}{' '}
            {props.typers.length === 1 ? 'está digitando...' : 'estão digitando...'}
          </span>
        </div>
      </Show>
    </div>
  );
}
