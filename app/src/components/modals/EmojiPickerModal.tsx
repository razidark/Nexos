import { createSignal, For, Show } from 'solid-js';

interface EmojiPickerModalProps {
  show: boolean;
  onClose: () => void;
  onSelectEmoji: (emoji: string) => void;
}

const EMOJI_GROUPS: Record<string, string[]> = {
  '😀 Rostos': [
    '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇',
    '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😋', '😛', '😜',
    '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳', '😏', '😒', '😞',
    '😔', '😟', '😕', '🙁', '😣', '😖', '😫', '😩', '🥺', '😢',
    '😭', '😤', '😠', '😡', '🤬', '🤯', '😳', '🥵', '🥶', '😱',
    '😨', '😰', '😥', '😓', '🤗', '🤔', '🤭', '🤫', '🤥', '😶',
  ],
  '👋 Gestos': [
    '👍', '👎', '👊', '✊', '🤛', '🤜', '🤞', '✌️', '🤟', '🤘',
    '👌', '🤌', '🤏', '👈', '👉', '👆', '👇', '☝️', '✋', '🤚',
    '🖐️', '🖖', '👋', '🤙', '💪', '🦾', '🖕', '✍️', '🙏', '🤝',
  ],
  '🔥 Elementos & Gaming': [
    '🔥', '💥', '✨', '⚡', '🌟', '💫', '🌌', '🚀', '🪐', '🛸',
    '🎮', '🕹️', '👾', '🎲', '♟️', '🎯', '🎳', '🏆', '🥇', '👑',
    '💎', '🛡️', '⚔️', '🏹', '💣', '🎧', '🎤', '🎬', '🍿', '💡',
  ],
  '❤️ Corações & Símbolos': [
    '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔',
    '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '☮️',
    '✝️', '☪️', '🕉️', '☸️', '✡️', '🔯', '🕎', '☯️', '☦️', '🛐',
  ],
};

export function EmojiPickerModal(props: EmojiPickerModalProps) {
  const [activeGroup, setActiveGroup] = createSignal<string>('😀 Rostos');

  return (
    <Show when={props.show}>
      <div class="modal-backdrop" onClick={props.onClose}>
        <div class="modal-content emoji-picker-modal" onClick={(e) => e.stopPropagation()}>
          <div class="modal-header">
            <span>😀 Seletor de Emojis</span>
            <button class="close-btn" onClick={props.onClose}>✕</button>
          </div>

          {/* Group Switcher */}
          <div class="emoji-group-tabs">
            <For each={Object.keys(EMOJI_GROUPS)}>
              {(group) => (
                <button
                  type="button"
                  class={`emoji-tab-btn ${activeGroup() === group ? 'active' : ''}`}
                  onClick={() => setActiveGroup(group)}
                >
                  {group}
                </button>
              )}
            </For>
          </div>

          {/* Emojis Grid */}
          <div class="emoji-picker-grid">
            <For each={EMOJI_GROUPS[activeGroup()] || []}>
              {(emoji) => (
                <button
                  type="button"
                  class="emoji-item-btn"
                  onClick={() => {
                    props.onSelectEmoji(emoji);
                    props.onClose();
                  }}
                >
                  {emoji}
                </button>
              )}
            </For>
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
