const {
  getTelegramChatIds,
  normalizeLeadPayload,
  sendTelegramLead,
  summarizeTelegramResults,
} = require("../../lead-service");

function json(statusCode, body) {
  return {
    statusCode,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Content-Type": "application/json; charset=utf-8",
    },
    body: JSON.stringify(body),
  };
}

exports.handler = async function handler(event) {
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    };
  }

  const botToken = process.env.TELEGRAM_BOT_TOKEN || "";
  const chatIdsValue =
    process.env.TELEGRAM_CHAT_IDS || process.env.TELEGRAM_CHAT_ID || "";
  const stickerFileId = process.env.TELEGRAM_STICKER_FILE_ID || "";
  const recipients = getTelegramChatIds(chatIdsValue);

  if (event.httpMethod === "GET") {
    return json(200, {
      ok: true,
      message: "Lead endpoint ishlayapti.",
      recipients: recipients.length,
    });
  }

  if (event.httpMethod !== "POST") {
    return json(405, {
      ok: false,
      message: "Faqat POST ruxsat etiladi.",
    });
  }

  if (!botToken || !recipients.length) {
    return json(500, {
      ok: false,
      message: "Telegram sozlamalari topilmadi. Netlify Environment Variables ni tekshiring.",
    });
  }

  let body = {};

  try {
    body = event.body ? JSON.parse(event.body) : {};
  } catch (_error) {
    return json(400, {
      ok: false,
      message: "Yuborilgan ma'lumotni o'qib bo'lmadi.",
    });
  }

  const payload = normalizeLeadPayload(body, "contact-page");

  if (!payload.name || !payload.phone) {
    return json(400, {
      ok: false,
      message: "Ism va telefon kiritilishi kerak.",
    });
  }

  try {
    const results = await sendTelegramLead({
      botToken,
      chatIds: recipients,
      stickerFileId,
      payload,
    });
    const { deliveredTo, partialFailure, failureDetails } = summarizeTelegramResults(results);

    if (!deliveredTo) {
      return json(502, {
        ok: false,
        message: "Telegramga yuborishda xato bo'ldi.",
        details: failureDetails,
      });
    }

    return json(200, {
      ok: true,
      message: "So'rovingiz yuborildi. Tez orada siz bilan bog'lanamiz.",
      deliveredTo,
      recipients: recipients.length,
      partialFailure,
    });
  } catch (error) {
    return json(500, {
      ok: false,
      message: "Server xatosi. Keyinroq qayta urinib ko'ring.",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
