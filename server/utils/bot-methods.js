const fetch = require("node-fetch");

const getBotApiUrl = () => `https://api.telegram.org/bot${process.env.BOT_TOKEN}`;
const TELEGRAM_TIMEOUT_MS = 8000;
const sanitizeUrl = (url) => url.replace(/bot[^/]+/, "bot[redacted]");
const sanitizeBody = (body) => ({
  ...body,
  provider_token: body?.provider_token ? "[redacted]" : body?.provider_token,
});

const postFetch = async ({ url, body }) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TELEGRAM_TIMEOUT_MS);

  try {
    console.log("[TG API] request:", sanitizeUrl(url), JSON.stringify(sanitizeBody(body)));

    const response = await fetch(url, {
      method: "POST",
      body: JSON.stringify(body),
      headers: {
        "Content-Type": "application/json",
      },
      signal: controller.signal,
    });

    const rawText = await response.text();
    console.log("[TG API] response:", sanitizeUrl(url), response.status, rawText);

    let data;
    try {
      data = JSON.parse(rawText);
    } catch {
      throw new Error(`Telegram returned non-JSON response with status ${response.status}`);
    }

    if (!response.ok || !data.ok) {
      throw new Error(data.description || `Telegram API error with status ${response.status}`);
    }

    return data;
  } catch (error) {
    const reason = error?.name === "AbortError"
      ? `Telegram API timeout after ${TELEGRAM_TIMEOUT_MS}ms`
      : error?.message || "Unknown Telegram API error";
    throw new Error(reason);
  } finally {
    clearTimeout(timeoutId);
  }
};

const createInvoiceLink = async ({ body }) => {
  const data = await postFetch({
    url: `${getBotApiUrl()}/createInvoiceLink`,
    body,
  });
  return data;
};

const sendMessage = async ({ body }) => {
  const data = await postFetch({
    url: `${getBotApiUrl()}/sendMessage`,
    body,
  });
  return data;
};

const answerPreCheckoutQuery = async ({ pre_checkout_query_id, ok, error_message }) => {
  const body = { pre_checkout_query_id, ok };
  if (!ok && error_message) body.error_message = error_message;
  const data = await postFetch({
    url: `${getBotApiUrl()}/answerPreCheckoutQuery`,
    body,
  });
  return data;
};

module.exports = {
  createInvoiceLink,
  sendMessage,
  answerPreCheckoutQuery,
};
