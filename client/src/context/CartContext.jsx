import { createContext, useContext, useReducer, useEffect, useMemo } from "react";

const CartContext = createContext(null);

const STORAGE_KEY = "tg-shop-cart";

function loadCart() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function cartReducer(items, action) {
  switch (action.type) {
    case "ADD": {
      const idx = items.findIndex((i) => i.product.id === action.product.id);
      if (idx >= 0) {
        return items.map((item, i) =>
          i === idx ? { ...item, quantity: item.quantity + (action.qty || 1) } : item
        );
      }
      return [...items, { product: action.product, quantity: action.qty || 1 }];
    }
    case "REMOVE":
      return items.filter((i) => i.product.id !== action.productId);
    case "UPDATE_QTY": {
      if (action.qty < 1) return items.filter((i) => i.product.id !== action.productId);
      return items.map((i) =>
        i.product.id === action.productId ? { ...i, quantity: action.qty } : i
      );
    }
    case "CLEAR":
      return [];
    default:
      return items;
  }
}

export function CartProvider({ children }) {
  const [items, dispatch] = useReducer(cartReducer, null, loadCart);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const addToCart = (product, qty = 1) => dispatch({ type: "ADD", product, qty });
  const removeFromCart = (productId) => dispatch({ type: "REMOVE", productId });
  const updateQuantity = (productId, qty) => dispatch({ type: "UPDATE_QTY", productId, qty });
  const clearCart = () => dispatch({ type: "CLEAR" });

  const totalItems = useMemo(() => items.reduce((sum, i) => sum + i.quantity, 0), [items]);
  const totalPrice = useMemo(
    () =>
      items.reduce((sum, i) => {
        const { price, discountPercentage } = i.product;
        const discount = (price / 100) * discountPercentage;
        return sum + (price - discount) * i.quantity;
      }, 0),
    [items]
  );

  const getItemQty = (productId) => {
    const item = items.find((i) => i.product.id === productId);
    return item ? item.quantity : 0;
  };

  const value = useMemo(
    () => ({ items, addToCart, removeFromCart, updateQuantity, clearCart, totalItems, totalPrice, getItemQty }),
    [items, totalItems, totalPrice]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
