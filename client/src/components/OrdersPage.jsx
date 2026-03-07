import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useOrders } from "../context/OrdersContext";

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
};

function formatDate(isoString) {
  const d = new Date(isoString);
  return d.toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function OrderCard({ order }) {
  const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
  const total = Math.round(order.totalPrice).toLocaleString("ru-RU");
  const itemsPreview = order.items.slice(0, 3);
  const rest = order.items.length - itemsPreview.length;

  return (
    <div
      className="rounded-2xl overflow-hidden card-shadow animate-fade-in-up"
      style={{ background: "var(--tg-theme-secondary-bg-color,#f9fafb)" }}
    >
      {/* Header row */}
      <div className="flex items-center justify-between px-4 pt-3 pb-2">
        <div>
          <p className="text-[11px] text-[var(--tg-theme-hint-color,#999)]">
            {formatDate(order.date)}
          </p>
          <p className="text-[13px] font-semibold mt-0.5">
            Заказ №{order.id.toString().slice(-6)}
          </p>
        </div>
        <div
          className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold"
          style={{ background: cfg.bg, color: cfg.color }}
        >
          <span className="material-symbols-outlined text-[14px]" style={{ color: cfg.color }}>
            {cfg.icon}
          </span>
          {cfg.label}
        </div>
      </div>

      {/* Items thumbnails */}
      <div className="px-4 pb-2 flex gap-2 items-center">
        {itemsPreview.map((item, idx) => (
          <div key={idx} className="relative shrink-0">
            <img
              src={item.thumbnail}
              alt={item.title}
              className="w-12 h-12 rounded-xl object-cover"
              onError={(e) => { e.target.style.display = "none"; }}
            />
            {item.quantity > 1 && (
              <span className="absolute -top-1 -right-1 min-w-[16px] h-[16px] bg-[var(--tg-theme-button-color,#f472b6)] text-white text-[9px] font-bold rounded-full flex items-center justify-center px-0.5">
                {item.quantity}
              </span>
            )}
          </div>
        ))}
        {rest > 0 && (
          <div className="w-12 h-12 rounded-xl flex items-center justify-center text-[12px] font-bold text-[var(--tg-theme-hint-color,#999)]"
            style={{ background: "var(--tg-theme-bg-color,#fff)" }}>
            +{rest}
          </div>
        )}
      </div>

      {/* Items list (compact) */}
      <div className="px-4 pb-2 space-y-0.5">
        {order.items.map((item, idx) => (
          <div key={idx} className="flex justify-between text-[12px]">
            <span className="text-[var(--tg-theme-text-color,#333)] truncate max-w-[65%]">
              {item.title}
              <span className="text-[var(--tg-theme-hint-color,#999)] ml-1">×{item.quantity}</span>
            </span>
            <span className="font-semibold shrink-0">
              {Math.round(item.price * item.quantity).toLocaleString("ru-RU")} ₽
            </span>
          </div>
        ))}
      </div>

      {/* Footer total */}
      <div
        className="flex justify-between items-center px-4 py-3 border-t"
        style={{ borderColor: "var(--tg-theme-bg-color,#eee)" }}
      >
        <span className="text-[12px] text-[var(--tg-theme-hint-color,#999)]">Итого</span>
        <span className="text-[16px] font-extrabold">{total} ₽</span>
      </div>
    </div>
  );
}

export default function OrdersPage() {
  const { orders } = useOrders();
  const navigate = useNavigate();

  useEffect(() => {
    const handleBack = () => {
      navigate("/");
      window.Telegram?.WebApp?.BackButton?.hide();
    };
    window.Telegram?.WebApp?.BackButton?.onClick(handleBack);
    window.Telegram?.WebApp?.BackButton?.show();
    return () => {
      window.Telegram?.WebApp?.BackButton?.offClick(handleBack);
    };
  }, [navigate]);

  const tgUser = window.Telegram?.WebApp?.initDataUnsafe?.user;

  return (
    <div className="pb-nav min-h-screen" style={{ background: "var(--tg-theme-bg-color,#fff)" }}>
      {/* Header with user info */}
      <div className="px-4 pt-4 pb-3">
        {tgUser && (
          <div className="flex items-center gap-3 mb-4 p-3 rounded-2xl"
            style={{ background: "var(--tg-theme-secondary-bg-color,#f9fafb)" }}>
            {tgUser.photo_url ? (
              <img
                src={tgUser.photo_url}
                alt={tgUser.first_name}
                className="w-12 h-12 rounded-full object-cover ring-2 ring-[var(--tg-theme-button-color,#f472b6)] ring-offset-1 ring-offset-[var(--tg-theme-secondary-bg-color,#f9fafb)]"
              />
            ) : (
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-[20px] shrink-0"
                style={{ background: "var(--tg-theme-button-color,#f472b6)" }}
              >
                {(tgUser.first_name?.[0] || "?").toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <p className="font-bold text-[15px] truncate">
                {tgUser.first_name}{tgUser.last_name ? ` ${tgUser.last_name}` : ""}
              </p>
              {tgUser.username && (
                <p className="text-[12px] text-[var(--tg-theme-hint-color,#999)] truncate">
                  @{tgUser.username}
                </p>
              )}
            </div>
          </div>
        )}

        <h1 className="text-[22px] font-extrabold animate-fade-in-up">История заказов</h1>
        <p className="text-[13px] text-[var(--tg-theme-hint-color,#999)] mt-0.5 animate-fade-in-up">
          {orders.length > 0
            ? `${orders.length} ${formatOrdersWord(orders.length)}`
            : "Пока заказов нет"}
        </p>
      </div>

      {orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center px-6">
          <span className="material-symbols-outlined text-7xl text-[var(--tg-theme-hint-color,#ddd)] mb-4">
            receipt_long
          </span>
          <h2 className="text-lg font-bold mb-1">Заказов пока нет</h2>
          <p className="text-sm text-[var(--tg-theme-hint-color,#999)] mb-5">
            После оформления покупки здесь появится история
          </p>
          <button
            onClick={() => navigate("/")}
            className="bg-[var(--tg-theme-button-color,#f472b6)] text-[var(--tg-theme-button-text-color,#fff)] font-bold text-sm px-6 py-2.5 rounded-xl active:scale-95 transition-transform"
          >
            Перейти в каталог
          </button>
        </div>
      ) : (
        <div className="px-3 space-y-3">
          {orders.map((order, idx) => (
            <div key={order.id} style={{ animationDelay: `${idx * 0.04}s` }}>
              <OrderCard order={order} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function formatOrdersWord(count) {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod100 >= 11 && mod100 <= 19) return "заказов";
  if (mod10 === 1) return "заказ";
  if (mod10 >= 2 && mod10 <= 4) return "заказа";
  return "заказов";
}
