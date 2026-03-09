import { useEffect, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useOrders } from "../context/OrdersContext";
import { useCart } from "../context/CartContext";
import formatPrice from "../utils/formatPrice";
import { getInvoiceLink, getPaymentStatus } from "../API/payment";

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
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function OrderCard({ order, onClick, onRepeat, onCancel, onDelete, onPay }) {
  const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
  const total = formatPrice(order.totalPrice);
  const itemsPreview = order.items.slice(0, 3);
  const rest = order.items.length - itemsPreview.length;

  return (
    <div
      onClick={onClick}
      className="rounded-2xl overflow-hidden card-shadow animate-fade-in-up cursor-pointer active:scale-[0.98] transition-transform"
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
        <div className="flex items-center gap-1.5">
          <div
            className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold"
            style={{ background: cfg.bg, color: cfg.color }}
          >
            <span className="material-symbols-outlined text-[14px]" style={{ color: cfg.color }}>
              {cfg.icon}
            </span>
            {cfg.label}
          </div>
          {onDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="w-7 h-7 flex items-center justify-center rounded-full text-[var(--tg-theme-hint-color,#999)] active:bg-[rgba(0,0,0,0.05)] transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">delete</span>
            </button>
          )}
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
            <span className="font-semibold shrink-0">{formatPrice(item.price * item.quantity)}</span>
          </div>
        ))}
      </div>

      {/* Footer total */}
      <div
        className="flex justify-between items-center px-4 py-3 border-t"
        style={{ borderColor: "var(--tg-theme-bg-color,#eee)" }}
      >
        <span className="text-[12px] text-[var(--tg-theme-hint-color,#999)]">Итого</span>
        <div className="flex items-center gap-1.5">
          <span className="text-[16px] font-extrabold">{total}</span>
          <span className="material-symbols-outlined text-[18px] text-[var(--tg-theme-hint-color,#bbb)]">
            chevron_right
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="px-4 pt-2 pb-3 flex flex-wrap gap-1.5">
        {onPay && (order.status === "pending" || order.status === "failed") && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onPay();
            }}
            className="flex-1 min-w-[0] border border-[var(--tg-theme-button-color,#f472b6)] text-[var(--tg-theme-button-color,#f472b6)] font-bold text-[11px] px-3 py-2 rounded-xl active:scale-95 transition-transform flex items-center justify-center gap-1 bg-[var(--tg-theme-bg-color,#fff)]"
          >
            <span className="material-symbols-outlined text-[16px]">payments</span>
            Оплатить
          </button>
        )}

        {onRepeat && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRepeat();
            }}
            className="flex-1 min-w-[0] bg-[var(--tg-theme-button-color,#f472b6)] text-[var(--tg-theme-button-text-color,#fff)] font-bold text-[11px] px-3 py-2 rounded-xl active:scale-95 transition-transform flex items-center justify-center gap-1"
          >
            <span className="material-symbols-outlined text-[16px]">shopping_bag</span>
            Повторить
          </button>
        )}

        {onCancel && order.status === "pending" && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onCancel();
            }}
            className="flex-1 min-w-[0] border border-[var(--tg-theme-button-color,#f472b6)] text-[var(--tg-theme-button-color,#f472b6)] font-bold text-[11px] px-3 py-2 rounded-xl active:scale-95 transition-transform flex items-center justify-center gap-1 bg-[var(--tg-theme-bg-color,#fff)]"
          >
            <span className="material-symbols-outlined text-[16px]">cancel</span>
            Отменить
          </button>
        )}
      </div>
    </div>
  );
}

