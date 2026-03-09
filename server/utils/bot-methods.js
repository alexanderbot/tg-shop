const fetch = require("node-fetch");

const getBotApiUrl = () => `https://api.telegram.org/bot${process.env.BOT_TOKEN}`;

const postFetch = async ({ url, body }) => {
  const response = await fetch(url, {
    method: "POST",
    body: JSON.stringify(body),
    headers: {
      "Content-Type": "application/json",
    },
  });
  const data = await response.json();
  return data;
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
