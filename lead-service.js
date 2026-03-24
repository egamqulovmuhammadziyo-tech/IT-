function getTelegramChatIds(value) {
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function cleanValue(value, fallback = "-") {
  if (typeof value !== "string") {
    return fallback;
  }

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

async function callTelegram({ botToken, method, body, fetchImpl = fetch }) {
  const response = await fetchImpl(`https://api.telegram.org/bot${botToken}/${method}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const rawText = await response.text();
  let data = null;

  if (rawText) {
    try {
      data = JSON.parse(rawText);
    } catch (_error) {
      data = null;
    }
  }

  return { response, data, rawText };
}

async function sendTelegramLead({
  botToken,
  chatIds,
  stickerFileId = "",
  payload,
  fetchImpl = fetch,
}) {
  const results = [];
  const text = buildTelegramMessage(payload);

  for (const chatId of chatIds) {
    if (stickerFileId) {
      await callTelegram({
        botToken,
        method: "sendSticker",
        body: {
          chat_id: chatId,
          sticker: stickerFileId,
        },
        fetchImpl,
      });
    }

    results.push(
      await callTelegram({
        botToken,
        method: "sendMessage",
        body: {
          chat_id: chatId,
          text,
          parse_mode: "HTML",
        },
        fetchImpl,
      }),
    );
  }

  return results;
}

function summarizeTelegramResults(results) {
  const successResults = results.filter(({ response, data }) => response.ok && data?.ok);
  const failedResults = results.filter(({ response, data }) => !response.ok || !data?.ok);
  const failedResult = failedResults[0];

  return {
    successResults,
    failedResults,
    deliveredTo: successResults.length,
    partialFailure: failedResults.length > 0,
    failureDetails:
      failedResult?.data?.description ||
      failedResult?.rawText ||
      `HTTP ${failedResult?.response?.status || 502}`,
  };
}

module.exports = {
  buildTelegramMessage,
  cleanValue,
  getTelegramChatIds,
  normalizeLeadPayload,
  sendTelegramLead,
  summarizeTelegramResults,
};
