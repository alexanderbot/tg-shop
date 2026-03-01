const crypto = require("crypto");

/**
 * Validates Telegram Mini App initData per official docs:
 * https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
 *
 * @param {string} initData - Raw initData string from Telegram.WebApp.initData
 * @param {string} botToken - Bot token for HMAC verification
 * @param {number} maxAgeSeconds - Max age of auth_date in seconds (default: 86400 = 24h)
 * @returns {boolean} - true if valid
 */
function validateInitData(initData, botToken, maxAgeSeconds = 86400) {
  if (!initData || typeof initData !== "string" || initData.length === 0) {
    return false;
  }

  try {
    const params = new URLSearchParams(initData);
    const hash = params.get("hash");
    const authDate = params.get("auth_date");

    if (!hash || !authDate) return false;

    const now = Math.floor(Date.now() / 1000);
    const authTimestamp = parseInt(authDate, 10);
    if (isNaN(authTimestamp) || now - authTimestamp > maxAgeSeconds) {
      return false;
    }

    params.delete("hash");
    const dataCheckArr = Array.from(params.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}=${v}`);
    const dataCheckString = dataCheckArr.join("\n");

    const secretKey = crypto
      .createHmac("sha256", "WebAppData")
      .update(botToken)
      .digest();

    const computedHash = crypto
      .createHmac("sha256", secretKey)
      .update(dataCheckString)
      .digest("hex");

    const hashBuf = Buffer.from(hash, "hex");
    const computedBuf = Buffer.from(computedHash, "hex");
    if (hashBuf.length !== computedBuf.length) return false;
    return crypto.timingSafeEqual(hashBuf, computedBuf);
  } catch {
    return false;
  }
}

module.exports = { validateInitData };
