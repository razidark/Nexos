# Nexos

> A voice and text chat platform — server, web client and desktop app.
> Discord-shaped: guilds, channels, threads, members, and a stage view.

---

## Features

- **Guilds and channels** — create guilds and text channels, switch between them
- **Messaging** — text chat with markdown rendering, emoji picker, GIF picker
- **Attachments** — image and media in a lightbox
- **Pinned messages** and **polls**
- **Members sidebar** and a **user popout** card
- **Stage view** — a focused presentation surface for a voice channel
- **Soundboard**
- **Authentication** — register and sign in, with rate-limited endpoints

## Tech stack

| | |
|---|---|
| Client | React + TypeScript + Vite |
| Desktop | Electron |
| Server | Fastify + WebSocket, Zod validation |
| Auth | scrypt password hashing, signed sessions |
| Storage | local JSON store (`server/nexos_store.json`) with atomic writes |

## Repository layout

This is a pnpm workspace:

```
app/       React + Electron client
server/    Fastify API
```

## Requirements

- Node.js 20+
- pnpm

## Getting started

```bash
pnpm install
pnpm dev          # runs both packages in parallel
```

Or run them separately:

```bash
pnpm --filter @rzl-nexos/server dev   # API
pnpm --filter @rzl-nexos/app dev       # client -> http://127.0.0.1:5176
```

### Desktop

```bash
pnpm dev:desktop   # server + Electron client together
```

### Scripts

| Script | Does |
|---|---|
| `pnpm dev` | run both packages |
| `pnpm dev:web` | same, web only |
| `pnpm dev:desktop` | server + Electron |
| `pnpm build` | build both packages |
| `pnpm --filter @rzl-nexos/server test` | server tests |

## The data store

Accounts live in `server/nexos_store.json`. It is **git-ignored** — it holds
user records and password hashes and must never be committed. A fresh server
recreates it on first run.

Passwords are hashed with scrypt. The store is written atomically (temp file
plus rename) so a crash mid-write cannot corrupt it.

## Security notes

- **Markdown is escaped before rendering.** Quotes are converted to entities and
  URLs are reduced to a safe character set, so a crafted link cannot break out
  of an `href` and inject an event handler.
- Auth endpoints are rate limited (sliding window) to slow credential stuffing.

## Credits

Built by **RZL Apps**.
