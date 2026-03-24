require("dotenv").config();

const path = require("path");
const express = require("express");
const {
  getTelegramChatIds,
  normalizeLeadPayload,
  sendTelegramLead,
  summarizeTelegramResults,
} = require("./lead-service");

let localSecrets = {};

try {
  localSecrets = require("./local-secrets");
} catch (_error) {
  localSecrets = {};
}

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const TELEGRAM_BOT_TOKEN =
  process.env.TELEGRAM_BOT_TOKEN || localSecrets.TELEGRAM_BOT_TOKEN || "";
const TELEGRAM_CHAT_IDS_VALUE =
  process.env.TELEGRAM_CHAT_IDS ||
  localSecrets.TELEGRAM_CHAT_IDS ||
  process.env.TELEGRAM_CHAT_ID ||
  localSecrets.TELEGRAM_CHAT_ID ||
  "";
const TELEGRAM_STICKER_FILE_ID =
  process.env.TELEGRAM_STICKER_FILE_ID ||
  localSecrets.TELEGRAM_STICKER_FILE_ID ||
  "";

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }

  next();
});

app.use(express.json({ limit: "200kb" }));
app.use(express.urlencoded({ extended: true, limit: "200kb" }));
app.use(express.static(__dirname));

app.get("/healthz", (_req, res) => {
  const recipients = getTelegramChatIds(TELEGRAM_CHAT_IDS_VALUE);

  res.status(200).json({
    ok: true,
    service: "beshariq-it-center",
    telegramConfigured: Boolean(TELEGRAM_BOT_TOKEN && recipients.length),
    recipients: recipients.length,
  });
});

app.get("/api/leads", (_req, res) => {
  const recipients = getTelegramChatIds(TELEGRAM_CHAT_IDS_VALUE);

  res.status(200).json({
    ok: true,
    message: "Lead endpoint ishlayapti. Yuborish uchun POST ishlatiladi.",
    recipients: recipients.length,
  });
});

app.post("/api/leads", async (req, res) => {
  const payload = normalizeLeadPayload(req.body, "contact-page");

  if (!payload.name || !payload.phone) {
    return res.status(400).json({
      ok: false,
      message: "Ism va telefon kiritilishi kerak.",
    });
  }

  const recipients = getTelegramChatIds(TELEGRAM_CHAT_IDS_VALUE);

  if (!TELEGRAM_BOT_TOKEN || !recipients.length) {
    return res.status(500).json({
      ok: false,
      message: "Telegram sozlamalari topilmadi. .env yoki local-secrets.js faylini tekshiring.",
    });
  }

  try {
    const results = await sendTelegramLead({
      botToken: TELEGRAM_BOT_TOKEN,
      chatIds: recipients,
      stickerFileId: TELEGRAM_STICKER_FILE_ID,
      payload,
    });
    const { deliveredTo, partialFailure, failureDetails } = summarizeTelegramResults(results);

    if (!deliveredTo) {
      return res.status(502).json({
        ok: false,
        message: "Telegramga yuborishda xato bo'ldi.",
        details: failureDetails,
      });
    }

    return res.status(200).json({
      ok: true,
      message: "So'rovingiz yuborildi. Tez orada siz bilan bog'lanamiz.",
      deliveredTo,
      recipients: recipients.length,
      partialFailure,
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      message: "Server xatosi. Keyinroq qayta urinib ko'ring.",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

app.get("/", (_req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});
