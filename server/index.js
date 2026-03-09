const express = require("express");
const dotenv = require("dotenv");
dotenv.config();
const cors = require("cors");
const { createInvoiceLink, sendMessage, answerPreCheckoutQuery } = require("./utils/bot-methods");
const { validateInitData } = require("./utils/validateInitData");
const { getWelcomeMessage } = require("./const/messages");

const { PORT, PAYMENT_TOKEN, CLIENT_APP_URL, BOT_TOKEN } = process.env;
const app = express();

const productsData = require("./data/products.json");

// Normalize URL for comparison (no trailing slash)
const allowedOrigin = CLIENT_APP_URL ? CLIENT_APP_URL.replace(/\/$/, "") : null;

app.use(express.json());
app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true);
      const normalized = origin.replace(/\/$/, "");
      if (allowedOrigin && (normalized === allowedOrigin || origin === allowedOrigin)) {
        return cb(null, true);
      }
      if (allowedOrigin) return cb(null, false);
      cb(null, true); // allow any when CLIENT_APP_URL not set (e.g. local dev)
    },
    optionsSuccessStatus: 200,
  })
);

app.get("/", (req, res) => {
  res.json({ ok: true, message: "TGCart backend. Use Mini App in Telegram.", version: "2.1" });
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
    const { category, limit = 200, minPrice, maxPrice } = req.query;
    let products = [...productsData.products];

    if (category && category !== "all") {
      products = products.filter(
        (p) => p.category.toLowerCase() === category.toLowerCase()
      );
    }

    if (minPrice) {
      const min = parseFloat(minPrice);
      products = products.filter((p) => {
        const finalPrice = p.price - (p.price / 100) * p.discountPercentage;
        return finalPrice >= min;
      });
    }

    if (maxPrice) {
      const max = parseFloat(maxPrice);
      products = products.filter((p) => {
        const finalPrice = p.price - (p.price / 100) * p.discountPercentage;
        return finalPrice <= max;
      });
    }

    products = products.slice(0, parseInt(limit, 10));
    return res.json({ products, total: products.length });
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

    let prices;
    if (Array.isArray(reqBody.items) && reqBody.items.length > 0) {
      prices = reqBody.items.map((item) => ({
        label: `${item.title} x${item.quantity}`,
        amount: Math.round(item.price * item.quantity * 100),
      }));
    } else {
      prices = [
        {
          label: reqBody.title || "Итого",
          amount: Math.round(reqBody.amount * 100),
        },
      ];
    }

    let description = reqBody.description || "Оплата заказа";
    if (description.length > 255) {
      description = description.slice(0, 252) + "...";
    }

    let payload = reqBody.payload || "data";
    if (payload.length > 128) {
      payload = payload.slice(0, 128);
    }

    const body = {
      title: reqBody.title || "Заказ",
      description,
      payload,
      provider_token: PAYMENT_TOKEN,
      currency: "RUB",
      prices,
    };

    const data = await createInvoiceLink({ body });

    if (!data.result) {
      console.error("createInvoiceLink failed:", JSON.stringify(data));
      return res.json({ success: false, error: data.description || "Invoice creation failed" });
    }

    return res.json({ success: true, url: data.result });
  } catch (err) {
    console.error("invoice-link error:", err);
    return res.json({ success: false, error: "Internal server error" });
  }
});

app.post("/", async (req, res) => {
  try {
    const { message, pre_checkout_query } = req.body;

    if (pre_checkout_query) {
      const { id: queryId } = pre_checkout_query;
      const startedAt = Date.now();

      try {
        const tgData = await answerPreCheckoutQuery({
          pre_checkout_query_id: queryId,
          ok: true,
        });
        console.log(
          "[PCQ] completed:",
          JSON.stringify({
            queryId,
            ok: true,
            elapsedMs: Date.now() - startedAt,
            telegram: tgData,
          })
        );
      } catch (pcqErr) {
        console.error(
          "[PCQ] failed:",
          JSON.stringify({
            queryId,
            ok: false,
            elapsedMs: Date.now() - startedAt,
            error: pcqErr.message,
          })
        );
      }

      return res.json({ success: true });
    }

    // Handle message (including successful_payment)
    if (message) {
      const { chat, successful_payment } = message;

      if (successful_payment) {
        const thankYouText =
          `Спасибо за покупку! 🎉\n\n` +
          `Заказ: ${successful_payment.invoice_payload}\n` +
          `Сумма: ${(successful_payment.total_amount / 100).toFixed(0)} ₽`;
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
                text: "🛒 Открыть магазин",
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
