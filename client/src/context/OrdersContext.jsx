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

  const addOrder = useCallback(({ items, totalPrice, status = "pending" }) => {
    const order = {
      id: Date.now(),
      date: new Date().toISOString(),
      items,
      totalPrice,
      status, // "paid" | "pending" | "failed"
    };
    setOrders((prev) => [order, ...prev]);
    return order;
  }, []);

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

  const value = useMemo(
    () => ({ orders, addOrder, markOrderPaid, markOrderFailed }),
    [orders, addOrder, markOrderPaid, markOrderFailed]
  );

  return <OrdersContext.Provider value={value}>{children}</OrdersContext.Provider>;
}

export function useOrders() {
  const ctx = useContext(OrdersContext);
  if (!ctx) throw new Error("useOrders must be used within OrdersProvider");
  return ctx;
}
