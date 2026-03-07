import { useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useOrders } from "../context/OrdersContext";
import { getInvoiceLink } from "../API/payment";
import getFinalPrice from "../utils/getFinalPrice";

export default function CartPage() {
  const { items, updateQuantity, removeFromCart, clearCart, totalPrice } = useCart();
  const { addOrder, markOrderPaid, markOrderFailed } = useOrders();
  const navigate = useNavigate();
  const pendingOrderId = useRef(null);

  const handlePay = useCallback(async () => {
    if (items.length === 0) return;
    window.Telegram?.WebApp?.HapticFeedback?.impactOccurred("heavy");

    const cartItems = items.map((i) => ({
      productId: i.product.id,
      title: i.product.title,
      thumbnail: i.product.thumbnail,
      quantity: i.quantity,
      price: parseFloat(getFinalPrice(i.product, 1)),
    }));

    const order = addOrder({ items: cartItems, totalPrice, status: "pending" });
    pendingOrderId.current = order.id;

    const body = {
      title: "Заказ из магазина",
      description: cartItems.map((c) => `${c.title} x${c.quantity}`).join(", "),
      items: cartItems,
      amount: Math.round(totalPrice * 100) / 100,
      payload: JSON.stringify({ orderId: order.id, items: cartItems }),
    };

    try {
      const data = await getInvoiceLink({ body });
      if (data.success && data.url) {
        window.Telegram?.WebApp?.openInvoice(data.url, (status) => {
          if (status === "paid") {
            if (pendingOrderId.current) markOrderPaid(pendingOrderId.current);
            clearCart();
            window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred("success");
          } else if (status === "cancelled" || status === "failed") {
            if (pendingOrderId.current) markOrderFailed(pendingOrderId.current);
          }
          pendingOrderId.current = null;
        });
      } else {
        markOrderFailed(order.id);
        pendingOrderId.current = null;
      }
    } catch (err) {
      console.error("Payment error:", err);
      if (pendingOrderId.current) markOrderFailed(pendingOrderId.current);
      pendingOrderId.current = null;
    }
  }, [items, totalPrice, clearCart, addOrder, markOrderPaid, markOrderFailed]);

  useEffect(() => {
    if (items.length > 0) {
      const text = `Оплатить ${Math.round(totalPrice).toLocaleString("ru-RU")} ₽`;
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

      <div className="mx-3 mt-4 p-4 rounded-2xl bg-[var(--tg-theme-secondary-bg-color,#f9fafb)] card-shadow">
        <div className="flex justify-between items-center">
          <span className="text-sm text-[var(--tg-theme-hint-color,#999)]">Итого</span>
          <span className="text-xl font-extrabold">
            {Math.round(totalPrice).toLocaleString("ru-RU")} ₽
          </span>
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
        <p className="text-[15px] font-extrabold mt-1">
          {Math.round(itemTotal).toLocaleString("ru-RU")} ₽
        </p>
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
