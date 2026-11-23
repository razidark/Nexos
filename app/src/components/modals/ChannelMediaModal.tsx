import { createMemo, For, Show } from 'solid-js';
import type { Message } from '../../types';

interface ChannelMediaModalProps {
  show: boolean;
  channelName: string;
  messages: Message[];
  onOpenImage: (url: string) => void;
  onClose: () => void;
}

export function ChannelMediaModal(props: ChannelMediaModalProps) {
  const mediaItems = createMemo(() => {
    const list: { name: string; url: string; timestamp: number; type: string }[] = [];
    props.messages.forEach((msg) => {
      if (msg.attachments && msg.attachments.length > 0) {
        msg.attachments.forEach((att) => {
          list.push({
            name: att.name,
            url: att.url,
            timestamp: msg.timestamp,
            type: att.type,
          });
        });
      }
      // Check if message text is a direct image / GIF link
      if (
        msg.text &&
        (msg.text.startsWith('http') || msg.text.startsWith('data:image')) &&
        (msg.text.includes('.gif') ||
          msg.text.includes('.png') ||
          msg.text.includes('.jpg') ||
          msg.text.includes('.jpeg') ||
          msg.text.includes('.webp') ||
          msg.text.includes('giphy.com') ||
          msg.text.includes('tenor.com'))
      ) {
        list.push({
          name: 'GIF / Imagem',
          url: msg.text,
          timestamp: msg.timestamp,
          type: 'image/gif',
        });
      }
    });
    return list.reverse();
  });

  return (
    <Show when={props.show}>
      <div class="modal-backdrop" onClick={props.onClose}>
        <div class="modal-content channel-media-modal" onClick={(e) => e.stopPropagation()}>
          <div class="modal-header">
            <span>📁 Mídias & Arquivos — {props.channelName}</span>
            <button class="close-btn" onClick={props.onClose}>✕</button>
          </div>

          <div class="media-gallery-container">
            <Show
              when={mediaItems().length > 0}
              fallback={
                <div class="empty-pins-state">
                  <span style={{ 'font-size': '2rem' }}>🖼️</span>
                  <p>Nenhuma mídia compartilhada neste canal ainda.</p>
                </div>
              }
            >
              <div class="media-gallery-grid">
                <For each={mediaItems()}>
                  {(item) => (
                    <div
                      class="media-gallery-card"
                      onClick={() => props.onOpenImage(item.url)}
                      title={item.name}
                    >
                      <Show
                        when={item.type.startsWith('image/')}
                        fallback={
                          <div class="generic-file-card">
                            <span>📁</span>
                            <span class="file-name">{item.name}</span>
                          </div>
                        }
                      >
                        <img src={item.url} alt={item.name} class="media-gallery-img" />
                      </Show>
                    </div>
                  )}
                </For>
              </div>
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
