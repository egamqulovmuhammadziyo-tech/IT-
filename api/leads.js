// Standalone Vercel serverless function - tashqi require yo'q

function getTelegramChatIds(value) {
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function cleanValue(value, fallback = "-") {
  if (typeof value !== "string") return fallback;
  const normalized = value.replace(/\s+/g, " ").trim();
  return normalized || fallback;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function normalizeLeadPayload(body = {}, defaultSource = "contact-page") {
  return {
    name: cleanValue(body?.name, ""),
    phone: cleanValue(body?.phone, ""),
    address: cleanValue(body?.address, "Kiritilmagan"),
    course: cleanValue(body?.course, "Tanlanmagan"),
    message: cleanValue(body?.message, "Yo'q"),
    source: cleanValue(body?.source, defaultSource),
  };
}

function buildTelegramMessage(payload) {
  return [
    "<b>Yangi lead | IT Center Bot</b>",
    "",
    "\u{1F514} <b>Yangi murojaat keldi</b>",
    "",
    `\u{1F464} <b>Ism:</b> ${escapeHtml(cleanValue(payload.name))}`,
    `\u{1F4DE} <b>Telefon:</b> ${escapeHtml(cleanValue(payload.phone))}`,
    `\u{1F4CD} <b>Manzil:</b> ${escapeHtml(cleanValue(payload.address, "Kiritilmagan"))}`,
    `\u{1F4DA} <b>Kurs:</b> ${escapeHtml(cleanValue(payload.course, "Tanlanmagan"))}`,
    `\u{1F310} <b>Manba:</b> ${escapeHtml(cleanValue(payload.source, "Website"))}`,
    `\u{1F4AC} <b>Izoh:</b> ${escapeHtml(cleanValue(payload.message, "Yo'q"))}`,
  ].join("\n");
}

async function sendToTelegram(botToken, chatId, text) {
  const response = await fetch(
    `https://api.telegram.org/bot${botToken}/sendMessage`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "HTML",
      }),
    }
  );
  const rawText = await response.text();
  let data = null;
  try { data = JSON.parse(rawText); } catch (_) {}
  return { ok: response.ok && data?.ok, data };
}

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method === "GET") {
    const recipients = getTelegramChatIds(
      process.env.TELEGRAM_CHAT_IDS || process.env.TELEGRAM_CHAT_ID || ""
    );
    return res.status(200).json({
      ok: true,
      message: "Lead endpoint ishlayapti.",
      recipients: recipients.length,
    });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, message: "Faqat POST ruxsat etiladi." });
  }

  const botToken = process.env.TELEGRAM_BOT_TOKEN || "";
  const chatIdsValue =
    process.env.TELEGRAM_CHAT_IDS || process.env.TELEGRAM_CHAT_ID || "";

  if (!botToken || !chatIdsValue) {
    return res.status(500).json({
      ok: false,
      message: "Telegram sozlamalari topilmadi. Vercel Environment Variables ni tekshiring.",
    });
  }

  const payload = normalizeLeadPayload(req.body, "contact-page");

  if (!payload.name || !payload.phone) {
    return res.status(400).json({
      ok: false,
      message: "Ism va telefon kiritilishi shart.",
    });
  }

  const chatIds = getTelegramChatIds(chatIdsValue);
  const text = buildTelegramMessage(payload);

  try {
    let deliveredTo = 0;
    let lastError = "";

    for (const chatId of chatIds) {
      const result = await sendToTelegram(botToken, chatId, text);
      if (result.ok) {
        deliveredTo++;
      } else {
        lastError = result.data?.description || "Telegram xatosi";
      }
    }

    if (!deliveredTo) {
      return res.status(502).json({
        ok: false,
        message: "Telegramga yuborishda xato bo'ldi.",
        details: lastError,
      });
    }

    return res.status(200).json({
      ok: true,
      message: "So'rovingiz yuborildi. Tez orada siz bilan bog'lanamiz.",
      deliveredTo,
      recipients: chatIds.length,
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      message: "Server xatosi. Keyinroq qayta urinib ko'ring.",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
