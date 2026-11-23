import Fastify from 'fastify';
import cors from '@fastify/cors';
import websocket from '@fastify/websocket';
import * as fs from 'fs';
import * as path from 'path';
import {
  createToken,
  generateSecret,
  hashPassword,
  isHashedPassword,
  resolveSecret,
  verifyPassword,
  verifyToken,
} from './auth.js';

const fastify = Fastify({ logger: false, bodyLimit: 25 * 1024 * 1024 });

fastify.register(cors, {
  // Local-only desktop client: accept requests coming from the local machine.
  origin: (origin, cb) => {
    if (!origin) return cb(null, true);
    try {
      const { hostname } = new URL(origin);
      const isLocal = hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1';
      cb(null, isLocal);
    } catch {
      cb(null, false);
    }
  },
});
fastify.register(websocket);

interface Attachment {
  url: string;
  name: string;
  type: string;
  size?: number;
}

interface UserAccount {
  id: string;
  email: string;
  username: string;
  password: string; // Plain/hashed in store
  avatar: string;
  banner?: string;
  avatarDecoration?: string;
  bio?: string;
  customStatus?: string;
  status: 'online' | 'idle' | 'dnd' | 'offline';
  theme?: string;
  createdAt: number;
}

interface Member {
  id: string;
  username: string;
  avatar: string;
  banner?: string;
  avatarDecoration?: string;
  bio?: string;
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

interface PollOption {
  id: string;
  text: string;
  votes: string[];
}

interface PollData {
  id: string;
  question: string;
  options: PollOption[];
  closed?: boolean;
}

interface Message {
  id: string;
  channelId: string;
  sender: {
    id: string;
    username: string;
    avatar: string;
    avatarDecoration?: string;
    role?: 'admin' | 'moderator' | 'vip' | 'member';
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
  attachments?: Attachment[];
  reactions?: Record<string, string[]>;
  replyTo?: {
    id: string;
    username: string;
    text: string;
  };
}

interface Channel {
  id: string;
  name: string;
  type: 'text' | 'voice';
  category?: string; // e.g. "CANAIS DE TEXTO", "SALAS DE VOZ"
}

interface Guild {
  id: string;
  name: string;
  icon: string; // Emoji or image/gif URL / DataURL
  banner?: string;
  channels: Channel[];
}

interface StoreData {
  users: Record<string, UserAccount>; // id -> UserAccount
  guilds: Guild[];
  messages: Record<string, Message[]>; // channelId -> Message[]
  secret?: string; // server signing secret for session tokens
}

const STORE_PATH = path.join(process.cwd(), 'nexos_store.json');

function loadStore(): StoreData {
  try {
    if (fs.existsSync(STORE_PATH)) {
      const raw = fs.readFileSync(STORE_PATH, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('Error reading nexos_store.json:', err);
  }
  return {
    users: {},
    guilds: [
      {
        id: 'guild-community',
        name: 'Nexos Community',
        icon: '🌌',
        channels: [
          { id: 'chat-geral', name: 'geral', type: 'text', category: 'CANAIS DE TEXTO' },
          { id: 'chat-anuncios', name: 'anúncios', type: 'text', category: 'CANAIS DE TEXTO' },
          { id: 'chat-midia', name: 'mídia-e-clips', type: 'text', category: 'CANAIS DE TEXTO' },
          { id: 'voice-lobby', name: 'Lounge (Voz & Cam)', type: 'voice', category: 'SALAS DE VOZ' },
          { id: 'voice-gaming', name: 'Jogos & Stream', type: 'voice', category: 'SALAS DE VOZ' },
        ]
      }
    ],
    messages: {}
  };
}

const store: StoreData = loadStore();

// Signing secret for session tokens. Persisted in the store so restarts keep sessions valid.
const SESSION_SECRET = resolveSecret(store.secret, generateSecret());
store.secret = SESSION_SECRET;
saveStore();

function saveStore() {
  try {
    const tempPath = `${STORE_PATH}.tmp`;
    fs.writeFileSync(tempPath, JSON.stringify(store, null, 2), 'utf-8');
    fs.renameSync(tempPath, STORE_PATH);
  } catch (err) {
    console.error('Error saving nexos_store.json:', err);
  }
}

// In-memory active presence & connections
const onlineMembers: Record<string, Member> = {};
const connections: Record<string, any> = {}; // userId -> connection
const typingUsers: Record<string, Record<string, number>> = {}; // channelId -> { userId: timestamp }

function broadcast(payload: any) {
  const raw = JSON.stringify(payload);
  for (const id in connections) {
    const conn = connections[id];
    if (conn.socket && conn.socket.readyState === 1) {
      conn.socket.send(raw);
    }
  }
}

function sendToPeer(targetId: string, payload: any) {
  const conn = connections[targetId];
  if (conn && conn.socket && conn.socket.readyState === 1) {
    conn.socket.send(JSON.stringify(payload));
  }
}

function getActiveMembersList(): Member[] {
  return Object.values(onlineMembers);
}

fastify.get('/', async () => ({
  status: 'online',
  name: 'Nexos Gateway & Realtime Core',
  version: '2.5.0',
  registeredUsers: Object.keys(store.users).length,
  activeConnections: Object.keys(connections).length,
  guildsCount: store.guilds.length,
}));

// Rate limiting map for authentication attempts (IP/key -> { count, resetAt })
const authRateLimits = new Map<string, { count: number; resetAt: number }>();

function checkAuthRateLimit(key: string, limit = 10, windowMs = 60000): boolean {
  const now = Date.now();
  const entry = authRateLimits.get(key);
  if (!entry || now > entry.resetAt) {
    authRateLimits.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (entry.count >= limit) {
    return false;
  }
  entry.count++;
  return true;
}

// HTTP Authentication Endpoints
fastify.post('/api/auth/register', async (req, reply) => {
  const clientIp = req.ip || 'local';
  if (!checkAuthRateLimit(`reg_${clientIp}`, 10, 60000)) {
    return reply.status(429).send({ error: 'Muitas tentativas de registro. Aguarde um minuto.' });
  }

  const body = req.body as any;
  const { email, username, password, avatar } = body || {};

  if (!email || !username || !password) {
    return reply.status(400).send({ error: 'Preencha todos os campos obrigatórios.' });
  }

  const existingEmail = Object.values(store.users).find(u => u.email.toLowerCase() === email.toLowerCase());
  if (existingEmail) {
    return reply.status(400).send({ error: 'Este e-mail já está cadastrado.' });
  }

  const existingUsername = Object.values(store.users).find(u => u.username.toLowerCase() === username.toLowerCase());
  if (existingUsername) {
    return reply.status(400).send({ error: 'Este nome de usuário já está em uso.' });
  }

  const userId = `usr_${Math.random().toString(36).substring(2, 9)}`;
  const newUser: UserAccount = {
    id: userId,
    email,
    username,
    password: hashPassword(password),
    avatar: avatar || 'solar',
    status: 'online',
    customStatus: 'Novo no Nexos 🎉',
    createdAt: Date.now(),
  };

  store.users[userId] = newUser;
  saveStore();

  return reply.send({
    user: {
      id: newUser.id,
      email: newUser.email,
      username: newUser.username,
      avatar: newUser.avatar,
      customStatus: newUser.customStatus,
      status: newUser.status,
    },
    token: createToken(userId, SESSION_SECRET)
  });
});

fastify.post('/api/auth/login', async (req, reply) => {
  const clientIp = req.ip || 'local';
  if (!checkAuthRateLimit(`login_${clientIp}`, 15, 60000)) {
    return reply.status(429).send({ error: 'Muitas tentativas de login. Aguarde um minuto.' });
  }

  const body = req.body as any;
  const { login, password } = body || {};

  if (!login || !password) {
    return reply.status(400).send({ error: 'Informe usuário/email e senha.' });
  }

  const candidate = Object.values(store.users).find(
    u => u.email.toLowerCase() === login.toLowerCase() || u.username.toLowerCase() === login.toLowerCase()
  );

  if (!candidate || !verifyPassword(password, candidate.password)) {
    return reply.status(401).send({ error: 'Credenciais inválidas. Verifique os dados.' });
  }

  // Upgrade legacy plaintext accounts to a hashed password on successful login.
  if (!isHashedPassword(candidate.password)) {
    candidate.password = hashPassword(password);
    saveStore();
  }

  const user = candidate;

  return reply.send({
    user: {
      id: user.id,
      email: user.email,
      username: user.username,
      avatar: user.avatar,
      customStatus: user.customStatus,
      status: user.status,
    },
    token: createToken(user.id, SESSION_SECRET)
  });
});

// WebSocket Gateway
fastify.register(async (fastify) => {
  fastify.get('/gateway', { websocket: true }, (connection, req) => {
    let currentUserId: string | null = null;

    connection.socket.on('message', async (messageBuffer: any) => {
      try {
        const payload = JSON.parse(messageBuffer.toString());
        const { type, data } = payload;

        switch (type) {
          case 'IDENTIFY': {
            const { user } = data || {};

            // Identity is derived from the signed session token, never from
            // client-supplied fields.
            const token = user?.token;
            const authenticatedUserId = verifyToken(token, SESSION_SECRET);
            if (!authenticatedUserId) {
              connection.socket.send(JSON.stringify({
                type: 'ERROR',
                data: { message: 'Sessão inválida ou expirada. Faça login novamente.' }
              }));
              connection.socket.close();
              return;
            }

            const dbUser = store.users[authenticatedUserId];
            if (!dbUser) {
              connection.socket.send(JSON.stringify({
                type: 'ERROR',
                data: { message: 'Conta não encontrada no servidor.' }
              }));
              connection.socket.close();
              return;
            }

            const userId: string = authenticatedUserId;
            currentUserId = userId;
            connections[userId] = connection;

            const memberObj: Member = {
              id: dbUser.id,
              username: dbUser.username,
              avatar: dbUser.avatar,
              banner: dbUser.banner,
              avatarDecoration: dbUser.avatarDecoration,
              bio: dbUser.bio,
              voiceChannelId: null,
              isMuted: false,
              isDeafened: false,
              isSpeaking: false,
              isCameraOn: false,
              isScreenSharing: false,
              status: (dbUser.status as any) || 'online',
              customStatus: dbUser.customStatus,
            };

            onlineMembers[userId] = memberObj;

            // Send full initial state
            connection.socket.send(JSON.stringify({
              type: 'INIT',
              data: {
                self: memberObj,
                members: getActiveMembersList(),
                guilds: store.guilds,
                messages: store.messages,
              }
            }));

            broadcast({
              type: 'MEMBERS_UPDATE',
              data: getActiveMembersList(),
            });
            break;
          }

          case 'UPDATE_SELF': {
            if (!currentUserId || !onlineMembers[currentUserId]) return;
            const m = onlineMembers[currentUserId];

            if (data.username) m.username = data.username;
            if (data.avatar) m.avatar = data.avatar;
            if (data.banner !== undefined) m.banner = data.banner;
            if (data.avatarDecoration !== undefined) m.avatarDecoration = data.avatarDecoration;
            if (data.bio !== undefined) m.bio = data.bio;
            if (data.customStatus !== undefined) m.customStatus = data.customStatus;
            if (data.status) m.status = data.status;
            if (data.isMuted !== undefined) m.isMuted = data.isMuted;
            if (data.isDeafened !== undefined) m.isDeafened = data.isDeafened;
            if (data.isSpeaking !== undefined) m.isSpeaking = data.isSpeaking;
            if (data.isCameraOn !== undefined) m.isCameraOn = data.isCameraOn;
            if (data.isScreenSharing !== undefined) m.isScreenSharing = data.isScreenSharing;

            if (store.users[currentUserId]) {
              if (data.username) store.users[currentUserId].username = data.username;
              if (data.avatar) store.users[currentUserId].avatar = data.avatar;
              if (data.banner !== undefined) store.users[currentUserId].banner = data.banner;
              if (data.avatarDecoration !== undefined) store.users[currentUserId].avatarDecoration = data.avatarDecoration;
              if (data.bio !== undefined) store.users[currentUserId].bio = data.bio;
              if (data.customStatus !== undefined) store.users[currentUserId].customStatus = data.customStatus;
              if (data.status) store.users[currentUserId].status = data.status;
              if (data.theme) store.users[currentUserId].theme = data.theme;
              saveStore();
            }

            broadcast({
              type: 'MEMBERS_UPDATE',
              data: getActiveMembersList(),
            });
            break;
          }

          case 'CREATE_GUILD': {
            const { name, icon } = data;
            const newGuild: Guild = {
              id: `guild-${Math.random().toString(36).substring(2, 9)}`,
              name,
              icon: icon || '🪐',
              channels: [
                { id: `text-${Date.now()}-1`, name: 'geral', type: 'text', category: 'CANAIS DE TEXTO' },
                { id: `text-${Date.now()}-2`, name: 'anúncios', type: 'text', category: 'CANAIS DE TEXTO' },
                { id: `voice-${Date.now()}-1`, name: 'Geral Voz', type: 'voice', category: 'SALAS DE VOZ' }
              ]
            };
            store.guilds.push(newGuild);
            saveStore();
            broadcast({ type: 'GUILDS_UPDATE', data: store.guilds });
            break;
          }

          case 'CREATE_CHANNEL': {
            const { guildId, name, channelType, category } = data;
            const guild = store.guilds.find(g => g.id === guildId);
            if (guild) {
              const defaultCat = channelType === 'voice' ? 'SALAS DE VOZ' : 'CANAIS DE TEXTO';
              const newChan: Channel = {
                id: `${channelType}-${Date.now()}`,
                name: name.toLowerCase().replace(/\s+/g, '-'),
                type: channelType,
                category: category || defaultCat
              };
              guild.channels.push(newChan);
              saveStore();
              broadcast({ type: 'GUILDS_UPDATE', data: store.guilds });
            }
            break;
          }

          case 'DELETE_CHANNEL': {
            const { guildId, channelId } = data;
            const guild = store.guilds.find(g => g.id === guildId);
            if (guild) {
              guild.channels = guild.channels.filter(c => c.id !== channelId);
              saveStore();
              broadcast({ type: 'GUILDS_UPDATE', data: store.guilds });
            }
            break;
          }

          case 'JOIN_VOICE': {
            if (!currentUserId || !onlineMembers[currentUserId]) return;
            const { channelId } = data;
            onlineMembers[currentUserId].voiceChannelId = channelId;

            broadcast({
              type: 'MEMBERS_UPDATE',
              data: getActiveMembersList(),
            });

            if (channelId) {
              for (const peerId in onlineMembers) {
                if (peerId !== currentUserId && onlineMembers[peerId].voiceChannelId === channelId) {
                  sendToPeer(peerId, {
                    type: 'PEER_JOINED',
                    data: {
                      peerId: currentUserId,
                      username: onlineMembers[currentUserId].username,
                      isCameraOn: onlineMembers[currentUserId].isCameraOn,
                      isScreenSharing: onlineMembers[currentUserId].isScreenSharing,
                    }
                  });
                }
              }
            }
            break;
          }

          case 'LEAVE_VOICE': {
            if (!currentUserId || !onlineMembers[currentUserId]) return;
            const prevChannel = onlineMembers[currentUserId].voiceChannelId;
            onlineMembers[currentUserId].voiceChannelId = null;
            onlineMembers[currentUserId].isCameraOn = false;
            onlineMembers[currentUserId].isScreenSharing = false;
            onlineMembers[currentUserId].isSpeaking = false;

            broadcast({
              type: 'MEMBERS_UPDATE',
              data: getActiveMembersList(),
            });

            if (prevChannel) {
              for (const peerId in onlineMembers) {
                if (peerId !== currentUserId && onlineMembers[peerId].voiceChannelId === prevChannel) {
                  sendToPeer(peerId, {
                    type: 'PEER_LEFT',
                    data: { peerId: currentUserId }
                  });
                }
              }
            }
            break;
          }

          case 'WEBRTC_SIGNAL': {
            if (!currentUserId) return;
            const { targetId, signal, streamType } = data;
            sendToPeer(targetId, {
              type: 'WEBRTC_SIGNAL',
              data: {
                senderId: currentUserId,
                signal,
                streamType: streamType || 'unified'
              }
            });
            break;
          }

          case 'TYPING': {
            if (!currentUserId || !onlineMembers[currentUserId]) return;
            const { channelId, isTyping } = data;
            if (!typingUsers[channelId]) typingUsers[channelId] = {};
            if (isTyping) {
              typingUsers[channelId][currentUserId] = Date.now();
            } else {
              delete typingUsers[channelId][currentUserId];
            }

            const activeTypers = Object.keys(typingUsers[channelId])
              .filter(uId => uId !== currentUserId && Date.now() - typingUsers[channelId][uId] < 5000)
              .map(uId => onlineMembers[uId]?.username || 'Alguém');

            broadcast({
              type: 'TYPING_UPDATE',
              data: { channelId, typers: activeTypers }
            });
            break;
          }

          case 'TOGGLE_REACTION': {
            if (!currentUserId) return;
            const { channelId, messageId, emoji } = data;
            const chanMsgs = store.messages[channelId];
            if (chanMsgs) {
              const targetMsg = chanMsgs.find(m => m.id === messageId);
              if (targetMsg) {
                if (!targetMsg.reactions) targetMsg.reactions = {};
                if (!targetMsg.reactions[emoji]) targetMsg.reactions[emoji] = [];

                const userIndex = targetMsg.reactions[emoji].indexOf(currentUserId);
                if (userIndex > -1) {
                  targetMsg.reactions[emoji].splice(userIndex, 1);
                  if (targetMsg.reactions[emoji].length === 0) {
                    delete targetMsg.reactions[emoji];
                  }
                } else {
                  targetMsg.reactions[emoji].push(currentUserId);
                }
                saveStore();

                broadcast({
                  type: 'MESSAGE_REACTIONS_UPDATE',
                  data: {
                    channelId,
                    messageId,
                    reactions: targetMsg.reactions
                  }
                });
              }
            }
            break;
          }

          case 'DELETE_MESSAGE': {
            const { channelId, messageId } = data;
            if (store.messages[channelId]) {
              store.messages[channelId] = store.messages[channelId].filter(m => m.id !== messageId);
              saveStore();
              broadcast({
                type: 'MESSAGE_DELETED',
                data: { channelId, messageId }
              });
            }
            break;
          }

          case 'SEND_MESSAGE': {
            if (!currentUserId || !onlineMembers[currentUserId]) return;
            const { channelId, text, apiKey, attachments, replyTo } = data;
            const member = onlineMembers[currentUserId];

            const newMsg: Message = {
              id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
              channelId,
              sender: {
                id: currentUserId,
                username: member.username,
                avatar: member.avatar,
                avatarDecoration: member.avatarDecoration,
              },
              text: text || '',
              timestamp: Date.now(),
              attachments: attachments || undefined,
              reactions: {},
              replyTo: replyTo || undefined,
            };

            if (!store.messages[channelId]) store.messages[channelId] = [];
            store.messages[channelId].push(newMsg);
            saveStore();

            // Clear typing indicator
            if (typingUsers[channelId]) {
              delete typingUsers[channelId][currentUserId];
            }

            const isDm = channelId.startsWith('dm:');
            if (isDm) {
              const parts = channelId.split(':');
              sendToPeer(parts[1], { type: 'TEXT_MESSAGE', data: newMsg });
              sendToPeer(parts[2], { type: 'TEXT_MESSAGE', data: newMsg });
            } else {
              broadcast({ type: 'TEXT_MESSAGE', data: newMsg });
            }
            break;
          }

          case 'EDIT_MESSAGE': {
            const { channelId, messageId, text } = data;
            if (store.messages[channelId]) {
              const msg = store.messages[channelId].find(m => m.id === messageId);
              if (msg && msg.sender.id === currentUserId) {
                msg.text = text;
                msg.edited = true;
                saveStore();
                broadcast({
                  type: 'MESSAGE_EDITED',
                  data: { channelId, messageId, text, edited: true }
                });
              }
            }
            break;
          }

          case 'TOGGLE_PIN': {
            const { channelId, messageId } = data;
            if (store.messages[channelId]) {
              const msg = store.messages[channelId].find(m => m.id === messageId);
              if (msg) {
                msg.pinned = !msg.pinned;
                saveStore();
                broadcast({
                  type: 'MESSAGE_PIN_UPDATE',
                  data: { channelId, messageId, pinned: msg.pinned }
                });
              }
            }
            break;
          }

          case 'PLAY_SOUNDBOARD': {
            if (!currentUserId || !onlineMembers[currentUserId]) return;
            const { sound, voiceChannelId } = data;
            const member = onlineMembers[currentUserId];
            
            // Broadcast sound to all peers in the same voice channel
            for (const peerId in onlineMembers) {
              if (onlineMembers[peerId].voiceChannelId === voiceChannelId) {
                sendToPeer(peerId, {
                  type: 'SOUNDBOARD_PLAYED',
                  data: { sound, senderUsername: member.username, voiceChannelId }
                });
              }
            }
            break;
          }

          case 'CREATE_POLL': {
            if (!currentUserId || !onlineMembers[currentUserId]) return;
            const { channelId, question, options } = data;
            const member = onlineMembers[currentUserId];

            const newMsg: Message = {
              id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
              channelId,
              sender: {
                id: currentUserId,
                username: member.username,
                avatar: member.avatar,
                avatarDecoration: member.avatarDecoration,
              },
              text: '',
              timestamp: Date.now(),
              poll: {
                id: `poll-${Date.now()}`,
                question,
                options: options.map((opt: string, i: number) => ({
                  id: `opt-${i}`,
                  text: opt,
                  votes: []
                }))
              }
            };

            if (!store.messages[channelId]) store.messages[channelId] = [];
            store.messages[channelId].push(newMsg);
            saveStore();

            const isDm = channelId.startsWith('dm:');
            if (isDm) {
              const parts = channelId.split(':');
              sendToPeer(parts[1], { type: 'TEXT_MESSAGE', data: newMsg });
              sendToPeer(parts[2], { type: 'TEXT_MESSAGE', data: newMsg });
            } else {
              broadcast({ type: 'TEXT_MESSAGE', data: newMsg });
            }
            break;
          }

          case 'VOTE_POLL': {
            const uid = currentUserId;
            if (!uid) return;
            const { channelId, messageId, optionId } = data;
            if (store.messages[channelId]) {
              const msg = store.messages[channelId].find(m => m.id === messageId);
              if (msg && msg.poll) {
                msg.poll.options.forEach(opt => {
                  const idx = opt.votes.indexOf(uid);
                  if (opt.id === optionId) {
                    if (idx >= 0) {
                      opt.votes.splice(idx, 1);
                    } else {
                      opt.votes.push(uid);
                    }
                  } else {
                    if (idx >= 0) opt.votes.splice(idx, 1);
                  }
                });
                saveStore();
                broadcast({
                  type: 'POLL_UPDATED',
                  data: { channelId, messageId, poll: msg.poll }
                });
              }
            }
            break;
          }
        }
      } catch (err) {
        console.error('Error handling WebSocket event:', err);
      }
    });

    connection.socket.on('close', () => {
      if (currentUserId && onlineMembers[currentUserId]) {
        const prevChannel = onlineMembers[currentUserId].voiceChannelId;
        delete onlineMembers[currentUserId];
        delete connections[currentUserId];

        broadcast({
          type: 'MEMBERS_UPDATE',
          data: getActiveMembersList(),
        });

        if (prevChannel) {
          for (const peerId in onlineMembers) {
            if (onlineMembers[peerId].voiceChannelId === prevChannel) {
              sendToPeer(peerId, {
                type: 'PEER_LEFT',
                data: { peerId: currentUserId }
              });
            }
          }
        }
      }
    });
  });
});

const start = async () => {
  try {
    const port = process.env.PORT ? parseInt(process.env.PORT) : 5177;
    await fastify.listen({ port, host: '0.0.0.0' });
    console.log(`📡 Nexos Core online at http://localhost:${port} (ws://localhost:${port}/gateway)`);
  } catch (err) {
    console.error('Failed to start Nexos server:', err);
    process.exit(1);
  }
};

start();
