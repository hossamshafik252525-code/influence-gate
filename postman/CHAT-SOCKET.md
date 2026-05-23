# Chat Integration — Advertiser Side

The chat between advertiser and admin is **socket-only for sending messages**. The REST API is only used to:
1. **Log in** (to get the JWT).
2. **Load history** (older messages already in the database — sockets don't replay past events).

---

## 1. Log in (REST)

`POST /api/advertiser/auth/login` → save the returned `accessToken`. The **same token** is used by the socket.

---

## 2. Load the chat + history (REST)

When the user opens the chat screen, fetch the chat together with its paginated messages:

```
GET /api/advertiser/chat?page=1&limit=20
Authorization: Bearer <accessToken>
```

Response shape:
```ts
{
  chat: { id, advertiserId, lastMessageAt, createdAt, updatedAt },
  messages: {
    data: ChatMessage[],          // newest first
    pagination: { total, page, limit }
  }
}
```

Render the messages, **then** open the socket below.

---

## 3. Connect to the socket

- **Library**: [`socket.io-client`](https://socket.io/docs/v4/client-installation/) — install with `npm i socket.io-client`.
- **URL**: `http://localhost:3005/chat` for dev, `https://your-prod-domain/chat` in prod.
  - `/chat` is the Socket.IO **namespace** — it is part of the URL, not the path.
- **Auth**: pass the JWT in the `auth` field on connect.

### Minimal example

```js
import { io } from 'socket.io-client';

const socket = io('http://localhost:3005/chat', {
  auth: { token: accessToken },   // the JWT from /advertiser/auth/login
  transports: ['websocket'],
});

socket.on('connect', () => {
  console.log('Connected to chat:', socket.id);
});

socket.on('auth:error', ({ message }) => {
  console.warn('Auth failed:', message);   // token missing/invalid/expired
});

socket.on('disconnect', (reason) => {
  console.log('Disconnected:', reason);
});
```

On a successful connect:
- The server verifies the JWT, finds the advertiser, and **auto-joins them to their own chat room**.
- The chat row is auto-created if it doesn't exist yet — no extra request needed.

If the token is missing/invalid/expired, the server emits `auth:error` and disconnects.

---

## 4. Listen for incoming messages

The server emits **`message:new`** every time a message is saved in the advertiser's chat — whether it was sent by the advertiser themselves (echo of their own send) or by an admin replying.

```js
socket.on('message:new', (msg) => {
  // append msg to the chat UI
});
```

**Payload shape:**
```ts
{
  id: string;              // message UUID
  chatId: string;          // chat UUID
  senderId: string;        // user UUID
  senderRole: 'advertiser' | 'admin';
  content: string;
  attachmentUrl: string | null;
  createdAt: string;       // ISO timestamp
}
```

If `senderRole === 'advertiser'` → it's the user's own message confirmed by the server (use to mark optimistic message as delivered).
If `senderRole === 'admin'` → it's a reply from support.

---

## 5. Send a message

Emit **`message:send`**. The server saves it, then broadcasts a `message:new` back (to the advertiser AND to all connected admins).

```js
socket.emit(
  'message:send',
  {
    content: 'مرحبا، أحتاج مساعدة',
    // optional:
    // attachmentUrl: 'https://res.cloudinary.com/...',
    // attachmentPublicId: 'example/image',
  },
  (ack) => {
    // ack = { ok: true } on success
    // ack = { ok: false, error: '...' } on failure (e.g. empty content)
    if (!ack.ok) console.warn('Send failed:', ack.error);
  },
);
```

**Field rules:**
- `content` — required, 1–2000 chars.
- `attachmentUrl` — optional, must be a valid URL (upload via the existing Upload endpoint first, then pass the returned URL here).
- `attachmentPublicId` — optional, the Cloudinary public ID.

The advertiser does **not** need to send their own `chatId` — the server uses their own chat automatically.

---

## 6. Disconnect

When the user leaves the chat screen:

```js
socket.disconnect();
```

---

## Full event reference

### Server → Client

| Event | Payload | When |
|---|---|---|
| `message:new` | `{ id, chatId, senderId, senderRole, content, attachmentUrl, createdAt }` | Every time a message is persisted in this chat |
| `auth:error` | `{ message: string }` | Handshake failed — disconnect follows |

### Client → Server

| Event | Payload | Ack |
|---|---|---|
| `message:send` | `{ content, attachmentUrl?, attachmentPublicId? }` | `{ ok: true }` or `{ ok: false, error: string }` |

---

## End-to-end flow on the front-end

```
1. POST /api/advertiser/auth/login          → save accessToken
2. GET  /api/advertiser/chat?page=1&limit=20 → render chat + history
3. io('http://localhost:3005/chat',
       { auth: { token: accessToken } })    → connect
4. socket.on('message:new', append)         → listen for new messages
5. socket.emit('message:send', { content }) → send
6. socket.disconnect()                      → on screen unmount
```

---

## Quick smoke test (paste in browser console)

```js
const socket = io('http://localhost:3005/chat', {
  auth: { token: 'PASTE_ACCESS_TOKEN_HERE' },
  transports: ['websocket'],
});
socket.on('connect',     () => console.log('connected', socket.id));
socket.on('message:new', (m) => console.log('new message:', m));
socket.on('auth:error',  (e) => console.warn('auth error:', e));
socket.emit('message:send', { content: 'test from console' }, console.log);
```
