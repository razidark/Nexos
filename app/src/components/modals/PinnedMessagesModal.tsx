import { For, Show } from 'solid-js';
import type { Message } from '../../types';
import { renderMarkdown } from '../../utils/markdown';

interface PinnedMessagesModalProps {
  show: boolean;
  channelName: string;
  pinnedMessages: Message[];
  onUnpin: (msgId: string) => void;
  onClose: () => void;
}

export function PinnedMessagesModal(props: PinnedMessagesModalProps) {
  return (
    <Show when={props.show}>
      <div class="modal-backdrop" onClick={props.onClose}>
        <div class="modal-content pinned-messages-modal" onClick={(e) => e.stopPropagation()}>
          <div class="modal-header">
            <span>📌 Mensagens Fixadas — {props.channelName}</span>
            <button class="close-btn" onClick={props.onClose}>✕</button>
          </div>

          <div class="pinned-list-container">
            <Show
              when={props.pinnedMessages.length > 0}
              fallback={
                <div class="empty-pins-state">
                  <span style={{ 'font-size': '2rem' }}>📌</span>
                  <p>Nenhuma mensagem fixada neste canal.</p>
                </div>
              }
            >
              <For each={props.pinnedMessages}>
                {(msg) => (
                  <div class="pinned-message-card">
                    <div class="pinned-card-header">
                      <div class="pinned-author-row">
                        <span class="pinned-author-name">{msg.sender.username}</span>
                        <span class="pinned-time">
                          {new Date(msg.timestamp).toLocaleString([], {
                            dateStyle: 'short',
                            timeStyle: 'short',
                          })}
                        </span>
                      </div>
                      <button
                        type="button"
                        class="unpin-btn"
                        onClick={() => props.onUnpin(msg.id)}
                        title="Desafixar mensagem"
                      >
                        Desafixar ✕
                      </button>
                    </div>

                    <div
                      class="pinned-card-body"
                      innerHTML={renderMarkdown(msg.text)}
                    />

                    <Show when={msg.attachments && msg.attachments.length > 0}>
                      <div class="pinned-att-list">
                        <For each={msg.attachments}>
                          {(att) => (
                            <Show
                              when={att.type.startsWith('image/')}
                              fallback={<span>📁 {att.name}</span>}
                            >
                              <img src={att.url} alt={att.name} class="pinned-att-img" />
                            </Show>
                          )}
                        </For>
                      </div>
                    </Show>
                  </div>
                )}
              </For>
            </Show>
          </div>

          <div class="modal-footer">
            <button class="btn-secondary" onClick={props.onClose}>
              Fechar
            </button>
          </div>
        </div>
      </div>
    </Show>
  );
}
