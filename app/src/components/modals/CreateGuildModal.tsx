import { Show } from 'solid-js';

interface CreateGuildModalProps {
  show: boolean;
  onClose: () => void;
  guildName: string;
  onGuildNameChange: (val: string) => void;
  guildIcon: string;
  onGuildIconChange: (val: string) => void;
  onSubmit: () => void;
}

export function CreateGuildModal(props: CreateGuildModalProps) {
  return (
    <Show when={props.show}>
      <div class="modal-backdrop" onClick={props.onClose}>
        <div class="modal-content" onClick={(e) => e.stopPropagation()}>
          <div class="modal-header">Criar Servidor</div>
          <div class="form-group">
            <label>NOME DO SERVIDOR</label>
            <input
              type="text"
              placeholder="Meu Novo Servidor"
              value={props.guildName}
              onInput={(e) => props.onGuildNameChange(e.currentTarget.value)}
              onKeyDown={(e) => e.key === 'Enter' && props.onSubmit()}
            />
          </div>
          <div class="form-group">
            <label>ÍCONE DO SERVIDOR (EMOJI OU IMAGEM/GIF)</label>
            <div style={{ display: 'flex', gap: '8px', 'align-items': 'center' }}>
              <input
                type="text"
                placeholder="Emoji ou Link de Imagem/GIF"
                value={props.guildIcon}
                onInput={(e) => props.onGuildIconChange(e.currentTarget.value)}
                style={{ flex: 1 }}
              />
              <label class="btn-secondary" style={{ cursor: 'pointer', 'font-size': '0.85rem' }}>
                📁 Upload
                <input
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    const file = e.currentTarget.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (ev) => {
                        if (ev.target?.result) props.onGuildIconChange(ev.target.result as string);
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                />
              </label>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-secondary" onClick={props.onClose}>
              Cancelar
            </button>
            <button class="btn-primary" onClick={props.onSubmit}>
              Criar Servidor
            </button>
          </div>
        </div>
      </div>
    </Show>
  );
}