export default function OrdersPage() {
  const { orders, cancelOrder, deleteOrder, markOrderPaid, markOrderFailed } = useOrders();
  const { clearCart, addToCart } = useCart();
  const navigate = useNavigate();
  const location = useLocation();

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

  // Если открыли из кнопки "Открыть заказ" с payload в query — сразу переходим к этому заказу
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const payload = params.get("payload");
    if (!payload || !orders.length) return;

    const target = orders.find((o) => String(o.payload) === payload);
    if (target) {
      navigate(`/orders/${target.id}`, { replace: true });
    }
  }, [location.search, orders, navigate]);

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

  const handleRepeat = useCallback(
    (order) => {
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
    },
    [confirmAction, clearCart, addToCart, navigate]
  );

  const handleCancel = useCallback(
    (order) => {
      if (!order || order.status !== "pending") return;
      confirmAction('Отменить этот заказ? Его статус изменится на "Отменён".', () => {
        cancelOrder(order.id);
        window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred("warning");
      });
    },
    [confirmAction, cancelOrder]
  );

  const handleDelete = useCallback(
    (order) => {
      if (!order) return;
      confirmAction("Удалить этот заказ из истории? Это действие нельзя отменить.", () => {
        deleteOrder(order.id);
        window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred("error");
      });
    },
    [confirmAction, deleteOrder]
  );

  const handlePay = useCallback(
    (order) => {
      if (!order || (!order.payload && !order.id)) return;
      confirmAction("Открыть оплату для этого заказа?", async () => {
        const tg = window.Telegram?.WebApp;
        try {
          tg?.HapticFeedback?.impactOccurred("heavy");

          const desc = order.items
            .map((c) => `${c.title} x${c.quantity}`)
            .join(", ");

          const body = {
            title: "Заказ из магазина",
            description: desc.length > 255 ? desc.slice(0, 252) + "..." : desc,
            items: order.items,
            amount: Math.round(order.totalPrice * 100) / 100,
            payload: String(order.payload || order.id),
            delivery: order.delivery,
          };

          const data = await getInvoiceLink({ body });

          if (!data.success || !data.url) {
            console.error("Invoice link failed:", data);
            tg?.HapticFeedback?.notificationOccurred("error");
            const detail = data?.error || "Неизвестная ошибка";
            tg?.showAlert?.(`Не удалось открыть платёж: ${detail}`);
            return;
          }

          const payloadStr = String(order.payload || order.id);
          let handled = false;
          let pollTimer = null;

          const applyInvoiceResult = (invoiceStatus) => {
            if (handled) return;

            if (invoiceStatus === "paid") {
              handled = true;
              if (pollTimer) clearInterval(pollTimer);
              markOrderPaid(order.id);
              tg?.HapticFeedback?.notificationOccurred("success");
            } else if (invoiceStatus === "cancelled" || invoiceStatus === "failed") {
              handled = true;
              if (pollTimer) clearInterval(pollTimer);
              markOrderFailed(order.id);
            }
          };

          // Polling: проверяем статус на сервере каждые 2 сек (до 60 сек)
          let pollCount = 0;
          pollTimer = setInterval(async () => {
            pollCount++;
            if (pollCount > 30) {
              clearInterval(pollTimer);
              return;
            }
            try {
              const status = await getPaymentStatus(payloadStr);
              if (status === "paid") applyInvoiceResult("paid");
            } catch {
              // ignore network errors during polling
            }
          }, 2000);

          const handleInvoiceClosed = (eventData) => {
            const invoiceStatus = eventData?.status ?? eventData;
            tg?.offEvent("invoiceClosed", handleInvoiceClosed);
            applyInvoiceResult(invoiceStatus);
          };

          tg?.onEvent("invoiceClosed", handleInvoiceClosed);

          tg?.openInvoice(data.url, (invoiceStatus) => {
            tg?.offEvent("invoiceClosed", handleInvoiceClosed);
            applyInvoiceResult(invoiceStatus);
          });
        } catch (err) {
          console.error("Payment error:", err);
          const tg = window.Telegram?.WebApp;
          tg?.HapticFeedback?.notificationOccurred("error");
          tg?.showAlert?.(
            `Ошибка при оплате: ${err.message || "Проверьте соединение"}`
          );
        }
      });
    },
    [confirmAction, markOrderPaid, markOrderFailed]
  );

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
              <OrderCard
                order={order}
                onClick={() => navigate(`/orders/${order.id}`)}
                onRepeat={() => handleRepeat(order)}
                onCancel={order.status === "pending" ? () => handleCancel(order) : undefined}
                onDelete={() => handleDelete(order)}
                onPay={(order.status === "pending" || order.status === "failed") ? () => handlePay(order) : undefined}
              />
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
