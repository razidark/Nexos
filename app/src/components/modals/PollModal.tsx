import { createSignal, For, Show } from 'solid-js';

interface PollModalProps {
  show: boolean;
  onClose: () => void;
  onSubmit: (question: string, options: string[]) => void;
}

export function PollModal(props: PollModalProps) {
  const [question, setQuestion] = createSignal('');
  const [options, setOptions] = createSignal(['', '']);

  const addOption = () => {
    if (options().length < 6) {
      setOptions((prev) => [...prev, '']);
    }
  };

  const removeOption = (idx: number) => {
    if (options().length > 2) {
      setOptions((prev) => prev.filter((_, i) => i !== idx));
    }
  };

  const handleOptionChange = (idx: number, val: string) => {
    setOptions((prev) => {
      const copy = [...prev];
      copy[idx] = val;
      return copy;
    });
  };

  const handleSubmit = () => {
    const validQuestion = question().trim();
    const validOptions = options()
      .map((o) => o.trim())
      .filter((o) => o.length > 0);

    if (!validQuestion || validOptions.length < 2) {
      alert('Digite uma pergunta e pelo menos 2 opções para criar a enquete.');
      return;
    }

    props.onSubmit(validQuestion, validOptions);
    setQuestion('');
    setOptions(['', '']);
    props.onClose();
  };

  return (
    <Show when={props.show}>
      <div class="modal-backdrop" onClick={props.onClose}>
        <div class="modal-content poll-modal" onClick={(e) => e.stopPropagation()}>
          <div class="modal-header">
            <span>📊 Criar Nova Enquete</span>
            <button class="close-btn" onClick={props.onClose}>✕</button>
          </div>

          <div class="form-group">
            <label>PERGUNTA OU TÓPICO DA ENQUETE</label>
            <input
              type="text"
              placeholder="Ex: Qual jogo vamos jogar hoje à noite?"
              value={question()}
              onInput={(e) => setQuestion(e.currentTarget.value)}
            />
          </div>

          <div class="form-group">
            <label>OPÇÕES DE RESPOSTA</label>
            <div class="poll-options-list">
              <For each={options()}>
                {(opt, idx) => (
                  <div class="poll-option-row">
                    <span class="poll-option-num">{idx() + 1}.</span>
                    <input
                      type="text"
                      placeholder={`Opção ${idx() + 1}`}
                      value={opt}
                      onInput={(e) => handleOptionChange(idx(), e.currentTarget.value)}
                    />
                    <Show when={options().length > 2}>
                      <button
                        type="button"
                        class="remove-poll-opt-btn"
                        onClick={() => removeOption(idx())}
                      >
                        ✕
                      </button>
                    </Show>
                  </div>
                )}
              </For>
            </div>

            <Show when={options().length < 6}>
              <button type="button" class="btn-secondary mini add-opt-btn" onClick={addOption}>
                + Adicionar Outra Opção
              </button>
            </Show>
          </div>

          <div class="modal-footer">
            <button class="btn-secondary" onClick={props.onClose}>
              Cancelar
            </button>
            <button class="btn-primary" onClick={handleSubmit}>
              Criar Enquete
            </button>
          </div>
        </div>
      </div>
    </Show>
  );
}
