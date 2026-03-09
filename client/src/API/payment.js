const BACKEND_URL = import.meta.env.VITE_APP_BACKEND_URL;

export const getInvoiceLink = async ({ body }) => {
  const initData = window.Telegram?.WebApp?.initData || "";
  const payload = { ...body, initData };
  const response = await fetch(`${BACKEND_URL}/invoice-link`, {
    method: "POST",
    body: JSON.stringify(payload),
    headers: {
      "Content-Type": "application/json",
    },
  });
  const data = await response.json();
  return data;
};

export const getPaymentStatus = async (payload) => {
  const response = await fetch(`${BACKEND_URL}/payment-status/${payload}`);
  const data = await response.json();
  return data.status;
};
