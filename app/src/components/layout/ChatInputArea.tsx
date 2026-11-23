import { createSignal, For, Show } from 'solid-js';
import type { Message, Attachment } from '../../types';

interface ChatInputAreaProps {
  channelName: string;
  input: string;
  onInputChange: (val: string) => void;
  replyingTo: Message | null;
  onCancelReply: () => void;
  pendingAttachments: Attachment[];
  onRemoveAttachment: (index: number) => void;
  onFileUpload: (e: Event) => void;
  onPaste: (e: ClipboardEvent) => void;
  onSendMessage: () => void;
  onSendVoiceNote?: (audioDataUrl: string, duration: number) => void;
  onTyping: () => void;
  onOpenEmojiPicker: () => void;
  onOpenGifPicker: () => void;
  onOpenPollModal?: () => void;
  isDisabled: boolean;
  fileInputRef?: (el: HTMLInputElement) => void;
}

export function ChatInputArea(props: ChatInputAreaProps) {
  const [isRecording, setIsRecording] = createSignal(false);
  const [recordSeconds, setRecordSeconds] = createSignal(0);
  let mediaRecorder: MediaRecorder | null = null;
  let audioChunks: Blob[] = [];
  let recordTimer: any = null;
  let startTime = 0;

  const startVoiceRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunks = [];
      mediaRecorder = new MediaRecorder(stream);

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunks.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64Audio = reader.result as string;
          const duration = (Date.now() - startTime) / 1000;
          props.onSendVoiceNote?.(base64Audio, duration);
        };
        reader.readAsDataURL(audioBlob);
        stream.getTracks().forEach((t) => t.stop());
      };

      startTime = Date.now();
      mediaRecorder.start();
      setIsRecording(true);
      setRecordSeconds(0);
      recordTimer = setInterval(() => {
        setRecordSeconds((prev) => prev + 1);
      }, 1000);
    } catch {
      alert('Não foi possível acessar o microfone para gravar áudio.');
    }
  };

  const stopVoiceRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
    }
    if (recordTimer) clearInterval(recordTimer);
    setIsRecording(false);
  };

  const cancelVoiceRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.onstop = null;
      mediaRecorder.stop();
    }
    if (recordTimer) clearInterval(recordTimer);
    setIsRecording(false);
  };

  return (
    <div class="chat-input-container">
      {/* Replying banner */}
      <Show when={props.replyingTo}>
        <div class="replying-banner">
          <span>
            Respondendo a <strong>@{props.replyingTo!.sender.username}</strong>:{' '}
            <em>{props.replyingTo!.text.slice(0, 40)}...</em>
          </span>
          <button class="cancel-reply-btn" onClick={props.onCancelReply}>
            ✕
          </button>
        </div>
      </Show>

      {/* Pending Attachments */}
      <Show when={props.pendingAttachments.length > 0}>
        <div class="pending-attachments">
          <For each={props.pendingAttachments}>
            {(att, idx) => (
              <div class="pending-att-chip">
                <span>📎 {att.name}</span>
                <button
                  type="button"
                  class="remove-att-btn"
                  onClick={() => props.onRemoveAttachment(idx())}
                >
                  ✕
                </button>
              </div>
            )}
          </For>
        </div>
      </Show>

      {/* Voice Recording In-Progress Banner */}
      <Show when={isRecording()}>
        <div class="recording-voice-banner">
          <div class="recording-pulse-dot" />
          <span class="recording-time">
            Gravando Mensagem de Voz: {recordSeconds()}s
          </span>
          <div class="recording-actions">
            <button
              type="button"
              class="cancel-record-btn"
              onClick={cancelVoiceRecording}
            >
              Cancelar ✕
            </button>
            <button
              type="button"
              class="send-record-btn"
              onClick={stopVoiceRecording}
            >
              Enviar Áudio ↑
            </button>
          </div>
        </div>
      </Show>

      <div class="chat-input-bar">
        {/* Hidden File Input */}
        <input
          ref={props.fileInputRef}
          type="file"
          multiple
          style={{ display: 'none' }}
          onChange={props.onFileUpload}
        />

        <button
          type="button"
          class="attach-btn"
          title="Anexar arquivo ou imagem"
          onClick={() => {
            const el = document.getElementById('chat-hidden-file-input') as HTMLInputElement;
            if (el) el.click();
          }}
        >
          +
        </button>

        <input
          id="chat-hidden-file-input"
          type="file"
          multiple
          style={{ display: 'none' }}
          onChange={props.onFileUpload}
        />

        <input
          type="text"
          class="chat-input"
          placeholder={`Conversar em ${props.channelName}...`}
          disabled={props.isDisabled || isRecording()}
          value={props.input}
          onInput={(e) => {
            props.onInputChange(e.currentTarget.value);
            props.onTyping();
          }}
          onPaste={props.onPaste}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              props.onSendMessage();
            }
          }}
        />

        <div class="chat-input-actions-right">
          {/* Poll Button */}
          <button
            type="button"
            class="input-icon-btn"
            title="Criar Enquete"
            onClick={props.onOpenPollModal}
          >
            📊
          </button>

          {/* GIF Button */}
          <button
            type="button"
            class="input-icon-btn gif-badge-btn"
            title="Escolher GIF Animado"
            onClick={props.onOpenGifPicker}
          >
            GIF
          </button>

          {/* Sticker Button */}
          <button
            type="button"
            class="input-icon-btn"
            title="Figurinhas"
            onClick={props.onOpenGifPicker}
          >
            🎭
          </button>

          {/* Emoji Button */}
          <button
            type="button"
            class="input-icon-btn"
            title="Escolher Emoji"
            onClick={props.onOpenEmojiPicker}
          >
            😀
          </button>

          {/* Voice Memo Mic Button */}
          <button
            type="button"
            class={`input-icon-btn ${isRecording() ? 'recording-active' : ''}`}
            title="Gravar Mensagem de Voz"
            onClick={isRecording() ? stopVoiceRecording : startVoiceRecording}
          >
            🎙️
          </button>

          {/* Send Button */}
          <button
            class="send-btn"
            onClick={props.onSendMessage}
            disabled={
              (!props.input.trim() && props.pendingAttachments.length === 0) ||
              props.isDisabled
            }
          >
            ↑
          </button>
        </div>
      </div>
    </div>
  );
}
