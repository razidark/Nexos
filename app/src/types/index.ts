export interface UserSession {
  id: string;
  email: string;
  username: string;
  avatar: string;
  token?: string;
  customStatus?: string;
  banner?: string;
  avatarDecoration?: string;
  bio?: string;
  theme?: string;
}

export interface Activity {
  name: string;
  type: 'playing' | 'listening' | 'streaming' | 'coding';
  details?: string;
  time?: string;
  icon?: string;
}

export interface EmbedData {
  color?: string;
  author?: string;
  title: string;
  description?: string;
  image?: string;
  url?: string;
}

export interface Member {
  id: string;
  username: string;
  avatar: string;
  banner?: string;
  avatarDecoration?: string;
  bio?: string;
  role?: 'owner' | 'admin' | 'moderator' | 'vip' | 'member';
  clanTag?: string;
  activity?: Activity;
  voiceChannelId: string | null;
  isMuted: boolean;
  isDeafened: boolean;
  isSpeaking: boolean;
  isCameraOn: boolean;
  isScreenSharing: boolean;
  status: 'online' | 'idle' | 'dnd' | 'offline';
  customStatus?: string;
  isBot?: boolean;
}

export interface Attachment {
  name: string;
  type: string;
  size: number;
  url: string;
}

export interface PollOption {
  id: string;
  text: string;
  votes: string[];
}

export interface PollData {
  id: string;
  question: string;
  options: PollOption[];
  closed?: boolean;
}

export interface Message {
  id: string;
  channelId: string;
  sender: {
    id: string;
    username: string;
    avatar: string;
    avatarDecoration?: string;
    role?: 'owner' | 'admin' | 'moderator' | 'vip' | 'member';
    clanTag?: string;
    isBot?: boolean;
  };
  text: string;
  timestamp: number;
  edited?: boolean;
  pinned?: boolean;
  poll?: PollData;
  voiceNote?: {
    duration: number;
    url: string;
  };
  embed?: EmbedData;
  attachments?: Attachment[];
  reactions?: Record<string, string[]>;
  replyTo?: {
    id: string;
    username: string;
    text: string;
  };
}

export interface Channel {
  id: string;
  name: string;
  type: 'text' | 'voice';
  category?: string;
  unreadCount?: number;
}

export interface Guild {
  id: string;
  name: string;
  icon: string;
  channels: Channel[];
}

export type ViewMode = 'chat' | 'stage' | 'split';
export type UserPresenceStatus = 'online' | 'idle' | 'dnd' | 'offline';
export type SettingsTab = 'profile' | 'appearance' | 'voice_video';
export type AudioInputMode = 'voice_activity' | 'push_to_talk';
export type SoundboardSound = 'airhorn' | 'badumtss' | 'victory' | 'crickets' | 'quack' | 'bell';

