import { For, Show } from 'solid-js';
import type { SoundboardSound } from '../../types';

interface SoundboardModalProps {
  show: boolean;
  onClose: () => void;
  onPlaySound: (sound: SoundboardSound) => void;
}

const SOUNDS: { id: SoundboardSound; name: string; emoji: string; desc: string }[] = [
  { id: 'airhorn', name: 'Airhorn', emoji: '🎺', desc: 'Buzina épica de MLG' },
  { id: 'badumtss', name: 'Ba-Dum-Tss', emoji: '🥁', desc: 'Punchline de piada' },
  { id: 'victory', name: 'Level Up', emoji: '🎮', desc: '8-Bit Fanfarra' },
  { id: 'crickets', name: 'Grilos', emoji: '🦗', desc: 'Silêncio constrangedor' },
  { id: 'quack', name: 'Quack', emoji: '🦆', desc: 'Pato cômico' },
  { id: 'bell', name: 'Sino Mágico', emoji: '🔔', desc: 'Aviso cristalino' },
];

export function SoundboardModal(props: SoundboardModalProps) {
  return (
    <Show when={props.show}>
      <div class="modal-backdrop" onClick={props.onClose}>
        <div class="modal-content soundboard-modal" onClick={(e) => e.stopPropagation()}>
          <div class="modal-header">
            <span>🔊 Soundboard da Sala de Voz</span>
            <button class="close-btn" onClick={props.onClose}>✕</button>
          </div>
          <p style={{ 'font-size': '0.85rem', color: '#94a3b8', 'margin-bottom': '12px' }}>
            Clique em qualquer efeito para reproduzir na chamada de voz para todos ouvirem:
          </p>

          <div class="soundboard-grid">
            <For each={SOUNDS}>
              {(snd) => (
                <button
                  type="button"
                  class="soundboard-btn"
                  onClick={() => props.onPlaySound(snd.id)}
                >
                  <span class="soundboard-emoji">{snd.emoji}</span>
                  <div class="soundboard-info">
                    <span class="soundboard-name">{snd.name}</span>
                    <span class="soundboard-desc">{snd.desc}</span>
                  </div>
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
