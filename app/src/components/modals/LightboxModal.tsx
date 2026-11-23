import { Show } from 'solid-js';

interface LightboxModalProps {
  imageUrl: string | null;
  onClose: () => void;
}

export function LightboxModal(props: LightboxModalProps) {
  return (
    <Show when={props.imageUrl}>
      <div class="lightbox-backdrop" onClick={props.onClose}>
        <div class="lightbox-controls">
          <a
            href={props.imageUrl!}
            download="nexos_media"
            target="_blank"
            rel="noreferrer"
            class="lightbox-btn"
            onClick={(e) => e.stopPropagation()}
            title="Abrir imagem original"
          >
            ↗️ Abrir Original
          </a>
          <button class="lightbox-btn close" onClick={props.onClose} title="Fechar (Esc)">
            ✕
          </button>
        </div>

        <div class="lightbox-image-container" onClick={(e) => e.stopPropagation()}>
          <img src={props.imageUrl!} alt="Fullscreen View" class="lightbox-image" />
        </div>
      </div>
    </Show>
  );
}
