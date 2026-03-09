import { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";

const OrdersContext = createContext(null);

const STORAGE_KEY = "tg-shop-orders";

function loadOrders() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function OrdersProvider({ children }) {
  const [orders, setOrders] = useState(loadOrders);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
  }, [orders]);

  const addOrder = useCallback(({ id, payload, items, totalPrice, status = "pending", delivery }) => {
    const finalId = id || Date.now();
    const order = {
      id: finalId,
      date: new Date().toISOString(),
      items,
      totalPrice,
      status,
      ...(payload && { payload }),
      ...(delivery && { delivery }),
    };
    setOrders((prev) => [order, ...prev]);
    return order;
  }, []);

  // При каждом запуске приложения синхронизируем висящие pending‑заказы с сервером
  useEffect(() => {
    async function syncPending() {
      const { getPaymentStatus } = await import("../API/payment");
      setOrders((prev) => {
        // сначала просто вернём prev, обновление сделаем после проверки
        return prev;
      });
      const updated = [];
      for (const order of orders) {
        if (order.status !== "pending" || !order.payload) continue;
        try {
          const status = await getPaymentStatus(String(order.payload));
          if (status === "paid") {
            updated.push(order.id);
          }
        } catch {
          // ignore network errors
        }
      }
      if (updated.length) {
        setOrders((prev) =>
          prev.map((o) => (updated.includes(o.id) ? { ...o, status: "paid" } : o))
        );
      }
    }
    if (orders.length) {
      syncPending();
    }
  }, [orders, setOrders]);

  const markOrderPaid = useCallback((orderId) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: "paid" } : o))
    );
  }, []);

  const markOrderFailed = useCallback((orderId) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: "failed" } : o))
    );
  }, []);

  const cancelOrder = useCallback((orderId) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: "cancelled" } : o))
    );
  }, []);

  const deleteOrder = useCallback((orderId) => {
    setOrders((prev) => prev.filter((o) => o.id !== orderId));
  }, []);

  const value = useMemo(
    () => ({
      orders,
      addOrder,
      markOrderPaid,
      markOrderFailed,
      cancelOrder,
      deleteOrder,
    }),
    [orders, addOrder, markOrderPaid, markOrderFailed, cancelOrder, deleteOrder]
  );

  return <OrdersContext.Provider value={value}>{children}</OrdersContext.Provider>;
}

export function useOrders() {
  const ctx = useContext(OrdersContext);
  if (!ctx) throw new Error("useOrders must be used within OrdersProvider");
  return ctx;
}
