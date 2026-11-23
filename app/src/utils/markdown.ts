export function renderMarkdown(content: string): string {
  if (!content) return '';

  let escaped = content
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    // A double quote must never survive as a raw character: it is the
    // attribute delimiter for every href/src below, so an unescaped one
    // lets a crafted URL close the attribute and inject an event handler.
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

  // Multi-line code block: ```code```
  escaped = escaped.replace(/```([\s\S]*?)```/g, '<pre class="chat-code-block"><code>$1</code></pre>');
  // Inline code: `code`
  escaped = escaped.replace(/`([^`]+)`/g, '<code class="chat-inline-code">$1</code>');
  // Bold: **text**
  escaped = escaped.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  // Italic: *text* or _text_
  escaped = escaped.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  escaped = escaped.replace(/_([^_]+)_/g, '<em>$1</em>');
  // Blockquotes: > quote
  escaped = escaped.replace(/^>\s*(.+)$/gm, '<blockquote class="chat-quote">$1</blockquote>');
  // Mentions: @username
  escaped = escaped.replace(/(@[a-zA-Z0-9_-]+)/g, '<span class="mention-tag">$1</span>');
  // Links: https://...
  //
  // SECURITY: the URL must not be able to break out of the href attribute.
  // `[^\s]+` happily matched a double quote, so a URL such as
  //   https://evil.example"onmouseover="alert(1)
  // closed the attribute and injected a live event handler -- stored XSS,
  // readable by anyone who could post a chat message. The captured URL is
  // therefore stripped of quotes and angle brackets before it is put into
  // the attribute, and the visible text is the escaped URL.
  escaped = escaped.replace(/(https?:\/\/[^\s]+)/g, (_m, url: string) => {
    // The whole matched run is taken as the URL, then reduced to characters
    // that cannot terminate the href attribute. Taking only the safe prefix
    // would leave the attacker's tail ("onmouseover=...) as live text
    // outside the anchor, where it is still parsed as an attribute.
    const safe = url.replace(/[^a-zA-Z0-9._~:/?#@!$&()*+,;=%-]/g, '');
    if (!safe || !/^https?:\/\//i.test(safe)) return url;
    return `<a href="${safe}" target="_blank" rel="noopener noreferrer" class="chat-link">${safe}</a>`;
  });

  return escaped;
}
