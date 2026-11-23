import { createSignal, For, Show } from 'solid-js';

interface GifPickerModalProps {
  show: boolean;
  onClose: () => void;
  onSelectGif: (gifUrl: string) => void;
}

const GIF_CATEGORIES: Record<string, { title: string; url: string }[]> = {
  Gaming: [
    { title: 'Victory GG', url: 'https://media.giphy.com/media/artj92V8o75VPL7AeQ/giphy.gif' },
    { title: 'Level Up', url: 'https://media.giphy.com/media/26n6WywJyh39n1pBu/giphy.gif' },
    { title: 'Cyberpunk Glitch', url: 'https://media.giphy.com/media/3o7TKSjRrfIPjeiVyM/giphy.gif' },
    { title: 'Controller Gaming', url: 'https://media.giphy.com/media/l41lI4bYmcsPJX9Go/giphy.gif' },
  ],
  Anime: [
    { title: 'Anime Wow', url: 'https://media.giphy.com/media/11ISwbgGL28bXa/giphy.gif' },
    { title: 'Dance Vibe', url: 'https://media.giphy.com/media/13HgwGsXF0aiGY/giphy.gif' },
    { title: 'Anime Cheers', url: 'https://media.giphy.com/media/MeIucajzTK2kyfcBUo/giphy.gif' },
    { title: 'Super Saiyan', url: 'https://media.giphy.com/media/B6SyssSlTgPXq/giphy.gif' },
  ],
  Reações: [
    { title: 'Thumbs Up', url: 'https://media.giphy.com/media/111ebonMs90YLu/giphy.gif' },
    { title: 'Mind Blown', url: 'https://media.giphy.com/media/26ufdipQqU2lhNA4g/giphy.gif' },
    { title: 'Cat Jam Vibe', url: 'https://media.giphy.com/media/jpbnoe3UIa8TU8LM13/giphy.gif' },
    { title: 'Applause Clap', url: 'https://media.giphy.com/media/7rj2ZgttvgomY/giphy.gif' },
  ],
  Memes: [
    { title: 'Popcat Open', url: 'https://media.giphy.com/media/GeimqsH0TLDt4tScGw/giphy.gif' },
    { title: 'Doggo Cool', url: 'https://media.giphy.com/media/mCRJDo24UvJMA/giphy.gif' },
    { title: 'Deal With It', url: 'https://media.giphy.com/media/3o7TKr3nzbh5WgCFxe/giphy.gif' },
    { title: 'Surprised Pikachu', url: 'https://media.giphy.com/media/6nWhy3ulBL7GSCvKw6/giphy.gif' },
  ],
};

export function GifPickerModal(props: GifPickerModalProps) {
  const [activeCategory, setActiveCategory] = createSignal<string>('Gaming');
  const [customGifUrl, setCustomGifUrl] = createSignal<string>('');

  const sendCustom = () => {
    if (customGifUrl().trim()) {
      props.onSelectGif(customGifUrl().trim());
      setCustomGifUrl('');
      props.onClose();
    }
  };

  return (
    <Show when={props.show}>
      <div class="modal-backdrop" onClick={props.onClose}>
        <div class="modal-content gif-picker-modal" onClick={(e) => e.stopPropagation()}>
          <div class="modal-header">
            <span>🎭 Escolher GIF Animado</span>
            <button class="close-btn" onClick={props.onClose}>✕</button>
          </div>

          <div style={{ display: 'flex', gap: '8px', 'margin-bottom': '12px' }}>
            <input
              type="text"
              placeholder="Cole o link direto de qualquer GIF ou escolha abaixo..."
              value={customGifUrl()}
              onInput={(e) => setCustomGifUrl(e.currentTarget.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendCustom()}
              style={{ flex: 1 }}
            />
            <button type="button" class="btn-primary" onClick={sendCustom}>
              Enviar
            </button>
          </div>

          {/* Category Tabs */}
          <div class="gif-cat-tabs">
            <For each={Object.keys(GIF_CATEGORIES)}>
              {(cat) => (
                <button
                  type="button"
                  class={`gif-tab-btn ${activeCategory() === cat ? 'active' : ''}`}
                  onClick={() => setActiveCategory(cat)}
                >
                  {cat}
                </button>
              )}
            </For>
          </div>

          {/* GIFs Grid */}
          <div class="gif-grid">
            <For each={GIF_CATEGORIES[activeCategory()] || []}>
              {(gif) => (
                <div
                  class="gif-card"
                  onClick={() => {
                    props.onSelectGif(gif.url);
                    props.onClose();
                  }}
                  title={gif.title}
                >
                  <img src={gif.url} alt={gif.title} loading="lazy" class="gif-img" />
                  <span class="gif-caption">{gif.title}</span>
                </div>
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
