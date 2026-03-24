# ITcenterSite

Marketing site va Telegram lead backend.

## Local ishga tushirish

Server `.env` fayldan avtomatik o'qiydi.

PowerShell:

```powershell
npm start
```

Agar vaqtincha boshqa qiymat bermoqchi bo'lsangiz:

```powershell
$env:TELEGRAM_BOT_TOKEN="BOT_TOKEN"
$env:TELEGRAM_CHAT_ID="7421218854"
npm start
```

Keyin sayt:

```text
http://localhost:3000
```

Health check:

```text
http://localhost:3000/healthz
```

## Always-on deploy

Loyiha `Node` service yoki `Docker` orqali 24/7 hostingga tayyor.

Kerak bo'ladigan environment variables:

- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_CHAT_ID`
- `TELEGRAM_CHAT_IDS` (`123,456` formatida bir nechta chat uchun)
- `TELEGRAM_STICKER_FILE_ID` (ixtiyoriy)

Docker image build bo'lishi uchun repository ichida:

- `Dockerfile`
- `.dockerignore`

bor.
