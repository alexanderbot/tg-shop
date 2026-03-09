export default function formatPrice(value, { currency = true } = {}) {
  const amount = Number(value || 0);

  const formatted = amount.toLocaleString("ru-RU", {
    minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
    maximumFractionDigits: 2,
  });

  return currency ? `${formatted} ₽` : formatted;
}
