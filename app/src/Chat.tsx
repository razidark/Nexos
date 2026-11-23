import { createSignal, onMount, onCleanup, createEffect, Show } from 'solid-js';
import type {
  UserSession,
  Member,
  Message,
  Guild,
  Attachment,
  ViewMode,
  UserPresenceStatus,
  SettingsTab,
  AudioInputMode,
  SoundboardSound,
} from './types';
import { playSoundEffect } from './utils/audio';

// Modular Layout Components
import { ServerSidebar } from './components/layout/ServerSidebar';
import { ChannelSidebar } from './components/layout/ChannelSidebar';
import { MainChatHeader } from './components/layout/MainChatHeader';
import { MessageList } from './components/layout/MessageList';
import { ChatInputArea } from './components/layout/ChatInputArea';
import { StageView } from './components/layout/StageView';
import { MembersSidebar } from './components/layout/MembersSidebar';

// Modular Modals
import { CreateGuildModal } from './components/modals/CreateGuildModal';
import { CreateChannelModal } from './components/modals/CreateChannelModal';
import { SettingsModal } from './components/modals/SettingsModal';
import { UserPopoutModal } from './components/modals/UserPopoutModal';
import { PinnedMessagesModal } from './components/modals/PinnedMessagesModal';
import { SoundboardModal } from './components/modals/SoundboardModal';
import { GifPickerModal } from './components/modals/GifPickerModal';
import { EmojiPickerModal } from './components/modals/EmojiPickerModal';
import { PollModal } from './components/modals/PollModal';
import { LightboxModal } from './components/modals/LightboxModal';
import { ChannelMediaModal } from './components/modals/ChannelMediaModal';

interface ChatProps {
  user: UserSession;
  onLogout: () => void;
}

