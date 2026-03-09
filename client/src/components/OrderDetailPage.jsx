import { useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useOrders } from "../context/OrdersContext";
import { useCart } from "../context/CartContext";
import formatPrice from "../utils/formatPrice";

const STATUS_CONFIG = {
  paid: {
    label: "Оплачен",
    icon: "check_circle",
    color: "#22c55e",
    bg: "rgba(34,197,94,0.10)",
  },
  pending: {
    label: "Ожидает оплаты",
    icon: "schedule",
    color: "#f59e0b",
    bg: "rgba(245,158,11,0.10)",
  },
  failed: {
    label: "Не оплачен",
    icon: "cancel",
    color: "#ef4444",
    bg: "rgba(239,68,68,0.10)",
  },
  cancelled: {
    label: "Отменён",
    icon: "block",
    color: "#6b7280",
    bg: "rgba(107,114,128,0.10)",
  },
};

function formatDate(isoString) {
  const d = new Date(isoString);
  return d.toLocaleString("ru-RU", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDeliveryDate(dateStr) {
  if (!dateStr) return null;
  const [y, m, d] = dateStr.split("-");
  return `${d}.${m}.${y}`;
}

export default function OrderDetailPage() {
  const { orderId } = useParams();
  const { orders, cancelOrder, deleteOrder } = useOrders();
  const { clearCart, addToCart } = useCart();
  const navigate = useNavigate();

  const order = orders.find((o) => String(o.id) === orderId);

  useEffect(() => {
    const handleBack = () => {
      navigate("/orders");
    };
    window.Telegram?.WebApp?.BackButton?.onClick(handleBack);
    window.Telegram?.WebApp?.BackButton?.show();
    return () => {
      window.Telegram?.WebApp?.BackButton?.offClick(handleBack);
    };
  }, [navigate]);

  const confirmAction = useCallback((message, onConfirm) => {
    const tg = window.Telegram?.WebApp;
    if (tg?.showConfirm) {
      tg.showConfirm(message, (ok) => {
        if (ok) onConfirm();
      });
    } else if (window.confirm(message)) {
      onConfirm();
    }
  }, []);

  const handleRepeat = useCallback(() => {
    if (!order) return;
    confirmAction("Повторить этот заказ? Товары будут добавлены в корзину.", () => {
      clearCart();
      order.items.forEach((item) => {
        const product = {
          id: item.productId,
          title: item.title,
          thumbnail: item.thumbnail,
          price: item.price,
          discountPercentage: 0,
        };
        addToCart(product, item.quantity);
      });
      window.Telegram?.WebApp?.HapticFeedback?.impactOccurred("medium");
      navigate("/cart");
    });
  }, [order, confirmAction, clearCart, addToCart, navigate]);

  const handleCancel = useCallback(() => {
    if (!order || order.status !== "pending") return;
    confirmAction("Отменить этот заказ? Его статус изменится на \"Отменён\".", () => {
      cancelOrder(order.id);
      window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred("warning");
    });
  }, [order, confirmAction, cancelOrder]);

  const handleDelete = useCallback(() => {
    if (!order) return;
    confirmAction("Удалить этот заказ из истории? Это действие нельзя отменить.", () => {
      deleteOrder(order.id);
      window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred("error");
      navigate("/orders");
    });
  }, [order, confirmAction, deleteOrder, navigate]);

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-6 pb-nav">
        <span className="material-symbols-outlined text-7xl text-[var(--tg-theme-hint-color,#ddd)] mb-4">
          search_off
        </span>
        <h2 className="text-lg font-bold mb-1">Заказ не найден</h2>
        <p className="text-sm text-[var(--tg-theme-hint-color,#999)] mb-5">
          Возможно, он был удалён
        </p>
        <button
          onClick={() => navigate("/orders")}
          className="bg-[var(--tg-theme-button-color,#f472b6)] text-[var(--tg-theme-button-text-color,#fff)] font-bold text-sm px-6 py-2.5 rounded-xl active:scale-95 transition-transform"
        >
          К заказам
        </button>
      </div>
    );
  }

  const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
  const d = order.delivery;

  return (
    <div className="pb-nav min-h-screen animate-fade-in-up" style={{ background: "var(--tg-theme-bg-color,#fff)" }}>
      {/* Header */}
      <div className="px-4 pt-4 pb-2">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[20px] font-extrabold">
              Заказ №{order.id.toString().slice(-6)}
            </h1>
            <p className="text-[12px] text-[var(--tg-theme-hint-color,#999)] mt-0.5">
              {formatDate(order.date)}
            </p>
          </div>
          <div
            className="flex items-center gap-1 px-3 py-1.5 rounded-full text-[12px] font-bold shrink-0"
            style={{ background: cfg.bg, color: cfg.color }}
          >
            <span className="material-symbols-outlined text-[16px]" style={{ color: cfg.color }}>
              {cfg.icon}
            </span>
            {cfg.label}
          </div>
        </div>
      </div>

      {/* Items */}
      <div className="mx-3 mt-2 rounded-2xl overflow-hidden card-shadow" style={{ background: "var(--tg-theme-secondary-bg-color,#f9fafb)" }}>
        <div className="px-4 pt-3 pb-2">
          <h2 className="text-[13px] font-bold text-[var(--tg-theme-hint-color,#999)] uppercase tracking-wide">
            Товары
          </h2>
        </div>
        <div className="px-4 pb-3 space-y-2.5">
          {order.items.map((item, idx) => (
            <div key={idx} className="flex items-center gap-3">
              <img
                src={item.thumbnail}
                alt={item.title}
                className="w-14 h-14 rounded-xl object-cover shrink-0"
                onError={(e) => { e.target.style.display = "none"; }}
              />
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold leading-tight line-clamp-2">
                  {item.title}
                </p>
                <p className="text-[11px] text-[var(--tg-theme-hint-color,#999)] mt-0.5">
                  {formatPrice(item.price)} × {item.quantity}
                </p>
              </div>
              <span className="text-[14px] font-bold shrink-0">
                {formatPrice(item.price * item.quantity)}
              </span>
            </div>
          ))}
        </div>
        <div
          className="flex justify-between items-center px-4 py-3 border-t"
          style={{ borderColor: "var(--tg-theme-bg-color,#eee)" }}
        >
          <span className="text-[13px] text-[var(--tg-theme-hint-color,#999)]">Итого</span>
          <span className="text-[18px] font-extrabold">{formatPrice(order.totalPrice)}</span>
        </div>
      </div>

      {/* Delivery info */}
      {d && (
        <div className="mx-3 mt-3 rounded-2xl overflow-hidden card-shadow" style={{ background: "var(--tg-theme-secondary-bg-color,#f9fafb)" }}>
          <div className="px-4 pt-3 pb-2">
            <h2 className="text-[13px] font-bold text-[var(--tg-theme-hint-color,#999)] uppercase tracking-wide">
              {d.method === "delivery" ? "Доставка" : "Самовывоз"}
            </h2>
          </div>

          {d.method === "pickup" ? (
            <div className="px-4 pb-4">
              <div className="flex items-start gap-2.5">
                <span className="material-symbols-outlined text-[20px] text-[var(--tg-theme-button-color,#f472b6)] mt-0.5">
                  storefront
                </span>
                <p className="text-sm">Саратов, ул. Набережная, 22</p>
              </div>
            </div>
          ) : (
            <div className="px-4 pb-4 space-y-2.5">
              {d.address && (
                <InfoRow icon="location_on" label="Адрес" value={buildAddressLine(d)} />
              )}
              {d.date && (
                <InfoRow icon="calendar_today" label="Дата" value={formatDeliveryDate(d.date)} />
              )}
              {(d.timeFrom || d.timeTo) && (
                <InfoRow
                  icon="schedule"
                  label="Время"
                  value={`${d.timeFrom || "—"} – ${d.timeTo || "—"}`}
                />
              )}
              {d.recipient?.name && (
                <InfoRow
                  icon="person"
                  label="Получатель"
                  value={`${d.recipient.name}${d.recipient.phone ? `, ${d.recipient.phone}` : ""}`}
                />
              )}
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="px-4 mt-4 mb-6 space-y-2">
        <button
          onClick={handleRepeat}
          className="w-full bg-[var(--tg-theme-button-color,#f472b6)] text-[var(--tg-theme-button-text-color,#fff)] font-bold text-sm px-4 py-3 rounded-xl active:scale-95 transition-transform flex items-center justify-center gap-1.5"
        >
          <span className="material-symbols-outlined text-[18px]">shopping_bag</span>
          Повторить заказ
        </button>

        {order.status === "pending" && (
          <button
            onClick={handleCancel}
            className="w-full border border-[var(--tg-theme-button-color,#f472b6)] text-[var(--tg-theme-button-color,#f472b6)] font-bold text-sm px-4 py-3 rounded-xl active:scale-95 transition-transform flex items-center justify-center gap-1.5 bg-[var(--tg-theme-bg-color,#fff)]"
          >
            <span className="material-symbols-outlined text-[18px]">cancel</span>
            Отменить заказ
          </button>
        )}

        <button
          onClick={handleDelete}
          className="w-full border border-[rgba(239,68,68,0.7)] text-[rgba(239,68,68,1)] font-bold text-sm px-4 py-3 rounded-xl active:scale-95 transition-transform flex items-center justify-center gap-1.5 bg-[var(--tg-theme-bg-color,#fff)]"
        >
          <span className="material-symbols-outlined text-[18px]">delete</span>
          Удалить из истории
        </button>
      </div>
    </div>
  );
}

function InfoRow({ icon, label, value }) {
  return (
    <div className="flex items-start gap-2.5">
      <span className="material-symbols-outlined text-[20px] text-[var(--tg-theme-button-color,#f472b6)] mt-0.5 shrink-0">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-[11px] text-[var(--tg-theme-hint-color,#999)]">{label}</p>
        <p className="text-[13px] font-semibold break-words">{value}</p>
      </div>
    </div>
  );
}

function buildAddressLine(d) {
  let line = d.address;
  const parts = [];
  if (d.entrance) parts.push(`подъезд ${d.entrance}`);
  if (d.floor) parts.push(`этаж ${d.floor}`);
  if (d.apartment) parts.push(`кв. ${d.apartment}`);
  if (parts.length > 0) line += `, ${parts.join(", ")}`;
  return line;
}
