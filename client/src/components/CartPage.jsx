import { useEffect, useCallback, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useOrders } from "../context/OrdersContext";
import { getInvoiceLink, getPaymentStatus } from "../API/payment";
import getFinalPrice from "../utils/getFinalPrice";
import formatPrice from "../utils/formatPrice";

export default function CartPage() {
  const { items, updateQuantity, removeFromCart, clearCart, totalPrice } = useCart();
  const { addOrder, markOrderPaid, markOrderFailed } = useOrders();
  const navigate = useNavigate();
  const pendingOrderId = useRef(null);

  const [deliveryMethod, setDeliveryMethod] = useState("delivery");
  const [address, setAddress] = useState("");
  const [entrance, setEntrance] = useState("");
  const [floor, setFloor] = useState("");
  const [apartment, setApartment] = useState("");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [deliveryTimeFrom, setDeliveryTimeFrom] = useState("");
  const [deliveryTimeTo, setDeliveryTimeTo] = useState("");
  const [isRecipientOther, setIsRecipientOther] = useState(false);
  const [recipientName, setRecipientName] = useState("");
  const [recipientPhone, setRecipientPhone] = useState("");

  const deliveryRef = useRef(null);
  const markOrderPaidRef = useRef(markOrderPaid);
  const markOrderFailedRef = useRef(markOrderFailed);
  const navigateRef = useRef(navigate);
  markOrderPaidRef.current = markOrderPaid;
  markOrderFailedRef.current = markOrderFailed;
  navigateRef.current = navigate;

  const deliveryData = {
    method: deliveryMethod,
    ...(deliveryMethod === "delivery" && {
      address,
      entrance,
      floor,
      apartment,
      date: deliveryDate,
      timeFrom: deliveryTimeFrom,
      timeTo: deliveryTimeTo,
      recipient: isRecipientOther
        ? { name: recipientName, phone: recipientPhone }
        : null,
    }),
  };
  deliveryRef.current = deliveryData;

  const handlePay = useCallback(async () => {
    if (items.length === 0) return;
    if (pendingOrderId.current) return;

    const delivery = deliveryRef.current;
    if (delivery.method === "delivery") {
      if (!delivery.address?.trim()) {
        window.Telegram?.WebApp?.showAlert?.("Укажите адрес доставки");
        return;
      }
      if (!delivery.date) {
        window.Telegram?.WebApp?.showAlert?.("Укажите дату доставки");
        return;
      }
    }

    window.Telegram?.WebApp?.MainButton?.showProgress?.(false);
    window.Telegram?.WebApp?.MainButton?.disable?.();
    window.Telegram?.WebApp?.HapticFeedback?.impactOccurred("heavy");

    const cartItems = items.map((i) => ({
      productId: i.product.id,
      title: i.product.title,
      thumbnail: i.product.thumbnail,
      quantity: i.quantity,
      price: parseFloat(getFinalPrice(i.product, 1)),
    }));

    const tempId = Date.now();
    const desc = cartItems.map((c) => `${c.title} x${c.quantity}`).join(", ");
    const body = {
      title: "Заказ из магазина",
      description: desc.length > 255 ? desc.slice(0, 252) + "..." : desc,
      items: cartItems,
      amount: Math.round(totalPrice * 100) / 100,
      payload: String(tempId),
      delivery,
    };

    try {
      const data = await getInvoiceLink({ body });

      window.Telegram?.WebApp?.MainButton?.hideProgress?.();
      window.Telegram?.WebApp?.MainButton?.enable?.();

      if (data.success && data.url) {
        const order = addOrder({
          id: tempId,
          payload: String(tempId),
          items: cartItems,
          totalPrice,
          status: "pending",
          delivery,
        });
        const oid = order.id;
        const payloadStr = String(tempId);
        pendingOrderId.current = oid;
        let handled = false;
        let pollTimer = null;

        const applyInvoiceResult = (invoiceStatus) => {
          if (handled) return;

          // Финализируем только при явном результате, игнорируем промежуточные/неизвестные статусы
          if (invoiceStatus === "paid") {
            handled = true;
            if (pollTimer) clearInterval(pollTimer);
            markOrderPaidRef.current(oid);
            clearCart();
            window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred("success");
            navigateRef.current(`/orders/${oid}`);
            pendingOrderId.current = null;
          } else if (invoiceStatus === "cancelled" || invoiceStatus === "failed") {
            handled = true;
            if (pollTimer) clearInterval(pollTimer);
            markOrderFailedRef.current(oid);
            pendingOrderId.current = null;
          }
          // Для статусов вроде "pending" ничего не делаем — ждём опроса / окончательного статуса
        };

        // Polling fallback: проверяем статус на сервере каждые 2 сек (до 60 сек)
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
          window.Telegram?.WebApp?.offEvent("invoiceClosed", handleInvoiceClosed);
          applyInvoiceResult(invoiceStatus);
        };
        window.Telegram?.WebApp?.onEvent("invoiceClosed", handleInvoiceClosed);

        window.Telegram?.WebApp?.openInvoice(data.url, (invoiceStatus) => {
          window.Telegram?.WebApp?.offEvent("invoiceClosed", handleInvoiceClosed);
          applyInvoiceResult(invoiceStatus);
        });
      } else {
        console.error("Invoice link failed:", data);
        window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred("error");
        const detail = data?.error || "Неизвестная ошибка";
        window.Telegram?.WebApp?.showAlert?.(
          `Не удалось создать платёж: ${detail}`
        );
      }
    } catch (err) {
      console.error("Payment error:", err);
      window.Telegram?.WebApp?.MainButton?.hideProgress?.();
      window.Telegram?.WebApp?.MainButton?.enable?.();
      window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred("error");
      window.Telegram?.WebApp?.showAlert?.(
        `Ошибка при оплате: ${err.message || "Проверьте соединение"}`
      );
      pendingOrderId.current = null;
    }
  }, [items, totalPrice, clearCart, addOrder]);

  useEffect(() => {
    if (items.length > 0) {
      const text = `Оплатить ${formatPrice(totalPrice)}`;
      window.Telegram?.WebApp?.MainButton?.setParams({
        text,
        color: window.Telegram?.WebApp?.themeParams?.button_color || "#f472b6",
        text_color: window.Telegram?.WebApp?.themeParams?.button_text_color || "#ffffff",
      });
      window.Telegram?.WebApp?.MainButton?.show();
    } else {
      window.Telegram?.WebApp?.MainButton?.hide();
    }

    window.Telegram?.WebApp?.onEvent("mainButtonClicked", handlePay);
    return () => {
      window.Telegram?.WebApp?.MainButton?.hide();
      window.Telegram?.WebApp?.offEvent("mainButtonClicked", handlePay);
    };
  }, [handlePay, items.length, totalPrice]);

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

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-6 pb-nav">
        <span className="material-symbols-outlined text-7xl text-[var(--tg-theme-hint-color,#ddd)] mb-4">
          shopping_cart
        </span>
        <h2 className="text-lg font-bold mb-1">Корзина пуста</h2>
        <p className="text-sm text-[var(--tg-theme-hint-color,#999)] mb-5">
          Добавьте товары из каталога
        </p>
        <button
          onClick={() => navigate("/")}
          className="bg-[var(--tg-theme-button-color,#f472b6)] text-[var(--tg-theme-button-text-color,#fff)] font-bold text-sm px-6 py-2.5 rounded-xl active:scale-95 transition-transform"
        >
          Перейти в каталог
        </button>
      </div>
    );
  }

  return (
    <div className="pb-nav animate-fade-in-up">
      <div className="px-4 pt-4 pb-2">
        <h1 className="text-[22px] font-extrabold">Корзина</h1>
        <p className="text-[13px] text-[var(--tg-theme-hint-color,#999)] mt-0.5">
          {items.length} {formatItemsWord(items.length)}
        </p>
      </div>

      <div className="px-3 space-y-2">
        {items.map((item) => (
          <CartItem
            key={item.product.id}
            item={item}
            onUpdateQty={(qty) => updateQuantity(item.product.id, qty)}
            onRemove={() => {
              removeFromCart(item.product.id);
              window.Telegram?.WebApp?.HapticFeedback?.impactOccurred("light");
            }}
          />
        ))}
      </div>

      {/* Способ получения */}
      <div className="mx-3 mt-4 p-4 rounded-2xl bg-[var(--tg-theme-secondary-bg-color,#f9fafb)] card-shadow">
        <h2 className="text-[15px] font-bold mb-3">Способ получения</h2>
        <label className="flex items-center gap-3 mb-2.5 cursor-pointer">
          <input
            type="radio"
            name="deliveryMethod"
            value="delivery"
            checked={deliveryMethod === "delivery"}
            onChange={() => setDeliveryMethod("delivery")}
            className="w-[18px] h-[18px] accent-[var(--tg-theme-button-color,#f472b6)]"
          />
          <span className="text-sm">Доставка</span>
        </label>
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="radio"
            name="deliveryMethod"
            value="pickup"
            checked={deliveryMethod === "pickup"}
            onChange={() => setDeliveryMethod("pickup")}
            className="w-[18px] h-[18px] accent-[var(--tg-theme-button-color,#f472b6)]"
          />
          <span className="text-sm">Самовывоз (Саратов, ул. Набережная, 22)</span>
        </label>
      </div>

      {/* Поля доставки */}
      {deliveryMethod === "delivery" && (
        <div className="mx-3 mt-3 p-4 rounded-2xl bg-[var(--tg-theme-secondary-bg-color,#f9fafb)] card-shadow">
          <h2 className="text-[15px] font-bold mb-3">Доставка</h2>

          <div className="mb-3">
            <label className="text-xs text-[var(--tg-theme-hint-color,#999)] mb-1 block font-semibold">
              Дата доставки
            </label>
            <input
              type="date"
              value={deliveryDate}
              onChange={(e) => setDeliveryDate(e.target.value)}
              className="w-full p-3 rounded-xl border border-[var(--tg-theme-secondary-bg-color,#eee)] bg-[var(--tg-theme-bg-color,#fff)] text-sm outline-none"
            />
          </div>

          <div className="mb-3">
            <label className="text-xs text-[var(--tg-theme-hint-color,#999)] mb-1 block font-semibold">
              Интервал доставки (1 час)
            </label>
            <div className="flex gap-2 items-center">
              <div className="flex-1 relative">
                <input
                  type="time"
                  value={deliveryTimeFrom}
                  onChange={(e) => setDeliveryTimeFrom(e.target.value)}
                  className="w-full p-3 rounded-xl border border-[var(--tg-theme-secondary-bg-color,#eee)] bg-[var(--tg-theme-bg-color,#fff)] text-sm outline-none"
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[11px] text-[var(--tg-theme-hint-color,#999)] pointer-events-none" style={{ display: deliveryTimeFrom ? "none" : undefined }}>
                  с
                </span>
              </div>
              <span className="text-xs text-[var(--tg-theme-hint-color,#999)] shrink-0">до</span>
              <div className="flex-1 relative">
                <input
                  type="time"
                  value={deliveryTimeTo}
                  onChange={(e) => setDeliveryTimeTo(e.target.value)}
                  className="w-full p-3 rounded-xl border border-[var(--tg-theme-secondary-bg-color,#eee)] bg-[var(--tg-theme-bg-color,#fff)] text-sm outline-none"
                />
              </div>
            </div>
          </div>

          <div className="mb-3">
            <label className="text-xs text-[var(--tg-theme-hint-color,#999)] mb-1 block font-semibold">
              Адрес доставки
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Введите адрес доставки"
              className="w-full p-3 rounded-xl border border-[var(--tg-theme-secondary-bg-color,#eee)] bg-[var(--tg-theme-bg-color,#fff)] text-sm outline-none"
            />
          </div>

          <div className="flex gap-3 mb-3">
            <div className="flex-1">
              <label className="text-xs text-[var(--tg-theme-hint-color,#999)] mb-1 block font-semibold">
                Подъезд
              </label>
              <input
                type="text"
                value={entrance}
                onChange={(e) => setEntrance(e.target.value)}
                className="w-full p-3 rounded-xl border border-[var(--tg-theme-secondary-bg-color,#eee)] bg-[var(--tg-theme-bg-color,#fff)] text-sm outline-none"
              />
            </div>
            <div className="flex-1">
              <label className="text-xs text-[var(--tg-theme-hint-color,#999)] mb-1 block font-semibold">
                Этаж
              </label>
              <input
                type="text"
                value={floor}
                onChange={(e) => setFloor(e.target.value)}
                className="w-full p-3 rounded-xl border border-[var(--tg-theme-secondary-bg-color,#eee)] bg-[var(--tg-theme-bg-color,#fff)] text-sm outline-none"
              />
            </div>
            <div className="flex-1">
              <label className="text-xs text-[var(--tg-theme-hint-color,#999)] mb-1 block font-semibold">
                Кв.
              </label>
              <input
                type="text"
                value={apartment}
                onChange={(e) => setApartment(e.target.value)}
                className="w-full p-3 rounded-xl border border-[var(--tg-theme-secondary-bg-color,#eee)] bg-[var(--tg-theme-bg-color,#fff)] text-sm outline-none"
              />
            </div>
          </div>

          <label className="flex items-center gap-2.5 cursor-pointer mb-1">
            <input
              type="checkbox"
              checked={isRecipientOther}
              onChange={(e) => setIsRecipientOther(e.target.checked)}
              className="w-[18px] h-[18px] accent-[var(--tg-theme-button-color,#f472b6)]"
            />
            <span className="text-sm">Получатель — другой человек</span>
          </label>

          {isRecipientOther && (
            <div className="mt-3 space-y-3">
              <input
                type="text"
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                placeholder="Имя получателя"
                className="w-full p-3 rounded-xl border border-[var(--tg-theme-secondary-bg-color,#eee)] bg-[var(--tg-theme-bg-color,#fff)] text-sm outline-none"
              />
              <input
                type="tel"
                value={recipientPhone}
                onChange={(e) => setRecipientPhone(e.target.value)}
                placeholder="Телефон получателя"
                className="w-full p-3 rounded-xl border border-[var(--tg-theme-secondary-bg-color,#eee)] bg-[var(--tg-theme-bg-color,#fff)] text-sm outline-none"
              />
            </div>
          )}
        </div>
      )}

      <div className="mx-3 mt-4 p-4 rounded-2xl bg-[var(--tg-theme-secondary-bg-color,#f9fafb)] card-shadow">
        <div className="flex justify-between items-center">
          <span className="text-sm text-[var(--tg-theme-hint-color,#999)]">Итого</span>
          <span className="text-xl font-extrabold">{formatPrice(totalPrice)}</span>
        </div>
      </div>
    </div>
  );
}

function CartItem({ item, onUpdateQty, onRemove }) {
  const { product, quantity } = item;
  const itemTotal = parseFloat(getFinalPrice(product, quantity));

  return (
    <div className="flex items-center gap-3 p-3 rounded-2xl bg-[var(--tg-theme-secondary-bg-color,#f9fafb)] card-shadow">
      <img
        src={product.thumbnail}
        alt={product.title}
        className="w-16 h-16 rounded-xl object-cover shrink-0"
      />

      <div className="flex-1 min-w-0">
        <h3 className="text-[13px] font-semibold leading-tight line-clamp-2">{product.title}</h3>
        <p className="text-[15px] font-extrabold mt-1">{formatPrice(itemTotal)}</p>
      </div>

      <div className="flex flex-col items-end gap-1.5 shrink-0">
        <button
          onClick={onRemove}
          className="w-7 h-7 flex items-center justify-center rounded-full text-[var(--tg-theme-hint-color,#999)] active:bg-[rgba(0,0,0,0.05)] transition-colors"
        >
          <span className="material-symbols-outlined text-[18px]">close</span>
        </button>

        <div className="flex items-center bg-[var(--tg-theme-bg-color,#fff)] rounded-lg overflow-hidden border border-[var(--tg-theme-secondary-bg-color,#eee)]">
          <button
            onClick={() => onUpdateQty(quantity - 1)}
            className="w-8 h-8 flex items-center justify-center text-sm font-bold text-[var(--tg-theme-hint-color,#999)] active:bg-[rgba(0,0,0,0.05)]"
          >
            −
          </button>
          <span className="w-7 text-center text-sm font-bold">{quantity}</span>
          <button
            onClick={() => onUpdateQty(quantity + 1)}
            className="w-8 h-8 flex items-center justify-center text-sm font-bold text-[var(--tg-theme-text-color,#333)] active:bg-[rgba(0,0,0,0.05)]"
          >
            +
          </button>
        </div>
      </div>
    </div>
  );
}

function formatItemsWord(count) {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod100 >= 11 && mod100 <= 19) return "товаров";
  if (mod10 === 1) return "товар";
  if (mod10 >= 2 && mod10 <= 4) return "товара";
  return "товаров";
}