export function Chat(props: ChatProps) {
  // Store signals
  const [messages, setMessages] = createSignal<Record<string, Message[]>>({});
  const [members, setMembers] = createSignal<Member[]>([]);
  const [guilds, setGuilds] = createSignal<Guild[]>([]);
  const [self, setSelf] = createSignal<Member | null>(null);
  const [collapsedCategories, setCollapsedCategories] = createSignal<Record<string, boolean>>({});

  // Navigation
  const [activeGuildId, setActiveGuildId] = createSignal<string>('dms');
  const [activeChannelId, setActiveChannelId] = createSignal<string>('');
  const [selectedDmPeerId, setSelectedDmPeerId] = createSignal<string | null>(null);

  // Unread Notification Counts
  const [unreadMap, setUnreadMap] = createSignal<Record<string, number>>({});
  const [guildUnreadMap, setGuildUnreadMap] = createSignal<Record<string, number>>({});

  // Chat inputs & Attachments
  const [input, setInput] = createSignal('');
  const [searchQuery, setSearchQuery] = createSignal('');
  const [pendingAttachments, setPendingAttachments] = createSignal<Attachment[]>([]);
  const [replyingTo, setReplyingTo] = createSignal<Message | null>(null);
  const [isDragOver, setIsDragOver] = createSignal(false);
  const [typers, setTypers] = createSignal<string[]>([]);
  const [peerVolumes, setPeerVolumes] = createSignal<Record<string, number>>({});

  // Stage & View Layout
  const [viewMode, setViewMode] = createSignal<ViewMode>('chat');
  const [spotlightTile, setSpotlightTile] = createSignal<string | null>(null);
  const [showMembersSidebar, setShowMembersSidebar] = createSignal(true);
  const [mutedChannels, setMutedChannels] = createSignal<Record<string, boolean>>({});

  // Modals
  const [showCreateGuildModal, setShowCreateGuildModal] = createSignal(false);
  const [showCreateChannelModal, setShowCreateChannelModal] = createSignal(false);
  const [showSettingsModal, setShowSettingsModal] = createSignal(false);
  const [settingsTab, setSettingsTab] = createSignal<SettingsTab>('profile');
  const [popoutUser, setPopoutUser] = createSignal<Member | null>(null);
  const [showPinnedModal, setShowPinnedModal] = createSignal(false);
  const [showSoundboardModal, setShowSoundboardModal] = createSignal(false);
  const [showGifPickerModal, setShowGifPickerModal] = createSignal(false);
  const [showEmojiPickerModal, setShowEmojiPickerModal] = createSignal(false);
  const [showPollModal, setShowPollModal] = createSignal(false);
  const [showMediaModal, setShowMediaModal] = createSignal(false);
  const [lightboxImage, setLightboxImage] = createSignal<string | null>(null);

  // Modal inputs
  const [newGuildName, setNewGuildName] = createSignal('');
  const [newGuildIcon, setNewGuildIcon] = createSignal('🪐');
  const [newChannelName, setNewChannelName] = createSignal('');
  const [newChannelType, setNewChannelType] = createSignal<'text' | 'voice'>('text');

  // Settings & Theme
  const [currentTheme, setCurrentTheme] = createSignal<string>(
    localStorage.getItem('nexos_theme') ?? 'dark-onyx'
  );
  const [editUsername, setEditUsername] = createSignal('');
  const [editAvatar, setEditAvatar] = createSignal('solar');
  const [editBanner, setEditBanner] = createSignal('');
  const [editAvatarDecoration, setEditAvatarDecoration] = createSignal('none');
  const [editBio, setEditBio] = createSignal('');
  const [editCustomStatus, setEditCustomStatus] = createSignal('');
  const [editUserStatus, setEditUserStatus] = createSignal<UserPresenceStatus>('online');

  // Audio Settings & Push to Talk
  const [inputMode, setInputMode] = createSignal<AudioInputMode>(
    (localStorage.getItem('nexos_input_mode') as AudioInputMode) ?? 'voice_activity'
  );
  const [pttKey, setPttKey] = createSignal<string>(
    localStorage.getItem('nexos_ptt_key') ?? 'Space'
  );
  const [isPttActive, setIsPttActive] = createSignal(false);

  createEffect(() => {
    document.documentElement.setAttribute('data-theme', currentTheme());
    localStorage.setItem('nexos_theme', currentTheme());
  });

  createEffect(() => {
    localStorage.setItem('nexos_input_mode', inputMode());
  });

  createEffect(() => {
    localStorage.setItem('nexos_ptt_key', pttKey());
  });

  // Media & RTC
  const [isMuted, setIsMuted] = createSignal(false);
  const [isDeafened, setIsDeafened] = createSignal(false);
  const [isCameraOn, setIsCameraOn] = createSignal(false);
  const [isScreenSharing, setIsScreenSharing] = createSignal(false);
  const [audioLevel, setAudioLevel] = createSignal(0);
  const [rtcStatus, setRtcStatus] = createSignal<'disconnected' | 'connecting' | 'connected'>(
    'disconnected'
  );
  const [activeVoiceChannel, setActiveVoiceChannel] = createSignal<string | null>(null);
  const [remoteStreams, setRemoteStreams] = createSignal<Record<string, MediaStream>>({});

  let bottomRef: HTMLDivElement | undefined;
  let localVideoRef: HTMLVideoElement | undefined;
  let localScreenRef: HTMLVideoElement | undefined;

  let socket: WebSocket | null = null;
  let localAudioStream: MediaStream | null = null;
  let localVideoStream: MediaStream | null = null;
  let localScreenStream: MediaStream | null = null;

  let typingTimeout: any = null;
  let audioContext: AudioContext | null = null;
  let analyser: AnalyserNode | null = null;
  let animFrameId: number | null = null;

  const peers: Record<
    string,
    {
      pc: RTCPeerConnection;
      stream: MediaStream;
    }
  > = {};

  const rtcConfig: RTCConfiguration = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
    ],
  };

  const toggleCategory = (catName: string) => {
    setCollapsedCategories((prev) => ({ ...prev, [catName]: !prev[catName] }));
  };

  const getDmChannelId = (id1: string, id2: string) => {
    return `dm:${[id1, id2].sort().join(':')}`;
  };

  const sendSocketMessage = (type: string, data: any) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type, data }));
    }
  };

  const scrollToBottom = () => {
    bottomRef?.scrollIntoView({ behavior: 'smooth' });
  };

  // Push to talk global keyboard listeners
  onMount(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!activeVoiceChannel() || inputMode() !== 'push_to_talk') return;
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return;

      if (e.code === pttKey() && !isPttActive()) {
        e.preventDefault();
        setIsPttActive(true);
        playSoundEffect('ptt_down');
        if (localAudioStream) {
          localAudioStream.getAudioTracks().forEach((t) => (t.enabled = true));
        }
        sendSocketMessage('UPDATE_SELF', { isSpeaking: true });
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (!activeVoiceChannel() || inputMode() !== 'push_to_talk') return;
      if (e.code === pttKey() && isPttActive()) {
        e.preventDefault();
        setIsPttActive(false);
        playSoundEffect('ptt_up');
        if (localAudioStream) {
          localAudioStream.getAudioTracks().forEach((t) => (t.enabled = false));
        }
        sendSocketMessage('UPDATE_SELF', { isSpeaking: false });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    onCleanup(() => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    });
  });

  // WebRTC Audio Visualizer
  const setupAudioVisualizer = (stream: MediaStream) => {
    try {
      audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const source = audioContext.createMediaStreamSource(stream);
      analyser = audioContext.createAnalyser();
      analyser.fftSize = 64;
      source.connect(analyser);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const updateMeter = () => {
        if (!analyser) return;
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const avg = sum / dataArray.length;
        const normalized = Math.min(100, Math.round((avg / 128) * 100));
        setAudioLevel(normalized);

        if (inputMode() === 'voice_activity') {
          const speakingNow = normalized > 15 && !isMuted();
          if (self() && self()!.isSpeaking !== speakingNow) {
            sendSocketMessage('UPDATE_SELF', { isSpeaking: speakingNow });
          }
        }

        animFrameId = requestAnimationFrame(updateMeter);
      };

      updateMeter();
    } catch (err) {
      console.error('Audio visualizer init error:', err);
    }
  };

  // Peer Connection Setup
  const createPeerConnection = (targetUserId: string) => {
    if (peers[targetUserId]) return peers[targetUserId].pc;

    const pc = new RTCPeerConnection(rtcConfig);
    const remoteStream = new MediaStream();

    peers[targetUserId] = { pc, stream: remoteStream };

    setRemoteStreams((prev) => ({ ...prev, [targetUserId]: remoteStream }));

    // Send local tracks
    if (localAudioStream) {
      localAudioStream.getTracks().forEach((track) => pc.addTrack(track, localAudioStream!));
    }
    if (localVideoStream) {
      localVideoStream.getTracks().forEach((track) => pc.addTrack(track, localVideoStream!));
    }
    if (localScreenStream) {
      localScreenStream.getTracks().forEach((track) => pc.addTrack(track, localScreenStream!));
    }

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        sendSocketMessage('RTC_ICE_CANDIDATE', {
          targetUserId,
          candidate: event.candidate,
        });
      }
    };

    pc.ontrack = (event) => {
      event.streams[0].getTracks().forEach((track) => {
        remoteStream.addTrack(track);
      });
      setRemoteStreams((prev) => ({ ...prev, [targetUserId]: remoteStream }));

      // Attach audio element
      let audioEl = document.getElementById(`audio-${targetUserId}`) as HTMLAudioElement;
      if (!audioEl) {
        audioEl = document.createElement('audio');
        audioEl.id = `audio-${targetUserId}`;
        audioEl.autoplay = true;
        document.body.appendChild(audioEl);
      }
      audioEl.srcObject = remoteStream;
      const vol = peerVolumes()[targetUserId] ?? 100;
      audioEl.volume = isDeafened() ? 0 : Math.max(0, Math.min(1, vol / 100));
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'connected') {
        setRtcStatus('connected');
      } else if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
        cleanupPeer(targetUserId);
      }
    };

    return pc;
  };

  const cleanupPeer = (userId: string) => {
    if (peers[userId]) {
      peers[userId].pc.close();
      delete peers[userId];
    }
    const audioEl = document.getElementById(`audio-${userId}`);
    if (audioEl) audioEl.remove();

    setRemoteStreams((prev) => {
      const copy = { ...prev };
      delete copy[userId];
      return copy;
    });
  };

  const renegotiateAllPeers = async () => {
    for (const peerId in peers) {
      const pc = peers[peerId].pc;
      try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        sendSocketMessage('RTC_OFFER', {
          targetUserId: peerId,
          offer,
        });
      } catch (err) {
        console.error('Renegotiation failed for peer:', peerId, err);
      }
    }
  };

  // Voice Channel Actions
  const joinVoiceChannel = async (channelId: string) => {
    if (activeVoiceChannel() === channelId) return;

    leaveVoiceChannel();
    setActiveVoiceChannel(channelId);
    setRtcStatus('connecting');
    playSoundEffect('join');

    try {
      localAudioStream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
        video: false,
      });

      if (inputMode() === 'push_to_talk') {
        localAudioStream.getAudioTracks().forEach((t) => (t.enabled = false));
      }

      setupAudioVisualizer(localAudioStream);
      sendSocketMessage('JOIN_VOICE', { channelId });
    } catch (err) {
      console.error('Microphone access denied:', err);
      alert('Não foi possível acessar o microfone.');
      leaveVoiceChannel();
    }
  };

  const leaveVoiceChannel = () => {
    if (!activeVoiceChannel()) return;
    playSoundEffect('leave');

    sendSocketMessage('LEAVE_VOICE', {});
    setActiveVoiceChannel(null);
    setRtcStatus('disconnected');

    if (localAudioStream) {
      localAudioStream.getTracks().forEach((t) => t.stop());
      localAudioStream = null;
    }
    if (localVideoStream) {
      localVideoStream.getTracks().forEach((t) => t.stop());
      localVideoStream = null;
      setIsCameraOn(false);
    }
    if (localScreenStream) {
      localScreenStream.getTracks().forEach((t) => t.stop());
      localScreenStream = null;
      setIsScreenSharing(false);
    }

    if (animFrameId) cancelAnimationFrame(animFrameId);
    if (audioContext) audioContext.close();
    setAudioLevel(0);

    for (const peerId in peers) {
      cleanupPeer(peerId);
    }
  };

  // Camera Toggle
  const toggleCamera = async () => {
    if (isCameraOn()) {
      if (localVideoStream) {
        localVideoStream.getTracks().forEach((t) => t.stop());
        for (const peerId in peers) {
          const senders = peers[peerId].pc.getSenders();
          senders.forEach((sender) => {
            if (
              sender.track &&
              sender.track.kind === 'video' &&
              sender.track === localVideoStream?.getVideoTracks()[0]
            ) {
              peers[peerId].pc.removeTrack(sender);
            }
          });
        }
        localVideoStream = null;
      }
      setIsCameraOn(false);
      sendSocketMessage('UPDATE_SELF', { isCameraOn: false });
      renegotiateAllPeers();
    } else {
      try {
        localVideoStream = await navigator.mediaDevices.getUserMedia({
          video: { width: 1280, height: 720, frameRate: 30 },
          audio: false,
        });
        setIsCameraOn(true);
        sendSocketMessage('UPDATE_SELF', { isCameraOn: true });

        localVideoStream.getVideoTracks().forEach((track) => {
          for (const peerId in peers) {
            peers[peerId].pc.addTrack(track, localVideoStream!);
          }
        });

        if (localVideoRef) {
          localVideoRef.srcObject = localVideoStream;
        }

        renegotiateAllPeers();
      } catch (err) {
        console.error('Camera access failed:', err);
        alert('Não foi possível acessar a câmera. Verifique as permissões.');
      }
    }
  };

  // Screen Share Toggle
  const toggleScreenShare = async () => {
    if (isScreenSharing()) {
      if (localScreenStream) {
        localScreenStream.getTracks().forEach((t) => t.stop());
        for (const peerId in peers) {
          const senders = peers[peerId].pc.getSenders();
          senders.forEach((sender) => {
            if (
              sender.track &&
              sender.track.kind === 'video' &&
              sender.track === localScreenStream?.getVideoTracks()[0]
            ) {
              peers[peerId].pc.removeTrack(sender);
            }
          });
        }
        localScreenStream = null;
      }
      setIsScreenSharing(false);
      sendSocketMessage('UPDATE_SELF', { isScreenSharing: false });
      renegotiateAllPeers();
    } else {
      try {
        localScreenStream = await navigator.mediaDevices.getDisplayMedia({
          video: { frameRate: 60 },
          audio: true,
        });

        setIsScreenSharing(true);
        setViewMode('stage');
        sendSocketMessage('UPDATE_SELF', { isScreenSharing: true });

        localScreenStream.getVideoTracks()[0].onended = () => {
          toggleScreenShare();
        };

        localScreenStream.getTracks().forEach((track) => {
          for (const peerId in peers) {
            peers[peerId].pc.addTrack(track, localScreenStream!);
          }
        });

        if (localScreenRef) {
          localScreenRef.srcObject = localScreenStream;
        }

        renegotiateAllPeers();
      } catch (err) {
        console.error('Screen sharing canceled or failed:', err);
      }
    }
  };

  const toggleMute = () => {
    const newMuted = !isMuted();
    setIsMuted(newMuted);
    playSoundEffect(newMuted ? 'mute' : 'unmute');
    if (localAudioStream) {
      localAudioStream.getAudioTracks().forEach((t) => (t.enabled = !newMuted));
    }
    sendSocketMessage('UPDATE_SELF', { isMuted: newMuted });
  };

  const toggleDeafen = () => {
    const newDeaf = !isDeafened();
    setIsDeafened(newDeaf);
    Object.keys(peers).forEach((peerId) => {
      const audioEl = document.getElementById(`audio-${peerId}`) as HTMLAudioElement;
      if (audioEl) audioEl.volume = newDeaf ? 0 : (peerVolumes()[peerId] ?? 100) / 100;
    });
    sendSocketMessage('UPDATE_SELF', { isDeafened: newDeaf });
  };

  const handlePeerVolumeChange = (peerId: string, vol: number) => {
    setPeerVolumes((prev) => ({ ...prev, [peerId]: vol }));
    const audioEl = document.getElementById(`audio-${peerId}`) as HTMLAudioElement;
    if (audioEl) {
      audioEl.volume = isDeafened() ? 0 : Math.max(0, Math.min(1, vol / 100));
    }
  };

  // Attachments helper
  const addFilesToAttachments = (files: FileList | File[]) => {
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        const result = uploadEvent.target?.result as string;
        setPendingAttachments((prev) => [
          ...prev,
          {
            name: file.name,
            type: file.type,
            size: file.size,
            url: result,
          },
        ]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleFileUpload = (e: Event) => {
    const target = e.target as HTMLInputElement;
    if (!target.files || target.files.length === 0) return;
    addFilesToAttachments(target.files);
    target.value = '';
  };

  const handlePaste = (e: ClipboardEvent) => {
    if (e.clipboardData?.files && e.clipboardData.files.length > 0) {
      e.preventDefault();
      addFilesToAttachments(e.clipboardData.files);
    }
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
      addFilesToAttachments(e.dataTransfer.files);
    }
  };

  // Reactions, Delete, Edit, Pin
  const toggleReaction = (messageId: string, emoji: string) => {
    let targetChannel = activeChannelId();
    if (activeGuildId() === 'dms') {
      const myId = self()?.id;
      const targetId = selectedDmPeerId();
      if (myId && targetId) targetChannel = getDmChannelId(myId, targetId);
    }

    sendSocketMessage('TOGGLE_REACTION', {
      channelId: targetChannel,
      messageId,
      emoji,
    });
  };

  const deleteMessage = (messageId: string) => {
    let targetChannel = activeChannelId();
    if (activeGuildId() === 'dms') {
      const myId = self()?.id;
      const targetId = selectedDmPeerId();
      if (myId && targetId) targetChannel = getDmChannelId(myId, targetId);
    }

    sendSocketMessage('DELETE_MESSAGE', {
      channelId: targetChannel,
      messageId,
    });
  };

  const editMessage = (messageId: string, newText: string) => {
    let targetChannel = activeChannelId();
    if (activeGuildId() === 'dms') {
      const myId = self()?.id;
      const targetId = selectedDmPeerId();
      if (myId && targetId) targetChannel = getDmChannelId(myId, targetId);
    }

    sendSocketMessage('EDIT_MESSAGE', {
      channelId: targetChannel,
      messageId,
      text: newText,
    });
  };

  const togglePinMessage = (messageId: string) => {
    let targetChannel = activeChannelId();
    if (activeGuildId() === 'dms') {
      const myId = self()?.id;
      const targetId = selectedDmPeerId();
      if (myId && targetId) targetChannel = getDmChannelId(myId, targetId);
    }

    sendSocketMessage('TOGGLE_PIN', {
      channelId: targetChannel,
      messageId,
    });
  };

  const playSoundboard = (sound: SoundboardSound) => {
    playSoundEffect(sound);
    if (activeVoiceChannel()) {
      sendSocketMessage('PLAY_SOUNDBOARD', {
        sound,
        voiceChannelId: activeVoiceChannel(),
      });
    }
  };

  const handleTyping = () => {
    let targetChannel = activeChannelId();
    if (activeGuildId() === 'dms') {
      const myId = self()?.id;
      const targetId = selectedDmPeerId();
      if (myId && targetId) targetChannel = getDmChannelId(myId, targetId);
    }

    sendSocketMessage('TYPING', { channelId: targetChannel, isTyping: true });

    if (typingTimeout) clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => {
      sendSocketMessage('TYPING', { channelId: targetChannel, isTyping: false });
    }, 3000);
  };

  // Send Message
  const sendMessage = (customText?: string) => {
    const text = (customText !== undefined ? customText : input()).trim();
    const attachments = pendingAttachments();
    if (!text && attachments.length === 0) return;

    let targetChannel = activeChannelId();
    if (activeGuildId() === 'dms') {
      const myId = self()?.id;
      const targetId = selectedDmPeerId();
      if (myId && targetId) {
        targetChannel = getDmChannelId(myId, targetId);
      }
    }

    sendSocketMessage('SEND_MESSAGE', {
      channelId: targetChannel,
      text,
      attachments: attachments.length > 0 ? attachments : undefined,
      replyTo: replyingTo()
        ? {
            id: replyingTo()!.id,
            username: replyingTo()!.sender.username,
            text: replyingTo()!.text.slice(0, 60),
          }
        : undefined,
    });

    if (customText === undefined) setInput('');
    setPendingAttachments([]);
    setReplyingTo(null);
  };

  const createPoll = (question: string, options: string[]) => {
    let targetChannel = activeChannelId();
    if (activeGuildId() === 'dms') {
      const myId = self()?.id;
      const targetId = selectedDmPeerId();
      if (myId && targetId) targetChannel = getDmChannelId(myId, targetId);
    }

    sendSocketMessage('CREATE_POLL', {
      channelId: targetChannel,
      question,
      options,
    });
  };

  const votePoll = (messageId: string, optionId: string) => {
    let targetChannel = activeChannelId();
    if (activeGuildId() === 'dms') {
      const myId = self()?.id;
      const targetId = selectedDmPeerId();
      if (myId && targetId) targetChannel = getDmChannelId(myId, targetId);
    }

    sendSocketMessage('VOTE_POLL', {
      channelId: targetChannel,
      messageId,
      optionId,
    });
  };

  const sendVoiceNote = (audioUrl: string, duration: number) => {
    let targetChannel = activeChannelId();
    if (activeGuildId() === 'dms') {
      const myId = self()?.id;
      const targetId = selectedDmPeerId();
      if (myId && targetId) targetChannel = getDmChannelId(myId, targetId);
    }

    sendSocketMessage('SEND_MESSAGE', {
      channelId: targetChannel,
      text: '',
      voiceNote: {
        url: audioUrl,
        duration,
      },
    });
  };

  // Guild & Channel actions
  const triggerCreateGuild = () => {
    if (!newGuildName().trim()) return;
    sendSocketMessage('CREATE_GUILD', {
      name: newGuildName(),
      icon: newGuildIcon(),
    });
    setNewGuildName('');
    setShowCreateGuildModal(false);
  };

  const triggerCreateChannel = () => {
    if (!newChannelName().trim() || !activeGuildId()) return;
    sendSocketMessage('CREATE_CHANNEL', {
      guildId: activeGuildId(),
      name: newChannelName(),
      channelType: newChannelType(),
    });
    setNewChannelName('');
    setShowCreateChannelModal(false);
  };

  const deleteChannel = (channelId: string) => {
    if (channelId === 'general' || channelId === 'lobby') return;
    sendSocketMessage('DELETE_CHANNEL', {
      guildId: activeGuildId(),
      channelId,
    });
  };

  const triggerSaveSettings = () => {
    if (!editUsername().trim()) return;
    sendSocketMessage('UPDATE_SELF', {
      username: editUsername(),
      avatar: editAvatar(),
      banner: editBanner(),
      avatarDecoration: editAvatarDecoration(),
      bio: editBio(),
      customStatus: editCustomStatus(),
      status: editUserStatus(),
      theme: currentTheme(),
    });

    localStorage.setItem(
      'nexos_user_profile',
      JSON.stringify({
        id: self()?.id,
        username: editUsername(),
        avatar: editAvatar(),
        banner: editBanner(),
        avatarDecoration: editAvatarDecoration(),
        bio: editBio(),
        customStatus: editCustomStatus(),
        status: editUserStatus(),
        theme: currentTheme(),
      })
    );

    setShowSettingsModal(false);
  };

  // WebSocket Connection
  onMount(() => {
    const wsUrl = `ws://${window.location.hostname}:5177/gateway`;
    socket = new WebSocket(wsUrl);

    socket.onopen = () => {
      socket?.send(
        JSON.stringify({
          type: 'IDENTIFY',
          data: {
            user: props.user,
          },
        })
      );
    };

    socket.onmessage = async (event) => {
      const payload = JSON.parse(event.data);
      const { type, data } = payload;

      switch (type) {
        case 'ERROR': {
          console.error('Gateway error:', data?.message);
          props.onLogout();
          break;
        }
        case 'INIT': {
          setSelf(data.self);
          setEditUsername(data.self.username);
          setEditAvatar(data.self.avatar);
          setEditBanner(data.self.banner || '');
          setEditAvatarDecoration(data.self.avatarDecoration || 'none');
          setEditBio(data.self.bio || '');
          setEditCustomStatus(data.self.customStatus || '');
          setEditUserStatus(data.self.status || 'online');
          if (data.self.theme) setCurrentTheme(data.self.theme);
          setMembers(data.members);
          setGuilds(data.guilds);
          setMessages(data.messages);

          localStorage.setItem(
            'nexos_user_profile',
            JSON.stringify({
              id: data.self.id,
              username: data.self.username,
              avatar: data.self.avatar,
              banner: data.self.banner,
              avatarDecoration: data.self.avatarDecoration,
              bio: data.self.bio,
              customStatus: data.self.customStatus,
              status: data.self.status,
            })
          );

          setTimeout(scrollToBottom, 50);
          break;
        }

        case 'MEMBERS_UPDATE': {
          setMembers(data);
          break;
        }

        case 'GUILDS_UPDATE': {
          setGuilds(data);
          break;
        }

        case 'TEXT_MESSAGE': {
          const msg: Message = data;
          setMessages((prev) => {
            const list = prev[msg.channelId] || [];
            return {
              ...prev,
              [msg.channelId]: [...list, msg],
            };
          });

          // Unread indicator tracking
          const currentChan = activeGuildId() === 'dms'
            ? getDmChannelId(self()?.id || '', selectedDmPeerId() || '')
            : activeChannelId();

          if (msg.channelId !== currentChan) {
            setUnreadMap((prev) => ({
              ...prev,
              [msg.channelId]: (prev[msg.channelId] || 0) + 1,
              ...(msg.sender.id !== self()?.id ? { [msg.sender.id]: (prev[msg.sender.id] || 0) + 1 } : {}),
            }));

            // Track guild unreads
            if (!msg.channelId.startsWith('dm:')) {
              const targetGuild = guilds().find((g) =>
                g.channels.some((c) => c.id === msg.channelId)
              );
              if (targetGuild) {
                setGuildUnreadMap((prev) => ({
                  ...prev,
                  [targetGuild.id]: (prev[targetGuild.id] || 0) + 1,
                }));
              }
            } else {
              setGuildUnreadMap((prev) => ({
                ...prev,
                dms: (prev.dms || 0) + 1,
              }));
            }
          }

          if (msg.sender.id !== self()?.id) {
            playSoundEffect('message');
          }
          setTimeout(scrollToBottom, 50);
          break;
        }

        case 'MESSAGE_EDITED': {
          const { channelId, messageId, text, edited } = data;
          setMessages((prev) => {
            const channelMsgs = prev[channelId] || [];
            const updated = channelMsgs.map((m) =>
              m.id === messageId ? { ...m, text, edited } : m
            );
            return {
              ...prev,
              [channelId]: updated,
            };
          });
          break;
        }

        case 'MESSAGE_PIN_UPDATE': {
          const { channelId, messageId, pinned } = data;
          setMessages((prev) => {
            const channelMsgs = prev[channelId] || [];
            const updated = channelMsgs.map((m) =>
              m.id === messageId ? { ...m, pinned } : m
            );
            return {
              ...prev,
              [channelId]: updated,
            };
          });
          break;
        }

        case 'POLL_UPDATED': {
          const { channelId, messageId, poll } = data;
          setMessages((prev) => {
            const channelMsgs = prev[channelId] || [];
            const updated = channelMsgs.map((m) =>
              m.id === messageId ? { ...m, poll } : m
            );
            return {
              ...prev,
              [channelId]: updated,
            };
          });
          break;
        }

        case 'MESSAGE_REACTION_UPDATE': {
          const { channelId, messageId, reactions } = data;
          setMessages((prev) => {
            const channelMsgs = prev[channelId] || [];
            const updated = channelMsgs.map((m) =>
              m.id === messageId ? { ...m, reactions } : m
            );
            return {
              ...prev,
              [channelId]: updated,
            };
          });
          break;
        }

        case 'MESSAGE_DELETED': {
          const { channelId, messageId } = data;
          setMessages((prev) => {
            const channelMsgs = prev[channelId] || [];
            const filtered = channelMsgs.filter((m) => m.id !== messageId);
            return {
              ...prev,
              [channelId]: filtered,
            };
          });
          break;
        }

        case 'SOUNDBOARD_PLAYED': {
          const { sound } = data;
          playSoundEffect(sound);
          break;
        }

        case 'TYPING_UPDATE': {
          const { channelId, typingUsers: currentTypers } = data;
          let targetChannel = activeChannelId();
          if (activeGuildId() === 'dms') {
            const myId = self()?.id;
            const targetId = selectedDmPeerId();
            if (myId && targetId) targetChannel = getDmChannelId(myId, targetId);
          }

          if (channelId === targetChannel) {
            const names = (currentTypers as string[])
              .filter((id) => id !== self()?.id)
              .map((id) => members().find((m) => m.id === id)?.username || 'Alguém');
            setTypers(names);
          }
          break;
        }

        // WebRTC Signaling
        case 'PEER_JOINED_VOICE': {
          const { userId } = data;
          const pc = createPeerConnection(userId);
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          sendSocketMessage('RTC_OFFER', {
            targetUserId: userId,
            offer,
          });
          break;
        }

        case 'PEER_LEFT_VOICE': {
          const { userId } = data;
          cleanupPeer(userId);
          break;
        }

        case 'RTC_OFFER': {
          const { senderUserId, offer } = data;
          const pc = createPeerConnection(senderUserId);
          await pc.setRemoteDescription(new RTCSessionDescription(offer));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          sendSocketMessage('RTC_ANSWER', {
            targetUserId: senderUserId,
            answer,
          });
          break;
        }

        case 'RTC_ANSWER': {
          const { senderUserId, answer } = data;
          const pc = peers[senderUserId]?.pc;
          if (pc) {
            await pc.setRemoteDescription(new RTCSessionDescription(answer));
          }
          break;
        }

        case 'RTC_ICE_CANDIDATE': {
          const { senderUserId, candidate } = data;
          const pc = peers[senderUserId]?.pc;
          if (pc && candidate) {
            try {
              await pc.addIceCandidate(new RTCIceCandidate(candidate));
            } catch (err) {
              console.error('Error adding ICE candidate:', err);
            }
          }
          break;
        }
      }
    };

    socket.onclose = () => {
      console.log('Nexos gateway disconnected');
    };
  });

  onCleanup(() => {
    leaveVoiceChannel();
    if (socket) socket.close();
  });

  const currentGuild = () => guilds().find((g) => g.id === activeGuildId());

  const currentMessages = () => {
    let list: Message[] = [];
    if (activeGuildId() === 'dms') {
      const myId = self()?.id;
      const targetId = selectedDmPeerId();
      if (!myId || !targetId) return [];
      const dmChannel = getDmChannelId(myId, targetId);
      list = messages()[dmChannel] || [];
    } else {
      list = messages()[activeChannelId()] || [];
    }

    if (searchQuery().trim()) {
      const q = searchQuery().toLowerCase();
      return list.filter(
        (m) =>
          m.text.toLowerCase().includes(q) ||
          m.sender.username.toLowerCase().includes(q)
      );
    }

    return list;
  };

  const currentPinnedMessages = () => {
    let list: Message[] = [];
    if (activeGuildId() === 'dms') {
      const myId = self()?.id;
      const targetId = selectedDmPeerId();
      if (!myId || !targetId) return [];
      const dmChannel = getDmChannelId(myId, targetId);
      list = messages()[dmChannel] || [];
    } else {
      list = messages()[activeChannelId()] || [];
    }
    return list.filter((m) => m.pinned);
  };

  const activeHeaderName = () => {
    if (activeGuildId() === 'dms') {
      const peer = members().find((m) => m.id === selectedDmPeerId());
      return peer ? `@${peer.username}` : 'Mensagem Direta';
    }
    const chan = currentGuild()?.channels.find((c) => c.id === activeChannelId());
    return chan ? `# ${chan.name}` : '# canal';
  };

  const activeVoiceMembers = () => {
    if (!activeVoiceChannel()) return [];
    return members().filter((m) => m.voiceChannelId === activeVoiceChannel());
  };

  const clearChannelUnreads = (channelId: string) => {
    setUnreadMap((prev) => ({ ...prev, [channelId]: 0 }));
    if (currentGuild()) {
      setGuildUnreadMap((prev) => ({
        ...prev,
        [currentGuild()!.id]: 0,
      }));
    }
  };

  return (
    <div
      class={`app-layout glass ${isDragOver() ? 'drag-over' : ''}`}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragOver(true);
      }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={handleDrop}
    >
      {/* 1. Server Sidebar */}
      <ServerSidebar
        guilds={guilds()}
        activeGuildId={activeGuildId()}
        guildUnreadMap={guildUnreadMap()}
        onSelectDms={() => {
          setActiveGuildId('dms');
          setSelectedDmPeerId(null);
          setGuildUnreadMap((prev) => ({ ...prev, dms: 0 }));
        }}
        onSelectGuild={(guildId) => {
          setActiveGuildId(guildId);
          setGuildUnreadMap((prev) => ({ ...prev, [guildId]: 0 }));
          const firstText = guilds().find((g) => g.id === guildId)?.channels.find((c) => c.type === 'text');
          if (firstText) {
            setActiveChannelId(firstText.id);
            clearChannelUnreads(firstText.id);
          }
        }}
        onOpenCreateGuildModal={() => setShowCreateGuildModal(true)}
      />

      {/* 2. Channel Sidebar */}
      <ChannelSidebar
        activeGuildId={activeGuildId()}
        guild={currentGuild()}
        members={members()}
        self={self()}
        selectedDmPeerId={selectedDmPeerId()}
        activeChannelId={activeChannelId()}
        activeVoiceChannel={activeVoiceChannel()}
        collapsedCategories={collapsedCategories()}
        rtcStatus={rtcStatus()}
        audioLevel={audioLevel()}
        isMuted={isMuted()}
        isDeafened={isDeafened()}
        isCameraOn={isCameraOn()}
        isScreenSharing={isScreenSharing()}
        unreadMap={unreadMap()}
        onSelectChannel={(chanId) => {
          setActiveChannelId(chanId);
          clearChannelUnreads(chanId);
        }}
        onJoinVoice={joinVoiceChannel}
        onSelectDmPeer={(peerId) => {
          setSelectedDmPeerId(peerId);
          setUnreadMap((prev) => ({ ...prev, [peerId]: 0 }));
        }}
        onToggleCategory={toggleCategory}
        onOpenCreateChannelModal={() => setShowCreateChannelModal(true)}
        onDeleteChannel={deleteChannel}
        onLeaveVoice={leaveVoiceChannel}
        onToggleCamera={toggleCamera}
        onToggleScreenShare={toggleScreenShare}
        onToggleMute={toggleMute}
        onToggleDeafen={toggleDeafen}
        onOpenSettings={() => setShowSettingsModal(true)}
        onLogout={props.onLogout}
      />

      {/* 3. Main View Area */}
      <div class="main-content-area">
        <MainChatHeader
          title={activeHeaderName()}
          hasVoiceActive={!!activeVoiceChannel()}
          viewMode={viewMode()}
          onViewModeChange={setViewMode}
          searchQuery={searchQuery()}
          onSearchQueryChange={setSearchQuery}
          pinnedCount={currentPinnedMessages().length}
          onOpenPins={() => setShowPinnedModal(true)}
          onOpenMediaGallery={() => setShowMediaModal(true)}
          onOpenSoundboard={() => setShowSoundboardModal(true)}
          showMembersSidebar={showMembersSidebar()}
          onToggleMembersSidebar={() => setShowMembersSidebar(!showMembersSidebar())}
          isChannelMuted={mutedChannels()[activeChannelId()]}
          onToggleChannelMute={() => {
            const chan = activeChannelId();
            setMutedChannels((prev) => ({ ...prev, [chan]: !prev[chan] }));
          }}
        />

        <div class={`workspace-body view-${viewMode()}`}>
          {/* Stage Grid View */}
          <Show when={activeVoiceChannel() && (viewMode() === 'stage' || viewMode() === 'split')}>
            <StageView
              self={self()}
              members={members()}
              activeVoiceMembers={activeVoiceMembers()}
              remoteStreams={remoteStreams()}
              isCameraOn={isCameraOn()}
              isScreenSharing={isScreenSharing()}
              spotlightTile={spotlightTile()}
              onToggleSpotlight={(tileId) =>
                setSpotlightTile(spotlightTile() === tileId ? null : tileId)
              }
              localVideoRef={(el) => (localVideoRef = el)}
              localScreenRef={(el) => (localScreenRef = el)}
            />
          </Show>

          {/* Chat Messages and Input View */}
          <Show when={!activeVoiceChannel() || viewMode() !== 'stage'}>
            <div class="chat-workspace">
              <MessageList
                channelName={activeHeaderName()}
                messages={currentMessages()}
                self={self()}
                members={members()}
                typers={typers()}
                onReply={(msg) => setReplyingTo(msg)}
                onToggleReaction={toggleReaction}
                onTogglePin={togglePinMessage}
                onEditMessage={editMessage}
                onDeleteMessage={deleteMessage}
                onOpenUserPopout={(user) => setPopoutUser(user)}
                onVotePoll={votePoll}
                onOpenLightbox={(url) => setLightboxImage(url)}
                bottomRef={(el) => (bottomRef = el)}
              />

              <ChatInputArea
                channelName={activeHeaderName()}
                input={input()}
                onInputChange={setInput}
                replyingTo={replyingTo()}
                onCancelReply={() => setReplyingTo(null)}
                pendingAttachments={pendingAttachments()}
                onRemoveAttachment={(idx) =>
                  setPendingAttachments((prev) => prev.filter((_, i) => i !== idx))
                }
                onFileUpload={handleFileUpload}
                onPaste={handlePaste}
                onSendMessage={() => sendMessage()}
                onSendVoiceNote={sendVoiceNote}
                onTyping={handleTyping}
                onOpenEmojiPicker={() => setShowEmojiPickerModal(true)}
                onOpenGifPicker={() => setShowGifPickerModal(true)}
                onOpenPollModal={() => setShowPollModal(true)}
                isDisabled={activeGuildId() === 'dms' && !selectedDmPeerId()}
              />
            </div>
          </Show>
        </div>
      </div>

      {/* 4. Members Sidebar */}
      <Show when={showMembersSidebar()}>
        <MembersSidebar
          members={members()}
          onSelectMember={(member) => setPopoutUser(member)}
        />
      </Show>

      {/* Modals */}
      <CreateGuildModal
        show={showCreateGuildModal()}
        onClose={() => setShowCreateGuildModal(false)}
        guildName={newGuildName()}
        onGuildNameChange={setNewGuildName}
        guildIcon={newGuildIcon()}
        onGuildIconChange={setNewGuildIcon}
        onSubmit={triggerCreateGuild}
      />

      <CreateChannelModal
        show={showCreateChannelModal()}
        onClose={() => setShowCreateChannelModal(false)}
        channelName={newChannelName()}
        onChannelNameChange={setNewChannelName}
        channelType={newChannelType()}
        onChannelTypeChange={setNewChannelType}
        onSubmit={triggerCreateChannel}
      />

      <SettingsModal
        show={showSettingsModal()}
        onClose={() => setShowSettingsModal(false)}
        tab={settingsTab()}
        onTabChange={setSettingsTab}
        currentUser={props.user}
        username={editUsername()}
        onUsernameChange={setEditUsername}
        customStatus={editCustomStatus()}
        onCustomStatusChange={setEditCustomStatus}
        bio={editBio()}
        onBioChange={setEditBio}
        userStatus={editUserStatus()}
        onUserStatusChange={setEditUserStatus}
        avatar={editAvatar()}
        onAvatarChange={setEditAvatar}
        avatarDecoration={editAvatarDecoration()}
        onAvatarDecorationChange={setEditAvatarDecoration}
        banner={editBanner()}
        onBannerChange={setEditBanner}
        theme={currentTheme()}
        onThemeChange={setCurrentTheme}
        audioLevel={audioLevel()}
        inputMode={inputMode()}
        onInputModeChange={setInputMode}
        pttKey={pttKey()}
        onPttKeyChange={setPttKey}
        onSave={triggerSaveSettings}
        onLogout={props.onLogout}
      />

      <UserPopoutModal
        user={popoutUser()}
        currentUserId={self()?.id}
        peerVolume={popoutUser() ? peerVolumes()[popoutUser()!.id] ?? 100 : 100}
        onVolumeChange={handlePeerVolumeChange}
        onClose={() => setPopoutUser(null)}
        onSendDM={(targetId) => {
          setActiveGuildId('dms');
          setSelectedDmPeerId(targetId);
        }}
      />

      <PinnedMessagesModal
        show={showPinnedModal()}
        channelName={activeHeaderName()}
        pinnedMessages={currentPinnedMessages()}
        onUnpin={togglePinMessage}
        onClose={() => setShowPinnedModal(false)}
      />

      <SoundboardModal
        show={showSoundboardModal()}
        onClose={() => setShowSoundboardModal(false)}
        onPlaySound={playSoundboard}
      />

      <GifPickerModal
        show={showGifPickerModal()}
        onClose={() => setShowGifPickerModal(false)}
        onSelectGif={(gifUrl) => sendMessage(gifUrl)}
      />

      <EmojiPickerModal
        show={showEmojiPickerModal()}
        onClose={() => setShowEmojiPickerModal(false)}
        onSelectEmoji={(emoji) => setInput((prev) => prev + emoji)}
      />

      <PollModal
        show={showPollModal()}
        onClose={() => setShowPollModal(false)}
        onSubmit={createPoll}
      />

      <LightboxModal
        imageUrl={lightboxImage()}
        onClose={() => setLightboxImage(null)}
      />

      <ChannelMediaModal
        show={showMediaModal()}
        channelName={activeHeaderName()}
        messages={currentMessages()}
        onOpenImage={(url) => {
          setShowMediaModal(false);
          setLightboxImage(url);
        }}
        onClose={() => setShowMediaModal(false)}
      />
    </div>
  );
}
