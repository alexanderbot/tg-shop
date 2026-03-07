import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CartProvider } from "./context/CartContext";
import { OrdersProvider } from "./context/OrdersContext";
import CatalogPage from "./components/CatalogPage";
import ProductPage from "./components/ProductPage";
import CartPage from "./components/CartPage";
import OrdersPage from "./components/OrdersPage";
import BottomNav from "./components/BottomNav";
import "./index.css";

export function App() {
  const tg = typeof window !== "undefined" ? window.Telegram?.WebApp : null;

  if (!tg) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <span className="material-symbols-outlined text-5xl text-gray-300 animate-pulse">
          shopping_bag
        </span>
      </div>
    );
  }

  if (!tg.initData) {
    return (
      <div className="p-6 min-h-screen flex flex-col items-center justify-center bg-[var(--tg-theme-bg-color)] text-[var(--tg-theme-text-color)] text-center">
        <span className="material-symbols-outlined text-6xl text-[var(--tg-theme-hint-color,#ccc)] mb-4">
          smartphone
        </span>
        <h1 className="text-lg font-bold mb-1">Откройте в Telegram</h1>
        <p className="text-sm text-[var(--tg-theme-hint-color,#999)]">
          Это приложение работает только внутри Telegram
        </p>
      </div>
    );
  }

  tg.ready();
  tg.expand();

  return (
    <OrdersProvider>
      <CartProvider>
        <BrowserRouter>
          <div className="min-h-screen bg-[var(--tg-theme-bg-color)]">
            <Routes>
              <Route path="/" element={<CatalogPage />} />
              <Route path="/product/:productId" element={<ProductPage />} />
              <Route path="/cart" element={<CartPage />} />
              <Route path="/orders" element={<OrdersPage />} />
            </Routes>
            <BottomNav />
          </div>
        </BrowserRouter>
      </CartProvider>
    </OrdersProvider>
  );
}
