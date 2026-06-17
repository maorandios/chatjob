# Telegram integration — Kling Mini App

## 1. Supabase migration

Run in Supabase SQL Editor:

```sql
-- supabase/migrate-telegram.sql
```

## 2. Vercel environment variables

Set on the **klingtele** deployment (or production when merging):

| Variable | Value |
|----------|--------|
| `TELEGRAM_BOT_TOKEN` | From [@BotFather](https://t.me/BotFather) |
| `NEXT_PUBLIC_APP_URL` | `https://chatjob.vercel.app` |
| `TELEGRAM_SETUP_SECRET` | Random string (for one-time webhook setup) |
| `NEXT_PUBLIC_TELEGRAM_BOT_USERNAME` | Bot username without `@` (e.g. `MyKlingBot`) |

## 3. Register webhook + menu button

After deploy, run once:

```bash
curl -X POST https://chatjob.vercel.app/api/telegram/setup-webhook \
  -H "Content-Type: application/json" \
  -d '{"secret":"YOUR_TELEGRAM_SETUP_SECRET"}'
```

This sets the bot webhook and **Open Kling** menu button → `/telegram`.

## 4. BotFather Mini App URL

In [@BotFather](https://t.me/BotFather):

- `/setmenubutton` → Web App URL: `https://chatjob.vercel.app/telegram`

## 5. Test links

**Worker** (replace `INVITE_TOKEN`):

```
https://t.me/YOUR_BOT_USERNAME?start=worker_INVITE_TOKEN
```

**Manager** (replace `MANAGER_INVITE_TOKEN` from managers table):

```
https://t.me/YOUR_BOT_USERNAME?start=mgr_MANAGER_INVITE_TOKEN
```

Flow:

1. Open link in Telegram → tap **פתיחת Kling**
2. Mini App links your Telegram account
3. Worker: pick language → chat. Manager: worker list → chat.

## 6. Notes

- Workers via Telegram skip email OTP; identity is `telegram_user_id`.
- Managers linked via `mgr_` deep link can use the app without email OTP on Telegram.
- Rotate `TELEGRAM_BOT_TOKEN` in BotFather if it was ever exposed.
