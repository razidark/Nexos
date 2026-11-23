import { createSignal, Show, onMount } from 'solid-js';
import { Auth, type UserSession } from './Auth';
import { Chat } from './Chat';
import './chat.css';

function App() {
  const [user, setUser] = createSignal<UserSession | null>(null);
  const [isInitializing, setIsInitializing] = createSignal(true);

  onMount(() => {
    try {
      const saved = localStorage.getItem('nexos_session');
      if (saved) {
        setUser(JSON.parse(saved));
      }
    } catch (e) {
      console.error('Failed to parse saved session:', e);
    } finally {
      setIsInitializing(false);
    }
  });

  const handleLogout = () => {
    localStorage.removeItem('nexos_session');
    setUser(null);
  };

  return (
    <Show when={!isInitializing()}>
      <Show
        when={user()}
        fallback={<Auth onSuccess={(session) => setUser(session)} />}
      >
        <Chat user={user()!} onLogout={handleLogout} />
      </Show>
    </Show>
  );
}

export default App;
