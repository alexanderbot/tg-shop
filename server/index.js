const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const { createInvoiceLink, sendMessage, answerPreCheckoutQuery } = require("./utils/bot-methods");
const { validateInitData } = require("./utils/validateInitData");
const { getWelcomeMessage } = require("./const/messages");

dotenv.config();

const { PORT, PAYMENT_TOKEN, CLIENT_APP_URL, BOT_TOKEN } = process.env;
const app = express();

const productsData = require("./data/products.json");

app.use(express.json());
app.use(cors({ origin: CLIENT_APP_URL, optionsSuccessStatus: 200 }));

app.get("/", (req, res) => {
  res.json({ ok: true, message: "TGCart backend. Use Mini App in Telegram." });
});

app.get("/products/categories", (req, res) => {
  try {
    return res.json(productsData.categories);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to fetch categories" });
  }
});

app.get("/products", (req, res) => {
  try {
    const { category, limit = 20 } = req.query;
    let products = [...productsData.products];

    if (category && category !== "all") {
      products = products.filter(
        (p) => p.category.toLowerCase() === category.toLowerCase()
      );
    }

    products = products.slice(0, parseInt(limit, 10));
    return res.json({ products, total: productsData.products.length });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to fetch products" });
  }
});

app.get("/products/:id", (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const product = productsData.products.find((p) => p.id === id);
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }
    return res.json(product);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to fetch product" });
  }
});

app.post("/invoice-link", async (req, res) => {
  try {
    const reqBody = req.body;

    if (!validateInitData(reqBody.initData, BOT_TOKEN)) {
      return res.status(401).json({ success: false, error: "Invalid init data" });
    }

    const body = {
      title: reqBody.title,
      description: reqBody.description,
      payload: reqBody.payload || "data",
      provider_token: PAYMENT_TOKEN,
      currency: "USD",
      prices: [
        {
          label: "Total Amount",
          /** `amount` needs to be multiplied by 100, refer: https://core.telegram.org/bots/api#labeledprice */
          amount: reqBody.amount * 100,
        },
      ],
    };

    const data = await createInvoiceLink({ body });

    console.log({ data });

    return res.json({ success: !!data.result, url: data.result });
  } catch (err) {
    console.error(err);
    return res.json({ success: false });
  }
});

app.post("/", async (req, res) => {
  try {
    console.log("webhook event", req.body);
    const { message, pre_checkout_query } = req.body;

    // Handle pre_checkout_query - must answer within 10 seconds
    if (pre_checkout_query) {
      const { id: pre_checkout_query_id } = pre_checkout_query;
      const response = await answerPreCheckoutQuery({
        pre_checkout_query_id,
        ok: true,
      });
      console.log("answerPreCheckoutQuery", response);
      return res.json({ success: true });
    }

    // Handle message (including successful_payment)
    if (message) {
      const { chat, successful_payment } = message;

      if (successful_payment) {
        const thankYouText =
          `Thank you for your purchase!\n\n` +
          `Order: ${successful_payment.invoice_payload}\n` +
          `Amount: $${(successful_payment.total_amount / 100).toFixed(2)} ${successful_payment.currency}`;
        await sendMessage({
          body: {
            chat_id: chat.id,
            text: thankYouText,
            parse_mode: "Markdown",
          },
        });
        return res.json({ success: true });
      }

      const body = {
        chat_id: chat.id,
        text: getWelcomeMessage({ name: chat.first_name }),
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "BUY NOW",
                web_app: {
                  url: CLIENT_APP_URL,
                },
              },
            ],
          ],
        },
        parse_mode: "Markdown",
      };

      const response = await sendMessage({ body });
      console.log({ response });
    }

    return res.json({ success: true });
  } catch (err) {
    console.error(err);
    return res.json({ success: false });
  }
});

// Only listen when running locally (not on Vercel serverless)
if (!process.env.VERCEL) {
  app.listen(PORT || 5000, () => {
    console.log("listening");
  });
}

module.exports = app;
