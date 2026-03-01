import Products from "./components/Products";
import { BrowserRouter, Routes, Link, Route } from "react-router-dom";
import "./index.css";
import ProductView from "./components/ProductView";

export function App() {
  const tg = typeof window !== "undefined" ? window.Telegram?.WebApp : null;

  if (!tg) {
    return (
      <div className="p-4 min-h-screen flex items-center justify-center bg-gray-100 text-gray-800">
        <p>Loading…</p>
      </div>
    );
  }

  if (!tg.initData) {
    return (
      <div className="p-4 min-h-screen bg-[var(--tg-theme-bg-color)] text-[var(--tg-theme-text-color)]">
        <h1 className="text-red-500">Oops! Telegram initData is missing!</h1>
        <p className="mt-2 opacity-80">
          This is a Telegram Mini App, content is only visible inside Telegram.
        </p>
      </div>
    );
  }

  return (
    <div className="app h-screen overflow-x-hidden">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Products />} />
          <Route path="/product/:productId" element={<ProductView />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}
