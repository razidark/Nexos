import { Show } from 'solid-js';

interface CreateChannelModalProps {
  show: boolean;
  onClose: () => void;
  channelName: string;
  onChannelNameChange: (val: string) => void;
  channelType: 'text' | 'voice';
  onChannelTypeChange: (val: 'text' | 'voice') => void;
  onSubmit: () => void;
}

export function CreateChannelModal(props: CreateChannelModalProps) {
  return (
    <Show when={props.show}>
      <div class="modal-backdrop" onClick={props.onClose}>
        <div class="modal-content" onClick={(e) => e.stopPropagation()}>
          <div class="modal-header">Criar Canal</div>
          <div class="form-group">
            <label>TIPO DE CANAL</label>
            <select
              value={props.channelType}
              onChange={(e) => props.onChannelTypeChange(e.currentTarget.value as 'text' | 'voice')}
            >
              <option value="text"># Canal de Texto</option>
              <option value="voice">🔊 Canal de Voz & Vídeo</option>
            </select>
          </div>
          <div class="form-group">
            <label>NOME DO CANAL</label>
            <input
              type="text"
              placeholder="novo-canal"
              value={props.channelName}
              onInput={(e) => props.onChannelNameChange(e.currentTarget.value)}
              onKeyDown={(e) => e.key === 'Enter' && props.onSubmit()}
            />
          </div>
          <div class="modal-footer">
            <button class="btn-secondary" onClick={props.onClose}>
              Cancelar
            </button>
            <button class="btn-primary" onClick={props.onSubmit}>
              Criar Canal
            </button>
          </div>
        </div>
      </div>
    </Show>
  );
}
