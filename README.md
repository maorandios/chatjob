# JobChat — UX Prototype

Mobile-first UI prototype for validating the manager–worker communication workflow. No backend, authentication, or real translation.

## Quick start

```bash
npm install
cp .env.example .env.local
# Add your OPENAI_API_KEY to .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — redirects to `/demo`.

**Requires `OPENAI_API_KEY`** in `.env.local` for message translation and voice transcription.

## Stakeholder test script

### Single-device end-to-end test

1. Open `/demo` and tap **כניסה כמנהל**
2. Tap **+** and add a worker (name + phone)
3. Copy the invite link from the success sheet
4. Open the invite link in a new tab (or use **פתיחת הזמנת עובד** for the seeded demo worker)
5. Pick a language (e.g. Thai) and enter chat
6. Send typed or **voice** messages (hold mic, release to send)
7. Verify translated text appears for the other party
8. Try worker quick-reply chips on an empty thread
9. Tap manager avatar in worker chat → change language

### Pre-seeded demo

- Demo worker: **סומצ'אי** (Thai, active)
- Invite token: `demo1234` → `/invite/demo1234`
- Includes sample conversation in Hebrew ↔ Thai

### Reset

Use **איפוס נתוני דמו** on `/demo` to restore seed data.

## Routes

| Route | Purpose |
|-------|---------|
| `/demo` | Prototype entry — manager / worker / reset |
| `/manager` | Manager chat list (Hebrew, RTL) |
| `/manager/chat/[workerId]` | Manager thread |
| `/invite/[token]` | Worker welcome + language selection |
| `/invite/[token]/chat` | Worker thread |

## What's real vs mocked

| Feature | Status |
|---------|--------|
| Typed messages | OpenAI translation via `/api/messages/text` |
| Voice messages | Whisper transcription + OpenAI translation via `/api/messages/voice` |
| Hold mic to record | Browser `MediaRecorder` (release to send) |
| Chat persistence | Zustand + localStorage (prototype) |
| Auth, push, real-time | Not implemented |

## Tech stack

- Next.js 16 (App Router)
- TypeScript
- Tailwind CSS v4
- Zustand (persist)
- Lucide icons
